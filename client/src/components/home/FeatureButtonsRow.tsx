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
        { label: 'All', id: null, icon: isVisual ? Home : null },
        { label: 'Story', id: 'story', icon: Mic },
        { label: 'Comic/Book', id: 'comic', icon: BookOpen },
        { label: 'Greeting Card', id: 'generated', icon: Grid },
        { label: 'Video', id: 'animation', icon: Film },
    ];

    return (
        <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto py-2 no-scrollbar">
            {buttons.map((btn) => {
                const isActive = activeFilter === btn.id;
                return (
                    <motion.button
                        key={btn.label}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onFilterChange(btn.id)}
                        className={`
                            rounded-full font-bold transition-all whitespace-nowrap flex items-center gap-2
                            ${isVisual ? 'p-3 aspect-square justify-center rounded-2xl' : 'px-4 py-2 text-sm rounded-full'}
                            ${isActive
                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-200'
                                : 'bg-black/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20'
                            }
                        `}
                    >
                        {btn.icon && <btn.icon className={isVisual ? "w-8 h-8" : "w-4 h-4"} />}
                        {!isVisual && btn.label}
                    </motion.button>
                );
            })}
        </div>
    );
};
