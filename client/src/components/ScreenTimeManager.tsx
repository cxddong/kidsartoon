import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Eye, Play, Pause, SkipForward, Music } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ScreenTimeContextType {
    isSleepMode: boolean;
    sessionDuration: number; // in seconds
    resetSession: () => void;
}

const ScreenTimeContext = createContext<ScreenTimeContextType>({
    isSleepMode: false,
    sessionDuration: 0,
    resetSession: () => { }
});

export const useScreenTime = () => useContext(ScreenTimeContext);

export const ScreenTimeManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, activeProfile } = useAuth();
    const [isSleepMode, setIsSleepMode] = useState(false);
    const [showEyeCare, setShowEyeCare] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);
    const location = useLocation();

    // Story Playback State
    const [story, setStory] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Constants
    const EYE_CARE_THRESHOLD_SECONDS = 45 * 60; // 45 minutes
    const SLEEP_START_HOUR = 21; // 9 PM
    const SLEEP_END_HOUR = 7;    // 7 AM

    useEffect(() => {
        // Sleep Mode Check (Every Minute)
        const checkSleepMode = () => {
            // BYPASS: Admin or Parent Mode (No active child)
            if (user?.plan === 'admin' || !activeProfile) {
                setIsSleepMode(false);
                return;
            }

            const hour = new Date().getHours();
            const isNight = hour >= SLEEP_START_HOUR || hour < SLEEP_END_HOUR;
            setIsSleepMode(isNight);
        };

        checkSleepMode();
        const sleepInterval = setInterval(checkSleepMode, 60000);

        return () => clearInterval(sleepInterval);
    }, [user, activeProfile]);

    useEffect(() => {
        // Eye Care Timer (Every Second)
        if (isSleepMode) return; // Don't count if sleeping

        const timer = setInterval(() => {
            setSessionDuration(prev => {
                const next = prev + 1;
                if (next === EYE_CARE_THRESHOLD_SECONDS) {
                    setShowEyeCare(true);
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isSleepMode]);

    // Fetch Story when Eye Care shows
    useEffect(() => {
        if (showEyeCare && !story) {
            fetchStory();
        }
    }, [showEyeCare]);

    const fetchStory = async () => {
        try {
            const res = await fetch('/api/media/random-story');
            if (res.ok) {
                const data = await res.json();
                setStory(data);
                // Auto-play might be blocked, but we try
            }
        } catch (e) {
            console.error("Failed to fetch rest story", e);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const resetSession = () => {
        setSessionDuration(0);
        setShowEyeCare(false);
        // Stop Audio
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    return (
        <ScreenTimeContext.Provider value={{ isSleepMode, sessionDuration, resetSession }}>
            {children}

            {/* SLEEP MODE OVERLAY */}
            <AnimatePresence>
                {isSleepMode && !location.pathname.startsWith('/parent') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-slate-900/95 flex flex-col items-center justify-center text-white"
                    >
                        <div className="relative">
                            <Moon size={80} className="text-yellow-300 animate-pulse mb-6" />
                            {/* Animated Zzz */}
                            <motion.div
                                animate={{ y: [0, -20, -40], x: [0, 10, -10], opacity: [0, 1, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute top-0 right-0 text-2xl font-bold text-white"
                            >Zzz</motion.div>
                        </div>
                        <h2 className="text-4xl font-black mb-4">Shhh... Magic Kat is Sleeping.</h2>
                        <p className="text-xl text-slate-300 max-w-md text-center mb-8">
                            It's past 9:00 PM. Time for little artists to dream!
                            Come back tomorrow after 7:00 AM.
                        </p>
                        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
                            <p className="font-bold text-center">App is in Sleep Mode</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EYE CARE OVERLAY */}
            <AnimatePresence>
                {showEyeCare && !isSleepMode && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border-4 border-white/20 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4 text-pink-300 animate-pulse">
                                    <Eye size={40} />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2">My Magic Eyes are Tired!</h2>
                                <p className="text-pink-200 mb-6 font-medium">
                                    Let's rest for 5 minutes and listen to a story from the Magic Kingdom.
                                </p>

                                {/* Story Player */}
                                {story ? (
                                    <div className="w-full bg-black/30 rounded-2xl p-4 border border-white/10 mb-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 border border-white/10">
                                                <img src={story.imageUrl} alt="Story Art" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <h3 className="font-bold text-white text-lg truncate">{story.title}</h3>
                                                <p className="text-white/50 text-xs">Citizen Story</p>
                                            </div>
                                        </div>

                                        <audio
                                            ref={audioRef}
                                            src={story.audioUrl}
                                            onEnded={() => setIsPlaying(false)}
                                            className="hidden"
                                        />

                                        <div className="flex gap-3">
                                            <button
                                                onClick={togglePlay}
                                                className="flex-1 py-3 bg-white text-indigo-900 rounded-xl font-black text-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg"
                                            >
                                                {isPlaying ? (
                                                    <><Pause className="w-5 h-5 fill-current" /> Pause Story</>
                                                ) : (
                                                    <><Play className="w-5 h-5 fill-current" /> Play Story</>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setIsPlaying(false);
                                                    if (audioRef.current) audioRef.current.pause();
                                                    fetchStory(); // Load next story
                                                }}
                                                className="aspect-square bg-white/10 text-white rounded-xl font-bold flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"
                                                title="Next Story"
                                            >
                                                <SkipForward className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-32 bg-white/5 rounded-2xl mb-6 flex items-center justify-center text-white/30 animate-pulse">
                                        <Music className="w-8 h-8" />
                                    </div>
                                )}

                                <button
                                    onClick={resetSession}
                                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                                >
                                    Okay, I rested!
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ScreenTimeContext.Provider>
    );
};
