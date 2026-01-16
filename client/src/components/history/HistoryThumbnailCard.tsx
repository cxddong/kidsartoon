import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, BookOpen, Image as ImageIcon, Check } from 'lucide-react';
import type { ImageRecord } from './ImageModal';
import { slideAndSkewVariants } from '../../lib/animations';
import { cn } from '../../lib/utils';

interface HistoryThumbnailCardProps {
    image: ImageRecord;
    onClick: () => void;
    viewMode?: 'grid' | 'list';
    isSelectionMode?: boolean;
    isSelected?: boolean;
    onToggle?: () => void;
}

const HistoryThumbnailCard: React.FC<HistoryThumbnailCardProps> = ({ image, onClick, viewMode = 'grid', isSelectionMode, isSelected, onToggle }) => {
    // Determine the best thumbnail URL
    const getThumbnailUrl = () => {
        // Special handlings for Audio Stories (where imageUrl is often .mp3)
        if (image.type === 'story') {
            if (image.meta?.originalImageUrl) return image.meta.originalImageUrl;
            if (image.meta?.inputImageUrl) return image.meta.inputImageUrl;
            // If main URL is NOT audio, use it (fallback)
            if (image.imageUrl && !image.imageUrl.endsWith('.mp3') && !image.imageUrl.endsWith('.wav')) {
                return image.imageUrl;
            }
            // Absolute fallback placeholder
            return 'https://placehold.co/400x400/indigo/white?text=Audio+Story';
        }

        // Standard checks
        if (image.meta?.gridImageUrl) return image.meta.gridImageUrl;
        if (image.meta?.thumbnailUrl) return image.meta.thumbnailUrl;
        if (image.meta?.originalImageUrl) return image.meta.originalImageUrl;

        // Type specific fallbacks
        if (image.type === 'picturebook' && image.meta?.pages?.[0]?.imageUrl) {
            return image.meta.pages[0].imageUrl;
        }
        if (image.type === 'comic' && image.meta?.scenes?.[0]?.imageUrl) {
            return image.meta.scenes[0].imageUrl;
        }

        // Cartoon Book / Graphic Novel Fallback
        if (image.type === 'graphic-novel' || image.type === 'cartoon-book') {
            if (image.meta?.pages?.[0]?.imageUrl) return image.meta.pages[0].imageUrl;
            if (image.meta?.cartoonBook?.pages?.[0]?.imageUrl) return image.meta.cartoonBook.pages[0].imageUrl;
            if (!image.imageUrl || image.imageUrl.length < 5) {
                return 'https://placehold.co/400x400/rose/white?text=Cartoon+Book';
            }
        }

        // Default legacy check
        if (image.imageUrl && image.imageUrl.length > 5 && !image.imageUrl.includes('undefined')) return image.imageUrl;

        return image.imageUrl;
    };

    const thumbnailUrl = getThumbnailUrl();

    const getTypeConfig = () => {
        switch (image.type) {
            case 'animation':
                return { icon: <Play size={20} className="fill-current" />, color: 'bg-purple-500', label: 'Magic Cinema' };
            case 'picturebook':
                return { icon: <BookOpen size={20} />, color: 'bg-orange-500', label: 'Storybook' };
            case 'comic':
                return { icon: <BookOpen size={20} />, color: 'bg-red-500', label: 'Comic' };
            case 'story':
                // Audio Story - Use Play icon, distinct from Book
                return { icon: <Play size={20} />, color: 'bg-indigo-500', label: 'Audio Story' };
            case 'generated':
                // Magic Art (Single Image)
                return { icon: <ImageIcon size={20} />, color: 'bg-blue-500', label: 'Magic Art' };
            case 'cards':
                return { icon: <Heart size={20} />, color: 'bg-pink-500', label: 'Greeting Card' };
            case 'upload':
                return { icon: <ImageIcon size={20} />, color: 'bg-teal-500', label: 'Gallery' };
            case 'masterpiece':
                return { icon: <ImageIcon size={20} />, color: 'bg-amber-500', label: 'Magic Paint' };
            case 'graphic-novel':
            case 'cartoon-book':
                return { icon: <BookOpen size={20} />, color: 'bg-rose-500', label: 'Cartoon Book' };
            default:
                return { icon: <ImageIcon size={20} />, color: 'bg-slate-500', label: 'Artwork' };
        }
    };

    const typeConfig = getTypeConfig();

    const handleCardClick = () => {
        if (isSelectionMode && onToggle) {
            onToggle();
        } else {
            onClick();
        }
    };

    if (viewMode === 'list') {
        return (
            <motion.div
                layout
                variants={slideAndSkewVariants}
                className={cn(
                    "group w-full flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm border hover:shadow-md transition-all cursor-pointer",
                    isSelectionMode && isSelected ? "border-red-500 bg-red-50" : "border-slate-100"
                )}
                onClick={handleCardClick}
            >
                {/* Checkbox (List) */}
                {isSelectionMode && (
                    <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        isSelected ? "bg-red-500 border-red-500" : "border-slate-300 bg-white"
                    )}>
                        {isSelected && <Check size={14} className="text-white" />}
                    </div>
                )}

                {/* Image Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative bg-slate-100">
                    <img src={thumbnailUrl} alt={image.prompt} className="w-full h-full object-cover" loading="lazy" />
                    {/* Tiny type indicator on image */}
                    <div className={`absolute top-0 left-0 w-full h-full ${typeConfig.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${typeConfig.color} flex items-center gap-1`}>
                            {typeConfig.icon} {typeConfig.label}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(image.createdAt).toLocaleDateString()}</span>
                    </div>
                    {/* Removed prompt display */}
                </div>

                {/* Actions */}
                <div className="shrink-0 pr-2">
                    {image.favorite && <Heart size={16} className="text-rose-500 fill-rose-500" />}
                </div>
            </motion.div>
        );
    }

    // Grid View (Default)
    return (
        <motion.div
            layout
            variants={slideAndSkewVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={cn(
                "group relative aspect-square rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-shadow border-4",
                isSelectionMode && isSelected
                    ? "border-red-500 ring-2 ring-red-200"
                    : "border-transparent bg-slate-200 hover:border-primary/20"
            )}
            onClick={handleCardClick}
        >
            <img
                src={thumbnailUrl}
                alt="Artwork"
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Checkbox Overlay (Grid) */}
            {isSelectionMode && (
                <div className="absolute top-2 right-2 z-20">
                    <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-md",
                        isSelected ? "bg-red-500 border-red-500" : "border-white bg-black/40 backdrop-blur-sm"
                    )}>
                        {isSelected && <Check size={14} className="text-white" />}
                    </div>
                </div>
            )}

            {/* Favorite Indicator */}
            {image.favorite && !isSelectionMode && (
                <div className="absolute top-2 right-2 p-1.5 bg-rose-500 rounded-full text-white shadow-sm z-10">
                    <Heart size={12} fill="white" />
                </div>
            )}

            {/* Type Badge - Enlarged & Vertical */}
            <div className={`absolute top-2 left-2 px-2 py-2 ${typeConfig.color} text-white rounded-xl shadow-md flex flex-col items-center justify-center gap-0.5 z-10 min-w-[50px]`}>
                {typeConfig.icon}
                <span className="text-[9px] font-black uppercase tracking-wider leading-none shadow-black drop-shadow-sm">{typeConfig.label}</span>
            </div>

            {/* Bottom Info - ALWAYS VISIBLE DATE */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-8 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-0.5">Created</p>
                <p className="text-xs font-medium truncate">
                    {new Date(image.createdAt).toLocaleDateString()}
                </p>
            </div>
        </motion.div>
    );
};

export default HistoryThumbnailCard;
