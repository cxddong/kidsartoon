import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Film, BookOpen, Palette } from 'lucide-react';

interface WelcomeCardProps {
    isVisible: boolean;
    onDismiss?: () => void;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ isVisible, onDismiss }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                >
                    <div className="pointer-events-auto max-w-md w-full bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 p-1 rounded-3xl shadow-2xl">
                        <div className="bg-white rounded-3xl p-8 text-center space-y-6">
                            {/* Header */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center animate-bounce">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-black text-purple-900">
                                    Hi! I'm Sparkle! 👋
                                </h2>
                            </div>

                            {/* Instructions */}
                            <div className="space-y-3">
                                <p className="text-slate-700 font-semibold">
                                    Upload your drawing, and tell me to:
                                </p>

                                {/* Feature List */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                                        <Film className="w-6 h-6 text-blue-600 flex-shrink-0" />
                                        <div className="text-left">
                                            <div className="font-bold text-blue-900">Make a Movie</div>
                                            <div className="text-xs text-blue-600">做个动画</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                                        <BookOpen className="w-6 h-6 text-green-600 flex-shrink-0" />
                                        <div className="text-left">
                                            <div className="font-bold text-green-900">Write a Story</div>
                                            <div className="text-xs text-green-600">写个绘本</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                                        <Palette className="w-6 h-6 text-purple-600 flex-shrink-0" />
                                        <div className="text-left">
                                            <div className="font-bold text-purple-900">Draw a Comic</div>
                                            <div className="text-xs text-purple-600">画个漫画</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="pt-4 border-t border-purple-100">
                                <p className="text-sm text-slate-600 flex items-center justify-center gap-2">
                                    <span className="text-2xl">👇</span>
                                    <span className="font-bold">Click the mic to start!</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
