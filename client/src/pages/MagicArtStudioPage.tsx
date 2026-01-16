
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, Sparkles, Paintbrush, Palette, Wand2, Image as ImageIcon, ArrowRight, ArrowLeft, Loader2, Play, Puzzle, BookOpen, RotateCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HeaderBar } from '../components/home/HeaderBar';
import { MagicNavBar } from '../components/ui/MagicNavBar';

// Import icon images
import candyKingdomIcon from '../assets/magic_icons/candy_kingdom.jpg';
import playfulBricksIcon from '../assets/magic_icons/playful_bricks.jpg';
import crayonDoodleIcon from '../assets/magic_icons/crayon_doodle.jpg';
import oceanFriendsIcon from '../assets/magic_icons/ocean_friends.jpg';
import starryMagicIcon from '../assets/magic_icons/starry_magic.jpg';
import spectralIcon from '../assets/magic_icons/spectral.jpg';
import biolumIcon from '../assets/magic_icons/biolum.jpg';
import acidIcon from '../assets/magic_icons/acid.jpg';
import jewelIcon from '../assets/magic_icons/jewel.jpg';
import holoIcon from '../assets/magic_icons/holo.jpg';
import artStudioBg from '../assets/artstudio.mp4';

interface ArtMode {
    id: 'colorize' | 'style_transfer' | 'remix';
    label: string;
    description: string;
    icon: string;
}

const MODES: ArtMode[] = [
    { id: 'colorize', label: 'Magic Colorist', description: 'Turn sketches into vivid art!', icon: '🎨' },
    { id: 'style_transfer', label: 'Style Transform', description: 'Change the vibe completely!', icon: '✨' },
    { id: 'remix', label: 'Creative Remix', description: 'Rewrite the image with magic!', icon: '🪄' },
];

const COLOR_VIBES = [
    // Kids Edition (儿童专属)
    {
        id: 'candy_kingdom',
        label: 'Candy Kingdom',
        color: 'bg-gradient-to-r from-pink-200 via-blue-200 to-purple-200 text-slate-700',
        image: candyKingdomIcon,
        prompt: 'Pastel macaron colors, cotton candy pink and baby blue, marshmallow white, soft diffuse lighting, kawaii aesthetic, dreamy bubbles, lighthearted atmosphere, no dark shadows, soft flat lighting'
    },
    {
        id: 'playful_bricks',
        label: 'Playful Bricks',
        color: 'bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500 text-white',
        image: playfulBricksIcon,
        prompt: 'Vibrant primary colors, bright red yellow blue, toy plastic texture, clean saturated colors, Pixar animation style, sunny daylight, high contrast, playful energy, high key lighting'
    },
    {
        id: 'crayon_doodle',
        label: 'Crayon Doodle',
        color: 'bg-gradient-to-r from-orange-400 via-green-400 to-purple-400 text-white',
        image: crayonDoodleIcon,
        prompt: 'Colorful crayon palette, hand-drawn vibration, multi-colored speckles, warm orange and grassy green, childlike illustration style, whimsical rainbow colors, textured paper lighting, soft flat lighting'
    },
    {
        id: 'ocean_friends',
        label: 'Ocean Friends',
        color: 'bg-gradient-to-r from-cyan-400 via-teal-300 to-orange-400 text-white',
        image: oceanFriendsIcon,
        prompt: 'Turquoise and coral palette, aquamarine water, bright orange accent, translucent jelly texture, bubble brights, underwater caustics, refreshing clear colors, soft flat lighting'
    },
    {
        id: 'starry_magic',
        label: 'Starry Magic',
        color: 'bg-gradient-to-r from-purple-600 via-indigo-700 to-yellow-400 text-white',
        image: starryMagicIcon,
        prompt: 'Deep purple and gold stars, midnight blue with glowing sparkles, galaxy gradient, magical dust, warm yellow moonlight, storybook night atmosphere, cozy gloom, soft lighting'
    },
    // High Saturation Edition (高饱和度版)
    {
        id: 'spectral_prism',
        label: 'Spectral Prism',
        color: 'bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 text-white',
        image: spectralIcon,
        prompt: 'Prismatic diffraction, chromatic aberration, rainbow lens flare, crystal light refraction, spectral highlights, iridescent aura, dreamy glowing colors, optical dispersion, high vibrance'
    },
    {
        id: 'bioluminescent_neon',
        label: 'Bioluminescent',
        color: 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white',
        image: biolumIcon,
        prompt: 'Bioluminescent vivid colors, electric neon palette, glowing cyan and magenta, deep contrast, blacklight reaction, phosphorescent paint, vibrant saturation, ultraviolet lighting'
    },
    {
        id: 'acid_pop',
        label: 'Acid Pop Art',
        color: 'bg-gradient-to-r from-yellow-400 via-green-400 to-pink-500 text-white',
        image: acidIcon,
        prompt: 'Acid color palette, psychedelic colors, vivid pop art style, clashing neon hues, highly saturated, bold color blocking, hallucinogenic visuals, maximalist color scheme'
    },
    {
        id: 'jewel_tones',
        label: 'Rich Jewel',
        color: 'bg-gradient-to-r from-emerald-600 via-purple-700 to-amber-600 text-white',
        image: jewelIcon,
        prompt: 'Deep jewel tones, rich emerald and sapphire, crimson and gold, baroque color grading, dramatic lighting, heavy saturation, velvety texture, cinematic warm lighting'
    },
    {
        id: 'holographic',
        label: 'Holographic',
        color: 'bg-gradient-to-r from-pink-300 via-blue-300 to-purple-300 text-slate-800',
        image: holoIcon,
        prompt: 'Holographic metal texture, liquid chrome colors, vaporwave aesthetic, gradient pastel neon, glossy surface, color shifting material, laser foil sheen'
    }
];

const MAGIC_TEXTURES = [
    { id: 'brick', label: 'Toy Brick', icon: '🧱', image: '/assets/magic_icons/brick.png' },
    { id: 'clay', label: 'Clay', icon: '🧸' },
    { id: '3d', label: 'Cute 3D', icon: '🦄' },
    { id: 'voxel', label: 'Voxel Block', icon: '👾' },
    { id: 'paper', label: 'Paper Cut', icon: '✂️' },
];

export const MagicArtStudioPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // State
    const [image, setImage] = useState<string | null>(null); // Base64
    const [rotation, setRotation] = useState(0); // Image rotation in degrees
    const [selectedMode, setSelectedMode] = useState<ArtMode | null>(null);
    const [prompt, setPrompt] = useState('');

    // V2 Parameters
    const [colorVibe, setColorVibe] = useState('candy_kingdom');
    const [targetStyle, setTargetStyle] = useState('3d');

    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [recordId, setRecordId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handlers
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleRotate = () => {
        if (!image) return;

        // Create a temporary image element
        const tempImg = new Image();
        tempImg.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Calculate new dimensions after 90° rotation
            const newRotation = (rotation + 90) % 360;

            // For 90° and 270° rotations, swap width and height
            if (newRotation === 90 || newRotation === 270) {
                canvas.width = tempImg.height;
                canvas.height = tempImg.width;
            } else {
                canvas.width = tempImg.width;
                canvas.height = tempImg.height;
            }

            // Translate and rotate the canvas
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((newRotation * Math.PI) / 180);
            ctx.drawImage(tempImg, -tempImg.width / 2, -tempImg.height / 2);

            // Convert rotated canvas to base64
            const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
            setImage(rotatedDataUrl);
            setRotation(0); // Reset rotation angle since image is now physically rotated
        };
        tempImg.src = image;
    };

    const handleReset = () => {
        setImage(null);
        setRotation(0);
    };

    const processFile = (file: File) => {
        // Resize image to max 1536px to prevent payload issues
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const tempImg = new Image();
            tempImg.onload = () => {
                const canvas = document.createElement('canvas');
                let width = tempImg.width;
                let height = tempImg.height;
                const MAX_SIZE = 1536;

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(tempImg, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // Compress as JPEG
                setImage(dataUrl);
                setRotation(0); // Reset rotation on new image
                setResultImage(null);
            };
            tempImg.src = readerEvent.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!user || !image || !selectedMode) return;

        setIsGenerating(true);
        setProgress(0);

        // Fake Progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev;
                return prev + 5;
            });
        }, 500);

        try {
            const payload: any = {
                userId: user.uid,
                image,
                mode: selectedMode.id,
                prompt: prompt.trim()
            };

            // Add V2 Parameters
            if (selectedMode.id === 'colorize') {
                payload.colorVibe = colorVibe;
            } else if (selectedMode.id === 'style_transfer') {
                payload.targetStyle = targetStyle;
            }

            const res = await fetch('/api/media/magic-art', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                setProgress(100);
                setTimeout(() => {
                    setResultImage(data.imageUrl);
                    setRecordId(data.record?.id);
                }, 500); // Small delay to show 100%
            } else {
                alert(data.error || 'Generation failed');
            }
        } catch (error) {
            console.error(error);
            alert('Something went wrong!');
        } finally {
            clearInterval(interval);
            setIsGenerating(false);
            // setProgress(0); // Optional: reset or keep to show completion
        }
    };

    const handleQuickCreate = (path: string) => {
        if (!resultImage) return;
        // Navigate with state to pre-fill the next page
        navigate(path, { state: { image: resultImage, from: 'magic-studio' } });
    };

    return (
        <div className="min-h-screen text-slate-900 pb-20 relative">
            {/* Background Video */}
            <video
                autoPlay
                loop
                muted
                playsInline
                className="fixed inset-0 w-full h-full object-cover z-0"
            >
                <source src={artStudioBg} type="video/mp4" />
            </video>

            {/* Overlay to darken video slightly */}
            <div className="fixed inset-0 bg-black/20 z-0"></div>

            <div className="relative z-20">
                <HeaderBar />
                {/* Back Button */}
                <button
                    onClick={() => navigate('/home')}
                    className="fixed top-4 left-4 z-50 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 group border-2 border-white"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-700 group-hover:text-indigo-600" />
                </button>
            </div>

            <main className="max-w-6xl mx-auto px-4 pt-8 relative z-10">
                {/* Intro Section */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block p-3 rounded-2xl shadow-lg mb-4"
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(12px)' }}
                    >
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-3xl shadow-inner">
                            🎨
                        </div>
                    </motion.div>
                    <h1 className="text-4xl font-black text-white mb-2 drop-shadow-md">Magic Art Studio</h1>
                    <p className="text-white/80 text-lg drop-shadow-sm">One Picture, Infinite Magic. Upload to transform!</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Left: Upload & Config (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* 1. Upload Area */}
                        <div
                            className={`relative aspect-[4/3] rounded-3xl overflow-hidden border-4 border-dashed transition-all cursor-pointer group shadow-sm
                                ${image ? 'border-transparent bg-slate-900' : 'border-white/20 hover:border-indigo-400'}`}
                            style={!image ? { backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(12px)' } : {}}
                            onClick={() => !image && fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />

                            {image ? (
                                <>
                                    <img
                                        src={image}
                                        alt="Upload"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleRotate(); }}
                                            className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md transition-all hover:scale-110"
                                            title="Rotate 90°"
                                        >
                                            <RotateCw className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                            className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-md transition-all hover:scale-110"
                                            title="Remove Image"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div
                                    className="absolute inset-0 flex flex-col items-center justify-center text-white/60 group-hover:text-indigo-400 transition-colors"
                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)', backdropFilter: 'blur(8px)' }}
                                >
                                    <Upload className="w-12 h-12 mb-3" />
                                    <span className="font-bold">Click or Drop Image</span>
                                </div>
                            )}
                        </div>

                        {/* 2. Mode Selection */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-400" />
                                Choose Magic Spell
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {MODES.map((mode) => (
                                    <motion.button
                                        key={mode.id}
                                        onClick={() => setSelectedMode(mode)}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className={`relative p-4 rounded-2xl border-2 text-left flex items-center gap-4 transition-all
                                            ${selectedMode?.id === mode.id
                                                ? 'bg-gradient-to-r from-blue-500/80 to-indigo-600/80 text-white border-transparent shadow-lg scale-[1.01]'
                                                : 'border-white/10 hover:border-indigo-400/50 text-white/80 shadow-sm'
                                            }`}
                                        style={selectedMode?.id !== mode.id ? { backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(12px)' } : {}}
                                    >
                                        <div className={`p-2.5 rounded-xl ${selectedMode?.id === mode.id ? 'bg-white/20' : 'bg-white/10 backdrop-blur-sm text-white/70'}`}>
                                            {mode.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-lg leading-tight">{mode.label}</div>
                                            <div className={`text-xs mt-1 ${selectedMode?.id === mode.id ? 'text-white/80' : 'text-white/50'}`}>
                                                {mode.description}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* 3. Detailed Config (Dynamic V2) */}
                        <AnimatePresence mode='wait'>
                            {selectedMode && (
                                <motion.div
                                    key={selectedMode.id}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-6 rounded-3xl border border-white/10 shadow-lg space-y-5"
                                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(20px)' }}
                                >
                                    {/* COLORIST: Color Vibes */}
                                    {selectedMode.id === 'colorize' && (
                                        <>
                                            <label className="block text-sm font-bold text-white">Select Color Vibe</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {COLOR_VIBES.map(v => (
                                                    <button
                                                        key={v.id}
                                                        onClick={() => setColorVibe(v.id)}
                                                        className={`relative aspect-square rounded-2xl transition-all shadow-sm overflow-hidden group
                                                            ${colorVibe === v.id
                                                                ? 'ring-4 ring-indigo-400 ring-offset-2 ring-offset-black/20 scale-105 z-10'
                                                                : 'border-2 border-white/20 hover:border-indigo-400/50 hover:scale-105'}`}
                                                    >
                                                        {/* Full Size Icon Image */}
                                                        {v.image && (
                                                            <img
                                                                src={v.image}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                                                alt={v.label}
                                                            />
                                                        )}

                                                        {/* Text Overlay at Bottom */}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent py-3 px-2">
                                                            <span className="text-xs font-bold text-white drop-shadow-lg line-clamp-2 text-center block">
                                                                {v.label}
                                                            </span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* STYLE TRANSFER: Magic Textures */}
                                    {selectedMode.id === 'style_transfer' && (
                                        <>
                                            <label className="block text-sm font-bold text-white">Select Magic Texture</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {MAGIC_TEXTURES.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setTargetStyle(t.id)}
                                                        className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all shadow-sm overflow-hidden group
                                                            ${targetStyle === t.id
                                                                ? 'ring-4 ring-purple-400 ring-offset-2 ring-offset-black/20 scale-105 z-10 bg-purple-500/20'
                                                                : 'bg-white/5 border-2 border-white/10 hover:border-purple-400/50 hover:scale-105'}`}
                                                    >
                                                        {/* Icon Image or Fallback Emoji */}
                                                        {(t as any).image ? (
                                                            <div className="w-14 h-14 mb-2 relative">
                                                                <img src={(t as any).image} className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-4xl mb-2 filter drop-shadow-sm">{t.icon}</span>
                                                        )}
                                                        <span className={`text-xs font-bold ${targetStyle === t.id ? 'text-white' : 'text-white/70'}`}>{t.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* REMIX: Text Prompt + Voice UI */}
                                    {selectedMode.id === 'remix' && (
                                        <>
                                            <label className="block text-sm font-bold text-white">Magic Command</label>
                                            <div className="relative">
                                                <textarea
                                                    value={prompt}
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    placeholder="Change the cat to a tiger..."
                                                    className="w-full p-4 bg-black/20 backdrop-blur-sm border-2 border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none transition-all placeholder:text-white/30 text-white"
                                                    rows={3}
                                                />
                                                <button className="absolute bottom-3 right-3 p-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 shadow-md transition-transform hover:scale-110" title="Voice Input (Coming Soon)">
                                                    <Wand2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    )}

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Result & Quick Create Bar (7 cols) */}
                    <div
                        className="lg:col-span-7 flex flex-col h-full rounded-[2rem] border border-white/10 p-3 shadow-xl shadow-black/20 min-h-[600px] relative overflow-hidden"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(12px)' }}
                    >
                        {/* Result Display */}
                        <div
                            className="flex-1 rounded-[1.5rem] relative overflow-hidden flex items-center justify-center border border-white/10"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(8px)' }}
                        >
                            {resultImage ? (
                                <motion.img
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    src={resultImage}
                                    className="w-full h-full object-contain p-4"
                                />
                            ) : (
                                <div className="text-center text-white/50 p-10 flex flex-col items-center">
                                    <div
                                        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(4px)' }}
                                    >
                                        <ImageIcon className="w-10 h-10 text-white/40" />
                                    </div>
                                    <p className="text-xl font-bold text-white/60 mb-2">Magic Canvas</p>
                                    <p className="text-sm">Your artwork will appear here</p>
                                </div>
                            )}
                        </div>

                        {/* Generate Button Area (Moved here) */}
                        <div className="mt-4">
                            <button
                                onClick={handleGenerate}
                                disabled={!image || isGenerating}
                                className={`w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 flex items-center justify-center gap-2 relative overflow-hidden
                                    ${isGenerating
                                        ? 'bg-slate-100 cursor-not-allowed text-slate-400'
                                        : 'active:scale-[0.98]'
                                    }`}
                            >
                                {isGenerating ? (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <span className="font-bold text-white">{progress}% Magic Loading...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Sparkles className="w-6 h-6 fill-white/30" />
                                        <span className="text-lg">Generate Magic Art</span>
                                        <Sparkles className="w-5 h-5" />
                                    </>
                                )}

                                {/* Progress Bar Background */}
                                {isGenerating && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ ease: "linear" }}
                                        className="absolute left-0 top-0 bottom-0 bg-indigo-200/50 z-0"
                                    />
                                )}
                            </button>
                        </div>

                        {/* Quick Create Bar (Upsell V2) */}
                        <AnimatePresence>
                            {resultImage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 100 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl p-4 shadow-2xl"
                                >
                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-indigo-500" />
                                            What to do with this?
                                        </h4>
                                        <button
                                            // Handle Download
                                            onClick={() => {
                                                const link = document.createElement('a');
                                                link.href = resultImage;
                                                link.download = `magic-art-${Date.now()}.jpg`;
                                                link.click();
                                            }}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                        >
                                            <ArrowRight className="w-3 h-3 rotate-90" /> Save Image
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        <button
                                            onClick={() => handleQuickCreate('/generate/video')}
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 hover:scale-105 transition-all text-indigo-900 group"
                                        >
                                            <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center group-hover:bg-indigo-300 transition-colors">
                                                <Play className="w-5 h-5 fill-indigo-700" />
                                            </div>
                                            <span className="text-xs font-bold">Video</span>
                                        </button>

                                        <button
                                            onClick={() => handleQuickCreate('/generate/comic')}
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-pink-50 hover:bg-pink-100 hover:scale-105 transition-all text-pink-900 group"
                                        >
                                            <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center group-hover:bg-pink-300 transition-colors">
                                                <img src="/icons/comic.png" className="w-6 h-6 opacity-0 absolute" onError={(e) => e.currentTarget.style.display = 'none'} />
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-bold">Comic</span>
                                        </button>

                                        <button
                                            onClick={() => handleQuickCreate('/generate/picture')}
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 hover:scale-105 transition-all text-amber-900 group"
                                        >
                                            <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center group-hover:bg-amber-300 transition-colors">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-bold">Story</span>
                                        </button>

                                        <button
                                            onClick={() => handleQuickCreate('/generate/greeting-card')}
                                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 hover:scale-105 transition-all text-emerald-900 group"
                                        >
                                            <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center group-hover:bg-emerald-300 transition-colors">
                                                <Puzzle className="w-5 h-5" />
                                            </div>
                                            <span className="text-xs font-bold">Card</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main >
            <MagicNavBar />
        </div >
    );
};
