import React from 'react';
import { motion } from 'framer-motion';

interface MagicPencilProps {
    color: string;
    isActive: boolean;
    onClick: () => void;
    label?: string; // Optional label (e.g. "Pen", "Eraser")
}

export const MagicPencil: React.FC<MagicPencilProps> = ({ color, isActive, onClick, label }) => {
    // Determine gradient colors based on the input color
    // For eraser (pink), we might want a specific look
    const isEraser = label?.toLowerCase() === 'eraser';

    // Gradient ID must be unique
    const gradId = `grad-${color.replace('#', '')}-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <motion.div
            onClick={onClick}
            animate={{
                y: isActive ? -20 : 0,
                scale: isActive ? 1.15 : 1,
            }}
            whileHover={{ scale: 1.05, y: isActive ? -25 : -5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className={`relative cursor-pointer flex flex-col items-center gap-2 group ${isActive ? 'z-10' : 'z-0'}`}
        >
            {/* 3D Pencil SVG */}
            <div className="filter drop-shadow-xl">
                <svg width="40" height="100" viewBox="0 0 40 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        {/* Body Gradient */}
                        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                            <stop offset="30%" stopColor={color} stopOpacity="1" />
                            <stop offset="50%" stopColor="white" stopOpacity="0.3" /> {/* Highlight */}
                            <stop offset="100%" stopColor={color} stopOpacity="0.6" /> {/* Shadow side */}
                        </linearGradient>

                        {/* Wood Gradient */}
                        <linearGradient id="wood-grad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#DEB887" />
                            <stop offset="50%" stopColor="#FFE4B5" />
                            <stop offset="100%" stopColor="#CD853F" />
                        </linearGradient>
                    </defs>

                    {/* Pencil Body */}
                    <path d="M4 0 H36 V75 H4 Z" fill={`url(#${gradId})`} stroke={isActive ? "white" : "none"} strokeWidth="1" />

                    {/* Metal Ferrule (or Eraser Holder) */}
                    {!isEraser && <rect x="4" y="0" width="32" height="10" fill="#C0C0C0" />}

                    {/* Sharpened Wood */}
                    <path d="M4 75 L 20 95 L 36 75 Z" fill="url(#wood-grad)" />

                    {/* Lead Tip */}
                    <path d="M16 90 L 20 100 L 24 90 Z" fill={color} />

                    {/* Glossy Overlay (Glassmorphism touch) */}
                    <path d="M10 0 V75" stroke="white" strokeOpacity="0.2" strokeWidth="4" />
                </svg>
            </div>

            {/* Label (Optional) */}
            {label && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm border border-white/50 text-slate-600 shadow-sm transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {label}
                </span>
            )}
        </motion.div>
    );
};
