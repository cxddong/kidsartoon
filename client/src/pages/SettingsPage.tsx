import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, User, Globe, CreditCard, Info, LogOut, Star, X } from 'lucide-react';
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

    // Protection check
    useEffect(() => {
        if (!user) navigate('/login');
        else {
            if (user.language) setLanguage(user.language);
            if (user.interests) setTempInterests(user.interests);
        }
    }, [user, navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleLanguageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        if (user) {
            await updateProfile({ language: newLang });
        }
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
        <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center pt-8">
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

                        {/* Language Selector */}
                        <div className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group relative">
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-700 text-lg">Language</h3>
                                <p className="text-slate-400 text-sm">{language}</p>
                            </div>
                            {/* Hidden Select Overlay */}
                            <select
                                value={language}
                                onChange={handleLanguageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            >
                                <option value="English">English</option>
                                <option value="French">French</option>
                                <option value="Spanish">Spanish</option>
                            </select>
                        </div>

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
                    </div>

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
        </div>
    );
};

export default SettingsPage;
