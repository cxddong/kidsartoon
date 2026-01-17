import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Play, RefreshCw, Video, Upload, Wand2, Volume2, CloudUpload, Sparkles, MoveLeft, Mic, Pause, X, Download, Share2, Facebook, Twitter, Instagram, Music } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenerationCancelButton from '../components/GenerationCancelButton';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { AuthButton } from '../components/auth/AuthButton';
import { useAuth } from '../context/AuthContext';
import { MAGIC_ACTIONS, MAGIC_STYLES, MAGIC_EFFECTS, VIDEO_DURATION_OPTIONS } from '../components/builder/AnimationBuilderPanel';
import { PureVideoPlayer } from '../components/PureVideoPlayer';
import { PuzzleButton } from '../components/puzzle/PuzzleButton';
import { PuzzleGame } from '../components/puzzle/PuzzleGame';
import { cn } from '../lib/utils';
import { ImageCropperModal } from '../components/ImageCropperModal';
import generateVideo from '../assets/genpage.mp4';
import videoPageBg from '../assets/videopage.mp4';

import spellQuickIcon from '../assets/spells/quick.png';
import spellStoryIcon from '../assets/spells/story.png';
import spellCinemaIcon from '../assets/spells/cinema.png';
import audioTalkIcon from '../assets/audio/talk.png';
import audioSceneIcon from '../assets/audio/scene.png';
import voiceCuteIcon from '../assets/voices/cute.png';
import voiceRobotIcon from '../assets/voices/robot.png';
import voiceMonsterIcon from '../assets/voices/monster.png';
import moodHappyIcon from '../assets/moods/happy.png';
import moodMysteryIcon from '../assets/moods/mystery.png';
import moodActionIcon from '../assets/moods/action.png';

type Step = 'upload' | 'params' | 'generating' | 'finished';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const popInVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
};

interface SpellInfo {
    duration: string;
    limit: number;
    cost: number;
    name: string;
    ph: string;
}

const SPELLS: any = {
    'quick': { duration: '4s', limit: 50, cost: 15, name: 'Quick Zap', ph: 'Say hi! (Max 10 words)', icon: spellQuickIcon },
    'story': { duration: '8s', limit: 120, cost: 30, name: 'Story Time', ph: 'Tell a short story... (Max 25 words)', icon: spellStoryIcon },
    'cinema': { duration: '12s', limit: 180, cost: 60, name: 'Cinema Mode', ph: 'Long story for a movie! (Max 40 words)', icon: spellCinemaIcon }
};


export const MagicMoviePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();

    // Steps: upload -> params -> generating -> finished
    const [step, setStep] = useState<Step>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [resultData, setResultData] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [showPuzzle, setShowPuzzle] = useState(false);

    // Builder States
    // Builder States
    const [action, setAction] = useState<string | undefined>(MAGIC_ACTIONS[0].id);
    const [style, setStyle] = useState<string | undefined>(undefined);
    const [effect, setEffect] = useState<string | undefined>(undefined);
    // New Doubao 1.5 States
    const [selectedSpell, setSelectedSpell] = useState<'quick' | 'story' | 'cinema'>('story');
    const [audioMode, setAudioMode] = useState<'talk' | 'scene'>('talk');
    const [voiceStyle, setVoiceStyle] = useState<'cute' | 'robot' | 'monster'>('cute');
    const [sceneMood, setSceneMood] = useState<'happy' | 'mysterious' | 'action'>('happy');
    const [textInput, setTextInput] = useState(""); // Character Speech - Start empty
    const [isSoundOn, setIsSoundOn] = useState(true); // New: Sound Toggle
    const [videoPrompt, setVideoPrompt] = useState(''); // Additional Prompt / Scene Description
    const [isListening, setIsListening] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const recognitionRef = useRef<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);


    const addTag = (tag: string) => { setVideoPrompt(prev => (tag + ' ' + prev).substring(0, (SPELLS as any)[selectedSpell].limit)); };

    const calculateCredits = (): number => {
        return (SPELLS as any)[selectedSpell].cost;
    };

    React.useEffect(() => {
        const remixUrl = location.state?.remixImage;
        if (remixUrl) {
            setImagePreview(remixUrl);
            setStep('params'); // Jump to params if remixing
            fetch(remixUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "remix.png", { type: blob.type });
                    setImageFile(file);
                })
                .catch(err => console.error("Failed to load remix image:", err));
        }
    }, [location.state]);

    // Video element cleanup to prevent React errors
    React.useEffect(() => {
        return () => {
            // Cleanup: pause and clear video on unmount to prevent AbortError
            if (videoRef.current) {
                videoRef.current.pause();
                videoRef.current.src = '';
                videoRef.current.load();
            }
        };
    }, [resultData?.videoUrl]);

    // Cropper State
    const [cropImage, setCropImage] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Read for Cropper
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropImage(reader.result as string);
            };
            reader.readAsDataURL(file);

            e.target.value = ''; // Reset input
        }
    };

    const handleCropComplete = (blob: Blob) => {
        if (!cropImage) return;
        const url = URL.createObjectURL(blob);
        const file = new File([blob], "animation-input.jpg", { type: "image/jpeg" });

        setImagePreview(url);
        setImageFile(file);
        setStep('params'); // Auto-advance as before
        setCropImage(null);
    };

    const handleGenerate = async () => {
        if (!imageFile && !imagePreview) return;

        // Calculate credits
        const creditsNeeded = calculateCredits();
        if (!user) { alert('Please sign in to generate videos'); return; }
        if ((user.points || 0) < creditsNeeded) { alert(`Not enough points. You need ${creditsNeeded} points.`); return; }

        setStep('generating');
        setProgress(0);
        setStatusMessage('Uploading image...');

        const formData = new FormData();
        if (imageFile) formData.append('image', imageFile);
        else if (imagePreview) formData.append('imageUrl', imagePreview); // For Remix flow if file missing

        // Send action, style, effect to the new /image-to-video/task endpoint
        formData.append('action', action || 'dance'); // Required by backend
        if (style) formData.append('style', style);
        if (effect) formData.append('effect', effect);

        // Duration mapping: spell -> duration in seconds
        const durationMap = { 'quick': '4', 'story': '8', 'cinema': '10' };
        formData.append('duration', durationMap[selectedSpell]);
        formData.append('generateAudio', isSoundOn ? 'true' : 'false'); // User controlled
        formData.append('userId', user.uid);

        // NEW: Audio Mode and Voice Style parameters
        formData.append('audioMode', audioMode); // 'talk' or 'scene'
        formData.append('voiceStyle', voiceStyle); // 'cute', 'robot', 'monster'
        formData.append('sceneMood', sceneMood); // 'happy', 'mysterious', 'action'

        // Construct Detailed Prompt from Action/Style/Effect selections
        // Backend (Seedance 1.5) ignores raw IDs, so we must send text descriptions
        const actionPrompt = MAGIC_ACTIONS.find(a => a.id === action)?.prompt || '';
        const stylePrompt = MAGIC_STYLES.find(s => s.id === style)?.prompt || '';
        const effectPrompt = MAGIC_EFFECTS.find(e => e.id === effect)?.prompt || '';

        // Combine with any manual videoPrompt (tags)
        const fullPrompt = [
            actionPrompt,
            stylePrompt,
            effectPrompt,
            videoPrompt // Includes tags added via addTag
        ].filter(Boolean).join('. ');

        formData.append('videoPrompt', fullPrompt);

        if (textInput.trim()) {
            formData.append('textInput', textInput.trim()); // User's speech/scene description
        }


        try {
            setStatusMessage('Sending to AI...');
            const response = await fetch('/api/media/image-to-video/task', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate video');
            }

            const data = await response.json();

            // Check for success field from backend
            if (data.success === false) {
                if (data.errorCode === 'NOT_ENOUGH_POINTS') {
                    throw new Error(`Not enough Magic Points! Required: ${data.required}, Current: ${data.current}`);
                } else {
                    throw new Error(data.error || 'Generation failed');
                }
            }

            const taskId = data.taskId;

            if (!taskId) {
                throw new Error('No taskId received from server');
            }

            setStatusMessage('AI is generating video...');

            // Simulated progress (since backend doesn't provide real progress)
            let simulatedProgress = 0;
            const progressInterval = setInterval(() => {
                simulatedProgress += 2;
                if (simulatedProgress < 90) {
                    setProgress(simulatedProgress);
                }
            }, 1000);

            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/media/image-to-video/status/${taskId}`);
                    const statusData = await statusRes.json();

                    // Map backend status to frontend
                    if (statusData.status === 'SUCCEEDED' && statusData.videoUrl) {
                        clearInterval(pollInterval);
                        clearInterval(progressInterval);
                        setProgress(100);

                        // FIX: Ensure videoUrl is a string, not an object
                        let videoUrlString = statusData.videoUrl;
                        if (typeof videoUrlString === 'object' && videoUrlString !== null) {
                            // If it's an object, try to extract the URL string
                            videoUrlString = videoUrlString.url || videoUrlString.videoUrl || String(videoUrlString);
                            console.warn('[Video Fix] videoUrl was an object, extracted:', videoUrlString);
                        }
                        console.log('[Video] Final URL:', videoUrlString);

                        setResultData({
                            videoUrl: videoUrlString,
                            params: {
                                action,
                                style,
                                effect,
                                spell: selectedSpell,
                                duration: durationMap[selectedSpell],
                                credits: calculateCredits()
                            }
                        });
                        setStep('finished');
                        setStatusMessage('Complete!');
                    } else if (statusData.status === 'FAILED') {
                        clearInterval(pollInterval);
                        clearInterval(progressInterval);
                        throw new Error(statusData.error || 'Generation failed');
                    } else if (statusData.status === 'PENDING' || statusData.status === 'PROCESSING') {
                        // Still processing, update progress if available
                        if (statusData.progress !== undefined) {
                            setProgress(statusData.progress);
                        }
                    }
                } catch (err: any) {
                    clearInterval(pollInterval);
                    clearInterval(progressInterval);
                    alert(err.message || 'Failed to check status');
                    setStep('params');
                }
            }, 3000);

        } catch (err: any) {
            console.error('Generation error:', err);
            alert(err.message || 'Failed to generate video');
            setStep('params');
        }
    };

    const handleListen = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser');
            return;
        }

        // Stop any existing recognition first
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors when stopping
            }
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        // Always create a fresh instance to prevent event handler accumulation
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
            // Get only the final result
            const result = event.results[event.results.length - 1];
            if (result && result.isFinal) {
                const transcript = result[0].transcript.trim();

                if (transcript) {
                    setTextInput(prev => {
                        const newText = prev ? `${prev} ${transcript}`.trim() : transcript;
                        const maxChars = selectedSpell === 'cinema' ? 180 : selectedSpell === 'story' ? 100 : 40;
                        return newText.slice(0, maxChars);
                    });
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        try {
            recognition.start();
            recognitionRef.current = recognition;
            setIsListening(true);
        } catch (error) {
            console.error('Error starting recognition:', error);
            setIsListening(false);
        }
    };

    const handleDownload = async () => {
        if (!resultData?.videoUrl || isDownloading) return;

        setIsDownloading(true);

        try {
            const response = await fetch(resultData.videoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `magic-video-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Direct download failed, using proxy:', err);
            // Fallback: Use Backend Proxy for reliable download
            const filename = `magic-video-${Date.now()}.mp4`;
            window.location.href = `/api/media/download?url=${encodeURIComponent(resultData.videoUrl)}&filename=${filename}`;
        } finally {
            setIsDownloading(false);
        }
    };

    const shareToSocial = (platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok') => {
        const videoUrl = resultData?.videoUrl;
        const shareText = `Check out my Magic Video! 🎬✨`;
        const currentUrl = window.location.origin;

        switch (platform) {
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
                break;
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`, '_blank');
                break;
            case 'instagram':
                if (videoUrl) {
                    navigator.clipboard.writeText(videoUrl);
                    alert('Video link copied! 📋\nOpen Instagram app and paste in your story or post.');
                }
                break;
            case 'tiktok':
                if (videoUrl) {
                    navigator.clipboard.writeText(videoUrl);
                    alert('Video link copied! 📋\nOpen TikTok app to upload.');
                }
                break;
        }
    };

    const handleStopListen = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.error('Error stopping recognition:', e);
            }
            recognitionRef.current = null;
            setIsListening(false);
        }
    };

    const handleReset = () => {
        setStep('upload');
        setImageFile(null);
        setImagePreview(null);
        setResultData(null);
        setProgress(0);
        setAction(MAGIC_ACTIONS[0].id);
        setStyle(undefined);
        setEffect(undefined);
    };

    const handleRemix = () => {
        setStep('params');
        setResultData(null);
        setProgress(0);
    };

    return (
        <div className="h-screen bg-black relative overflow-hidden flex flex-col">
            {/* Background Video */}
            <video
                src={videoPageBg}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
            />

            {/* Header - Simplified */}
            <div className="relative z-30 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121826]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                    <h1 className="text-white text-lg font-black tracking-tight flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-400" />
                        Make it Move!
                    </h1>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full font-bold border border-amber-500/20 text-xs">
                    <span>✨</span>
                    <span>{user?.points || 0}</span>
                </div>
            </div>

            <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative z-10">
                <div className="w-full max-w-7xl mx-auto px-4 py-6">

                    {/* STEP 1: UPLOAD */}
                    {step === 'upload' && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] relative"
                        >
                            <h2 className="text-3xl font-black text-white mb-8 text-center">First, choose a picture! 📸</h2>

                            <div className="relative w-full aspect-[4/3] bg-slate-800/50 rounded-3xl border-4 border-dashed border-white/20 hover:border-purple-400/50 transition-colors group cursor-pointer overflow-hidden flex flex-col items-center justify-center max-w-2xl"
                                onClick={() => document.getElementById('anim-upload')?.click()}>

                                {/* Background Video Hint - Original, No Effects */}
                                <video src={generateVideo} autoPlay loop muted playsInline disablePictureInPicture className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

                                <input type="file" id="anim-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </div>

                            {/* Upload Tip - Positioned beside upload box on large screens */}
                            <div className="hidden lg:block absolute left-[calc(100%+2rem)] top-32 w-80">
                                <div className="bg-blue-500/20 border-2 border-blue-400/50 rounded-2xl p-4 backdrop-blur-sm">
                                    <p className="text-white/90 text-sm leading-relaxed">
                                        💡 <strong>Tip:</strong> For best video results, upload colored images or use{' '}
                                        <button
                                            onClick={() => navigate('/magic-art')}
                                            className="font-bold text-yellow-300 hover:text-yellow-200 underline cursor-pointer transition-colors"
                                        >
                                            KAT Coloring
                                        </button>{' '}
                                        to add colors to your artwork, or try{' '}
                                        <button
                                            onClick={() => navigate('/creative-journey')}
                                            className="font-bold text-pink-300 hover:text-pink-200 underline cursor-pointer transition-colors"
                                        >
                                            Mentor Journey
                                        </button>{' '}
                                        to enhance and color your drawings!
                                    </p>
                                </div>
                            </div>

                            {/* Mobile version - below upload box */}
                            <div className="lg:hidden mt-6 w-full">
                                <div className="bg-blue-500/20 border-2 border-blue-400/50 rounded-2xl p-4 backdrop-blur-sm">
                                    <p className="text-white/90 text-sm leading-relaxed text-center">
                                        💡 <strong>Tip:</strong> For best video results, upload colored images or use{' '}
                                        <button
                                            onClick={() => navigate('/magic-art')}
                                            className="font-bold text-yellow-300 hover:text-yellow-200 underline cursor-pointer transition-colors"
                                        >
                                            KAT Coloring
                                        </button>{' '}
                                        to add colors to your artwork, or try{' '}
                                        <button
                                            onClick={() => navigate('/creative-journey')}
                                            className="font-bold text-pink-300 hover:text-pink-200 underline cursor-pointer transition-colors"
                                        >
                                            Mentor Journey
                                        </button>{' '}
                                        to enhance and color your drawings!
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2: PARAMETERS */}
                    {step === 'params' && (
                        <div className="space-y-6 pb-32 lg:pb-0">
                            {/* UPLOAD BOX - Always at Top */}
                            <div className="flex justify-center">
                                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                                    <div className="relative w-full aspect-square rounded-3xl overflow-hidden border-4 border-white/10 bg-black/20 shadow-2xl max-w-[280px]">
                                        <img src={imagePreview!} className="w-full h-full object-contain" />
                                        <button
                                            onClick={() => setStep('upload')}
                                            className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/80 backdrop-blur-md transition-colors"
                                        >
                                            Change Photo
                                        </button>
                                    </div>
                                </motion.div>
                            </div>

                            {/* STYLE & EFFECT - Stacked Rows */}
                            <div className="space-y-6 max-w-2xl mx-auto">

                                {/* STYLE ROW */}
                                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">🎨 Style</h3>
                                    <div className="grid grid-cols-3 gap-2 w-full">
                                        {MAGIC_STYLES.map(sty => (
                                            <button
                                                key={sty.id}
                                                onClick={() => setStyle(prev => prev === sty.id ? undefined : sty.id)}
                                                className={cn(
                                                    "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden transition-all",
                                                    style === sty.id ? "border-emerald-500 bg-emerald-500/20 scale-105 shadow-lg z-10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <img src={sty.image} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                    <span className="text-[10px] sm:text-xs font-bold text-white uppercase block text-center truncate px-1">{sty.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* EFFECT ROW */}
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">✨ Effect</h3>
                                    <div className="grid grid-cols-3 gap-2 w-full">
                                        {MAGIC_EFFECTS.map(eff => (
                                            <button
                                                key={eff.id}
                                                onClick={() => setEffect(prev => prev === eff.id ? undefined : eff.id)}
                                                className={cn(
                                                    "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden transition-all",
                                                    effect === eff.id ? "border-amber-500 bg-amber-500/20 scale-105 shadow-lg z-10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <img src={eff.image} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                    <span className="text-[10px] sm:text-xs font-bold text-white uppercase block text-center truncate px-1">{eff.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            {/* ACTION ROW */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
                                <div className="space-y-3 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">🎬 Action</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 w-full">
                                        {MAGIC_ACTIONS.map(act => (
                                            <button
                                                key={act.id}
                                                onClick={() => setAction(prev => prev === act.id ? undefined : act.id)}
                                                className={cn(
                                                    "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden transition-all",
                                                    action === act.id ? "border-blue-500 bg-blue-500/20 scale-105 shadow-lg z-10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <img src={act.image} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                    <span className="text-[10px] sm:text-xs font-bold text-white uppercase block text-center truncate px-1">{act.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>

                            {/* Controls Section */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-4">
                                {/* 1. CHOOSE SPELL */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center gap-2">🪄 Choose Spell</h3>
                                        <span className="text-xs font-bold text-yellow-400">{(SPELLS as any)[selectedSpell]?.cost || 10} Credits</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <button onClick={() => { setSelectedSpell('quick'); setVideoPrompt(prev => prev.slice(0, 50)); }}
                                            className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden aspect-square",
                                                selectedSpell === 'quick' ? "ring-2 ring-blue-400 bg-slate-700/80 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}>
                                            <img src={spellQuickIcon} alt="Quick" className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1.5">
                                                <div className="text-sm font-bold text-white drop-shadow-lg text-center">Quick</div>
                                                <div className="text-[10px] text-slate-200 drop-shadow-md text-center">4s</div>
                                            </div>
                                        </button>

                                        <div className="relative group">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-[9px] px-2 py-0.5 rounded-full text-white font-bold whitespace-nowrap z-20 shadow-lg border border-purple-400">BEST</div>
                                            <button onClick={() => { setSelectedSpell('story'); setVideoPrompt(prev => prev.slice(0, 120)); }}
                                                className={cn("w-full h-full flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden aspect-square",
                                                    selectedSpell === 'story' ? "ring-2 ring-purple-500 bg-slate-700/80 border-transparent shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}>
                                                <img src={spellStoryIcon} alt="Story" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1.5">
                                                    <div className="text-sm font-bold text-white drop-shadow-lg text-center">Story</div>
                                                    <div className="text-[10px] text-slate-200 drop-shadow-md text-center">8s</div>
                                                </div>
                                            </button>
                                        </div>

                                        <button onClick={() => { setSelectedSpell('cinema'); }}
                                            className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden aspect-square",
                                                selectedSpell === 'cinema' ? "ring-2 ring-yellow-500 bg-slate-700/80 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}>
                                            <img src={spellCinemaIcon} alt="Cinema" className="absolute inset-0 w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1.5">
                                                <div className="text-sm font-bold text-white drop-shadow-lg text-center">Cinema</div>
                                                <div className="text-[10px] text-yellow-200 drop-shadow-md text-center">HD 720P</div>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* 2. AUDIO MODE & SOUND TOGGLE */}
                                <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center gap-2">🎙️ Audio Mode</h3>

                                        {/* Mute/Sound Toggle Switch */}
                                        <button
                                            onClick={() => setIsSoundOn(!isSoundOn)}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-bold",
                                                isSoundOn ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-slate-700/50 border-slate-600 text-slate-400"
                                            )}
                                        >
                                            {isSoundOn ? (
                                                <>
                                                    <span className="text-sm">🔊</span>
                                                    <span>Sound ON</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-sm">🔇</span>
                                                    <span>Sound OFF</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div className={cn("transition-opacity duration-300", !isSoundOn && "opacity-50 pointer-events-none grayscale")}>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setAudioMode('talk')}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden aspect-square",
                                                    audioMode === 'talk' ? "ring-2 ring-pink-400 bg-pink-500/20 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                <img src={audioTalkIcon} alt="Talk" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1.5">
                                                    <div className="text-sm font-bold text-white drop-shadow-lg text-center">Talk</div>
                                                    <div className="text-[10px] text-slate-200 drop-shadow-md text-center">Character speaks</div>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setAudioMode('scene')}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden aspect-square",
                                                    audioMode === 'scene' ? "ring-2 ring-blue-400 bg-blue-500/20 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                <img src={audioSceneIcon} alt="Scene" className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1.5">
                                                    <div className="text-sm font-bold text-white drop-shadow-lg text-center">Scene</div>
                                                    <div className="text-[10px] text-slate-200 drop-shadow-md text-center">Background music</div>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Scene Mood - Only show in Scene mode */}
                                        {audioMode === 'scene' && (
                                            <div className="mt-4">
                                                <h4 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Scene Mood</h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button
                                                        onClick={() => setSceneMood('happy')}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-all relative overflow-hidden aspect-square",
                                                            sceneMood === 'happy' ? "ring-2 ring-yellow-300 bg-yellow-400/20 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <img src={moodHappyIcon} alt="Happy" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                            <div className="text-[10px] font-bold text-white drop-shadow-md text-center">Happy</div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => setSceneMood('mysterious')}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-all relative overflow-hidden aspect-square",
                                                            sceneMood === 'mysterious' ? "ring-2 ring-purple-300 bg-purple-400/20 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <img src={moodMysteryIcon} alt="Mystery" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                            <div className="text-[10px] font-bold text-white drop-shadow-md text-center">Mystery</div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => setSceneMood('action')}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-all relative overflow-hidden aspect-square",
                                                            sceneMood === 'action' ? "ring-2 ring-blue-300 bg-blue-400/20 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <img src={moodActionIcon} alt="Action" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                            <div className="text-[10px] font-bold text-white drop-shadow-md text-center">Action</div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Voice Style - Only show in Talk mode */}
                                        {audioMode === 'talk' && (
                                            <div className="mt-4">
                                                <h4 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">Voice Style</h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <button
                                                        onClick={() => setVoiceStyle('cute')}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-all relative overflow-hidden aspect-square",
                                                            voiceStyle === 'cute' ? "ring-2 ring-pink-300 bg-pink-400/20 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <img src={voiceCuteIcon} alt="Cute" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                            <div className="text-[10px] font-bold text-white drop-shadow-md text-center">Cute</div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => setVoiceStyle('robot')}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-all relative overflow-hidden aspect-square",
                                                            voiceStyle === 'robot' ? "ring-2 ring-cyan-300 bg-cyan-400/20 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <img src={voiceRobotIcon} alt="Robot" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                            <div className="text-[10px] font-bold text-white drop-shadow-md text-center">Robot</div>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => setVoiceStyle('monster')}
                                                        className={cn(
                                                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-all relative overflow-hidden aspect-square",
                                                            voiceStyle === 'monster' ? "ring-2 ring-green-300 bg-green-400/20 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        <img src={voiceMonsterIcon} alt="Monster" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                            <div className="text-[10px] font-bold text-white drop-shadow-md text-center">Monster</div>
                                                        </div>
                                                    </button>
                                                </div>

                                                {/* Character Speech Input - Talk mode needs text for lip-sync */}
                                                <div className="mt-4">
                                                    <h4 className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">💬 What should your character say?</h4>
                                                    <div className="relative">
                                                        <textarea
                                                            value={textInput}
                                                            onChange={e => {
                                                                const maxChars = selectedSpell === 'cinema' ? 180 : selectedSpell === 'story' ? 100 : 40;
                                                                setTextInput(e.target.value.slice(0, maxChars));
                                                            }}
                                                            placeholder='e.g., "Hello everyone! I love you!"'
                                                            className="w-full h-24 bg-slate-900/50 border-2 border-pink-500/30 rounded-xl p-3 pr-24 pl-10 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-pink-500/70 transition-colors text-sm"
                                                            maxLength={selectedSpell === 'cinema' ? 180 : selectedSpell === 'story' ? 100 : 40}
                                                        />

                                                        {/* Clear Button */}
                                                        {textInput && (
                                                            <button
                                                                onClick={() => setTextInput('')}
                                                                className="absolute left-2 top-2 p-2 rounded-lg hover:bg-slate-700/50 transition-all group"
                                                                title="Clear text"
                                                            >
                                                                <div className="text-lg text-slate-400 group-hover:text-white transition-colors">
                                                                    ✕
                                                                </div>
                                                            </button>
                                                        )}

                                                        {/* Mic Button */}
                                                        <button
                                                            onClick={() => {
                                                                if (isListening) handleStopListen();
                                                                else handleListen();
                                                            }}
                                                            className={cn(
                                                                "absolute right-2 top-2 p-2 rounded-lg transition-all group",
                                                                isListening ? "bg-red-500/20 animate-pulse" : "hover:bg-pink-500/20"
                                                            )}
                                                            title={isListening ? "Stop Listening" : "Click to Speak"}
                                                        >
                                                            <div className={cn("text-xl transition-transform", isListening ? "scale-110" : "group-hover:scale-110")}>
                                                                {isListening ? "⏹️" : "🎙️"}
                                                            </div>
                                                        </button>

                                                        <div className="absolute bottom-2 right-2 text-[10px] text-slate-500">
                                                            {textInput.length}/{selectedSpell === 'cinema' ? 180 : selectedSpell === 'story' ? 100 : 40}
                                                        </div>
                                                    </div>

                                                    {/* Suggestions Chips */}
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {["Hello! I love you!", "Sing a song", "Tell me a joke", "Happy Birthday!"].map(text => (
                                                            <button
                                                                key={text}
                                                                onClick={() => setTextInput(text)}
                                                                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] text-white/70 transition-colors"
                                                            >
                                                                {text}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-pink-400/70 mt-2">✨ Tap a suggestion or type your own!</p>
                                                </div>
                                            </div>
                                    </div>
                                </div>



                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-3xl font-black text-xl flex flex-col items-center justify-center"
                                >
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="w-6 h-6" />
                                        <span>Generate!</span>
                                    </div>
                                    <span className="text-xs font-bold text-white/70 bg-black/20 px-3 py-0.5 rounded-full mt-1">-{calculateCredits()} Credits</span>
                                </button>
                            </motion.div>
                        </div>
                    )}

                    {/* STEP 3 & 4: GENERATING & FINISHED */}
                    {
                        (step === 'generating' || step === 'finished') && (
                            <div className="w-full max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
                                {step === 'generating' ? (
                                    <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center text-center">
                                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                                        <h3 className="text-xl font-bold text-white mb-2">{statusMessage || "AI is casting magic..."}</h3>
                                        <div className="w-full h-4 bg-black/30 rounded-full overflow-hidden mt-4">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                        </div>
                                        <span className="text-sm font-bold text-purple-300 mt-2">{Math.round(progress)}%</span>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                                        <h2 className="text-white text-3xl font-black mb-6 text-center">🎉 Your Magic Video!</h2>

                                        {/* Generation Parameters */}
                                        {resultData?.params && (
                                            <div className="flex flex-wrap gap-2 justify-center mb-6">
                                                <span className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-200 text-sm font-bold flex items-center gap-1">
                                                    🎬 {MAGIC_ACTIONS.find(a => a.id === resultData.params?.action)?.label || 'Dance'}
                                                </span>
                                                {resultData.params?.style && (
                                                    <span className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/50 rounded-full text-emerald-200 text-sm font-bold flex items-center gap-1">
                                                        🎨 {MAGIC_STYLES.find(s => s.id === resultData.params?.style)?.label}
                                                    </span>
                                                )}
                                                {resultData.params?.effect && (
                                                    <span className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-200 text-sm font-bold flex items-center gap-1">
                                                        ✨ {MAGIC_EFFECTS.find(e => e.id === resultData.params?.effect)?.label}
                                                    </span>
                                                )}
                                                <span className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-200 text-sm font-bold flex items-center gap-1">
                                                    🪄 {resultData.params?.spell && (SPELLS as any)[resultData.params.spell as string]?.name} ({resultData.params?.duration}s)
                                                </span>
                                            </div>
                                        )}

                                        {/* Debug: Log resultData */}
                                        {console.log('[MagicMovie] resultData:', resultData)}
                                        {console.log('[MagicMovie] videoUrl:', resultData?.videoUrl)}

                                        <div className="rounded-2xl overflow-hidden mb-6 bg-black shadow-2xl flex justify-center bg-black/50 backdrop-blur-sm">
                                            <video
                                                key={resultData?.videoUrl}
                                                src={resultData?.videoUrl}
                                                controls
                                                loop
                                                playsInline
                                                preload="metadata"
                                                className="w-full max-h-[70vh] aspect-square md:aspect-video bg-black"
                                                onError={(e) => {
                                                    console.error('Video load error:', e);
                                                    // Fallback: user can still download via proxy
                                                }}
                                            >
                                                <source src={resultData?.videoUrl} type="video/mp4" />
                                                Your browser doesn't support video playback. Click Download to view the video.
                                            </video>
                                        </div>
                                        <div className="space-y-4">
                                            {/* Action Buttons */}
                                            <div className="flex flex-wrap gap-4 justify-center">
                                                <button
                                                    onClick={handleDownload}
                                                    disabled={isDownloading}
                                                    className={cn(
                                                        "px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-full transition-all flex items-center gap-2 shadow-lg",
                                                        isDownloading ? "opacity-70 cursor-wait" : "hover:scale-105"
                                                    )}
                                                >
                                                    {isDownloading ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Downloading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-5 h-5" />
                                                            Download
                                                        </>
                                                    )}
                                                </button>
                                                <button onClick={handleRemix} className="px-6 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 hover:scale-105 transition-all flex items-center gap-2">
                                                    <RefreshCw className="w-5 h-5" /> Try Again
                                                </button>
                                                <button onClick={handleReset} className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-full hover:scale-105 transition-all flex items-center gap-2 shadow-lg">
                                                    <ArrowRight className="w-5 h-5" /> New Magic
                                                </button>
                                            </div>

                                            {/* Social Share Buttons */}
                                            <div className="flex flex-col items-center gap-3">
                                                <p className="text-white/70 text-sm font-bold">Share on social media:</p>
                                                <div className="flex gap-3 justify-center">
                                                    <button
                                                        onClick={() => shareToSocial('facebook')}
                                                        className="p-3 bg-blue-600 rounded-full hover:scale-110 transition-transform shadow-lg"
                                                        title="Share on Facebook"
                                                    >
                                                        <Share2 className="w-5 h-5 text-white" />
                                                    </button>
                                                    <button
                                                        onClick={() => shareToSocial('instagram')}
                                                        className="p-3 bg-gradient-to-br from-purple-600 via-pink-600 to-yellow-500 rounded-full hover:scale-110 transition-transform shadow-lg"
                                                        title="Share on Instagram"
                                                    >
                                                        <Instagram className="w-5 h-5 text-white" />
                                                    </button>
                                                    <button
                                                        onClick={() => shareToSocial('twitter')}
                                                        className="p-3 bg-black rounded-full hover:scale-110 transition-transform shadow-lg"
                                                        title="Share on X (Twitter)"
                                                    >
                                                        <Twitter className="w-5 h-5 text-white" />
                                                    </button>
                                                    <button
                                                        onClick={() => shareToSocial('tiktok')}
                                                        className="p-3 bg-black rounded-full hover:scale-110 transition-transform shadow-lg"
                                                        title="Share on TikTok"
                                                    >
                                                        <Music className="w-5 h-5 text-white" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Puzzle Integration */}
                                        {showPuzzle && imagePreview && (
                                            <PuzzleGame imageUrl={imagePreview} imageId={`animation-${Date.now()}`} onClose={() => setShowPuzzle(false)} videoUrl={resultData?.videoUrl} />
                                        )}
                                        <div className="mt-8 flex justify-center">
                                            <PuzzleButton onClick={() => setShowPuzzle(true)} disabled={!imagePreview} />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )
                    }

                </div >

                {/* Cropper Modal */}
                {
                    cropImage && (
                        <ImageCropperModal
                            imageUrl={cropImage}
                            onCrop={handleCropComplete}
                            onCancel={() => setCropImage(null)}
                            aspectRatio={1}
                        />
                    )
                }
                <MagicNavBar />
            </div>
        </div >
    );
};
