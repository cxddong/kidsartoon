import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, BookOpen, Palette } from 'lucide-react';

interface QuickChipsProps {
    isVisible: boolean;
    onSelect: (action: 'movie' | 'story' | 'comic') => void;
}

export const QuickChips: React.FC<QuickChipsProps> = ({ isVisible, onSelect }) => {
    const chips = [
        {
            id: 'movie' as const,
            icon: Film,
            label: 'Command:',
            labelZh: 'Animate It',
            color: 'from-blue-500 to-cyan-500',
            emoji: '🎬'
        },
        {
            id: 'story' as const,
            icon: BookOpen,
            label: 'Command:',
            labelZh: 'Create Story',
            color: 'from-green-500 to-emerald-500',
            emoji: '📜'
        },
        {
            id: 'comic' as const,
            icon: Palette,
            label: 'Command:',
            labelZh: 'Comicify',
            color: 'from-purple-500 to-pink-500',
            emoji: '🎨'
        }
    ];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex gap-3 justify-center flex-wrap px-4 pb-4"
                >
                    {chips.map((chip, index) => (
                        <motion.button
                            key={chip.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => onSelect(chip.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform bg-gradient-to-r ${chip.color} text-white font-bold`}
                        >
                            <span className="text-2xl">{chip.emoji}</span>
                            <div className="flex flex-col items-start">
                                <span className="text-sm leading-tight">{chip.label}</span>
                                <span className="text-xs opacity-90 leading-tight">{chip.labelZh}</span>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
