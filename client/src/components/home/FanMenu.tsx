import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';

export interface FanMenuItem {
    icon?: string | React.ReactNode;
    label: string;
    to: string;
    videoSrc?: string;
    description?: string;
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
    const navigate = useNavigate();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [touchedIndex, setTouchedIndex] = useState<number | null>(null);
    const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
        };
    }, []);

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
        // "Wonder Studio" Special Layout: 3 Top, 2 Bottom, Centered Horizontal
        if (position === 'surround') {
            const isTopRow = index < 3;
            // Top Row (Indices 0, 1, 2) -> Y = -radius
            if (isTopRow) {
                // Centered: 0->-1, 1->0, 2->1
                const offset = index - 1;
                return { x: offset * (spread * 1.2), y: -radius };
            }
            // Bottom Row (Indices 3, 4) -> Y = +radius
            else {
                // Centered: 3->-0.5, 4->0.5
                const offset = (index - 3) === 0 ? -0.5 : 0.5;
                return { x: offset * (spread * 1.2), y: radius };
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

    const handleItemClick = (e: React.MouseEvent, index: number, to: string) => {
        e.stopPropagation();

        // Mobile tap logic
        if (window.innerWidth < 768) {
            if (touchedIndex !== index) {
                e.preventDefault();
                setTouchedIndex(index);

                if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
                touchTimeoutRef.current = setTimeout(() => setTouchedIndex(null), 3000);
                return;
            }
        }

        navigate(to);
    };

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
                                stiffness: 200,
                                damping: 15,
                                delay: index * 0.05
                            }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 w-24 h-24"
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <button
                                onClick={(e) => handleItemClick(e, index, item.to)}
                                className="w-full h-full rounded-2xl bg-white/90 backdrop-blur-md shadow-xl border-4 border-indigo-100 flex flex-col items-center justify-center group hover:scale-110 hover:border-indigo-300 transition-all pointer-events-auto overflow-hidden relative z-10"
                            >
                                {item.videoSrc ? (
                                    <video
                                        src={item.videoSrc}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                    />
                                ) : (
                                    <span className="text-3xl mb-1 group-hover:scale-110 transition-transform block">
                                        {item.icon}
                                    </span>
                                )}

                                {/* Label Overlay */}
                                <span className="absolute bottom-1 z-10 text-[10px] font-bold text-indigo-900 bg-white/80 px-2 rounded-full whitespace-nowrap shadow-sm backdrop-blur-sm">
                                    {item.label}
                                </span>
                            </button>

                            {/* Tooltip / Info Card */}
                            <AnimatePresence>
                                {isActive && (
                                    <motion.div
                                        initial={{ opacity: 0, y: y < 0 ? -10 : 10, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: y < 0 ? -10 : 10, scale: 0.9 }}
                                        className={cn(
                                            "absolute z-50 w-48 p-3 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-indigo-100 text-center left-1/2 -translate-x-1/2 pointer-events-none",
                                            y < 0 ? "top-full mt-3 origin-top" : "bottom-full mb-3 origin-bottom"
                                        )}
                                    >
                                        <h4 className="font-bold text-indigo-900 text-sm mb-1 uppercase tracking-wider">{item.label}</h4>
                                        <p className="text-xs text-gray-600 leading-tight">
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
