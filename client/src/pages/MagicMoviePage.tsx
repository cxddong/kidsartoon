import React, { useState, useRef, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Play, RefreshCw, Video, Upload, Wand2, Volume2, VolumeX, CloudUpload, Sparkles, MoveLeft, Mic, Pause, X, Download, Share2, Facebook, Twitter, Instagram, Music } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenerationCancelButton from '../components/GenerationCancelButton';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { AuthButton } from '../components/auth/AuthButton';
import { useAuth } from '../context/AuthContext';
import { MAGIC_ACTIONS, OBJECT_ACTIONS, MAGIC_STYLES, MAGIC_EFFECTS, VIDEO_DURATION_OPTIONS } from '../components/builder/AnimationBuilderPanel';
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
import voiceRobotIcon from '../assets/voices/robot.jpg';
import voiceMonsterIcon from '../assets/voices/monster.jpg';
import voiceGirlIcon from '../assets/voices/girl.jpg';
import voiceBoyIcon from '../assets/voices/boy.jpg';
import voiceWomanIcon from '../assets/voices/woman.jpg';
import voiceManIcon from '../assets/voices/man.png';
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


// Memoized Video Player Component to prevent re-render flickering
const MemoVideoPlayer = memo(({ url, poster, initialMuted = true }: { url: string; poster?: string; initialMuted?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(initialMuted);

    // Autoplay handling: if browser blocks autoplay with sound, try muted playback
    const handleAutoPlay = () => {
        if (videoRef.current) {
            // First try to play with current mute settings
            videoRef.current.muted = isMuted;
            videoRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(() => {
                    console.log("Autoplay blocked, attempting muted fallback");
                    if (videoRef.current && !isMuted) {
                        // If failed and was unmuted, try muting
                        videoRef.current.muted = true;
                        setIsMuted(true);
                        videoRef.current.play().then(() => setIsPlaying(true));
                    }
                });
        }
    };

    const togglePlay = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        const newMuted = !videoRef.current.muted;
        videoRef.current.muted = newMuted;
        setIsMuted(newMuted);
    };

    return (
        <div className="relative group w-full bg-black rounded-xl overflow-hidden shadow-2xl" onClick={() => togglePlay()}>
            <video
                ref={videoRef}
                src={url}
                poster={poster}
                autoPlay
                muted={isMuted} // Controlled by state
                loop
                playsInline
                preload="auto"
                className="w-full max-h-[70vh] aspect-square md:aspect-video bg-black"
                onLoadedData={handleAutoPlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => console.error('Video load error:', e)}
            />

            {/* Premium Control Overlay */}
            <div className={cn(
                "absolute inset-0 flex items-center justify-center transition-all duration-300 bg-black/20",
                isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
            )}>
                <button
                    onClick={togglePlay}
                    className="p-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                    {isPlaying ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" className="ml-1" />}
                </button>
            </div>

            {/* Mute Toggle (Top Right) */}
            <button
                onClick={toggleMute}
                className="absolute top-4 right-4 p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-black/60 transition-all z-20 group/mute"
            >
                {isMuted ? (
                    <div className="flex items-center gap-2">
                        <VolumeX size={20} />
                        <span className="text-[10px] font-bold overflow-hidden max-w-0 group-hover/mute:max-w-[100px] transition-all duration-300">Tap to Unmute</span>
                    </div>
                ) : (
                    <Volume2 size={20} />
                )}
            </button>
        </div>
    );
});

export const MagicMoviePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, activeProfile } = useAuth();
    const [step, setStep] = useState<Step>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Subject Type (New V4.0)
    const [subjectType, setSubjectType] = useState<'character' | 'object'>('character');

    // Params
    const [action, setAction] = useState<string | undefined>(MAGIC_ACTIONS[0].id);
    const [style, setStyle] = useState<string | undefined>();
    const [effect, setEffect] = useState<string | undefined>();
    const [selectedSpell, setSelectedSpell] = useState<'quick' | 'story' | 'cinema'>('story');
    const [videoPrompt, setVideoPrompt] = useState<string>(''); // For tags/prompt enrichment

    // NEW: Audio Params
    const [audioMode, setAudioMode] = useState<'talk' | 'scene'>('talk');
    const [voiceStyle, setVoiceStyle] = useState<'cute' | 'girl' | 'boy' | 'woman' | 'man' | 'robot' | 'monster'>('girl');
    const [sceneMood, setSceneMood] = useState<'happy' | 'mysterious' | 'action'>('happy');
    const [textInput, setTextInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [isSoundOn, setIsSoundOn] = useState(true);

    // Generation State
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [progress, setProgress] = useState(0);
    const [resultData, setResultData] = useState<any>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Puzzle State
    const [showPuzzle, setShowPuzzle] = useState(false);

    const [renderId] = useState(() => Date.now().toString()); // Persistent ID for the current session

    const memoizedVideoUrl = useMemo(() => {
        if (!resultData?.videoUrl) return '';

        // If it's an original URL from Volcengine or Firebase, return it directly (usually supports streaming)
        // Only use the download proxy when the download button is clicked
        return resultData.videoUrl;
    }, [resultData?.videoUrl, renderId]);


    const addTag = (tag: string) => { setVideoPrompt(prev => (tag + ' ' + prev).substring(0, (SPELLS as any)[selectedSpell].limit)); };

    const calculateCredits = (): number => {
        return (SPELLS as any)[selectedSpell].cost;
    };

    React.useEffect(() => {
        // Handle Remix or Seamless Handoff
        // @ts-ignore
        let remixUrl = location.state?.remixImage || location.state?.preloadedImage || location.state?.autoUploadImage || sessionStorage.getItem('pending-art-upload');

        // V3 Fix: Timeout for stability
        setTimeout(() => {
            let foundUrl = sessionStorage.getItem('magic_art_handoff');
            console.log("🔍 [MagicMovie] Checking SessionStorage (V3). Found:", foundUrl ? "YES" : "NO");

            if (foundUrl) {
                remixUrl = foundUrl;
                setImagePreview(remixUrl);
                setStep('params');

                // Fetch Blob
                fetch(remixUrl)
                    .then(res => res.blob())
                    .then(blob => setImageFile(new File([blob], "remix.png", { type: blob.type })))
                    .catch(e => console.error("Blob failed", e));
            }
        }, 100);

        // Handle Navigation State immediately (if exists)
        if (remixUrl) {
            fetch(remixUrl)
                .then(res => res.blob())
                .then(blob => {
                    console.log("[MagicMovie] ✅ Blob created. Size:", blob.size);
                    const file = new File([blob], "remix.png", { type: blob.type });
                    setImageFile(file);
                })
                .catch(err => {
                    console.warn("[MagicMovie] Fetch failed, trying direct DataURL conversion:", err);
                    try {
                        const arr = remixUrl.split(',');
                        const mime = arr[0].match(/:(.*?);/)[1];
                        const bstr = atob(arr[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) {
                            u8arr[n] = bstr.charCodeAt(n);
                        }
                        const file = new File([u8arr], "remix.png", { type: mime });
                        setImageFile(file);
                    } catch (e) {
                        console.error("[MagicMovie] ❌ Failed all file conversion methods:", e);
                    }
                });
        }
    }, [location.state]);



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
        if (activeProfile) {
            formData.append('profileId', activeProfile.id);
        }

        // NEW: Audio Mode and Voice Style parameters
        formData.append('audioMode', audioMode); // 'talk' or 'scene'
        formData.append('voiceStyle', voiceStyle); // 'cute', 'robot', 'monster'
        formData.append('sceneMood', sceneMood); // 'happy', 'mysterious', 'action'

        // Construct Detailed Prompt from Action/Style/Effect selections
        // Construct Detailed Prompt from Action/Style/Effect selections
        // Backend (Seedance 1.5) ignores raw IDs, so we must send text descriptions
        const allActions = [...MAGIC_ACTIONS, ...OBJECT_ACTIONS];
        const selectedActionObj = allActions.find(a => a.id === action);
        const actionPrompt = selectedActionObj?.prompt || '';

        // NEW: Handle Camera Movement (for Object Magic)
        if (selectedActionObj && (selectedActionObj as any).camera) {
            formData.append('camera_movement', (selectedActionObj as any).camera);
        }

        const stylePrompt = MAGIC_STYLES.find(s => s.id === style)?.prompt || '';
        const effectPrompt = MAGIC_EFFECTS.find(e => e.id === effect)?.prompt || '';

        // Combine with any manual videoPrompt (tags)
        // Combine with any manual videoPrompt (tags)
        // V4.0 Prompt Structure: Subject -> Action -> Style -> Mood
        const fullPrompt = `subject: ${subjectType}, action: ${actionPrompt}, style: ${stylePrompt}, effect: ${effectPrompt}, scene: ${sceneMood} mood, ${textInput || ''} ${videoPrompt}`.trim();

        formData.append('videoPrompt', fullPrompt);
        formData.append('subjectType', subjectType);

        if (textInput.trim()) {
            formData.append('textInput', textInput.trim()); // User's speech/scene description
        }


        try {
            setStatusMessage('Sending to Magic Kat...');
            const response = await fetch('/api/media/image-to-video/task', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                try {
                    const errorData = JSON.parse(errorText);
                    throw new Error(errorData.error || `Server Error: ${response.status}`);
                } catch (e) {
                    throw new Error(`Server Error (${response.status}): ${errorText.substring(0, 100)}`);
                }
            }

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Server response parse error:', responseText);
                throw new Error('Invalid server response (not JSON)');
            }

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

            setStatusMessage('Magic Kat is generating video...');

            // Simulated progress (since backend doesn't provide real progress)
            let simulatedProgress = 0;
            let isCompleted = false; // Guard flag to prevent race conditions

            const progressInterval = setInterval(() => {
                if (isCompleted) return; // Exit if already completed
                simulatedProgress += 2;
                if (simulatedProgress < 90) {
                    setProgress(simulatedProgress);
                }
            }, 1000);

            const pollInterval = setInterval(async () => {
                if (isCompleted) return; // Exit immediately if already completed

                try {
                    const statusRes = await fetch(`/api/media/image-to-video/status/${taskId}`);
                    const statusData = await statusRes.json();

                    // Double-check guard flag before processing (in case of concurrent request)
                    if (isCompleted) return;

                    // Map backend status to frontend
                    if (statusData.status === 'SUCCEEDED' && statusData.videoUrl) {
                        isCompleted = true; // Set flag FIRST to prevent any further processing
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
                        isCompleted = true; // Lock to prevent further processing
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
                    isCompleted = true;
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
                muted={true}
                playsInline
                crossOrigin="anonymous"
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
                            className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-start justify-center gap-12 min-h-[60vh] px-4"
                        >
                            {/* Left Col: Upload Box */}
                            <div className="flex-1 w-full max-w-xl flex flex-col items-center">
                                <h2 className="text-xl md:text-3xl font-black text-white mb-8 text-center drop-shadow-lg">First, choose a picture! 📸</h2>

                                <div className="relative w-full aspect-[4/3] bg-slate-800/50 rounded-3xl border-4 border-dashed border-white/20 hover:border-purple-400/50 transition-colors group cursor-pointer overflow-hidden flex flex-col items-center justify-center shadow-2xl"
                                    onClick={() => document.getElementById('anim-upload')?.click()}>

                                    {/* Background Video Hint */}
                                    <video src={generateVideo} autoPlay loop muted playsInline disablePictureInPicture className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-60 group-hover:opacity-80 transition-opacity" />

                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="bg-black/50 p-4 rounded-full mb-3 backdrop-blur-sm border border-white/10 group-hover:scale-110 transition-transform">
                                            <Upload className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-white font-bold text-lg drop-shadow-md">Click to Upload</span>
                                        <span className="text-white/70 text-sm mt-1">or drag & drop</span>
                                    </div>

                                    <input type="file" id="anim-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </div>

                                {/* Mobile Tip - Visible only on small screens */}
                                <div className="lg:hidden mt-8 w-full">
                                    <div className="bg-blue-500/20 border-2 border-blue-400/50 rounded-2xl p-5 backdrop-blur-sm">
                                        <p className="text-white/90 text-sm leading-relaxed text-center">
                                            💡 <strong>Tip:</strong> For best results, use colorful drawings! Try{' '}
                                            <button
                                                onClick={() => navigate('/magic-art', { state: { returnTo: location.pathname } })}
                                                className="font-bold text-yellow-300 hover:text-yellow-200 underline"
                                            >
                                                KAT Coloring
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Col: Desktop Tip - Visible only on large screens, standard flow */}
                            <div className="hidden lg:block w-80 pt-24 shrink-0">
                                <div className="bg-indigo-900/40 border-2 border-indigo-400/30 rounded-3xl p-6 backdrop-blur-xl shadow-xl sticky top-24">
                                    <h3 className="text-indigo-200 font-bold mb-3 flex items-center gap-2">
                                        <Sparkles className="w-5 h-5" />
                                        <span>Pro Tips</span>
                                    </h3>
                                    <p className="text-white/80 text-sm leading-relaxed mb-4">
                                        Full-body characters work best! Make sure arms and legs are visible for cool dance moves.
                                    </p>
                                    <div className="bg-black/20 rounded-xl p-3 mb-4">
                                        <p className="text-white/90 text-xs">
                                            Try coloring your art first in{' '}
                                            <button
                                                onClick={() => navigate('/magic-art', { state: { returnTo: location.pathname } })}
                                                className="font-bold text-yellow-300 hover:text-yellow-200 underline transition-colors"
                                            >
                                                KAT Coloring
                                            </button>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 text-xs text-white/50">
                                        <span>✨ Colored Art</span>
                                        <span>•</span>
                                        <span>🧍 Full Body</span>
                                    </div>
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

                                {/* SUBJECT TYPE SELECTOR (New Requirement) */}
                                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 bg-slate-900/60 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                                    <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">❓ What did you draw?</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => { setSubjectType('character'); setAction(MAGIC_ACTIONS[0].id); }}
                                            className={cn(
                                                "relative p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all overflow-hidden group",
                                                subjectType === 'character'
                                                    ? "bg-indigo-500/20 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <span className="text-4xl group-hover:scale-110 transition-transform">🦁</span>
                                            <div className="text-center">
                                                <div className="text-white font-bold text-lg">It's Alive!</div>
                                                <div className="text-[10px] text-white/50">Person, Animal, Robot</div>
                                            </div>
                                            {subjectType === 'character' && (
                                                <div className="absolute top-2 right-2 text-indigo-400">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                                                </div>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => { setSubjectType('object'); setAction(OBJECT_ACTIONS[0].id); setAudioMode('scene'); }}
                                            className={cn(
                                                "relative p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all overflow-hidden group",
                                                subjectType === 'object'
                                                    ? "bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400"
                                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}
                                        >
                                            <span className="text-4xl group-hover:scale-110 transition-transform">🏰</span>
                                            <div className="text-center">
                                                <div className="text-white font-bold text-lg">It's an Object!</div>
                                                <div className="text-[10px] text-white/50">Toy, Building, Car</div>
                                            </div>
                                            {subjectType === 'object' && (
                                                <div className="absolute top-2 right-2 text-emerald-400">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>

                                {/* STYLE ROW */}
                                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 bg-slate-900/60 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
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
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 bg-slate-900/60 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
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
                                <div className="space-y-3 bg-slate-900/60 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
                                    <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                        🎬 {subjectType === 'character' ? 'Character Action' : 'Object Magic'}
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2 w-full">
                                        {(subjectType === 'character' ? MAGIC_ACTIONS : OBJECT_ACTIONS).map(act => (
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
                                            {subjectType === 'character' && (
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
                                            )}
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
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[
                                                        { id: 'girl', label: 'Girl', icon: voiceGirlIcon },
                                                        { id: 'boy', label: 'Boy', icon: voiceBoyIcon },
                                                        { id: 'woman', label: 'Lady', icon: voiceWomanIcon },
                                                        { id: 'man', label: 'Man', icon: voiceManIcon },
                                                        { id: 'cute', label: 'Cute', icon: voiceCuteIcon },
                                                        { id: 'robot', label: 'Robot', icon: voiceRobotIcon },
                                                        { id: 'monster', label: 'Monster', icon: voiceMonsterIcon },
                                                    ].map(v => (
                                                        <button
                                                            key={v.id}
                                                            onClick={() => setVoiceStyle(v.id as any)}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-0 rounded-xl border-2 transition-all relative overflow-hidden aspect-square group",
                                                                voiceStyle === v.id ? "border-pink-400 ring-2 ring-pink-300 ring-offset-2 ring-offset-slate-900 scale-105 z-10" : "border-transparent bg-white/5 hover:bg-white/10 hover:border-white/20"
                                                            )}
                                                        >
                                                            <img src={v.icon} alt={v.label} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                                <div className="text-[10px] font-bold text-white text-center leading-tight">{v.label}</div>
                                                            </div>
                                                        </button>
                                                    ))}
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
                                        )}
                                    </div>
                                </div>



                                {/* Generate Button */}
                                <button
                                    type="button"
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
                                        <h3 className="text-xl font-bold text-white mb-2">{statusMessage || "Magic Kat is casting magic..."}</h3>
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

                                        <div className="mb-6 flex justify-center">
                                            <MemoVideoPlayer
                                                url={memoizedVideoUrl}
                                                poster={imagePreview || undefined}
                                                initialMuted={!isSoundOn} // Respect user's sound preference
                                            />
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
