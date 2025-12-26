
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import hark from 'hark'; // Voice Activity Detection
import { playUiSound } from '../../utils/SoundSynth'; // Sound Effects

export interface SparkleVoiceRef {
    triggerSpeak: (text?: string, key?: string) => void;
    triggerAnalysis: (base64Image: string) => void;
}

interface SparkleVoiceFabProps {
    onTagsExtracted: (tags: any) => void;
    className?: string;
    autoStart?: boolean;
    imageContext?: any; // Now expects Base64 if meaningful, or just description
    accessCheck?: () => boolean;
}

const WELCOME_SCRIPTS = {
    'en-US': "Hi! I'm Sparkle. Upload your drawing, and I'll tell you what I see!",
};

const UPLOAD_SCRIPTS = {
    'en-US': "Wow! I see your picture! It looks amazing. Tell me, what did you draw?",
};

const NUDGE_SCRIPTS = {
    'en-US': "I'm waiting for your drawing! Or tell me what we should make!",
};

export const SparkleVoiceFab = forwardRef<SparkleVoiceRef, SparkleVoiceFabProps>(({ onTagsExtracted, className, autoStart, imageContext, accessCheck }, ref) => {
    const { user } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Refs for VAD and Audio
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortAudioRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // VAD Refs
    const streamRef = useRef<MediaStream | null>(null);
    const harkRef = useRef<any>(null);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef<string>('');

    // Stop all audio & recognition
    const stopEverything = () => {
        console.log("Sparkle: stopping everything.");
        abortAudioRef.current = true;

        // Stop Audio Playback
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        window.speechSynthesis.cancel();
        setIsSpeaking(false);

        // Stop VAD & Recognition
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (harkRef.current) {
            harkRef.current.stop();
            harkRef.current = null;
        }
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
            recognitionRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsRecording(false);
    };

    useImperativeHandle(ref, () => ({
        triggerSpeak: (textOverride, scriptKey) => {
            stopEverything();
            abortAudioRef.current = false;

            // Logic for 'UPLOAD' event
            if (scriptKey === 'UPLOAD') {
                const text = UPLOAD_SCRIPTS['en-US'];
                speak(text, 'en-US', () => startListening());
            } else if (textOverride) {
                speak(textOverride, 'en-US', () => startListening()); // Always listen after speak
            }
        },
        triggerAnalysis: (base64Image: string) => {
            console.log("Sparkle: Auto-Analyzing Image...");
            // Trigger chat with Image + Empty Text
            handleChat("", base64Image);
        }
    }));

    // Auto-Greeting on Mount (Singleton Pattern)
    const hasGreetedRef = useRef(false);

    useEffect(() => {
        // Strict Mode Protection: Only greet once per session
        if (!hasGreetedRef.current && !hasStarted) {
            hasGreetedRef.current = true;
            setHasStarted(true);
            playUiSound('pop');
            speakWelcome();
        }
        return () => stopEverything();
    }, []); // Empty deps to ensure only once

    const speakWelcome = () => {
        const text = WELCOME_SCRIPTS['en-US'];
        speak(text, 'en-US', () => {
            // User journey: "Auto listen after welcome"
            // check req: "播放完后自动开启麦克风监听 (开启 VAD)"
            startListening();
        });
    };

    const speak = async (text: string, lang: string, onEnd?: () => void) => {
        stopEverything();
        abortAudioRef.current = false;

        // Server TTS (OpenAI Nova)
        try {
            console.log("Sparkle: Speaking (Nova)...");
            const response = await fetch('/api/sparkle/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang })
            });

            if (abortAudioRef.current) return;

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onplay = () => setIsSpeaking(true);
                audio.onended = () => {
                    setIsSpeaking(false);
                    if (onEnd && !abortAudioRef.current) onEnd();
                    URL.revokeObjectURL(url);
                };

                audio.play().catch(e => console.warn("Audio play error", e));
                return;
            }
        } catch (e) {
            console.warn("TTS failed", e);
        }

        // Fallback Browser TTS
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEnd && !abortAudioRef.current) onEnd();
        };
        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    };

    const startListening = async () => {
        stopEverything();
        setIsRecording(true);
        transcriptRef.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Initialize Hark (VAD)
            // @ts-ignore
            const speechEvents = hark(stream, { threshold: -60, interval: 100 });
            harkRef.current = speechEvents;

            speechEvents.on('speaking', () => {
                console.log('VAD: Speaking...');
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
            });

            speechEvents.on('stopped_speaking', () => {
                console.log('VAD: Silence...');
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                // 1.5s Silence -> Submit
                timeoutRef.current = setTimeout(() => {
                    console.log('VAD: Auto-Submit!', transcriptRef.current);
                    stopAndSubmit();
                }, 1500);
            });

            // Initialize Recognition
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (e: any) => {
                let interim = '';
                let final = '';
                for (let i = e.resultIndex; i < e.results.length; ++i) {
                    if (e.results[i].isFinal) final += e.results[i][0].transcript;
                    else interim += e.results[i][0].transcript;
                }
                transcriptRef.current = final + interim; // Keep updating
            };

            recognition.onerror = (e: any) => {
                console.warn("Recognition error", e.error);
                if (e.error === 'not-allowed') stopEverything();
            };

            recognitionRef.current = recognition;
            recognition.start();

        } catch (e) {
            console.error("Mic Error", e);
            setIsRecording(false);
            speak("I can't hear you. Check your mic!", 'en-US');
        }
    };

    const stopAndSubmit = async () => {
        const text = transcriptRef.current;
        stopEverything(); // Stops mic, hark, streams

        if (!text || text.trim().length < 2) {
            console.log("No valid speech heard.");
            // Maybe nudge? "I didn't catch that."
            // For now, silent fail implies re-listen or idle.
            return;
        }

        await handleChat(text);
    };

    const handleChat = async (text: string, imageOverride?: string) => {
        // CRITICAL: Stop listening first to prevent stuck state
        stopEverything();

        setIsProcessing(true);
        try {
            // Send to Backend
            const payload: any = {
                message: text,
                userId: user?.uid,
                image: imageOverride || imageContext
            };

            const response = await fetch('/api/sparkle/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (data.tags) onTagsExtracted(data.tags);
            if (data.sparkleTalk) {
                speak(data.sparkleTalk, 'en-US', () => {
                    // Loop: Always listen after responding
                    startListening();
                });
            }

        } catch (err) {
            console.error("Chat Error", err);
            speak("My magic wand is glitching. One moment!", 'en-US');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <button
            onClick={() => {
                if (isSpeaking || isRecording) {
                    stopEverything();
                } else {
                    startListening();
                }
            }}
            className={cn(
                "fixed bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl z-50 flex items-center justify-center transition-all bg-gradient-to-br from-purple-500 to-pink-500",
                isRecording && "ring-4 ring-green-400 scale-110",
                isSpeaking && "animate-bounce scale-125 ring-4 ring-yellow-300",
                !isRecording && !isSpeaking && "hover:scale-110 animate-blob",
                isProcessing && "opacity-80 cursor-wait",
                className
            )}
        >
            {isProcessing ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : isRecording ? (
                <div className="flex flex-col items-center relative">
                    <div className="absolute inset-0 rounded-full border-4 border-white opacity-0 animate-ping"></div>
                    <Mic className="w-8 h-8 text-white relative z-10" />
                    <span className="text-[10px] uppercase font-bold text-white tracking-widest absolute -bottom-10 bg-red-500 px-3 py-1 rounded-full shadow-md whitespace-nowrap animate-bounce">Listening...</span>
                </div>
            ) : isSpeaking ? (
                <div className="text-3xl animate-pulse">🗣️</div>
            ) : (
                <div className="text-3xl">✨</div>
            )}
        </button>
    );
});

SparkleVoiceFab.displayName = "SparkleVoiceFab";
