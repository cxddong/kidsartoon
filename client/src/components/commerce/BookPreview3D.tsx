import React from 'react';
import { motion } from 'framer-motion';

interface BookPreview3DProps {
    coverImage?: string;
    title?: string;
    type: 'hardcover' | 'videobook';
    isOpen?: boolean;
}

export const BookPreview3D: React.FC<BookPreview3DProps> = ({ coverImage, title, type, isOpen }) => {
    return (
        <div className="perspective-1000 w-64 h-80 relative group">
            <motion.div
                className="w-full h-full relative transform-style-3d transition-all duration-700"
                animate={{
                    rotateY: isOpen ? -20 : -15,
                    rotateX: 10
                }}
                whileHover={{
                    rotateY: -5,
                    rotateX: 0,
                    scale: 1.05
                }}
            >
                {/* Front Cover */}
                <div
                    className="absolute inset-0 bg-purple-900 rounded-r-lg rounded-l-sm shadow-2xl backface-hidden flex flex-col overflow-hidden border-r-4 border-purple-950"
                    style={{
                        transform: 'rotateY(0deg) translateZ(15px)'
                    }}
                >
                    {/* Spine Effect */}
                    <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-purple-950 to-purple-800 z-10 opacity-50" />

                    {coverImage ? (
                        <img src={coverImage} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 p-6 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full mb-4 animate-pulse" />
                            <h3 className="text-white font-black text-2xl drop-shadow-md font-serif">
                                {title || "My Magic Story"}
                            </h3>
                        </div>
                    )}

                    {/* Gloss Reflection */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                </div>

                {/* Back Cover */}
                <div
                    className="absolute inset-0 bg-purple-900 rounded-l-lg rounded-r-sm shadow-lg backface-hidden"
                    style={{
                        transform: 'rotateY(180deg) translateZ(15px)'
                    }}
                >
                    <div className="w-full h-full bg-purple-900 flex items-end justify-center pb-8 p-4">
                        <div className="text-white/50 text-xs font-bold uppercase tracking-widest text-center">
                            Magic Press<br />High Quality Print
                        </div>
                    </div>
                </div>

                {/* Pages (Thickness) */}
                <div
                    className="absolute right-0 top-1 bottom-1 w-[28px] bg-white transform-style-3d"
                    style={{
                        transform: 'rotateY(90deg) translateZ(-13px)' // Adjusted for width
                    }}
                >
                    {/* Page Lines */}
                    <div className="w-full h-full bg-[repeating-linear-gradient(90deg,transparent,transparent_1px,#eee_1px,#eee_2px)]" />
                </div>

            </motion.div>

            {/* Shadow */}
            <div className="absolute -bottom-8 left-4 right-4 h-4 bg-black/20 blur-xl rounded-full transform rotate-3" />
        </div>
    );
};
