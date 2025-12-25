import React, { useEffect, useState } from 'react';
import './Fireworks.css';

export const MagicFireworks = ({ isVisible, onComplete }: { isVisible: boolean; onComplete: () => void }) => {
    if (!isVisible) return null;

    useEffect(() => {
        const timer = setTimeout(onComplete, 3000); // 3 seconds
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div> {/* Flash effect base */}
            <div className="firework"></div>
            <div className="firework"></div>
            <div className="firework"></div>
            <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(255,0,255,0.8)] animate-bounce z-10 text-center">
                Energy Full! ✨<br />
                <span className="text-2xl md:text-3xl text-yellow-300">Let's Go!</span>
            </h1>
        </div>
    );
};
