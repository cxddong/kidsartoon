import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, CreditCard } from 'lucide-react';

interface LowCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    neededPoints?: number;
    currentPoints?: number;
}

export const LowCreditsModal: React.FC<LowCreditsModalProps> = ({
    isOpen,
    onClose,
    neededPoints = 10,
    currentPoints = 0
}) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop with blur */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 overflow-hidden border-4 border-yellow-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full blur-2xl opacity-50" />
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-100 rounded-full blur-2xl opacity-50" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 rounded-full p-1"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center relative z-10">
                        {/* Icon */}
                        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                            <Sparkles className="w-10 h-10 text-yellow-500" />
                        </div>

                        {/* Text */}
                        <h3 className="text-2xl font-black text-gray-800 mb-2 font-display">
                            Need More Magic?
                        </h3>
                        <p className="text-gray-600 mb-6 font-medium leading-relaxed">
                            You need <span className="font-bold text-indigo-600">{neededPoints} points</span> to create this,<br />
                            but you only have <span className="font-bold text-red-500">{currentPoints}</span>.
                        </p>

                        {/* CTA Button */}
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/subscription');
                            }}
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                        >
                            <CreditCard className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Get More Points
                        </button>

                        <button
                            onClick={onClose}
                            className="mt-4 text-gray-400 text-sm font-semibold hover:text-gray-600 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
