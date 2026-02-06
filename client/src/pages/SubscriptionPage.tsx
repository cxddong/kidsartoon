import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

import { Ticket } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(ArcElement, Tooltip, Legend);


export const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const [promoCode, setPromoCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    const handleRedeem = async () => {
        if (!user || !promoCode) return;
        setIsRedeeming(true);
        try {
            const res = await fetch('/api/referral/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: promoCode, userId: user.uid })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Success! You got ${data.value} points!`, 'success');
                setPromoCode('');
                // Ideally refresh user points here
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showToast(data.error || 'Redemption failed', 'error');
            }
        } catch (e) {
            console.error(e);
            showToast('Network error during redemption', 'error');
        } finally {
            setIsRedeeming(false);
        }
    };

    // Chart Data
    const chartLabels = ['Magic Cinema (10s)', 'Magic Cinema (5s)', 'Graphic Novel', 'Storybook (4pg)', 'Single Art', 'Chat/Analysis'];
    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                data: [160, 80, 100, 30, 10, 0],
                backgroundColor: ['#EF4444', '#F97316', '#3B82F6', '#10B981', '#94A3B8', '#A78BFA'],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    usePointStyle: true,
                    font: {
                        family: 'Nunito',
                        size: 11
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => ` Cost: -${context.raw} Pt`
                }
            }
        },
        cutout: '65%',
    };


    const handleSubscribe = (planId: string) => {
        // TODO: Integrate with payment system
        console.log(`Subscribe: ${planId}`);
        alert(`Subscription integration coming soon! (Selected: ${planId})`);
    };

    return (
        <div className="min-h-screen bg-[#FFF7ED] text-[#1E293B] font-['Nunito'] pb-24">

            {/* Header */}
            <header className="bg-indigo-900 text-white py-12 px-4 text-center rounded-b-[3rem] shadow-xl mb-12 relative overflow-hidden">
                <div className="max-w-4xl mx-auto relative z-10">
                    <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight font-['Fredoka']">
                        Choose Your Magic Partner
                    </h1>
                    <p className="text-lg text-indigo-200 font-medium font-['Fredoka'] opacity-90">
                        Unlock the full power of Two Cats
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">

                {/* 1. Persona Strategy (The Two Cats) */}
                <section>
                    <div className="text-center mb-10">
                        <div className="inline-block bg-white px-6 py-2 rounded-full shadow-sm mb-4">
                            <span className="text-indigo-900 font-bold uppercase tracking-widest text-xs">Why Upgrade?</span>
                        </div>
                        <h2 className="text-3xl font-bold text-indigo-900 font-['Fredoka']">Meet Your Magic Companions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Junior Kat */}
                        <div className="bg-white rounded-3xl p-8 border-b-8 border-orange-400 shadow-lg relative overflow-hidden group hover:scale-[1.01] transition-transform">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 relative z-10">
                                <div className="text-7xl bg-orange-50 p-4 rounded-3xl group-hover:rotate-6 transition-transform">🐱</div>
                                <div className="text-center sm:text-left">
                                    <h3 className="text-2xl font-bold text-gray-800 font-['Fredoka']">Junior Kat</h3>
                                    <div className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Free / Basic Tier</div>
                                    <div className="mt-2 text-sm text-gray-600 font-medium italic">
                                        "Hi! I'm Junior. I'm learning magic too! I can chat about your art and help fix simple things, but my spells are still basic!"
                                    </div>
                                </div>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-4 relative z-10">
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-center gap-3">
                                        <span className="bg-white p-1 rounded-md shadow-sm text-lg">🧠</span>
                                        <span><strong>Basic Brain:</strong> GPT-4o-mini</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="bg-white p-1 rounded-md shadow-sm text-lg">🤖</span>
                                        <span><strong>Voice:</strong> Robot Voice</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Magic Kat */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border-b-8 border-purple-600 shadow-xl relative border-2 border-purple-200 overflow-hidden group hover:scale-[1.01] transition-transform">
                            <div className="absolute top-0 right-0 bg-purple-600 text-white px-4 py-1 rounded-bl-xl font-bold text-xs shadow-sm z-20">PRO ONLY</div>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6 relative z-10">
                                <div className="text-7xl bg-purple-100 p-4 rounded-3xl group-hover:-rotate-3 transition-transform">🦁</div>
                                <div className="text-center sm:text-left">
                                    <h3 className="text-2xl font-bold text-purple-900 font-['Fredoka']">Magic Kat</h3>
                                    <div className="text-xs font-bold text-purple-600 uppercase tracking-widest mt-1">Archmage / Pro Tier</div>
                                    <div className="mt-2 text-sm text-purple-800 font-medium italic">
                                        "I am Magic Kat! ✨ I see the hidden potential in your art. I can transform your drawings into cinematic masterpieces with my true voice."
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/60 rounded-xl p-4 relative z-10 border border-purple-100">
                                <ul className="space-y-2 text-sm text-purple-900">
                                    <li className="flex items-center gap-3">
                                        <span className="bg-white p-1 rounded-md shadow-sm text-lg">🧠</span>
                                        <span><strong>Super Brain:</strong> GPT-5.2 (Mentor)</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="bg-white p-1 rounded-md shadow-sm text-lg">🎭</span>
                                        <span><strong>Voice:</strong> Real Emotion (MiniMax)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Subscription Tiers */}
                <section>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-indigo-900 font-['Fredoka']">Select Your Power Level</h2>
                        <p className="text-gray-600 mt-2">Daily login bonuses included with every plan</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">

                        {/* EXPLORER (Free) */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 h-auto flex flex-col relative hover:shadow-md transition-shadow">
                            <h3 className="font-bold text-gray-500 font-['Fredoka'] uppercase tracking-wider text-sm mb-2">🥉 Explorer</h3>
                            <div className="mb-4">
                                <span className="text-4xl font-black text-gray-800">$0</span>
                                <span className="text-gray-400 text-sm font-medium"> / forever</span>
                            </div>

                            <div className="mb-6 bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D] px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                <span>🎁</span> Daily: +10 Pt
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow text-xs text-gray-600 font-medium">
                                <li className="flex gap-2 items-center"><span className="text-green-500 text-lg">●</span> Audio Stories</li>
                                <li className="flex gap-2 items-center"><span className="text-green-500 text-lg">●</span> Magic Puzzle</li>
                                <li className="flex gap-2 items-center"><span className="text-green-500 text-lg">●</span> Basic Art Analysis</li>
                                <li className="flex gap-2 items-center text-gray-400"><span className="text-red-300 text-lg">×</span> Watermarked Art</li>
                                <li className="flex gap-2 items-center text-gray-400"><span className="text-red-300 text-lg">×</span> No Long Video</li>
                            </ul>
                            <button className="w-full bg-gray-100 text-gray-500 font-bold py-3 rounded-xl text-sm cursor-default">Current Plan</button>
                        </div>

                        {/* BASIC */}
                        <div className="bg-white rounded-2xl p-6 shadow-md border-t-4 border-blue-500 h-auto flex flex-col relative hover:shadow-lg transition-shadow">
                            <h3 className="font-bold text-blue-600 font-['Fredoka'] uppercase tracking-wider text-sm mb-2">🥈 Basic</h3>
                            <div className="mb-1">
                                <span className="text-4xl font-black text-gray-800">$9.99</span>
                                <span className="text-gray-400 text-sm font-medium"> / mo</span>
                            </div>
                            <div className="text-xs text-blue-400 font-bold mb-4">1,000 Pt Monthly</div>

                            <div className="mb-6 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                <span>🎁</span> Daily: +30 Pt
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow text-xs text-gray-600 font-medium">
                                <li className="flex gap-2 items-center"><span className="text-blue-500 text-lg">●</span> <strong>No Watermark</strong></li>
                                <li className="flex gap-2 items-center"><span className="text-blue-500 text-lg">●</span> Junior Kat (Robot Voice)</li>
                                <li className="flex gap-2 items-center"><span className="text-blue-500 text-lg">●</span> Priority Queue</li>
                            </ul>
                            <button onClick={() => handleSubscribe('basic')} className="w-full bg-blue-50 text-blue-600 font-bold py-3 rounded-xl text-sm hover:bg-blue-100 transition-colors border border-blue-200">Start Basic</button>
                        </div>

                        {/* PRO (Most Popular) */}
                        <div className="bg-white rounded-2xl p-6 shadow-xl border-t-4 border-purple-600 h-auto flex flex-col relative hover:shadow-2xl transition-shadow transform md:-translate-y-4">
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</div>
                            <h3 className="font-bold text-purple-600 font-['Fredoka'] uppercase tracking-wider text-sm mb-2 mt-2">🥇 Pro</h3>
                            <div className="mb-1">
                                <span className="text-5xl font-black text-gray-800">$19.99</span>
                                <span className="text-gray-400 text-sm font-medium"> / mo</span>
                            </div>
                            <div className="text-xs text-purple-400 font-bold mb-4">2,500 Pt Monthly (Value!)</div>

                            <div className="mb-6 bg-purple-50 text-purple-700 border border-purple-100 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                <span>🎁</span> Daily: +50 Pt
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow text-sm text-gray-700 font-medium">
                                <li className="flex gap-2 items-center"><span className="text-purple-500 text-lg">✦</span> <strong>Magic Kat</strong> (GPT-5.2)</li>
                                <li className="flex gap-2 items-center"><span className="text-purple-500 text-lg">✦</span> <strong>Emotional ID Voice</strong></li>
                                <li className="flex gap-2 items-center"><span className="text-purple-500 text-lg">✦</span> <strong>10s Long Video</strong></li>
                            </ul>
                            <button onClick={() => handleSubscribe('pro')} className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">Get Pro</button>
                        </div>

                        {/* YEARLY (Best Value) */}
                        <div className="bg-gradient-to-b from-yellow-50 to-white rounded-2xl p-6 shadow-lg border-2 border-yellow-400 h-auto flex flex-col relative hover:shadow-xl transition-shadow">
                            <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-xs font-black px-2 py-1 rounded-lg transform rotate-3">SAVE $140</div>
                            <h3 className="font-bold text-yellow-600 font-['Fredoka'] uppercase tracking-wider text-sm mb-2">👑 Yearly VIP</h3>
                            <div className="mb-1">
                                <span className="text-4xl font-black text-gray-800">$99</span>
                                <span className="text-gray-400 text-sm font-medium"> / yr</span>
                            </div>
                            <div className="text-xs text-green-600 font-bold mb-4">Just $8.25 / mo</div>

                            <div className="mb-6 bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                <span>🎁</span> Daily: +50 Pt
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow text-sm text-gray-700 font-medium">
                                <li className="flex gap-2 items-center"><span className="text-yellow-500 text-lg">👑</span> <strong>All Pro Features</strong></li>
                                <li className="flex gap-2 items-center"><span className="text-yellow-500 text-lg">🎁</span> <strong>12,000 Pt Instantly</strong></li>
                                <li className="flex gap-2 items-center"><span className="text-yellow-500 text-lg">📚</span> <strong>20% Off Books</strong></li>
                            </ul>
                            <button onClick={() => handleSubscribe('yearly')} className="w-full bg-yellow-400 text-yellow-900 font-bold py-3 rounded-xl text-sm hover:bg-yellow-500 transition-colors shadow-md">Upgrade Yearly</button>
                        </div>
                    </div>
                </section>

                {/* 3. Cost Menu */}
                <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-indigo-900 mb-4 font-['Fredoka']">3. Magic Cost Menu</h2>
                            <p className="text-gray-600 mb-6 text-sm">
                                Know exactly what your magic spells cost.
                            </p>
                            <div className="bg-gray-50 p-6 rounded-2xl text-sm space-y-3">
                                <div className="flex justify-between font-bold text-gray-400 text-xs uppercase tracking-wide border-b pb-2 mb-2">
                                    <span>Spell / Feature</span><span>Cost</span>
                                </div>
                                <div className="flex justify-between items-center text-red-500 font-bold">
                                    <span>🎬 Magic Cinema (10s)</span>
                                    <span className="bg-red-50 px-2 py-1 rounded">-160 Pt</span>
                                </div>
                                <div className="flex justify-between items-center text-orange-500 font-bold">
                                    <span>🎥 Magic Cinema (5s)</span>
                                    <span className="bg-orange-50 px-2 py-1 rounded">-80 Pt</span>
                                </div>
                                <div className="flex justify-between items-center text-blue-600 font-medium">
                                    <span>📘 Graphic Novel (4pg)</span>
                                    <span className="bg-blue-50 px-2 py-1 rounded">-100 Pt</span>
                                </div>
                                <div className="flex justify-between items-center text-green-600 font-medium">
                                    <span>📖 Storybook (4pg)</span>
                                    <span className="bg-green-50 px-2 py-1 rounded">-30 Pt</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>🖼️ Single Art / Card</span>
                                    <span>-10 Pt</span>
                                </div>
                                <div className="flex justify-between items-center text-purple-600">
                                    <span>🎓 Magic Coach</span>
                                    <span>-5 / Free (Pro)</span>
                                </div>
                                <div className="flex justify-between items-center text-indigo-600 font-bold border-t pt-2 mt-2">
                                    <span>💬 Chat & Puzzle</span>
                                    <span className="bg-indigo-50 px-2 py-1 rounded">FREE</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full relative flex items-center justify-center">
                            <Doughnut data={chartData} options={chartOptions} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center">
                                    <p className="text-gray-400 text-xs uppercase">Points</p>
                                    <p className="text-2xl font-black text-indigo-900">Menu</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Redeem Code Section */}
                <section className="max-w-xl mx-auto mb-12">
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="bg-white/10 p-3 rounded-full mb-3">
                                <Ticket size={24} className="text-yellow-400" />
                            </div>
                            <h2 className="text-xl font-bold font-['Fredoka'] mb-2">Have a Gift Code?</h2>
                            <p className="text-slate-300 text-sm mb-4">Enter your code below to instantly unlock magic points!</p>

                            <div className="flex w-full gap-2">
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="ENTER-CODE-HERE"
                                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-white/30 font-mono font-bold focus:outline-none focus:border-yellow-400 focus:bg-white/20 transition-all uppercase"
                                />
                                <button
                                    onClick={handleRedeem}
                                    disabled={isRedeeming || !promoCode}
                                    className="bg-yellow-400 text-slate-900 px-6 py-2 rounded-xl font-bold hover:bg-yellow-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isRedeeming ? '...' : 'Redeem'}
                                </button>
                            </div>
                        </div>

                        {/* Background Deco */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />
                    </div>
                </section>
            </main>


        </div >
    );
};
