import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface AppleHelloEffectProps {
    duration?: number;
    strokeWidth?: number;
    strokeColor?: string;
    size?: number;
    className?: string;
    onAnimationComplete?: () => void;
    delay?: number;
}

export const AppleHelloEffect: React.FC<AppleHelloEffectProps> = ({
    duration = 5, // Slower writing speed as requested
    strokeWidth = 2,
    strokeColor = "#000000",
    size = 150,
    className = "",
    onAnimationComplete,
    delay = 0.5
}) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 3500 600"
                preserveAspectRatio="xMidYMid meet"
                fill="none"
                style={{ width: '100%', height: 'auto', overflow: 'visible', maxWidth: '100%' }}
            >
                <defs>
                    {/* Linear Gradient for Reveal Mask */}
                    <linearGradient id="revealGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="white" />
                        <stop offset="100%" stopColor="white" />
                    </linearGradient>

                    <mask id="writingMask">
                        <rect x="0" y="0" width="3500" height="600" fill="black" />
                        <rect x="0" y="0" width="0" height="600" fill="url(#revealGradient)">
                            <animate
                                attributeName="width"
                                from="0"
                                to="3500"
                                begin={`${delay}s`}
                                dur={`${duration}s`}
                                fill="freeze"
                                calcMode="linear"
                            />
                        </rect>
                    </mask>
                </defs>

                <style>
                    {`
                    @keyframes reveal-mask {
                        from { width: 0; }
                        to { width: 100%; }
                    }
                    .reveal-rect {
                        animation: reveal-mask ${duration}s linear forwards;
                        animation-delay: ${delay}s;
                    }
                    `}
                </style>

                <text
                    x="50%"
                    y="55%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill={strokeColor}
                    mask="url(#writingMask)"
                    style={{
                        fontFamily: '"Pinyon Script", cursive',
                        fontSize: '400px',
                        fontWeight: 'normal',
                        letterSpacing: '10px',
                    }}
                    onAnimationEnd={onAnimationComplete}
                >
                    KIDSARTOON
                </text>
            </svg>
        </div>
    );
};
