
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export interface SparkleVoiceRef {
    triggerSpeak: (text?: string, key?: string) => void;
}

interface SparkleVoiceFabProps {
    onTagsExtracted: (tags: any) => void;
    className?: string;
    autoStart?: boolean;
    imageContext?: any; // Start sending context!
    accessCheck?: () => boolean; // New: Check permission (credits) before starting
}

const WELCOME_SCRIPTS = {
    'en-US': "Welcome to the Magic Lab! I'm Sparkle. To start the magic, please click the button to upload your drawing!",
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

    // Audio Context for Server TTS
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortAudioRef = useRef(false); // New flag to kill pending audio

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Stop all audio
    const stopEverything = () => {
        abortAudioRef.current = true; // Signal to abort any pending plays
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0; // Reset
            audioRef.current = null;
        }
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        triggerSpeak: (textOverride, scriptKey) => {
            stopEverything(); // Ensure clean slate
            abortAudioRef.current = false; // Reset flag for new speech

            const lang = 'en-US'; // Force English
            const key = 'en-US';
            let text = textOverride;

            if (!text && scriptKey === 'UPLOAD') {
                // @ts-ignore
                text = UPLOAD_SCRIPTS[key] || UPLOAD_SCRIPTS['en-US'];
            }

            if (text) {
                speak(text, key, () => {
                    // After greeting, maybe listen?
                    startListening();
                });
            }
        }
    }));

    useEffect(() => {
        // Auto-Start logic
        if (autoStart && !hasStarted) {
            setHasStarted(true);
            speakWelcome();
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            stopEverything();
        };
    }, [autoStart, hasStarted]);

    const speakWelcome = () => {
        // Detect Browser Language or Default to English
        // Always English
        const lang = 'en-US';
        const targetLang = 'en-US';
        const text = WELCOME_SCRIPTS['en-US'];

        // Speak welcome, but do NOT start listening immediately. 
        // We want the user to Upload the image first as per instruction.
        speak(text, targetLang);
    };

    const speak = async (text: string, lang: string, onEnd?: () => void) => {
        stopEverything(); // Priority: Stop previous speech
        abortAudioRef.current = false; // Allow this new speech

        // 1. Try Server TTS (Google Cloud via Backend) for "Emotional" Voice
        try {
            console.log("Sparkle: Fetching emotional voice...");
            const response = await fetch('/api/sparkle/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang })
            });

            if (abortAudioRef.current) return; // Abort if user interrupted during fetch

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                audioRef.current = audio;

                audio.onplay = () => {
                    setIsSpeaking(true);
                    window.speechSynthesis.cancel(); // Paranoia: Ensure browser TTS is dead
                };
                audio.onended = () => {
                    setIsSpeaking(false);
                    if (onEnd && !abortAudioRef.current) onEnd();
                    URL.revokeObjectURL(url);
                };

                if (!abortAudioRef.current) {
                    window.speechSynthesis.cancel(); // Cancel before play
                    audio.play().catch(e => console.warn("Audio play interrupted", e));
                }
                return; // Server TTS success - EXIT FUNCTION
            }
        } catch (e) {
            console.warn("Server TTS failed, falling back to Browser", e);
        }

        if (abortAudioRef.current) return; // Abort

        // 2. Fallback to Browser TTS
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;

        // Try to find a good voice
        const setVoice = () => {
            const voices = window.speechSynthesis.getVoices();
            console.log("Sparkle Voices available:", voices.length);

            // Priority: Google US -> Microsoft US -> Any US -> Any English
            let voice = voices.find(v => v.name === "Google US English");
            if (!voice) voice = voices.find(v => v.name.includes("Microsoft Zira") || v.name.includes("Microsoft David"));
            if (!voice) voice = voices.find(v => v.lang === 'en-US' && !v.name.includes("CN") && !v.name.includes("China"));
            if (!voice) voice = voices.find(v => v.lang.startsWith('en'));

            if (voice) {
                console.log("Selected Browser Voice:", voice.name);
                utterance.voice = voice;
            }

            if (!abortAudioRef.current) {
                window.speechSynthesis.speak(utterance);
            }
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = setVoice;
        } else {
            setVoice();
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            if (onEnd && !abortAudioRef.current) onEnd();
        };

        // Fallback for immediate state update
        if (!abortAudioRef.current) {
            setIsSpeaking(true);
        }
    };

    const startListening = async () => {
        // Interrupt generic speech if user forces listening
        stopEverything();

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn("Voice recognition not supported");
            alert("Your browser does not support voice recognition. Please try Chrome.");
            return;
        }

        // 1. Explicitly Request Microphone Permission FIRST
        try {
            console.log("Requesting microphone permission...");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // If successful, stop the tracks to release the stream (SpeechRecognition will open its own)
            // This step ensures the browser permission prompt appears if not already granted.
            stream.getTracks().forEach(track => track.stop());
            console.log("Microphone permission granted.");

        } catch (err) {
            console.error("Microphone access denied:", err);

            // HTTPS Check
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                alert("Error: Voice features require HTTPS. Please use a secure connection or localhost.");
            } else {
                alert("Please allow microphone access to talk to Sparkle! (Click the lock icon in your address bar)");
            }
            return; // Stop here
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; // Strict English Input
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsRecording(true);
            // Set Nudge Timeout (Increased to 8 seconds silence)
            timeoutRef.current = setTimeout(() => {
                recognition.stop();
                // Play Nudge
                // const lang = 'en-US'; 
                // @ts-ignore
                // const nudgeText = NUDGE_SCRIPTS['en-US'];
                // speak(nudgeText, lang, () => {}); 
                // Silent stop is better UX than repeated nudging sometimes, or just close mic.
                setIsRecording(false);
            }, 8000);
        };

        recognition.onresult = async (event: any) => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            const transcript = event.results[0][0].transcript;
            console.log("Sparkle Heard:", transcript);
            await handleChat(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Error:", event.error);

            if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                setIsRecording(false);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                alert("Microphone permission denied. Please enable it in your browser settings (Click the lock icon).");
            } else if (event.error === 'no-speech') {
                // User's Fix: Don't error immediately on silence. 
                // Instead, we can try to restart or just notify gently.
                // For now, let's NOT speak an error, just stop and maybe show a subtle visual cue or retry.
                console.log("No speech detected - effectively a timeout or low volume.");
                // Option: Auto-retry once?
                // For now, let's just close cleanly without scolding the user.
                setIsRecording(false);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                // speak("I didn't catch that. Tap to try again!", 'en-US'); // Gentle prompt
            } else {
                setIsRecording(false);
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                speak("Oh, connection issue. Please try again.", 'en-US');
            }
        };

        recognition.onend = () => {
            // If we just had 'no-speech', we're already handling it.
            // If it was a normal end, we just stop recording state.
            if (isRecording) { // If it ended unexpectedly
                setIsRecording(false);
            }
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };

        try {
            recognition.start();
        } catch (e) {
            console.error("Mic start failed", e);
            speak("I can't start the microphone.", 'en-US');
        }
    };

    const handleChat = async (text: string) => {
        setIsProcessing(true);
        try {
            const payload: any = {
                message: text,
                userId: user?.uid
            };
            if (imageContext) {
                payload.imageContext = imageContext;
            }

            const response = await fetch('/api/sparkle/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.tags) {
                onTagsExtracted(data.tags);
            }

            if (data.sparkleTalk) {
                speak(data.sparkleTalk, 'en-US', () => {
                    // After answering, listen again? 
                    // Usually yes for conversation
                    startListening();
                });
            }
        } catch (err) {
            console.error("Sparkle Error", err);
            speak("Oops, something went wrong. Can you say that again?", 'en-US');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <button
            onClick={() => {
                if (isSpeaking) {
                    if (audioRef.current) audioRef.current.pause();
                    window.speechSynthesis.cancel();
                    setIsSpeaking(false);
                } else if (isRecording) {
                    // Allow manual stop
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                    setIsRecording(false);
                    console.log("User manually stopped recording");
                } else {
                    // CHECK ACCESS BEFORE STARTING
                    if (accessCheck && !accessCheck()) {
                        return; // Blocked by parent (e.g. Low Credits)
                    }

                    if (!hasStarted) {
                        setHasStarted(true);
                        speakWelcome();
                    } else {
                        startListening();
                    }
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
                    {/* Ripple Effect for Recording */}
                    <div className="absolute inset-0 rounded-full border-4 border-white opacity-0 animate-ping"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-white opacity-0 animate-ping delay-75"></div>
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
