import React from 'react';
import homepageBg from '../assets/homepage.mp4';
// import mobileBg from '../assets/mobile_bg.mp4'; // Placeholder if not exists, using homepageBg for now

export const AdaptiveBackground: React.FC = () => {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden">
            {/* --- Mobile Background (Vertical) --- */}
            <div className="block md:hidden w-full h-full relative">
                <video
                    src={homepageBg} // Fallback to homepageBg, ideally should be a vertical crop or separate file
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
                <div className="absolute inset-0 bg-black/20" /> {/* Slightly darker on mobile for readability */}
            </div>

            {/* --- Desktop Background (Horizontal) --- */}
            <div className="hidden md:block w-full h-full relative">
                <video
                    src={homepageBg}
                    className="absolute inset-0 w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />
            </div>
        </div>
    );
};
