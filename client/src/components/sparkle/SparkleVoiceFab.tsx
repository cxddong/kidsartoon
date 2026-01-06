
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Mic, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import hark from 'hark'; // Voice Activity Detection
import { playUiSound } from '../../utils/SoundSynth'; // Sound Effects

export interface SparkleVoiceRef {
    triggerSpeak: (text?: string, key?: string) => void;
    triggerAnalysis: (base64Image: string) => void;
    triggerChat: (text: string, options?: { stage?: string, userProfile?: any }) => void;
    resetConversation: () => void;
}

interface SparkleVoiceFabProps {
    onResponse?: (response: any) => void;
    voiceTier?: 'standard' | 'premium'; // NEW: Voice quality tier
    onTagsExtracted?: (tags: any) => void; // Made optional for backward compatibility
    className?: string;
    autoStart?: boolean;
    imageContext?: any; // Now expects Base64 if meaningful, or just description
    accessCheck?: () => boolean;
}



export const SparkleVoiceFab = forwardRef<SparkleVoiceRef, SparkleVoiceFabProps>((props, ref) => {
    const { onTagsExtracted, className, autoStart, imageContext, accessCheck, onResponse, voiceTier = 'standard' } = props;
    const { user } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    // Conversation History State
    const [conversationHistory, setConversationHistory] = useState<any[]>([]);

    // Track if image has been uploaded in this session
    const [hasUploadedImage, setHasUploadedImage] = useState<boolean>(false);

    // Refs for VAD and Audio
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortAudioRef = useRef(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasUploadedImageRef = useRef<boolean>(false);  // Track image upload state

    // VAD Refs
    const streamRef = useRef<MediaStream | null>(null);
    const harkRef = useRef<any>(null);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef<string>('');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // Stop all audio & recognition
    const stopEverything = () => {
        console.log("Magic Kat: stopping everything.");
        abortAudioRef.current = true;

        // Stop audio playback (handle both types)
        if (audioRef.current) {
            if (typeof (audioRef.current as any).stop === 'function') {
                // Web Audio API source
                (audioRef.current as any).stop();
            } else if (typeof (audioRef.current as any).pause === 'function') {
                // HTML Audio element
                (audioRef.current as any).pause();
                (audioRef.current as any).currentTime = 0;
            }
            audioRef.current = null; // Clear the ref after stopping
        }

        window.speechSynthesis.cancel();
        mediaRecorderRef.current?.stop(); // Stop MediaRecorder if active
        setIsRecording(false);
        setIsProcessing(false); // Set processing to false
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

            // All speech should come from AI responses, not hardcoded scripts
            if (textOverride) {
                speak(textOverride, 'en-US', () => startListening());
            }
        },
        triggerAnalysis: (base64Image: string) => {
            console.log("Magic Kat: Auto-Analyzing Image...");
            // Mark that image has been uploaded (using ref for immediate effect)
            hasUploadedImageRef.current = true;
            // DON'T reset history - we need to preserve context that image was uploaded!
            // Trigger chat with Image + Empty Text
            handleChat("", base64Image);
        },
        triggerChat: (text: string, options?: { stage?: string, userProfile?: any }) => {
            console.log("Magic Kat: Command Received:", text);
            handleChat(text, undefined, options);
        },
        resetConversation: () => {
            setConversationHistory([]);
        }
    }));

    // Auto-Start: Let AI greet naturally through OpenAI
    const hasGreetedRef = useRef(false);

    useEffect(() => {
        // Strict Mode Protection: Only greet once per session
        if (!hasGreetedRef.current && !hasStarted) {
            hasGreetedRef.current = true;
            setHasStarted(true);
            playUiSound('pop');

            // Start real AI conversation instead of hardcoded greeting
            setTimeout(() => {
                handleChat("Hello");
            }, 500);
        }
        return () => stopEverything();
    }, []); // Empty deps to ensure only once

    const speak = async (text: string, lang: string, onEnd?: () => void) => {
        stopEverything();
        abortAudioRef.current = false;

        // Server TTS (OpenAI Nova)
        try {
            // Choose endpoint based on voice tier
            const endpoint = voiceTier === 'premium' ? '/api/sparkle/speak-premium' : '/api/sparkle/speak';
            const userId = user?.uid;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    lang,
                    userId,
                    cacheKey: userId ? `tts_${userId}_${text.substring(0, 50).replace(/\s/g, '_')}` : undefined
                })
            });

            if (abortAudioRef.current) {
                console.log("Magic Kat: Aborted before audio");
                return;
            }

            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();

                // ✨✨✨ USE WEB AUDIO API FOR PITCH SHIFTING ✨✨✨
                try {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    const audioCtx = new AudioContextClass();
                    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

                    const source = audioCtx.createBufferSource();
                    source.buffer = audioBuffer;

                    // 🎵 PITCH SHIFT: Backend 1.15x + Frontend 1.1x = Cartoon Voice
                    source.playbackRate.value = 1.1;

                    source.onended = () => {
                        setIsSpeaking(false);
                        if (onEnd && !abortAudioRef.current) onEnd();
                        // Safe close: check state first
                        try {
                            if (audioCtx.state !== 'closed') {
                                audioCtx.close();
                            }
                        } catch (e) {
                            // AudioContext already closed, ignore
                        }
                    };

                    source.connect(audioCtx.destination);
                    setIsSpeaking(true);
                    source.start(0);

                    // Store for potential stop
                    audioRef.current = {
                        stop: () => {
                            try {
                                source.stop();
                                if (audioCtx.state !== 'closed') {
                                    audioCtx.close();
                                }
                            } catch (e) {
                                // Already stopped/closed
                            }
                        }
                    } as any;

                    console.log("Sparkle: Nova TTS playing with pitch shift 1.2x");
                    return; // ✅ CRITICAL: Stop here, don't fallback

                } catch (audioError) {
                    console.warn("Web Audio API failed, fallback to simple playback:", audioError);
                    // Fallback: simple Audio element
                    const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
                    const url = URL.createObjectURL(blob);
                    const audio = new Audio(url);
                    audioRef.current = audio;

                    audio.onplay = () => setIsSpeaking(true);
                    audio.onended = () => {
                        setIsSpeaking(false);
                        if (onEnd && !abortAudioRef.current) onEnd();
                        URL.revokeObjectURL(url);
                    };

                    await audio.play().catch(e => console.warn("Audio play error", e));
                }
                return;
            } else {
                console.warn("TTS response not OK:", response.status);
            }
        } catch (e) {
            console.warn("TTS fetch failed:", e);
        }

        // Fallback Browser TTS (only if server TTS failed)
        console.log("Sparkle: Falling back to Browser TTS");
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

    // Play Audio Buffer with Pitch Shift
    const playAudioBuffer = async (arrayBuffer: ArrayBuffer, onEnd?: () => void) => {
        stopEverything();
        abortAudioRef.current = false;
        setIsSpeaking(true);

        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();

            // Decode
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;

            // 🎵 PITCH SHIFT: Minimax is already cute, but let's keep it slight or 1.0 depending on voice
            // If voice is 'female-shaonv', it's already creating a character voice.
            // Let's set to 1.0 to respect the expensive model's quality, or 1.05 for slight energy.
            source.playbackRate.value = 1.0;

            source.onended = () => {
                setIsSpeaking(false);
                if (onEnd && !abortAudioRef.current) onEnd();
                // Safe close: check state first
                try {
                    if (audioCtx.state !== 'closed') {
                        audioCtx.close();
                    }
                } catch (e) {
                    // AudioContext already closed, ignore
                }
            };

            source.connect(audioCtx.destination);
            source.start(0);

            // Store for potential stop
            audioRef.current = {
                stop: () => {
                    try {
                        source.stop();
                        if (audioCtx.state !== 'closed') {
                            audioCtx.close();
                        }
                    } catch (e) {
                        // Already stopped/closed
                    }
                }
            } as any;

            console.log("Sparkle: Playing Minimax Audio");

        } catch (audioError) {
            console.warn("Web Audio API failed, fallback to blob:", audioError);
            const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onplay = () => setIsSpeaking(true);
            audio.onended = () => {
                setIsSpeaking(false);
                if (onEnd && !abortAudioRef.current) onEnd();
                URL.revokeObjectURL(url);
            };

            await audio.play().catch(e => console.warn("Audio play error", e));
        }
    };

    // Task ID to prevent race conditions (overlap of Welcome vs Analysis)
    const currentTaskId = useRef(0);

    /**
     * 🧠 HYBRID PIPELINE: Brain (OpenAI) + Mouth (Minimax)
     */
    const handleChat = async (text: string, imageOverride?: string, options?: { stage?: string, userProfile?: any }) => {
        // CRITICAL: Stop listening first to prevent stuck state
        stopEverything();

        // Start New Task
        const taskId = ++currentTaskId.current;
        console.log(`[Sparkle] Starting Task #${taskId}`);

        setIsProcessing(true); // "Thinking" State
        try {
            // Build new history entry
            const userMessage = text || "I just uploaded an image.";
            const newUserMessage = {
                role: 'user',
                parts: [{ text: userMessage }]
            };

            const updatedHistory = [...conversationHistory, newUserMessage];

            // 🧠 Step 2: Brain (OpenAI)
            const payload: any = {
                history: updatedHistory,
                message: text,
                userId: user?.uid,
                image: imageOverride || null,
                hasUploadedImage: hasUploadedImageRef.current || !!imageOverride  // Use ref value for immediate access
            };

            console.log("Magic Kat Brain: Thinking...", { hasUploadedImage: hasUploadedImageRef.current, hasCurrentImage: !!imageOverride });
            const response = await fetch('/api/sparkle/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // CHECK TASK ID
            if (taskId !== currentTaskId.current) { console.log(`Task #${taskId} aborted.`); return; }

            const data = await response.json();

            // CHECK TASK ID
            if (taskId !== currentTaskId.current) { console.log(`Task #${taskId} aborted.`); return; }

            // Pass full response to parent (not just tags)
            if (data && onTagsExtracted) onTagsExtracted(data);

            if (data.sparkleTalk) {
                // Add AI response to history
                const aiMessage = {
                    role: 'model',
                    parts: [{ text: data.sparkleTalk }]
                };
                setConversationHistory([...updatedHistory, aiMessage]);

                // 👄 Step 3: Mouth (Minimax)
                console.log("Magic Kat Mouth: Generating Speech...");
                const ttsResponse = await fetch('/api/sparkle/speak-minimax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: data.sparkleTalk,
                        voiceId: 'female-shaonv', // Target voice
                        userId: user?.uid
                    })
                });

                // CHECK TASK ID
                if (taskId !== currentTaskId.current) { console.log(`Task #${taskId} aborted.`); return; }

                if (ttsResponse.ok) {
                    let audioBuffer: ArrayBuffer;
                    const contentType = ttsResponse.headers.get('content-type');

                    if (contentType && contentType.includes('application/json')) {
                        const json = await ttsResponse.json();

                        // CHECK TASK ID
                        if (taskId !== currentTaskId.current) return;

                        if (json.audioUrl) {
                            console.log("Using Cached Audio:", json.audioUrl);
                            const audioRes = await fetch(json.audioUrl);
                            if (taskId !== currentTaskId.current) return;
                            audioBuffer = await audioRes.arrayBuffer();
                        } else {
                            // Should not happen if API is correct, but safe fallback
                            console.warn("TTS returned JSON without audioUrl?", json);
                            audioBuffer = new ArrayBuffer(0);
                        }
                    } else {
                        // Direct Buffer
                        audioBuffer = await ttsResponse.arrayBuffer();
                    }

                    if (taskId !== currentTaskId.current) return;

                    if (audioBuffer && audioBuffer.byteLength > 0) {
                        // 🎵 Step 4: Play
                        playAudioBuffer(audioBuffer, () => {
                            // Loop: Always listen after responding IF task is still valid
                            if (taskId === currentTaskId.current) {
                                startListening();
                            }
                        });
                    } else {
                        throw new Error("Empty audio buffer");
                    }

                } else {
                    console.warn("MinimaxTTS failed, fallback to legacy speak");
                    if (taskId === currentTaskId.current) {
                        speak(data.sparkleTalk, 'en-US', () => startListening());
                    }
                }
            }

        } catch (err) {
            console.error("Chat Error", err);
            if (taskId === currentTaskId.current) {
                speak("My magic wand is glitching. One moment!", 'en-US');
            }
        } finally {
            if (taskId === currentTaskId.current) {
                setIsProcessing(false);
            }
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
                <div className="text-3xl">🐱✨</div>
            )}
        </button>
    );
});

SparkleVoiceFab.displayName = "SparkleVoiceFab";
