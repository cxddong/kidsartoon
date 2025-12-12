import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Sparkles, Users, Download, Music, Play, BookOpen } from 'lucide-react';
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
                    className="bg-white rounded-[32px] shadow-2xl p-6 w-full max-w-5xl relative overflow-hidden flex flex-col md:flex-row gap-8 max-h-[90vh]"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-20"
                    >
                        <X size={24} />
                    </button>

                    {/* LEFT: Image Preview (Full Height) */}
                    <div className="w-full md:w-[40%] h-[40vh] md:h-auto bg-slate-100 rounded-3xl flex items-center justify-center overflow-hidden border-4 border-slate-50 shadow-inner relative self-stretch">
                        <img
                            src={item.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                            {item.type}
                        </div>
                    </div>

                    {/* RIGHT: Content & Actions */}
                    <div className="w-full md:w-[60%] flex flex-col h-full overflow-hidden">

                        {/* Header Info */}
                        <div className="text-center md:text-left mb-6 shrink-0">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-2">
                                Created on {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                            <h2 className="text-slate-800 font-bold text-2xl leading-tight">
                                {item.prompt && item.prompt.length > 50 ? item.prompt.substring(0, 50) + "..." : (item.prompt || "Untitled Amazing Artwork")}
                            </h2>
                        </div>

                        {/* Scrollable Content (Story/Audio/Desc) */}
                        <div className="flex-1 overflow-y-auto min-h-0 pr-2 custom-scrollbar mb-6">
                            {item.type === 'story' && item.meta ? (
                                <div className="flex flex-col gap-4">
                                    {/* Audio Player */}
                                    {item.meta.audioUrl && (
                                        <div className="bg-violet-50 p-3 rounded-2xl border border-violet-100 flex items-center gap-3 shadow-sm">
                                            <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center shadow-md shrink-0 animate-pulse">
                                                <Music className="text-white w-5 h-5" />
                                            </div>
                                            <audio controls src={item.meta.audioUrl} className="flex-1 h-8 bg-transparent" />
                                        </div>
                                    )}

                                    {/* Story Text */}
                                    {item.meta.story && (
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sticky top-0 bg-slate-50">The Story</h4>
                                            <p className="text-slate-700 text-sm leading-relaxed font-serif whitespace-pre-wrap break-words">
                                                {item.meta.story}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sticky top-0 bg-slate-50">Prompt</h4>
                                    <p className="text-slate-700 text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">
                                        {item.prompt || "No description available."}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Bottom Actions */}
                        <div className="grid grid-cols-2 gap-3 shrink-0 mt-auto">
                            <button
                                onClick={() => onToggleFavorite(item.id)}
                                className={`flex items-center justify-center gap-2 py-4 rounded-2xl transition-all shadow-sm active:scale-95 ${item.favorite
                                    ? 'bg-rose-50 text-rose-500 ring-2 ring-rose-200'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                <Heart className={`w-6 h-6 ${item.favorite ? 'fill-current' : ''}`} />
                                <span className="text-sm font-bold uppercase">Favorite</span>
                            </button>

                            <button
                                onClick={() => alert("Thanks for recommending! We'll show more like this.")}
                                className="flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-500 hover:bg-yellow-50 hover:text-yellow-600 rounded-2xl transition-all shadow-sm active:scale-95"
                            >
                                <Sparkles className="w-6 h-6" />
                                <span className="text-sm font-bold uppercase">Recommend</span>
                            </button>

                            <button
                                onClick={() => alert("Co-Create feature coming soon!")}
                                className="flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-all shadow-sm active:scale-95"
                            >
                                <Users className="w-6 h-6" />
                                <span className="text-sm font-bold uppercase">Remix</span>
                            </button>

                            <a
                                href={item.imageUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-500 hover:bg-green-50 hover:text-green-600 rounded-2xl transition-all shadow-sm active:scale-95"
                            >
                                <Download className="w-6 h-6" />
                                <span className="text-sm font-bold uppercase">Save</span>
                            </a>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
