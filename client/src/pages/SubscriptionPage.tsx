import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, Crown, Heart, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '../components/BackButton';
import { MagicFireworks } from '../components/effects/MagicFireworks';

const PLANS = [
    {
        id: 'free',
        name: 'Free Explorer 🎈',
        price: '0',
        period: '/forever',
        points: 50,
        color: 'slate',
        icon: <Smile className="w-6 h-6 text-slate-500" />,
        headline: "Try the Magic",
        features: [
            '50 Magic Points (One-time)',
            '3 Audio Stories / Day',
            '(Standard Voice)',
            'Read & Save Stories',
            'Try Video & Art'
        ],
        valueDescription: (
            <>
                <div className="text-[10px] font-bold opacity-70 mb-1">Enough to make:</div>
                <div className="text-xs leading-relaxed">
                    🧩 <b>5</b> Comic Strips<br />
                    <span className="text-[9px] opacity-60 font-bold">OR</span> 📖 <b>1</b> Storybook (4-page)<br />
                    <span className="text-[9px] opacity-60 font-bold">OR</span> 🖼️ <b>5</b> Images
                </div>
            </>
        ),
        highlight: false,
        buttonText: 'Your Plan'
    },
    {
        id: 'basic',
        name: 'Basic',
        price: '9.99',
        period: '/mo',
        points: 1000,
        color: 'blue',
        icon: <Heart className="w-6 h-6 text-blue-500" />,
        headline: "Best for Comics & Stories",
        features: [
            '1,000 Magic Points / mo',
            'Create Stories & Comics',
            'Generate Pictures',
            'Clone Voices',
            'No Video Generation'
        ],
        valueDescription: (
            <>
                <div className="text-[10px] font-bold opacity-70 mb-1">Monthly creation power:</div>
                <div className="text-xs leading-relaxed">
                    🧩 <b>100</b> Comic Strips <span className="text-[9px] opacity-70">(3/day!)</span><br />
                    <span className="text-[9px] opacity-60 font-bold">OR</span> 📖 <b>25</b> Storybooks <span className="text-[9px] opacity-70">(1/day)</span><br />
                    <span className="text-[9px] opacity-60 font-bold">OR</span> 🖼️ <b>100</b> Images
                </div>
            </>
        ),
        highlight: false,
        buttonText: 'Start Basic'
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '19.99',
        period: '/mo',
        points: 2200,
        color: 'purple',
        icon: <Star className="w-6 h-6 text-white" />,
        headline: "Video Magic & More",
        features: [
            '2,200 Magic Points / mo',
            'Everything in Basic',
            '✨ Video Animation Support',
            'Priority Generation',
            'Full Magic Experience'
        ],
        valueDescription: (
            <>
                <div className="text-[10px] font-bold opacity-70 mb-1">Monthly creation power:</div>
                <div className="text-xs leading-relaxed">
                    🎥 <b>36</b> Animation Videos<br />
                    <span className="text-[9px] opacity-80 pl-4">Approx. 1 per day</span><br />
                    <span className="text-[9px] opacity-60 font-bold">OR</span> 🧩 <b>220</b> Comic Strips<br />
                    <span className="text-[9px] opacity-60 font-bold">OR</span> 📖 <b>55</b> Storybooks
                </div>
                <div className="mt-1.5 p-1.5 bg-white/10 rounded-md text-[9px] leading-tight opacity-90">
                    <b>Mix & Match:</b> 10 Videos + 20 Storybooks + 80 Comics
                </div>
            </>
        ),
        highlight: true,
        buttonText: 'Get Pro'
    },
    {
        id: 'yearly_pro',
        name: 'Yearly Pro',
        price: '99.00',
        period: '/yr',
        points: 12000,
        color: 'amber',
        icon: <Crown className="w-6 h-6 text-amber-600" />,
        headline: "For Schools & Power Users",
        features: [
            '12,000 Magic Points (Instant)',
            'Include All Pro Features',
            'Save $140/yr (58% OFF)',
            'Best for Schools',
            '1 Year Full Access'
        ],
        valueDescription: (
            <>
                <div className="text-[10px] font-bold opacity-70 mb-1">Yearly creation power:</div>
                <div className="text-xs leading-relaxed">
                    🎥 <b>200</b> Animation Videos<br />
                    <span className="text-[9px] opacity-60 font-bold">OR</span> 🧩 <b>1,200</b> Comic Strips<br />
                    <span className="text-[9px] opacity-60 font-bold">OR</span> 📖 <b>300</b> Storybooks
                </div>
                <div className="mt-1.5 p-1.5 bg-yellow-100/50 rounded-md text-[9px] leading-tight text-amber-900 font-bold">
                    Get all 12,000 points instantly!
                </div>
            </>
        ),
        highlight: false,
        buttonText: 'Get Yearly'
    }
];

const TOP_UPS = [
    { title: 'Small Pouch', points: 450, price: '4.99', icon: '💰' },
    { title: 'Treasure Chest', points: 1000, price: '9.99', icon: '💎', popular: true },
    { title: 'Dragon Hoard', points: 2200, price: '19.99', icon: '🐲' }
];

export const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const [showFireworks, setShowFireworks] = useState(false);

    const handleSubscribe = async (planId: string) => {
        if (!user) {
            alert("Please login first!");
            return;
        }
        setLoading(planId);
        try {
            const res = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, planId, platform: 'web' })
            });
            const data = await res.json();
            if (data.success) {
                // Play Success Animation set
                setShowFireworks(true);

                // English Voice only
                const text = "Yippee! Welcome to the club! You are now a Premium Member! Let's make some magic!";
                if ('speechSynthesis' in window) {
                    const utt = new SpeechSynthesisUtterance(text);
                    window.speechSynthesis.speak(utt);
                }

                // Wait for animation then go back
                setTimeout(() => {
                    navigate('/generate');
                }, 4000);
            } else {
                alert(`Failed: ${data.error}`);
            }
        } catch (e: any) {
            alert(`Error: ${e.message}`);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            <MagicFireworks isVisible={showFireworks} onComplete={() => setShowFireworks(false)} />
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-100 to-transparent pointer-events-none" />

            <header className="p-3 relative z-10 flex items-center shrink-0">
                <BackButton onClick={() => navigate(-1)} />
                <h2 className="ml-4 text-lg font-bold text-indigo-900/50">Membership</h2>
            </header>

            {/* Main Content Container - Flex Column to fill available space */}
            <div className="flex-1 px-4 pb-4 relative z-10 flex flex-col justify-between min-h-0 overflow-hidden">

                {/* Header Section - Modern */}
                <div className="text-center mt-4 mb-8 shrink-0">
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 mb-2 font-serif">
                        Unlock Kids' Creativity ✨
                    </h1>
                    <p className="text-slate-600 text-xs md:text-sm font-medium max-w-xl mx-auto leading-relaxed">
                        Become a member to get monthly <b>Magic Points</b> for stories, comics, and animation!
                    </p>
                </div>

                {/* Section 1: Monthly Memberships */}
                <div className="w-full max-w-7xl mx-auto px-2 md:px-4 mb-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Crown className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-base font-black text-slate-700 uppercase tracking-widest">Monthly Memberships</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5 md:gap-2 w-full items-end">
                        {PLANS.slice(0, 4).map((plan) => (
                            <motion.div
                                key={plan.id}
                                whileHover={{ y: -4 }}
                                layout
                                className={`
                                    relative rounded-xl p-2 flex flex-col gap-1 shadow-sm transition-all
                                    ${plan.highlight
                                        ? 'bg-gradient-to-b from-purple-600 to-indigo-700 text-white z-10 ring-2 ring-purple-200 shadow-xl scale-105 origin-bottom'
                                        : plan.id === 'yearly_pro'
                                            ? 'bg-gradient-to-b from-amber-50 to-orange-50 text-slate-900 border border-amber-200'
                                            : 'bg-white text-slate-800 border border-slate-100'
                                    }
                                `}
                            >
                                {(plan.highlight || plan.id === 'yearly_pro') && (
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold shadow-sm flex items-center gap-1 whitespace-nowrap ${plan.id === 'yearly_pro' ? 'bg-red-500 text-white animate-pulse' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'}`}>
                                        <Star className="w-2.5 h-2.5 fill-current" />
                                        {plan.id === 'yearly_pro' ? 'SAVE $140 / YR!' : 'MOST POPULAR'}
                                    </div>
                                )}

                                {/* Plan Header */}
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg shrink-0 ${plan.highlight ? 'bg-white/20' : `bg-${plan.color}-100`}`}>
                                        {React.cloneElement(plan.icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
                                    </div>
                                    <div className="text-left min-w-0">
                                        <h3 className="text-xs font-bold opacity-90 leading-none truncate">{plan.name}</h3>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-lg font-black leading-none">${plan.price}</span>
                                            <span className={`text-[9px] font-bold ${plan.highlight ? 'text-white/70' : 'text-slate-400'}`}>{plan.period}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Headline */}
                                <div className={`text-[9px] font-medium italic mb-0.5 ${plan.highlight ? 'text-white/80' : 'text-slate-500'}`}>
                                    "{plan.headline}"
                                </div>

                                {/* Points Badge */}
                                <div className={`px-2 py-1 rounded-lg ${plan.highlight ? 'bg-white/10' : 'bg-slate-50'}`}>
                                    <div className="text-[8px] font-bold opacity-70 leading-none mb-0.5">YOU GET</div>
                                    <div className={`text-sm font-black leading-none ${plan.highlight ? 'text-amber-300' : 'text-purple-600'}`}>
                                        {plan.points.toLocaleString()} Pts
                                    </div>
                                </div>

                                {/* Features List - Tighter */}
                                <ul className="space-y-0.5 text-left my-0.5 flex-1">
                                    {plan.features.map((feat, i) => (
                                        <li key={i} className="flex items-center gap-1.5">
                                            <div className={`shrink-0 p-0.5 rounded-full ${plan.highlight ? 'bg-green-400/20 text-green-300' : 'bg-green-100 text-green-600'}`}>
                                                <Check className="w-2 h-2 stroke-[3]" />
                                            </div>
                                            <span className={`text-[9px] font-bold leading-tight truncate ${feat.includes('No') ? 'opacity-50 line-through decoration-auto' : ''}`}>
                                                {feat}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Value Description - Compact */}
                                <div className={`mt-1 mb-1 p-1.5 rounded-lg text-left ${plan.highlight ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                    {plan.valueDescription}
                                </div>

                                {/* Button */}
                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={loading !== null}
                                    className={`
                                        w-full py-2 rounded-lg font-black text-[10px] transition-all
                                        disabled:opacity-50
                                        ${plan.highlight
                                            ? 'bg-white text-purple-700 hover:bg-slate-100'
                                            : plan.id === 'yearly_pro'
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:brightness-110 shadow-md'
                                                : 'bg-slate-900 text-white hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    {loading === plan.id ? '...' : plan.buttonText}
                                </button>
                            </motion.div>
                        ))}
                    </div>

                </div>

                {/* Section 2: Top-Up Packages (Distinct Area) */}
                <div className="w-full bg-indigo-50/50 border-t border-indigo-100 py-8 mt-8">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <span className="text-2xl">💎</span>
                            <div className="text-center">
                                <h2 className="text-base font-black text-slate-800 uppercase tracking-widest">Need a Boost?</h2>
                                <p className="text-xs font-bold text-slate-400">One-time refill packs. No subscription needed.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {TOP_UPS.map((pkg, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -2 }}
                                    className={`relative bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm hover:shadow-md transition-all ${pkg.popular ? 'ring-2 ring-yellow-400 bg-yellow-50/50' : ''}`}
                                >
                                    {pkg.popular && (
                                        <div className="absolute -top-2 left-4 bg-yellow-400 text-[8px] font-bold px-2 py-0.5 rounded-full text-slate-900 shadow-sm">
                                            BEST VALUE
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-xl">
                                            {pkg.icon}
                                        </div>
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-800">{pkg.title}</h3>
                                            <p className="text-sm font-black text-purple-600">+{pkg.points.toLocaleString()} Pts</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSubscribe('topup_' + pkg.points)} // Handler needs update to support topups
                                        className="bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-slate-800"
                                    >
                                        ${pkg.price}
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-slate-400 text-[8px] shrink-0 pb-1 pt-0">
                    Auto-renewing. Cancel anytime. <b>Parental Control Enabled.</b>
                </p>
            </div>
        </div>
    );
};
