import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface MagicEmptyStateProps {
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
    image?: string;
}

export const MagicEmptyState: React.FC<MagicEmptyStateProps> = ({
    title = "It's a bit empty here...",
    description = "Time to make some magic! Start creating your first masterpiece.",
    actionLabel = "Start Creating",
    onAction,
    icon,
    image
}) => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-md mx-auto">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="relative mb-6"
            >
                {image ? (
                    <img src={image} alt="Empty" className="w-48 h-48 object-contain drop-shadow-xl" />
                ) : (
                    <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-2xl relative">
                        {icon ? (
                            <div className="text-6xl text-slate-300">{icon}</div>
                        ) : (
                            <span className="text-6xl">✨</span>
                        )}

                        {/* Orbiting Sparkle */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0"
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                            </div>
                        </motion.div>
                    </div>
                )}
            </motion.div>

            <h3 className="text-2xl font-black text-slate-800 mb-2 drop-shadow-sm">
                {title}
            </h3>

            <p className="text-slate-500 font-bold leading-relaxed mb-8">
                {description}
            </p>

            {onAction && (
                <button
                    onClick={onAction}
                    className="group relative px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <span className="relative flex items-center gap-2">
                        {actionLabel}
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                </button>
            )}
        </div>
    );
};
