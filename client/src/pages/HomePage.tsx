import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Globe, User, Home, Video, BookOpen, MessageCircle, Heart, Music, Sparkles, Palette, Film, Maximize, Minimize } from 'lucide-react';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { FeedbackWidget } from '../components/FeedbackWidget';

// Assets
import homepageBg from '../assets/home (2).mp4';
import mentorVideo from '../assets/mentor journey.mp4';
import graphicNovelVideo from '../assets/graphicnovel.mp4';
import bookVideo from '../assets/picturebook.mp4';
import greetingCardVideo from '../assets/greeting_card1.mp4';
import comicVideo from '../assets/comic.mp4';
import audioVideo from '../assets/mic3.mp4';
import cartoonVideo from '../assets/video.mp4';
import magicVideo from '../assets/startmagic.mp4';
import artStudioVideo from '../assets/art studio.mp4';
import animationVideo from '../assets/cartoon.mp4';
import mirrorVideo from '../assets/mirror.mp4';
import mirrorBtnVideo from '../assets/mirrorbtn.mp4';
import jumpIntoArtVideo from '../assets/jump into art.mp4';

// Component for Floating Feature Islands
const FloatingBubble = ({ to, icon, videoSrc, label, className, delay, activePreview, onPreview, alignBottom }: { to: string; icon: React.ReactNode; videoSrc?: string; label: string; className?: string; delay: number; activePreview: string | null; onPreview: (to: string | null) => void; alignBottom?: boolean }) => {
    const navigate = useNavigate();
    const isActive = activePreview === to;

    return (
        <motion.div
            className={cn(
                "relative cursor-pointer group",
                isActive ? "z-[60]" : "z-30",
                className
            )}
            initial={{ y: 0 }}
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: delay }}
            whileHover={{ scale: 1.1 }}
            onClick={(e) => {
                e.stopPropagation();
                navigate(to);
            }}
            onMouseEnter={() => onPreview(to)}
            onMouseLeave={() => onPreview(null)}
        >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/80 backdrop-blur-md rounded-full shadow-xl border-4 border-white/50 flex items-center justify-center text-3xl md:text-4xl overflow-hidden relative group-hover:border-white transition-all">
                {videoSrc ? (
                    <video src={videoSrc} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90" />
                ) : (
                    icon
                )}
            </div>

            {/* Preview Box */}
            <AnimatePresence>
                {isActive && (
                    <FeaturePreviewBox to={to} onClose={() => onPreview(null)} showRight={true} alignBottom={alignBottom} />
                )}
            </AnimatePresence>

            {/* Text Label Below Bubble - Mobile only */}
            <span className="md:hidden text-[10px] text-white font-black uppercase tracking-tight truncate block text-center w-full drop-shadow-md group-hover:text-indigo-200 transition-colors mt-1">
                {label}
            </span>
        </motion.div>
    );
};

// Feature Preview Data
const FEATURE_PREVIEWS: Record<string, { title: string; desc: string; video?: string; icon?: string }> = {
    '/generate/audio': {
        title: 'Magic Audio',
        desc: 'Turn your drawing into a talking character with a magical voice!',
        video: audioVideo
    },
    '/generate/comic': {
        title: 'Comic Book',
        desc: 'Step inside a superhero story! See how your photo becomes a comic.',
        video: comicVideo
    },
    '/generate/picture': {
        title: 'Picture Book',
        desc: 'Write and illustrate your very own magical story book!',
        video: bookVideo
    },
    '/generate/video': {
        title: 'Animation',
        desc: 'Bring your art to life! Watch your drawings move and groove.',
        video: cartoonVideo
    },
    '/generate/greeting-card': {
        title: 'Magic Card',
        desc: 'Create a sparkling greeting card to send to someone special!',
        video: greetingCardVideo
    },
    '/magic-art': {
        title: 'Art Studio',
        desc: 'Paint like a master! Use AI to turn your sketches into masterpieces.',
        video: artStudioVideo
    },
    '/creative-journey': {
        title: 'Art Coach',
        desc: 'Get personalized AI coaching to improve your art skills and discover your style!',
        video: mentorVideo
    },
    '/cartoon-book/builder': {
        title: 'Cartoon Book',
        desc: 'Create your own cartoon graphic novel with amazing characters and stories!',
        video: graphicNovelVideo
    },
    '/magic-discovery': {
        title: 'Magic Mirror',
        desc: 'Transform your photos with magical AI effects and filters!',
        video: mirrorBtnVideo
    },
    '/make-cartoon': {
        title: 'Animation Studio',
        desc: 'Turn your art into animated cartoons that move and dance!',
        video: animationVideo
    },
    '/jump-into-art': {
        title: 'Jump Into Art',
        desc: 'Step into your artwork and become part of the masterpiece!',
        video: jumpIntoArtVideo
    }
};

// Component for Feature Preview Box
const FeaturePreviewBox = ({ to, onClose, alignBottom, showRight }: { to: string; onClose: () => void; alignBottom?: boolean; showRight?: boolean }) => {
    const navigate = useNavigate();
    const preview = FEATURE_PREVIEWS[to];
    if (!preview) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: showRight ? -20 : 20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: showRight ? -20 : 20, scale: 0.9 }}
            className={cn(
                "absolute w-64 md:w-72 bg-white rounded-3xl shadow-2xl border-4 border-white/50 overflow-hidden z-50 pointer-events-auto",
                showRight ? "left-[110%]" : "right-[110%]",
                alignBottom ? "bottom-0" : "top-0"
            )}
        >
            <div className="relative aspect-video w-full bg-slate-100">
                {preview.video ? (
                    <video src={preview.video} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">{preview.icon}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            <div className="p-4 space-y-3">
                <h3 className="text-lg font-black text-slate-800 leading-tight">{preview.title}</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">{preview.desc}</p>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(to);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-black text-sm shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    Let's Go! <Sparkles size={14} className="fill-white" />
                </button>
            </div>
        </motion.div>
    );
};

// Component for Dock Items
const DockItem = ({ to, icon, videoSrc, label, badge, activePreview, onPreview, alignBottom }: { to: string; icon: React.ReactNode; videoSrc?: string; label: string; badge?: string; activePreview: string | null; onPreview: (to: string | null) => void; alignBottom?: boolean }) => {
    const navigate = useNavigate();
    const isActive = activePreview === to;

    return (
        <div
            className={cn(
                "relative flex justify-end gap-3 group cursor-pointer",
                alignBottom ? "items-end" : "items-start"
            )}
            onMouseEnter={() => onPreview(to)}
            onMouseLeave={() => onPreview(null)}
            onClick={(e) => {
                e.stopPropagation();
                onPreview(to);
            }}
        >
            {/* Text Label to the Left of Button */}
            <span className="text-[10px] md:text-xs text-white font-black uppercase tracking-wider whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-indigo-200 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 hidden md:block absolute right-[4.5rem] md:right-20 top-1/2 -translate-y-1/2">
                {label}
            </span>

            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    "w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center transition-all duration-300 border-2 overflow-hidden shadow-xl relative group-hover:border-white/60 shrink-0",
                    isActive
                        ? "bg-white border-indigo-400 scale-105 shadow-indigo-500/30"
                        : "bg-white/20 backdrop-blur-md border-white/30"
                )}
            >
                <div className="absolute inset-0 z-0 overflow-hidden rounded-inherit">
                    {videoSrc ? (
                        <video
                            src={videoSrc}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className={cn("w-full h-full object-cover transition-opacity", isActive ? "opacity-100" : "opacity-80")}
                        />
                    ) : (
                        <div className={cn("w-full h-full flex items-center justify-center transition-colors", isActive ? "text-indigo-600 bg-white" : "text-white")}>
                            {icon}
                        </div>
                    )}
                </div>

                {badge && (
                    <div className="absolute top-0 right-0 bg-gradient-to-br from-yellow-400 to-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-bl-lg shadow-sm z-20">
                        {badge}
                    </div>
                )}
            </motion.div>


            <AnimatePresence>
                {isActive && (
                    <FeaturePreviewBox to={to} onClose={() => onPreview(null)} alignBottom={alignBottom} />
                )}
            </AnimatePresence>
        </div>
    );
};

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [activePreview, setActivePreview] = React.useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                    setIsFullscreen(false);
                }
            }
        } catch (error: any) {
            console.error('Fullscreen error:', error);
            alert(`无法进入全屏模式: ${error.message}\n\n请尝试按 F11 键进入全屏。`);
        }
    };

    React.useEffect(() => {
        const handle = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handle);
        return () => document.removeEventListener('fullscreenchange', handle);
    }, []);

    return (
        <div
            className="relative min-h-screen overflow-hidden bg-black pb-24 font-sans selection:bg-indigo-500/30"
            onClick={() => setActivePreview(null)}
        >
            {/* 1. Background Layer */}
            <div className="absolute inset-0 z-0 text-white flex items-center justify-center">
                <video
                    src={homepageBg}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            </div>

            {/* Fullscreen Toggle - Bottom Left */}
            <div className="absolute bottom-6 left-6 z-50 flex flex-col items-start gap-3">
                <AnimatePresence>
                    {!isFullscreen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.8 }}
                            animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{
                                y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                                opacity: { duration: 0.3 }
                            }}
                            className="bg-indigo-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-lg shadow-indigo-500/20 whitespace-nowrap relative after:content-[''] after:absolute after:top-full after:left-4 after:border-8 after:border-transparent after:border-t-indigo-500"
                        >
                            Fullscreen for better magic! ✨
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleFullscreen();
                    }}
                    className="p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white hover:bg-white/30 transition-all shadow-xl group"
                >
                    {isFullscreen ? <Minimize size={24} className="group-hover:scale-110 transition-transform" /> : <Maximize size={24} className="group-hover:scale-110 transition-transform" />}
                </button>
            </div>

            {/* 2. Center Stage (Magic Kat) - Hidden on mobile and desktop */}
            <div className="relative h-[80vh] flex flex-col items-start md:items-center justify-start pt-[10vh] md:pt-[5vh] pl-6 md:pl-0">

                {/* Magic Kat (Apprentice) - Hidden */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="hidden z-20 cursor-pointer relative"
                    onClick={() => navigate('/magic-lab')}
                >
                    {/* The Cat Avatar */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32 bg-white/80 backdrop-blur-md rounded-full shadow-2xl border-4 border-white/50 flex items-center justify-center overflow-hidden">
                        <video
                            src={mentorVideo}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-90"
                        />
                    </div>

                    {/* Text Label Below Bubble - Matching FloatingBubble Style */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 group-hover:scale-105 transition-transform">
                        <span className="text-[11px] md:text-[13px] text-white font-black uppercase tracking-[0.1em] whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            Ask Magic Kat
                        </span>
                    </div>
                </motion.div>

                {/* Feature Islands (All on left side, staggered) */}
                <div className="absolute inset-0 pointer-events-none max-w-6xl mx-auto w-full h-full">
                    {/* All 5 bubbles on left side - staggered vertically */}
                    <FloatingBubble
                        to="/creative-journey"
                        icon="🎨"
                        videoSrc={mentorVideo}
                        label="Art Coach"
                        className="pointer-events-auto absolute top-[8%] left-[5%] md:top-[12%] md:left-[20%]"
                        delay={0}
                        activePreview={activePreview}
                        onPreview={setActivePreview}
                    />
                    <FloatingBubble
                        to="/cartoon-book/builder"
                        icon="📚"
                        videoSrc={graphicNovelVideo}
                        label="Cartoon Book"
                        className="pointer-events-auto absolute top-[26%] left-[5%] md:top-[35%] md:left-[15%]"
                        delay={1.5}
                        activePreview={activePreview}
                        onPreview={setActivePreview}
                    />
                    <FloatingBubble
                        to="/magic-discovery"
                        icon="🪞"
                        videoSrc={mirrorBtnVideo}
                        label="Mirror"
                        className="pointer-events-auto absolute top-[44%] left-[5%] md:top-[55%] md:left-[10%]"
                        delay={0.5}
                        activePreview={activePreview}
                        onPreview={setActivePreview}
                    />
                    <FloatingBubble
                        to="/make-cartoon"
                        icon={<Film />}
                        videoSrc={animationVideo}
                        label="Animation"
                        className="pointer-events-auto absolute top-[62%] left-[5%] md:top-[72%] md:left-[18%]"
                        delay={1.0}
                        activePreview={activePreview}
                        onPreview={setActivePreview}
                        alignBottom
                    />
                    <FloatingBubble
                        to="/jump-into-art"
                        icon="🚪"
                        videoSrc={jumpIntoArtVideo}
                        label="Jump Into Art"
                        className="pointer-events-auto absolute top-[80%] left-[5%] md:top-[88%] md:left-[25%]"
                        delay={2.0}
                        activePreview={activePreview}
                        onPreview={setActivePreview}
                        alignBottom
                    />
                </div>
            </div>

            {/* 3. Magic Dock (Vertical Right Side) */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-40 h-[80vh] max-h-[600px] flex items-center">
                <div className="flex flex-col justify-evenly items-end h-full overflow-visible scrollbar-hide py-6 px-3">
                    <DockItem to="/generate/audio" icon={<Music size={24} />} videoSrc={audioVideo} label="Audio" badge="FREE" activePreview={activePreview} onPreview={setActivePreview} />
                    <DockItem to="/generate/comic" icon={<MessageCircle size={24} />} videoSrc={comicVideo} label="Comic" activePreview={activePreview} onPreview={setActivePreview} />
                    <DockItem to="/generate/picture" icon={<BookOpen size={24} />} videoSrc={bookVideo} label="Book" activePreview={activePreview} onPreview={setActivePreview} />
                    <DockItem to="/generate/video" icon={<Video size={24} />} videoSrc={cartoonVideo} label="Video" alignBottom activePreview={activePreview} onPreview={setActivePreview} />
                    <DockItem to="/generate/greeting-card" icon={<Heart size={24} />} videoSrc={greetingCardVideo} label="Card" alignBottom activePreview={activePreview} onPreview={setActivePreview} />
                    <DockItem to="/magic-art" icon={<Palette size={24} />} videoSrc={artStudioVideo} label="Art Studio" alignBottom activePreview={activePreview} onPreview={setActivePreview} />
                </div>
            </div>

            <MagicNavBar />
            <FeedbackWidget />
        </div>
    );
};
