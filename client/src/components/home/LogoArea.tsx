import React from 'react';

export const LogoArea: React.FC = () => {
    return (
        <div className="w-full flex justify-center pt-8 pb-4 relative z-10 pointer-events-none">
            {/* Placeholder Container for Logo */}
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-white/40 blur-3xl rounded-full scale-150" />

                {/* Actual Logo Image */}
                <img
                    src="/new_logo.png"
                    alt="KidsArToon"
                    className="h-20 md:h-24 object-contain relative z-10 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                        // Fallback if logo.png missing
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                />

                {/* Fallback Text Logo */}
                <div className="hidden h-24 md:h-32 flex items-center justify-center bg-white/20 backdrop-blur-md px-8 rounded-full border-4 border-white/50 shadow-xl">
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                        <span className="text-yellow-300">Kids</span>
                        <span className="text-pink-400">Ar</span>
                        <span className="text-blue-400">Toon</span>
                    </h1>
                </div>
            </div>
        </div>
    );
};
