import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useVideoAutoplay } from '../../hooks/useVideoAutoplay';
import { Sparkles } from 'lucide-react';

// Feature Preview Data (Moved here or imported - keeping it self-contained or passed as prop would be better, but for now we'll duplicate or import if possible. 
// Ideally this should be in a shared config. Let's keep the preview box internal for now to match strict extraction, 
// OR we can export the data from a constants file. For this refactor, I will include the PreviewBox inside.)

interface FloatingBubbleProps {
    to: string;
    icon?: React.ReactNode | string;
    videoSrc?: string;
    label: string;
    size?: 'md' | 'lg';
    className?: string;
    delay?: number;
}

// Feature Preview Data - duplicating momentarily for self-containment or could move to a separate file later.
// To avoid massive duplication, let's define the preview map here locally or expect it passed.
// Given the prompt, let's keep it simple. I'll rely on the existing video assets imports in HomePage, 
// but wait, I can't import assets dynamically easily without them being passed in. 
// Actually, the prompt says "BubbleButton label... icon...". 
// To make this clean, I should probably pass the preview info or handle it. 
// Let's make FloatingBubble accept "activePreview" state from parent to coordinate z-indexes if needed, 
// but the new spec says "Click it like talking to a friend" for Kat, and "Hover" for others?
// The prompt doesn't explicitly mention the preview box logic remaining, but "Visual Specs" implies clean layout.
// I will keep the preview functionality as it's a nice existing feature, but adapt it.

// Re-importing assets here might be messy. Let's assume the parent passes the video/icon.
// I'll create a simple Version first.

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({
    to,
    icon,
    videoSrc,
    label,
    size = 'md',
    className,
    delay = 0
}) => {
    const navigate = useNavigate();
    const videoRef = useVideoAutoplay<HTMLVideoElement>();

    // Size mapping using Tailwind classes
    const sizeClasses = {
        md: "w-24 h-24 md:w-32 md:h-32 text-4xl", // Magic Academy & Wonderland
        lg: "w-32 h-32 md:w-40 md:h-40 text-5xl", // Master Studio
    };

    return (
        <motion.div
            className={cn(
                "relative cursor-pointer group flex flex-col items-center justify-center",
                "z-10 hover:z-50",
                className
            )}
            initial={{ y: 0 }}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: delay }}
            whileHover={{ scale: 1.1 }}
            onClick={(e) => {
                e.stopPropagation();
                navigate(to);
            }}
        >
            <div className={cn(
                "bg-white/80 backdrop-blur-md rounded-full shadow-xl border-4 border-white/50 flex items-center justify-center overflow-hidden relative group-hover:border-white transition-all",
                sizeClasses[size]
            )}>
                {videoSrc ? (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        autoPlay
                        loop
                        muted={true}
                        playsInline
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover opacity-90"
                    />
                ) : (
                    <span className="select-none">{icon}</span>
                )}
            </div>

            {/* Label - Always visible or on hover? Prompt implies visual clean but labels help. 
                Let's make it a nice pill below. */}
            <div className="mt-3 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs md:text-sm font-bold tracking-wide whitespace-nowrap">
                    {label}
                </span>
            </div>
        </motion.div>
    );
};
