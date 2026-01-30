import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { MagicVideoButton } from '../ui/MagicVideoButton';
import confetti from 'canvas-confetti';
import { isTouchDevice } from '../../hooks/useTouchInteraction';

export interface FanMenuItem {
    icon?: string | React.ReactNode;
    label: string;
    shortDesc?: string;
    to: string;
    videoSrc?: string;
    description?: string;
    isFree?: boolean;
}

interface FanMenuProps {
    items: FanMenuItem[];
    position: 'top' | 'bottom-right' | 'bottom-left' | 'bottom' | 'surround' | 'flat-top' | 'flat-bottom';
    radius?: number;
    spread?: number;
}

export const FanMenu: React.FC<FanMenuProps> = ({
    items,
    position,
    radius = 140,
    spread = 90
}) => {
    // DEBUG: Confirm file update
    console.log("FanMenu Updated: Shimmer Version");

    const navigate = useNavigate();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [touchedIndex, setTouchedIndex] = useState<number | null>(null);
    const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isTouch = isTouchDevice();

    useEffect(() => {
        return () => {
            if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
        };
    }, []);

    // 点击外部区域重置触摸状态
    useEffect(() => {
        const handleClickOutside = () => {
            if (touchedIndex !== null) {
                setTouchedIndex(null);
            }
        };

        if (isTouch) {
            document.addEventListener('touchstart', handleClickOutside);
            return () => document.removeEventListener('touchstart', handleClickOutside);
        }
    }, [touchedIndex, isTouch]);

    // Configuration for fan layout
    const RADIUS = radius;
    const SPREAD = spread;

    const getStartAngle = () => {
        if (position === 'bottom') return 90 - (SPREAD / 2);
        if (position === 'top') return -90 - (SPREAD / 2);

        const MAP = {
            'bottom-right': 0,
            'bottom-left': 90,
        };
        // @ts-ignore
        return MAP[position] ?? 0;
    };

    const startAngle = getStartAngle();

    // Helper for default radial layout
    const getAngle = (index: number) => {
        if (items.length <= 1) return startAngle + (SPREAD / 2);
        const step = SPREAD / (items.length - 1);
        return startAngle + (step * index);
    };

    const getCoordinates = (index: number) => {
        // "Wonder Studio" Special Layout: 3 Top, Remaining Bottom
        if (position === 'surround') {
            const isTopRow = index < 3;
            // Top Row (Indices 0, 1, 2) -> Y = -radius
            if (isTopRow) {
                // Top 3: Evenly distributed Left, Center, Right
                const positions = [-spread, 0, spread];
                return { x: positions[index], y: -radius };
            }
            // Bottom Row (Indices 3+) -> Y = +radius
            else {
                // Determine layout based on count
                const bottomStartIndex = 3;
                const bottomCount = items.length - bottomStartIndex;

                let positions: number[] = [];
                if (bottomCount === 2) {
                    // Optimized for 2 items: Compact center pair
                    positions = [-spread * 0.6, spread * 0.6];
                } else {
                    // Default / 3 items: Full spread
                    positions = [-spread, 0, spread];
                }

                // Safety map if index exceeds positions
                const localizedIndex = index - bottomStartIndex;
                const x = positions[localizedIndex] ?? 0;

                return { x: x, y: radius * 0.45 };
            }
        }

        // Strict Horizontal Row Top (e.g. Academy)
        if (position === 'flat-top') {
            const count = items.length;
            const mid = (count - 1) / 2;
            const offset = index - mid;
            return { x: offset * spread, y: -radius };
        }

        // Strict Horizontal Row Bottom (e.g. Sunshine Valley)
        if (position === 'flat-bottom') {
            const count = items.length;
            const mid = (count - 1) / 2;
            const offset = index - mid;
            return { x: offset * spread, y: radius };
        }

        // Default Radial Logic
        const angleDeg = getAngle(index);
        const angleRad = angleDeg * (Math.PI / 180);
        return {
            x: Math.cos(angleRad) * RADIUS,
            y: Math.sin(angleRad) * RADIUS
        };
    };

    // 触摸交互处理
    const handleItemTouch = (e: React.TouchEvent, index: number, to: string) => {
        e.stopPropagation();

        // 第一次触摸：显示tooltip
        if (touchedIndex !== index) {
            e.preventDefault();
            setTouchedIndex(index);
            setHoveredIndex(index);

            // 3秒后自动隐藏
            if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
            touchTimeoutRef.current = setTimeout(() => {
                setTouchedIndex(null);
                setHoveredIndex(null);
            }, 3000);
        } else {
            // 第二次触摸：执行跳转
            navigate(to);
        }
    };

    const handleItemClick = (e: React.MouseEvent, index: number, to: string) => {
        e.stopPropagation();
        // 鼠标设备直接跳转
        if (!isTouch) {
            navigate(to);
        }
    };

    // Inject custom style for shimmer animation
    useEffect(() => {
        const styleId = 'fan-menu-shimmer-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.innerHTML = `
                @keyframes fan-shimmer {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .fan-shimmer-border {
                    background-size: 200% 200%;
                    animation: fan-shimmer 3s linear infinite;
                    background-image: linear-gradient(90deg, #a855f7, #ec4899, #06b6d4, #a855f7);
                }
            `;
            document.head.appendChild(style);
        }
    }, []);

    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none z-50">
            {items.map((item, index) => {
                const { x, y } = getCoordinates(index);

                const isActive = hoveredIndex === index || touchedIndex === index;

                return (
                    <div
                        key={item.label}
                        className="absolute"
                        style={{
                            transform: `translate(${x}px, ${y}px)`,
                            zIndex: isActive ? 50 : 10
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20,
                                delay: index * 0.1
                            }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24 no-select"
                            onMouseEnter={() => !isTouch && setHoveredIndex(index)}
                            onMouseLeave={() => !isTouch && setHoveredIndex(null)}
                            onTouchStart={(e) => handleItemTouch(e, index, item.to)}
                        >
                            <div className="relative w-full h-full transform transition-transform duration-300 hover:scale-110">
                                {/* 1. Shimmer Border Layer (Background) */}
                                <div
                                    className="absolute inset-0 rounded-2xl fan-shimmer-border"
                                    style={{
                                        padding: 0,
                                        zIndex: 0
                                    }}
                                />

                                {/* 2. Content Layer (Foreground, slightly smaller to reveal border) */}
                                <div className="absolute inset-[3px] rounded-xl bg-black overflow-hidden z-10">
                                    <button
                                        onClick={(e) => handleItemClick(e, index, item.to)}
                                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer outline-none border-none p-0 bg-black"
                                        style={{ background: 'black' }}
                                    >
                                        {item.videoSrc ? (
                                            <video
                                                src={item.videoSrc}
                                                className="w-full h-full"
                                                style={{
                                                    objectFit: 'cover',
                                                    width: '100%',
                                                    height: '100%',
                                                    transform: 'scale(1.1)', // Slight zoom to prevent white edges
                                                    background: 'black'
                                                }}
                                                muted
                                                playsInline
                                                preload="auto"
                                                onLoadedData={(e) => {
                                                    const video = e.target as HTMLVideoElement;
                                                    video.currentTime = 0.1;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-white flex items-center justify-center">
                                                <span className="text-3xl transition-transform block">
                                                    {item.icon}
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {/* Free Badge */}
                                {item.isFree && (
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white z-20 transform rotate-12 animate-pulse pointer-events-none">
                                        FREE
                                    </div>
                                )}
                            </div>

                            {/* Label & Subtext Plate (New UI) */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 flex flex-col items-center w-max pointer-events-none z-20">
                                {/* Main Label */}
                                <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-indigo-50 mb-1">
                                    <span className="text-xs font-black text-indigo-900 block text-center whitespace-nowrap">{item.label}</span>
                                </div>
                                {/* Subtext (Short Desc) */}
                                {item.shortDesc && (
                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/90 px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm whitespace-nowrap">
                                        {item.shortDesc}
                                    </span>
                                )}
                            </div>

                            {/* Tooltip / Info Card (Detailed Description) */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, y: y < 0 ? -10 : 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: y < 0 ? -10 : 10, scale: 0.9 }}
                                        className={cn(
                                            "absolute z-50 w-56 p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-indigo-100 text-center left-1/2 -translate-x-1/2 pointer-events-none",
                                            y < 0 ? "top-[130%] mt-2 origin-top" : "bottom-[130%] mb-2 origin-bottom"
                                        )}
                                    >
                                        <h4 className="font-black text-indigo-900 text-sm mb-2 uppercase tracking-wide border-b border-indigo-50 pb-1">{item.label}</h4>
                                        <p className="text-xs text-gray-600 leading-normal font-medium whitespace-pre-line">
                                            {item.description || "Click to explore!"}
                                        </p>

                                        {/* Little arrow */}
                                        <div className={cn(
                                            "absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white/95 rotate-45 border-indigo-100",
                                            y < 0 ? "-top-2 border-t border-l" : "-bottom-2 border-b border-r"
                                        )}></div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                );
            })}
        </div>
    );
};
