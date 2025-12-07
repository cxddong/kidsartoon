import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const OnboardingPage3: React.FC = () => {
    const navigate = useNavigate();

    return (
        <OnboardingLayout bgColor="bg-[#FFF0F5]">
            <div className="relative mb-8 w-full flex justify-center">
                <div className="w-[280px] h-[280px] relative">
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                        className="absolute inset-0 bg-white rounded-3xl shadow-xl flex items-center justify-center border-8 border-pink-100 rotate-3"
                    >
                        <span className="text-8xl">✨</span>
                    </motion.div>

                    {/* Sparkles */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                            className="absolute text-yellow-500"
                            style={{
                                top: `${Math.random() * 100}%`,
                                left: `${Math.random() * 100}%`
                            }}
                        >
                            <Sparkles className="w-8 h-8 fill-current" />
                        </motion.div>
                    ))}
                </div>
            </div>

            <h1 className="text-3xl font-black text-slate-800 text-center mb-4 leading-tight">
                Your Art Becomes <br />
                <span className="text-pink-500">Magic!</span>
            </h1>

            <p className="text-slate-500 font-bold text-center mb-12 px-2">
                Your imagination brings everything to life!
            </p>

            <button
                onClick={() => navigate('/onboarding/start')}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white text-xl font-black py-5 rounded-[24px] shadow-lg shadow-pink-500/30 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] group"
            >
                Almost There!
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
        </OnboardingLayout>
    );
};

export default OnboardingPage3;
