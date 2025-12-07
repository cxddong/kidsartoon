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
                    className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Image Area */}
                    <div className="flex-1 bg-slate-100 flex items-center justify-center p-4 min-h-[300px] relative">
                        <img
                            src={image.imageUrl}
                            alt={image.prompt || "Artwork"}
                            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-md"
                        />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors md:hidden"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Details Sidebar */}
                    <div className="w-full md:w-[320px] bg-white p-6 flex flex-col border-l border-slate-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 capitalize">{image.type}</h3>
                                <p className="text-sm text-slate-400 font-medium">
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

                        {/* Prompt */}
                        {image.prompt && (
                            <div className="mb-6 flex-1 overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-slate-200">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prompt</h4>
                                <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {image.prompt}
                                </p>
                            </div>
                        )}

                        <div className="mt-auto space-y-3">
                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => onToggleFavorite(image.id)}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${image.favorite
                                        ? 'bg-rose-50 text-rose-500 border-rose-100'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-transparent'
                                        }`}
                                >
                                    <Heart size={18} fill={image.favorite ? "currentColor" : "none"} />
                                    {image.favorite ? 'Unlove' : 'Love'}
                                </button>

                                <button
                                    onClick={() => onDelete(image.id)}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all"
                                >
                                    <Trash2 size={18} />
                                    Delete
                                </button>
                            </div>

                            <button
                                onClick={() => onRegenerate && onRegenerate(image)}
                                disabled={!onRegenerate}
                                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${onRegenerate
                                        ? "bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
                                        : "bg-slate-50 text-slate-400 cursor-not-allowed opacity-60"
                                    }`}
                            >
                                <RefreshCw size={18} />
                                Regenerate
                            </button>

                            <a
                                href={image.imageUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all active:scale-[0.98]"
                            >
                                <Download size={20} />
                                Download
                            </a>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageModal;
