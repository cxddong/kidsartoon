
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { Building } from './Building';
import { MagicBoard } from './MagicBoard';
import { CompassNav } from './CompassNav';
import { StartupModal } from './StartupModal';
import { useNavigate } from 'react-router-dom';

export default function HorizontalWorld() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [showStartup, setShowStartup] = useState(true);
    const navigate = useNavigate();

    // Scroll Progress for Parallax
    const { scrollXProgress } = useScroll({ container: scrollRef });
    const backgroundX = useSpring(useTransform(scrollXProgress, [0, 1], ["0%", "-20%"]), { stiffness: 100, damping: 30 });

    // Simple Drag Logic: Check drop position relative to window width
    const handleDragEnd = (event: any, info: any) => {
        // Current scroll position
        const scrollLeft = scrollRef.current?.scrollLeft || 0;
        const dropX = info.point.x + scrollLeft;
        const windowWidth = window.innerWidth;

        // Example: Dropped in East Zone (Zone 3) near typical Cinema position
        // Zone 3 starts at 2 * windowWidth
        if (dropX > 2.5 * windowWidth) {
            // Rough check for "Cinema" area in East Zone
            console.log("Dropped in Cinema Zone!");
            navigate('/generate/video', { state: { image: userImage } }); // Pass image to video gen
        }
    };

    const scrollToZone = (zoneIndex: number) => {
        if (scrollRef.current) {
            const width = window.innerWidth;
            scrollRef.current.scrollTo({
                left: width * zoneIndex,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#87CEEB]">

            {/* Parallax Background Layer */}
            <motion.div
                style={{ x: backgroundX }}
                className="absolute inset-0 w-[120%] h-full pointer-events-none z-0"
            >
                <img src="/assets/panoramic_map.png" className="w-full h-full object-cover opacity-90" alt="World Map" />
            </motion.div>

            {/* Main Scroll Container */}
            <div
                ref={scrollRef}
                className="flex flex-row w-[300vw] h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide z-10 relative"
            >

                {/* ⬅️ West Zone: Creation Garden */}
                <div className="w-screen h-full relative snap-center shrink-0">
                    <div className="absolute bottom-[25%] left-[15%]">
                        <Building type="art-class" label="🎨 Art Class" onClick={() => navigate('/art-class')} />
                    </div>
                    <div className="absolute bottom-[40%] left-[35%]">
                        <Building type="art-studio" label="🖌️ Art Studio" onClick={() => navigate('/magic-art')} />
                    </div>
                </div>

                {/* ⬇️ Middle Zone: Insight Forest */}
                <div className="w-screen h-full relative snap-center shrink-0">
                    {/* Centerpiece: Art Coach */}
                    <div className="absolute top-[30%] left-[42%] transform scale-125">
                        <Building type="mentor" label="🎓 Art Coach" onClick={() => navigate('/creative-journey')} />
                    </div>

                    <div className="absolute bottom-[25%] left-[20%]">
                        <Building type="mirror" label="🪞 Magic Mirror" onClick={() => navigate('/magic-discovery')} />
                    </div>

                    <div className="absolute bottom-[30%] right-[20%]">
                        <Building type="jump" label="🌀 Jump Into Art" onClick={() => navigate('/jump-into-art')} />
                    </div>
                </div>

                {/* ➡️ East Zone: Story & Cinema */}
                <div className="w-screen h-full relative snap-center shrink-0">
                    {/* Top Cluster */}
                    <div className="absolute top-[20%] left-[10%]">
                        <Building type="card" label="💌 Magic Card" onClick={() => navigate('/generate/greeting-card')} />
                    </div>

                    <div className="absolute top-[25%] left-[30%]">
                        <Building type="comic" label="💬 Comic Strip" onClick={() => navigate('/generate/comic')} />
                    </div>

                    {/* Middle Cluster */}
                    <div className="absolute bottom-[40%] left-[50%]">
                        <Building type="storybook" label="📖 Storybook" onClick={() => navigate('/generate/picture')} />
                    </div>

                    <div className="absolute bottom-[50%] right-[30%]">
                        <Building type="graphic" label="📚 Graphic Novel" onClick={() => navigate('/cartoon-book/builder')} />
                    </div>

                    {/* Ultimate Buildings (Far Right) */}
                    <div className="absolute bottom-[25%] right-[5%] transform scale-125">
                        <Building type="cinema" label="🎬 Magic Cinema" onClick={() => navigate('/generate/video')} />
                    </div>

                    <div className="absolute top-[15%] right-[15%]">
                        <Building type="audio" label="🎵 Magic Audio" onClick={() => navigate('/generate/audio')} />
                    </div>
                </div>

            </div>

            {/* Floating UI Layer */}
            <div className="fixed inset-0 pointer-events-none z-50">
                {/* User Avatar / Board (Draggable) */}
                <div className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <MagicBoard image={userImage} onDragEnd={handleDragEnd} />
                </div>

                {/* Bottom Compass */}
                <div className="absolute bottom-0 left-0 w-full pointer-events-auto flex justify-center pb-4">
                    <CompassNav onNavigate={scrollToZone} />
                </div>
            </div>

            {/* Startup Modal */}
            {showStartup && (
                <StartupModal
                    onDraw={() => {
                        setShowStartup(false);
                        scrollToZone(0); // Go West (Garden)
                    }}
                    onUpload={(img) => {
                        setUserImage(img);
                        setShowStartup(false);
                        scrollToZone(2); // Go East (City)
                    }}
                />
            )}

        </div>
    );
}
