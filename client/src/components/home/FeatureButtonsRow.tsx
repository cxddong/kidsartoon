import React from 'react';
import { Mic, Grid, BookOpen, Film } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureButtonsRowProps {
    activeFilter: string | null;
    onFilterChange: (filter: string | null) => void;
}

export const FeatureButtonsRow: React.FC<FeatureButtonsRowProps> = ({ activeFilter, onFilterChange }) => {

    const buttons = [
        { label: 'All', id: null, icon: null },
        { label: 'Audio', id: 'story', icon: Mic },
        { label: 'Comic', id: 'comic', icon: Grid },
        { label: 'Picture', id: 'picture-book', icon: BookOpen },
        { label: 'Video', id: 'animation', icon: Film },
    ];

    return (
        <div className="flex items-center justify-center gap-2 md:gap-4 overflow-x-auto py-2 no-scrollbar">
            {buttons.map((btn) => {
                const isActive = activeFilter === btn.id;
                return (
                    <button
                        key={btn.label}
                        onClick={() => onFilterChange(btn.id)}
                        className={`
                            px-4 py-2 rounded-full font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2
                            ${isActive
                                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-200'
                                : 'bg-transparent text-slate-500 hover:bg-slate-100'
                            }
                        `}
                    >
                        {btn.icon && <btn.icon className="w-4 h-4" />}
                        {btn.label}
                    </button>
                );
            })}
        </div>
    );
};
