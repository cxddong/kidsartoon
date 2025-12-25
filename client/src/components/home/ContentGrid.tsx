import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, BookOpen, Image as ImageIcon, Share2, Heart, Wand2, Star, Facebook, Instagram, MessageCircle, Twitter, Mic, Grid } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { ImageRecord } from '../history/ImageModal';
import { cn } from '../../lib/utils'; // Ensure we use utility

interface ContentGridProps {
    items: ImageRecord[];
    onItemClick: (item: ImageRecord) => void;
}

const ContentCard = ({ item, onItemClick, user }: { item: ImageRecord, onItemClick: (i: ImageRecord) => void, user: any }) => {
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(false); // Optimistic UI
    const [showShare, setShowShare] = useState(false);

    const getTypeIcon = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('anim') || t.includes('video')) return <Play size={12} className="fill-current" />;
        if (t.includes('story') || t.includes('audio')) return <Mic size={12} />;
        if (t.includes('book') || t.includes('comic')) return <BookOpen size={12} />;
        if (t.includes('card') || t === 'generated') return <Grid size={12} />;
        return <ImageIcon size={12} />;
    };

    const getBadgeLabel = (type: string) => {
        const t = (type || '').toLowerCase();
        if (t.includes('card') || t === 'generated') return 'Greeting Card';
        if (t === 'comic' || t === 'comic-strip') return 'Comic Strip';
        if (t === 'picture-book' || t.includes('book')) return 'Picture Book';
        if (t.includes('story') || t.includes('audio')) return 'Audio Story';
        if (t.includes('anim') || t.includes('video')) return 'Animation';
        return 'Magic Art';
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return alert("Please login to like!");

        setIsLiked(!isLiked); // Optimistic
        try {
            await fetch('/api/media/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, imageId: item.id })
            });
        } catch (err) {
            setIsLiked(!isLiked); // Revert
        }
    };

    const handleRemix = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Determine remix path based on type or generic
        let path = '/make-cartoon';
        if (item.type === 'comic') path = '/generate/comic';

        navigate(path, { state: { remixImage: item.imageUrl, prompt: item.prompt } });
    };

    const handleShare = (platform: string) => {
        // Mock share
        alert(`Shared to ${platform}!`);
        setShowShare(false);
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-slate-100 hover:shadow-xl hover:border-blue-200 transition-all flex flex-col relative"
        >
            {/* 1. Header: User Info */}
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
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                />
                {/* Type Badge */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 shadow-sm border border-white/20">
                    {getTypeIcon(item.type)}
                    {getBadgeLabel(item.type)}
                </div>
            </div>

            {/* 3. Social Actions */}
            <div className="p-3 grid grid-cols-4 gap-1 border-t border-slate-50 relative">
                {/* Collect */}
                <button
                    onClick={(e) => { e.stopPropagation(); alert("Saved to collection!"); }}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-yellow-500 transition-colors group"
                >
                    <div className="p-1.5 rounded-full group-hover:bg-yellow-50 transition-colors">
                        <Star size={16} />
                    </div>
                    <span className="text-[9px] font-bold">Collect</span>
                </button>

                {/* Share with Popover */}
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowShare(!showShare); }}
                        className="w-full flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors group"
                    >
                        <div className="p-1.5 rounded-full group-hover:bg-blue-50 transition-colors">
                            <Share2 size={16} />
                        </div>
                        <span className="text-[9px] font-bold">Share</span>
                    </button>

                    <AnimatePresence>
                        {showShare && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 flex gap-2 z-20 min-w-max"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button onClick={() => handleShare('Instagram')} className="p-2 hover:bg-pink-50 rounded-lg text-pink-500"><Instagram size={18} /></button>
                                <button onClick={() => handleShare('Facebook')} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"><Facebook size={18} /></button>
                                <button onClick={() => handleShare('TikTok')} className="p-2 hover:bg-black/5 rounded-lg text-black font-bold text-xs">Tik</button>
                                <button onClick={() => handleShare('WhatsApp')} className="p-2 hover:bg-green-50 rounded-lg text-green-500"><MessageCircle size={18} /></button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Like */}
                <button
                    onClick={handleLike}
                    className={cn("flex flex-col items-center gap-1 transition-colors group", isLiked ? "text-rose-500" : "text-slate-400 hover:text-rose-500")}
                >
                    <div className={cn("p-1.5 rounded-full transition-colors", isLiked ? "bg-rose-50" : "group-hover:bg-rose-50")}>
                        <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                    </div>
                    <span className="text-[9px] font-bold">Like</span>
                </button>

                {/* Remix */}
                <button
                    onClick={handleRemix}
                    className="flex flex-col items-center gap-1 text-slate-400 hover:text-purple-500 transition-colors group"
                >
                    <div className="p-1.5 rounded-full group-hover:bg-purple-50 transition-colors">
                        <Wand2 size={16} />
                    </div>
                    <span className="text-[9px] font-bold">Remix</span>
                </button>
            </div>
        </motion.div>
    );
};



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

    return (
        <div className="px-6 pb-32">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {items.map((item) => (
                    <ContentCard key={item.id} item={item} onItemClick={onItemClick} user={user} />
                ))}
            </div>
        </div>
    );
};
