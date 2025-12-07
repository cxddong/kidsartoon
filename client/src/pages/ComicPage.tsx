import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Mic, MicOff, X, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { BottomNav } from '../components/BottomNav';
import { AuthButton } from '../components/auth/AuthButton';
import ImageModal, { type ImageRecord } from '../components/history/ImageModal';
import { useAuth } from '../context/AuthContext';

// Using the same background as requested
const comicBg = '/picture_bg_framed.jpg';

export const ComicPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [step, setStep] = useState<'upload' | 'generating' | 'finished'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [resultData, setResultData] = useState<any>(null);
    const [, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [progress, setProgress] = useState(0);
    const [expandedImage, setExpandedImage] = useState<ImageRecord | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleVoiceInput = () => {
        if (isListening) {
            setIsListening(false);
        } else {
            setIsListening(true);
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setPrompt(prev => prev + (prev ? ' ' : '') + transcript);
                    setIsListening(false);
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                };

                recognition.onend = () => {
                    setIsListening(false);
                };

                recognition.start();
            } else {
                alert('Voice input is not supported in this browser.');
                setIsListening(false);
            }
        }
    };

    const generateComic = async () => {
        if (!prompt) return;
        setStep('generating');
        setError(null);
        setProgress(0);

        // Smoother, consistent progress bar
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 98) return prev;
                // Linear smoothness until 90%, then very slow
                if (prev < 90) {
                    return prev + 0.5; // ~18 seconds to 90%
                }
                return prev + 0.1; // Crawl to 98%
            });
        }, 100);

        try {
            const formData = new FormData();
            if (imageFile) {
                formData.append('cartoonImage', imageFile);
            }
            formData.append('prompt', prompt);
            formData.append('userId', user?.uid || 'demo-user');
            formData.append('pageCount', '4'); // Requesting 4 images

            const res = await fetch('/api/media/generate-picture-book', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to generate comic');

            const data = await res.json();

            clearInterval(progressInterval);
            setProgress(100);

            setTimeout(() => {
                setResultData(data);
                setStep('finished');
            }, 500);
        } catch (err) {
            console.error(err);
            clearInterval(progressInterval);
            setError('Failed to create the comic. Please try again.');
            setStep('upload');
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-slate-900 overflow-hidden flex flex-col z-[60]">
            {/* Header - Fixed Top */}
            <header className="absolute top-0 left-0 right-0 z-50 flex items-center gap-4 p-4 pointer-events-none">
                <button onClick={() => navigate('/generate')} className="pointer-events-auto p-2 bg-white/20 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/30 transition-colors">
                    <ArrowRight className="w-6 h-6 text-white rotate-180" />
                </button>
                <div className="flex-1" />
                <div className="pointer-events-auto flex items-center gap-3">
                    <AuthButton />
                    <div className="flex items-center gap-1 bg-yellow-100/90 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
                        <Star className="w-4 h-4 text-yellow-600 fill-current" />
                        <span className="text-sm font-bold text-yellow-700">1,250</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="relative w-full h-full flex items-center justify-center">

                {/* Background Layer - Maximized, No Stretch, No Crop */}
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                    <img
                        src={comicBg}
                        alt="Background Frame"
                        className="w-full h-full object-contain"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                </div>

                {/* Foreground Layer - Centered Upload UI */}
                <AnimatePresence mode="wait">
                    {step === 'upload' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10 flex flex-col items-center justify-center w-full h-full pb-[100px]" // Padding bottom to clear fixed input bar
                        >
                            {/* Upload Frame - Fixed Size, Centered */}
                            <div className="w-[300px] h-[225px] bg-white/30 backdrop-blur-sm rounded-3xl border-4 border-white/50 shadow-xl flex items-center justify-center overflow-hidden shrink-0">
                                <input
                                    type="file"
                                    id="comic-upload"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                <div
                                    className="w-full h-full relative group cursor-pointer"
                                    onClick={() => document.getElementById('comic-upload')?.click()}
                                >
                                    <div className="absolute inset-0 flex items-center justify-center transition-colors hover:bg-white/10">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 text-slate-700 drop-shadow-sm">
                                                <div className="">
                                                    <img src="/upload_icon_v2.png" alt="Upload" className="w-16 h-16 object-contain" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'generating' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative z-10 flex flex-col items-center justify-center w-full h-full"
                        >
                            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl flex flex-col items-center w-full max-w-md mx-4">
                                <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                                <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">woo la la woo la la woo la woo la woo...</h3>
                                <p className="text-slate-500 mb-6 font-medium">Drawing panels...</p>
                                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300 ease-out"
                                        style={{ width: `${Math.round(progress)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-bold">{Math.round(progress)}%</p>
                            </div>
                        </motion.div>
                    )}

                    {step === 'finished' && resultData && (
                        <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10 w-full h-full flex items-center justify-center p-6"
                        >
                            {/* Central Display Area - Comic Grid */}
                            <div
                                className="relative max-w-[90%] max-h-[80%] aspect-[3/4] md:aspect-square bg-white rounded-xl shadow-2xl border-[6px] border-white cursor-zoom-in transition-transform hover:scale-[1.02]"
                                onClick={() => {
                                    if (resultData) {
                                        setExpandedImage({
                                            id: resultData.id || 'comic-result',
                                            userId: resultData.userId || 'me',
                                            imageUrl: resultData.gridImageUrl || resultData.coverImageUrl || resultData.pages?.[0]?.imageUrl,
                                            type: 'comic',
                                            createdAt: new Date().toISOString(),
                                            prompt: prompt
                                        });
                                    }
                                }}
                            >
                                <img
                                    src={resultData.gridImageUrl || resultData.coverImageUrl || resultData.pages?.[0]?.imageUrl}
                                    alt="Generated Comic"
                                    className="w-full h-full object-contain bg-slate-100"
                                />
                                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                                    Click to Expand
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Fixed Bottom Bar - Input Controls */}
            {step === 'upload' && (
                <div className="absolute bottom-0 left-0 right-0 z-50 p-4 pb-4 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
                    <div className="w-full max-w-2xl mx-auto">
                        <div className="flex flex-row items-center justify-center gap-4">
                            <div className="relative w-full max-w-[400px]">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe your comic idea..."
                                    className="w-full p-3 pr-12 rounded-2xl border-0 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none resize-none h-[80px] text-sm leading-snug text-slate-700 placeholder:text-slate-400 font-medium shadow-sm scrollbar-hide"
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                />
                                {prompt && (
                                    <button
                                        onClick={() => setPrompt('')}
                                        className="absolute right-3 top-2 p-1.5 rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors z-20"
                                        title="Clear text"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button
                                    onClick={toggleVoiceInput}
                                    className={cn(
                                        "absolute right-3 bottom-2 p-1.5 rounded-xl transition-all shadow-sm z-20",
                                        isListening ? "bg-red-500 text-white animate-pulse shadow-red-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                    title="Voice Input"
                                >
                                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            <button
                                onClick={generateComic}
                                disabled={!prompt}
                                className="w-[80px] h-[80px] rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center p-0 bg-transparent shadow-none shrink-0"
                            >
                                <img src="/generate_btn_v2.png" alt="Generate" className="w-full h-full object-contain" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Nav - Hidden during upload to prevent overlap/clutter */}
            {step !== 'upload' && <BottomNav />}

            <ImageModal
                image={expandedImage}
                onClose={() => setExpandedImage(null)}
                onToggleFavorite={async (id) => {
                    if (expandedImage) {
                        setExpandedImage(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
                        // Save to API
                        await fetch('/api/media/favorite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, userId: user?.uid || 'demo-user' })
                        });
                    }
                }}
                onDelete={async (id) => {
                    if (confirm("Delete this creation?")) {
                        await fetch(`/api/media/image/${id}?userId=${user?.uid || 'demo-user'}`, { method: 'DELETE' });
                        setExpandedImage(null);
                        setStep('upload'); // Go back to start
                    }
                }}
                onRegenerate={(img) => {
                    // Close modal, set prompt, and go to generation
                    setExpandedImage(null);
                    setPrompt(img.prompt || "");
                    setStep('upload'); // Or directly to 'generating' but better to let user review prompt
                }}
            />
        </div>
    );
};
