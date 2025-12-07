import React from 'react';
import { Check, Crown, Star, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 p-4 pb-24">
            <header className="flex items-center justify-between mb-8">
                <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
                    <X className="w-6 h-6 text-slate-600" />
                </button>
                <h1 className="text-xl font-bold text-slate-800">Membership</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4 text-yellow-600">
                    <Crown className="w-10 h-10 fill-current" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Unlock Magic Powers!</h2>
                <p className="text-slate-500 text-sm">Create more stories and animations every day.</p>
            </div>

            <div className="space-y-6 max-w-md mx-auto">
                {/* Free Tier */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-700">Free Explorer</h3>
                        <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">Current</span>
                    </div>
                    <ul className="space-y-3 text-sm text-slate-600 mb-6">
                        <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> 1 Audio Story / day</li>
                        <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> 1 Comic Book / day</li>
                        <li className="flex items-center gap-3"><Check className="w-5 h-5 text-green-500" /> 1 Animation / day</li>
                        <li className="flex items-center gap-3 text-slate-400"><X className="w-5 h-5" /> Watermark on videos</li>
                    </ul>
                </div>

                {/* Gold Tier */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl transform hover:scale-105 transition-transform">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/20 rounded-bl-full" />

                    <div className="flex justify-between items-center mb-4 relative z-10">
                        <h3 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                            <Crown className="w-6 h-6 fill-current" /> Gold Member
                        </h3>
                        <span className="text-2xl font-bold">$9.99<span className="text-sm font-normal text-slate-400">/mo</span></span>
                    </div>

                    <ul className="space-y-3 text-sm text-slate-300 mb-8 relative z-10">
                        <li className="flex items-center gap-3"><Star className="w-5 h-5 text-yellow-400 fill-current" /> Remove Watermarks</li>
                        <li className="flex items-center gap-3"><Check className="w-5 h-5 text-yellow-400" /> 5 Animations / day</li>
                        <li className="flex items-center gap-3"><Check className="w-5 h-5 text-yellow-400" /> Priority Generation</li>
                        <li className="flex items-center gap-3"><Check className="w-5 h-5 text-yellow-400" /> Exclusive Styles</li>
                    </ul>

                    <button className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl font-bold text-white shadow-lg hover:brightness-110 transition-all relative z-10">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    );
};
