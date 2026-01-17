import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Crown, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MagicNavBar } from '../components/ui/MagicNavBar';

// Feature Item Component
const FeatureItem = ({ text, check = true, highlighted = false }: { text: string; check?: boolean; highlighted?: boolean }) => (
    <li className="flex items-start">
        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${check ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
            {check ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
        </div>
        <span className={`ml-3 text-sm ${highlighted ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{text}</span>
    </li>
);

export const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

    const handleSubscribe = (planId: string) => {
        setSelectedPlan(planId);
        // TODO: Integrate with payment system
        console.log(`Selected plan: ${planId}`);
    };

    const handleTopUp = (amount: string) => {
        // TODO: Integrate with payment system
        console.log(`Top up: $${amount}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft size={20} />
                <span className="font-medium">Back</span>
            </button>

            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-extrabold text-indigo-900 sm:text-5xl"
                >
                    Unlock Unlimited Imagination
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mt-4 text-xl text-gray-500"
                >
                    Give your child the power to create movies, books, and art with Magic Kat.
                </motion.p>
                <p className="mt-2 text-sm text-gray-400">Cancel anytime. No hidden fees.</p>
            </div>

            {/* Tiers Grid */}
            <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-3 lg:gap-8 items-start mb-12">

                {/* FREE PLAN */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 opacity-90 hover:opacity-100 transition"
                >
                    <h3 className="text-lg font-semibold text-gray-900">Explorer</h3>
                    <p className="mt-4 flex items-baseline text-gray-900">
                        <span className="text-4xl font-extrabold tracking-tight">$0</span>
                    </p>
                    <p className="mt-1 text-sm text-gray-500">One-time welcome gift</p>
                    <div className="mt-6 bg-gray-50 rounded-xl p-4 text-center">
                        <span className="block text-2xl font-bold text-gray-700">50 Pts</span>
                        <span className="text-xs text-gray-500">Total</span>
                    </div>
                    <p className="mt-2 text-xs text-center text-gray-500">
                        Just enough for a taste: <b>1 Storybook</b>
                    </p>
                    <ul className="mt-6 space-y-4">
                        <FeatureItem text="Try Art & Stories" />
                        <FeatureItem text="Standard Voice Only" />
                        <FeatureItem text="No Video Generation" check={false} />
                    </ul>
                    <button
                        onClick={() => handleSubscribe('free')}
                        className="mt-8 block w-full bg-gray-100 border border-transparent rounded-xl py-3 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        Current Plan
                    </button>
                </motion.div>

                {/* BASIC PLAN */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-md p-8 border-2 border-blue-100 relative"
                >
                    <h3 className="text-lg font-semibold text-blue-600">Basic Creator</h3>
                    <p className="mt-4 flex items-baseline text-gray-900">
                        <span className="text-4xl font-extrabold tracking-tight">$9.99</span>
                        <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
                    </p>
                    <div className="mt-6 bg-blue-50 rounded-xl p-4 text-center">
                        <span className="block text-2xl font-bold text-blue-600">1,000 Pts</span>
                        <span className="text-xs text-blue-400">Refilled Monthly</span>
                    </div>
                    <p className="mt-2 text-xs text-center text-blue-600 font-medium">
                        Make <b>25 Storybooks</b> / month
                    </p>
                    <ul className="mt-6 space-y-4">
                        <FeatureItem text="Create Stories & Comics" />
                        <FeatureItem text="Clone Voices" />
                        <FeatureItem text="No Video Generation" check={false} />
                    </ul>
                    <button
                        onClick={() => handleSubscribe('basic')}
                        className="mt-8 block w-full bg-blue-100 border border-transparent rounded-xl py-3 text-sm font-semibold text-blue-700 hover:bg-blue-200 transition-colors"
                    >
                        Start Basic
                    </button>
                </motion.div>

                {/* PRO PLAN (Hero) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-500 relative transform md:-translate-y-4"
                >
                    <div className="absolute top-0 right-0 -mt-3 mr-3 px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full text-xs font-bold text-white uppercase tracking-wide shadow-md">
                        Most Popular
                    </div>
                    <h3 className="text-lg font-semibold text-purple-600 flex items-center gap-2">
                        Pro Magician <Sparkles size={18} />
                    </h3>
                    <p className="mt-4 flex items-baseline text-gray-900">
                        <span className="text-5xl font-extrabold tracking-tight">$19.99</span>
                        <span className="ml-1 text-xl font-semibold text-gray-500">/mo</span>
                    </p>
                    <div className="mt-6 bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                        <span className="block text-3xl font-bold text-purple-600">2,200 Pts</span>
                        <span className="text-xs text-purple-400">Refilled Monthly</span>
                    </div>
                    <p className="mt-2 text-xs text-center text-purple-600 font-medium">
                        🎥 Create <b>36 Videos</b> / month!
                    </p>
                    <ul className="mt-6 space-y-4">
                        <FeatureItem text="Everything in Basic" />
                        <FeatureItem text="Video Generation Access 🎬" highlighted />
                        <FeatureItem text="Priority GPU Speed 🚀" highlighted />
                    </ul>
                    <motion.button
                        onClick={() => handleSubscribe('pro')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-8 block w-full bg-purple-600 border border-transparent rounded-xl py-4 text-md font-bold text-white hover:bg-purple-700 shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                        Get Pro
                    </motion.button>
                </motion.div>

            </div>

            {/* YEARLY DEAL BANNER */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-7xl mx-auto mb-20"
            >
                <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-3xl p-1 shadow-2xl">
                    <div className="bg-white rounded-[20px] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Crown className="text-yellow-500 fill-current" size={24} />
                                <span className="text-sm font-bold text-orange-600 uppercase tracking-wider">Best for Schools & Power Users</span>
                            </div>
                            <h3 className="text-3xl font-bold text-gray-900">Yearly Ultimate Pass</h3>
                            <p className="mt-2 text-gray-600">
                                Get <span className="font-bold text-black">12,000 Points</span> instantly. That's enough for <b>200+ Videos</b>!
                            </p>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-sm text-gray-500 line-through">$239.88</p>
                            <p className="text-4xl font-black text-gray-900">$99.00<span className="text-lg text-gray-500 font-normal">/yr</span></p>
                            <p className="text-green-600 font-bold text-sm">SAVE $140 (58% OFF)</p>
                        </div>
                        <motion.button
                            onClick={() => handleSubscribe('yearly')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-transform shadow-xl"
                        >
                            Get Yearly Deal
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* REFILL PACKS (Grid) */}
            <div className="max-w-4xl mx-auto text-center">
                <h3 className="text-xl font-bold text-gray-400 mb-8 uppercase tracking-widest">Or Top-up One Time</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

                    {/* Small Pouch */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleTopUp('4.99')}
                    >
                        <div className="text-5xl mb-3">💰</div>
                        <h4 className="font-bold text-gray-900">Small Pouch</h4>
                        <p className="text-2xl font-extrabold text-gray-800 mt-2">450 Pts</p>
                        <p className="text-sm text-gray-500 mt-1">$4.99</p>
                    </motion.div>

                    {/* Treasure Chest (Best Value) */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white rounded-2xl p-6 border-2 border-blue-300 shadow-md hover:shadow-lg transition-all cursor-pointer relative"
                        onClick={() => handleTopUp('9.99')}
                    >
                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">BEST VALUE</div>
                        <div className="text-5xl mb-3">💎</div>
                        <h4 className="font-bold text-gray-900">Treasure Chest</h4>
                        <p className="text-2xl font-extrabold text-blue-600 mt-2">1,000 Pts</p>
                        <p className="text-sm text-gray-500 mt-1">$9.99</p>
                    </motion.div>

                    {/* Dragon Hoard */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handleTopUp('19.99')}
                    >
                        <div className="text-5xl mb-3">🐲</div>
                        <h4 className="font-bold text-gray-900">Dragon Hoard</h4>
                        <p className="text-2xl font-extrabold text-gray-800 mt-2">2,200 Pts</p>
                        <p className="text-sm text-gray-500 mt-1">$19.99</p>
                    </motion.div>

                </div>
            </div>

            {/* Navigation */}
            <MagicNavBar />
        </div>
    );
};
