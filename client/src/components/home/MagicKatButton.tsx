import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { MagicVideoButton } from '../ui/MagicVideoButton';
import { Sparkles } from 'lucide-react';
import { FEATURES_TOOLTIPS } from '../../data/featuresData';
import { isTouchDevice } from '../../hooks/useTouchInteraction';

interface MagicKatButtonProps {
    videoSrc: string;
}

export const MagicKatButton: React.FC<MagicKatButtonProps> = ({ videoSrc }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [touchedOnce, setTouchedOnce] = useState(false);
    const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isTouch = isTouchDevice();

    // 自动收起定时器清理
    useEffect(() => {
        return () => {
            if (collapseTimerRef.current) {
                clearTimeout(collapseTimerRef.current);
            }
        };
    }, []);

    // 触摸交互处理
    const handleTouch = (e: React.TouchEvent) => {
        e.stopPropagation();

        if (!touchedOnce) {
            // 第一次触摸：展开
            setIsExpanded(true);
            setTouchedOnce(true);

            // 3秒后自动收起
            if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = setTimeout(() => {
                setIsExpanded(false);
                setTouchedOnce(false);
            }, 3000);
        } else {
            // 第二次触摸：跳转
            if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
            navigate('/ask-magic-kat');
        }
    };

    return (
        <motion.div
            className="flex flex-col items-end justify-end relative no-select"
            onMouseEnter={() => !isTouch && setIsExpanded(true)}
            onMouseLeave={() => !isTouch && setIsExpanded(false)}
            onTouchStart={isTouch ? handleTouch : undefined}
        >
            {/* Main Circular Frame (Collapsible) */}
            <motion.div
                initial="collapsed"
                animate={isExpanded ? "expanded" : ["collapsed", "wiggle"]}
                variants={{
                    collapsed: { width: "7rem", height: "7rem" }, // Increased size
                    expanded: { width: "16rem", height: "16rem" }, // Larger expansion
                    wiggle: {
                        rotate: [0, -5, 5, -5, 5, 0],
                        transition: {
                            rotate: {
                                delay: 3, // Wait 3 seconds
                                duration: 0.5, // Wiggle for 0.5s
                                repeat: Infinity,
                                repeatDelay: 5 // Repeat every 5 seconds + 0.5 wiggle
                            },
                            scale: {
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut"
                            }
                        },
                        scale: [1, 1.05, 1]
                    }
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative rounded-full shadow-[0_0_30px_rgba(124,58,237,0.4)] border-4 border-white bg-white overflow-hidden z-30 cursor-pointer group hover:shadow-[0_0_50px_rgba(124,58,237,0.6)] transition-shadow origin-bottom-right"
                onClick={() => {
                    // tap to expand if collapsed
                    if (!isExpanded) setIsExpanded(true);
                }}
            >
                <MagicVideoButton
                    videoSrc={videoSrc}
                    label="" // Hide internal label
                    onClick={() => {
                        if (isExpanded) {
                            navigate('/ask-magic-kat');
                        } else {
                            setIsExpanded(true);
                        }
                    }}
                    className="w-full h-full"
                    enableMobileAutoPlay={true}
                />

                {/* Overlay Hint on Thumbnail (Optional) */}
                <AnimatePresence>
                    {!isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none"
                        >
                            <Sparkles className="w-8 h-8 text-white drop-shadow-md animate-pulse" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* "Ask Magic Kat" Bubble - Only visible when Expanded */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        transition={{ delay: 0.1 }}
                        className="absolute bottom-[105%] right-0 w-48 z-40 pointer-events-none"
                    >
                        <div className="bg-white/95 backdrop-blur-xl p-4 rounded-2xl rounded-br-none shadow-2xl border-2 border-indigo-100 relative">
                            <h3 className="font-black text-indigo-900 text-lg leading-none mb-1">
                                {FEATURES_TOOLTIPS.ask_magic_kat.label}
                            </h3>
                            <p className="text-xs text-indigo-600 font-bold mb-2">
                                {FEATURES_TOOLTIPS.ask_magic_kat.shortDesc}
                            </p>
                            <p className="text-xs text-slate-600 leading-snug">
                                {FEATURES_TOOLTIPS.ask_magic_kat.desc}
                            </p>

                            {/* Decorative Sparkles */}
                            <Sparkles className="absolute -top-3 -left-3 w-6 h-6 text-yellow-400 fill-yellow-400 animate-bounce" />

                            {/* Speech Triangle */}
                            <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white rotate-45 border-r-2 border-b-2 border-indigo-100"></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
