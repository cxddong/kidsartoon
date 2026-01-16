import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { Home, Sparkles, User } from 'lucide-react';

import genBtnVideo from '../assets/genbtn.mp4';
import homeVideo from '../assets/home.mp4';
import profileVideo from '../assets/profile.mp4';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems = [
        {
            path: '/community',
            video: homeVideo,
            icon: Home,
            label: 'Explore',
            color: 'blue'
        },
        {
            path: '/home',
            video: genBtnVideo,
            icon: Sparkles,
            label: 'Home',
            color: 'purple',
            isMain: true
        },
        {
            path: '/profile',
            video: profileVideo,
            icon: User,
            label: 'My Stuff',
            color: 'rose'
        }
    ];

    const isActive = (path: string) => {
        if (path === '/community' && currentPath === '/community') return true;
        if (path === '/home' && (currentPath === '/home' || currentPath === '/')) return true;
        return currentPath.startsWith(path);
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-auto">
            <motion.nav
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/90 backdrop-blur-2xl border border-white/50 rounded-full px-4 py-2 shadow-2xl shadow-purple-500/10 flex items-center gap-2 md:gap-4"
            >
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "relative group flex items-center justify-center transition-all duration-300 rounded-full",
                                item.isMain ? "w-16 h-16 md:w-20 md:h-20 -mt-8" : "w-12 h-12 md:w-14 md:h-14"
                            )}
                        >
                            {/* Background Glow for Active State */}
                            {active && (
                                <motion.div
                                    layoutId="nav-glow"
                                    className={cn(
                                        "absolute inset-0 rounded-full blur-md opacity-60",
                                        item.color === 'blue' && "bg-blue-400",
                                        item.color === 'purple' && "bg-purple-400",
                                        item.color === 'rose' && "bg-rose-400"
                                    )}
                                />
                            )}

                            {/* Icon Container */}
                            <div className={cn(
                                "relative w-full h-full rounded-full overflow-hidden border-2 transition-all shadow-sm",
                                active ? "border-white transform scale-105" : "border-transparent opacity-80 hover:opacity-100 hover:scale-105",
                                item.isMain && "border-4 border-white shadow-lg shadow-purple-500/20"
                            )}>
                                <video
                                    src={item.video}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    disablePictureInPicture
                                />
                                {/* Overlay for accessibility/icon fallback if video fails (optional, but good for polish) */}
                            </div>

                            {/* Label Tooltip (Optional, maybe for desktop) */}
                            <span className="absolute -bottom-6 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white/80 px-2 py-0.5 rounded-full md:block hidden">
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </motion.nav>
        </div>
    );
};
