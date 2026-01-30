import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const LandscapePrompt: React.FC = () => {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const checkOrientation = () => {
            const isMobile = window.innerWidth <= 1024 || navigator.maxTouchPoints > 0;
            const isPortrait = window.innerHeight > window.innerWidth;

            // Only show if it's a mobile device AND in portrait mode
            if (isMobile && isPortrait) {
                setShowPrompt(true);
            } else {
                setShowPrompt(false);
            }
        };

        checkOrientation();
        window.addEventListener('resize', checkOrientation);
        return () => window.removeEventListener('resize', checkOrientation);
    }, []);

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-white p-8"
                >
                    <motion.div
                        animate={{ rotate: 90 }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            repeatType: "reverse",
                            ease: "easeInOut"
                        }}
                        className="text-6xl mb-8"
                    >
                        📱
                    </motion.div>
                    <h2 className="text-2xl font-bold mb-4 text-center">Please Rotate Your Device</h2>
                    <p className="text-center text-gray-300">
                        Kids Art Tales works best in landscape mode.
                        <br />
                        Please turn your device sideways to continue!
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
