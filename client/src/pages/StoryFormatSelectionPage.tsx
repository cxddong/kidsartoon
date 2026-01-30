import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, MessageCircle, FileVideo } from 'lucide-react';

const SelectionCard = ({
    title,
    description,
    icon: Icon,
    color,
    onClick,
    delay
}: {
    title: string;
    description: string;
    icon: any;
    color: string;
    onClick: () => void;
    delay: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`relative overflow-hidden group cursor-pointer rounded-3xl p-6 ${color} shadow-xl hover:shadow-2xl transition-all duration-300 border-4 border-white/20`}
    >
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />

        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
                <Icon size={48} className="text-white drop-shadow-md" />
            </div>

            <h3 className="text-2xl font-bold text-white drop-shadow-md font-display tracking-wide">
                {title}
            </h3>

            <p className="text-white/90 font-medium leading-relaxed">
                {description}
            </p>

            <div className="pt-4">
                <span className="px-6 py-2 bg-white/20 rounded-full text-white font-bold backdrop-blur-md group-hover:bg-white/30 transition-colors">
                    Start Creating
                </span>
            </div>
        </div>
    </motion.div>
);

export const StoryFormatSelectionPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#FFF5E6] relative overflow-hidden flex flex-col">
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-purple-300/20 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-orange-300/20 rounded-full blur-[80px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-blue-300/20 rounded-full blur-[90px]" />
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

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 -mt-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16 max-w-2xl mx-auto"
                >
                    <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-500 mb-6 drop-shadow-sm font-display">
                        Choose Your Story
                    </h1>
                    <p className="text-xl text-gray-600 font-medium leading-relaxed">
                        Every great adventure starts with a choice. How do you want to tell your story today?
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto w-full px-4">
                    <SelectionCard
                        title="Comic Strip"
                        description="Create fun comic strips with multiple panels and speech bubbles!"
                        icon={MessageCircle}
                        color="bg-gradient-to-br from-blue-400 to-blue-600"
                        onClick={() => navigate('/generate/comic')}
                        delay={0.1}
                    />

                    <SelectionCard
                        title="Picture Book"
                        description="Write a classic storybook with full-page illustrations."
                        icon={BookOpen}
                        color="bg-gradient-to-br from-orange-400 to-orange-600"
                        onClick={() => navigate('/generate/picture')}
                        delay={0.2}
                    />

                    <SelectionCard
                        title="Graphic Novel"
                        description="Build a longer cartoon book with chapters and detailed scenes."
                        icon={FileVideo}
                        color="bg-gradient-to-br from-purple-400 to-purple-600"
                        onClick={() => navigate('/cartoon-book/builder')}
                        delay={0.3}
                    />
                </div>
            </main>

            {/* Decorative Footer */}
            <div className="h-4 bg-gradient-to-r from-blue-400 via-purple-500 to-orange-400 w-full" />
        </div>
    );
};
