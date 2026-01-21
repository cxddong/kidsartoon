import React from 'react';
import { motion } from 'framer-motion';
import catLogoVideo from '../../assets/catlogo.mp4';
import { Sparkles, Paintbrush } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MagicBrandLogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
    animated?: boolean;
}

export const MagicBrandLogo: React.FC<MagicBrandLogoProps> = ({
    className,
    size = 'md',
    showText = true,
    animated = true
}) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-16 h-16",
        lg: "w-24 h-24",
        xl: "w-40 h-40"
    };

    return (
        <div className={cn("flex flex-col items-center gap-2", className)}>
            <div className={cn("relative rounded-full overflow-hidden shadow-2xl border-4 border-white/50 bg-white", sizeClasses[size])}>
                {animated ? (
                    <video
                        src={catLogoVideo}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover scale-110"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
                        <span className="text-4xl">🐱</span>
                    </div>
                )}

                {/* 3D Brush Floating Effect */}
                <motion.div
                    animate={{ rotate: [0, 10, 0], y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -bottom-1 -right-1 bg-white p-1.5 rounded-full shadow-lg z-10"
                >
                    <Paintbrush className="w-1/2 h-1/2 text-pink-500 fill-pink-500" />
                </motion.div>
            </div>

            {showText && (
                <div className="text-center relative">
                    <h1 className={cn(
                        "font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
                        size === 'sm' && "text-sm",
                        size === 'md' && "text-xl",
                        size === 'lg' && "text-3xl",
                        size === 'xl' && "text-5xl"
                    )}>
                        Kids<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">Artoon</span>
                    </h1>
                    <Sparkles className="absolute -top-4 -right-4 text-yellow-300 w-6 h-6 animate-pulse" />
                </div>
            )}
        </div>
    );
};
