import React from 'react';
import { motion } from 'framer-motion';
import { Play, BookOpen, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { ImageRecord } from '../history/ImageModal';

interface ContentGridProps {
    items: ImageRecord[];
    onItemClick: (item: ImageRecord) => void;
}

export const ContentGrid: React.FC<ContentGridProps> = ({ items, onItemClick }) => {
    const { user } = useAuth();

    if (items.length === 0) {
        return (
            <div className="text-center py-12 px-6 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200 mx-6">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-lg font-bold text-slate-600 mb-2">Community Gallery is Empty</h3>
                <p className="text-slate-400">Be the first to share your creation!</p>
            </div>
        );
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'animation': return <Play size={12} className="fill-current" />;
            case 'comic':
            case 'story': return <BookOpen size={12} />;
            default: return <ImageIcon size={12} />;
        }
    };

    return (
        <div className="px-6 pb-32">


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.slice(0, 12).map((item, idx) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-white hover:shadow-xl transition-shadow flex flex-col"
                    >
                        {/* 1. Header: User Info (Mock) */}
                        <div className="p-2 flex items-center gap-2 border-b border-slate-50">
                            <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden border border-white shadow-sm">
                                <img
                                    src={item.userId === user?.uid ? (user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix") : `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.userId}`}
                                    alt="User"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-700 truncate">
                                    {item.userId === user?.uid ? (user?.name || "Me") : `Artist ${item.userId.slice(0, 4)}`}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* 2. Image */}
                        <div
                            className="aspect-square bg-slate-100 relative cursor-pointer group"
                            onClick={() => onItemClick(item)}
                        >
                            <img
                                src={item.imageUrl}
                                alt="Creation"
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />

                            {/* Type Badge */}
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 shadow-sm">
                                {getTypeIcon(item.type)}
                                {item.type}
                            </div>
                        </div>

                        {/* 3. Social Actions */}
                        <div className="p-3 grid grid-cols-4 gap-1 border-t border-slate-50">
                            {/* Collect (Star) */}
                            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-yellow-500 transition-colors group">
                                <div className="p-1.5 rounded-full group-hover:bg-yellow-50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                </div>
                                <span className="text-[9px] font-bold">Collect</span>
                            </button>

                            {/* Share (Forward) */}
                            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors group">
                                <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                                </div>
                                <span className="text-[9px] font-bold">Share</span>
                            </button>

                            {/* Like (Heart) */}
                            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-rose-500 transition-colors group">
                                <div className="p-1.5 rounded-full group-hover:bg-rose-50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                                </div>
                                <span className="text-[9px] font-bold">Like</span>
                            </button>

                            {/* Remix (Sparkles) */}
                            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-purple-500 transition-colors group">
                                <div className="p-1.5 rounded-full group-hover:bg-purple-50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /></svg>
                                </div>
                                <span className="text-[9px] font-bold">Remix</span>
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
