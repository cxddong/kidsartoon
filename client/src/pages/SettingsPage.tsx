import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Globe, CreditCard, Info, LogOut, Star, X, History, ScrollText, Gift } from 'lucide-react';
import { usePointAnimation } from '../context/PointAnimationContext';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Interests List (Ideally shared)
const INTERESTS_LIST = [
    { id: 'robots', label: '🤖 Robots' },
    { id: 'animals', label: '🦊 Animals' },
    { id: 'space', label: '🚀 Space' },
    { id: 'princess', label: '👑 Princess' },
    { id: 'dinosaurs', label: '🦖 Dinosaurs' },
    { id: 'superheroes', label: '🦸 Superheroes' },
    { id: 'cars', label: '🏎️ Cars' },
    { id: 'magic', label: '✨ Magic' },
];

const SettingsPage: React.FC = () => {
    const { logout, user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [language, setLanguage] = useState('English');
    const [showInterests, setShowInterests] = useState(false);
    const [tempInterests, setTempInterests] = useState<string[]>([]);

    // Parent Center State
    const [showHistory, setShowHistory] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    // Redeem State
    const [showRedeem, setShowRedeem] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [redeemStatus, setRedeemStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [redeemMsg, setRedeemMsg] = useState('');
    const { triggerPointAnimation } = usePointAnimation();

    // Protection check
    useEffect(() => {
        if (!user) navigate('/login');
        else {
            if (user.language) setLanguage(user.language);
            if (user.interests) setTempInterests(user.interests);
        }
    }, [user, navigate]);

    // Fetch Logs
    useEffect(() => {
        if (showHistory && user) {
            fetch(`/api/points/logs?userId=${user.uid}`)
                .then(r => r.json())
                .then(d => setLogs(d.logs || []))
                .catch(console.error);
        }
    }, [showHistory, user]);


    const handleRedeem = async () => {
        if (!promoCode.trim()) return;

        setRedeemStatus('loading');
        setRedeemMsg('');

        try {
            const res = await fetch('/api/points/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.uid, code: promoCode })
            });
            const data = await res.json();

            if (data.success) {
                setRedeemStatus('success');
                setRedeemMsg(`Success! You got ${data.pointsAdded} points! 🎉`);
                triggerPointAnimation(data.pointsAdded, window.innerWidth / 2, window.innerHeight / 2);
                setTimeout(() => {
                    setShowRedeem(false);
                    setPromoCode('');
                    setRedeemStatus('idle');
                }, 2000);
            } else {
                setRedeemStatus('error');
                let msg = 'Invalid Code';
                if (data.error === 'ALREADY_REDEEMED') msg = 'You already used this code!';
                if (data.error === 'CODE_EXPIRED') msg = 'This code has expired.';
                if (data.error === 'CODE_FULLY_REDEEMED') msg = 'This code is fully claimed.';
                setRedeemMsg(msg);
            }
        } catch (e) {
            setRedeemStatus('error');
            setRedeemMsg('Connection failed');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const saveInterests = async () => {
        if (user) {
            await updateProfile({ interests: tempInterests });
            setShowInterests(false);
        }
    };

    const toggleInterest = (id: string) => {
        setTempInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="h-screen overflow-y-auto bg-[#F0F4F8] flex flex-col items-center pt-8 pb-20">
            <div className="w-full max-w-md px-6">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-full shadow-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-black text-slate-800">Settings</h1>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
                    <div className="p-2 space-y-2">
                        {/* Language Selector */}
                        <div className="w-full flex flex-col gap-3 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group relative bg-purple-50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                    <Globe className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-700 text-lg">Language</h3>
                                </div>
                            </div>
                            <div className="flex gap-2 pl-16 flex-wrap">
                                {['English', 'Spanish', 'French', 'Japanese'].map(lang => (
                                    <button
                                        key={lang}
                                        onClick={() => {
                                            setLanguage(lang);
                                            if (user) updateProfile({ language: lang });
                                        }}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${language === lang ? 'bg-purple-500 text-white shadow-md scale-105 ring-2 ring-purple-200' : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-200'}`}
                                    >
                                        {lang}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Edit Profile */}
                        <button
                            onClick={() => navigate('/edit-profile')}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group"
                        >
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <User className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-700 text-lg">Edit Profile</h3>
                                <p className="text-slate-400 text-sm">Change Name & Avatar</p>
                            </div>
                        </button>

                        {/* Interests Config */}
                        <button
                            onClick={() => setShowInterests(true)}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group"
                        >
                            <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                                <Star className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-700 text-lg">Interests</h3>
                                <p className="text-slate-400 text-sm">
                                    {user?.interests?.length ? `${user.interests.length} topics selected` : 'Choose your likes'}
                                </p>
                            </div>
                        </button>



                        {/* Subscription */}
                        <button onClick={() => navigate('/subscription')} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group">
                            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-700 text-lg">Subscription</h3>
                                <p className="text-slate-400 text-sm">Free Member</p>
                            </div>
                        </button>

                        {/* Redeem Code */}
                        <button
                            onClick={() => setShowRedeem(true)}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group"
                        >
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                <Gift className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-700 text-lg">Redeem Code</h3>
                                <p className="text-slate-400 text-sm">Got a gift code?</p>
                            </div>
                        </button>

                        {/* About */}
                        <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                <Info className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-700 text-lg">About App</h3>
                                <p className="text-slate-400 text-sm">Version 1.0.0</p>
                            </div>
                        </button>

                        <div className="h-px bg-slate-100 mx-6 my-2" />

                        <div className="p-4 pb-6">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 font-black text-lg transition-colors"
                            >
                                <LogOut className="w-6 h-6" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Interest Edit Modal */}
                <AnimatePresence>
                    {showInterests && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative"
                            >
                                <button onClick={() => setShowInterests(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                                    <X className="w-5 h-5" />
                                </button>

                                <h2 className="text-2xl font-black text-slate-800 mb-2">Edit Interests</h2>
                                <p className="text-slate-400 text-sm mb-6">What do you love?</p>

                                <div className="grid grid-cols-2 gap-3 mb-8 max-h-[300px] overflow-y-auto">
                                    {INTERESTS_LIST.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleInterest(item.id)}
                                            className={`p-3 rounded-xl font-bold text-sm border-2 transition-all ${tempInterests.includes(item.id)
                                                ? 'bg-pink-50 border-pink-400 text-pink-600'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>

                                <button onClick={saveInterests} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200">
                                    Save Changes
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Parent Center Modal */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl relative h-[80vh] flex flex-col"
                            >
                                <button onClick={() => setShowHistory(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                                    <X className="w-5 h-5" />
                                </button>

                                <h2 className="text-2xl font-black text-slate-800 mb-1">History</h2>
                                <p className="text-slate-400 text-sm mb-4">Your creative journey</p>

                                <div className="bg-slate-50 rounded-2xl p-4 mb-4 flex justify-between items-center">
                                    <span className="text-slate-600 font-bold">Points Balance</span>
                                    <span className="text-2xl font-black text-purple-600">{user?.points || 0}</span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-3">
                                    {logs.length === 0 ? (
                                        <div className="text-center text-slate-400 py-10">No history yet</div>
                                    ) : (
                                        logs.map(log => (
                                            <div key={log.logId} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                <div>
                                                    <div className="font-bold text-slate-700 text-sm capitalize">
                                                        {log.action.replace(/_/g, ' ').replace('generation', '').trim() || 'Activity'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        {new Date(log.createdAt).toLocaleDateString()} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <div className={`font-black text-sm ${log.pointsChange > 0 ? 'text-green-500' : 'text-slate-400'}`}>
                                                    {log.pointsChange > 0 ? '+' : ''}{log.pointsChange} pts
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Redeem Modal */}
                <AnimatePresence>
                    {showRedeem && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative text-center"
                            >
                                <button onClick={() => setShowRedeem(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Gift className="w-8 h-8" />
                                </div>

                                <h2 className="text-2xl font-black text-slate-800 mb-2">Redeem Code</h2>
                                <p className="text-slate-400 text-sm mb-6">Enter your code to get free gems!</p>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        placeholder="ENTER CODE HERE"
                                        className="w-full text-center text-2xl font-black tracking-widest p-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none uppercase placeholder:text-slate-300"
                                    />

                                    {redeemStatus === 'error' && (
                                        <p className="text-red-500 font-bold text-sm animate-shake">{redeemMsg}</p>
                                    )}
                                    {redeemStatus === 'success' && (
                                        <p className="text-green-500 font-bold text-sm animate-bounce">{redeemMsg}</p>
                                    )}

                                    <button
                                        onClick={handleRedeem}
                                        disabled={redeemStatus === 'loading' || redeemStatus === 'success' || !promoCode}
                                        className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-pink-200 disabled:opacity-50 hover:scale-105 transition-transform"
                                    >
                                        {redeemStatus === 'loading' ? 'Checking...' : 'Claim Reward 🎁'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SettingsPage;
