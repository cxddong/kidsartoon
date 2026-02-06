
import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { FanMenuV2 } from '../components/home/FanMenuV2';
import { MagicKatButton } from '../components/home/MagicKatButton';
import mentorVideo from '../assets/mentor journey.mp4';
// import backgroundVideo from '../assets/backgournd.mp4'; // Removed per user request
import creativeJourneyVid from '../assets/creative journey.mp4';
import artStudioVid from '../assets/art studio.mp4';
import magicLabVid from '../assets/magiclab.mp4';
import graphicNovelVid from '../assets/graphicnovel.mp4';
import cartoonBookVid from '../assets/cartoon book.mp4';
import pictureBookVid from '../assets/picturebook.mp4';
import cartoonVid from '../assets/cartoon.mp4';
import videoVid from '../assets/video.mp4';
import comicVid from '../assets/comic.mp4';
import jumpVid from '../assets/jump into art.mp4';
import cardVid from '../assets/greetingcard.mp4';
import audioVid from '../assets/audio.mp4';
import magicAcademyTxtImg from '../assets/magic_academy_text.png';
import wonderStudioTxtImg from '../assets/wonder_studio_text.png';
import sunshineValleyTxtImg from '../assets/sunshine_valley_text.png';
import { FEATURES_TOOLTIPS } from '../data/featuresData';
import { DailyTreasureMap } from '../components/dashboard/DailyTreasureMap';
import { Trophy } from 'lucide-react';

export const HomePage: React.FC = () => {
    const [activeZone, setActiveZone] = useState<null | 'academy' | 'studio' | 'valley'>(null);
    const [showTreasure, setShowTreasure] = useState(false);
    const [isIpadLandscape, setIsIpadLandscape] = useState(false);

    // Audio Logic Removed - Static Background Only

    // iPad Landscape Detection Logic
    useEffect(() => {
        const checkIpadLandscape = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isLandscape = width > height;
            // iPad range is typically 1024 to 1366. 
            // We removed hasTouch check to allow easier testing on desktop resizing.
            const isIpadSize = width >= 1024 && width <= 1366;

            if (isIpadSize && isLandscape) {
                console.log("📱 iPad Landscape Mode Detected: Using static background");
            }

            setIsIpadLandscape(isIpadSize && isLandscape);
        };

        checkIpadLandscape();
        window.addEventListener('resize', checkIpadLandscape);
        return () => window.removeEventListener('resize', checkIpadLandscape);
        checkIpadLandscape();
        window.addEventListener('resize', checkIpadLandscape);
        return () => window.removeEventListener('resize', checkIpadLandscape);
    }, []);

    // 🚀 iOS/iPad Global Video Unlock Check
    useEffect(() => {
        const isUnlocked = localStorage.getItem('videoUnlocked') === 'true';
        if (isUnlocked) {
            console.log("🔓 [HomePage] Video unlock flag found. Force playing all videos.");
            const allVideos = document.querySelectorAll('video');
            allVideos.forEach(v => {
                if (v.paused) {
                    v.play().catch(e => console.log("Force play caught:", e));
                }
            });
        }
    }, [activeZone]); // Re-run when activeZone changes (new videos might appear in menus)
    const handleBackgroundClick = () => {
        setActiveZone(null);
    };

    // DEBUG: Window Dimensions
    const [dim, setDim] = useState({ w: window.innerWidth, h: window.innerHeight });
    useEffect(() => {
        const handleResize = () => setDim({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div
            className="relative w-full min-h-[100dvh] overflow-hidden bg-slate-900"
            onClick={handleBackgroundClick} // Clicking anywhere resets, stopPropagation on buttons prevents this
        >

            {/* 1. 地图背景层 (Map Background Layer) - Fixed full screen coverage */}
            <div className={`fixed inset-0 transition-transform duration-700 ease-in-out ${activeZone && !isIpadLandscape ? 'scale-110' : 'scale-100'}`}>

                {/* DEBUG OVERLAY - REMOVE LATER */}
                <div className="fixed top-0 left-0 bg-black/50 text-white p-2 z-[9999] text-xs pointer-events-none">
                    W: {dim.w} | H: {dim.h} | iPad: {isIpadLandscape ? 'YES' : 'NO'} | V: Tile
                </div>

                {isIpadLandscape ? (
                    <div
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundImage: 'url(/newback.png?v=tile_mode)',
                            backgroundRepeat: 'repeat', // "平铺" = Tile
                            backgroundPosition: 'top left',
                            backgroundSize: 'auto', // Original size, no stretch
                            backgroundColor: 'red' // Fallback to see if div is there
                        }}
                    />
                ) : (
                    <div
                        className="w-full h-full bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: 'url(/back1.png)',
                            position: 'absolute',
                            inset: 0
                        }}
                    />
                )}
            </div>

            {/* 
        Note: We use explicit localized click zones. 
        stopPropagation is crucial so clicking the zone doesn't immediately trigger the background click.
      */}

            {/* 🏰 Zone A: Magic Academy (Top Left) */}
            {/* Positioned roughly where the castle would be */}
            <div className="absolute top-[10%] left-[1%] w-[40%] h-[35%] z-10 pointer-events-none">
                {/* The visual anchor/button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveZone('academy'); }}
                    className="w-full h-full pointer-events-auto group outline-none focus:outline-none"
                >
                    {/* Visual Placeholder for the Castle if not using bg image */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        animate={{
                            y: activeZone === 'academy' ? ["-50%", "-55%", "-50%"] : ["-50%", "-55%", "-50%"],
                            scale: activeZone === 'academy' ? 1.1 : [0.98, 1.02, 0.98]
                        }}
                        whileHover={{ scale: 1.15, rotate: [0, -2, 2, 0] }}
                        whileTap={{ scale: 1.25 }}
                        transition={{
                            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                            scale: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
                            rotate: { duration: 0.6, ease: "easeInOut" }
                        }}
                    >
                        <motion.div
                            className="inline-block bg-white/40 rounded-3xl px-3 py-1.5 border-4 border-white transition-all duration-300 group-hover:border-white/90"
                            animate={{
                                boxShadow: [
                                    "0 0 25px rgba(255,255,255,0.6)",
                                    "0 0 45px rgba(255,255,255,0.9)",
                                    "0 0 25px rgba(255,255,255,0.6)"
                                ]
                            }}
                            transition={{
                                boxShadow: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                            }}
                        >
                            <img
                                src={magicAcademyTxtImg}
                                alt="Magic Academy"
                                className="w-32 md:w-44 object-contain drop-shadow-2xl opacity-100 transition-opacity"
                            />
                            {/* DEBUG BADGE */}
                            <div className="absolute -top-4 -right-4 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full z-50 animate-bounce">
                                V2 DEBUG
                            </div>
                        </motion.div>
                    </motion.div>
                </button>

                {/* Pop-up Menu */}
                <AnimatePresence>
                    {activeZone === 'academy' && (
                        <FanMenuV2
                            items={[
                                {
                                    label: FEATURES_TOOLTIPS.art_coach.label,
                                    shortDesc: FEATURES_TOOLTIPS.art_coach.shortDesc,
                                    to: '/creative-journey',
                                    videoSrc: creativeJourneyVid,
                                    description: FEATURES_TOOLTIPS.art_coach.desc,
                                    icon: "🎨"
                                },
                                {
                                    label: FEATURES_TOOLTIPS.art_class.label,
                                    shortDesc: FEATURES_TOOLTIPS.art_class.shortDesc,
                                    to: '/art-class',
                                    videoSrc: artStudioVid,
                                    description: FEATURES_TOOLTIPS.art_class.desc,
                                    icon: "🏫"
                                },
                                {
                                    label: FEATURES_TOOLTIPS.art_studio.label, // Art Studio
                                    shortDesc: FEATURES_TOOLTIPS.art_studio.shortDesc,
                                    to: '/magic-studio',
                                    videoSrc: magicLabVid,
                                    description: FEATURES_TOOLTIPS.art_studio.desc,
                                    icon: "🖌️"
                                }
                            ]}
                            position="flat-bottom"
                            radius={85}
                            spread={120}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* 🎡 Zone B: Wonder Studio (Top Right) */}
            <div className="absolute top-[26%] right-0 w-[40%] h-[35%] z-10 pointer-events-none">
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveZone('studio'); }}
                    className="w-full h-full pointer-events-auto group outline-none focus:outline-none"
                >
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        animate={{
                            y: activeZone === 'studio' ? ["-50%", "-55%", "-50%"] : ["-50%", "-56%", "-50%"],
                            scale: activeZone === 'studio' ? 1.1 : [0.98, 1.02, 0.98]
                        }}
                        whileHover={{ scale: 1.15, rotate: [0, 2, -2, 0] }}
                        whileTap={{ scale: 1.25 }}
                        transition={{
                            y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                            scale: { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
                            rotate: { duration: 0.6, ease: "easeInOut" }
                        }}
                    >
                        <motion.div
                            className="inline-block bg-white/40 rounded-3xl px-3 py-1.5 border-4 border-white transition-all duration-300 group-hover:border-white/90"
                            animate={{
                                boxShadow: [
                                    "0 0 25px rgba(255,255,255,0.6)",
                                    "0 0 50px rgba(139,92,246,0.8)",
                                    "0 0 25px rgba(255,255,255,0.6)"
                                ]
                            }}
                            transition={{
                                boxShadow: { duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }
                            }}
                        >
                            <img
                                src={wonderStudioTxtImg}
                                alt="Wonder Studio"
                                className="w-32 md:w-44 object-contain drop-shadow-2xl opacity-100 transition-opacity"
                            />
                        </motion.div>
                    </motion.div>
                </button>

                <AnimatePresence>
                    {activeZone === 'studio' && (
                        <FanMenuV2
                            items={[
                                { label: FEATURES_TOOLTIPS.cartoon_book.label, shortDesc: FEATURES_TOOLTIPS.cartoon_book.shortDesc, to: '/cartoon-book/builder', videoSrc: cartoonBookVid, description: FEATURES_TOOLTIPS.cartoon_book.desc },
                                { label: FEATURES_TOOLTIPS.picture_book.label, shortDesc: FEATURES_TOOLTIPS.picture_book.shortDesc, to: '/generate/picture', videoSrc: pictureBookVid, description: FEATURES_TOOLTIPS.picture_book.desc },
                                { label: FEATURES_TOOLTIPS.animation_studio.label, shortDesc: FEATURES_TOOLTIPS.animation_studio.shortDesc, to: '/make-cartoon', videoSrc: cartoonVid, description: FEATURES_TOOLTIPS.animation_studio.desc },
                                { label: FEATURES_TOOLTIPS.video.label, shortDesc: FEATURES_TOOLTIPS.video.shortDesc, to: '/generate/video', videoSrc: videoVid, description: FEATURES_TOOLTIPS.video.desc },
                                { label: FEATURES_TOOLTIPS.comic.label, shortDesc: FEATURES_TOOLTIPS.comic.shortDesc, to: '/generate/comic', videoSrc: comicVid, description: FEATURES_TOOLTIPS.comic.desc },
                                { label: FEATURES_TOOLTIPS.magic_toy.label, shortDesc: FEATURES_TOOLTIPS.magic_toy.shortDesc, to: '/magic-toy', videoSrc: cartoonVid, description: FEATURES_TOOLTIPS.magic_toy.desc, icon: "🧸" },
                                { label: FEATURES_TOOLTIPS.audio.label, shortDesc: FEATURES_TOOLTIPS.audio.shortDesc, to: '/generate/audio', videoSrc: audioVid, description: FEATURES_TOOLTIPS.audio.desc, isFree: true }
                            ]}
                            position="surround"
                            radius={150}
                            spread={130}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* 🌳 Zone C: Sunshine Valley (Bottom Left) */}
            <div className="absolute bottom-[20%] left-[8%] w-[45%] h-[30%] z-10 pointer-events-none">
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveZone('valley'); }}
                    className="w-full h-full pointer-events-auto group outline-none focus:outline-none"
                >
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        animate={{
                            y: activeZone === 'valley' ? ["-50%", "-55%", "-50%"] : ["-50%", "-54%", "-50%"],
                            scale: activeZone === 'valley' ? 1.1 : [0.98, 1.02, 0.98]
                        }}
                        whileHover={{ scale: 1.15, rotate: [0, -2, 2, 0] }}
                        whileTap={{ scale: 1.25 }}
                        transition={{
                            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 },
                            scale: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1 },
                            rotate: { duration: 0.6, ease: "easeInOut" }
                        }}
                    >
                        <motion.div
                            className="inline-block bg-white/40 rounded-3xl px-3 py-1.5 border-4 border-white transition-all duration-300 group-hover:border-white/90"
                            animate={{
                                boxShadow: [
                                    "0 0 25px rgba(255,255,255,0.6)",
                                    "0 0 50px rgba(34,197,94,0.8)",
                                    "0 0 25px rgba(255,255,255,0.6)"
                                ]
                            }}
                            transition={{
                                boxShadow: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1 }
                            }}
                        >
                            <img
                                src={sunshineValleyTxtImg}
                                alt="Sunshine Valley"
                                className="w-32 md:w-44 object-contain drop-shadow-2xl opacity-100 transition-opacity"
                            />
                        </motion.div>
                    </motion.div>
                </button>

                <AnimatePresence>
                    {activeZone === 'valley' && (
                        <FanMenuV2
                            items={[
                                {
                                    label: FEATURES_TOOLTIPS.jump_into_art.label,
                                    shortDesc: FEATURES_TOOLTIPS.jump_into_art.shortDesc,
                                    to: '/jump-into-art',
                                    videoSrc: jumpVid,
                                    description: FEATURES_TOOLTIPS.jump_into_art.desc,
                                    icon: "🕺"
                                },
                                {
                                    label: FEATURES_TOOLTIPS.card.label,
                                    shortDesc: FEATURES_TOOLTIPS.card.shortDesc,
                                    to: '/generate/greeting-card',
                                    videoSrc: cardVid,
                                    description: FEATURES_TOOLTIPS.card.desc,
                                    icon: "💌"
                                }
                            ]}
                            position="flat-top"
                            radius={130}
                            spread={100}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* 🐱 Magic Kat (Moved to Bottom Right) */}
            <div
                className="absolute bottom-24 right-4 z-20 pointer-events-auto"
                onClick={(e) => e.stopPropagation()} // Prevent closing zones when clicking Kat? Or maybe it should close others?
            >
                <MagicKatButton videoSrc={mentorVideo} />
            </div>

            {/* 3. Bottom Navigation Bar */}
            <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none">
                <div className="pointer-events-auto">
                    <MagicNavBar />
                </div>
            </div>



            {/* 🗺️ Daily Treasure Map Overlay */}
            <AnimatePresence>
                {showTreasure && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowTreasure(false)}
                    >
                        <div onClick={e => e.stopPropagation()} className="w-full max-w-md">
                            <DailyTreasureMap />
                            <button
                                onClick={() => setShowTreasure(false)}
                                className="mt-4 w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/10 transition-colors"
                            >
                                Close Map
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🏆 Treasure Toggle Button */}
            <div className="absolute top-24 right-5 z-20">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); setShowTreasure(true); }}
                    className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white group relative"
                >
                    <Trophy className="w-7 h-7 text-slate-900 group-hover:rotate-12 transition-transform" />
                    {/* Pulsing indicator if unclaimed? (Future enhancement) */}
                </motion.button>
            </div>
        </div>
    );
};
