import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react';

import genBtnVideo from '../assets/genbtn.mp4';
import homeVideo from '../assets/home.mp4';
import profileVideo from '../assets/profile.mp4';
import { SparkleVoiceFab } from './sparkle/SparkleVoiceFab';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const isVisual = user?.uiMode === 'visual';
    const currentPath = location.pathname;

    // Default to collapsed unless user explicitly expands? 
    // Or maybe expand on first load/interaction? Let's start collapsed or small.
    // User asked for "expand when needed, collapse when not".
    const [isExpanded, setIsExpanded] = useState(false);

    const isActive = (path: string) => currentPath === path || (path === '/home' && currentPath === '/');

    // Toggle handler
    const toggleNav = () => setIsExpanded(!isExpanded);

    return (
        <motion.nav
            layout
            initial={false}
            animate={{
                width: isExpanded ? "auto" : "60px",
                padding: isExpanded ? (isVisual ? "0 24px" : "0 16px") : "0",
                gap: isExpanded ? (isVisual ? "24px" : "16px") : "0"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
                "fixed bottom-4 right-4 bg-white/70 backdrop-blur-xl border border-white/60 rounded-full flex justify-center items-center z-[60] shadow-2xl overflow-hidden",
                isVisual ? "h-20" : "h-14 py-2" // Height container
            )}
        >
            <AnimatePresence mode="wait">
                {!isExpanded ? (
                    <motion.button
                        key="collapsed"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={toggleNav}
                        className="w-full h-full flex items-center justify-center text-slate-600 hover:text-slate-900 group"
                    >
                        {/* More visible collapsed icon */}
                        <div className="bg-white p-3 rounded-full shadow-md group-hover:scale-110 transition-transform">
                            <Menu size={24} className="text-slate-800" />
                        </div>
                    </motion.button>
                ) : (
                    <motion.div
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center"
                        style={{ gap: isVisual ? '1.5rem' : '1rem' }}
                    >
                        {/* More visible Close Button */}
                        <button
                            onClick={toggleNav}
                            className="bg-slate-100/80 hover:bg-slate-200 p-2 rounded-full text-slate-600 shadow-sm transition-colors absolute left-2 z-10"
                        >
                            <ChevronRight size={20} />
                        </button>

                        {/* Spacer for the absolute close button */}
                        <div className="w-8" />

                        <button
                            onClick={() => navigate('/home')}
                            className="transition-transform duration-300 hover:scale-110 relative -top-0.5"
                        >
                            <div className={cn(
                                "rounded-full overflow-hidden shadow-md transition-all",
                                isVisual ? "w-14 h-14" : "w-10 h-10",
                                isActive('/home') ? "scale-110 ring-2 ring-blue-400 ring-offset-2" : "opacity-80 hover:opacity-100"
                            )}>
                                <video
                                    src={homeVideo}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    disablePictureInPicture
                                    controlsList="nodownload noremoteplayback noplaybackrate"
                                />
                            </div>
                        </button>

                        {/* Main Action Button - Made Standard Size */}
                        <div className="relative transition-all">
                            <button
                                onClick={() => navigate('/generate')}
                                className="transition-transform duration-300 hover:scale-110 hover:rotate-3"
                            >
                                <div className={cn(
                                    "rounded-full overflow-hidden shadow-xl relative transition-all",
                                    isVisual ? "w-14 h-14" : "w-10 h-10", // SAME SIZE AS OTHERS
                                    isActive('/generate') || currentPath.startsWith('/generate') ? "scale-110 ring-2 ring-yellow-400 ring-offset-2" : ""
                                )}>
                                    <video
                                        src={genBtnVideo}
                                        className="w-full h-full object-cover absolute inset-0"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        disablePictureInPicture
                                        controlsList="nodownload noremoteplayback noplaybackrate"
                                    />
                                </div>
                            </button>
                        </div>

                        {/* Sparkle Voice - Global Helper (Hidden in Magic Lab) */}
                        {!currentPath.startsWith('/magic-lab') && (
                            <SparkleVoiceFab
                                className={cn(
                                    "relative bottom-auto right-auto transform-none shadow-md z-10", // Override fixed pos
                                    isVisual ? "w-14 h-14" : "w-10 h-10"
                                )}
                                autoStart={false}
                                onTagsExtracted={() => { }} // No-op for global chat
                            />
                        )}

                        <button
                            onClick={() => navigate('/profile')}
                            className="transition-transform duration-300 hover:scale-110 relative -top-0.5"
                        >
                            <div className={cn(
                                "rounded-full overflow-hidden shadow-md transition-all",
                                isVisual ? "w-14 h-14" : "w-10 h-10",
                                isActive('/profile') ? "scale-110 ring-2 ring-rose-400 ring-offset-2" : "opacity-80 hover:opacity-100"
                            )}>
                                <video
                                    src={profileVideo}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    disablePictureInPicture
                                    controlsList="nodownload noremoteplayback"
                                />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav >
    );
};
