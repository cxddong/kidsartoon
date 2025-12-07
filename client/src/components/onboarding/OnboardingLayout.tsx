import React from 'react';
import { motion } from 'framer-motion';

interface OnboardingLayoutProps {
    children: React.ReactNode;
    bgColor?: string;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
    children,
    bgColor = 'bg-[#FFFBF0]'
}) => {
    return (
        <div className={`min-h-screen w-full ${bgColor} flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans`}>
            {/* Background elements common to onboarding */}
            <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-yellow-200 rounded-full blur-3xl opacity-40 mix-blend-multiply" />
            <div className="absolute top-[10%] right-[-20px] w-60 h-60 bg-pink-200 rounded-full blur-3xl opacity-40 mix-blend-multiply" />
            <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-40 mix-blend-multiply" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md flex flex-col items-center relative z-10"
            >
                {children}
            </motion.div>
        </div>
    );
};
