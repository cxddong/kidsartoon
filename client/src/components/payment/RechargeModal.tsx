import React from 'react';
import { Zap, Sparkles, CreditCard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCredits: number;
    onRecharge: (amount: number) => void;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({ isOpen, onClose, currentCredits, onRecharge }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="relative w-full max-w-sm p-8 bg-white rounded-3xl shadow-2xl border-4 border-purple-400"
                    >
                        {/* Close Button */}
                        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>

                        {/* Sparkle Decoration */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                            <Sparkles className="w-12 h-12 text-white" />
                        </div>

                        <h2 className="mt-10 text-2xl font-bold text-purple-600 text-center">
                            Oh no! Low Energy! ✨
                        </h2>

                        <p className="mt-4 text-gray-600 font-medium text-center text-sm">
                            Magic Kat needs a few more Magic Crystals to cast the spell!
                        </p>

                        <div className="my-6 p-4 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200">
                            <p className="text-xs text-purple-400 text-center uppercase tracking-wider font-bold">Current Energy</p>
                            <div className="flex items-center justify-center gap-2 mt-1">
                                <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                <span className="text-4xl font-black text-purple-700">{currentCredits}</span>
                            </div>
                        </div>

                        <div className="grid gap-3">
                            <button
                                onClick={() => onRecharge(100)}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl text-white font-bold hover:scale-105 transition-transform shadow-md"
                            >
                                <span className="flex items-center gap-2"><Zap className="w-4 h-4 fill-white" /> 100 Crystals</span>
                                <span className="bg-white/20 px-3 py-1 rounded-lg text-sm text-shadow">¥ 9.9</span>
                            </button>

                            <button
                                onClick={() => onRecharge(9999)}
                                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-purple-200"
                            >
                                <span className="flex items-center gap-2">✨ Gold Member (Infinite!)</span>
                                <span className="bg-white/20 px-3 py-1 rounded-lg text-sm text-shadow">¥ 29.9</span>
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-6 w-full text-center text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
                        >
                            I'll practice drawing first
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
