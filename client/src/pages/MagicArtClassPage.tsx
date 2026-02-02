import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Mic, MicOff, Volume2, Maximize2, Minimize2, RefreshCcw, Sparkles, LogOut, Play,
    Eraser, Undo2, Check, RotateCcw, Palette
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';

import { ArtClassCanvas, type ArtClassCanvasRef } from '../components/art-class/ArtClassCanvas';
import { KatTutor } from '../components/art-class/KatTutor';
import { MagicPencil } from '../components/ui/MagicPencil';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { CAT_LESSON } from '../services/artClass';
import masterpieceVideo from '../assets/masterpiece.mp4';
import storyBgVideo from '../assets/story.mp4'; // New Background
import magicDeskBg from '../assets/magic_desk.png';
// Pro Studio Assets (V5.2)
import studioBgPro from '../assets/studio_bg_pro.png';
import dockGlassPro from '../assets/dock_glass_pro.png';
import { getCanvasAsBase64WithWhiteBg, captureDigitalCanvas } from '../utils/imageUtils';
import { AppleHelloEffect } from '../components/ui/AppleHelloEffect';
import { LowCreditsModal } from '../components/modals/LowCreditsModal';
import { LiquidBackground } from '../components/ui/LiquidBackground';
import artClassOnScreen from '../assets/art_class_onscreen.jpg';
import artClassOnPaper from '../assets/art_class_onpaper.jpg';
import artClassBgOnScreen from '../assets/art_class_bg_onscreen.jpg';
// Pencil Assets
import pencilRed from '../assets/pencil_red_3d.png';
import pencilBlue from '../assets/pencil_blue_3d.png';
import pencilYellow from '../assets/pencil_yellow_3d.png';
import pencilGreen from '../assets/pencil_green_3d.png';
import pencilPurple from '../assets/pencil_purple_3d.png';
import pencilBlack from '../assets/pencil_black_3d.png';
import { DebugResizableBox } from '../components/debug/DebugResizableBox';

// --- Types ---
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}



export const MagicArtClassPage: React.FC = () => {
    const navigate = useNavigate();
    const canvasRef = useRef<ArtClassCanvasRef>(null);
    const containerRef = useRef<HTMLDivElement>(null); // For DebugResizableBox

    // --- Core State ---
    const [lesson] = useState(CAT_LESSON);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFinished, setIsFinished] = useState(false);

    // --- UX State ---
    const [mode, setMode] = useState<'selection' | 'mode-select' | 'digital' | 'real'>('selection');
    const [nextMode, setNextMode] = useState<string | null>(null);
    const [showExamples, setShowExamples] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showLowCredits, setShowLowCredits] = useState(false); // Modal state

    // --- New AI/Voice State (MagicLab Architecture) ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false); // Thinking state
    const [lastCapture, setLastCapture] = useState<string | null>(null); // DEBUG UI

    // --- Calibration State ---
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [canvasLayout, setCanvasLayout] = useState({
        t: 10.2, l: 15.5, w: 68.9, h: 79.7
    });

    // --- Magic Word Setup State ---
    const [magicWord, setMagicWord] = useState<string | null>(() => localStorage.getItem('magic_word'));
    const [setupStep, setSetupStep] = useState<'idle' | 'listening-for-word' | 'confirming-word'>('idle');
    const [tempMagicWord, setTempMagicWord] = useState<string | null>(null);

    // --- Mobile Logic ---
    const [showMobileTip, setShowMobileTip] = useState(false);
    useEffect(() => {
        // Check if mobile on mount or mode switch
        if (mode === 'mode-select' && window.innerWidth < 768) {
            // Only show if not already shown this session? Or always? User requested "When detected... prompt"
            // Let's show it.
            setShowMobileTip(true);
        }
    }, [mode]);

    // Refs for Audio & Queue
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null); // Webcam ref
    const audioQueue = useRef<string[]>([]); // Queue of base64 strings
    const isPlayingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const recognitionRef = useRef<any>(null);

    // Legacy support (to be refactored)
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        // Prevent Context Menu (Right Click) and Long Press Menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        window.addEventListener('contextmenu', handleContextMenu);

        // Optional: Prevent selection on touch devices to avoid copy menu
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        return () => {
            isMounted.current = false;
            window.removeEventListener('contextmenu', handleContextMenu);
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
        };
    }, []);

    // ... (rest of state)



    // --- Drawing Tools State ---
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5); // Brush thickness
    const [showColorPicker, setShowColorPicker] = useState(false); // Color picker modal
    const [permissionDenied, setPermissionDenied] = useState(false); // Microphone permission state

    // --- Interaction States for "Check My Art" ---
    const [analyzing, setAnalyzing] = useState(false);
    // aiFeedback removed (duplicate)
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false); // New Clear Confirm State
    const { user } = useAuth(); // Needed for analysis

    // --- Audio Queue System (MagicLab Style) ---
    const playAudioQueue = useCallback(() => {
        if (isPlayingRef.current) return; // Only block if actively playing, not if queue empty
        if (audioQueue.current.length === 0) return;

        console.log("▶️ Playing next audio from queue. Remaining:", audioQueue.current.length);

        isPlayingRef.current = true;
        setIsPlaying(true);
        const nextAudioBase64 = audioQueue.current.shift();

        // Safety check for valid base64
        if (!nextAudioBase64) {
            isPlayingRef.current = false;
            setIsPlaying(false);
            playAudioQueue(); // Try next if current invalid
            return;
        }

        const audio = new Audio(`data:audio/mp3;base64,${nextAudioBase64}`);
        audioRef.current = audio;

        audio.onended = () => {
            console.log("✅ Audio chunk finished");
            isPlayingRef.current = false;
            setIsPlaying(false);
            audioRef.current = null;

            // Check if queue is empty (end of speech)
            if (audioQueue.current.length === 0) {
                console.log("🛑 Audio queue empty. Speech complete.");
                // setAiFeedback(null); // Keep text visible for readability? Or clear? 
                // User said "didn't finish sentence", so maybe we simply shouldn't clear too aggressively?
                // Let's keep the bubble for a moment or let new actions clear it.
            }

            // Small buffer to prevent cutting off
            setTimeout(() => {
                playAudioQueue(); // Play next
            }, 100);
        };

        audio.onerror = (err) => {
            console.error('[Audio] Playback failed/interrupted:', err);
            isPlayingRef.current = false;
            setIsPlaying(false);

            // Try next
            setTimeout(() => {
                playAudioQueue();
            }, 100);
        };

        audio.play().catch(err => {
            console.error('[Audio] Playback start failed:', err);
            isPlayingRef.current = false;
            setIsPlaying(false);
            playAudioQueue();
        });
    }, []);

    // --- Chat System (SSE) ---
    const sendMessage = useCallback(async (text: string, imageContext?: string) => {
        if (!text.trim() && !imageContext) return;

        if (imageContext) {
            console.log(`[MagicArt] 📤 Sending Image Context (Size: ${imageContext.length} chars)`);
        }

        setIsLoading(true);

        // Stop current audio if user interrupts
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        isPlayingRef.current = false;
        setIsPlaying(false);
        audioQueue.current = [];

        try {
            const response = await fetch('/api/magic-art/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    // Pass simplified history if needed
                    conversationHistory: messages.slice(-4),
                    imageContext
                })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiFullText = "";
            let buffer = ""; // Buffer for partial chunks

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk; // Append new data to buffer

                // Split by double newline (SSE delimiter)
                const parts = buffer.split('\n\n');

                // Keep the last part in the buffer (it might be incomplete)
                // If the chunk ended with \n\n, the last part will be empty, which is fine
                buffer = parts.pop() || "";

                for (const line of parts) {
                    if (!line.trim().startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(line.trim().replace('data: ', ''));

                        if (data.type === 'text') {
                            // Only console log stream for now, or update a "typing" state
                            // console.log("Stream:", data.content);
                            aiFullText += data.content;
                        } else if (data.type === 'audio') {
                            console.log("🎵 Received Audio Chunk");
                            audioQueue.current.push(data.audio);
                            playAudioQueue();
                        } else if (data.type === 'done') {
                            setMessages(prev => [...prev, { role: 'assistant', content: aiFullText }]);
                            setAiFeedback(aiFullText); // Update Tutor Bubble

                            // Auto-advance to mode select if AI suggests it
                            if (mode === 'selection') {
                                const lowerAI = aiFullText.toLowerCase();
                                if (lowerAI.includes('screen') || lowerAI.includes('paper') || lowerAI.includes('which one')) {
                                    console.log("🤖 AI prompted for mode selection -> Switching UI");
                                    setNextMode('mode-select');
                                }
                            }
                        }
                    } catch (e) {
                        console.warn("SSE Parse Error", e);
                        console.warn("Faulty Line:", line);
                    }
                }
            }

        } catch (error) {
            console.error("Chat error", error);
            setAiFeedback("Oops! Paws got confusing! Try again? 🐱");
        } finally {
            setIsLoading(false);
        }
    }, [messages, playAudioQueue, mode]);

    // --- Magic Word Setup Logic ---
    const speakMessage = useCallback(async (text: string) => {
        // Helper to just speak text without sending to LLM context (for strict flows)
        // Note: For now, we reuse sendMessage but maybe with a flag? 
        // Actually, let's just use sendMessage for simplicity, the AI will "reply" to itself in history? 
        // No, simpler to just simulate a "Server" response or use a specific TTS endpoint if available.
        // For this architecture, we use sendMessage so the AI persona speaks it.
        await sendMessage(text);
    }, [sendMessage]);

    useEffect(() => {
        if (mode === 'real') {
            if (!magicWord) {
                // Start Setup Flow
                setSetupStep('listening-for-word');
                // Give a small delay so the mode switch audio doesn't clash or use a timeout
                setTimeout(() => {
                    setAiFeedback("Let's set a secret password! What should we say to check your art?");
                    // We need a way to trigger TTS for this system message. 
                    // Since we don't have a direct TTS function exposed easily without 'sendMessage', 
                    // we will trigger a "system" prompt via sendMessage or just let the user read it?
                    // USER REQUEST requires AI to "communicate".
                    // Let's "pretend" the user asked to setup.
                    sendMessage("Tell the user: 'First, let's pick a magic word! When you finish a drawing, what do you want to say? Tell me the word!'");
                }, 1000);
            } else {
                setSetupStep('idle');
                // Normal mode
                // Maybe remind them?
                setTimeout(() => {
                    // sendMessage(`Tell the user: 'I'm ready! Just say ${magicWord} when you want me to look!'`);
                }, 500);
            }
        }
    }, [mode, magicWord, sendMessage]);

    // --- Welcome & Replay Logic ---
    const [lastPlayedAudio, setLastPlayedAudio] = useState<string | null>(null);

    const handleReplay = useCallback(() => {
        if (lastPlayedAudio) {
            console.log("🔄 Replaying last audio...");
            audioQueue.current = [lastPlayedAudio];
            playAudioQueue();
        } else {
            // Fallback if no audio history
            sendMessage("Can you help me?");
        }
    }, [lastPlayedAudio, playAudioQueue, sendMessage]);

    // --- Voice Input (Hold to Talk) ---
    const handleHoldToTalkStart = useCallback(() => {
        console.log("🎤 Hold Start");
        // Stop audio
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            isPlayingRef.current = false;
        }

        setIsListening(true);

        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice not supported");
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => console.log("🎤 Listening...");

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            const lower = transcript.toLowerCase();
            console.log("🗣️ Transcript:", lower);

            // Mode Switching Logic
            // Mode Switching Logic
            if (mode === 'selection') {
                // Strict Intent Check: Remove catch-all length check
                // "draw", "start", "ready", "yes", "okay", "go", "fun"
                const intentKeywords = ['draw', 'start', 'begin', 'ready', 'yes', 'okay', 'cat', 'make', 'create', 'fun', 'sure'];
                const hasIntent = intentKeywords.some(k => lower.includes(k));

                if (hasIntent) {
                    if (!lower.includes('hello') && !lower.includes('hi')) {
                        console.log("Navigating to mode-select based on intent");
                        setNextMode('mode-select');
                    }
                }
            } else if (mode === 'real') {

                // === MAGIC WORD SETUP FLOW ===
                if (setupStep === 'listening-for-word') {
                    // We take the first clear word/phrase
                    // Filter out noise?
                    if (lower.split(' ').length < 5) { // reasonable length
                        setTempMagicWord(lower);
                        setSetupStep('confirming-word');
                        // Ask for confirmation
                        sendMessage(`Tell the user: 'I heard ${lower}. Is that right? say Yes to save it.'`);
                    }
                    return;
                }

                if (setupStep === 'confirming-word') {
                    if (lower.includes('yes') || lower.includes('yeah') || lower.includes('right') || lower.includes('correct') || lower.includes('ok')) {
                        // Confirmed!
                        if (tempMagicWord) {
                            setMagicWord(tempMagicWord);
                            localStorage.setItem('magic_word', tempMagicWord);
                            setSetupStep('idle');
                            sendMessage(`Tell the user: 'Great! I've learned the secret code: ${tempMagicWord}. When you finish drawing, just say ${tempMagicWord}!'`);
                        }
                    } else if (lower.includes('no') || lower.includes('wrong') || lower.includes('nope')) {
                        // Retry
                        setSetupStep('listening-for-word');
                        setTempMagicWord(null);
                        sendMessage("Tell the user: 'Oops! Try again. What is the magic word?'");
                    }
                    return;
                }

                // === NORMAL USAGE (Idle) ===
                // Check for user's magic word OR fallback to generic helpful ones just in case?
                // User requirement: "Rather than fixed hocus pocus... AI checks... after user says it"

                const triggerWord = magicWord || 'hocus pocus'; // fallback if somehow null

                if (lower.includes(triggerWord) || lower.includes('magic check')) {
                    console.log("✨ Magic Triggered:", triggerWord);
                    const audio = new Audio('/assets/magic_chime.mp3');
                    audio.play().catch(() => { });

                    // Force capture logic
                    const imgContext = captureCameraFrame();
                    if (imgContext) {
                        sendMessage("I cast the spell! Let me see your magic!", imgContext);
                        return; // Skip default send
                    }
                }
            } else if (mode === 'mode-select') {
                // Guard against questions (e.g. "What is on screen?")
                const isQuestion = lower.includes('what') || lower.includes('difference') || lower.includes('explain') || lower.includes('mean');

                if (!isQuestion) {
                    // Stricter Word Boundaries for "Screen" (Avoid "Ice Cream" -> "Screen" false pos if partial match)
                    // Also check for "Digital"
                    if (/\b(screen|digital|tablet|computer|ipad)\b/.test(lower)) {
                        setAiFeedback("Opening Screen Mode! 📱");
                        setMode('digital');
                    } else if (/\b(paper|real|drawing|camera)\b/.test(lower)) {
                        setAiFeedback("Opening Magic Check! 📝");
                        setMode('real');
                    }
                }
            }

            // always send to chat
            // In DIGITAL mode, ALWAYS send the image context so AI can see what user is drawing
            // always send to chat
            // Vision Link Fix: Protocol Integration
            let imgContext = undefined;

            if (mode === 'digital' && canvasRef.current) {
                console.log("📸 Calling Digital Capture...");
                imgContext = captureDigitalCanvas(canvasRef);
                setLastCapture(imgContext); // DEBUG
            } else if (mode === 'real') {
                console.log("📸 Calling Camera Capture...");
                imgContext = captureCameraFrame();
                setLastCapture(imgContext || null); // DEBUG
            }

            if (imgContext) {
                console.log("✅ Capture Success. Length:", imgContext.length);
            }

            // always send to chat
            sendMessage(transcript, imgContext);
        };

        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();

    }, [mode, sendMessage]);

    const handleHoldToTalkEnd = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }, []);

    // --- Webcam Logic (Real Mode) ---
    const captureWebcam = useCallback(() => {
        if (!videoRef.current) return undefined;
        try {
            const cvs = document.createElement('canvas');
            cvs.width = videoRef.current.videoWidth;
            cvs.height = videoRef.current.videoHeight;
            const ctx = cvs.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                return cvs.toDataURL('image/jpeg', 0.8);
            }
        } catch (e) { console.error("Capture failed", e); }
        return undefined;
    }, []);

    // Vision Link Fix: Real Paper Mode Capture
    const captureCameraFrame = (): string => {
        const video = videoRef.current;
        if (!video || video.readyState !== 4) { // 4 = HAVE_ENOUGH_DATA
            console.error("❌ Camera not ready");
            return "";
        }

        // 1. Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) return "";

        // 2. Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 3. Export
        const base64 = canvas.toDataURL('image/jpeg', 0.8);

        console.log("✅ Camera Capture Success. Length:", base64.length);
        return base64;
    };

    useEffect(() => {
        if (mode !== 'real') return;
        let stream: MediaStream | null = null;
        const startCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Camera failed", err);
                sendMessage("I can't see your camera! Can you check your settings?", undefined);
            }
        };
        startCamera();
        return () => {
            if (stream) stream.getTracks().forEach(t => t.stop());
        }
    }, [mode, sendMessage]);

    // --- Audio Autoplay Fix ---
    const [hasInteracted, setHasInteracted] = useState(false);
    const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);

    const fetchWelcomeMessage = useCallback(async () => {
        if (messages.length > 0) return; // Only fetch if no messages yet

        try {
            console.log("👋 Fetching Welcome...");
            const res = await fetch('/api/magic-art/welcome', { method: 'POST' });
            const data = await res.json();

            if (data.audioBase64) {
                setLastPlayedAudio(data.audioBase64);
                audioQueue.current.push(data.audioBase64);
                playAudioQueue();
            }

            if (data.message) {
                setMessages([{ role: 'assistant', content: data.message }]);
            }

        } catch (e) {
            console.error("Welcome failed", e);
        }
    }, [messages, playAudioQueue]);

    // --- EFFECT: Welcome Message (Only after interaction) ---
    useEffect(() => {
        if (hasInteracted && !hasPlayedWelcome) {
            const playWelcome = async () => {
                setAiFeedback("Meow! Welcome to the Magic Studio! 🎨");
                await fetchWelcomeMessage();
                setHasPlayedWelcome(true);
            };
            playWelcome();
        }
    }, [hasInteracted, hasPlayedWelcome, fetchWelcomeMessage]);

    // --- Mode Transition Effect ---
    useEffect(() => {
        if (!isPlaying && nextMode && !isLoading) {
            const t = setTimeout(() => {
                setMode(nextMode as any);
                setNextMode(null);
            }, 500);
            return () => clearTimeout(t);
        }
    }, [isPlaying, nextMode, isLoading]);

    // Hook into SSE stream to save audio for replay
    useEffect(() => {
        // We need to capture the last audio chunk played from the chat stream
        // This is tricky with current implementation. 
        // Best way: Update playAudioQueue to setLastPlayedAudio when popping?
        // Or finding where we push to queue.
        // Current implementation pushes to queue in `sendMessage` SSE loop.
        // Let's rely on `audioQueue.current.push` calls there.
        // Actually, we can't easily hook into that imperative loop from here without refactoring.
        // Workaround: Modify sendMessage to update state after successful stream?
        // Or just let welcome be replayed (user specifically asked for welcome replay context).
        // User said "click to replay what he just said".
    }, []);

    if (!hasInteracted) {
        return (
            <div className="fixed inset-0 z-[100] bg-cover bg-center flex items-center justify-center p-4" style={{ backgroundImage: `url(${magicDeskBg})` }}>
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setHasInteracted(true)}
                    className="relative z-10 bg-white/10 border-2 border-white/50 backdrop-blur-md text-white px-12 py-6 rounded-full font-black text-3xl shadow-[0_0_50px_rgba(255,255,255,0.5)] flex items-center gap-4 animate-pulse-slow group"
                >
                    <span className="text-5xl group-hover:rotate-12 transition-transform">✨</span>
                    Enter Magic Studio
                </motion.button>
            </div>
        );
    }

    // --- Check My Art (AI Tutor Review) ---
    const handleCheckMyArt = async () => {
        if (!canvasRef.current) return;
        // Fix: Use White BG capture logic for manual check
        const img = getCanvasAsBase64WithWhiteBg(canvasRef);
        sendMessage("How does my drawing look? Any tips?", img);
    };

    // --- Navigation / Auto-Fill ---
    const handleNavigate = async (targetPath: string) => {
        // Credit Check Logic (Cost: 25 points for Magic Transformation)
        if ((user?.points || 0) < 25) {
            setShowLowCredits(true);
            return;
        }

        if (!canvasRef.current) {
            navigate(targetPath);
            return;
        }
        // Fix: Use White BG capture logic for auto-fill, with Robust Fallback
        let finalImage = getCanvasAsBase64WithWhiteBg(canvasRef);

        // Fallback: Try direct get image from ref if utility failed
        if (!finalImage && canvasRef.current?.getImage) {
            console.warn("[MagicArt] ⚠️ WhiteBG capture failed, trying raw getImage fallback...");
            try {
                finalImage = canvasRef.current.getImage();
            } catch (e) {
                console.error("[MagicArt] ❌ Fallback capture failed:", e);
            }
        }

        console.log("[MagicArt] 🚀 Navigating to", targetPath, "Captured Image Length:", finalImage ? finalImage.length : 0);

        if (finalImage) {
            // COMPRESSION STEP: Ensure it fits in sessionStorage (<5MB)
            // If > 2MB, resize to max 1024px
            if (finalImage.length > 2000000) {
                try {
                    const resized = await new Promise<string>((resolve) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            // Max dim 1024
                            const maxDim = 1024;
                            let w = img.width;
                            let h = img.height;
                            if (w > maxDim || h > maxDim) {
                                const ratio = Math.min(maxDim / w, maxDim / h);
                                w *= ratio;
                                h *= ratio;
                            }
                            canvas.width = w;
                            canvas.height = h;
                            if (ctx) {
                                ctx.fillStyle = '#FFFFFF'; // Ensure white bg again
                                ctx.fillRect(0, 0, w, h);
                                ctx.drawImage(img, 0, 0, w, h);
                            }
                            resolve(canvas.toDataURL('image/jpeg', 0.85)); // Good quality, smaller size
                        };
                        img.onerror = () => resolve(finalImage); // Fail safe
                        img.src = finalImage;
                    });
                    finalImage = resized;
                    console.log("[MagicArt] 📉 Resized/Compressed to:", finalImage.length);
                } catch (e) {
                    console.error("[MagicArt] ⚠️ Resize failed, using original:", e);
                }
            }

            // Use SessionStorage for handoff to avoid History State size limits
            try {
                sessionStorage.setItem('magic_art_handoff', finalImage);
                console.log("[MagicArt] 💾 Saved to session storage for seamless handoff");
            } catch (e) {
                console.error("[MagicArt] ❌ Failed to save to session storage (Quota?):", e);
                window.alert("Error: Image too big. Try a simpler drawing."); // FAIL ALERT
            }
        } else {
            console.warn("[MagicArt] ⚠️ Capture failed, navigating without image");
        }

        navigate(targetPath, {
            state: {
                autoUploadImage: finalImage && finalImage.length < 500000 ? finalImage : undefined,
                source: 'art-class',
                useSessionStorage: true
            }
        });
    };

    // ... (existing imports)

    // ...

    // --- RENDER: MODE SELECTION ---
    if (mode === 'selection') {
        return (
            <>
                <MagicNavBar />
                <div className="fixed inset-0 min-h-[100dvh] transition-all bg-slate-900">
                    <video
                        src={storyBgVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                    <div className="relative h-full flex flex-col landscape:flex-row items-center justify-center">

                        {/* Apple Hello Animation: Full Screen Background (Scaled) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10 pointer-events-none w-full flex justify-center scale-[5] origin-center">
                            <AppleHelloEffect duration={4} strokeColor="#000000" strokeWidth={4} />
                        </div>

                        {/* Avatar: Adjusted for Landscape (Side by Side) - Proportional Scaling via clamp */}
                        {/* Size: Min 80px, Preferred 30% of height, Max 220px */}
                        <div className="relative z-20 landscape:mr-10" style={{ width: 'clamp(80px, 30vh, 220px)', height: 'clamp(80px, 30vh, 220px)' }}>
                            <KatTutor
                                message=""
                                emotion="happy"
                                position="static"
                                videoSrc={masterpieceVideo}
                                isSpeaking={isPlaying}
                                onSpeak={() => sendMessage("What should we draw today?")}
                            />
                        </div>
                        {/* Mic: Adjusted for Landscape - Proportional Scaling */}
                        {/* Size: Min 60px, Preferred 20% of height, Max 120px */}
                        <div className="flex flex-col items-center mt-8 landscape:mt-0 z-10">
                            <button
                                onPointerDown={handleHoldToTalkStart}
                                onPointerUp={handleHoldToTalkEnd}
                                onPointerLeave={handleHoldToTalkEnd}
                                style={{ width: 'clamp(60px, 20vh, 120px)', height: 'clamp(60px, 20vh, 120px)' }}
                                className={`rounded-full shadow-2xl border-4 border-white flex items-center justify-center text-white transition-all active:scale-95 ${isListening ? 'listening bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-105'}`}>
                                {/* Icon scales with button */}
                                <Mic style={{ width: '50%', height: '50%' }} className={`${isListening ? 'animate-pulse' : ''}`} />
                            </button>
                            <p className="text-gray-600 font-bold mt-4 text-lg landscape:text-sm bg-white/50 px-4 py-1 rounded-full backdrop-blur-sm">Hold to Speak</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (mode === 'mode-select') {
        return (
            <div className="fixed inset-0 bg-white/95 flex flex-col items-center justify-center p-8 landscape:p-4">
                <MagicNavBar />

                <h1 className="text-3xl landscape:text-xl font-black text-slate-800 mb-8 landscape:mb-2 drop-shadow-sm text-center">Where do you want to draw?</h1>

                <div className="flex flex-col lg:flex-row landscape:flex-row items-center justify-center gap-8 landscape:gap-4 w-full max-w-6xl">

                    {/* LEFT: On Screen - Proportional Width */}
                    <button
                        onClick={() => { setAiFeedback(null); setMode('digital'); }}
                        style={{ width: 'clamp(200px, 40vh, 320px)' }}
                        className="group relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl transition-all hover:scale-105 hover:rotate-2 hover:shadow-indigo-500/30 border-4 border-white ring-4 ring-indigo-50"
                    >
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                        <img src={artClassOnScreen} alt="On Screen" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
                            <span className="text-xl landscape:text-lg font-black text-white drop-shadow-lg flex items-center justify-center gap-2">
                                📱 On Screen
                            </span>
                        </div>
                    </button>

                    {/* CENTER: Avatar - Proportional */}
                    <div className="relative z-20 -my-4 lg:my-0 landscape:my-0 w-24 h-24 md:w-32 md:h-32" style={{ transform: 'scale(clamp(0.8, 1.2vh, 1.2))' }}>
                        <KatTutor
                            message=""
                            emotion="thinking"
                            position="static"
                            videoSrc={masterpieceVideo}
                            isSpeaking={isPlaying}
                            onSpeak={() => sendMessage("Where do you want to draw? Screen or Paper?")}
                        />
                    </div>

                    {/* RIGHT: On Paper - Proportional Width */}
                    <button
                        onClick={() => { setAiFeedback(null); setMode('real'); }}
                        style={{ width: 'clamp(200px, 40vh, 320px)' }}
                        className="group relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl transition-all hover:scale-105 hover:-rotate-2 hover:shadow-emerald-500/30 border-4 border-white ring-4 ring-emerald-50"
                    >
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                        <img src={artClassOnPaper} alt="On Paper" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
                            <span className="text-xl landscape:text-lg font-black text-white drop-shadow-lg flex items-center justify-center gap-2">
                                📝 On Paper
                            </span>
                        </div>
                    </button>

                </div>
            </div>
        );
    }

    if (mode === 'real') {
        return (
            <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-between p-4 landscape:p-2">
                    <MagicNavBar />
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 landscape:gap-2">
                        <div className="w-24 h-24 md:w-32 md:h-32" style={{ transform: 'scale(clamp(0.7, 1vh, 1))' }}>
                            <KatTutor
                                message={aiFeedback || (magicWord ? `Say '${magicWord}' to check!` : "Let's pick a magic word!")}
                                emotion="happy"
                                position="static"
                                videoSrc={masterpieceVideo}
                                isSpeaking={isPlaying}
                                onSpeak={() => sendMessage("I'm ready! Show me your art!")}
                            />
                        </div>
                        {isListening && <div className="animate-pulse bg-white/20 p-4 landscape:p-2 rounded-3xl text-white font-bold text-xl landscape:text-lg">
                            {setupStep === 'listening-for-word' ? "🎤 Speak your Password..." :
                                setupStep === 'confirming-word' ? "🎤 Say YES or NO..." :
                                    `🎤 "${magicWord || 'Magic Check'}!"`}
                        </div>}
                    </div>
                    <div className="flex flex-col items-center mb-12 landscape:mb-4">
                        <button
                            onPointerDown={handleHoldToTalkStart}
                            onPointerUp={handleHoldToTalkEnd}
                            onPointerLeave={handleHoldToTalkEnd}
                            style={{ width: 'clamp(80px, 20vh, 120px)', height: 'clamp(80px, 20vh, 120px)' }}
                            className={`rounded-full shadow-2xl border-4 border-white flex items-center justify-center text-white transition-all active:scale-95 ${isListening ? 'bg-indigo-600 scale-110 shadow-indigo-500/50' : 'bg-red-500 hover:bg-red-600'}`}>
                            <Mic style={{ width: '50%', height: '50%' }} className={`${isListening ? 'animate-pulse' : ''}`} />
                        </button>
                    </div>
                    <button onClick={() => setMode('mode-select')} className="absolute top-24 left-4 p-2 bg-white/20 backdrop-blur rounded-full text-white"><ArrowLeft /></button>
                </div>
            </div>
        );
    }

    // --- DIGITAL MODE (V5.2 - Toybox Redesign) ---
    return (
        <div ref={containerRef} className="relative w-full h-screen bg-[#FEFCF5] overflow-hidden selection:bg-indigo-100">

            {/* 1. CANVAS LAYER (Interactive Drawing Surface) */}
            <div className="absolute inset-0 z-0 touch-none">
                <div className="absolute inset-0 z-0">
                    <img src="/assets/canvas1.png" alt="Art Studio Background" className="w-full h-full object-fill" />
                    <div className="absolute inset-0 bg-black/5" /> {/* Subtle overlay for better contrast if needed */}
                </div>

                {/* The Drawing Canvas - Restricted to Scroll Area */}
                {/* Scroll is roughly in the center. We position the canvas to overlay it. */}
                {/* The Drawing Canvas - Restricted to Scroll Area */}
                {/* Scroll is roughly in the center. We position the canvas to overlay it. */}
                {/* The Drawing Canvas - Restricted to Scroll Area */}
                {/* The Drawing Canvas - Restricted to Scroll Area */}
                {/* The Drawing Canvas - Interactive Layer */}
                {isCalibrating ? (
                    <DebugResizableBox
                        initialTopPercent={canvasLayout.t}
                        initialLeftPercent={canvasLayout.l}
                        initialWidthPercent={canvasLayout.w}
                        initialHeightPercent={canvasLayout.h}
                        parentRef={containerRef}
                        onChange={setCanvasLayout}
                    >
                        <ArtClassCanvas
                            ref={canvasRef}
                            color={brushColor}
                            brushSize={tool === 'eraser' ? 30 : brushSize}
                            brushType={tool === 'eraser' ? 'eraser' : 'pen'}
                            className={`w-full h-full cursor-crosshair touch-none ${isCalibrating ? 'pointer-events-none' : ''}`}
                        />
                    </DebugResizableBox>
                ) : (
                    <div
                        className="absolute z-10"
                        style={{
                            top: `${canvasLayout.t}%`,
                            left: `${canvasLayout.l}%`,
                            width: `${canvasLayout.w}%`,
                            height: `${canvasLayout.h}%`
                        }}
                    >
                        <ArtClassCanvas
                            ref={canvasRef}
                            color={brushColor}
                            brushSize={tool === 'eraser' ? 30 : brushSize}
                            brushType={tool === 'eraser' ? 'eraser' : 'pen'}
                            className="w-full h-full cursor-crosshair touch-none"
                        />
                    </div>
                )}
            </div>

            {/* 2. MENTOR LAYER (Top Left Hanging Kat) */}
            <div className="absolute top-0 left-4 md:left-8 z-20 flex flex-col items-center pointer-events-none">
                <div className="relative pointer-events-auto flex flex-col items-center group">
                    {/* Hanging Rope Effect */}
                    <div className="w-1.5 h-16 md:h-24 bg-gradient-to-b from-indigo-300 to-indigo-200 rounded-b-full shadow-sm origin-top animate-swing-slow" />

                    {/* Kat Avatar Container */}
                    <motion.div
                        whileHover={{ y: 10, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", bounce: 0.6 }}
                        className="relative z-10 -mt-2 cursor-pointer"
                        onClick={() => {
                            // Trigger Magic Check Logic on Avatar Click
                            const img = getCanvasAsBase64WithWhiteBg(canvasRef);
                            if (img) sendMessage("Magic Check! What do you think of my drawing?", img);
                            else handleReplay(); // Fallback if capture fails
                        }}
                    >
                        <div className="rounded-full border-[6px] border-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden bg-indigo-50 relative box-content"
                            style={{ width: 'clamp(64px, 15vh, 128px)', height: 'clamp(64px, 15vh, 128px)' }}>
                            {/* Using existing video source or fallback */}
                            {masterpieceVideo ? (
                                <video src={masterpieceVideo} muted loop playsInline className="w-full h-full object-cover transform scale-110" ref={videoRef} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">🐱</div>
                            )}
                            {/* Glossy Overlay */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/0 via-white/20 to-white/40 pointer-events-none" />
                        </div>
                    </motion.div>
                </div>

                {/* Speech Bubble (Comic Style) */}
                <AnimatePresence>
                    {(aiFeedback || isPlaying || !hasInteracted) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, rotate: -10, x: 50, y: -20 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute left-[80%] top-24 w-40 md:w-60 lg:w-72 bg-white p-3 md:p-5 rounded-3xl rounded-tl-none shadow-xl border-2 border-indigo-50 z-20 text-center"
                        >
                            <p className="text-gray-700 font-black text-xs md:text-lg leading-snug tracking-tight font-comic">
                                {aiFeedback || "Let's make some magic! ✨"}
                            </p>
                            {/* Bubble Tail */}
                            <div className="absolute -left-2 -top-2 w-6 h-6 bg-white border-l-2 border-t-2 border-indigo-50 transform -rotate-12 z-10" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. TOOL DOCK (Bottom Floating Cloud) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-4 pointer-events-none">
                <div className="pointer-events-auto flex items-center justify-between gap-2 md:gap-8 transform transition-transform hover:scale-[1.01] duration-500">

                    {/* LEFT: Preset Color Palette (Scrollable Flower Disk) */}
                    <div className="flex items-center gap-1.5 bg-white/80 p-2 rounded-[1.5rem] border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-md overflow-x-auto max-w-[35vw] md:max-w-[40vw] scrollbar-hide">
                        {[
                            '#000000', // Black
                            '#EF4444', // Red
                            '#F97316', // Orange
                            '#EAB308', // Yellow
                            '#22C55E', // Green
                            '#3B82F6', // Blue
                            '#A855F7', // Purple
                            '#EC4899', // Pink
                            '#8B4513', // Brown
                            '#FFFFFF'  // White
                        ].map((color) => (
                            <button
                                key={color}
                                onClick={() => { setBrushColor(color); setTool('pen'); }}
                                className={`rounded-full border-2 border-white/80 shadow-sm transition-all hover:scale-110 active:scale-95 flex-shrink-0 ${brushColor === color && tool === 'pen' ? 'ring-4 ring-indigo-400 scale-110 z-10' : 'hover:z-10'}`}
                                style={{
                                    backgroundColor: color,
                                    width: 'clamp(28px, 5vh, 44px)',
                                    height: 'clamp(28px, 5vh, 44px)'
                                }}
                                title={color}
                            />
                        ))}
                    </div>

                    {/* SEPARATOR */}
                    <div className="w-0.5 h-8 md:h-12 bg-indigo-100/50 rounded-full" />

                    {/* NEW: Brush Size Control (Toy Style) */}
                    <div className="flex items-center gap-2 bg-white/60 p-2 rounded-[2rem] border border-white/50 shadow-inner">
                        {[
                            { s: 5, label: 'Thin', px: 8 },
                            { s: 12, label: 'Med', px: 16 },
                            { s: 24, label: 'Thick', px: 32 }
                        ].map((size) => (
                            <button
                                key={size.s}
                                onClick={() => setBrushSize(size.s)}
                                className={`group relative w-10 h-10 md:w-12 md:h-12 rounded-full transition-all flex items-center justify-center ${brushSize === size.s ? 'bg-indigo-100 ring-4 ring-indigo-300 z-10 scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}
                                title={size.label}
                            >
                                <div
                                    className={`rounded-full transition-all ${brushSize === size.s ? 'bg-indigo-600' : 'bg-gray-400 group-hover:bg-gray-500'}`}
                                    style={{ width: size.px, height: size.px }}
                                />
                            </button>
                        ))}
                    </div>

                    {/* SEPARATOR */}
                    <div className="w-0.5 h-8 md:h-12 bg-indigo-100/50 rounded-full" />

                    {/* RIGHT: Action Toys - Scaled via clamp */}
                    <div className="flex items-center gap-2 md:gap-6">

                        {/* Eraser (Pink Jelly) */}
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setTool('eraser')}
                            style={{ width: 'clamp(40px, 10vh, 50px)', height: 'clamp(40px, 10vh, 50px)' }}
                            className={`rounded-2xl flex items-center justify-center shadow-[0_6px_0_rgb(249,168,212)] active:shadow-none active:translate-y-[6px] transition-all border-b-4 border-pink-300 relative group overflow-hidden ${tool === 'eraser' ? 'bg-pink-200 translate-y-1 shadow-none border-b-0' : 'bg-pink-100'}`}
                            title="Eraser"
                        >
                            <div className="absolute inset-x-0 bottom-0 h-2 bg-pink-200/50" />
                            <span className="text-xl md:text-3xl drop-shadow-sm group-hover:scale-110 transition-transform">🧼</span>
                        </motion.button>

                        {/* Undo (Yellow Spring) */}
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: -15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => canvasRef.current?.handleUndo()}
                            style={{ width: 'clamp(40px, 10vh, 50px)', height: 'clamp(40px, 10vh, 50px)' }}
                            className="bg-yellow-100 rounded-full flex items-center justify-center shadow-[0_6px_0_rgb(253,224,71)] active:shadow-none active:translate-y-[6px] transition-all border-b-4 border-yellow-200 relative group"
                            title="Undo"
                        >
                            <RotateCcw className="w-1/2 h-1/2 text-yellow-600 group-hover:-rotate-45 transition-transform" strokeWidth={3} />
                        </motion.button>

                        {/* Clear (Trash) - NEW */}
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowClearConfirm(true)}
                            style={{ width: 'clamp(40px, 10vh, 50px)', height: 'clamp(40px, 10vh, 50px)' }}
                            className="bg-red-100 rounded-full flex items-center justify-center shadow-[0_6px_0_rgb(252,165,165)] active:shadow-none active:translate-y-[6px] transition-all border-b-4 border-red-200 relative group"
                            title="Clear All"
                        >
                            <span className="text-xl md:text-2xl pt-1">🗑️</span>
                        </motion.button>

                        {/* DONE (Big Green Check) */}
                        <motion.button
                            onClick={() => setShowFinishModal(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ width: 'clamp(64px, 15vh, 80px)', height: 'clamp(64px, 15vh, 80px)' }}
                            className="bg-gradient-to-b from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(74,222,128,0.5)] border-[6px] border-white active:scale-95 group relative overflow-hidden"
                            title="Finish!"
                        >
                            {/* Gloss Shine */}
                            <div className="absolute top-0 inset-x-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none" />
                            <Check className="w-1/2 h-1/2 text-white drop-shadow-md group-hover:scale-125 transition-transform" strokeWidth={5} />
                        </motion.button>

                    </div>
                </div>
            </div>

            {/* EXIT BUTTON (Top Right, simple) */}
            <button
                onClick={() => navigate('/home')}
                className="absolute top-6 right-6 p-3 md:p-4 bg-white/80 backdrop-blur text-red-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm hover:shadow-md border border-red-50"
                title="Exit"
            >
                <LogOut size={24} strokeWidth={3} />
            </button>

            {/* Test Mode Toggle */}
            <button
                onClick={() => setIsCalibrating(!isCalibrating)}
                className="absolute top-24 right-6 p-2 bg-gray-800/80 text-white rounded-lg text-xs font-mono opacity-50 hover:opacity-100 transition-opacity"
            >
                {isCalibrating ? 'Save Layout' : 'Config Canvas'}
            </button>


            {/* MODALS & OVERLAYS */}
            {/* Color Picker Modal (Removed as we have direct palette) */}

            {/* Finish/Portal Modal - Keeping existing logic but restyling if needed */}
            {
                showFinishModal && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, rotate: 5 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            className="bg-[#FEFCF5] rounded-[3rem] p-8 max-w-2xl w-full shadow-2xl text-center relative overflow-hidden border-8 border-white ring-4 ring-indigo-100"
                        >

                            <h2 className="text-4xl md:text-5xl font-black text-indigo-900 mb-2 relative z-10 font-comic tracking-tight">Wow! Is it done? 🎉</h2>
                            <p className="text-xl text-gray-500 mb-10 relative z-10 font-bold">Pick a magic portal to transform your art!</p>

                            <div className="grid grid-cols-2 gap-4 md:gap-6 relative z-10">
                                {[
                                    { icon: '🎬', label: 'Movie', path: '/generate/video', bg: 'bg-purple-100 hover:bg-purple-200 border-purple-200', text: 'text-purple-700' },
                                    { icon: '📖', label: 'Story', path: '/generate/picture', bg: 'bg-blue-100 hover:bg-blue-200 border-blue-200', text: 'text-blue-700' },
                                    { icon: '💬', label: 'Comic', path: '/generate/comic', bg: 'bg-pink-100 hover:bg-pink-200 border-pink-200', text: 'text-pink-700' },
                                    { icon: '💌', label: 'Card', path: '/generate/greeting-card', bg: 'bg-orange-100 hover:bg-orange-200 border-orange-200', text: 'text-orange-700' },
                                ].map((opt) => (
                                    <button
                                        key={opt.label}
                                        onClick={() => handleNavigate(opt.path)}
                                        className={`${opt.bg} border-b-8 p-6 rounded-[2rem] transition-all active:scale-95 active:border-b-0 active:translate-y-2 flex flex-col items-center gap-2 group`}
                                    >
                                        <span className="text-5xl group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm">{opt.icon}</span>
                                        <span className={`font-black text-xl ${opt.text}`}>{opt.label} (25 Pts)</span>
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => setShowFinishModal(false)} className="mt-10 px-8 py-3 rounded-full bg-gray-100 text-gray-400 font-bold hover:bg-gray-200 hover:text-gray-600 transition-colors">
                                No, let me paint more! 🎨
                            </button>
                        </motion.div>
                    </div>
                )
            }

            {/* Low Credits Modal */}
            <LowCreditsModal
                isOpen={showLowCredits}
                onClose={() => setShowLowCredits(false)}
                currentPoints={user?.points || 0}
                neededPoints={25}
            />

            {/* Vision Link: Hidden Magic Check for Voice or specific triggers if needed */}

            {/* Mobile Suggestion Modal */}
            <AnimatePresence>
                {showMobileTip && (
                    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 50 }}
                            className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl text-center border-4 border-indigo-100 relative overflow-hidden"
                        >
                            {/* Decoration */}
                            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-indigo-50 to-transparent pointer-events-none" />

                            <div className="mb-6 relative z-10">
                                <span className="text-6xl drop-shadow-md">📱</span>
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 mb-4 font-comic relative z-10">
                                Small Screen Detected!
                            </h3>

                            <p className="text-gray-600 font-medium mb-8 leading-relaxed relative z-10">
                                Since you are on a phone, drawing on screen might be tricky.
                                <br /><br />
                                We recommend using <b>Real Paper</b> and the <b>Magic Camera</b> for the best experience! ✨
                            </p>

                            <div className="flex flex-col gap-3 relative z-10">
                                <button
                                    onClick={() => {
                                        setShowMobileTip(false);
                                        setMode('real'); // Switch to Paper
                                    }}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-2"
                                >
                                    <span className="text-2xl">📸</span> Use Magic Camera
                                </button>

                                <button
                                    onClick={() => {
                                        setShowMobileTip(false);
                                        // If already in mode-select, stay there. Or logic:
                                        // If this popped up during 'mode-select', just closing it lets them choose.
                                    }}
                                    className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                                >
                                    I'll try drawing here
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


        </div>
    );
};

export default MagicArtClassPage;
