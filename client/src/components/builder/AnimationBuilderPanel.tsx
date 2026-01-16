import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Wand2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// --- Magic Cinema Kids Version Configuration ---

// Magic Actions (Row 1)
export const MAGIC_ACTIONS = [
    { id: 'dance', label: 'Dance', emoji: '💃', image: '/assets/actions/dance.jpg', prompt: 'character dancing happily, rhythmic movement', motionScore: 0.8 },
    { id: 'run', label: 'Run', emoji: '🏃‍♂️', image: '/assets/actions/fly.jpg', prompt: 'running fast, speed lines, hair blowing', motionScore: 0.8, camera: 'pan_right' },
    { id: 'fly', label: 'Fly', emoji: '🚀', image: '/assets/actions/run.jpg', prompt: 'flying in the sky, feet off ground', camera: 'pan_up' },
    { id: 'swim', label: 'Swim', emoji: '🏊‍♂️', image: '/assets/actions/swim.jpg', prompt: 'swimming in water, flowing movement, bubbles', motionScore: 0.7 },
    { id: 'jump', label: 'Jump', emoji: '🦘', image: '/assets/actions/jump.jpg', prompt: 'jumping up high, bouncing', motionScore: 0.9 },
    { id: 'silly', label: 'Silly', emoji: '🤡', image: '/assets/actions/silly.jpg', prompt: 'doing a silly dance, funny face, wiggling', motionScore: 0.8 },
    { id: 'laugh', label: 'Laugh', emoji: '😆', image: '/assets/actions/laugh.jpg', prompt: 'laughing out loud, moving head', camera: 'zoom_in', focus: 'face' },
    { id: 'wink', label: 'Wink', emoji: '😉', image: '/assets/actions/wink.jpg', prompt: 'winking one eye, cute smile', camera: 'zoom_in', focus: 'face' }
];

// Magic Styles (Row 2)
export const MAGIC_STYLES = [
    {
        id: 'clay',
        label: 'Clay',
        emoji: '🧸',
        image: '/assets/styles/clay.jpg',
        prompt: 'claymation style, handmade clay texture, soft rounded shapes, pastel colors, slightly textured surface, slow gentle movement'
    },
    {
        id: 'cartoon',
        label: 'Cartoon',
        emoji: '🎨',
        image: '/assets/styles/cartoon.jpg',
        prompt: 'American cartoon Q-style, thick black outlines, vibrant candy colors, exaggerated proportions with big head and small body, simple background with stars and bubbles'
    },
    {
        id: 'watercolor',
        label: 'Watercolor',
        emoji: '🌸',
        image: '/assets/styles/watercolor.jpg',
        prompt: 'Japanese healing picture book style, soft watercolor blending, low saturation warm tones, fluffy clouds and grass, gentle calming atmosphere'
    },
    {
        id: 'pixel',
        label: 'Pixel',
        emoji: '🎮',
        image: '/assets/styles/pixel.jpg',
        prompt: 'candy-colored pixel art style, low-res but vibrant, blocky Q-version characters, pixelated stars and candy decorations in background'
    },
    {
        id: 'dreamy',
        label: 'Dreamy',
        emoji: '✨',
        image: '/assets/styles/dreamy.jpg',
        prompt: 'dreamy fairy tale style with light effects, semi-transparent glow aura, floating petals and stars, soft purple and blue dreamy colors'
    },
    {
        id: 'anime',
        label: 'Anime',
        emoji: '⚡',
        image: '/assets/styles/anime.jpg',
        prompt: 'Japanese anime style, cel-shaded coloring, dynamic poses, expressive eyes with glossy highlights, speed lines and motion effects, vibrant saturated colors'
    }
];

// Magic Effects (Row 3)
export const MAGIC_EFFECTS = [
    { id: 'sparkle', label: 'Sparkle', emoji: '✨', image: '/assets/effects/sparkle.jpg', prompt: 'glowing magic dust, twinkling stars, dreamy lighting' },
    { id: 'bubbles', label: 'Bubbles', emoji: '🫧', image: '/assets/effects/bubbles.jpg', prompt: 'floating soap bubbles everywhere, colorful, fun' },
    { id: 'hearts', label: 'Hearts', emoji: '❤️', image: '/assets/effects/hearts.jpg', prompt: 'floating red hearts, love aura, cute atmosphere' },
    { id: 'snow', label: 'Snow', emoji: '❄️', image: '/assets/effects/snow.jpg', prompt: 'falling snow, winter vibe, cold breath' },
    { id: 'fire', label: 'Fire', emoji: '🔥', image: '/assets/effects/fire.jpg', prompt: 'cool energy aura, flames, super power mode' },
    { id: 'confetti', label: 'Confetti', emoji: '🎉', image: '/assets/effects/confetti.jpg', prompt: 'falling confetti, party celebration, fireworks' }
];

export const VIDEO_DURATION_OPTIONS = [
    {
        duration: 5 as const,
        label: 'Quick',
        emoji: '⚡',
        image: '/assets/duration/5s.jpg',
        baseCredits: 30, // Updated cost from screenshot
        audioCredits: 0,
        description: '4s' // Screenshot says 4s, but let's keep 5s logic or map it. 
    },
    {
        duration: 8 as const,
        label: 'Story',
        emoji: '📖',
        image: '/assets/duration/8s.jpg',
        baseCredits: 50,
        audioCredits: 0,
        description: '8s'
    },
    {
        duration: 10 as const,
        label: 'Cinema',
        emoji: '🎬',
        image: '/assets/duration/10s.jpg',
        baseCredits: 80,
        audioCredits: 0,
        description: 'HD 720p'
    }
];

export interface AnimationBuilderData {
    action?: string;          // Optional: selected action ID (dance, run, fly, etc.)
    style?: string;           // Optional: selected style ID (clay, cartoon, watercolor, pixel, dreamy)
    effect?: string;          // Optional: selected effect ID (sparkle, bubbles, etc.)
    generateAudio: boolean;   // Audio generation toggle
    duration: 5 | 8 | 10;     // Video duration options
    scene?: string;           // Optional: custom scene description
}

interface Props {
    onGenerate: (data: AnimationBuilderData) => void;
    imageUploaded: boolean;
    isGenerating?: boolean;
    progress?: number;
    statusMessage?: string;
    uploadedImage?: File | null;
}

export const AnimationBuilderPanel: React.FC<Props> = ({ onGenerate, imageUploaded, isGenerating, uploadedImage }) => {
    const [action, setAction] = useState<string | undefined>(MAGIC_ACTIONS[0].id);
    const [style, setStyle] = useState<string | undefined>(undefined);
    const [effect, setEffect] = useState<string | undefined>(undefined);
    const [generateAudio, setGenerateAudio] = useState(true);
    const [duration, setDuration] = useState<5 | 8 | 10>(5);

    // Audio/Scene State
    const [audioMode, setAudioMode] = useState<'talk' | 'scene'>('scene');
    const [sceneMood, setSceneMood] = useState('Happy');

    // Mapped Moods
    const MOODS = [
        { id: 'Happy', emoji: '☀️', color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-400' },
        { id: 'Mystery', emoji: '🌙', color: 'text-purple-500', bg: 'bg-purple-100', border: 'border-purple-400' },
        { id: 'Action', emoji: '⚡', color: 'text-red-500', bg: 'bg-red-100', border: 'border-red-400' },
        { id: 'Calm', emoji: '🍃', color: 'text-emerald-500', bg: 'bg-emerald-100', border: 'border-emerald-400' },
    ];

    // Construct the scene string dynamically
    const getSceneDescription = () => {
        if (!generateAudio) return '';
        if (audioMode === 'talk') return `character speaking, ${sceneMood.toLowerCase()} atmosphere`;
        return `background music, ${sceneMood.toLowerCase()} atmosphere, cinematic score`;
    };

    const calculateCredits = (): number => {
        const option = VIDEO_DURATION_OPTIONS.find(o => o.duration === duration);
        if (!option) return 50;
        return option.baseCredits + (generateAudio ? option.audioCredits : 0);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const popInVariants: Variants = {
        hidden: { scale: 0, opacity: 0 },
        visible: {
            scale: 1,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 400,
                damping: 15
            }
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto pb-12">


            {/* Action Selection */}
            <div className="space-y-3">
                <h4 className="text-slate-800 text-lg font-black uppercase tracking-widest flex items-center gap-2">
                    🎬 Do what?
                </h4>
                <motion.div
                    className="grid grid-cols-4 gap-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {MAGIC_ACTIONS.map(act => (
                        <motion.button
                            key={act.id}
                            variants={popInVariants}
                            onClick={() => setAction(prev => prev === act.id ? undefined : act.id)}
                            className={cn(
                                "aspect-square rounded-xl border-4 flex flex-col items-center justify-center gap-1 transition-all overflow-hidden relative group",
                                action === act.id
                                    ? "bg-blue-500/10 border-blue-500 scale-105 z-10"
                                    : "bg-white border-slate-100 hover:border-slate-300"
                            )}
                        >
                            <img src={act.image} className="w-full h-full object-cover" alt={act.label} />
                            <div className={cn(
                                "absolute bottom-0 left-0 right-0 py-1 transition-opacity bg-black/50 backdrop-blur-sm",
                                action === act.id ? "opacity-100" : "opacity-100" // Always show or conditional? User said "text at bottom", usually implies visible.
                            )}>
                                <span className="text-white text-[10px] font-black uppercase block text-center truncate px-1">{act.label}</span>
                            </div>
                        </motion.button>
                    ))}
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Style Selection */}
                <div className="space-y-3">
                    <h4 className="text-slate-800 text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        🎨 Which style?
                    </h4>
                    <motion.div
                        className="grid grid-cols-3 gap-2"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {MAGIC_STYLES.map(sty => (
                            <motion.button
                                key={sty.id}
                                variants={popInVariants}
                                onClick={() => setStyle(prev => prev === sty.id ? undefined : sty.id)}
                                className={cn(
                                    "aspect-square rounded-xl border-4 flex flex-col items-center justify-center gap-1 transition-all overflow-hidden relative group",
                                    style === sty.id
                                        ? "bg-emerald-500/10 border-emerald-500 scale-105 z-10"
                                        : "bg-white border-slate-100 hover:border-slate-300"
                                )}
                            >
                                <img src={sty.image} className="w-full h-full object-cover" alt={sty.label} />
                                <div className={cn(
                                    "absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm py-0.5 px-1 transition-opacity",
                                    style === sty.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}>
                                    <span className="text-white text-[8px] font-black uppercase block text-center truncate">{sty.label}</span>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>

                {/* Effect Selection */}
                <div className="space-y-3">
                    <h4 className="text-slate-800 text-lg font-black uppercase tracking-widest flex items-center gap-2">
                        ✨ Magic Effects
                    </h4>
                    <motion.div
                        className="grid grid-cols-3 gap-2"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {MAGIC_EFFECTS.map(eff => (
                            <motion.button
                                key={eff.id}
                                variants={popInVariants}
                                onClick={() => setEffect(prev => prev === eff.id ? undefined : eff.id)}
                                className={cn(
                                    "aspect-square rounded-xl border-4 flex flex-col items-center justify-center gap-1 transition-all overflow-hidden relative group",
                                    effect === eff.id
                                        ? "bg-amber-500/10 border-amber-500 scale-105 z-10"
                                        : "bg-white border-slate-100 hover:border-slate-300"
                                )}
                            >
                                <img src={eff.image} className="w-full h-full object-cover" alt={eff.label} />
                                <div className={cn(
                                    "absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm py-0.5 px-1 transition-opacity",
                                    effect === eff.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                )}>
                                    <span className="text-white text-[8px] font-black uppercase block text-center truncate">{eff.label}</span>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </div>




            {/* Bottom Controls Row: Length & Audio */}
            <div className="flex flex-col gap-6">
                {/* Duration (Choose Spell) */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-slate-800 text-lg font-black uppercase tracking-widest flex items-center gap-2">
                            🪄 Choose Spell
                        </h4>
                        <span className="text-amber-500 font-bold text-sm bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                            {calculateCredits()} Credits
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {VIDEO_DURATION_OPTIONS.map(opt => (
                            <button
                                key={opt.duration}
                                onClick={() => setDuration(opt.duration)}
                                className={cn(
                                    "relative py-4 px-2 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all",
                                    duration === opt.duration
                                        ? "bg-slate-800 border-slate-800 text-white shadow-xl scale-105 z-10"
                                        : "bg-white border-slate-200 text-slate-400 hover:border-purple-300"
                                )}
                            >
                                {duration === opt.duration && (
                                    <div className="absolute -top-3 bg-purple-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                        Best
                                    </div>
                                )}
                                <span className={cn("text-2xl", duration === opt.duration ? "text-white" : "grayscale opacity-70")}>
                                    {opt.emoji}
                                </span>
                                <span className="font-bold text-sm">{opt.label}</span>
                                <span className={cn("text-[10px]", duration === opt.duration ? "text-slate-400" : "text-slate-300")}>
                                    {opt.description}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Audio & Scene Control */}
                <div className="space-y-4 bg-slate-900/5 p-4 rounded-3xl border border-white/50">
                    <div className="flex items-center justify-between">
                        <h4 className="text-slate-700 text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            🎙️ Audio Mode
                        </h4>
                        <button
                            onClick={() => setGenerateAudio(!generateAudio)}
                            className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 transition-all",
                                generateAudio ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-500"
                            )}>
                            {generateAudio ? "🔊 Sound ON" : "🔇 Sound OFF"}
                        </button>
                    </div>

                    {/* Audio Mode Toggles */}
                    <div className="grid grid-cols-2 gap-3 opacity-100 transition-opacity" style={{ opacity: generateAudio ? 1 : 0.5, pointerEvents: generateAudio ? 'auto' : 'none' }}>
                        <button
                            onClick={() => setAudioMode('talk')}
                            className={cn(
                                "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                                audioMode === 'talk'
                                    ? "bg-slate-800 border-slate-800 text-white shadow-lg"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <span className="text-2xl">🗣️</span>
                            <div className="flex flex-col items-center leading-none gap-1">
                                <span className="font-bold text-sm">Talk</span>
                                <span className={cn("text-[9px]", audioMode === 'talk' ? "text-slate-400" : "text-slate-400")}>Character speaks</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setAudioMode('scene')}
                            className={cn(
                                "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                                audioMode === 'scene'
                                    ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            <span className="text-2xl">🎵</span>
                            <div className="flex flex-col items-center leading-none gap-1">
                                <span className="font-bold text-sm">Scene</span>
                                <span className={cn("text-[9px]", audioMode === 'scene' ? "text-blue-200" : "text-slate-400")}>Background music</span>
                            </div>
                        </button>
                    </div>

                    {/* Scene Moods (Visible if Scene or Talk) */}
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Scene Mood</label>
                        <div className="grid grid-cols-4 gap-2">
                            {MOODS.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setSceneMood(m.id)}
                                    className={cn(
                                        "py-2 rounded-xl border flex flex-col items-center justify-center transition-all gap-1",
                                        sceneMood === m.id
                                            ? `${m.bg} ${m.border} ${m.color} ring-2 ring-offset-1 ring-offset-slate-50 ${m.color.replace('text', 'ring')}`
                                            : "bg-white border-slate-200 text-slate-400 hover:scale-105"
                                    )}
                                >
                                    <span className="text-lg">{m.emoji}</span>
                                    <span className="text-[9px] font-bold">{m.id}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={() => onGenerate({ action, style, effect, generateAudio, duration, scene: getSceneDescription() })}
                disabled={!imageUploaded || isGenerating}
                className="w-full py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-3xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale mb-8 flex flex-col items-center justify-center"
            >
                <div className="flex items-center gap-3">
                    <Wand2 className="w-6 h-6" />
                    <span>Make Movie! 🎬</span>
                </div>
                <span className="text-xs font-bold text-white/70 bg-black/20 px-3 py-0.5 rounded-full mt-1">-{calculateCredits()} Credits</span>
            </button>
        </div>
    );
};
