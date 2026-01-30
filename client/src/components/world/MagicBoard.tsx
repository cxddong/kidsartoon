
import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Sparkles } from 'lucide-react';

interface MagicBoardProps {
    image: string | null;
    onDragEnd?: (event: any, info: any) => void;
}

export const MagicBoard: React.FC<MagicBoardProps> = ({ image, onDragEnd }) => {
    return (
        <motion.div
            drag
            dragMomentum={false}
            onDragEnd={onDragEnd}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileDrag={{ scale: 1.2, rotate: 0 }}
            className="cursor-move relative z-50 touch-none" // touch-none for better mobile drag
        >
            {/* The Board Container */}
            <div className="w-48 h-64 bg-white rounded-3xl shadow-2xl border-[6px] border-[#8B4513] rotate-[-5deg] relative overflow-hidden flex items-center justify-center">

                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 bg-[#fdfbf7] opacity-100" />

                {image ? (
                    <img src={image} className="w-full h-full object-cover p-2 pointer-events-none" alt="My Art" />
                ) : (
                    <div className="text-center p-4 relative z-10 opacity-50">
                        <Palette className="w-12 h-12 mx-auto mb-2 text-amber-800" />
                        <p className="font-handwriting text-amber-900 font-bold text-lg leading-tight">Empty Canvas</p>
                    </div>
                )}

                {/* Clips */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-8 bg-gray-400 rounded-b-lg shadow-md border-t-0 border-2 border-gray-500" />

                {/* Magic Sparkles (if active) */}
                {image && (
                    <div className="absolute -top-4 -right-4">
                        <Sparkles className="w-10 h-10 text-yellow-400 animate-pulse fill-yellow-400" />
                    </div>
                )}
            </div>
        </motion.div>
    );
};
