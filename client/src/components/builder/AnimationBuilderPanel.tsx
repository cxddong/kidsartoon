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
        label: 'Short',
        emoji: '⚡',
        image: '/assets/duration/5s.jpg',
        baseCredits: 50,
        audioCredits: 30,
        description: '5 sec'
    },
    {
        duration: 8 as const,
        label: 'Medium',
        emoji: '🎬',
        image: '/assets/duration/8s.jpg',
        baseCredits: 80,
        audioCredits: 50,
        description: '8 sec'
    },
    {
        duration: 10 as const,
        label: 'Long',
        emoji: '🎞️',
        image: '/assets/duration/10s.jpg',
        baseCredits: 100,
        audioCredits: 60,
        description: '10 sec'
    }
];

export interface AnimationBuilderData {
    action?: string;          // Optional: selected action ID (dance, run, fly, etc.)
    style?: string;           // Optional: selected style ID (clay, cartoon, watercolor, pixel, dreamy)
    effect?: string;          // Optional: selected effect ID (sparkle, bubbles, etc.)
    generateAudio: boolean;   // Audio generation toggle
    duration: 5 | 8 | 10;     // Video duration options
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
            <div className="flex flex-col md:flex-row gap-6">
                {/* Length */}
                <div className="flex-1 space-y-3">
                    <h4 className="text-slate-800 text-lg font-black uppercase tracking-widest">⏱️ Duration</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {VIDEO_DURATION_OPTIONS.map(opt => (
                            <button
                                key={opt.duration}
                                onClick={() => setDuration(opt.duration)}
                                className={cn(
                                    "aspect-square rounded-2xl border-4 flex flex-col items-center justify-center gap-1 transition-all overflow-hidden relative group",
                                    duration === opt.duration
                                        ? "bg-purple-500/20 border-purple-500 ring-4 ring-purple-500/30 scale-105"
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {opt.image ? (
                                    <>
                                        <img src={opt.image} className="w-full h-full object-cover" alt={opt.description} />
                                        <div className={cn(
                                            "absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm py-1 px-2 transition-opacity",
                                            duration === opt.duration ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                        )}>
                                            <span className="text-white text-[10px] font-black uppercase block text-center">{opt.description}</span>
                                            <span className="text-amber-400 text-[9px] font-bold block text-center">-{opt.baseCredits} pt</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-2xl">{opt.emoji}</span>
                                        <span className="text-slate-700 text-[10px] font-black">{opt.description}</span>
                                        <span className="text-amber-500 text-[9px] font-bold">-{opt.baseCredits} pt</span>
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Audio Toggle */}
                <div className="flex-1 space-y-3">
                    <h4 className="text-slate-800 text-lg font-black uppercase tracking-widest">🔊 Sound</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setGenerateAudio(false)}
                            className={cn(
                                "aspect-square rounded-2xl border-4 flex flex-col items-center justify-center gap-2 transition-all overflow-hidden relative group",
                                !generateAudio
                                    ? "bg-pink-500/20 border-pink-500 ring-4 ring-pink-500/30 scale-105"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                            )}
                        >
                            <img src="/assets/audio/silent.jpg" className="w-full h-full object-cover" alt="Silent" />
                            <div className={cn(
                                "absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm py-1 px-2 transition-opacity",
                                !generateAudio ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}>
                                <span className="text-white text-[10px] font-black uppercase block text-center">Silent</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setGenerateAudio(true)}
                            className={cn(
                                "aspect-square rounded-2xl border-4 flex flex-col items-center justify-center gap-2 transition-all overflow-hidden relative group",
                                generateAudio
                                    ? "bg-pink-500/20 border-pink-500 ring-4 ring-pink-500/30 scale-105"
                                    : "bg-white border-slate-200 hover:border-slate-300"
                            )}
                        >
                            <img src="/assets/audio/magic_sound.jpg" className="w-full h-full object-cover" alt="Magic Sound" />
                            <div className={cn(
                                "absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm py-1 px-2 transition-opacity",
                                generateAudio ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}>
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-white text-[10px] font-black uppercase block text-center">Magic Sound</span>
                                    <span className="text-amber-400 text-[9px] font-bold mt-1">+{VIDEO_DURATION_OPTIONS.find(o => o.duration === duration)?.audioCredits} pt</span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={() => onGenerate({ action, style, effect, generateAudio, duration })}
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
