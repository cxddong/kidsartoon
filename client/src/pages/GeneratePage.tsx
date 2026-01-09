import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { jellyPopVariants, jellyPopContainer } from '../lib/animations';
import { BottomNav } from '../components/BottomNav';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

// Assets
import audioVideo from '../assets/mic3.mp4';
import genBtnVideo from '../assets/startmagic.mp4';
import cartoonVideo from '../assets/cartoon.mp4';
import comicVideo from '../assets/comic.mp4';
import greetingCardVideo from '../assets/greeting_card1.mp4';
import mentorVideo from '../assets/mentor journey.mp4';
import bookVideo from '../assets/book.mp4';
import graphicNovelVideo from '../assets/graphicnovel.mp4';
import homepageBg from '../assets/homepage.mp4';

export const GeneratePage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Debug Panel State
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [generating, setGenerating] = useState(false);
    const isAdmin = user?.email === 'cxddongdong@gmail.com' || user?.plan === 'admin';

    const handleGenerateInviteCode = async () => {
        setGenerating(true);
        try {
            const code = `KAT${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            setGeneratedCode(code);
            alert(`✅ Generated Code: ${code}\n\nThis code can be used for free access!`);
        } catch (err) {
            alert('Failed to generate code');
        } finally {
            setGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const handleNavigation = (path: string, state?: any) => {
        navigate(path, { state });
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-[#F0F4F8] flex flex-col">
            {/* Admin Debug Panel */}
            {isAdmin && (
                <div className="fixed top-4 right-4 z-50">
                    {!showDebugPanel ? (
                        <button onClick={() => setShowDebugPanel(true)} className="px-4 py-2 bg-red-500 text-white rounded-full shadow-lg font-bold text-xs hover:bg-red-600 animate-pulse">🔧 DEBUG</button>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl p-6 w-80 border-4 border-red-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-red-500">🔧 ADMIN DEBUG</h3>
                                <button onClick={() => setShowDebugPanel(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="p-4 bg-yellow-50 rounded-xl border-2 border-yellow-400">
                                    <div className="font-bold text-yellow-900 mb-2">🎁 Free Invite Code</div>
                                    <button onClick={handleGenerateInviteCode} disabled={generating} className="w-full py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50">
                                        {generating ? 'Generating...' : '➕ Generate Code'}
                                    </button>
                                    {generatedCode && (
                                        <div className="mt-3 p-3 bg-white rounded-lg border-2 border-yellow-300">
                                            <div className="text-xs text-gray-600 mb-1">Generated Code:</div>
                                            <div className="flex items-center justify-between">
                                                <code className="font-mono font-bold text-yellow-900">{generatedCode}</code>
                                                <button onClick={() => copyToClipboard(generatedCode)} className="px-2 py-1 bg-yellow-400 text-white text-xs rounded hover:bg-yellow-500">Copy</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-400">
                                    <div className="font-bold text-blue-900 mb-2">👤 User Info</div>
                                    <div className="text-xs space-y-1">
                                        <div><span className="text-gray-600">Email:</span> <code className="text-blue-900">{user?.email}</code></div>
                                        <div><span className="text-gray-600">Points:</span> <code className="text-blue-900">{user?.points || 0}</code></div>
                                        <div><span className="text-gray-600">Plan:</span> <code className="text-blue-900">{user?.plan || 'free'}</code></div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <video
                    src={homepageBg}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-100"
                />
            </div>

            {/* Main Content */}
            <motion.div
                className="flex-1 relative w-full h-full flex flex-col items-center justify-center gap-4 md:gap-12 pb-20 z-10"
                variants={jellyPopContainer}
                initial="initial"
                animate="animate"
            >
                {/* Row 1: Audio - Start Magic - Animation */}
                <div className="flex items-center gap-4 md:gap-16 justify-center max-w-5xl mx-auto mb-6 px-4">
                    {/* Audio (Circle - Left) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/audio')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-secondary flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-110 group-active:scale-95">
                            <video src={audioVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.35]" />
                        </div>
                        <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">AUDIO</span>
                    </motion.button>

                    {/* START MAGIC (Rectangle - Center) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/magic-lab')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-48 h-24 md:w-80 md:h-40 rounded-3xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex flex-col items-center justify-center shadow-2xl border-4 border-white/40 overflow-hidden transform transition-all group-hover:scale-105 group-active:scale-95 hover:shadow-purple-500/50">
                            <video src={genBtnVideo} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110" />
                            <div className="relative z-10 flex flex-col items-center leading-none">
                                <span className="text-2xl md:text-4xl font-black text-white drop-shadow-lg tracking-widest">START</span>
                                <span className="text-2xl md:text-4xl font-black text-white drop-shadow-lg tracking-widest text-yellow-200">MAGIC</span>
                            </div>
                        </div>
                    </motion.button>

                    {/* Animation (Circle - Right) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/video')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-primary flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-110 group-active:scale-95">
                            <video src={cartoonVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[2.0]" />
                        </div>
                        <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">ANIMATION</span>
                    </motion.button>
                </div>

                {/* Row 2: Comic - Greeting - Mentor - Picture Book - Graphic Novel */}
                <div className="flex items-center gap-4 md:gap-8 flex-wrap justify-center px-2 max-w-6xl mx-auto">
                    {/* Comic (Circle - Left) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/comic', { mode: 'comic' })}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-accent-purple flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-110 group-active:scale-95">
                            <video src={comicVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.1]" />
                        </div>
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">COMIC</span>
                        </div>
                    </motion.button>

                    {/* Greeting Card (Rectangle - Center Left) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/greeting-card')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-28 h-28 md:w-40 md:h-36 rounded-3xl bg-pink-500 flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-105 group-active:scale-95">
                            <video src={greetingCardVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.3]" />
                        </div>
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">GREETING</span>
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">CARD</span>
                        </div>
                    </motion.button>

                    {/* Mentor Journey (Rectangle - Center Right) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/creative-journey')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-28 h-28 md:w-40 md:h-36 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-105 group-active:scale-95">
                            <video src={mentorVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.3]" />
                        </div>
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">MENTOR</span>
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">JOURNEY</span>
                        </div>
                    </motion.button>

                    {/* Picture Book (Circle - Right) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/generate/picture', { mode: 'book' })}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-accent-purple flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-105 group-active:scale-95">
                            <video src={bookVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.6]" />
                        </div>
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">PICTURE</span>
                            <span className="text-sm md:text-xl font-black text-slate-700 drop-shadow-sm tracking-wider">BOOK</span>
                        </div>
                    </motion.button>

                    {/* Graphic Novel (NEW) */}
                    <motion.button
                        variants={jellyPopVariants}
                        onClick={() => handleNavigation('/graphic-novel/builder')}
                        className="flex flex-col items-center gap-2 md:gap-3 group relative"
                    >
                        <div className="w-28 h-28 md:w-40 md:h-36 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg border-4 border-white/30 overflow-hidden transform transition-all group-hover:scale-105 group-active:scale-95">
                            <video src={graphicNovelVideo} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-90 scale-[1.3]" />
                        </div>
                        <div className="flex flex-col items-center leading-tight">
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">GRAPHIC</span>
                            <span className="text-xs md:text-lg font-black text-slate-700 drop-shadow-sm tracking-wider">NOVEL</span>
                        </div>
                    </motion.button>
                </div>

                {/* Debug Tools removed for cleanliness, but can be added back if needed */}

            </motion.div>

            <BottomNav />
        </div>
    );
};
