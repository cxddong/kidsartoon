import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const LOADING_MESSAGES = [
    "Chasing magical laser pointers... 🐱",
    "Mixing colorful potions... 🧪",
    "Teaching robots to paint... 🤖",
    "Nap time? No, creating time! 💤",
    "Summoning creativity sprites... ✨",
    "Sharpening magic pencils... ✏️",
    "Looking for the perfect color... 🎨",
    "Asking the pixels to cooperate... 👾",
    "Feeding the imagination dragons... 🐲",
    "Polishing the magic wand... 🪄"
];

interface MagicKatLoaderProps {
    text?: string;
    fullScreen?: boolean;
    className?: string;
}

export const MagicKatLoader: React.FC<MagicKatLoaderProps> = ({
    text,
    fullScreen = true,
    className = ""
}) => {
    const [message, setMessage] = useState(LOADING_MESSAGES[0]);

    useEffect(() => {
        // Pick a random message on mount
        setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);

        // Optional: Rotate messages if loading takes too long
        const interval = setInterval(() => {
            setMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const content = (
        <div className={`flex flex-col items-center justify-center gap-6 p-8 relative ${className}`}>
            {/* Animated Cat Avatar */}
            <div className="relative">
                <motion.div
                    animate={{
                        y: [-10, 10, -10],
                        rotate: [-5, 5, -5]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="text-6xl filter drop-shadow-xl"
                >
                    🐱
                </motion.div>

                {/* Orbiting Sparkle */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-full h-full"
                >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </div>
                </motion.div>
            </div>

            {/* Loading Text */}
            <div className="flex flex-col items-center gap-2">
                <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse text-center">
                    {text || "Magic in progress..."}
                </h3>

                <AnimatePresence mode='wait'>
                    <motion.p
                        key={message}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm font-bold text-slate-400 text-center min-h-[20px]"
                    >
                        {message}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Loading Bar */}
            <div className="w-48 h-2 bg-slate-100/50 rounded-full overflow-hidden border border-slate-200">
                <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                    animate={{
                        x: ["-100%", "100%"]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md">
                {content}
            </div>
        );
    }

    return content;
};
