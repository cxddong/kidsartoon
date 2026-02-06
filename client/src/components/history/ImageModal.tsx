import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trash2, RefreshCw, Download, Share2, Wand2, Video, Mail, Puzzle, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import html2canvas from 'html2canvas';
import { PuzzleButton } from '../puzzle/PuzzleButton';
import { PuzzleGame } from '../puzzle/PuzzleGame';
import { ShareModal } from '../share/ShareModal';

export interface ImageRecord {
    id: string;
    userId: string;
    imageUrl: string;
    type: 'upload' | 'generated' | 'comic' | 'story' | 'animation' | 'picturebook' | 'masterpiece' | 'graphic-novel' | 'cartoon-book' | 'cards';
    createdAt: string;
    prompt?: string;
    favorite?: boolean;
    meta?: any;
    isPublic?: boolean;
    authorAlias?: string;
}

interface ImageModalProps {
    image: ImageRecord | null;
    onClose: () => void;
    onToggleFavorite: (id: string) => void;
    onDelete?: (id: string) => void;
    onRegenerate?: (image: ImageRecord) => void;
    initialShowPuzzle?: boolean;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, onToggleFavorite, onDelete, onRegenerate, initialShowPuzzle = false }) => {
    const [isSpeaking, setIsSpeaking] = React.useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const [aiReview, setAiReview] = React.useState<{ loading: boolean, text: string | null, shown: boolean }>({ loading: false, text: null, shown: false });
    const [isReviewPlaying, setIsReviewPlaying] = React.useState(false);
    const [showPuzzle, setShowPuzzle] = React.useState(initialShowPuzzle);
    const [showShare, setShowShare] = React.useState(false);
    const [showMagicMenu, setShowMagicMenu] = React.useState(false);
    const navigate = useNavigate();
    const comicRef = React.useRef<HTMLDivElement>(null);
    const [creatorName, setCreatorName] = React.useState<string | null>(null);

    const handleDownload = async () => {
        if (image?.type === 'comic' && comicRef.current) {
            try {
                // Use html2canvas to capture the composed image + text
                const canvas = await html2canvas(comicRef.current, {
                    useCORS: true,
                    scale: 2, // High res
                    backgroundColor: null,
                    logging: false
                });

                const link = document.createElement('a');
                link.download = `comic-${image.id}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (e) {
                console.error("Canvas export failed", e);
                // Fallback
                window.open(image.imageUrl, '_blank');
            }
        } else if (image?.imageUrl) {
            // Standard download - Force file download to avoid opening in new tab/player
            try {
                const response = await fetch(image.imageUrl);
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                // Determine extension based on type
                const ext = (image.type === 'animation') ? 'mp4' : 'png';
                link.download = `magic-creation-${image.id}.${ext}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (e) {
                console.error("Download failed, falling back to new tab", e);
                window.open(image.imageUrl, '_blank');
            }
        }
    };

    const [confirmPublish, setConfirmPublish] = React.useState(false);

    // Fetch Creator Name
    React.useEffect(() => {
        if (!image) return;
        setCreatorName(null); // Reset

        const fetchCreator = async () => {
            // 1. Use Alias if provided (Anonymization for Public view)
            if (image.authorAlias) {
                setCreatorName(image.authorAlias);
                return;
            }

            // 2. Mock check
            if (image.userId === 'mock') {
                setCreatorName("Community Artist");
                return;
            }

            // 3. Fallback to API if not anonymized (e.g. looking at own history)
            try {
                const res = await fetch(`/api/users/${image.userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCreatorName(data.name || `Artist ${image.userId.substring(0, 6)}`);
                } else {
                    setCreatorName(`Artist ${image.userId.substring(0, 6)}`);
                }
            } catch (e) {
                setCreatorName(`Artist ${image.userId.substring(0, 6)}`);
            }
        };
        fetchCreator();
    }, [image]);

    // Stop speech when modal closes
    React.useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Sync puzzle state on open
    React.useEffect(() => {
        setShowPuzzle(initialShowPuzzle);
    }, [image, initialShowPuzzle]);

    const toggleSpeech = (text: string) => {
        // ... (existing toggleSpeech) ...
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsSpeaking(false);
        } else {
            // 1. Try playing Generated Audio (Human-like) first
            if (image?.meta?.audioUrl && image.meta.audioUrl.length > 5) {
                if (!audioRef.current) {
                    audioRef.current = new Audio(image.meta.audioUrl);
                    audioRef.current.onended = () => setIsSpeaking(false);
                    audioRef.current.onerror = () => {
                        console.warn("Audio file failed, falling back to TTS");
                        if (audioRef.current) audioRef.current = null; // Reset
                        // Fallback call (recursive or direct)
                        fallbackTTS(text);
                    };
                } else if (audioRef.current.src !== image.meta.audioUrl && !image.meta.audioUrl.includes('//undefined')) {
                    // Update src if changed (unlikely with modal but safe)
                    audioRef.current.src = image.meta.audioUrl;
                }

                audioRef.current.play()
                    .then(() => setIsSpeaking(true))
                    .catch(e => {
                        console.error("Audio play error", e);
                        fallbackTTS(text);
                    });
                return;
            }

            // 2. Fallback to Browser TTS (Mechanical)
            fallbackTTS(text);
        }
    };

    // ... (rest of methods)

    // ... (in render) ...



    const fallbackTTS = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        // Detect language roughly - if Chinese chars exist
        if (/[\u4e00-\u9fa5]/.test(text)) {
            utterance.lang = 'zh-CN';
        } else {
            utterance.lang = 'en-US';
        }
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    const handleClose = () => {
        window.speechSynthesis.cancel();
        onClose();
    };

    const handlePublish = async () => {
        if (!image) return;
        try {
            const res = await fetch(`/api/images/${image.id}/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: image.userId })
            });
            const data = await res.json();
            if (data.success) {
                alert("✨ Magic! Your creation is now shared with the world!");
                setConfirmPublish(false);
                onClose(); // Close modal to reflect state or user flow
            } else {
                alert(data.error || "Could not publish.");
                setConfirmPublish(false);
            }
        } catch (e) {
            console.error(e);
            alert("Something went wrong.");
            setConfirmPublish(false);
        }
    };

    const handleAiReview = async () => {
        if (!image) return;

        // Check if we already have the review
        if (aiReview.text) {
            setAiReview(prev => ({ ...prev, shown: true }));
            return;
        }

        // Use the main image URL for analysis
        const imageUrl = image.imageUrl || image.meta?.gridImageUrl || image.meta?.originalImageUrl;
        if (!imageUrl) return;

        setAiReview({ loading: true, text: null, shown: true });

        try {
            const res = await fetch('/api/feedback/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl,
                    imageId: image.id
                })
            });
            const data = await res.json();
            const finalText = data.text || "Magic analysis complete! Use your imagination to see what's special!";
            setAiReview({ loading: false, text: finalText, shown: true });
        } catch (err) {
            console.error(err);
            setAiReview({ loading: false, text: "The art teacher is on a coffee break! Try again later.", shown: true });
        }
    };

    const playReview = () => {
        if (!aiReview.text) return;

        if (isReviewPlaying) {
            window.speechSynthesis.cancel();
            setIsReviewPlaying(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(aiReview.text);
        utterance.lang = /[\u4e00-\u9fa5]/.test(aiReview.text) ? 'zh-CN' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.onend = () => setIsReviewPlaying(false);
        utterance.onerror = () => setIsReviewPlaying(false);
        window.speechSynthesis.speak(utterance);
        setIsReviewPlaying(true);
    };

    if (!image) return null;

    const canPlayPuzzle = () => {
        // Allow for all except stories without an image
        if (image.type === 'story' && !image.meta?.originalImageUrl && !image.imageUrl?.startsWith('data:')) return false;
        return true;
    };

    const getPuzzleImageUrl = () => {
        if (image.type === 'animation') {
            return image.imageUrl;
        } else if (image.type === 'story') {
            return image.meta?.originalImageUrl || image.imageUrl;
        } else {
            return image.imageUrl;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-1 md:p-4 custom-scrollbar bg-white">
                        {image.type === 'picturebook' && image.meta?.pages ? (
                            /* PICTURE BOOK LAYOUT */
                            <div className="flex flex-col gap-6 h-full max-w-6xl mx-auto">
                                <h4 className="text-center font-black text-slate-800 text-2xl">📖 Picture Book</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {image.meta.pages.map((page: any, idx: number) => (
                                        <div key={idx} className="flex flex-col gap-2 p-3 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="aspect-[3/4] bg-white rounded-lg overflow-hidden border border-orange-100">
                                                <img
                                                    src={page.imageUrl}
                                                    alt={`Page ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="text-center">
                                                <span className="text-xs font-bold text-orange-600">Page {idx + 1}</span>
                                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{page.text_overlay}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (image.type === 'cartoon-book' || image.type === 'graphic-novel') && (image.meta?.cartoonBook?.pages || image.meta?.graphicNovel?.pages) ? (
                            /* CARTOON BOOK LAYOUT */
                            <div className="flex flex-col gap-6 h-full max-w-6xl mx-auto">
                                <h4 className="text-center font-black text-purple-800 text-2xl">📚 Cartoon Book</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {(image.meta?.cartoonBook?.pages || image.meta?.graphicNovel?.pages).map((page: any, idx: number) => (
                                        <div key={idx} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="aspect-[2/3] bg-white rounded-lg overflow-hidden border border-purple-100 relative group">
                                                <img
                                                    src={page.imageUrl}
                                                    alt={`Page ${idx + 1}`}
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <a
                                                    href={page.imageUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Download size={14} />
                                                </a>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-xs font-bold text-purple-600">Page {idx + 1}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : image.type === 'story' ? (
                            /* AUDIO STORY LAYOUT - Single Column */
                            <div className="flex flex-col gap-6 h-full max-w-3xl mx-auto">
                                {/* Audio Player */}
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                                    <h4 className="text-center font-black text-slate-800 mb-4 text-xl">🎧 Audio Story</h4>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleSpeech(image.meta?.story || "")}
                                            className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                        >
                                            {isSpeaking ? '⏸️' : '▶️'}
                                        </button>
                                        <div className="flex-1">
                                            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                                                <div className={`h-full bg-gradient-to-r from-blue-500 to-purple-500 ${isSpeaking ? 'animate-progress' : 'w-0'}`} />
                                            </div>
                                            <p className="text-xs text-blue-500 mt-2 font-bold uppercase">
                                                {isSpeaking ? 'Playing...' : 'Click to play'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Story Content */}
                                <div className="flex-1 bg-gradient-to-br from-orange-50 to-yellow-50 p-6 md:p-8 rounded-2xl border border-orange-100 shadow-sm">
                                    <h4 className="text-center font-black text-orange-800 mb-4 text-lg uppercase tracking-wide">
                                        📖 Story Text
                                    </h4>
                                    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-orange-100">
                                        <p className="text-slate-700 font-serif text-base md:text-lg leading-relaxed whitespace-pre-line">
                                            {image.meta?.story || "No story text available"}
                                        </p>
                                    </div>
                                </div>

                                {/* Original Image (if available) */}
                                {(image.meta?.originalImageUrl || image.meta?.inputImageUrl) && (
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <h4 className="text-center font-bold text-slate-600 mb-3 text-sm uppercase tracking-wide">
                                            Original Photo
                                        </h4>
                                        <img
                                            src={image.meta?.originalImageUrl || image.meta?.inputImageUrl}
                                            alt="Original"
                                            className="w-full max-h-64 object-contain rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>

                        ) : image.type === 'masterpiece' ? (
                            /* MASTERPIECE MATCH DISPLAY */
                            <div className="flex flex-col gap-6 h-full max-w-5xl mx-auto">
                                <div className="text-center">
                                    <h4 className="font-black text-2xl text-purple-800">✨ Masterpiece Match ✨</h4>
                                    {image.prompt && <p className="text-purple-600 font-bold mt-1">{image.prompt}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left: User Art */}
                                    <div className="flex flex-col gap-2">
                                        <div className="bg-white p-2 rounded-2xl shadow-md border-2 border-slate-100 rotate-1">
                                            <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden relative">
                                                <img src={image.imageUrl} className="w-full h-full object-cover" alt="My Art" />
                                                <div className="absolute top-2 left-2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                                    Me
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Masterpiece */}
                                    <div className="flex flex-col gap-2">
                                        <div className="bg-white p-2 rounded-2xl shadow-md border-2 border-purple-100 -rotate-1 relative">
                                            {/* Ranking Badge if available in meta */}
                                            <div className="absolute -top-3 -right-3 z-10 text-4xl shadow-sm filter drop-shadow-md">🥇</div>

                                            <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden relative">
                                                {image.meta?.matches?.[0]?.artwork?.imagePath ? (
                                                    <img src={image.meta.matches[0].artwork.imagePath} className="w-full h-full object-cover" alt="Masterpiece" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
                                                )}
                                                <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm p-2 text-center text-white">
                                                    <p className="font-bold text-sm">{image.meta?.matches?.[0]?.artwork?.title || "Masterpiece"}</p>
                                                    <p className="text-xs opacity-80">{image.meta?.matches?.[0]?.artwork?.artist || "Famous Artist"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Analysis / Audio Section */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100 mt-4 space-y-6">
                                    {/* Audio Button */}
                                    {image.meta?.audioUrl && (
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={() => toggleSpeech(image.meta?.kidScript || image.meta?.parentAnalysis || "")}
                                                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <span className="text-2xl">{isSpeaking ? '⏸️' : '🔊'}</span>
                                                <span className="text-[10px] font-bold mt-1">Play</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* For Kids Section */}
                                    {image.meta?.kidScript && (
                                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 relative">
                                            <div className="absolute -top-3 left-4 bg-purple-200 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                For Kids
                                            </div>
                                            <p className="text-purple-900 font-medium italic">"{image.meta.kidScript}"</p>
                                        </div>
                                    )}

                                    {/* Visual Diagnosis */}
                                    {image.meta?.parentAnalysis && (
                                        <div className="text-slate-600 text-sm leading-relaxed">
                                            <span className="font-bold text-slate-700 uppercase text-xs tracking-wide block mb-2">🎨 Visual Analysis</span>
                                            <p>{image.meta.parentAnalysis}</p>
                                        </div>
                                    )}

                                    {/* Coaching Feedback - Additional Details */}
                                    {image.meta?.coachingFeedback && (
                                        <div className="space-y-4 border-t border-purple-100 pt-4">
                                            {/* Gap Analysis */}
                                            {image.meta.coachingFeedback.advice?.gapAnalysis && (
                                                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                                                    <span className="font-bold text-amber-800 text-xs uppercase tracking-wide block mb-1">💡 What's Missing</span>
                                                    <p className="text-amber-900 text-sm">{image.meta.coachingFeedback.advice.gapAnalysis}</p>
                                                </div>
                                            )}

                                            {/* Actionable Task */}
                                            {image.meta.coachingFeedback.advice?.actionableTask && (
                                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                                    <span className="font-bold text-blue-800 text-xs uppercase tracking-wide block mb-1">🎯 Next Challenge</span>
                                                    <p className="text-blue-900 text-sm font-medium">{image.meta.coachingFeedback.advice.actionableTask}</p>
                                                </div>
                                            )}

                                            {/* Technique Tip */}
                                            {image.meta.coachingFeedback.advice?.techniqueTip && (
                                                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                                    <span className="font-bold text-green-800 text-xs uppercase tracking-wide block mb-1">✨ Pro Tip</span>
                                                    <p className="text-green-900 text-sm">{image.meta.coachingFeedback.advice.techniqueTip}</p>
                                                </div>
                                            )}

                                            {/* Master Connection */}
                                            {image.meta.coachingFeedback.masterConnection && (
                                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                                                    <span className="font-bold text-indigo-800 text-xs uppercase tracking-wide block mb-1">🖼️ Master Artist Connection</span>
                                                    <p className="text-indigo-900 text-sm font-semibold mb-1">{image.meta.coachingFeedback.masterConnection.artist}</p>
                                                    <p className="text-indigo-700 text-xs">{image.meta.coachingFeedback.masterConnection.reason}</p>
                                                </div>
                                            )}

                                            {/* Improvement from Last Version */}
                                            {image.meta.coachingFeedback.improvement && (
                                                <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                                                    <span className="font-bold text-pink-800 text-xs uppercase tracking-wide block mb-1">📈 Your Progress</span>
                                                    <p className="text-pink-900 text-sm">{image.meta.coachingFeedback.improvement}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* STANDARD LAYOUT - Side by Side */
                            <div className="flex flex-col md:flex-row gap-6 h-full min-h-[400px]">
                                {/* LEFT: UPLOADED PICTURE */}
                                <div className="flex-1 flex flex-col">
                                    <h4 className="text-center font-bold text-slate-400 mb-2 tracking-wider text-xs uppercase">Uploaded Picture</h4>
                                    <div className="flex-1 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center p-2 relative overflow-hidden group">
                                        {(image.meta?.originalImageUrl || image.meta?.inputImageUrl) ? (
                                            <img
                                                src={image.meta?.originalImageUrl || image.meta?.inputImageUrl}
                                                alt="Uploaded"
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="text-center text-slate-300">
                                                <p className="text-4xl mb-2">🖼</p>
                                                <p className="font-bold text-sm">No Upload</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT: GENERATED PICTURE */}
                                <div className="flex-[1.5] flex flex-col">
                                    <h4 className="text-center font-bold text-slate-800 mb-2 tracking-wider text-xs uppercase">
                                        {image.type === 'animation' ? 'Generated Video' : 'Generated Picture'}
                                    </h4>
                                    <div className="flex-1 bg-slate-100/50 rounded-2xl flex items-center justify-center p-2 overflow-auto">
                                        {/* Media Content */}
                                        {image.type === 'animation' ? (
                                            <video
                                                src={image.imageUrl}
                                                controls
                                                autoPlay
                                                loop
                                                controlsList="noremoteplayback"
                                                disablePictureInPicture
                                                onContextMenu={(e) => e.preventDefault()}
                                                className="w-full h-full object-contain rounded-lg shadow-md bg-black"
                                            />
                                        ) : (
                                            <div ref={comicRef} className="relative w-full shadow-md rounded-sm bg-white">
                                                <img
                                                    src={image.imageUrl}
                                                    alt="Generated Result"
                                                    className="max-w-full max-h-full object-contain mx-auto shadow-sm"
                                                />
                                                {/* Architecture C: Static Comic Overlays in Modal */}
                                                {image.type === 'comic' && !image.meta?.isTextBurnedIn && (
                                                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 w-full h-full pointer-events-none">
                                                        {(image.meta?.bookData?.storyCaptions || image.meta?.bookData?.pages || image.meta?.scenes || []).slice(0, 4).map((p: any, i: number) => {
                                                            const text = typeof p === 'string' ? p : (p.text || p.text_overlay || p.narrativeText);
                                                            if (!text) return <div key={i} />;
                                                            return (
                                                                <div key={i} className="relative w-full h-full flex flex-col justify-end items-center p-2 md:p-3">
                                                                    <div className="bg-white px-2 py-1.5 md:px-3 md:py-2 rounded-[1rem] border-2 border-slate-900 shadow-[2px_2px_0px_rgba(0,0,0,0.2)] text-center max-w-[95%] max-h-[35%] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent flex items-center justify-center">
                                                                        <div className="w-full text-slate-800 font-bold text-[9px] md:text-[13px] leading-snug" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
                                                                            {text}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Additional Controls / Details BELOW the Generated Image - Removed Tags to save space */}
                                    <div className="mt-0"></div>
                                </div>
                            </div>
                        )}

                        {/* Feedback (For non-story types, shown below) */}
                        {image.type !== 'story' && image.meta?.feedback && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <h5 className="font-bold text-slate-400 text-xs uppercase mb-2">Teacher Feedback</h5>
                                <p className="text-slate-600 italic">"{image.meta.feedback}"</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                    {creatorName ? creatorName.charAt(0).toUpperCase() : '?'}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-700 leading-tight">
                                        {creatorName || 'Loading...'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        {image?.createdAt ? new Date(image.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center justify-end">
                            {/* Publish Button (Only for owner and not yet public) */}
                            {onDelete && !image.isPublic && image.type !== 'cards' && (
                                <button
                                    onClick={() => setConfirmPublish(true)}
                                    className="px-3 py-2 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold transition-transform hover:scale-105 shadow-sm flex items-center gap-1"
                                >
                                    🌍 Publish
                                </button>
                            )}

                            {/* Analyze */}
                            <button
                                onClick={handleAiReview}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            >
                                Analyze
                            </button>

                            {/* Save */}
                            <button
                                onClick={handleDownload}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            >
                                Save
                            </button>

                            {/* Share */}
                            <button
                                onClick={() => setShowShare(true)}
                                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            >
                                Share
                            </button>

                            {/* Favorite */}
                            <button
                                onClick={() => onToggleFavorite(image.id)}
                                className={cn(
                                    "px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                                    image.favorite
                                        ? "bg-pink-100 text-pink-600"
                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                )}
                            >
                                {image.favorite ? 'Saved' : 'Like'}
                            </button>

                            {/* Create Magic Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowMagicMenu(!showMagicMenu)}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                                >
                                    Create
                                </button>

                                {showMagicMenu && (
                                    <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in">
                                        <div className="p-1 flex flex-col gap-1">
                                            {/* 1. Remix -> Jump Into Art */}
                                            <button
                                                onClick={() => { navigate('/jump-into-art', { state: { remixImage: image.imageUrl } }); setShowMagicMenu(false); }}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
                                            >
                                                Remix
                                            </button>

                                            {/* 2. Audio -> Audio Story */}
                                            <button
                                                onClick={() => { navigate('/generate/audio', { state: { remixImage: image.imageUrl } }); }}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
                                            >
                                                Audio
                                            </button>

                                            {/* 3. Story -> Story Selection */}
                                            <button
                                                onClick={() => { navigate('/story-selection', { state: { remixImage: image.imageUrl } }); }}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
                                            >
                                                Story
                                            </button>

                                            {/* 4. Video -> Magic Movie */}
                                            <button
                                                onClick={() => { navigate('/generate/video', { state: { remixImage: image.imageUrl } }); }}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
                                            >
                                                Video
                                            </button>

                                            {/* 5. Cart -> Make Cartoon */}
                                            <button
                                                onClick={() => { navigate('/make-cartoon', { state: { remixImage: image.imageUrl } }); }}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700"
                                            >
                                                Cart
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Delete */}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(image.id)}
                                    className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg text-xs font-bold transition-colors"
                                >
                                    Delete
                                </button>
                            )}

                        </div>
                    </div>

                    {/* Floating Puzzle Button - Placed at end for Z-Index */}
                    {canPlayPuzzle() && !showPuzzle && (
                        <div className="absolute bottom-24 right-8 z-[50]">
                            <PuzzleButton onClick={() => setShowPuzzle(true)} />
                        </div>
                    )}
                </motion.div>

                {/* Magic Puzzle Game Overlay - Moved Outside Card Context to Fix Clipping */}
                {showPuzzle && (
                    <div onClick={(e) => e.stopPropagation()}>
                        <PuzzleGame
                            imageUrl={getPuzzleImageUrl()}
                            imageId={image.id}
                            onClose={() => setShowPuzzle(false)}
                            videoUrl={image.type === 'animation' ? image.imageUrl : undefined}
                        />
                    </div>
                )}

                {/* AI Review Modal */}
                {aiReview.shown && (
                    <div
                        className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => { setAiReview(prev => ({ ...prev, shown: false })); window.speechSynthesis.cancel(); setIsReviewPlaying(false); }}
                    >
                        {aiReview.loading ? (
                            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl flex flex-col items-center justify-center text-slate-800">
                                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
                                <p className="text-xl font-bold animate-pulse">Art Teacher is watching...</p>
                            </div>
                        ) : (
                            <div
                                className="bg-white text-slate-800 p-6 rounded-2xl shadow-2xl max-w-md w-full relative border-4 border-purple-200 animate-in fade-in zoom-in duration-300"
                                onClick={e => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => { setAiReview(prev => ({ ...prev, shown: false })); window.speechSynthesis.cancel(); setIsReviewPlaying(false); }}
                                    className="absolute top-2 right-2 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex-1 overflow-y-auto max-h-[60vh] flex flex-col items-center text-center gap-4">
                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center relative flex-shrink-0">
                                        <span className="text-3xl"></span>
                                        <button
                                            onClick={playReview}
                                            className="absolute -bottom-2 -right-2 p-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition-colors"
                                        >
                                            {isReviewPlaying ? <span className="animate-pulse">🔊</span> : "🔊"}
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-bold text-purple-900">Great Job! 🎨</h3>
                                    <p className="text-lg leading-relaxed font-medium text-slate-600">
                                        "{aiReview.text}"
                                    </p>
                                    <button
                                        onClick={() => { setAiReview(prev => ({ ...prev, shown: false })); window.speechSynthesis.cancel(); setIsReviewPlaying(false); }}
                                        className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 mt-2 transition-colors"
                                    >
                                        Thanks!
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Publish Confirmation Modal */}
                {confirmPublish && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-pink-200 animate-in zoom-in-95">
                            <h3 className="text-xl font-black text-slate-800 mb-2">🌍 Share with the World?</h3>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-amber-900 font-medium">
                                    ⚠️ Safety Check:
                                </p>
                                <ul className="text-xs text-amber-800 list-disc list-inside mt-1 space-y-1">
                                    <li>Wait! Does this show your real face?</li>
                                    <li>Does it show your full name?</li>
                                    <li>Ask a parent first!</li>
                                </ul>
                            </div>
                            <p className="text-slate-600 text-sm mb-6">
                                Publishing will make this artwork visible to everyone in the Magic Community. Your name will be hidden as "Young Artist".
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirmPublish(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePublish}
                                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-lg font-bold text-sm shadow-md"
                                >
                                    Yes, Publish!
                                </button>
                            </div>
                        </div>
                    </div>
                )}



            </motion.div>
        </AnimatePresence >
    );
};

export default ImageModal;
