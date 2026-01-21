import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

import { ArtClassCanvas, type ArtClassCanvasRef } from '../components/art-class/ArtClassCanvas';
import { KatTutor } from '../components/art-class/KatTutor';
import { CAT_LESSON } from '../services/artClass';
import { useAuth } from '../context/AuthContext';

// Turn-Taking State Machine for Kid-Friendly Voice Interaction
type TurnState = 'ai_speaking' | 'transition' | 'user_listening' | 'processing';

export const MagicArtClassPage: React.FC = () => {
    const navigate = useNavigate();
    const canvasRef = useRef<ArtClassCanvasRef>(null);

    // --- Core State ---
    const [lesson] = useState(CAT_LESSON);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // --- UX State ---
    const [mode, setMode] = useState<'selection' | 'mode-select' | 'digital' | 'real'>('selection');
    const [showExamples, setShowExamples] = useState(false);

    // --- Voice/Turn State ---
    const [turnState, setTurnState] = useState<TurnState>('ai_speaking');
    const [isSpeaking, setIsSpeaking] = useState(false); // Detailed TTS status
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioCacheRef = useRef<Map<string, ArrayBuffer>>(new Map());
    const hasGreeted = useRef(false);

    // --- Drawing Tools State ---
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [brushColor, setBrushColor] = useState('#000000');
    const [permissionDenied, setPermissionDenied] = useState(false); // Microphone permission state

    // --- Helper: Play Ding Sound ---
    const playDing = useCallback(() => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
    }, []);

    // --- Helper: Play Audio Buffer ---
    const playAudioBuffer = async (arrayBuffer: ArrayBuffer): Promise<number> => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            if (ctx.state === 'suspended') await ctx.resume();

            const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
            const source = ctx.createBufferSource();
            const gainNode = ctx.createGain();

            source.playbackRate.value = 1.05;
            source.buffer = audioBuffer;
            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            source.start(0);
            return audioBuffer.duration / 1.05;
        } catch (error) {
            console.error("Error playing audio:", error);
            return 0;
        }
    };

    // --- Helper: TTS (Modified for Turn-Taking) ---
    const speakMinimax = useCallback(async (text: string) => {
        if (!text) return;

        // 1. Enter AI Speaking State
        setTurnState('ai_speaking');
        setIsSpeaking(true);

        try {
            let duration = 0;
            if (audioCacheRef.current.has(text)) {
                duration = await playAudioBuffer(audioCacheRef.current.get(text)!);
            } else {
                const response = await fetch('/api/sparkle/speak-minimax', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, voice_id: 'female-shaonv' })
                });
                if (!response.ok) throw new Error('Speech generation failed');
                const arrayBuffer = await response.arrayBuffer();
                audioCacheRef.current.set(text, arrayBuffer.slice(0));
                duration = await playAudioBuffer(arrayBuffer);
            }

            // 2. Wait for audio to finish, then TRANSITION
            if (duration > 0) {
                setTimeout(() => {
                    setIsSpeaking(false);
                    setTurnState('transition'); // Trigger the "Ding" and listen
                }, duration * 1000 + 200);
            } else {
                setIsSpeaking(false);
                setTurnState('transition');
            }

        } catch (error) {
            console.error("TTS Error:", error);
            const msg = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(msg);
            msg.onend = () => {
                setIsSpeaking(false);
                setTurnState('transition');
            };
        }
    }, []);

    // --- Effect: Handle Transition (Ding -> Listen) ---
    useEffect(() => {
        if (turnState === 'transition') {
            playDing();
            setTimeout(() => {
                setTurnState('user_listening');
            }, 500);
        }
    }, [turnState, playDing]);

    // --- Speech Recognition ---
    useEffect(() => {
        if (turnState !== 'user_listening' || permissionDenied) return;

        console.log("🎤 [Speech] Setup initiated. TurnState:", turnState);

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("❌ [Speech] Browser does not support Speech Recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log("🟢 [Speech] Recognition STARTED. Listening...");
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            console.log("🗣️ [Speech] Heard (Raw):", transcript);

            // Logic depending on mode
            if (mode === 'selection') {
                if (transcript.includes('cat')) {
                    recognition.stop();
                    console.log("✅ [Speech] Command: CAT");
                    speakMinimax("A Cat! Great choice! Let's do it!");
                    setTimeout(() => setMode('mode-select'), 1500);
                } else if (transcript.includes('example')) {
                    recognition.stop();
                    console.log("✅ [Speech] Command: EXAMPLE");
                    setShowExamples(true);
                    speakMinimax("Here are some ideas!");
                } else if (transcript.length > 2) {
                    // Free draw fallback
                    recognition.stop();
                    console.log("✅ [Speech] Command: FREE DRAW ->", transcript);
                    const subject = transcript.split(' ').pop();
                    speakMinimax(`Ooh, drawing a ${subject}! Cool!`);
                    setTimeout(() => setMode('mode-select'), 2000);
                }
            } else if (mode === 'mode-select') {
                if (transcript.includes('screen') || transcript.includes('digital')) {
                    recognition.stop();
                    console.log("✅ [Speech] Command: DIGITAL");
                    speakMinimax("On Screen it is!");
                    setMode('digital');
                } else if (transcript.includes('paper')) {
                    recognition.stop();
                    console.log("✅ [Speech] Command: REAL");
                    speakMinimax("Real paper! I'll watch!");
                    setMode('real');
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.warn("⚠️ [Speech] Error:", event.error);
            if (event.error === 'not-allowed') {
                setPermissionDenied(true);
            }
        };

        recognition.onend = () => {
            console.log("🔴 [Speech] Recognition ENDED.");
        };

        // Safety timeout - if nothing heard in 8s, prompt user
        const timeout = setTimeout(() => {
            if (turnState === 'user_listening' && !permissionDenied) {
                console.log("⏰ [Speech] Timeout - prompt user?");
            }
        }, 8000);

        try {
            recognition.start();
            console.log("▶️ [Speech] start() called.");
        } catch (e) {
            console.error("❌ [Speech] Failed to start:", e);
        }

        return () => {
            console.log("🛑 [Speech] Cleanup - Stopping recognition");
            recognition.stop();
            clearTimeout(timeout);
        };
    }, [turnState, mode, speakMinimax, permissionDenied]);


    // --- Handlers ---
    const handleHoldToTalkStart = () => {
        // Force interrupt
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        setTurnState('user_listening');
        setPermissionDenied(false); // Retry permission
    };

    // --- Render: Rigid Split Layout (Anti-Blocking) ---
    // Only applies to Digital Mode for now, others can stay as full overlays or migrate later

    const isDigital = mode === 'digital';

    if (mode === 'selection') {
        // Existing Selection UI but using new speakMinimax
        return (
            <div className="fixed inset-0 bg-[url('/assets/paper_texture.jpg')] bg-cover flex flex-col items-center justify-center">
                <KatTutor
                    message="Welcome! What do you want to draw today?"
                    emotion="happy"
                    position="static"
                    startSpeaking={true}
                    onSpeak={() => {
                        if (!hasGreeted.current) {
                            hasGreeted.current = true;
                            speakMinimax("Welcome! What do you want to draw today?");
                        }
                    }}
                />

                {/* Visual Listener */}
                {turnState === 'user_listening' && !permissionDenied && (
                    <div className="mt-8 animate-pulse text-indigo-600 font-bold text-xl flex flex-col items-center">
                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
                            <Mic className="w-8 h-8 text-indigo-600" />
                        </div>
                        Listening...
                    </div>
                )}

                {/* Permission Denied Recovery - Selection Mode */}
                {turnState === 'user_listening' && permissionDenied && (
                    <div className="mt-8 flex flex-col items-center gap-2 z-50">
                        <p className="text-red-500 font-bold text-sm bg-white/80 px-2 rounded">
                            Microphone blocked?
                        </p>
                        <button
                            onClick={async () => {
                                try {
                                    await navigator.mediaDevices.getUserMedia({ audio: true });
                                    setPermissionDenied(false);
                                    setTurnState('user_listening');
                                } catch (err) {
                                    alert("Microphone is still blocked by the browser. \n\nPlease click the Lock 🔒 icon in the URL bar, find 'Microphone', and set it to 'Allow'. Then refresh the page.");
                                }
                            }}
                            className="bg-red-100 px-6 py-3 rounded-full shadow-lg font-bold text-red-600 flex items-center gap-2 animate-bounce cursor-pointer hover:bg-red-200 border-2 border-red-200"
                        >
                            <MicOff className="w-5 h-5" />
                            Enable Microphone
                        </button>
                    </div>
                )}

                <button onClick={() => setShowExamples(true)} className="mt-8 bg-white px-6 py-3 rounded-full shadow-lg font-bold text-gray-600 flex items-center gap-2">
                    💡 Need Ideas?
                </button>

                {showExamples && (
                    <div className="mt-8 flex gap-4 animate-in slide-in-from-bottom">
                        <div onClick={() => { speakMinimax("A Cat!"); setTimeout(() => setMode('mode-select'), 1000) }} className="w-40 h-40 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                            <span className="text-4xl">🐱</span>
                            <span className="font-bold mt-2">Cat</span>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (mode === 'mode-select') {
        return (
            <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-8">
                <KatTutor
                    message="Where do you want to draw? Screen or Paper?"
                    emotion="thinking"
                    position="static"
                    startSpeaking={true}
                    onSpeak={() => {
                        if (!hasGreeted.current) { // Re-using ref or creating new one? 
                            // Actually hasGreeted might be for the first screen. 
                            // I should just let it speak or control it. 
                            // The user complained about latency. 
                            speakMinimax("Where do you want to draw? Screen or Paper?");
                        } else {
                            speakMinimax("Where do you want to draw? Screen or Paper?");
                        }
                    }}
                />
                <div className="flex gap-4 mt-8 z-10">
                    <button onClick={() => setMode('digital')} className="px-8 py-4 bg-indigo-100 rounded-2xl font-bold text-indigo-700 text-xl hover:bg-indigo-200">
                        📱 On Screen
                    </button>
                    <button onClick={() => setMode('real')} className="px-8 py-4 bg-emerald-100 rounded-2xl font-bold text-emerald-700 text-xl hover:bg-emerald-200">
                        📝 On Paper
                    </button>
                </div>
            </div>
        )
    }

    // --- MAIN RIGID SPLIT LAYOUT (Digital) ---
    return (
        <div className="fixed inset-0 w-full h-full bg-slate-50 flex flex-col md:flex-row overflow-hidden">

            {/* 1. SIDEBAR (AI + Tools) - Left on Desktop, Top/Bottom on Mobile */}
            <div className="md:w-1/4 w-full md:h-full flex flex-col bg-white border-r border-slate-200 z-10 shrink-0 shadow-lg">

                {/* AI ZONE (Top) */}
                <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex-none flex flex-row md:flex-col items-center gap-4 text-center relative overflow-visible">
                    <button onClick={() => navigate('/home')} className="absolute top-2 left-2 p-2 text-gray-400 hover:text-gray-800"><ArrowLeft size={20} /></button>

                    {/* Kat Container - Static now */}
                    <div className="w-24 h-24 md:w-40 md:h-40 shrink-0 relative">
                        <KatTutor
                            message={lesson.steps[currentStepIndex].tutorMessage}
                            position="static"  // New Static Prop
                            onSpeak={() => speakMinimax(lesson.steps[currentStepIndex].tutorMessage)}
                        />
                    </div>
                </div>

                {/* CONVERSATION LOG / STATUS (Middle) */}
                <div className="flex-1 p-4 bg-slate-50 overflow-y-auto hidden md:block">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Conversation</h3>
                    <div className="space-y-2">
                        <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm text-sm text-gray-600">
                            {turnState === 'ai_speaking' ? "Speaking..." : turnState === 'user_listening' ? "Waiting for you..." : "Thinking..."}
                        </div>
                    </div>
                </div>

                {/* VISUAL TOOLS (Bottom) */}
                <div className="p-4 bg-white border-t border-slate-200 flex flex-row md:flex-wrap justify-center gap-4 overflow-x-auto">
                    <button onClick={() => { setTool('pen'); setBrushColor('#000000'); }} className={`w-16 h-16 transition-transform hover:scale-110 ${tool === 'pen' ? 'scale-110 ring-4 ring-indigo-200 rounded-xl' : ''}`}>
                        <img src="/assets/icon_pencil_3d.png" alt="Pencil" className="w-full h-full object-contain drop-shadow" />
                    </button>
                    <button onClick={() => setTool('eraser')} className={`w-16 h-16 transition-transform hover:scale-110 ${tool === 'eraser' ? 'scale-110 ring-4 ring-pink-200 rounded-xl' : ''}`}>
                        <img src="/assets/icon_eraser_3d.png" alt="Eraser" className="w-full h-full object-contain drop-shadow" />
                    </button>

                    {/* Palette (Popover trigger in real app, simple color switch for now) */}
                    <button onClick={() => setBrushColor(brushColor === '#000000' ? '#FF5733' : '#000000')} className="w-16 h-16 transition-transform hover:scale-110 active:rotate-12">
                        <img src="/assets/icon_palette_3d.png" alt="Palette" className="w-full h-full object-contain drop-shadow" />
                    </button>

                    <button onClick={() => canvasRef.current?.handleUndo()} className="w-16 h-16 transition-transform hover:scale-110 active:-rotate-45">
                        <img src="/assets/icon_undo_3d.png" alt="Undo" className="w-full h-full object-contain drop-shadow" />
                    </button>

                    <div className="flex-1 md:w-full md:flex-none"></div> {/* Spacer */}

                    <button onClick={() => { setIsFinished(true); confetti() }} className="w-16 h-16 transition-transform hover:scale-110 ml-auto md:ml-0">
                        <img src="/assets/icon_done_3d.png" alt="Done" className="w-full h-full object-contain drop-shadow" />
                    </button>
                </div>
            </div>

            {/* 2. CANVAS ZONE (Right / Middle) - The 'No Block' Zone */}
            <div className="flex-1 relative bg-slate-200 shadow-inner overflow-hidden flex items-center justify-center p-4 md:p-8">
                <div className="w-full h-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden relative border-8 border-white">
                    <ArtClassCanvas
                        ref={canvasRef}
                        color={brushColor}
                        brushSize={tool === 'eraser' ? 20 : 10}
                        brushType={tool === 'eraser' ? 'eraser' : 'pen'}
                    />
                    {/* Interaction Safety Net (Hold to Talk) */}
                    <button
                        onPointerDown={handleHoldToTalkStart}
                        // onPointerUp logic...
                        className="absolute bottom-6 right-6 w-20 h-20 bg-red-500 rounded-full shadow-lg border-4 border-white flex items-center justify-center text-white text-3xl transition-transform active:scale-95 hover:bg-red-600 z-50">
                        <Mic className="w-8 h-8" />
                    </button>
                </div>
            </div>

            {/* Visual feedback for Listening Phase (Overlay) */}
            <AnimatePresence>
                {turnState === 'user_listening' && !permissionDenied && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ pointerEvents: 'none' }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/5 backdrop-blur-[1px]"
                    >
                        <div className="bg-white/90 p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-bounce-slight">
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                                <Mic size={48} className="text-red-500" />
                            </div>
                            <span className="text-xl font-black text-gray-700">I'm Listening...</span>
                        </div>
                    </motion.div>
                )}
                {/* Permission Denied Recovery - Digital Mode */}
                {turnState === 'user_listening' && permissionDenied && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                    >
                        <button
                            onClick={async () => {
                                try {
                                    await navigator.mediaDevices.getUserMedia({ audio: true });
                                    setPermissionDenied(false);
                                    setTurnState('user_listening');
                                } catch (err) {
                                    alert("Microphone is still blocked by the browser. \n\nPlease click the Lock 🔒 icon in the URL bar, find 'Microphone', and set it to 'Allow'. Then refresh the page.");
                                }
                            }}
                            className="bg-red-500 text-white px-8 py-4 rounded-full font-bold text-xl shadow-xl hover:bg-red-600 flex items-center gap-4 cursor-pointer"
                        >
                            <span>🎤</span>
                            <span>Enable Microphone</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};
