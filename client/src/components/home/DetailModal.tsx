import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles, Users, Download } from 'lucide-react';
import type { ImageRecord } from '../history/ImageModal';

interface DetailModalProps {
    item: ImageRecord | null;
    onClose: () => void;
    onToggleFavorite: (id: string) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ item, onClose, onToggleFavorite }) => {
    if (!item) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-[40px] shadow-2xl p-6 w-full max-w-lg relative overflow-hidden flex flex-col items-center"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-20"
                    >
                        <X size={24} />
                    </button>

                    {/* Image Preview */}
                    <div className="w-full aspect-square bg-slate-100 rounded-3xl mb-6 flex items-center justify-center overflow-hidden border-4 border-slate-50 shadow-inner relative">
                        <img
                            src={item.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-bold uppercase tracking-wider">
                            {item.type}
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="text-center mb-8 px-4">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-2">Created on {new Date(item.createdAt).toLocaleDateString()}</p>
                        <p className="text-slate-800 font-bold text-lg leading-snug line-clamp-2">
                            {item.prompt || "Untitled Amazing Artwork"}
                        </p>
                    </div>

                    {/* Actions Grid */}
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <button
                            onClick={() => onToggleFavorite(item.id)}
                            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all ${item.favorite
                                ? 'bg-rose-50 text-rose-500 ring-2 ring-rose-200'
                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            <Heart className={`w-8 h-8 ${item.favorite ? 'fill-current' : ''}`} />
                            <span className="text-xs font-black uppercase">Favorite</span>
                        </button>

                        <button className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-50 text-slate-500 hover:bg-yellow-50 hover:text-yellow-600 rounded-2xl transition-all">
                            <Sparkles className="w-8 h-8" />
                            <span className="text-xs font-black uppercase">Recommend</span>
                        </button>

                        <button className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all">
                            <Users className="w-8 h-8" />
                            <span className="text-xs font-black uppercase">Co-Create</span>
                        </button>

                        <a
                            href={item.imageUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-col items-center justify-center gap-2 py-4 bg-slate-50 text-slate-500 hover:bg-green-50 hover:text-green-600 rounded-2xl transition-all"
                        >
                            <Download className="w-8 h-8" />
                            <span className="text-xs font-black uppercase">Download</span>
                        </a>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
