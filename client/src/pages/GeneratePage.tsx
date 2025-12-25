import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mic, BookOpen, Video, ArrowLeft, Gift, Wand2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';
import { SparkleVoiceFab } from '../components/sparkle/SparkleVoiceFab';
import inputBg from '../assets/generate_page_bg_new.jpg'; // Fixed asset input_bg.png -> generate_page_bg_new.jpg

import genBtnVideo from '../assets/startmagic.mp4';
import genVideo from '../assets/gen.mp4';
import audioVideo from '../assets/audionew.mp4';
import comicVideo from '../assets/comic123.mp4';
import picbookVideo from '../assets/picbook.mp4';
import cartoonVideo from '../assets/cartoon.mp4';
import bookVideo from '../assets/book.mp4';
import video4 from '../assets/4.mp4'; // New Import
import iconAudio from '../assets/icon_audio.png';
import iconComic from '../assets/icon_comic.png';
import iconAnimation from '../assets/icon_animation.png';
import iconPictureBook from '../assets/icon_picture_book.png';

const options = [
    {
        id: 'audio-story',
        title: 'Audio Story',
        icon: Mic,
        image: iconAudio,
        video: audioVideo,
        videoScale: 1.35,
        color: 'bg-secondary',
        path: '/generate/audio',
        imageScale: 1.75
    },
    {
        id: 'picture-book',
        title: '4-Panel Comic',
        icon: BookOpen,
        image: iconComic,
        video: video4, // Swapped
        videoScale: 1.1, // Reduced to show border
        color: 'bg-accent-purple',
        path: '/generate/comic',
        state: { mode: 'comic' },
        imageScale: 1.6
    },
    {
        id: 'story-book',
        title: 'Picture Book',
        icon: BookOpen,
        image: iconPictureBook,
        video: bookVideo,
        videoScale: 1.6,
        color: 'bg-accent-purple',
        path: '/generate/picture',
        state: { mode: 'book' },
        imageScale: 1.1
    },
    {
        id: 'animation',
        title: 'Animation',
        icon: Video,
        image: iconAnimation,
        video: cartoonVideo,
        videoScale: 2.0,
        color: 'bg-primary',
        path: '/generate/video',
        imageScale: 1.65
    },
    {
        id: 'magic-lab',
        title: 'Magic Lab',
        icon: Wand2,
        // image: iconMagic, // Need icon? using Wand2 for now
        video: genBtnVideo,
        videoScale: 1.2,
        color: 'bg-purple-600',
        path: '/magic-lab',
        imageScale: 1.0
    },
    {
        id: 'greeting-card',
        title: 'Greeting Card',
        icon: Gift,
        color: 'bg-pink-500',
        path: '/generate/greeting-card',
        imageScale: 1.0
    }
];

export const GeneratePage: React.FC = () => {
    const navigate = useNavigate();

    const handleNavigation = (path: string, state?: any) => {
        navigate(path, { state });
    };

    return (
        <div className="fixed inset-0 z-40 bg-slate-900 flex flex-col overflow-hidden overscroll-none">
            {/* Fixed Background Image */}
            {/* Fixed Background Image Removed */}
            {/* <img className="fixed inset-0 z-0 w-full h-full object-cover opacity-30" src={inputBg} alt="Background" /> */}

            {/* Content Overlay */}
            <div className="flex-1 flex flex-col relative z-10 p-4">
                <header className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/home')} className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors">
                            <ArrowLeft className="w-6 h-6 text-slate-600" />
                        </button>
                        <h1 className="text-3xl font-black text-white drop-shadow-md">Create Magic</h1>
                    </div>

                    {/* Sparkle Voice Assistant Removed */}
                </header>

                {/* Main Content Area */}
                <div className="flex-1 relative w-full h-full">

                    {/* Left: Vertical Stack (Standard Options) */}
                    <div className="absolute left-8 top-[40%] -translate-y-1/2 flex flex-col gap-6">
                        {/* Exclude Magic Lab AND Greeting Card from Left Stack */}
                        {options.filter(o => o.id !== 'magic-lab' && o.id !== 'greeting-card').map((opt, i) => (
                            <motion.button
                                key={opt.id}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => handleNavigation(opt.path, (opt as any).state)}
                                className="flex items-center gap-4 group justify-start relative px-1 py-1"
                            >
                                <div className={cn(
                                    "w-14 h-14 flex items-center justify-center transition-transform duration-300 group-active:scale-95 group-hover:scale-110",
                                    (opt as any).image || (opt as any).video ? "" : `${opt.color} text-white rounded-full shadow-lg`
                                )}>
                                    {(opt as any).video ? (
                                        <div className={cn(
                                            "w-full h-full overflow-hidden shadow-md bg-white/20 backdrop-blur-sm",
                                            "rounded-full border-2 border-white/50"
                                        )}>
                                            <video
                                                src={(opt as any).video}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                disablePictureInPicture
                                                controlsList="nodownload noremoteplayback"
                                                className="w-full h-full object-cover"
                                                style={{ scale: (opt as any).videoScale || 1.0 }}
                                            />
                                        </div>
                                    ) : (opt as any).image ? (
                                        <img
                                            src={(opt as any).image}
                                            alt={opt.title}
                                            className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
                                            style={{ scale: (opt as any).imageScale || 1.0 }}
                                        />
                                    ) : (
                                        <opt.icon className="w-8 h-8" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wide group-hover:text-yellow-300 transition-colors",
                                    "bg-black/20 px-3 py-1 rounded-full backdrop-blur-[2px]"
                                )}>
                                    {opt.title}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Center: Magic Lab (Special Single Button) */}
                    {options.filter(o => o.id === 'magic-lab').map((opt) => (
                        <div key={opt.id} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                                className="group relative flex flex-col items-center"
                                onClick={() => handleNavigation(opt.path, (opt as any).state)}
                            >
                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-purple-500/30 blur-3xl rounded-full group-hover:bg-purple-500/50 transition-all duration-500" />

                                {/* Reduced Size Again: w-48/64 -> w-40/56 */}
                                {/* Reduced Size Again: w-32/48 */}
                                <div className="w-32 h-32 md:w-48 md:h-48 relative z-10 rounded-full border-4 border-white/50 shadow-[0_0_50px_rgba(168,85,247,0.6)] overflow-hidden bg-black/40 backdrop-blur-sm">
                                    <video
                                        src={(opt as any).video}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        disablePictureInPicture
                                        controlsList="nodownload noremoteplayback"
                                        className="w-full h-full object-cover"
                                        style={{ scale: 1.2 }}
                                    />
                                    {/* Overlay Text inside the circle */}
                                    <div className="absolute inset-x-0 bottom-6 flex justify-center">
                                        <span className="text-xl md:text-2xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] tracking-wider">
                                            MAGIC LAB
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 text-white/80 font-bold text-lg animate-pulse">
                                    ✨ Click to Transform! ✨
                                </div>
                            </motion.button>
                        </div>
                    ))}

                    {/* Right: Greeting Card */}
                    <div className="absolute right-8 top-[40%] -translate-y-1/2 flex flex-col gap-6">
                        {options.filter(o => o.id === 'greeting-card').map((opt, i) => (
                            <motion.button
                                key={opt.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => handleNavigation(opt.path, (opt as any).state)}
                                className="flex items-center gap-4 group justify-end flex-row-reverse relative px-1 py-1"
                            >
                                <div className={cn(
                                    "w-14 h-14 flex items-center justify-center transition-transform duration-300 group-active:scale-95 group-hover:scale-110",
                                    (opt as any).image || (opt as any).video ? "" : `${opt.color} text-white rounded-2xl shadow-lg`
                                )}>
                                    {/* Simple Icon for now as configured in options */}
                                    {/* But Greeting Card might not have video/image set correctly? It uses Gift icon in options */}
                                    <opt.icon className="w-8 h-8" />
                                </div>
                                <span className={cn(
                                    "text-xl font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-wide group-hover:text-yellow-300 transition-colors",
                                    "bg-black/20 px-3 py-1 rounded-full backdrop-blur-[2px]"
                                )}>
                                    {opt.title}
                                </span>
                            </motion.button>
                        ))}
                    </div>

                    {/* Bottom Center: Start Magic Cartoon (Video Button) */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                        <motion.button
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleNavigation('/make-cartoon')}
                            className="group relative w-80 h-20 flex items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500 scale-90" />
                            <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm">
                                <video
                                    src={genBtnVideo} // Ensure prompt video plays
                                    className="w-full h-full object-cover pointer-events-none"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    disablePictureInPicture
                                    controlsList="nodownload noremoteplayback"
                                />
                            </div>
                            {/* Text Overlay */}
                            <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase pointer-events-none z-10">
                                Start Magic
                            </span>
                        </motion.button>
                    </div>

                    {/* DEBUG TOOLS (User requested for testing) */}
                    <div className="absolute bottom-4 left-4 z-50 p-4 bg-black/60 backdrop-blur-md rounded-xl border border-white/10">
                        <h4 className="text-white/50 text-xs font-bold uppercase mb-2">Dev Tools</h4>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(step => (
                                <button
                                    key={step}
                                    onClick={() => window.location.href = `/make-cartoon?step=${step}`}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center border border-white/20 transition-all"
                                >
                                    {step}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div >
        </div >
    );
};
