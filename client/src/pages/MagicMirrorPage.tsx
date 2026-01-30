import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Pause, Sparkles, Upload, ScanLine, Smartphone, Loader2, Paintbrush, ArrowLeft, Camera } from 'lucide-react';
import { CameraModal } from '../components/CameraModal';
import { incrementUsage } from '../components/FeedbackWidget';
import { cn } from '../lib/utils';
import mirrorVideo from '../assets/mirror1.mp4';

interface AnalysisResult {
    isSketch: boolean;
    coloringSuggestion: string | null;
    artisticStyle: {
        artist: string;
        reason: string;
        vibe?: string;
    };
    contentKeywords: string[];
    magicConnections: {
        title: string;
        type: string;
        reason: string;
    }[];
    richContent: {
        id: string;
        title: string;
        type: string;
        thumbnailUrl: string;
        description: string;
        externalLink?: string;
    }[];
    magicStory: string;
}

export const MagicMirrorPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [colorizing, setColorizing] = useState(false);
    const [coloredImage, setColoredImage] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [showCamera, setShowCamera] = useState(false);

    useEffect(() => {
        incrementUsage();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setSelectedImage(base64);
            await analyzeImage(base64);
        };
        reader.readAsDataURL(file);
    };

    const analyzeImage = async (base64: string) => {
        setAnalyzing(true);
        setResult(null);
        try {
            const response = await fetch('/api/magic/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.uid, imageBase64: base64 })
            });
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    alert("Not enough magic points! 🌟\nScanning requires 25 points.");
                } else {
                    throw new Error(data.error || "Analysis failed");
                }
                return;
            }

            setResult(data);
        } catch (error: any) {
            console.error("Analysis failed", error);
            alert(error.message || "Magic Mirror is foggy... try again!");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCameraCapture = (imageDataUrl: string) => {
        setSelectedImage(imageDataUrl);
        setShowCamera(false);
        analyzeImage(imageDataUrl);
    };

    const handleSpeak = async (text: string) => {
        if (!audioRef.current) return;

        // If already playing, then pause
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        // Check if we already have this source loaded (to resume)
        if (audioRef.current.getAttribute('data-text') === text && audioRef.current.currentTime > 0) {
            audioRef.current.play();
            setIsPlaying(true);
            return;
        }

        setIsPlaying(true);
        try {
            const response = await fetch('/api/magic/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            if (audioRef.current) {
                audioRef.current.src = url;
                audioRef.current.setAttribute('data-text', text);
                audioRef.current.play();
                audioRef.current.onended = () => {
                    setIsPlaying(false);
                    URL.revokeObjectURL(url);
                    audioRef.current?.removeAttribute('data-text');
                };
            }
        } catch (error) {
            console.error("Speech failed", error);
            setIsPlaying(false);
        }
    };

    const handleColorize = async () => {
        if (!user || !selectedImage) return;

        // Confirm deduction
        const confirmed = window.confirm(`Colorize with Magic ? 🎨\n\nThis will use 25 Magic Points.\nWe will transform your sketch into a colorful masterpiece!`);
        if (!confirmed) return;

        setColorizing(true);
        try {
            const response = await fetch('/api/magic/colorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    imageBase64: selectedImage,
                    suggestion: result?.coloringSuggestion
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    alert("Not enough magic points! 🌟\nYou need 25 points to cast this spell.");
                } else {
                    throw new Error(data.error || "Spell failed");
                }
                return;
            }

            setColoredImage(data.imageUrl);
            // Optional: Update user context points if possible, or just alert
            // alert(`Magic complete! You have ${ data.pointsBalance } points remaining.`);

        } catch (error) {
            console.error("Colorization failed", error);
            alert("The magic fizzled out... try again later!");
        } finally {
            setColorizing(false);
        }
    };

    const handleReset = () => {
        setSelectedImage(null);
        setResult(null);
        setColoredImage(null);
        setColorizing(false);
        setAnalyzing(false);
        // Clear file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0f0c29] text-white overflow-hidden">
            {/* --- BACKGROUND LAYER --- */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <video
                    src={mirrorVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-60 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f0c29]/60 via-transparent to-[#0f0c29]/70" />
            </div>

            <div className="relative z-10 h-full w-full flex flex-col p-4 landscape:p-2 overflow-y-auto custom-scrollbar">
                {/* Header - Fixed Height Area */}
                <header className="flex items-center justify-between max-w-6xl mx-auto w-full mb-4 landscape:mb-2 pt-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 landscape:p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all relative z-50 shadow-lg"
                        title="Go Back"
                    >
                        <ArrowLeft className="w-6 h-6 landscape:w-5 landscape:h-5" />
                    </button>
                    <h1 className="text-3xl landscape:text-xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Sparkles className="text-yellow-400 w-6 h-6 landscape:w-5 landscape:h-5" /> Magic Mirror
                    </h1>

                    {selectedImage ? (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-4 py-2 landscape:px-3 landscape:py-1 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-sm landscape:text-xs font-bold border border-white/20 shadow-md"
                        >
                            <Upload className="w-4 h-4" /> <span className="landscape:hidden">Scan Another</span><span className="hidden landscape:inline">New</span>
                        </button>
                    ) : (
                        <div className="w-10" />
                    )}
                </header>

                {/* Main Content Area - Expands to fill remains */}
                <main className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 landscape:grid-cols-2 gap-6 landscape:gap-4 overflow-hidden">

                    {/* Left Column: Upload & Image - Source Area */}
                    <section className="flex flex-col h-full min-h-0">
                        <div className="relative flex-1 backdrop-blur-sm bg-black/40 rounded-3xl landscape:rounded-2xl overflow-hidden border-4 landscape:border-2 border-purple-500/30 shadow-2xl flex items-center justify-center">
                            {selectedImage ? (
                                <div className="relative w-full h-full flex items-center justify-center p-2">
                                    <div className="absolute top-2 left-2 z-20 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] uppercase font-bold text-white border border-white/20">Source</div>
                                    <img src={selectedImage} alt="Uploaded" className="w-full h-full object-contain" />
                                    {analyzing && (
                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30">
                                            <ScanLine className="w-16 h-16 landscape:w-10 landscape:h-10 text-cyan-400 animate-pulse mb-4 landscape:mb-2" />
                                            <p className="text-cyan-300 font-bold animate-pulse landscape:text-xs">Scanning Magic...</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-8 landscape:p-4 w-full h-full group">

                                    <p className="text-xl landscape:text-xs font-bold text-white mb-8 landscape:mb-3 uppercase tracking-widest">Mirror Stage</p>

                                    <div className="grid grid-cols-1 landscape:grid-cols-2 gap-4 landscape:gap-3 w-full max-w-md">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center justify-center gap-3 px-6 py-4 landscape:py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-bold transition-all shadow-xl"
                                        >
                                            <Upload className="w-6 h-6 landscape:w-5 landscape:h-5 text-purple-400" />
                                            <span className="landscape:text-xs">Select Image</span>
                                        </button>

                                        <button
                                            onClick={() => setShowCamera(true)}
                                            className="flex items-center justify-center gap-3 px-6 py-4 landscape:py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold transition-all shadow-lg shadow-purple-500/25 hover:scale-105 active:scale-95"
                                        >
                                            <Camera className="w-6 h-6 landscape:w-5 landscape:h-5 text-white" />
                                            <span className="landscape:text-xs text-white">Take Photo</span>
                                        </button>
                                    </div>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleUpload}
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Right Column: Results - Result Area */}
                    <section className="flex flex-col h-full min-h-0 overflow-y-auto pr-2 custom-scrollbar pb-8">
                        <AnimatePresence mode="wait">
                            {analyzing ? (
                                <motion.div
                                    key="analyzing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center space-y-4 landscape:space-y-2 py-10"
                                >
                                    <div className="relative w-24 h-24 landscape:w-16 landscape:h-16">
                                        <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
                                        <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
                                        <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 landscape:w-6 landscape:h-6 text-yellow-400 animate-pulse" />
                                    </div>
                                    <p className="text-xl landscape:text-base font-bold text-purple-300 animate-pulse text-center">Consulting the Ancients...</p>
                                </motion.div>
                            ) : result ? (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4 landscape:space-y-3"
                                >
                                    {/* Result Prominence */}
                                    <div className="relative bg-gradient-to-b from-pink-500/20 to-purple-900/40 p-1 rounded-3xl border-2 border-pink-500/50 shadow-2xl overflow-hidden aspect-video landscape:aspect-video mb-2 flex items-center justify-center">
                                        {coloredImage ? (
                                            <img src={coloredImage} alt="Magic Result" className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center p-4">
                                                <Sparkles className="w-12 h-12 text-yellow-400 mb-2 animate-bounce" />
                                                <p className="text-pink-200 font-bold landscape:text-xs">Your Artistic Soul Detected!</p>
                                            </div>
                                        )}
                                        {coloredImage && (
                                            <div className="absolute bottom-2 right-2 z-20">
                                                <a href={coloredImage} download className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/40 rounded-full transition-all text-white border border-white/20">
                                                    <Upload className="w-4 h-4 rotate-180" />
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    {/* Master Analysis */}
                                    <div className="bg-white/10 backdrop-blur-xl p-4 landscape:p-3 rounded-2xl border border-white/10 shadow-lg">
                                        <h2 className="text-base landscape:text-xs font-bold text-purple-300 mb-2 uppercase tracking-widest">🎨 Artistic Soul</h2>
                                        <div className="flex items-center gap-4 landscape:gap-3">
                                            <div className="w-14 h-14 landscape:w-10 landscape:h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-serif text-2xl landscape:text-lg font-bold text-black border-2 border-white/20 flex-shrink-0">
                                                {result.artisticStyle.artist.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-xl landscape:text-base font-black">{result.artisticStyle.artist}</p>
                                                <p className="text-white/60 text-xs leading-tight">{result.artisticStyle.reason}</p>
                                                {result.artisticStyle.vibe && (
                                                    <p className="text-pink-400 text-[10px] font-bold mt-1 uppercase tracking-wider">✨ {result.artisticStyle.vibe} Vibe</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Magic Story Scroll */}
                                    {result.magicStory && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-orange-50/10 backdrop-blur-xl p-5 landscape:p-3 rounded-2xl border-2 border-orange-200/20 shadow-xl relative overflow-hidden group"
                                        >
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-lg landscape:text-sm font-black text-orange-300 italic">The Magic Scroll 📜</h3>
                                                    <button
                                                        onClick={() => handleSpeak(result.magicStory)}
                                                        className={cn(
                                                            "p-2 rounded-full transition-all shadow-md flex items-center gap-2",
                                                            isPlaying ? "bg-orange-400" : "bg-white/10 hover:bg-orange-400 text-white"
                                                        )}
                                                    >
                                                        {isPlaying ? <Pause className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
                                                        <span className="text-[10px] font-bold">{isPlaying ? "PAUSE" : "LISTEN"}</span>
                                                    </button>
                                                </div>
                                                <p className="text-base landscape:text-xs leading-relaxed text-orange-50/90 font-serif">
                                                    {result.magicStory}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Sketch Detection & Colorize (If not already colorized) */}
                                    {result.isSketch && !coloredImage && (
                                        <div className="bg-gradient-to-r from-indigo-900/60 to-purple-900/60 p-4 landscape:p-3 rounded-2xl border border-indigo-500/30 shadow-lg relative overflow-hidden group">
                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="text-sm landscape:text-xs font-bold text-indigo-300 mb-1 flex items-center gap-2">
                                                            <Paintbrush className="w-4 h-4" /> Coloring Magic
                                                        </h3>
                                                        <p className="text-white/80 text-xs italic">"{result.coloringSuggestion || 'Let\'s magic color this!'}"</p>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={handleColorize}
                                                    disabled={colorizing}
                                                    className="w-full py-3 landscape:py-2 bg-white text-indigo-900 font-bold rounded-xl text-sm landscape:text-xs hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg"
                                                >
                                                    {colorizing ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin" /> Painting...</>
                                                    ) : (
                                                        <><Sparkles className="w-4 h-4 text-yellow-500" /> Color This! (-25 Pts)</>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Magic Connections */}
                                    <div className="space-y-3">
                                        <h3 className="text-sm landscape:text-xs font-black text-pink-300 flex items-center gap-2 uppercase tracking-widest px-1">
                                            <Smartphone className="w-4 h-4" /> Magic Connections
                                        </h3>

                                        {result.richContent && result.richContent.length > 0 ? (
                                            <div className="space-y-3">
                                                {result.richContent.map((item, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={item.externalLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group flex gap-3 bg-white/5 p-3 landscape:p-2 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-pink-500/30"
                                                    >
                                                        <div className="w-16 h-20 flex-shrink-0 bg-black/50 rounded-lg overflow-hidden relative shadow-md">
                                                            <img
                                                                src={item.thumbnailUrl}
                                                                alt={item.title}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400";
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 flex flex-col justify-center min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="px-1.5 py-0.5 bg-pink-500 text-white text-[8px] font-black uppercase rounded tracking-tighter shadow-sm">{item.type}</span>
                                                                <h4 className="font-bold text-sm text-white truncate group-hover:text-pink-200">{item.title}</h4>
                                                            </div>
                                                            <p className="text-[10px] text-white/50 line-clamp-1 mb-1 leading-tight">{item.description}</p>
                                                            <p className="text-[9px] text-green-300 font-bold bg-green-900/30 px-1.5 py-0.5 rounded border border-green-500/20 inline-block self-start truncate max-w-full">
                                                                ✨ {result.magicConnections?.find(c => c.title === item.title)?.reason || "Magical resonance..."}
                                                            </p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 bg-white/5 rounded-2xl border border-dashed border-white/20">
                                                <p className="text-white/40 text-xs italic">Uniquely Magical!</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-10 landscape:py-2">
                                    <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-3xl p-8 landscape:p-4 border border-white/20 shadow-2xl text-center">
                                        <div className="w-20 h-20 landscape:w-10 landscape:h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 landscape:mb-2 border border-white/10">
                                            <Sparkles className="w-10 h-10 landscape:w-5 landscape:h-5 text-purple-400 animate-pulse" />
                                        </div>
                                        <h2 className="text-2xl landscape:text-sm font-black text-white mb-4 landscape:mb-1 uppercase tracking-wider">Unlock Magic Secrets</h2>
                                        <p className="text-white/80 text-lg landscape:text-[10px] leading-relaxed mb-6 landscape:mb-2">
                                            Upload a drawing or photo to see it through the Magic Mirror.
                                            Discover hidden stories and transform your art!
                                        </p>
                                        <div className="flex flex-col gap-2 landscape:gap-1">
                                            <div className="flex items-center gap-2 text-xs landscape:text-[8px] text-white/60 justify-center font-bold">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                                                <span>AI ANALYSIS</span>
                                                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
                                                <span>MAGIC STORIES</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </section>
                </main>
            </div>
            <audio ref={audioRef} className="hidden" />

            {showCamera && (
                <CameraModal
                    isOpen={showCamera}
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(168, 85, 247, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(168, 85, 247, 0.5);
                }
            `}} />
        </div>
    );
};
