import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trash2, RefreshCw, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ImageRecord {
    id: string;
    userId: string;
    imageUrl: string;
    type: 'upload' | 'generated' | 'comic' | 'story' | 'animation';
    createdAt: string;
    prompt?: string;
    favorite?: boolean;
    meta?: any;
}

interface ImageModalProps {
    image: ImageRecord | null;
    onClose: () => void;
    onToggleFavorite: (id: string) => void;
    onDelete: (id: string) => void;
    onRegenerate?: (image: ImageRecord) => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ image, onClose, onToggleFavorite, onDelete, onRegenerate }) => {
    const [isSpeaking, setIsSpeaking] = React.useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

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

    const toggleSpeech = (text: string) => {
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

    if (!image) return null;

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
                    {/* Header: Centered Title */}
                    <div className="flex justify-between items-center p-6 bg-slate-50 border-b border-slate-100 shrink-0">
                        <div className="flex-1 opacity-0 pointer-events-none hidden md:block"><X size={24} /></div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-widest">
                                {image.type === 'generated' ? 'Greeting Card' :
                                    image.type === 'comic' ? 'Comic Strip' :
                                        image.type === 'story' ? 'Audio Story' :
                                            image.type === 'animation' ? 'Animation' :
                                                image.type}
                            </h3>
                            <p className="text-xs text-slate-400 font-bold mt-1">
                                {new Date(image.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex-1 flex justify-end">
                            <button
                                onClick={handleClose}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Main Content: Side-by-Side Layout */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-white">
                        <div className="flex flex-col md:flex-row gap-6 h-full min-h-[400px]">

                            {/* LEFT: UPLOADED PICTURE */}
                            <div className="flex-1 flex flex-col h-[50vh] md:h-[60vh]">
                                <h4 className="text-center font-bold text-slate-400 mb-2 tracking-wider text-xs uppercase">Uploaded Picture</h4>
                                <div className="flex-1 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center p-2 relative overflow-hidden group">
                                    {(image.meta?.originalImageUrl || image.meta?.inputImageUrl || image.meta?.cartoonImageUrl) ? (
                                        <img
                                            src={image.meta?.originalImageUrl || image.meta?.inputImageUrl || image.meta?.cartoonImageUrl}
                                            alt="Uploaded"
                                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="text-center text-slate-300">
                                            <p className="text-4xl mb-2">🖼️</p>
                                            <p className="font-bold text-sm">No Upload</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT: GENERATED PICTURE */}
                            <div className="flex-[1.5] flex flex-col h-[50vh] md:h-[60vh]">
                                <h4 className="text-center font-bold text-slate-800 mb-2 tracking-wider text-xs uppercase">Generated Picture</h4>
                                <div className="flex-1 bg-gradient-to-br from-slate-50 to-pink-50 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center p-2 relative overflow-hidden">
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
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img
                                                src={image.imageUrl}
                                                alt="Generated Result"
                                                className="w-full h-full object-contain shadow-sm rounded-lg"
                                            />
                                            {/* Architecture C: Static Comic Overlays in Modal */}
                                            {image.type === 'comic' && !image.meta?.isTextBurnedIn && (
                                                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 w-full h-full pointer-events-none p-1 md:p-4">
                                                    {(image.meta?.bookData?.storyCaptions || image.meta?.bookData?.pages || image.meta?.scenes || []).slice(0, 4).map((p: any, i: number) => {
                                                        const text = typeof p === 'string' ? p : (p.text || p.text_overlay || p.narrativeText);
                                                        if (!text) return <div key={i} />;
                                                        return (
                                                            <div key={i} className="relative w-full h-full flex flex-col justify-end p-1 md:p-3">
                                                                <div className="bg-white/90 backdrop-blur-sm p-1.5 md:p-3 rounded-2xl border-2 border-slate-200/50 shadow-md text-center">
                                                                    <div className="w-full text-slate-800 font-black text-[8px] md:text-[14px] leading-tight line-clamp-3">
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

                                {/* Additional Controls / Details BELOW the Generated Image */}
                                <div className="mt-4 space-y-3">
                                    {/* Audio Player for Story */}
                                    {image.type === 'story' && (
                                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 flex items-center gap-3">
                                            <button
                                                onClick={() => toggleSpeech(image.meta?.story || "")}
                                                className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                                            >
                                                {isSpeaking ? '⏸️' : '▶️'}
                                            </button>
                                            <div className="flex-1">
                                                <div className="h-1 bg-blue-200 rounded-full overflow-hidden">
                                                    <div className={`h-full bg-blue-500 ${isSpeaking ? 'animate-progress' : 'w-0'}`} />
                                                </div>
                                                <p className="text-[10px] text-blue-400 mt-1 font-bold uppercase">Audio Story</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tags Chips */}
                                    {image.meta?.tags && (image.type === 'generated' || image.type === 'comic') && (
                                        <div className="flex flex-wrap gap-2 justify-center">
                                            {image.meta.tags.characters?.map((c: string) => (
                                                <span key={c} className="text-[10px] px-2 py-1 bg-slate-100 rounded-md text-slate-500 font-bold uppercase">{c}</span>
                                            ))}
                                            {image.meta.tags.visualStyle && (
                                                <span className="text-[10px] px-2 py-1 bg-pink-100 rounded-md text-pink-500 font-bold uppercase">{image.meta.tags.visualStyle}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Story Text / Feedback (Full Width Below) */}
                        {(image.meta?.story || image.meta?.feedback) && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                {image.meta?.feedback && (
                                    <div className="mb-4">
                                        <h5 className="font-bold text-slate-400 text-xs uppercase mb-2">Teacher Feedback</h5>
                                        <p className="text-slate-600 italic">"{image.meta.feedback}"</p>
                                    </div>
                                )}
                                {image.meta?.story && (
                                    <div>
                                        <h5 className="font-bold text-slate-400 text-xs uppercase mb-2">Story Text</h5>
                                        <p className="text-slate-700 font-serif leading-relaxed whitespace-pre-line">{image.meta.story}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-xs text-slate-400 font-medium">
                            Magic ID: <span className="font-mono text-slate-300">{image.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onToggleFavorite(image.id)}
                                className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${image.favorite
                                    ? 'bg-rose-50 text-rose-500 border border-rose-100'
                                    : 'bg-white text-slate-400 hover:text-rose-400 border border-slate-200'
                                    }`}
                            >
                                <Heart size={18} fill={image.favorite ? "currentColor" : "none"} />
                            </button>
                            <button
                                onClick={() => onDelete(image.id)}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-red-500 border border-slate-200 transition-all shadow-sm"
                            >
                                <Trash2 size={18} />
                            </button>
                            {/* Download Button */}
                            <button
                                onClick={() => window.open(image.imageUrl, '_blank')}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-blue-500 border border-slate-200 transition-all shadow-sm"
                                title="Download"
                            >
                                <Download size={18} />
                            </button>

                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageModal;
