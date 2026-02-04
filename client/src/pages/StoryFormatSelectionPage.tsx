import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, MessageCircle, FileVideo } from 'lucide-react';

const STORY_TYPES = [
    {
        id: 'comic',
        title: 'Comic Strip',
        shortTitle: 'Comics',
        desc: 'Create fun comic strips with multiple panels and speech bubbles!',
        icon: <MessageCircle size={48} />,
        color: '#60A5FA', // Blue-400
        path: '/generate/comic',
        image: '/assets/story_select_3.jpg' // 4-panel girl
    },
    {
        id: 'picture',
        title: 'Picture Book',
        shortTitle: 'Picture Book',
        desc: 'Write a classic storybook with full-page illustrations.',
        icon: <BookOpen size={48} />,
        color: '#FB923C', // Orange-400
        path: '/generate/picture',
        image: '/assets/story_select_1.jpg' // Single scene girl+llama
    },
    {
        id: 'novel',
        title: 'Graphic Novel',
        shortTitle: 'Graphic Novel',
        desc: 'Build a longer cartoon book with chapters and detailed scenes.',
        icon: <FileVideo size={48} />,
        color: '#A78BFA', // Purple-400
        path: '/cartoon-book/builder',
        image: '/assets/story_select_2.jpg' // Cat spread
    }
];

export const StoryFormatSelectionPage = () => {
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState<string | null>(null);

    return (
        <div className="h-screen w-screen overflow-hidden fixed inset-0 bg-[#FFF5E6] flex flex-col justify-between">
            {/* Video Background */}
            <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute min-w-full min-h-full object-cover w-auto h-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                    <source src="/assets/story.mp4" type="video/mp4" />
                </video>
            </div>

            {/* Header */}
            <header className="relative z-10 p-6 flex items-center justify-between max-w-7xl mx-auto w-full">
                <button
                    onClick={() => navigate('/home')}
                    className="flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all text-gray-700 font-bold border-2 border-purple-100"
                >
                    <ArrowLeft size={24} className="text-purple-500" />
                    <span>Back to Map</span>
                </button>
            </header>

            {/* Main Title Area (Visible when no selection is active) */}
            <motion.div
                className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-6 mt-10 pointer-events-none"
                animate={{ opacity: activeId ? 0 : 1 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200 mb-6 drop-shadow-lg font-display">
                    Choose Your Story
                </h1>
                <p className="text-xl text-white/90 font-medium leading-relaxed drop-shadow-md">
                    Tap a button below to start your magic journey!
                </p>
            </motion.div>

            {/* Bottom Interaction Area - Vertical Expanding Buttons */}
            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 pb-0 h-[70vh] flex items-end">
                <div className="flex items-end justify-between gap-4 w-full h-full">
                    {STORY_TYPES.map((type) => {
                        const isActive = activeId === type.id;
                        return (
                            <div key={type.id} className="flex-1 h-full flex items-end">
                                <motion.div
                                    layout
                                    onClick={() => setActiveId(isActive ? null : type.id)}
                                    className="relative cursor-pointer overflow-hidden shadow-2xl flex flex-col w-full border-4 border-white/30 backdrop-blur-md"
                                    style={{
                                        backgroundColor: type.color,
                                        borderRadius: '32px',
                                        zIndex: isActive ? 50 : 1
                                    }}
                                    animate={{ height: isActive ? '100%' : 140 }}
                                    transition={{ type: "spring", stiffness: 250, damping: 25 }}
                                >
                                    {/* Content Container */}
                                    <div className={`relative flex flex-col h-full text-white ${isActive ? 'p-0' : 'p-4 md:p-6'}`}>

                                        {/* Icon & Title Area - Compact when active */}
                                        <motion.div
                                            layout
                                            className={`flex items-center gap-3 w-full shrink-0 ${isActive ? 'p-4 pb-2 flex-row justify-start' : 'h-full flex-col justify-center'}`}
                                        >
                                            <motion.span layout className="text-white drop-shadow-md">
                                                {/* Scale down icon when active */}
                                                {isActive ? React.cloneElement(type.icon as React.ReactElement, { size: 28 }) : type.icon}
                                            </motion.span>
                                            <motion.span
                                                layout
                                                className={`font-black uppercase drop-shadow-md text-center ${isActive ? 'text-2xl md:text-3xl' : 'text-sm md:text-base mt-2'}`}
                                            >
                                                {isActive ? type.title : type.shortTitle}
                                            </motion.span>
                                        </motion.div>

                                        {/* Expanded Content */}
                                        <AnimatePresence mode="popLayout">
                                            {isActive && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex-1 flex flex-col min-h-0"
                                                >
                                                    {/* Image Preview - Full Bleed but Contained (No Cutting) */}
                                                    <div className="w-full flex-1 min-h-0 overflow-hidden bg-black/10 relative group">
                                                        <img
                                                            src={type.image}
                                                            alt={type.title}
                                                            className="absolute inset-0 w-full h-full object-cover transition-all duration-200"
                                                            onError={(e) => {
                                                                console.error("Image failed to load:", type.image);
                                                            }}
                                                        />
                                                    </div>

                                                    {/* GO Button Container */}
                                                    <div className="p-4 pt-2 shrink-0">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(type.path);
                                                            }}
                                                            className="w-full bg-white text-slate-900 py-3 md:py-4 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-transform hover:bg-yellow-50 flex items-center justify-center gap-2"
                                                        >
                                                            GO! 🚀
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
