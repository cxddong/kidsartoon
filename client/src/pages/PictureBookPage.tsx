import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, ArrowRight, Loader2, BookOpen, CheckCircle, Mic, MicOff, Play, X, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { BottomNav } from '../components/BottomNav';

// using the new framed background as requested
const pictureBookBg = '/picture_bg_framed.jpg';

type Step = 'upload' | 'generating-cartoon' | 'review-cartoon' | 'generating-book' | 'finished';

export const PictureBookPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    // Default to 'comic' if no state provided
    const mode = (location.state as any)?.mode || 'comic';

    const [step, setStep] = useState<Step>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [bookData, setBookData] = useState<any>(null);
    const [, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedIdx, setSelectedIdx] = useState(0);

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
            // Simple mock for voice input or Web Speech API
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

    const generateBook = async () => {
        if (!prompt) return;
        setStep('generating-book');
        setError(null);
        setProgress(0);

        // Simulate progress
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev;
                return prev + 1; // Increment by 1% every 300ms -> 30s to reach 90%
            });
        }, 300);

        try {
            // Use FormData to send file + prompt directly
            const formData = new FormData();
            if (imageFile) {
                formData.append('cartoonImage', imageFile);
            }
            formData.append('prompt', prompt);
            formData.append('userId', 'demo-user');
            formData.append('pageCount', '4');

            const res = await fetch('/api/media/generate-picture-book', {
                method: 'POST',
                body: formData, // Send FormData instead of JSON
            });

            if (!res.ok) throw new Error('Failed to generate book');

            const data = await res.json();

            clearInterval(progressInterval);
            setProgress(100);

            // Small delay to show 100%
            setTimeout(() => {
                setBookData(data);
                setStep('finished');
            }, 500);
        } catch (err) {
            console.error(err);
            clearInterval(progressInterval);
            setError('Failed to create the storybook. Please try again.');
            setStep('upload');
        }
    };
    return (

        <div className="h-screen w-screen overflow-hidden bg-slate-900 relative">
            {/* Scaled Inner Wrapper */}
            <div
                className="origin-top-left transform scale-[0.85] flex flex-col relative"
                style={{ width: '117.65vw', height: '117.65vh' }}
            >
                {/* Background Image applied to scaled wrapper to cover full area */}
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: `url(${pictureBookBg})` }}
                />
                {/* <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900/50 via-transparent to-slate-900/80" /> */}

                {/* Content Overlay */}
                <div className="flex-1 flex flex-col relative z-10 h-full">
                    <header className="flex items-center gap-4 p-4 shrink-0">
                        <button onClick={() => navigate('/generate')} className="p-2 bg-white/20 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/30 transition-colors">
                            <ArrowRight className="w-6 h-6 text-white rotate-180" />
                        </button>
                        <div className="flex-1" />
                        <div className="flex items-center gap-1 bg-yellow-100/90 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-200 shadow-sm">
                            <Star className="w-4 h-4 text-yellow-600 fill-current" />
                            <span className="text-sm font-bold text-yellow-700">1,250</span>
                        </div>
                    </header>

                    <div className="flex-1 flex flex-col w-full relative overflow-hidden pb-0">
                        <AnimatePresence mode="wait">
                            {step === 'upload' && (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center pb-32"
                                >
                                    {/* Frame Area - Relative positioning with margin */}
                                    <div
                                        className="relative z-20 mx-auto mt-[calc(15vh+33px)] mb-3 shrink-0"
                                        style={{
                                            width: 'calc(40vw + 78px)',
                                            height: 'calc((40vw + 78px) * 0.625 + 3px)',
                                            transform: 'translateX(-30px)',
                                            borderRadius: '45px',
                                            backgroundColor: 'transparent'
                                        }}
                                    >
                                        <input
                                            type="file"
                                            id="image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                        <div
                                            className="w-full h-full relative group cursor-pointer rounded-2xl overflow-hidden"
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                        >
                                            {/* Transparent overlay for click area */}
                                            <div className="absolute inset-0 flex items-center justify-center transition-colors hover:bg-white/10">
                                                {imagePreview ? (
                                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-3 text-slate-700/60 drop-shadow-sm">
                                                        <div className="p-4 bg-white/40 backdrop-blur-md rounded-full">
                                                            <Upload className="w-10 h-10 text-slate-600" />
                                                        </div>
                                                        <p className="font-bold text-lg text-center text-slate-600">Tap here to upload<br />your drawing</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full max-w-2xl px-6 z-30">
                                        <div className="flex flex-row items-center justify-center gap-4 mt-[70px]">
                                            <div className="relative w-[400px]">
                                                <textarea
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    placeholder="Tell us about your drawing..."
                                                    className="w-full p-4 pr-14 rounded-2xl border-0 bg-white/90 backdrop-blur-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none resize-none h-[70px] text-slate-700 placeholder:text-slate-400 font-medium shadow-sm scrollbar-hide"
                                                />
                                                {prompt && (
                                                    <button
                                                        onClick={() => setPrompt('')}
                                                        className="absolute right-2 top-2 p-1.5 rounded-full bg-slate-200/50 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors"
                                                        title="Clear text"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={toggleVoiceInput}
                                                    className={cn(
                                                        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl transition-all shadow-sm",
                                                        isListening ? "bg-red-500 text-white animate-pulse shadow-red-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                    )}
                                                    title="Voice Input"
                                                >
                                                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                                                </button>
                                            </div>
                                            <button
                                                onClick={generateBook}
                                                disabled={!prompt}
                                                className="w-[70px] h-[70px] rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center p-0 bg-transparent shadow-none"
                                            >
                                                <img src="/generate_btn_v2.png" alt="Generate" className="w-full h-full object-contain" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'generating-book' && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center h-[60vh]"
                                >
                                    <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl flex flex-col items-center w-full max-w-md mx-4">
                                        <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                                        <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">
                                            {mode === 'comic' ? 'Creating your\ncomic book...' : 'Creating your\npicture book...'}
                                        </h3>
                                        <p className="text-slate-500 mb-6 font-medium">Writing story and drawing panels!</p>

                                        {/* Progress Bar */}
                                        <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-300 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 font-bold">{progress}%</p>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'finished' && bookData && (
                                <motion.div
                                    key="finished"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-4 pb-24 space-y-6 max-w-2xl mx-auto w-full"
                                >
                                    <div className="text-center text-white drop-shadow-md">
                                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white text-green-500 rounded-full mb-4 shadow-lg">
                                            <CheckCircle className="w-10 h-10" />
                                        </div>
                                        <h2 className="text-3xl font-bold">{bookData.title}</h2>
                                        <p className="text-white/90 font-medium text-lg">Your story is ready!</p>
                                    </div>

                                    {/* Gallery View */}
                                    <div className="flex flex-col gap-4">
                                        {/* Main Image Display */}
                                        <div className="relative aspect-video w-full bg-slate-900/50 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
                                            <AnimatePresence mode="wait">
                                                <motion.img
                                                    key={selectedIdx}
                                                    src={bookData.pages[selectedIdx]?.imageUrl || bookData.gridImageUrl} // Fallback
                                                    alt={`Page ${selectedIdx + 1}`}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="w-full h-full object-contain"
                                                />
                                            </AnimatePresence>

                                            {/* Navigation Arrows */}
                                            {bookData.pages?.length > 1 && (
                                                <>
                                                    {selectedIdx > 0 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedIdx(prev => prev - 1);
                                                            }}
                                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
                                                        >
                                                            <ChevronLeft className="w-8 h-8" />
                                                        </button>
                                                    )}
                                                    {selectedIdx < bookData.pages.length - 1 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedIdx(prev => prev + 1);
                                                            }}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors"
                                                        >
                                                            <ChevronRight className="w-8 h-8" />
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {/* Page Number Badge */}
                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-white/10">
                                                {selectedIdx + 1} / {bookData.pages?.length || 1}
                                            </div>
                                        </div>

                                        {/* Text/Caption for current page */}
                                        {bookData.pages[selectedIdx]?.text && (
                                            <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-md border border-white/50 min-h-[80px] flex items-center justify-center text-center">
                                                <p className="text-slate-800 font-medium text-lg leading-snug">
                                                    {bookData.pages[selectedIdx].text}
                                                </p>
                                            </div>
                                        )}

                                        {/* Thumbnail Strip */}
                                        {bookData.pages?.length > 1 && (
                                            <div className="flex justify-center gap-3 overflow-x-auto py-2 px-1 scrollbar-hide">
                                                {bookData.pages.map((page: any, i: number) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedIdx(i)}
                                                        className={cn(
                                                            "relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shadow-sm group",
                                                            selectedIdx === i
                                                                ? "border-yellow-400 scale-110 shadow-lg ring-2 ring-yellow-400/50"
                                                                : "border-white/50 hover:border-white hover:scale-105"
                                                        )}
                                                    >
                                                        <img
                                                            src={page.imageUrl}
                                                            alt={`Thumbnail ${i + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {selectedIdx === i && (
                                                            <div className="absolute inset-0 bg-yellow-400/10" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => navigate('/home')} className="flex-1 bg-white/90 backdrop-blur text-slate-700 py-4 rounded-2xl font-bold hover:bg-white transition-colors shadow-lg">
                                            Back Home
                                        </button>
                                        <button className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-primary-hover transition-colors">
                                            Share Story
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => navigate('/generate/video', { state: { bookId: bookData.id } })}
                                        className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 text-lg"
                                    >
                                        <Play className="w-7 h-7 fill-current" />
                                        Turn into Animation!
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div >
                </div >
            </div >
            <BottomNav />
        </div >
    );
};
