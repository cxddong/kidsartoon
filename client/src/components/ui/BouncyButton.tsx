import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface BouncyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    scaleDown?: number;
    className?: string;
}

export const BouncyButton: React.FC<BouncyButtonProps> = ({
    children,
    onClick,
    className,
    scaleDown = 0.95,
    ...props
}) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: scaleDown }}
        onClick={onClick}
        className={cn("transition-colors", className)}
        {...(props as any)}
    >
        {children}
    </motion.button>
);
