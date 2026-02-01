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
        path: '/generate/comic'
    },
    {
        id: 'picture',
        title: 'Picture Book',
        shortTitle: 'Picture Book',
        desc: 'Write a classic storybook with full-page illustrations.',
        icon: <BookOpen size={48} />,
        color: '#FB923C', // Orange-400
        path: '/generate/picture'
    },
    {
        id: 'novel',
        title: 'Graphic Novel',
        shortTitle: 'Graphic Novel',
        desc: 'Build a longer cartoon book with chapters and detailed scenes.',
        icon: <FileVideo size={48} />,
        color: '#A78BFA', // Purple-400
        path: '/cartoon-book/builder'
    }
];

export const StoryFormatSelectionPage = () => {
    const navigate = useNavigate();
    const [activeId, setActiveId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-[#FFF5E6] relative overflow-hidden flex flex-col justify-between">
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
                className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-6 -mt-20 pointer-events-none"
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
            <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-10">
                <div className="flex items-end justify-between gap-4 w-full h-[600px]"> {/* Fixed height container to allow expansion */}
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
                                        // height is controlled by animate prop or standard conditional style
                                    }}
                                    animate={{ height: isActive ? 'auto' : 120 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                >
                                    {/* Content Container */}
                                    <div className="relative p-6 flex flex-col h-full text-white">

                                        {/* Icon & Title Area */}
                                        {/* When inactive: Center content. When active: Move to top. */}
                                        <motion.div
                                            layout
                                            className={`flex items-center gap-3 w-full ${isActive ? 'mb-4 flex-row justify-start' : 'h-full flex-col justify-center'}`}
                                        >
                                            <motion.span layout className="text-white drop-shadow-md">
                                                {type.icon}
                                            </motion.span>
                                            <motion.span
                                                layout
                                                className={`font-black uppercase drop-shadow-md text-center ${isActive ? 'text-2xl' : 'text-sm mt-2'}`}
                                            >
                                                {isActive ? type.title : type.shortTitle}
                                            </motion.span>
                                        </motion.div>

                                        {/* Expanded Content */}
                                        <AnimatePresence>
                                            {isActive && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="flex-1 flex flex-col justify-between"
                                                >
                                                    <div className="bg-black/20 rounded-2xl p-6 mb-4 border border-white/10">
                                                        <p className="text-lg leading-relaxed font-medium">{type.desc}</p>
                                                        <p className="mt-4 italic text-yellow-200 text-base font-bold flex items-center gap-2">
                                                            <span>✨</span> Your magic starts here!
                                                        </p>
                                                    </div>

                                                    {/* GO Button */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(type.path);
                                                        }}
                                                        className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-transform hover:bg-yellow-50 flex items-center justify-center gap-2 flex-shrink-0"
                                                    >
                                                        GO! 🚀
                                                    </button>
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
