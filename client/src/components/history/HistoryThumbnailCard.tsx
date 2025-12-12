import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, BookOpen, Image as ImageIcon } from 'lucide-react';
import type { ImageRecord } from './ImageModal';

interface HistoryThumbnailCardProps {
    image: ImageRecord;
    onClick: () => void;
}

const HistoryThumbnailCard: React.FC<HistoryThumbnailCardProps> = ({ image, onClick }) => {

    const getTypeConfig = () => {
        switch (image.type) {
            case 'animation':
                return { icon: <Play size={12} className="fill-current" />, color: 'bg-purple-500', label: 'Animation' };
            case 'comic':
                return { icon: <BookOpen size={12} />, color: 'bg-orange-500', label: 'Comic' };
            case 'story':
                return { icon: <BookOpen size={12} />, color: 'bg-blue-500', label: 'Story' };
            case 'generated':
                return { icon: <ImageIcon size={12} />, color: 'bg-green-500', label: 'Picture Book' };
            default:
                return { icon: <ImageIcon size={12} />, color: 'bg-slate-500', label: 'Image' };
        }
    };

    const typeConfig = getTypeConfig();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-100 shadow-sm hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary/20"
            onClick={onClick}
        >
            <img
                src={image.imageUrl}
                alt={image.prompt || "Artwork"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Favorite Indicator */}
            {image.favorite && (
                <div className="absolute top-2 right-2 p-1.5 bg-rose-500 rounded-full text-white shadow-sm z-10">
                    <Heart size={12} fill="white" />
                </div>
            )}

            {/* Type Badge */}
            <div className={`absolute top-2 left-2 px-2 py-1 ${typeConfig.color} text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-1.5 z-10`}>
                {typeConfig.icon}
                {typeConfig.label}
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 text-white">
                <p className="text-xs font-medium truncate opacity-90">
                    {new Date(image.createdAt).toLocaleDateString()}
                </p>
                {image.prompt && (
                    <p className="text-xs font-bold truncate">
                        {image.prompt}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

export default HistoryThumbnailCard;
