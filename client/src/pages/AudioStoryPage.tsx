import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Upload, Sparkles, Check, Play, Pause, ArrowLeft, Music, Heart, Zap, Hand, Lock, Volume, Smile, Moon, Rocket, Gift, Castle, Wand2, Snowflake, TreeDeciduous, Footprints, Globe, Fish, Flame, Palette, PawPrint, Users, Cake, Waves, CloudUpload, RotateCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenerationCancelButton from '../components/GenerationCancelButton';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { playAudioWithPitchShift } from '../lib/audioUtils';
import { VIPCover } from '../components/ui/VIPCover';


import audioStoryBg from '../assets/audio.mp4';

// const backgroundUrl = '/bg_cartoon_new.jpg';

import { STORY_STYLES, MOODS, VOICES, CONTENT_TAGS, MODELS, type StoryBuilderData } from '../data/storyOptions';
import { StoryBuilderPanel } from '../components/builder/StoryBuilderPanel';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { VoiceRecorderModal } from '../components/modals/VoiceRecorderModal';

export const AudioStoryPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, activeProfile } = useAuth();

    // Voice Cloning State
    const [isRecorderOpen, setIsRecorderOpen] = useState(false);
    const [justClonedVoiceId, setJustClonedVoiceId] = useState<string | null>(null); // To auto-retry generation

    // Steps: 1:Upload, 2:Audio/Story, 3:Result
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Fair Use: Cooldown & Recharge
    const [isRecharging, setIsRecharging] = useState(false);
    const [rechargeTime, setRechargeTime] = useState(0);

    const startRecharge = () => {
        setIsRecharging(true);
        setRechargeTime(15);
        const interval = setInterval(() => {
            setRechargeTime(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsRecharging(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Data State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Cropper State
    const [cropImage, setCropImage] = useState<string | null>(null);

    // Community Gallery Data
    const [galleryImages, setGalleryImages] = useState<any[]>([]);

    React.useEffect(() => {
        fetch('/api/images/public?type=story')
            .then(res => res.json())
            .then(data => setGalleryImages(data))
            .catch(err => console.error("Failed to load gallery:", err));
    }, []);

    // Handle Remix / Incoming Data
    React.useEffect(() => {
        // Support regular state transfer OR robust session storage transfer
        let imgUrl = location.state?.remixImage || location.state?.autoUploadImage;

        if (sessionStorage.getItem('magic_art_handoff')) {
            console.log("[AudioStory] 📦 Found image in Session Storage");
            imgUrl = sessionStorage.getItem('magic_art_handoff');
            // sessionStorage.removeItem('magic_art_handoff'); // Keep for robust re-mounts
        }

        if (imgUrl) {
            console.log("[AudioStory] 📥 Received Auto-Fill Image");
            setImagePreview(imgUrl);
            // setStep(2); // Auto-advance removed
        }
    }, [location]);

    // Removed redundant local story settings state
    const [storyData, setStoryData] = useState<any>(null); // {text, audioUrl}
    const [usedParams, setUsedParams] = useState<StoryBuilderData | null>(null);

    // Audio Player State
    const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Cleanup: Stop audio when leaving page
    useEffect(() => {
        return () => {
            // Stop HTML5 audio
            if (audioRef) {
                audioRef.pause();
                audioRef.currentTime = 0;
            }
            // Stop browser TTS
            window.speechSynthesis.cancel();
        };
    }, [audioRef]);

    // Handlers
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Use createObjectURL for performance
            const url = URL.createObjectURL(file);
            // Bypass cropper - direct upload
            setImagePreview(url);
            setImageFile(file);

            // Clear input
            e.target.value = '';
        }
    };

    const handleCropComplete = (blob: Blob) => {
        if (!cropImage) return;
        const url = URL.createObjectURL(blob);
        const file = new File([blob], "story-image.jpg", { type: "image/jpeg" });

        setImagePreview(url);
        setImageFile(file);
        setCropImage(null);
    };

    const [estTime, setEstTime] = useState('');

    const runProgress = (durationSeconds: number = 30) => {
        setProgress(0);
        // Calculate step to reach 95% in durationSeconds (10 updates per sec)
        const step = 95 / (durationSeconds * 10);
        const interval = setInterval(() => {
            setProgress(prev => (prev >= 95 ? prev : Math.min(prev + step, 95)));
        }, 100);
        return interval;
    };

    const toggleAudio = (url: string) => {
        if (audioRef) {
            if (isPlaying) {
                audioRef.pause();
                setIsPlaying(false);
            } else {
                audioRef.play();
                setIsPlaying(true);
            }
        } else {
            const audio = new Audio(url);
            audio.onended = () => setIsPlaying(false);
            setAudioRef(audio);
            audio.play();
            setIsPlaying(true);
        }
    };

    // playVoiceDemo logic moved to StoryBuilderPanel.tsx

    const goBack = () => {
        // Unified layout: Go directly home
        navigate('/home');
    };

    const stopAudio = () => {
        if (audioRef) {
            audioRef.pause();
            audioRef.currentTime = 0;
            setIsPlaying(false);
        }
        window.speechSynthesis.cancel(); // Stop browser TTS too
    };

    const speakBrowser = (text: string) => {
        window.speechSynthesis.cancel();
        if (isPlaying) {
            setIsPlaying(false);
            return;
        }
        const cleanText = text.replace(/[*#_`~]/g, '')
            .replace(/Title:/i, '')
            .replace(/\[.*?\]/g, '')
            .trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        // Try to select a decent voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Zira'));
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => setIsPlaying(false);
        utterance.onstart = () => setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    const generateStory = async (builderData: StoryBuilderData) => {
        // 1. Check for My Voice
        if (builderData.voice === 'my_voice') {
            const hasCustomVoice = user?.customVoice?.voiceId || justClonedVoiceId;
            if (!hasCustomVoice) {
                // Open Recorder
                setIsRecorderOpen(true);
                return; // Stop flow
            }
        }

        if (!imageFile && !imagePreview) return;
        setUsedParams(builderData);
        setLoading(true);
        setEstTime('Estimated time: ~45 seconds');
        const interval = runProgress(45);

        // Timeout Controller (90s limit)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        try {
            // Lookup English Labels for Agent
            const styleLabel = STORY_STYLES.find(s => s.id === builderData.storyStyle)?.labels.en || builderData.storyStyle;
            const moodLabel = MOODS.find(m => m.id === builderData.mood)?.labels?.en || builderData.mood;

            // Gender Logic
            const userGender = activeProfile?.gender || user?.gender || 'child';
            const genderInstruction = userGender.toLowerCase() === 'boy' || userGender.toLowerCase() === 'male'
                ? "User is a BOY. Protagonist MUST be a BOY in the story. Use 'he/him'. Avoid feminine descriptions like 'long hair' or 'dress' unless visible."
                : userGender.toLowerCase() === 'girl' || userGender.toLowerCase() === 'female'
                    ? "User is a GIRL. Protagonist MUST be a GIRL in the story. Use 'she/her'."
                    : "Protagonist gender is neutral or based on image.";

            // Updated Prompt to emphasize Image Context + Visual Anchors
            const prompt = `
                                    ANALYZE the uploaded image in detail first. Then, create a short, engaging audio story based STRICTLY on the visible characters, setting, and actions in the image.
                                    
                                    User Context:
                                    - ${genderInstruction}
                                    
                                    Visual Anchors (Use these to pull lighting/texture from Context Cache):
                                    - Scene: ${styleLabel}
                                    - Mood/Vibe: ${moodLabel}
                                    
                                    Narration Voice: ${builderData.voice}
                                    
                                    LENGTH INSTRUCTION:
                                    ${builderData.modelTier === 'premium'
                    ? 'CRITICAL: Write a LONG, EPIC story (approx 300 words). It should take at least 3 minutes to read. Include dialogue, detailed descriptions, and a complex plot.'
                    : 'Write a short, punchy story (approx 60-80 words). Keep it simple and quick.'}
                                    
                                    Rules: Friendly narration tone. DO NOT make up generic elements; use what is seen in the picture.
                                    `.trim();

            const formData = new FormData();
            if (imageFile) {
                formData.append('image', imageFile);
            } else if (imagePreview) {
                formData.append('imageUrl', imagePreview);
            }
            formData.append('voiceText', prompt);
            formData.append('voice', builderData.voice);
            if (builderData.voice === 'my_voice') {
                // Robust Custom Voice Lookup
                let myVoiceId = justClonedVoiceId;

                // Check Array (New Schema)
                if (!myVoiceId && user?.customVoices && Array.isArray(user.customVoices) && user.customVoices.length > 0) {
                    const lastVoice = user.customVoices[user.customVoices.length - 1];
                    myVoiceId = lastVoice.voiceId || lastVoice.id;
                }

                // Fallback to Legacy Object
                if (!myVoiceId) {
                    myVoiceId = user?.customVoice?.voiceId || '';
                }

                formData.append('customVoiceId', myVoiceId);
                console.log('[Frontend] Resolving My Voice ID:', myVoiceId);
            }
            formData.append('voiceTier', builderData.voiceTier);
            formData.append('modelTier', builderData.modelTier);
            formData.append('userId', user?.uid || 'demo');
            if (activeProfile?.id) formData.append('profileId', activeProfile.id);

            console.log('[Frontend] Sending Story Data:', {
                voice: builderData.voice,
                voiceTier: builderData.voiceTier,
                modelTier: builderData.modelTier,
                prompt: prompt.substring(0, 100) + '...'
            });

            const res = await fetch('/api/media/image-to-voice', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId); // Clear timeout on success response

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.details || errData.error || 'Story generation failed');
            }
            const data = await res.json();
            setStoryData(data);

            clearInterval(interval);
            setProgress(100);
            setTimeout(() => { setLoading(false); }, 500);
        } catch (e: any) {
            console.error(e);
            clearInterval(interval);
            setLoading(false);
            if (e.name === 'AbortError') {
                alert("Generation timed out. The server is taking too long. Please try again.");
            } else {
                alert("Oops! Failed to write story. " + (e.message || ""));
            }
        }
    };

    // Scroll Reset Logic
    const scrollRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [storyData]);

    return (
        <div className="fixed inset-0 w-full h-full bg-slate-50 flex flex-col z-[50]">
            {/* Header */}
            <div className="absolute top-0 left-0 p-4 z-50">
                <button onClick={goBack} className="p-2 bg-white/50 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-800" />
                </button>
            </div>

            {/* Content Area with Sidebars */}
            <div className="flex-1 relative w-full h-full flex overflow-hidden">

                {/* Background (Fixed) */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <video
                        src={audioStoryBg}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Main Center Column */}
                <div ref={scrollRef} className="flex-1 h-full overflow-y-auto relative pb-24">
                    <div className="relative z-10 p-6 pt-24 max-w-lg mx-auto min-h-full flex flex-col gap-8">

                        <AnimatePresence mode="wait">
                            {/* RESULT VIEW: If story generated, show result */}
                            {storyData ? (
                                <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl flex flex-col items-center gap-6">
                                    <div className="text-center w-full flex flex-col items-center">
                                        <div className="w-48 h-48 mb-6 shadow-2xl rounded-2xl">
                                            <VIPCover
                                                imageUrl={imagePreview!}
                                                isVIP={user?.plan === 'pro' || user?.plan === 'yearly_pro' || user?.plan === 'admin'}
                                                childName={user?.name}
                                                aspectRatio="square"
                                            />
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800">Story Ready!</h3>
                                        <p className="text-slate-500 text-sm font-bold mt-1">Listen to your story</p>
                                    </div>

                                    {/* Audio Player */}
                                    {storyData.audioUrl ? (
                                        <button
                                            onClick={() => toggleAudio(storyData.audioUrl)}
                                            className="w-full py-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                                            <span className="font-black text-xl">{isPlaying ? "Pause Story" : "Play Story"}</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => speakBrowser(storyData.story)}
                                            className="w-full py-6 bg-indigo-100/50 border-2 border-indigo-200 rounded-2xl flex items-center justify-center gap-3 text-indigo-600 shadow-sm hover:bg-indigo-100 transition-all"
                                        >
                                            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Volume2 className="w-8 h-8" />}
                                            <span className="font-black text-xl">{isPlaying ? "Stop Reading" : "Read for Me (Browser)"}</span>
                                        </button>
                                    )}

                                    {/* Actions */}
                                    <div className="w-full flex gap-3 mt-2">
                                        <button
                                            onClick={() => { setStoryData(null); stopAudio(); }}
                                            className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                                        >
                                            <RotateCw className="w-4 h-4" /> Make Another
                                        </button>
                                        <button
                                            onClick={() => navigate('/home')}
                                            className="flex-1 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 transition-colors"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                /* INPUT VIEW: Upload + Builder */
                                <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">

                                    {/* 1. Upload Section */}
                                    <div className="flex flex-col items-center gap-4">
                                        <div className={cn(
                                            "rounded-3xl flex flex-col items-center justify-center transition-all bg-white relative overflow-hidden shadow-xl border-4 border-white",
                                            !imagePreview ? "w-full aspect-video border-dashed border-purple-200 bg-white/50 backdrop-blur-md hover:bg-white/80 cursor-pointer" : "w-full aspect-square"
                                        )}
                                            onClick={() => document.getElementById('step1-upload')?.click()}
                                        >
                                            <input type="file" id="step1-upload" className="hidden" accept="image/*" onChange={handleUpload} />

                                            {imagePreview ? (
                                                <img src={imagePreview} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-purple-400">
                                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                                                        <CloudUpload className="w-8 h-8 text-purple-600" />
                                                    </div>
                                                    <span className="font-black text-lg">Click to Upload Image</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reset Upload Button (Small Text) only if needed */}
                                        {imagePreview && (
                                            <button
                                                onClick={() => { setImagePreview(null); setImageFile(null); }}
                                                className="text-xs font-bold text-slate-400 underline hover:text-red-500"
                                            >
                                                Change Image
                                            </button>
                                        )}
                                    </div>

                                    {/* 2. Builder Panel */}
                                    <StoryBuilderPanel
                                        imageUploaded={!!imageFile || !!imagePreview}
                                        onGenerate={generateStory}
                                        userId={user?.uid}
                                        isRecharging={isRecharging}
                                        rechargeTime={rechargeTime}
                                        userPlan={user?.plan}
                                    />

                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Universal Exit Button - Only show when generating */}
                        {loading && (
                            <div className="mt-auto pt-8 pb-12 flex justify-center">
                                <GenerationCancelButton
                                    isGenerating={loading}
                                    onCancel={() => navigate('/home')}
                                />
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Saving / Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <Wand2 className="w-10 h-10 text-purple-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">Weaving Magic...</h2>
                    <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">{estTime}</p>
                    {/* Progress Bar */}
                    <div className="w-64 h-3 bg-slate-100 rounded-full mt-8 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "linear" }}
                        />
                    </div>
                </div>
            )}


            {/* Cropper Modal Removed */}

            {/* Voice Recorder Modal */}
            <VoiceRecorderModal
                isOpen={isRecorderOpen}
                onClose={() => setIsRecorderOpen(false)}
                userId={user?.uid || ''}
                onVoiceCloned={(id) => {
                    setJustClonedVoiceId(id);
                    // Optional: Auto-trigger generation or show success
                    alert("Voice Cloned! Click 'Generate' again to use your new voice.");
                }}
            />

            <MagicNavBar />
        </div >
    );
};
