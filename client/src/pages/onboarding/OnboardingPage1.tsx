import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ArrowRight, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const OnboardingPage1: React.FC = () => {
    const navigate = useNavigate();

    return (
        <OnboardingLayout>
            <div className="relative mb-12">
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="w-64 h-64 bg-white rounded-full shadow-2xl flex items-center justify-center border-8 border-white relative z-10"
                >
                    <span className="text-8xl filter drop-shadow-md">🐱</span>
                </motion.div>

                {/* Decorative floating elements */}
                <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                    className="absolute top-0 right-0 text-6xl"
                >
                    🎈
                </motion.div>
                <div className="absolute bottom-4 left-[-20px] text-yellow-500">
                    <Star className="w-12 h-12 fill-current" />
                </div>
            </div>

            <h1 className="text-4xl font-black text-slate-800 text-center mb-4 leading-tight">
                Welcome to <br />
                <span className="text-primary">KidsArToon!</span>
            </h1>

            <p className="text-slate-500 text-lg font-bold text-center mb-12 px-4">
                The magical place where your drawings come to life!
            </p>

            <button
                onClick={() => navigate('/onboarding/page2')}
                className="w-full bg-primary hover:bg-primary-hover text-white text-xl font-black py-5 rounded-[24px] shadow-lg shadow-primary/30 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] group"
            >
                Start Adventure
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>
        </OnboardingLayout>
    );
};

export default OnboardingPage1;
