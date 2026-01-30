
import React from 'react';

interface CompassNavProps {
    onNavigate: (zoneIndex: number) => void;
}

export const CompassNav: React.FC<CompassNavProps> = ({ onNavigate }) => {
    return (
        <div className="relative w-72 h-36">
            {/* Compass Image Container */}
            <div className="absolute inset-0 flex items-end justify-center">
                {/* Background Compass Image */}
                <img
                    src="/assets/magic_compass.png"
                    className="w-full h-full object-contain drop-shadow-2xl"
                    alt="Magic Compass"
                />

                {/* Interactive Buttons (Invisible Hit Areas Overlaying Gems) */}

                {/* Left Button (Red Gem) - Zone 0 (Art Class) */}
                <button
                    onClick={() => onNavigate(0)}
                    className="absolute left-[15%] bottom-[35%] w-12 h-12 rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    title="West: Creation Garden"
                />

                {/* Center Button (Blue Gem) - Zone 1 (Forest) */}
                <button
                    onClick={() => onNavigate(1)}
                    className="absolute left-1/2 -translate-x-1/2 top-[15%] w-14 h-14 rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    title="Center: Insight Forest"
                />

                {/* Right Button (Green Gem) - Zone 2 (City) */}
                <button
                    onClick={() => onNavigate(2)}
                    className="absolute right-[15%] bottom-[35%] w-12 h-12 rounded-full hover:bg-white/20 active:scale-95 transition-all"
                    title="East: Story City"
                />
            </div>
        </div>
    );
};
