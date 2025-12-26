import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Sparkles } from 'lucide-react';

interface MagicOverlayProps {
    isVisible: boolean;
    steps?: string[];
}

const DEFAULT_STEPS = [
    { en: "Analyzing your drawing...", zh: "正在看你的画..." },
    { en: "Writing the script...", zh: "正在写剧本..." },
    { en: "Painting the frames...", zh: "正在绘制画面..." },
    { en: "Adding magic dust...", zh: "正在撒魔法粉..." }
];

export const MagicOverlay: React.FC<MagicOverlayProps> = ({ isVisible }) => {
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (!isVisible) {
            setCurrentStep(0);
            return;
        }

        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % DEFAULT_STEPS.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-lg bg-black/60"
                >
                    <div className="flex flex-col items-center gap-8">
                        {/* Sparkle Animation */}
                        <motion.div
                            animate={{
                                rotate: [0, 360],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{
                                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                                scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                            }}
                            className="relative"
                        >
                            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-400 rounded-full flex items-center justify-center shadow-2xl">
                                <Wand2 className="w-16 h-16 text-white" />
                            </div>

                            {/* Sparkles around */}
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                        marginTop: '-8px',
                                        marginLeft: '-8px'
                                    }}
                                    animate={{
                                        x: [0, Math.cos(i * 60 * Math.PI / 180) * 80],
                                        y: [0, Math.sin(i * 60 * Math.PI / 180) * 80],
                                        opacity: [0, 1, 0],
                                        scale: [0, 1, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                        ease: "easeOut"
                                    }}
                                >
                                    <Sparkles className="w-4 h-4 text-yellow-300" />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Step Text */}
                        <div className="bg-white/90 backdrop-blur-md px-8 py-4 rounded-2xl shadow-xl max-w-md">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-center"
                                >
                                    <p className="text-lg font-bold text-purple-900">
                                        {DEFAULT_STEPS[currentStep].en}
                                    </p>
                                    <p className="text-sm text-purple-600 mt-1">
                                        {DEFAULT_STEPS[currentStep].zh}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Progress Dots */}
                        <div className="flex gap-2">
                            {DEFAULT_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-2 h-2 rounded-full transition-all ${i === currentStep
                                            ? 'bg-yellow-400 w-8'
                                            : 'bg-white/40'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
