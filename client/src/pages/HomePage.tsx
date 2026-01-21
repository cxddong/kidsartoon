import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { FanMenu } from '../components/home/FanMenu';
import { MagicKatButton } from '../components/home/MagicKatButton';
import mentorVideo from '../assets/mentor journey.mp4';
import creativeJourneyVid from '../assets/creative journey.mp4';
import artStudioVid from '../assets/art studio.mp4';
import magicLabVid from '../assets/magiclab.mp4';
import graphicNovelVid from '../assets/graphicnovel.mp4';
import cartoonBookVid from '../assets/cartoon book.mp4';
import pictureBookVid from '../assets/picturebook.mp4';
import cartoonVid from '../assets/cartoon.mp4';
import videoVid from '../assets/video.mp4';
import comicVid from '../assets/comic.mp4';
import mirrorBtnVid from '../assets/mirrorbtn.mp4';
import jumpVid from '../assets/jump into art.mp4';
import cardVid from '../assets/greetingcard.mp4';
import audioVid from '../assets/audio.mp4';
import magicAcademyTxtImg from '../assets/magic_academy_text.png';
import wonderStudioTxtImg from '../assets/wonder_studio_text.png';
import sunshineValleyTxtImg from '../assets/sunshine_valley_text.png';
import { FEATURES_TOOLTIPS } from '../data/featuresData';

// Assets (Using placeholders/gradients if image is missing, but keeping the requested img tag)
// Assuming the user will provide 'world_map_v2.jpg' or we use a gradient for now.



export const HomePage: React.FC = () => {
    const [activeZone, setActiveZone] = useState<null | 'academy' | 'studio' | 'valley'>(null);

    // Helper to handle clicks on the background/empty space to close menus
    const handleBackgroundClick = () => {
        setActiveZone(null);
    };

    return (
        <div
            className="relative w-full h-screen overflow-hidden bg-sky-100"
            onClick={handleBackgroundClick} // Clicking anywhere resets, stopPropagation on buttons prevents this
        >

            {/* 1. 地图背景层 (Map Background Layer) */}
            <div className={`w-full h-full transition-transform duration-700 ease-in-out ${activeZone ? 'scale-110' : 'scale-100'}`}>
                {/* 
            Fallback to a gradient if image is missing/loading. 
            In a real scenario, we'd use a real map image. 
            For now, visual zones are approximated by the background.
         */}
                <video
                    src="/assets/HOME1.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
            </div>

            {/* 
        Note: We use explicit localized click zones. 
        stopPropagation is crucial so clicking the zone doesn't immediately trigger the background click.
      */}

            {/* 🏰 Zone A: Magic Academy (Top Left) */}
            {/* Positioned roughly where the castle would be */}
            {/* Positioned roughly where the castle would be */}
            <div className="absolute top-[10%] left-[1%] w-[40%] h-[35%] z-10 pointer-events-none">
                {/* The visual anchor/button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveZone('academy'); }}
                    className="w-full h-full pointer-events-auto group outline-none focus:outline-none"
                >
                    {/* Visual Placeholder for the Castle if not using bg image */}
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${activeZone === 'academy' ? 'scale-110 brightness-110' : 'scale-100 hover:scale-105'}`}>
                        {/* ICON REMOVED per user request */}
                        {/* <div className="text-6xl md:text-8xl drop-shadow-2xl filter">🏰</div> */}
                        <div className="inline-block bg-white/12 backdrop-blur-[2px] rounded-xl px-1.5 py-0.5 border border-white/15">
                            <img
                                src={magicAcademyTxtImg}
                                alt="Magic Academy"
                                className="w-48 md:w-64 object-contain drop-shadow-2xl opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>
                </button>

                {/* Pop-up Menu */}
                <AnimatePresence>
                    {activeZone === 'academy' && (
                        <FanMenu
                            items={[
                                { label: FEATURES_TOOLTIPS.art_coach.label, to: '/creative-journey', videoSrc: creativeJourneyVid, description: FEATURES_TOOLTIPS.art_coach.desc },
                                { label: FEATURES_TOOLTIPS.art_class.label, to: '/art-class', videoSrc: artStudioVid, description: FEATURES_TOOLTIPS.art_class.desc },
                                { label: FEATURES_TOOLTIPS.art_studio.label, to: '/magic-art', videoSrc: magicLabVid, description: FEATURES_TOOLTIPS.art_studio.desc }
                            ]}
                            position="flat-top"
                            radius={110}
                            spread={120}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* 🎡 Zone B: Wonder Studio (Top Right) */}
            <div className="absolute top-[10%] right-0 w-[40%] h-[35%] z-10 pointer-events-none">
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveZone('studio'); }}
                    className="w-full h-full pointer-events-auto group outline-none focus:outline-none"
                >
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${activeZone === 'studio' ? 'scale-110 brightness-110' : 'scale-100 hover:scale-105'}`}>
                        {/* ICON REMOVED per user request */}
                        {/* <div className="text-6xl md:text-8xl drop-shadow-2xl">🎡</div> */}
                        <div className="inline-block bg-white/12 backdrop-blur-[2px] rounded-xl px-1.5 py-0.5 border border-white/15">
                            <img
                                src={wonderStudioTxtImg}
                                alt="Wonder Studio"
                                className="w-48 md:w-64 object-contain drop-shadow-2xl opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>
                </button>

                <AnimatePresence>
                    {activeZone === 'studio' && (
                        <FanMenu
                            items={[
                                { label: FEATURES_TOOLTIPS.cartoon_book.label, to: '/cartoon-book/builder', videoSrc: cartoonBookVid, description: FEATURES_TOOLTIPS.cartoon_book.desc },
                                { label: FEATURES_TOOLTIPS.picture_book.label, to: '/generate/picture', videoSrc: pictureBookVid, description: FEATURES_TOOLTIPS.picture_book.desc },
                                { label: FEATURES_TOOLTIPS.animation_studio.label, to: '/make-cartoon', videoSrc: cartoonVid, description: FEATURES_TOOLTIPS.animation_studio.desc },
                                { label: FEATURES_TOOLTIPS.video.label, to: '/generate/video', videoSrc: videoVid, description: FEATURES_TOOLTIPS.video.desc },
                                { label: FEATURES_TOOLTIPS.comic.label, to: '/generate/comic', videoSrc: comicVid, description: FEATURES_TOOLTIPS.comic.desc }
                            ]}
                            position="surround"
                            radius={90}
                            spread={110}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* 🌳 Zone C: Sunshine Valley (Bottom Center) */}
            <div className="absolute bottom-[20%] left-[25%] w-[50%] h-[30%] z-10 pointer-events-none">
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveZone('valley'); }}
                    className="w-full h-full pointer-events-auto group outline-none focus:outline-none"
                >
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${activeZone === 'valley' ? 'scale-110 brightness-110' : 'scale-100 hover:scale-105'}`}>
                        {/* ICON REMOVED per user request */}
                        {/* <div className="text-6xl md:text-8xl drop-shadow-2xl">🌳</div> */}
                        <div className="inline-block bg-white/12 backdrop-blur-[2px] rounded-xl px-1.5 py-0.5 border border-white/15">
                            <img
                                src={sunshineValleyTxtImg}
                                alt="Sunshine Valley"
                                className="w-48 md:w-64 object-contain drop-shadow-2xl opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        </div>
                    </div>
                </button>

                <AnimatePresence>
                    {activeZone === 'valley' && (
                        <FanMenu
                            items={[
                                { label: FEATURES_TOOLTIPS.mirror.label, to: '/magic-discovery', videoSrc: mirrorBtnVid, description: FEATURES_TOOLTIPS.mirror.desc },
                                { label: FEATURES_TOOLTIPS.jump_into_art.label, to: '/jump-into-art', videoSrc: jumpVid, description: FEATURES_TOOLTIPS.jump_into_art.desc },
                                { label: FEATURES_TOOLTIPS.card.label, to: '/generate/greeting-card', videoSrc: cardVid, description: FEATURES_TOOLTIPS.card.desc },
                                { label: FEATURES_TOOLTIPS.audio.label, to: '/generate/audio', videoSrc: audioVid, description: FEATURES_TOOLTIPS.audio.desc }
                            ]}
                            position="flat-bottom"
                            radius={110}
                            spread={110}
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

        </div>
    );
};
