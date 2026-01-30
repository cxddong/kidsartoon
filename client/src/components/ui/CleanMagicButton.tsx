import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playBubble, playClick } from '../../utils/SoundSynth';
import { MagicVideoButton } from './MagicVideoButton';

interface CleanMagicButtonProps {
    label: string;
    description?: string;
    icon?: React.ReactNode;
    videoSrc?: string;
    isFree?: boolean;
    onClick: () => void;
}

export const CleanMagicButton: React.FC<CleanMagicButtonProps> = ({
    label,
    description,
    icon,
    videoSrc,
    isFree,
    onClick
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMobile(window.innerWidth < 768);
    }, []);

    const speakDescription = () => {
        if (!description) return;
        // Simple Browser TTS
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(description);
        utterance.lang = 'en-US';
        utterance.rate = 1.1;
        utterance.pitch = 1.1; // Slightly higher pitch for "Cute" feel
        window.speechSynthesis.speak(utterance);
    };

    const handleMouseEnter = () => {
        if (isMobile) return; // Ignore hover on mobile
        if (!isFocused) {
            setIsFocused(true);
            playBubble();
            speakDescription();
        }
    };

    const handleMouseLeave = () => {
        if (isMobile) return;
        setIsFocused(false);
        window.speechSynthesis.cancel();
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (isMobile) {
            if (!isFocused) {
                // First Tap: Focus & Speak
                setIsFocused(true);
                playBubble();
                speakDescription();
            } else {
                // Second Tap: Action
                playClick();
                onClick();
            }
        } else {
            // Desktop: Always Action (Focus handled by hover)
            playClick();
            onClick();
        }
    };

    return (
        <div
            className="relative flex flex-col items-center gap-2 group"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* 1. 3D Icon/Video Container */}
            <motion.div
                className={`relative w-24 h-24 rounded-full shadow-xl cursor-pointer bg-white/30 backdrop-blur-md overflow-hidden z-20 transition-all duration-300 border-2`}
                animate={{
                    scale: isFocused ? 1.15 : 1,
                    borderColor: isFocused ? 'rgba(250, 204, 21, 0.8)' : 'rgba(255, 255, 255, 0.6)',
                    boxShadow: isFocused
                        ? '0 0 30px rgba(250, 204, 21, 0.4)'
                        : '0 10px 20px rgba(0, 0, 0, 0.1)'
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClick}
            >
                {videoSrc ? (
                    <MagicVideoButton
                        videoSrc={videoSrc}
                        className="w-full h-full object-cover"
                        label="" // No internal label
                        enableMobileAutoPlay={true}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/50">
                        {/* Fallback Icon */}
                        <div className="text-4xl filter drop-shadow-md">
                            {icon}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* 2. Free Badge (if applicable) */}
            {isFree && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white z-30 transform rotate-12 animate-pulse pointer-events-none">
                    FREE
                </div>
            )}

            {/* 3. Minimalist Pill Label (Default Visible) */}
            <div className={`px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20 shadow-sm transition-opacity duration-300 ${isFocused ? 'opacity-0' : 'opacity-100'}`}>
                <span className="text-white text-xs font-bold tracking-wide drop-shadow-md whitespace-nowrap">
                    {label}
                </span>
            </div>

            {/* 4. Dynamic Tooltip Bubble (Visible on Focus) */}
            <AnimatePresence>
                {isFocused && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="absolute -top-14 bg-white/95 backdrop-blur-xl text-indigo-900 text-[11px] font-extrabold py-3 px-5 rounded-2xl shadow-2xl z-50 whitespace-nowrap pointer-events-none border-2 border-indigo-50"
                    >
                        {description}

                        {/* Bubble Triangle */}
                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 border-b-2 border-r-2 border-indigo-50 rounded-br-sm"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
