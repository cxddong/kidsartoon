import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Play, Pause, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const CustomAudioPlayer = ({ src }: { src: string }) => {
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currTime, setCurrTime] = useState(0);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const dur = audioRef.current.duration;
            setCurrTime(current);
            setProgress((current / dur) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
            // Auto-play when ready 
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        if (audioRef.current) {
            const newTime = (val / 100) * duration;
            audioRef.current.currentTime = newTime;
            setProgress(val);
        }
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
            />

            <div className="flex items-center gap-4">
                <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-hover transition-all shrink-0"
                >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
                </button>

                <div className="flex-1 flex flex-col gap-1">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-slate-500 font-medium px-1">
                        <span>{formatTime(currTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AudioStoryPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState<'upload' | 'recording' | 'generating' | 'finished'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    // Voice input removed
    const [audioStoryUrl, setAudioStoryUrl] = useState<string | null>(null);
    const [resultData, setResultData] = useState<any>(null);
    const [lang, setLang] = useState<'en' | 'zh' | 'fr' | 'es'>('zh'); // Default Chinese as requested

    const [genProgress, setGenProgress] = useState(0);

    // Progress Bar Animation for Generation
    React.useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (step === 'generating') {
            setGenProgress(0);
            interval = setInterval(() => {
                setGenProgress(prev => {
                    if (prev >= 90) return prev; // Stall at 90%
                    return prev + (Math.random() * 5); // Increment randomly
                });
            }, 800);
        } else if (step === 'finished') {
            setGenProgress(100);
        }
        return () => clearInterval(interval);
    }, [step]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // Voice input removed

    const generateStory = async () => {
        if (!imageFile) return;

        setStep('generating');
        try {
            const formData = new FormData();
            // Append fields BEFORE file to ensure they are available in some multer configurations
            formData.append('lang', lang);
            formData.append('userId', user?.uid || 'demo-user');
            formData.append('voiceText', "A wonderful, creative story based on this drawing.");
            formData.append('image', imageFile);

            // Send lang in Query AND Body for maximum reliability
            const res = await fetch(`/api/media/image-to-voice?lang=${lang}`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.details || errData.error || "Generation failed");
            }

            const data = await res.json();
            setAudioStoryUrl(data.audioUrl || null); // Ensure null if empty
            setResultData(data);
            setStep('finished');

        } catch (e: any) {
            console.error(e);
            alert(`Story Creation Issue: ${e.message}`);
            setStep('upload');
        }
    };

    return (
        <div className="h-screen w-full bg-background overflow-hidden flex flex-col relative">
            <div className="flex-1 overflow-y-auto p-4 pb-24 scrollbar-hide">
                <header className="flex items-center gap-4 mb-8 shrink-0">
                    <button onClick={() => navigate('/generate')} className="p-2 bg-white rounded-full shadow-sm">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">Audio Story (v3)</h1>
                </header>

                <div className="max-w-2xl mx-auto h-full flex flex-col justify-center">
                    <AnimatePresence mode="wait">
                        {step === 'upload' && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-white rounded-2xl p-6 shadow-sm space-y-6"
                            >
                                <div className="text-center">
                                    <h2 className="text-xl font-bold mb-2">1. Upload Drawing</h2>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 relative hover:bg-slate-50 transition-colors">
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                                        ) : (
                                            <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                                        )}
                                    </div>
                                </div>

                                {/* Voice Input Removed */}

                                <button
                                    onClick={generateStory}
                                    disabled={!imageFile}
                                    className="w-full bg-secondary text-white py-3 rounded-xl font-bold shadow-md disabled:opacity-50"
                                >
                                    Generate Magic Story
                                </button>

                                {/* Language Selector */}
                                <div className="flex justify-center gap-2 mt-4 flex-wrap">
                                    <button
                                        onClick={() => setLang('en')}
                                        className={cn("px-4 py-2 rounded-full text-sm font-bold transition-all", lang === 'en' ? "bg-blue-500 text-white shadow-md" : "bg-slate-100 text-slate-500")}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => setLang('zh')}
                                        className={cn("px-4 py-2 rounded-full text-sm font-bold transition-all", lang === 'zh' ? "bg-blue-500 text-white shadow-md" : "bg-slate-100 text-slate-500")}
                                    >
                                        中文
                                    </button>
                                    <button
                                        onClick={() => setLang('fr')}
                                        className={cn("px-4 py-2 rounded-full text-sm font-bold transition-all", lang === 'fr' ? "bg-blue-500 text-white shadow-md" : "bg-slate-100 text-slate-500")}
                                    >
                                        Français
                                    </button>
                                    <button
                                        onClick={() => setLang('es')}
                                        className={cn("px-4 py-2 rounded-full text-sm font-bold transition-all", lang === 'es' ? "bg-blue-500 text-white shadow-md" : "bg-slate-100 text-slate-500")}
                                    >
                                        Español
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'generating' && (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50 text-center px-8"
                            >
                                <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <Play className="w-12 h-12 text-secondary animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-700 mb-6">Weaving your story...</h3>

                                {/* Progress Bar */}
                                <div className="w-64 bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner relative">
                                    <div
                                        className="h-full bg-gradient-to-r from-secondary to-purple-400 transition-all duration-300 rounded-full"
                                        style={{ width: `${Math.min(genProgress, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-slate-500 mt-4 font-medium">{Math.floor(genProgress)}% Ready</p>
                            </motion.div>
                        )}

                        {step === 'finished' && (
                            <motion.div
                                key="finished"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white rounded-2xl p-6 shadow-sm text-center"
                            >
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-6">Story Ready!</h2>

                                {/* Audio Player or Text Fallback */}
                                {audioStoryUrl ? (
                                    <div className="bg-slate-100 rounded-xl p-4 mb-6">
                                        <CustomAudioPlayer src={audioStoryUrl} />
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-xl p-6 mb-6">
                                        <p className="text-slate-600 mb-4 whitespace-pre-wrap text-left leading-relaxed">
                                            {resultData?.story || "Enjoy your story!"}
                                        </p>
                                        {/* Browser Voice Button (Fallback) */}
                                        <button
                                            onClick={() => {
                                                if (!resultData?.story) return;
                                                const u = new SpeechSynthesisUtterance(resultData.story);
                                                u.lang = lang === 'zh' ? 'zh-CN' : lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US';
                                                u.rate = 0.9;
                                                window.speechSynthesis.cancel();
                                                window.speechSynthesis.speak(u);
                                            }}
                                            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold shadow-md hover:bg-primary-hover transition-all mx-auto"
                                        >
                                            <Play className="w-5 h-5 fill-current" />
                                            Tap to Listen
                                        </button>
                                        <p className="text-xs text-slate-400 mt-2">(Using Browser Voice Fallback)</p>
                                    </div>
                                )}

                                <button onClick={() => navigate('/generate')} className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                                    Create Another Story
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            <BottomNav />
        </div>
    );
};
