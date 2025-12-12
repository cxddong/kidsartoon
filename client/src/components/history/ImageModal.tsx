import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Trash2, RefreshCw, Download } from 'lucide-react';

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
    if (!image) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-6xl max-h-[90vh] md:h-[80vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Image Area */}
                    <div className="w-full md:w-[35%] h-[40vh] md:h-full bg-slate-100 flex items-center justify-center p-4 relative border-r border-slate-100">
                        <img
                            src={image.imageUrl}
                            alt={image.prompt || "Artwork"}
                            className="w-full h-full object-contain drop-shadow-md"
                        />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors md:hidden z-10"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Details Sidebar */}
                    <div className="w-full md:w-[65%] bg-white flex flex-col h-full overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-start p-4 pb-0 shrink-0">
                            <div>
                                <h3 className="text-base font-black text-slate-800 capitalize">{image.type}</h3>
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {new Date(image.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="hidden md:block p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Split Scrollable Content Area (Side-by-Side) */}
                        <div className="flex-1 grid grid-cols-2 min-h-0 px-6 py-2 gap-4 overflow-hidden">
                            {/* Prompt Section (Left) */}
                            {image.prompt && (
                                <div className="flex flex-col h-full overflow-hidden">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 shrink-0">Prompt</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 overflow-y-auto custom-scrollbar">
                                        <p className="text-slate-700 text-[10px] leading-relaxed font-medium whitespace-pre-wrap break-words">
                                            {image.prompt}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Story Section (Right) */}
                            {image.type === 'story' && image.meta?.story && (
                                <div className="flex flex-col h-full overflow-hidden">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 shrink-0">Story</h4>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1 overflow-y-auto custom-scrollbar">
                                        <p className="text-slate-700 text-[10px] leading-relaxed font-serif whitespace-pre-wrap break-words mb-4">
                                            {image.meta.story}
                                        </p>
                                        {image.meta?.audioUrl && (
                                            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                                <audio controls src={image.meta.audioUrl} className="w-full h-8" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 pt-4 border-t border-slate-50 mt-auto bg-white z-10">
                            <div className="flex justify-end gap-2">
                                {/* Favorite */}
                                <button
                                    onClick={() => onToggleFavorite(image.id)}
                                    title={image.favorite ? "Unfavorite" : "Favorite"}
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm ${image.favorite
                                        ? 'bg-rose-50 text-rose-500 border border-rose-100'
                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-rose-400 border border-slate-100'
                                        }`}
                                >
                                    <Heart size={18} fill={image.favorite ? "currentColor" : "none"} />
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => onDelete(image.id)}
                                    title="Delete"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 border border-slate-100 transition-all shadow-sm"
                                >
                                    <Trash2 size={18} />
                                </button>

                                {/* Regenerate */}
                                <button
                                    onClick={() => onRegenerate && onRegenerate(image)}
                                    disabled={!onRegenerate}
                                    title="Regenerate"
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl border border-slate-100 transition-all shadow-sm ${onRegenerate
                                        ? "bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-500 cursor-pointer"
                                        : "bg-slate-50 text-slate-300 cursor-not-allowed opacity-50"
                                        }`}
                                >
                                    <RefreshCw size={18} />
                                </button>

                                {/* Download */}
                                <a
                                    href={image.imageUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Download"
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-500 border border-slate-100 transition-all shadow-sm cursor-pointer"
                                >
                                    <Download size={18} />
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageModal;
