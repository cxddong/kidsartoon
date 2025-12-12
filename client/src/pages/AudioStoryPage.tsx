import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Play, Pause, Loader2, RefreshCw, Music, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import audioBg from '../assets/audio_bg_new.png';
import audioCharLeft from '../assets/audio_character_left.png';
import audioCharRight from '../assets/audio_character_right.jpg';

const ProgressCounter = ({ lang }: { lang: string }) => {
    const [progress, setProgress] = useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 98) return 98;
                // smoother increment
                const increment = prev < 50 ? 0.5 : prev < 80 ? 0.2 : 0.05;
                return prev + increment;
            });
        }, 50); // 50ms interval for 20fps smoothness
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                <div
                    className="absolute inset-0 border-4 border-violet-500 rounded-full transition-all duration-300"
                    style={{ clipPath: `inset(0 0 ${100 - progress}% 0)` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-violet-600">{Math.floor(progress)}%</span>
                </div>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
                {lang === 'zh' ? '正在创作魔法...' : 'Creating Magic...'}
            </h3>
            <p className="text-slate-400 text-sm">
                {lang === 'zh' ? '正在将您的画作变成故事！' : 'Turning your picture into a story!'}
            </p>
        </div>
    );
};

export const AudioStoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Steps: 'upload' -> 'processing' -> 'result'
    const [step, setStep] = useState<'upload' | 'processing' | 'result'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [lang, setLang] = useState<'en' | 'zh' | 'fr' | 'es'>('en');

    // Result Data
    const [storyResult, setStoryResult] = useState<{
        story: string;
        audioUrl: string | null;
        analysis: any;
    } | null>(null);

    // Processing Status
    const [statusText, setStatusText] = useState("Analyzing your image...");

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // 10MB Limit
            if (file.size > 10 * 1024 * 1024) {
                alert("File too large! Please upload an image smaller than 10MB.");
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!imageFile) return;
        setStep('processing');
        setStatusText("Analyzing your image...");

        try {
            const formData = new FormData();
            formData.append('userId', user?.uid || 'anonymous');
            formData.append('lang', lang);
            formData.append('image', imageFile);

            // Using the Orchestrator for full flow
            // 1. Vision -> JSON
            // 2. JSON -> Story
            // 3. Story -> Audio
            const res = await fetch(`/api/create-story-from-image?lang=${lang}`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Generation Failed");
            }

            const data = await res.json();
            setStoryResult(data);
            setStep('result');



        } catch (error: any) {
            console.error(error);
            alert(`Oops! ${error.message}`);
            setStep('upload');
        }
    };

    return (
        <div
            className="h-screen w-full text-slate-800 flex flex-col font-sans bg-cover bg-center bg-no-repeat overflow-hidden"
            style={{ backgroundImage: `url(${audioBg})` }}
        >
            {/* Main Layout: 3 Columns (Left Img | Center Content | Right Img) */}
            <div className="flex-1 flex overflow-hidden relative z-10 w-full">

                {/* Left Column (Hidden on mobile, visible on larger screens) */}
                <div className="hidden md:block flex-1 h-full relative">
                    <img
                        src={audioCharLeft}
                        alt="Character Left"
                        className="w-full h-full object-cover object-right"
                    />
                </div>

                {/* Center Column (Scrollable Content) */}
                <div className="w-full max-w-md mx-auto h-full overflow-y-auto flex flex-col items-center custom-scrollbar">
                    {/* Header (Moved Inside) */}
                    <header className="w-full p-4 flex items-center gap-4 shrink-0 relative z-20">
                        <button onClick={() => navigate('/generate')} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                            <ArrowLeft className="w-6 h-6 text-slate-600" />
                        </button>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
                            Magic Story Maker
                        </h1>
                    </header>

                    <div className="w-full flex-1 p-6 pb-24 flex flex-col items-center">
                        <AnimatePresence mode="wait">

                            {/* Step 1: Upload */}
                            {step === 'upload' && (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="w-full flex flex-col gap-6"
                                >
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
                                        <div className="w-full aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group hover:border-violet-300 transition-colors cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            {imagePreview ? (
                                                <img src={imagePreview} className="w-full h-full object-contain" alt="Preview" />
                                            ) : (
                                                <>
                                                    <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                        <Upload className="w-8 h-8 text-violet-500" />
                                                    </div>
                                                    <p className="text-slate-500 font-medium">Tap to upload your drawing</p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Language Selection */}
                                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
                                        <p className="text-sm font-bold text-slate-400 mb-3 px-2 uppercase tracking-wider">Story Language</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[
                                                { id: 'en', label: '🇺🇸 English' },
                                                { id: 'zh', label: '🇨🇳 中文' },
                                                { id: 'fr', label: '🇫🇷 Français' },
                                                { id: 'es', label: '🇪🇸 Español' }
                                            ].map((l) => (
                                                <button
                                                    key={l.id}
                                                    onClick={() => setLang(l.id as any)}
                                                    className={cn(
                                                        "py-3 rounded-xl text-sm font-bold transition-all",
                                                        lang === l.id
                                                            ? "bg-violet-500 text-white shadow-md scale-105"
                                                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                                    )}
                                                >
                                                    {l.label.split(' ')[1]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={!imageFile}
                                        className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-violet-200 disabled:opacity-50 disabled:shadow-none hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        ✨ Generate Magic Story
                                    </button>
                                </motion.div>
                            )}

                            {/* Step 2: Processing */}
                            {step === 'processing' && (
                                <motion.div
                                    key="processing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-20 text-center w-full"
                                >
                                    <ProgressCounter lang={lang} />

                                    <h3 className="text-xl font-bold text-slate-800 mb-2 mt-4">
                                        {lang === 'zh' ? '请等几秒，我正自构思中' : statusText}
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-2">
                                        {lang === 'zh' ? 'AI正在为您的图片创作故事...' : 'AI is working its magic... (approx 30s)'}
                                    </p>
                                </motion.div>
                            )}

                            {/* Step 3: Result */}
                            {step === 'result' && storyResult && (
                                <motion.div
                                    key="result"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full flex flex-col gap-6 pb-20"
                                >
                                    {/* Audio Player Card */}
                                    <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 text-center relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-500 to-fuchsia-500"></div>
                                        {storyResult.audioUrl ? (
                                            <div className="py-2">
                                                <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                                    <Music className="w-8 h-8 text-violet-600" />
                                                </div>
                                                <audio controls src={storyResult.audioUrl} className="w-full" autoPlay />
                                                <p className="text-xs text-slate-400 mt-4 font-medium uppercase tracking-wider">Audio Generated Successfully</p>
                                            </div>
                                        ) : (
                                            <div className="py-4 text-orange-500 bg-orange-50 rounded-xl">
                                                <p className="font-bold">Audio Generation Skipped</p>
                                                <p className="text-xs mt-1">We created the story, but audio failed.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Story Text Card */}
                                    <div className="bg-white rounded-3xl px-6 py-8 shadow-sm border border-slate-100">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-8 rounded-full bg-violet-500"></span>
                                                <h2 className="text-xl font-bold text-slate-800">Your Story</h2>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const u = new SpeechSynthesisUtterance(storyResult.story);
                                                    u.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
                                                    window.speechSynthesis.speak(u);
                                                }}
                                                className="p-2 rounded-full bg-violet-100 text-violet-600 hover:bg-violet-200 transition-colors"
                                                title="Read Aloud"
                                            >
                                                <Play className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="text-lg leading-relaxed text-slate-600 font-serif whitespace-pre-wrap">
                                            {storyResult.story}
                                        </p>
                                    </div>

                                    {/* New Story Button */}
                                    <button
                                        onClick={() => {
                                            setStep('upload');
                                            setImageFile(null);
                                            setImagePreview(null);
                                            setStoryResult(null);
                                        }}
                                        className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RefreshCw className="w-5 h-5" />
                                        Create Another
                                    </button>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column (Hidden on mobile, visible on larger screens) */}
                <div className="hidden md:block flex-1 h-full relative">
                    <img
                        src={audioCharRight}
                        alt="Character Right"
                        className="w-full h-full object-cover object-left"
                    />
                </div>
            </div>
            <BottomNav />
        </div>
    );
};
