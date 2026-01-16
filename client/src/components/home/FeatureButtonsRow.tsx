import React from 'react';
import { Mic, Grid, BookOpen, Film, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

interface FeatureButtonsRowProps {
    activeFilter: string | null;
    onFilterChange: (filter: string | null) => void;
}

export const FeatureButtonsRow: React.FC<FeatureButtonsRowProps> = ({ activeFilter, onFilterChange }) => {
    const { user } = useAuth();
    const isVisual = user?.uiMode === 'visual';

    const buttons = [
        { label: 'All', id: null, image: '/assets/logo_kidsartoon.png', icon: Home },
        { label: 'Story', id: 'story', image: '/assets/icon_audio.png', icon: Mic },
        { label: 'Comic/Book', id: 'comic', image: '/assets/icon_comic.png', icon: BookOpen },
        { label: 'Greeting Card', id: 'generated', image: '/assets/icon_picture_book.png', icon: Grid },
        { label: 'Video', id: 'animation', image: '/assets/icon_animation.png', icon: Film },
    ];

    return (
        <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto py-2 no-scrollbar px-4">
            {buttons.map((btn) => {
                const isActive = activeFilter === btn.id;
                return (
                    <motion.button
                        key={btn.label}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onFilterChange(btn.id)}
                        className={`
                            rounded-2xl font-bold transition-all whitespace-nowrap flex flex-col items-center justify-center gap-1
                            ${isVisual ? 'p-2 w-20 h-20' : 'px-4 py-2 flex-row h-auto'}
                            ${isActive
                                ? 'bg-white/20 text-white shadow-lg shadow-purple-500/30 ring-2 ring-white/50 backdrop-blur-md'
                                : 'bg-black/20 backdrop-blur-sm text-white border border-white/10 hover:bg-white/10 hover:scale-105'
                            }
                        `}
                    >
                        {isVisual ? (
                            <img
                                src={btn.image}
                                alt={btn.label}
                                className="w-12 h-12 object-contain drop-shadow-md"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                        ) : (
                            <img
                                src={btn.image}
                                alt={btn.label}
                                className="w-6 h-6 object-contain"
                            />
                        )}

                        {/* Fallback Icon (Hidden by default unless error) */}
                        <div className={`hidden ${isVisual ? 'w-8 h-8' : 'w-4 h-4'}`}>
                            {btn.icon && <btn.icon className="w-full h-full" />}
                        </div>

                        {!isVisual && <span className="text-sm">{btn.label}</span>}
                        {isVisual && <span className="text-[10px] opacity-80">{btn.label}</span>}
                    </motion.button>
                );
            })}
        </div>
    );
};
