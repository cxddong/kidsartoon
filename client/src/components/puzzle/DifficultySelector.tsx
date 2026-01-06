import React from 'react';
import { motion } from 'framer-motion';
import { type DifficultyLevel, DIFFICULTY_CONFIG } from '../../lib/puzzle-utils';
import { X } from 'lucide-react';

interface DifficultySelectorProps {
    onSelect: (level: DifficultyLevel) => void;
    onClose: () => void;
    hasSavedProgress?: boolean;
    onContinue?: () => void;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
    onSelect,
    onClose,
    hasSavedProgress,
    onContinue
}) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border-4 border-orange-200"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    <span className="text-5xl mb-4 block">🧩</span>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
                        Magic Puzzle
                    </h2>
                    <p className="text-slate-500 font-bold mt-2">
                        {hasSavedProgress ? "Continue your adventure?" : "Choose your challenge!"}
                    </p>
                </div>

                <div className="space-y-4">
                    {hasSavedProgress && onContinue && (
                        <button
                            onClick={onContinue}
                            className="w-full py-5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl font-black text-xl shadow-lg hover:scale-105 transition-transform border-b-4 border-orange-700 active:border-b-0 active:translate-y-1"
                        >
                            🚀 CONTINUE GAME
                        </button>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                        {(Object.entries(DIFFICULTY_CONFIG) as [DifficultyLevel, any][]).map(([level, config]) => (
                            <button
                                key={level}
                                onClick={() => onSelect(level)}
                                className={`w-full py-4 px-6 rounded-2xl border-2 transition-all flex items-center justify-between group
                                    ${level === 'baby' ? 'border-green-200 bg-green-50 hover:bg-green-100 text-green-700' :
                                        level === 'easy' ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700' :
                                            level === 'smart' ? 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700' :
                                                level === 'expert' ? 'border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700' :
                                                    'border-red-200 bg-red-50 hover:bg-red-100 text-red-700'}`}
                            >
                                <div className="text-left">
                                    <div className="font-black text-lg uppercase">{config.label}</div>
                                    <div className="text-sm opacity-70 font-bold">
                                        {config.grid}x{config.grid} Grid
                                    </div>
                                </div>
                                <span className="text-2xl group-hover:scale-125 transition-transform">
                                    {level === 'baby' ? '👶' :
                                        level === 'easy' ? '🌟' :
                                            level === 'smart' ? '🧠' :
                                                level === 'expert' ? '🦁' : '👑'}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {hasSavedProgress && (
                    <p className="text-center text-xs text-slate-400 font-bold mt-6 uppercase tracking-widest">
                        Or start a new challenge!
                    </p>
                )}
            </motion.div>
        </div>
    );
};
