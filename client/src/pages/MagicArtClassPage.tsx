import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, MicOff, Volume2 } from 'lucide-react';
import confetti from 'canvas-confetti';

import { ArtClassCanvas, type ArtClassCanvasRef } from '../components/art-class/ArtClassCanvas';
import { KatTutor } from '../components/art-class/KatTutor';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { CAT_LESSON } from '../services/artClass';
import { useAuth } from '../context/AuthContext';
import masterpieceVideo from '../assets/masterpiece.mp4';

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
    const [audioInitialized, setAudioInitialized] = useState(false); // Track if audio is ready

    // --- Voice/Turn State ---
    const [turnState, setTurnState] = useState<TurnState>('ai_speaking');
    const [isSpeaking, setIsSpeaking] = useState(false); // Detailed TTS status
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioCacheRef = useRef<Map<string, ArrayBuffer>>(new Map());
    const hasGreeted = useRef(false);
    const hasModeSelectGreeted = useRef(false); // For mode-select screen

    // --- Drawing Tools State ---
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5); // Brush thickness
    const [showColorPicker, setShowColorPicker] = useState(false); // Color picker modal
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
            // In digital mode, don't auto-start listening (user uses manual mic button)
            if (mode === 'digital') {
                setTurnState('processing'); // Idle state, no auto-listen
                return;
            }

            // In other modes (selection, mode-select), auto-start listening
            playDing();
            setTimeout(() => {
                setTurnState('user_listening');
            }, 500);
        }
    }, [turnState, playDing, mode]);

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

    // --- Handler: Initialize Audio (User Gesture Required) ---
    const handleStartClick = async () => {
        try {
            // Create/resume AudioContext
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (audioCtxRef.current.state === 'suspended') {
                await audioCtxRef.current.resume();
            }
            console.log("✅ AudioContext initialized");

            setAudioInitialized(true);

            // Play welcome message
            if (!hasGreeted.current) {
                hasGreeted.current = true;
                speakMinimax("Welcome! What do you want to draw today?");
            }
        } catch (error) {
            console.error("Failed to initialize audio:", error);
            setAudioInitialized(true); // Still proceed, will fallback to speechSynthesis
        }
    };

    // --- Render: Rigid Split Layout (Anti-Blocking) ---
    // Only applies to Digital Mode for now, others can stay as full overlays or migrate later

    const isDigital = mode === 'digital';

    if (mode === 'selection') {
        // Existing Selection UI but using new speakMinimax
        return (
            <>
                <MagicNavBar />
                <div className="fixed inset-0 bg-[url('/assets/paper_texture.jpg')] bg-cover flex flex-col items-center justify-center">
                    {/* Start Button Overlay (Required for Audio) */}
                    {!audioInitialized && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
                        >
                            <motion.button
                                onClick={handleStartClick}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-12 py-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-3xl rounded-full shadow-2xl border-4 border-white flex items-center gap-4"
                            >
                                <Volume2 className="w-10 h-10" />
                                <span>Start Art Class!</span>
                            </motion.button>
                        </motion.div>
                    )}

                    {audioInitialized && (
                        <>
                            <KatTutor
                                message="Welcome! What do you want to draw today?"
                                emotion="happy"
                                position="static"
                                startSpeaking={false}
                                videoSrc={masterpieceVideo}
                                isSpeaking={isSpeaking}
                                onSpeak={() => {
                                    // Audio already played in handleStartClick
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
                        </>
                    )}
                </div>
            </>
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
                    videoSrc={masterpieceVideo}
                    isSpeaking={isSpeaking}
                    onSpeak={() => {
                        if (!hasModeSelectGreeted.current) {
                            hasModeSelectGreeted.current = true;
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
        <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col md:flex-row overflow-hidden">

            {/* 1. SIDEBAR (AI + Tools) - Clean and Organized */}
            <div className="md:w-80 w-full md:h-full flex flex-col bg-white/80 backdrop-blur-lg border-r-2 border-indigo-200 z-10 shrink-0 shadow-xl">

                {/* Back Button - Floating */}
                <button
                    onClick={() => navigate('/home')}
                    className="absolute top-4 left-4 p-2 bg-white rounded-full shadow-md text-indigo-600 hover:text-indigo-800 hover:scale-110 transition-all z-50"
                >
                    <ArrowLeft size={20} />
                </button>

                {/* AI ZONE (Top) - Compact to prevent overflow */}
                <div className="p-4 pt-16 bg-gradient-to-b from-indigo-100 to-white border-b-2 border-indigo-200 flex flex-col items-center">
                    <div className="w-24 h-24 shrink-0">
                        <KatTutor
                            message={lesson.steps[currentStepIndex].tutorMessage}
                            position="static"
                            videoSrc={masterpieceVideo}
                            isSpeaking={isSpeaking}
                            onSpeak={() => speakMinimax(lesson.steps[currentStepIndex].tutorMessage)}
                        />
                    </div>
                </div>

                {/* TOOLS SECTION - Organized and Complete */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="text-lg">🎨</span> Drawing Tools
                    </h3>

                    {/* Tool Selection - Pen/Eraser */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                            onClick={() => setTool('pen')}
                            className={`p-3 bg-white rounded-xl shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 transition-all ${tool === 'pen' ? 'ring-2 ring-indigo-400 scale-105' : ''}`}
                        >
                            <img src="/assets/icon_pencil_3d.png" alt="Pencil" className="w-10 h-10 object-contain" />
                            <span className="text-xs font-bold text-gray-700">Pencil</span>
                        </button>

                        <button
                            onClick={() => setTool('eraser')}
                            className={`p-3 bg-white rounded-xl shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 transition-all ${tool === 'eraser' ? 'ring-2 ring-pink-400 scale-105' : ''}`}
                        >
                            <img src="/assets/icon_eraser_3d.png" alt="Eraser" className="w-10 h-10 object-contain" />
                            <span className="text-xs font-bold text-gray-700">Eraser</span>
                        </button>
                    </div>

                    {/* Brush Size Slider */}
                    <div className="mb-4 bg-white p-3 rounded-xl shadow-sm">
                        <label className="text-xs font-bold text-gray-700 mb-2 block">Brush Size: {brushSize}px</label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-full h-2 bg-gradient-to-r from-indigo-200 to-purple-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Thin</span>
                            <span>Thick</span>
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-gray-700 mb-2 block">Color</label>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            {/* Current Color Display */}
                            <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="w-full h-12 rounded-lg mb-3 border-2 border-gray-200 flex items-center justify-between px-3 hover:border-indigo-400 transition-colors"
                                style={{ backgroundColor: brushColor }}
                            >
                                <span className="text-white text-xs font-bold drop-shadow-md" style={{ color: brushColor === '#FFFFFF' ? '#000' : '#fff' }}>
                                    {brushColor.toUpperCase()}
                                </span>
                                <span className="text-xs font-bold text-white drop-shadow-md" style={{ color: brushColor === '#FFFFFF' ? '#000' : '#fff' }}>
                                    {showColorPicker ? '▲' : '▼'}
                                </span>
                            </button>

                            {/* Color Grid */}
                            {showColorPicker && (
                                <div className="grid grid-cols-6 gap-2">
                                    {[
                                        '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
                                        '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB', '#A52A2A',
                                        '#808080', '#C0C0C0', '#FFD700', '#90EE90', '#87CEEB', '#DDA0DD'
                                    ].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => { setBrushColor(color); setShowColorPicker(false); }}
                                            className={`w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform ${brushColor === color ? 'ring-2 ring-indigo-600 ring-offset-1' : 'border-gray-300'}`}
                                            style={{ backgroundColor: color }}
                                            title={color}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                            onClick={() => canvasRef.current?.handleUndo()}
                            className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 transition-all hover:scale-105"
                        >
                            <img src="/assets/icon_undo_3d.png" alt="Undo" className="w-10 h-10 object-contain" />
                            <span className="text-xs font-bold text-gray-700">Undo</span>
                        </button>

                        <button
                            onClick={() => canvasRef.current?.clear()}
                            className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md flex flex-col items-center justify-center gap-1 transition-all hover:scale-105"
                        >
                            <span className="text-2xl">🗑️</span>
                            <span className="text-xs font-bold text-gray-700">Clear</span>
                        </button>
                    </div>

                    {/* Done Button - Prominent */}
                    <button
                        onClick={() => { setIsFinished(true); confetti() }}
                        className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-base py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                        <img src="/assets/icon_done_3d.png" alt="Done" className="w-6 h-6 object-contain drop-shadow" />
                        <span>I'm Done!</span>
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
