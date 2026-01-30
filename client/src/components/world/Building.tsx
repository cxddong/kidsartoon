
import React from 'react';
import { motion } from 'framer-motion';

interface BuildingProps {
    type: string;
    label?: string;
    onClick?: () => void;
}

// Simple placeholders or icon mapping could be added here
// For now, these are transparent "Hotspots" or simple markers
export const Building: React.FC<BuildingProps> = ({ label, onClick }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClick}
            className="flex flex-col items-center gap-2 group"
        >
            {/* Visual Marker (Glassy Card) */}
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/20 backdrop-blur-md border-2 border-white/50 rounded-3xl shadow-lg flex items-center justify-center group-hover:bg-white/40 transition-colors">
                <span className="text-4xl">🏛️</span>
            </div>

            {/* Label */}
            {label && (
                <div className="px-4 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white font-bold text-sm shadow-md border border-white/20">
                    {label}
                </div>
            )}
        </motion.button>
    );
};
