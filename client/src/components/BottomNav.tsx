import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

import profileIcon from '../assets/profile_icon_new.jpg';

export const BottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const isActive = (path: string) => currentPath === path;

    return (
        <nav className="fixed bottom-4 right-4 bg-white/50 backdrop-blur-lg border border-slate-200/60 py-2 px-4 rounded-full flex justify-center gap-4 items-center z-50 shadow-2xl h-14">
            <button
                onClick={() => navigate('/home')}
                className="transition-transform duration-300 hover:scale-110 relative -top-0.5"
            >
                <img
                    src="/nav_home_final.png?v=1"
                    alt="Home"
                    className={cn(
                        "w-12 h-12 object-contain drop-shadow-md",
                        isActive('/home') ? "scale-110" : "opacity-80 hover:opacity-100"
                    )}
                />
            </button>

            {/* Main Action Button */}
            <div className="relative -top-6">
                <button
                    onClick={() => navigate('/generate')}
                    className="transition-transform duration-300 hover:scale-110 hover:rotate-3"
                >
                    <img
                        src="/nav_generate_final.png?v=1"
                        alt="Generate"
                        className={cn(
                            "w-16 h-16 object-contain drop-shadow-xl",
                            isActive('/generate') || currentPath.startsWith('/generate') ? "scale-110" : ""
                        )}
                    />
                </button>
            </div>

            <button
                onClick={() => navigate('/profile')}
                className="transition-transform duration-300 hover:scale-110 relative -top-0.5"
            >
                <img
                    src={profileIcon}
                    alt="Profile"
                    className={cn(
                        "w-12 h-12 object-contain drop-shadow-md rounded-full",
                        isActive('/profile') ? "scale-110 ring-2 ring-primary ring-offset-2" : "opacity-80 hover:opacity-100"
                    )}
                />
            </button>
        </nav>
    );
};


