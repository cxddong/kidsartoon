import React, { useState } from 'react';
import { Smile, Moon, Sun, Music, Box, Clapperboard, FlaskConical, Sparkles, Wand2, Star, Zap, Cloud, Camera, PenTool, Footprints, Rocket, Gift, Hand, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { BouncyButton } from '../ui/BouncyButton';
import { cn } from '../../lib/utils';

// --- Configuration ---
export const VIDEO_MOODS = [
    { id: 'happy', label: 'Sunny Day', icon: Sun, color: '#FFD700', image: '/assets/mood_icons/mood_sun.jpg', promptText: 'Happy, bright, sunny, cheerful' },
    { id: 'adventurous', label: 'Brave Heart', icon: Rocket, color: '#FF4500', image: '/assets/mood_icons/mood_racing.jpg', promptText: 'Adventurous, brave, racing, action' },
    { id: 'calm', label: 'Sweet Dream', icon: Moon, color: '#87CEEB', image: '/assets/mood_icons/mood_teddy.jpg', promptText: 'Calm, sleepy, starry night, cozy' },
    { id: 'mysterious', label: 'Magic Mystery', icon: Sparkles, color: '#9370DB', image: '/assets/mood_icons/mood_magic.jpg', promptText: 'Mysterious, magical, glowing, enchanted' },
    { id: 'silly', label: 'Funny Party', icon: Gift, color: '#FF69B4', image: '/assets/mood_icons/mood_party.jpg', promptText: 'Funny, silly party, goofy, playful' },
    { id: 'spooky', label: 'Spooky Fun', icon: Hand, color: '#4B2C20', image: '/assets/mood_icons/mood_forest.jpg', promptText: 'Spooky but safe, mysterious woods, dark but fun' },
];

// Custom Helper Chips
export const PROMPT_HELPERS = [
    "Zoom In",
    "Zoom Out",
    "Pan Left",
    "Slow Motion"
];

export const RENDER_STYLES = [
    { id: '3d', label: '3D Movie', icon: Clapperboard, value: 'cinematic' },
    { id: 'blocks', label: 'Blocks', icon: Box, value: 'pixel_art' },
    { id: 'clay', label: 'Clay', icon: Footprints, value: 'claymation' },
    { id: 'crayon', label: 'Drawing', icon: PenTool, value: 'crayon' },
];

export const MAGIC_POTIONS = [
    {
        id: 'standard',
        label: 'Magic Video',
        subLabel: '5 Seconds',
        icon: Sparkles,
        cost: 80,
        quality: 'SD',
        duration: 5
    },

];

export interface AnimationBuilderData {
    mood: string;
    animStyle: string;
    renderStyle: string;
    addAudio: boolean;
    quality: 'SD' | 'HD';
    duration: number;
    prompt?: string;
    cameraFixed?: boolean;
}

interface Props {
    onGenerate: (data: AnimationBuilderData) => void;
    imageUploaded: boolean;
    isGenerating?: boolean;
    progress?: number;
    statusMessage?: string;
}

export const AnimationBuilderPanel: React.FC<Props> = ({ onGenerate, imageUploaded, isGenerating = false, progress = 0, statusMessage = '' }) => {
    const [mood, setMood] = useState(VIDEO_MOODS[0].id);
    const [renderStyle, setRenderStyle] = useState(RENDER_STYLES[0].id);
    // Removed legacy animStyle state, relying on prompt chips only
    const [addAudio, setAddAudio] = useState(true);
    const [quality, setQuality] = useState<'SD' | 'HD'>('SD');
    const [duration, setDuration] = useState<number>(5); // Default 5s
    const [customPrompt, setCustomPrompt] = useState('');
    const [cameraFixed, setCameraFixed] = useState(false);

    // Helpers
    const appendPrompt = (text: string) => {
        setCustomPrompt(prev => {
            const clean = prev.trim();
            if (clean.endsWith(',') || clean.endsWith('.')) return `${clean} ${text}`;
            if (clean.length > 0) return `${clean}, ${text}`;
            return text;
        });
    };

    const isReady = imageUploaded;

    // Calculate Price
    const cost = 80; // Fixed Cost for Doubao V2

    return (
        <div className="w-full flex flex-col">
            <div className="p-4 space-y-6 pb-32">

                {/* Section A: Prompt Input (Core) */}
                <section className="space-y-3">
                    <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-purple-500" />
                        Make it Move!
                    </h3>


                    <div className="bg-purple-50 p-3 rounded-2xl border-2 border-purple-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
                            <Camera className="w-4 h-4 text-purple-500" /> Magic Camera
                        </span>
                        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-purple-100">
                            <button
                                onClick={() => setCameraFixed(false)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    !cameraFixed ? "bg-purple-500 text-white shadow-md" : "text-slate-400 hover:bg-slate-50"
                                )}
                            >
                                🎬 Movie Mode
                            </button>
                            <button
                                onClick={() => setCameraFixed(true)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    cameraFixed ? "bg-purple-500 text-white shadow-md" : "text-slate-400 hover:bg-slate-50"
                                )}
                            >
                                🖼️ Frame Mode
                            </button>
                        </div>
                    </div>

                    <div className="relative">
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Tell me what you want to do? e.g. Bird flying, river flowing..."
                            className="w-full h-32 p-4 rounded-2xl border-2 border-slate-200 bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-100 transition-all outline-none resize-none text-slate-700 font-medium text-sm shadow-inner"
                        />
                        <div className="absolute right-3 bottom-3 text-[10px] text-slate-400 font-bold bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
                            {customPrompt.length} chars
                        </div>
                    </div>

                    {/* Helper Chips */}
                    {/* Default Chips - Updated to requested values */}
                    <div className="flex flex-wrap gap-2 mt-2">
                        {["Zoom In", "Zoom Out", "Pan Left", "Slow Motion"].map(item => (
                            <button
                                key={item}
                                onClick={() => setCustomPrompt(prev => (prev.trim() + ' ' + item).trim())}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-full font-bold transition-colors border border-slate-200"
                            >
                                + {item}
                            </button>
                        ))}
                    </div>
                </section>

                <div className="h-px bg-slate-100 w-full" />

                {/* Section B: Atmosphere & Style (Simplified) */}
                {/* Section B: Atmosphere & Style (REMOVED for Kid-Friendly UI) */}
                {/* 
                <section className="space-y-4">
                   ... (Hidden to match strict requirements)
                </section> 
                */}

                {/* Generate Button or Progress */}
                <div className="pt-2 sticky bottom-4 z-10">
                    {isGenerating ? (
                        <div className="w-full bg-white/90 backdrop-blur-md p-6 rounded-3xl border-2 border-purple-100 shadow-2xl flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-3 mb-3 w-full">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                                <span className="text-sm font-bold text-slate-600 flex-1">{statusMessage || "AI is casting magic..."}</span>
                                <span className="text-sm font-black text-purple-600">{Math.round(progress || 0)}%</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                                    style={{ width: `${Math.round(progress || 0)}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">Please wait while we render your video...</p>
                        </div>
                    ) : (
                        <button
                            onClick={() => onGenerate({ mood, animStyle: 'custom', renderStyle, addAudio, quality, duration, prompt: customPrompt, cameraFixed })}
                            disabled={!isReady}
                            className="w-full py-4 rounded-3xl text-white font-black text-xl tracking-wide shadow-xl shadow-purple-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 flex items-center justify-center gap-3 group"
                        >
                            <span className="group-hover:animate-pulse">🪄 Generate Video</span>
                            <span className="bg-black/20 px-3 py-1 rounded-full text-sm">-{cost} pts</span>
                        </button>
                    )}
                </div>
            </div >
        </div >
    );
};
