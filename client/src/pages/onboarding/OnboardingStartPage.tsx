import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

const OnboardingStartPage: React.FC = () => {
    const navigate = useNavigate();

    const handleStart = () => {
        // Mark onboarding as complete
        localStorage.setItem('onboardingCompleted', 'true');
        navigate('/startup');
    };

    return (
        <OnboardingLayout bgColor="bg-gradient-to-b from-slate-50 to-white">
            <div className="relative mb-12">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-48 h-48 bg-green-400 rounded-full shadow-2xl flex items-center justify-center border-[12px] border-white relative z-10"
                >
                    <Check className="w-24 h-24 text-white stroke-[4]" />
                </motion.div>

                {/* KidsArToon Logo Placeholder / Badge */}
                <div className="absolute -bottom-6 -right-6 bg-white px-4 py-2 rounded-xl shadow-lg border-4 border-green-100">
                    <span className="font-comic font-black text-slate-700">KidsArToon</span>
                </div>
            </div>

            <h1 className="text-4xl font-black text-slate-800 text-center mb-6">
                Let's Get Started!
            </h1>

            <p className="text-slate-500 text-lg font-bold text-center mb-12 px-6">
                You are ready to create your first masterpiece.
            </p>

            <button
                onClick={handleStart}
                className="w-full bg-green-500 hover:bg-green-600 text-white text-2xl font-black py-6 rounded-[32px] shadow-xl shadow-green-500/30 flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 group"
            >
                Let's Go!
                <ArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
            </button>
        </OnboardingLayout>
    );
};

export default OnboardingStartPage;
