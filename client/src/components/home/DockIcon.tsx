import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useVideoAutoplay } from '../../hooks/useVideoAutoplay';

interface DockIconProps {
    to: string;
    label: string;
    icon?: React.ReactNode;
    videoSrc?: string; // Optional video for dock icons if we want them fancy
}

export const DockIcon: React.FC<DockIconProps> = ({ to, label, icon, videoSrc }) => {
    const navigate = useNavigate();
    const videoRef = useVideoAutoplay<HTMLVideoElement>();

    return (
        <motion.div
            className="group flex flex-col items-center gap-1 cursor-pointer"
            whileHover={{ scale: 1.15, y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(to)}
        >
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group-hover:bg-white/30 group-hover:border-white/50 transition-all overflow-hidden">
                {videoSrc ? (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        autoPlay
                        loop
                        muted={true}
                        playsInline
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="text-white group-hover:text-white transition-colors">
                        {icon}
                    </div>
                )}
            </div>
            <span className="text-[10px] text-white/80 font-medium tracking-tight group-hover:text-white">
                {label}
            </span>
        </motion.div>
    );
};
