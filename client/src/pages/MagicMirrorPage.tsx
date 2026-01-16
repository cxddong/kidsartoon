import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Sparkles, Upload, ScanLine, Smartphone, Loader2, Paintbrush, ArrowLeft } from 'lucide-react';
import { incrementUsage } from '../components/FeedbackWidget';
import { cn } from '../lib/utils';
import mirrorVideo from '../assets/mirror1.mp4';

interface AnalysisResult {
    isSketch: boolean;
    coloringSuggestion: string | null;
    artisticStyle: {
        artist: string;
        reason: string;
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
            setResult(data);
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Magic Mirror is foggy... try again!");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSpeak = async (text: string) => {
        if (isPlaying) return;
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
                audioRef.current.play();
                audioRef.current.onended = () => {
                    setIsPlaying(false);
                    URL.revokeObjectURL(url);
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
        const confirmed = window.confirm(`Colorize with Magic ? 🎨\n\nThis will use 50 Magic Points.\nWe will transform your sketch into a colorful masterpiece!`);
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
                    alert("Not enough magic points! 🌟\nYou need 50 points to cast this spell.");
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
        <div className="min-h-screen bg-[#0f0c29] text-white p-4 relative overflow-hidden">
            {/* --- BACKGROUND LAYER --- */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <video
                    src={mirrorVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between max-w-6xl mx-auto mb-8 relative z-10 pt-4">
                <button onClick={() => navigate(-1)} className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all relative z-50 shadow-lg" title="Go Back">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-black bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                    <Sparkles className="text-yellow-400" /> Magic Mirror
                </h1>

                {selectedImage ? (
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-sm font-bold border border-white/20"
                    >
                        <Upload className="w-4 h-4" /> Scan Another
                    </button>
                ) : (
                    <div className="w-10" />
                )}
            </div>

            <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                {/* Left Column: Upload & Image */}
                <div className="space-y-6">
                    <div className="relative w-full h-[450px] backdrop-blur-sm bg-black/20 rounded-3xl overflow-hidden border-4 border-purple-500/30 shadow-2xl">
                        {selectedImage ? (
                            <>
                                <img src={selectedImage} alt="Uploaded" className="w-full h-full object-contain" />
                                {analyzing && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                                        <ScanLine className="w-16 h-16 text-cyan-400 animate-pulse mb-4" />
                                        <p className="text-cyan-300 font-bold animate-pulse">Scanning Magic...</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                                <Upload className="w-20 h-20 text-purple-400 mb-4 opacity-50" />
                                <p className="text-xl font-bold text-white/50 mb-6">Upload your drawing to reveal its secrets!</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/25"
                                >
                                    Select Image
                                </button>
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
                </div>

                {/* Right Column: Results */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {analyzing ? (
                            <motion.div
                                key="analyzing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center space-y-4 py-20"
                            >
                                <div className="relative w-24 h-24">
                                    <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-t-purple-500 rounded-full animate-spin" />
                                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-yellow-400 animate-pulse" />
                                </div>
                                <p className="text-xl font-bold text-purple-300 animate-pulse">Consulting the Ancients...</p>
                            </motion.div>
                        ) : result ? (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                {/* Master Analysis */}
                                <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10">
                                    <h2 className="text-xl font-bold text-purple-300 mb-2">🎨 Artistic Soul</h2>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-serif text-3xl font-bold text-black border-4 border-white/20">
                                            {result.artisticStyle.artist.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black">{result.artisticStyle.artist}</p>
                                            <p className="text-white/60 text-sm leading-relaxed">{result.artisticStyle.reason}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Magic Story Scroll */}
                                {result.magicStory && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-orange-50/10 backdrop-blur-xl p-8 rounded-[2rem] border-4 border-orange-200/20 shadow-2xl relative overflow-hidden group"
                                    >
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />
                                        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-orange-400/50 to-transparent" />

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-2xl font-black text-orange-300 italic">The Magic Scroll 📜</h3>
                                                <button
                                                    onClick={() => handleSpeak(result.magicStory)}
                                                    disabled={isPlaying}
                                                    className={cn(
                                                        "p-3 rounded-full transition-all shadow-lg",
                                                        isPlaying ? "bg-orange-400 animate-pulse" : "bg-white/10 hover:bg-orange-400 text-white"
                                                    )}
                                                >
                                                    <Volume2 className={cn("w-6 h-6", isPlaying && "animate-bounce")} />
                                                </button>
                                            </div>
                                            <p className="text-xl leading-relaxed text-orange-50/90 font-serif first-letter:text-4xl first-letter:font-black first-letter:text-orange-400">
                                                {result.magicStory}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Sketch Detection & Colorize */}
                                {result.isSketch && !coloredImage && (
                                    <div className="bg-gradient-to-r from-indigo-900 to-purple-900 p-6 rounded-2xl border border-indigo-500/30 shadow-lg relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 group-hover:opacity-40 transition-opacity" />

                                        <div className="relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-indigo-300 mb-1 flex items-center gap-2">
                                                        <Paintbrush className="w-5 h-5" /> Coloring Magic
                                                    </h3>
                                                    <p className="text-white/80 text-sm italic">"{result.coloringSuggestion || 'Let\'s make this colorful!'}"</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleColorize}
                                                disabled={colorizing}
                                                className="w-full py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                                            >
                                                {colorizing ? (
                                                    <>
                                                        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                                        Painting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-5 h-5 text-yellow-500" />
                                                        Color This! (-50 Pts)
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Result Display */}
                                {coloredImage && (
                                    <div className="bg-gradient-to-b from-pink-500/20 to-purple-900/40 p-1 rounded-3xl border-2 border-pink-500/50 shadow-2xl relative">
                                        <div className="absolute -top-3 -right-3 bg-yellow-400 text-black font-black px-3 py-1 rounded-full text-xs shadow-lg rotate-12 z-10">
                                            MAGIC! ✨
                                        </div>
                                        <div className="bg-black/50 rounded-[22px] overflow-hidden relative aspect-square group">
                                            <img src={coloredImage} alt="Colored Masterpiece" className="w-full h-full object-contain" />

                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                                <a href={coloredImage} download="magic_masterpiece.png" target="_blank" rel="noreferrer" className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                                                    <ScanLine className="w-6 h-6" />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="p-4 text-center">
                                            <div className="text-pink-200 font-bold text-lg mb-1">Your Masterpiece!</div>
                                            <p className="text-white/50 text-xs">Points remaining: check your profile!</p>
                                        </div>
                                    </div>
                                )}

                                {/* Magic Connections */}
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold text-pink-300 flex items-center gap-2">
                                        <Smartphone className="w-5 h-5" /> Magic Connections
                                    </h3>

                                    {result.richContent && result.richContent.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-4">
                                            {result.richContent.map((item, idx) => (
                                                <a
                                                    key={idx}
                                                    href={item.externalLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group flex gap-4 bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-4 rounded-xl hover:from-purple-800/60 hover:to-blue-800/60 transition-all cursor-pointer border border-white/10 hover:border-pink-500/50 hover:shadow-lg hover:shadow-purple-500/20"
                                                >
                                                    <div className="w-24 h-32 flex-shrink-0 bg-black/50 rounded-lg overflow-hidden relative shadow-md">
                                                        <img
                                                            src={item.thumbnailUrl}
                                                            alt={item.title}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400";
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 flex flex-col justify-center">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-black uppercase rounded shadow-sm tracking-wider">{item.type}</span>
                                                            <h4 className="font-bold text-lg text-white group-hover:text-pink-200 transition-colors">{item.title}</h4>
                                                        </div>
                                                        <p className="text-sm text-white/70 line-clamp-2 mb-2 leading-snug">{item.description}</p>
                                                        <p className="text-xs text-green-300 font-mono bg-green-900/30 px-2 py-1 rounded inline-block self-start border border-green-500/20">
                                                            ✨ Match: {result.magicConnections?.find(c => c.title === item.title)?.reason || "Magical resonance..."}
                                                        </p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 bg-white/5 rounded-2xl border border-dashed border-white/20">
                                            <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4 opacity-50" />
                                            <p className="text-white/50 italic">No specific magic links found, but your art is unique!</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 py-20">
                                <Sparkles className="w-16 h-16 text-purple-400 mb-4 animate-pulse" />
                                <p className="text-center font-mono">Select an image to reveal its secrets...</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
            <audio ref={audioRef} className="hidden" />
        </div>
    );
};
