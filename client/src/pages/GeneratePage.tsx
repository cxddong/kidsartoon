import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { jellyPopVariants, jellyPopContainer } from '../lib/animations';
import { BottomNav } from '../components/BottomNav';

// Assets
import audioVideo from '../assets/mic3.mp4';
import genBtnVideo from '../assets/startmagic.mp4';
import cartoonVideo from '../assets/cartoon.mp4';
import comicVideo from '../assets/comic.mp4';
import greetingCardVideo from '../assets/greeting_card1.mp4';
import mentorVideo from '../assets/mentor journey.mp4';
import bookVideo from '../assets/book.mp4';
import customBg from '../assets/generate_background_custom.jpg';

export const GeneratePage: React.FC = () => {
    const navigate = useNavigate();

    const handleNavigation = (path: string, state?: any) => {
        navigate(path, { state });
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#F0F4F8] flex flex-col">

            {/* Custom Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={customBg}
                    alt="Background"
                    className="w-full h-full object-cover opacity-100"
                />
            </div>

            {/* Main Content */}
            <motion.div
                className="flex-1 relative w-full h-full flex flex-col items-center justify-center gap-4 md:gap-12 pb-20 z-10"
                variants={jellyPopContainer}
                initial="initial"
                animate="animate"
            >
                {/* Row 1: Audio - Start Magic - Animation */}
                <div className="flex items-center gap-4 md:gap-16">
                    {/* Audio (Circle - Left) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/audio')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-secondary flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-110 group-active:scale-95">
                            <video src={audioVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.35]" />
                        </div>
                        <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">AUDIO</span>
                    </motion.button>

                    {/* START MAGIC (Rectangle - Center) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/magic-lab')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-48 h-24 md:w-80 md:h-40 rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex flex-col items-center justify-center shadow-2xl border-4 border-white/40 overflow-hidden transform transition-all group-hover:scale-105 group-active:scale-95 hover:shadow-purple-500/50">
                            <video src={genBtnVideo} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110" />
                            <div className="relative z-10 flex flex-col items-center leading-none">
                                <span className="text-2xl md:text-4xl font-black text-white drop-shadow-lg tracking-widest">START</span>
                                <span className="text-2xl md:text-4xl font-black text-white drop-shadow-lg tracking-widest text-yellow-200">MAGIC</span>
                            </div>
                        </div>
                    </motion.button>

                    {/* Animation (Circle - Right) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/video')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-primary flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-110 group-active:scale-95">
                            <video src={cartoonVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[2.0]" />
                        </div>
                        <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">ANIMATION</span>
                    </motion.button>
                </div>

                {/* Row 2: Comic - Greeting - Mentor - Picture Book */}
                <div className="flex items-center gap-2 md:gap-8 flex-wrap justify-center px-2">
                    {/* Comic (Circle - Left) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/comic', { mode: 'comic' })}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-accent-purple flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-110 group-active:scale-95">
                            <video src={comicVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.1]" />
                        </div>
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">COMIC</span>
                        </div>
                    </motion.button>

                    {/* Greeting Card (Rectangle - Center Left) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/greeting-card')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-28 h-28 md:w-40 md:h-36 rounded-3xl bg-pink-500 flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-105 group-active:scale-95">
                            <video src={greetingCardVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.3]" />
                        </div>
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">GREETING</span>
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">CARD</span>
                        </div>
                    </motion.button>

                    {/* Mentor Journey (Rectangle - Center Right) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/creative-journey')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-28 h-28 md:w-40 md:h-36 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-105 group-active:scale-95">
                            <video src={mentorVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.3]" />
                        </div>
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">MENTOR</span>
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">JOURNEY</span>
                        </div>
                    </motion.button>

                    {/* Picture Book (Circle - Right) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/picture', { mode: 'book' })}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-accent-purple flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-105 group-active:scale-95">
                            <video src={bookVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.6]" />
                        </div>
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">PICTURE</span>
                            <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">BOOK</span>
                        </div>
                    </motion.button>
                </div>

                {/* Debug Tools removed for cleanliness, but can be added back if needed */}

            </motion.div>

            <BottomNav />
        </div>
    );
};
