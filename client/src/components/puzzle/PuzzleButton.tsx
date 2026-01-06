import React from 'react';
import { motion } from 'framer-motion';

interface PuzzleButtonProps {
    onClick: () => void;
    disabled?: boolean;
}

const floatingAnimation = {
    y: [0, -15, 0, 15, 0],
    x: [0, 8, 0, -8, 0],
    transition: {
        duration: 5,
        repeat: Infinity as number,
        ease: [0.42, 0, 0.58, 1] as any
    }
} as any;

const breathingAnimation = {
    scale: [0.95, 1.05, 0.95],
    transition: {
        duration: 2,
        repeat: Infinity as number,
        ease: [0.42, 0, 0.58, 1] as any
    }
} as any;

export const PuzzleButton: React.FC<PuzzleButtonProps> = ({ onClick, disabled = false }) => {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className="puzzle-bubble"
            animate={!disabled ? floatingAnimation : undefined}
            whileHover={!disabled ? {
                scale: 1.15,
                rotate: 5,
                transition: { duration: 0.2 }
            } : undefined}
            whileTap={!disabled ? { scale: 0.9 } : undefined}
            style={{
                position: 'absolute',
                bottom: '100px',
                right: '30px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: disabled
                    ? 'linear-gradient(135deg, #999 0%, #666 100%)'
                    : 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #6BCF7F 100%)',
                border: '3px solid rgba(255, 255, 255, 0.5)',
                boxShadow: disabled
                    ? '0 4px 16px rgba(0, 0, 0, 0.2)'
                    : '0 8px 32px rgba(255, 107, 107, 0.4)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'box-shadow 0.3s ease',
                outline: 'none',
                filter: disabled ? 'grayscale(100%)' : 'none',
                opacity: disabled ? 0.4 : 1
            }}
        >
            <motion.div
                animate={!disabled ? breathingAnimation : undefined}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <span style={{ fontSize: '32px', lineHeight: 1 }}>🧩</span>
            </motion.div>

            {/* Tooltip on hover */}
            <div
                className="puzzle-tooltip"
                style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%) translateY(-10px)',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    opacity: 0,
                    pointerEvents: 'none',
                    transition: 'all 0.3s ease'
                }}
            >
                {disabled ? 'No image available' : 'Play Puzzle!'}
            </div>
        </motion.button>
    );
};
