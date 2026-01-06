import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Upload, Sparkles, ArrowLeft, Star, Volume2, BookOpen } from 'lucide-react';
import { ImageCropperModal } from '../components/ImageCropperModal';

interface MasterpieceMatch {
    matchId: string;
    rank: number;
    analysis_for_parents?: string; // New field
    audio_script_for_kids?: string; // New field
    analysis: string;
    suggestion: string;
    commonFeatures: string[];
    artwork: {
        id: string;
        artist: string;
        title: string;
        imagePath: string;
        kidFriendlyFact: string;
        biography?: string;
    };
}

export default function MasterpieceMatchPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<MasterpieceMatch[]>([]);
    const [topAudioUrl, setTopAudioUrl] = useState<string | null>(null); // Store audio URL
    const [error, setError] = useState<string | null>(null);

    const [cropImage, setCropImage] = useState<string | null>(null);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setCropImage(reader.result as string);
        };
        reader.readAsDataURL(file);
        event.target.value = ''; // Reset input
    };

    const handleCropComplete = (blob: Blob) => {
        if (!cropImage) return;
        const url = URL.createObjectURL(blob);
        setUploadedImage(url);
        setCropImage(null);
    };

    const handleAnalyze = async () => {
        if (!uploadedImage || !user) return;

        setAnalyzing(true);
        setError(null);

        try {
            const base64Response = await fetch(uploadedImage);
            const blob = await base64Response.blob();

            const formData = new FormData();
            formData.append('image', blob, 'drawing.png');
            formData.append('userId', user.uid);

            const response = await fetch('/api/masterpiece/match', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Analysis failed');
            }

            setResults(data.matches || []);
            setTopAudioUrl(data.topAudioUrl || null);

        } catch (err: any) {
            console.error('[Masterpiece] Error:', err);
            setError(err.message || 'Failed to analyze artwork');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleReset = () => {
        setUploadedImage(null);
        setResults([]);
        setTopAudioUrl(null);
        setError(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/generate')}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold mb-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Generate
                </button>

                <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <Star className="w-12 h-12 text-yellow-500" />
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Masterpiece Match
                        </h1>
                        <Star className="w-12 h-12 text-yellow-500" />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {!uploadedImage && results.length === 0 && (
                        <UploadSection
                            key="upload"
                            onImageUpload={handleImageUpload}
                        />
                    )}

                    {uploadedImage && !analyzing && results.length === 0 && (
                        <PreviewSection
                            key="preview"
                            image={uploadedImage}
                            onAnalyze={handleAnalyze}
                            onReset={handleReset}
                        />
                    )}

                    {analyzing && (
                        <AnalyzingAnimation key="analyzing" />
                    )}

                    {results.length > 0 && uploadedImage && (
                        <ResultSection
                            key="result"
                            uploadedImage={uploadedImage}
                            results={results}
                            audioUrl={topAudioUrl}
                            onReset={handleReset}
                        />
                    )}
                </AnimatePresence>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-center"
                    >
                        <p className="text-red-600 font-semibold">{error}</p>
                        <button
                            onClick={handleReset}
                            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        >
                            Try Again
                        </button>
                    </motion.div>
                )}
            </div>
            {/* Cropper Modal */}
            {cropImage && (
                <ImageCropperModal
                    imageUrl={cropImage}
                    onCrop={handleCropComplete}
                    onCancel={() => setCropImage(null)}
                    aspectRatio={1}
                />
            )}
        </div>
    );
}

function UploadSection({ onImageUpload }: { onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border-4 border-dashed border-purple-200"
        >
            <div className="text-center max-w-2xl mx-auto">
                <div className="mb-6">
                    <Upload className="w-24 h-24 mx-auto text-purple-300" />
                </div>
                <h2 className="text-3xl font-black text-gray-800 mb-4">
                    Upload Your Artwork
                </h2>
                <p className="text-gray-500 font-medium mb-8">
                    Draw something and let Magic Kat find which famous artist you are like!
                </p>

                <div className="flex flex-col items-center gap-6">
                    <label className="inline-block relative group cursor-pointer">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onImageUpload}
                            className="hidden"
                        />
                        <div className="relative px-12 py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-xl rounded-full shadow-lg group-hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                            <Upload className="w-6 h-6" />
                            <span>Choose Photo</span>
                        </div>
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur opacity-30 group-hover:opacity-60 transition-opacity" />
                    </label>

                    {/* Progress Indicator */}
                    <div className="w-full max-w-xs bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                        <div className="w-1/3 h-full bg-purple-500 rounded-full" />
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step 1 of 3: Upload</p>
                </div>
            </div>
        </motion.div>
    );
}

function PreviewSection({ image, onAnalyze, onReset }: {
    image: string;
    onAnalyze: () => void;
    onReset: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-4xl mx-auto"
        >
            <h2 className="text-3xl font-black text-center mb-8 text-gray-800">
                Ready to Match?
            </h2>

            <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                <div className="w-full md:w-1/2">
                    <img
                        src={image}
                        alt="Your drawing"
                        className="w-full aspect-square object-cover rounded-2xl border-4 border-purple-200 shadow-md transform rotate-1"
                    />
                </div>
                <div className="w-full md:w-1/2 space-y-6">
                    <p className="text-lg text-gray-600 font-medium">
                        Your artwork looks amazing! Magic Kat is ready to compare it with thousands of famous paintings.
                    </p>

                    {/* Progress Indicator Step 2 */}
                    <div className="space-y-2">
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className="w-2/3 h-full bg-purple-500 rounded-full" />
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Step 2 of 3: Review</p>
                    </div>

                    <button
                        onClick={onAnalyze}
                        className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Sparkles className="w-6 h-6 animate-pulse" />
                        Find My Match!
                    </button>
                    <button
                        onClick={onReset}
                        className="w-full py-3 text-gray-400 font-bold hover:text-gray-600"
                    >
                        Choose Different Photo
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function AnalyzingAnimation() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-[2.5rem] shadow-2xl p-12 text-center max-w-2xl mx-auto"
        >
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1]
                }}
                transition={{
                    rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-40 h-40 mx-auto mb-8 relative"
            >
                <div className="absolute inset-0 bg-purple-100 rounded-full blur-xl animate-pulse" />
                <div className="relative z-10 text-9xl">🔍</div>
            </motion.div>

            <h2 className="text-4xl font-black text-purple-600 mb-4">
                Analyzing Colors...
            </h2>
            <p className="text-xl text-gray-500 font-medium mb-8">
                Magic Kat is scanning 50,000+ masterpieces
            </p>

            <div className="w-64 mx-auto bg-gray-100 rounded-full h-3 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                />
            </div>
        </motion.div>
    );
}

function ResultSection({ uploadedImage, results, audioUrl, onReset }: {
    uploadedImage: string;
    results: MasterpieceMatch[];
    audioUrl: string | null;
    onReset: () => void;
}) {
    const topMatch = results[0];
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const playAudio = () => {
        if (!audioRef.current || !audioUrl) return;
        audioRef.current.play();
        setIsPlaying(true);
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-20"
        >
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-block px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full font-bold text-sm mb-2">
                    Analysis Complete
                </div>
                <h2 className="text-4xl font-black text-gray-900">
                    You paint like <span className="text-purple-600">{topMatch.artwork.artist}</span>!
                </h2>
            </div>

            {/* Split View Container */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* LEFT COLUMN: Visual Comparison */}
                <div className="space-y-6">
                    {/* Comparison Card */}
                    <div className="bg-white rounded-[2rem] shadow-xl p-6 border-4 border-white relative overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-100 px-4 py-1 rounded-b-xl text-xs font-bold text-gray-500 uppercase tracking-widest z-10">
                            Visual Match
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <img src={uploadedImage} className="w-full aspect-square object-cover rounded-xl border-2 border-slate-100 shadow-sm" />
                                <p className="text-center font-bold text-gray-500 text-sm">Your Art</p>
                            </div>
                            <div className="space-y-2">
                                <img src={topMatch.artwork.imagePath} className="w-full aspect-square object-cover rounded-xl border-2 border-slate-100 shadow-sm" />
                                <p className="text-center font-bold text-purple-600 text-sm">{topMatch.artwork.title}</p>
                            </div>
                        </div>
                    </div>

                    {/* Parent Zone (Text) */}
                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm text-slate-600">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg leading-none">Art Analysis</h3>
                                <p className="text-xs font-semibold text-slate-400 uppercase">For Parents</p>
                            </div>
                        </div>
                        <div className="prose prose-sm prose-slate leading-relaxed text-slate-600">
                            {/* Prefer new field, fallback to old */}
                            <p>{topMatch.analysis_for_parents || topMatch.analysis}</p>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-6">
                            {topMatch.commonFeatures.map((f, i) => (
                                <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500">
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Kid Zone & Interaction */}
                <div className="space-y-6">

                    {/* Kid Zone (Audio) */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                            <Sparkles className="w-40 h-40" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                                        <span className="text-xl">😺</span>
                                    </div>
                                    <span className="font-bold text-indigo-100 uppercase tracking-widest text-xs">Magic Kat Message</span>
                                </div>
                                <span className="bg-yellow-400 text-yellow-900 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-sm">
                                    For Kids
                                </span>
                            </div>

                            <h3 className="text-3xl font-black mb-6 leading-tight">
                                I have a secret to tell you about your drawing!
                            </h3>

                            {audioUrl && (
                                <audio
                                    ref={audioRef}
                                    src={audioUrl}
                                    onEnded={handleAudioEnded}
                                    className="hidden"
                                />
                            )}

                            <button
                                onClick={playAudio}
                                disabled={!audioUrl || isPlaying}
                                className={`w-full py-5 rounded-2xl font-black text-xl shadow-lg flex items-center justify-center gap-4 transition-all ${isPlaying
                                        ? "bg-white/90 text-indigo-600 scale-95 ring-4 ring-indigo-300"
                                        : "bg-white text-indigo-600 hover:scale-105 active:scale-95 hover:shadow-2xl"
                                    }`}
                            >
                                {isPlaying ? (
                                    <>
                                        <Volume2 className="w-8 h-8 animate-bounce" />
                                        <span>Listening...</span>
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="w-8 h-8" />
                                        <span>Listen to Kat</span>
                                    </>
                                )}
                            </button>
                            {!audioUrl && <p className="text-center text-xs mt-2 opacity-50 text-white">Audio generating...</p>}
                        </div>
                    </div>

                    {/* Next Steps / Suggestion */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-lg border-2 border-purple-100">
                        <p className="text-center text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Magic Mission</p>
                        <h4 className="text-xl font-bold text-center text-gray-800 mb-2">
                            "{topMatch.suggestion}"
                        </h4>
                        <div className="flex gap-4 justify-center mt-6">
                            <button onClick={onReset} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold text-gray-600 transition-colors">
                                Try Another
                            </button>
                            <button className="px-6 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl font-bold transition-colors">
                                Save to Gallery
                            </button>
                        </div>
                    </div>

                </div>
            </div>
            {/* Other Matches (Below) */}
            <div className="pt-12 border-t border-gray-200/50 mt-12">
                <h3 className="text-center font-bold text-gray-400 uppercase tracking-widest text-sm mb-8">Other Similar Artists</h3>
                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto opacity-70 hover:opacity-100 transition-opacity">
                    {results.slice(1, 3).map(match => (
                        <div key={match.matchId} className="flex gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <img src={match.artwork.imagePath} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                            <div>
                                <h4 className="font-bold text-gray-800">{match.artwork.artist}</h4>
                                <p className="text-xs text-purple-600 font-medium mb-1">{match.artwork.title}</p>
                                <p className="text-xs text-gray-500 line-clamp-2">{match.analysis}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
