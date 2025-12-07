import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ArrowRight, Mic, BookOpen, Film } from 'lucide-react';
import { motion } from 'framer-motion';

const OnboardingPage2: React.FC = () => {
    const navigate = useNavigate();

    return (
        <OnboardingLayout bgColor="bg-[#F0F7FF]">
            <div className="relative mb-8 w-full flex justify-center">
                {/* Main Illustration Area */}
                <div className="w-[300px] h-[300px] relative">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="absolute inset-0 bg-white rounded-full shadow-xl flex items-center justify-center border-8 border-blue-100"
                    >
                        <span className="text-8xl">🎨</span>
                    </motion.div>

                    {/* Floating Icons */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute top-0 left-[-20px] bg-yellow-400 p-4 rounded-2xl shadow-lg border-4 border-white rotate-[-12deg]"
                    >
                        <BookOpen className="w-8 h-8 text-white" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="absolute bottom-4 right-[-10px] bg-pink-400 p-4 rounded-2xl shadow-lg border-4 border-white rotate-[12deg]"
                    >
                        <Mic className="w-8 h-8 text-white" />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 }}
                        className="absolute top-[40%] right-[-40px] bg-purple-400 p-4 rounded-2xl shadow-lg border-4 border-white"
                    >
                        <Film className="w-8 h-8 text-white" />
                    </motion.div>
                </div>
            </div>

            <h1 className="text-3xl font-black text-slate-800 text-center mb-4 leading-tight">
                Create Anything From <br />
                <span className="text-blue-500">Your Drawings</span>
            </h1>

            <p className="text-slate-500 font-bold text-center mb-12 px-2">
                Turn your art into stories, comics, and animations!
            </p>

            <button
                onClick={() => navigate('/onboarding/page3')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xl font-black py-5 rounded-[24px] shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] group"
            >
                Next
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
        </OnboardingLayout>
    );
};

export default OnboardingPage2;
