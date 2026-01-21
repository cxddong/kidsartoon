import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Volume2 } from 'lucide-react';

interface KatTutorProps {
    message: string;
    emotion?: 'happy' | 'thinking' | 'waiting' | 'celebrate';
    onSpeak?: () => void;
    position?: 'left' | 'right' | 'center' | 'bottom-right' | 'static';
    className?: string;
    startSpeaking?: boolean;
}

export const KatTutor: React.FC<KatTutorProps> = ({ message, emotion = 'happy', onSpeak, position = 'bottom-right', className = '', startSpeaking = false }) => {
    // Determine Kat Image based on emotion usually
    // detailed implementations would swap images
    const [displayedMessage, setDisplayedMessage] = useState(message);
    const [hasSpoken, setHasSpoken] = useState(false);

    useEffect(() => {
        setDisplayedMessage(message);
    }, [message]);

    // Auto-speak support
    useEffect(() => {
        if (startSpeaking && onSpeak && !hasSpoken) {
            onSpeak();
            setHasSpoken(true);
        }
    }, [startSpeaking, onSpeak, hasSpoken]);

    const positionClasses = {
        'left': 'top-20 left-4 flex-row',
        'right': 'top-20 right-4 flex-row-reverse',
        'center': 'top-1/4 left-1/2 -translate-x-1/2 flex-col items-center',
        'bottom-right': 'bottom-8 right-8 flex-col-reverse items-end'
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`${position === 'static' ? 'relative flex-col items-center' : `absolute z-50 flex gap-4 pointer-events-none ${positionClasses[position]}`} ${className}`}
            >
                {/* Kat Avatar */}
                <div className="relative w-32 h-32 md:w-48 md:h-48 drop-shadow-2xl pointer-events-auto transition-transform hover:scale-110 cursor-pointer" onClick={onSpeak}>
                    {/* Placeholder for Kat 3D Render - Using Emoji or existing asset for now */}
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border-4 border-white flex items-center justify-center text-6xl shadow-inner">
                        {emotion === 'happy' && '🦁'}
                        {emotion === 'thinking' && '🤔'}
                        {emotion === 'waiting' && '👀'}
                        {emotion === 'celebrate' && '🎉'}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-2 rounded-full border-2 border-white">
                        <Volume2 className="w-6 h-6 text-yellow-900" />
                    </div>
                </div>

                {/* Speech Bubble */}
                <motion.div
                    key={message}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 backdrop-blur-md p-6 rounded-3xl rounded-tr-none shadow-xl border-2 border-indigo-100 max-w-xs md:max-w-md pointer-events-auto"
                >
                    <div className="flex items-start gap-3">
                        <Sparkles className="w-6 h-6 text-indigo-500 shrink-0 mt-1" />
                        <p className="text-lg md:text-xl font-bold text-slate-800 font-['Nunito'] leading-snug">
                            {displayedMessage}
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
};
