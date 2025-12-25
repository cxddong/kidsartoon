import React from 'react';
import { cn } from '../../lib/utils';
import { Sparkles, Crown } from 'lucide-react';

interface VIPCoverProps {
    imageUrl: string;
    isVIP: boolean;
    childName?: string;
    className?: string;
    aspectRatio?: 'square' | 'video' | 'portrait';
}

export const VIPCover: React.FC<VIPCoverProps> = ({
    imageUrl,
    isVIP,
    childName = 'Artist',
    className,
    aspectRatio = 'square'
}) => {

    // Aspect Ratio Utils
    const aspectClass = {
        square: 'aspect-square',
        video: 'aspect-video',
        portrait: 'aspect-[3/4]',
    }[aspectRatio];

    if (!isVIP) {
        return (
            <div className={cn("relative overflow-hidden rounded-2xl w-full", aspectClass, className)}>
                <img src={imageUrl} className="w-full h-full object-cover" loading="lazy" />
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden rounded-2xl w-full group border-4 border-yellow-400/50 shadow-xl shadow-yellow-200/50", aspectClass, className)}>
            {/* Main Image */}
            <img src={imageUrl} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" loading="lazy" />

            {/* VIP Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/10 via-transparent to-white/20 pointer-events-none" />

            {/* Bottom Branding */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end text-center">

                {/* Badge */}
                <div className="flex items-center gap-1.5 bg-yellow-400/90 text-yellow-900 px-3 py-1 rounded-full backdrop-blur-md shadow-lg mb-1 transform group-hover:scale-110 transition-transform">
                    <Crown className="w-3 h-3 fill-current" />
                    <span className="text-[10px] uppercase font-black tracking-widest">Masterpiece Edition</span>
                </div>

                {/* Typography */}
                <h3 className="text-white font-serif text-lg md:text-xl italic tracking-wide drop-shadow-lg flex items-center gap-2">
                    <span className="text-yellow-200">✨</span> as told by {childName}
                </h3>
            </div>
        </div>
    );
};
