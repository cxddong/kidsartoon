import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import splashVideo from '../assets/startmagic.mp4';

export const SplashPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowButton(true);
        }, 10000); // 10 seconds

        return () => clearTimeout(timer);
    }, []);

    const handleEnter = () => {
        navigate('/home');
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-black flex flex-col items-center justify-center overflow-hidden z-50">
            {/* Video Background */}
            <video
                src={splashVideo}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                muted
                playsInline
                disablePictureInPicture
                controlsList="nodownload noremoteplayback"
                onEnded={() => setShowButton(true)}
            />

            {/* Enter Button */}
            <AnimatePresence>
                {showButton && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleEnter}
                        className="relative z-10 px-10 py-4 bg-white/20 backdrop-blur-md border border-white/50 text-white font-black text-2xl rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:bg-white/30 transition-all mt-auto mb-20 md:mb-32"
                    >
                        ENTER WORLD 🚀
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
