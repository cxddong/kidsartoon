import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useVideoAutoplay } from '../../hooks/useVideoAutoplay';

// Assuming we want to pass the video source or hardcode it. 
// For better reusability, I'll accept it as a prop or handle it if passed.
interface MagicKatButtonProps {
    videoSrc: string;
}

export const MagicKatButton: React.FC<MagicKatButtonProps> = ({ videoSrc }) => {
    const navigate = useNavigate();
    const videoRef = useVideoAutoplay<HTMLVideoElement>();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                duration: 1,
                type: "spring",
                bounce: 0.4
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative cursor-pointer group"
            onClick={() => navigate('/magic-lab')}
        >
            {/* Breathing Aura */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-3xl animate-pulse group-hover:bg-purple-500/40 transition-colors" />

            {/* Main Circle */}
            <div className="relative w-40 h-40 md:w-56 md:h-56 bg-white/20 backdrop-blur-xl rounded-full shadow-[0_0_50px_rgba(139,92,246,0.3)] border-[6px] border-white/40 flex items-center justify-center overflow-hidden z-20 group-hover:border-white/60 transition-all">
                <video
                    ref={videoRef}
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity transform scale-105"
                />
            </div>

            {/* Label */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 z-30">
                <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-2 shadow-lg group-hover:bg-white/20 transition-all">
                    <Sparkles className="w-4 h-4 text-yellow-300 fill-yellow-300 animate-spin-slow" />
                    <span className="text-white font-bold text-sm tracking-widest uppercase text-shadow-sm whitespace-nowrap">
                        Ask Magic Kat
                    </span>
                </div>
            </div>
        </motion.div>
    );
};
