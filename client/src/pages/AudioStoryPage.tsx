import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Upload, Sparkles, Check, Play, Pause, ArrowLeft, Music, Heart, Zap, Hand, Lock, Volume, Smile, Moon, Rocket, Gift, Castle, Wand2, Snowflake, TreeDeciduous, Footprints, Globe, Fish, Flame, Palette, PawPrint, Users, Cake, Waves, CloudUpload, RotateCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenerationCancelButton from '../components/GenerationCancelButton';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { playAudioWithPitchShift } from '../lib/audioUtils';
import { VIPCover } from '../components/ui/VIPCover';
import mic3Video from '../assets/mic3.mp4';

const backgroundUrl = '/bg_cartoon_new.jpg';

import { StoryBuilderPanel, type StoryBuilderData, STORY_STYLES, MOODS } from '../components/builder/StoryBuilderPanel';
import { ImageCropperModal } from '../components/ImageCropperModal';

export const AudioStoryPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

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
        if (location.state?.remixImage) {
            const imgUrl = location.state.remixImage;
            setImagePreview(imgUrl);
        }
    }, [location]);

    // Removed redundant local story settings state
    const [storyData, setStoryData] = useState<any>(null); // {text, audioUrl}

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
            // Read for Cropper
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropImage(reader.result as string);
            };
            reader.readAsDataURL(file);

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
        if (step > 1) {
            const confirmed = window.confirm("Are you sure you want to go back? Your current selections for this step might be lost.");
            if (!confirmed) return;
            setStep(prev => prev - 1);
        } else {
            navigate('/generate');
        }
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
        const utterance = new SpeechSynthesisUtterance(text);
        // Try to select a decent voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Zira'));
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => setIsPlaying(false);
        utterance.onstart = () => setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    const generateStory = async (builderData: StoryBuilderData) => {
        if (!imageFile && !imagePreview) return;
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

            // Updated Prompt to emphasize Image Context + Visual Anchors
            const prompt = `
                                    ANALYZE the uploaded image in detail first. Then, create a short, engaging audio story based STRICTLY on the visible characters, setting, and actions in the image.
                                    
                                    VISUAL ANCHORS (Use these to pull lighting/texture from Context Cache):
                                    - Scene: ${styleLabel}
                                    - Mood/Vibe: ${moodLabel}
                                    
                                    Narration Voice: ${builderData.voice}
                                    Rules: Friendly narration tone, short story suitable for children (approx 30-50 words). DO NOT make up generic elements; use what is seen in the picture.
                                    `.trim();

            const formData = new FormData();
            if (imageFile) {
                formData.append('image', imageFile);
            } else if (imagePreview) {
                formData.append('imageUrl', imagePreview);
            }
            formData.append('voiceText', prompt);
            formData.append('voice', builderData.voice);
            formData.append('voiceTier', builderData.voiceTier);
            formData.append('userId', user?.uid || 'demo');

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
    }, [step]);

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
                <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                    <img src={backgroundUrl} className="w-full h-full object-cover" />
                </div>

                {/* Left Sidebar Removed for Cleaner Layout */}

                {/* Main Center Column */}
                <div ref={scrollRef} className="flex-1 h-full overflow-y-auto relative custom-scrollbar pb-24">
                    <div className="relative z-10 p-6 pt-6 max-w-lg mx-auto min-h-full flex flex-col">

                        {/* Progress Indicatior (Simpler for 2 Steps) */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="flex flex-col items-center gap-1">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                                    step >= 1 ? "bg-purple-600 text-white shadow-md scale-110" : "bg-slate-200 text-slate-400"
                                )}>
                                    1
                                </div>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Upload</span>
                            </div>
                            <div className="w-12 h-0.5 bg-slate-200" />
                            <div className="flex flex-col items-center gap-1">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                                    step >= 2 ? "bg-purple-600 text-white shadow-md scale-110" : "bg-slate-200 text-slate-400"
                                )}>
                                    2
                                </div>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Create</span>
                            </div>
                        </div>

                        {/* Step Content */}
                        <AnimatePresence mode="wait">

                            {/* STEP 1: Upload */}
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                                    <div className={cn(
                                        "bg-white rounded-[130px] shadow-xl flex flex-col items-center justify-center hover:shadow-2xl transition-all group cursor-pointer overflow-hidden mx-auto relative transform hover:scale-95 duration-500",
                                        !imagePreview ? "w-[85%] aspect-square rotate-3 hover:rotate-0" : "w-fit h-auto"
                                    )}
                                        onClick={() => document.getElementById('step1-upload')?.click()}>

                                        {/* Background Video (mic3.mp4) - Only show when no image */}
                                        {!imagePreview && (
                                            <video
                                                src={mic3Video}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="absolute inset-0 w-full h-full object-cover -rotate-3 group-hover:rotate-0 transition-transform duration-500 scale-110"
                                                disablePictureInPicture
                                            />
                                        )}

                                        <input type="file" id="step1-upload" className="hidden" accept="image/*" onChange={handleUpload} />
                                        {imagePreview ? (
                                            <div className="relative max-w-full">
                                                <img src={imagePreview} className="max-w-full max-h-[60vh] w-auto h-auto object-contain block" />
                                                <div className="absolute inset-x-0 bottom-0 p-2 bg-black/50 text-white text-xs text-center font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Click to Change
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center transition-all relative z-10 -rotate-3 group-hover:rotate-0 duration-500">
                                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto text-purple-600 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <CloudUpload className="w-10 h-10" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        disabled={!imageFile && !imagePreview}
                                        onClick={() => setStep(2)}
                                        className="mt-6 w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg disabled:opacity-50 disabled:grayscale transition-all shadow-lg hover:bg-purple-700"
                                    >
                                        Next Step ➡️
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 2: Story Settings */}
                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                                    {!storyData ? (
                                        <>
                                            <StoryBuilderPanel
                                                imageUploaded={!!imageFile || !!imagePreview}
                                                onGenerate={generateStory}
                                                userId={user?.uid}
                                                isRecharging={isRecharging}
                                                rechargeTime={rechargeTime}
                                            />
                                        </>
                                    ) : (
                                        /* Result View: Play & Confirm */
                                        <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4">
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

                                            {/* Text Preview */}
                                            <div className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 max-h-40 overflow-y-auto">
                                                <p className="text-sm text-slate-600 italic">"{storyData.story}"</p>
                                            </div>

                                            {/* Actions */}
                                            <div className="w-full flex gap-3 mt-2">
                                                <button
                                                    onClick={() => { setStoryData(null); stopAudio(); }}
                                                    className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                                                >
                                                    <RotateCw className="w-4 h-4" /> Try Again
                                                </button>
                                                <button
                                                    onClick={() => navigate('/generate')}
                                                    className="flex-1 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 transition-colors"
                                                >
                                                    Done (Go Home)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Universal Exit Button - Only show when generating */}
                        {loading && (
                            <div className="mt-auto pt-8 pb-12 flex justify-center">
                                <GenerationCancelButton
                                    isGenerating={loading}
                                    onCancel={() => navigate('/generate')}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar Removed for Cleaner Layout */}

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

            {/* Cropper Modal */}
            {cropImage && (
                <ImageCropperModal
                    imageUrl={cropImage}
                    onCrop={handleCropComplete}
                    onCancel={() => setCropImage(null)}
                    aspectRatio={1} // Or flexible? Story covers usually square or portrait. Let's start with Square.
                />
            )}
            <BottomNav />
        </div>
    );
};
