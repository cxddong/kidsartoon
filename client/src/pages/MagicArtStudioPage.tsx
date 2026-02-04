
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, Sparkles, Paintbrush, Palette, Wand2, Image as ImageIcon, ArrowRight, ArrowLeft, Loader2, Play, Puzzle, BookOpen, RotateCw, X, RefreshCw, Layout, Mic, Video, Mail, ImagePlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePointAnimation } from '../context/PointAnimationContext';
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
import holoIcon from '../assets/magic_icons/holo.jpg';
import richJewelIcon from '../assets/magic_icons/jewel.jpg';
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
        image: richJewelIcon,
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
    { id: 'brick', label: 'Toy Brick', icon: '🧱', image: playfulBricksIcon },  // playful_bricks matches brick
    { id: 'clay', label: 'Clay', icon: '🧸', image: crayonDoodleIcon },  // crayon has clay-like texture
    { id: '3d', label: 'Cute 3D', icon: '🦄', image: candyKingdomIcon },  // candy kingdom is 3D style
    { id: 'voxel', label: 'Voxel Block', icon: '👾', image: spectralIcon },  // spectral/prism has blocky voxel feel
    { id: 'paper', label: 'Paper Cut', icon: '✂️', image: oceanFriendsIcon },  // ocean friends has paper cut style
];

const CanvasPreviewModal = ({ image, onClose }: { image: string, onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full text-slate-800 transition-colors">
                    <X className="w-6 h-6" />
                </button>

                {/* Visual Side */}
                <div className="flex-1 bg-slate-100 relative min-h-[400px]">
                    <img
                        src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1000&auto=format&fit=crop"
                        alt="Room"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10" />

                    {/* The Canvas */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[40%] aspect-[3/4] shadow-[10px_20px_40px_rgba(0,0,0,0.5)] bg-white p-2 md:p-4 rotate-1">
                        <div className="w-full h-full relative overflow-hidden">
                            <img src={image} className="w-full h-full object-cover" />
                            {/* Canvas Texture Overlay */}
                            <div className="absolute inset-0 opacity-20 bg-repeat bg-[url('https://www.transparenttextures.com/patterns/canvas-orange.png')]" />
                        </div>
                    </div>
                </div>

                {/* Info Side */}
                <div className="md:w-[350px] p-8 flex flex-col justify-center bg-white">
                    <div className="mb-6">
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">Coming Soon</span>
                        <h3 className="text-2xl font-black text-slate-800 mt-2 leading-tight">Turn your Magic Art into Real Masterpieces!</h3>
                        <p className="text-slate-500 mt-2 text-sm">Get premium canvas prints delivered to your door. The perfect gift for grandparents!</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-lg">1</div>
                            <div className="text-sm text-slate-600 font-medium">High-quality gallery wrap</div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-lg">2</div>
                            <div className="text-sm text-slate-600 font-medium">Vibrant, fade-resistant ink</div>
                        </div>
                    </div>

                    <button className="mt-8 w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                        <Sparkles className="w-4 h-4" />
                        Join Waitlist
                    </button>
                    <p className="mt-3 text-xs text-center text-slate-400">Premium members get early access.</p>
                </div>
            </div>
        </div>
    );
};

export const MagicArtStudioPage: React.FC = () => {
    console.log("🎨 Rendering MagicArtStudioPage (verified)");
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { animatePoints } = usePointAnimation();

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
    const [showCanvasPreview, setShowCanvasPreview] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Restore: Mobile Drawer State
    const fileInputRef = useRef<HTMLInputElement>(null); // Restore: File Input Ref

    const handleVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Voice recognition is not supported in this browser 🙀');
            return;
        }

        if (isListening) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setPrompt(prev => (prev ? prev + ' ' + transcript : transcript));
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
            // On Tablet/Desktop we don't close, on Mobile we do
            if (window.innerWidth < 768) {
                setIsDrawerOpen(false);
            }
        }
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
        setIsDrawerOpen(false); // Close drawer to show progress

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
                const vibe = COLOR_VIBES.find(v => v.id === colorVibe);
                if (vibe) payload.stylePrompt = vibe.prompt;
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
        navigate(path, { state: { autoUploadImage: resultImage, from: 'magic-studio' } });
    };

    return (
        <div className="h-screen w-full overflow-hidden relative flex flex-col text-slate-900">
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

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden z-10 relative scrollbar-hide pb-32 md:pb-0">
                <div className="relative z-20">
                    <HeaderBar />
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(location.state?.returnTo || '/home')}
                        className="fixed top-4 left-4 z-50 p-3 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 group border-2 border-white"
                    >
                        <ArrowLeft className="w-6 h-6 text-slate-700 group-hover:text-indigo-600" />
                    </button>
                </div>

                <main className="max-w-6xl mx-auto px-4 pt-8 md:pt-20 relative z-10 w-full h-full flex flex-col">
                    {/* Intro Section - Hide on Tablet (md) to save space, show on Large Desktop (lg) */}
                    <div className="text-center mb-6 lg:block hidden">
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
                        <h1 className="text-2xl md:text-4xl font-black text-white mb-2 drop-shadow-md">Magic Art Studio</h1>
                        <p className="text-white/80 text-lg drop-shadow-sm">One Picture, Infinite Magic. Upload to transform!</p>
                    </div>


                    {/* Main Content Area - Flexbox for robust layout */}
                    <div className="flex flex-col md:flex-row gap-6 md:h-full md:pb-4 relative">
                        {/* Floating Mobile Tools Button (Hidden on md+) */}
                        <button
                            onClick={() => setIsDrawerOpen(true)}
                            className="md:hidden fixed bottom-28 right-4 z-40 bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Wand2 className="w-6 h-6 fill-white" />
                            <span className="font-bold">Tools</span>
                        </button>


                        {/* Hidden Input for File Upload (Shared) */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        {/* Shared Tools UI */}
                        {(() => {
                            const toolsContent = (
                                <>
                                    {/* 1. Upload Area */}
                                    <div
                                        className={`relative aspect-[4/3] rounded-3xl overflow-hidden border-4 border-dashed transition-all cursor-pointer group shadow-sm
                                    ${image ? 'border-transparent bg-slate-900' : 'border-white/20 hover:border-indigo-400'}`}
                                        style={!image ? { backgroundColor: 'rgba(0, 0, 0, 0.1)', backdropFilter: 'blur(12px)' } : {}}
                                        onClick={() => !image && fileInputRef.current?.click()}
                                    >
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
                                                        <RotateCw className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                                        className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600 backdrop-blur-md transition-all hover:scale-110"
                                                        title="Remove Image"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 group-hover:text-white transition-colors">
                                                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                    <Upload className="w-8 h-8" />
                                                </div>
                                                <p className="font-bold text-lg">Upload Photo</p>
                                                <p className="text-sm opacity-70">Drawing or Photo</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Mode Selector (Horizontal Scroll on Mobile) - Updated Visuals */}
                                    <div>
                                        <label className="block text-sm font-bold text-white mb-3 ml-1">Choose Magic Style</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            {MODES.map((m) => (
                                                <motion.button
                                                    key={m.id}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedMode(m)}
                                                    className={`relative p-3 md:p-3 rounded-2xl border transition-all text-left flex items-center gap-3 group overflow-hidden
                                            ${selectedMode?.id === m.id
                                                            ? 'bg-gradient-to-r from-indigo-500/80 to-purple-500/80 border-indigo-300 shadow-lg shadow-indigo-500/20'
                                                            : 'bg-black/40 border-white/20 hover:bg-black/60 hover:border-white/40' // Darker & more visible
                                                        }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner
                                            ${selectedMode?.id === m.id ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                                        {m.icon}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className={`font-bold ${selectedMode?.id === m.id ? 'text-white' : 'text-slate-100'}`}>
                                                            {m.label}
                                                        </h3>
                                                        <p className={`text-xs ${selectedMode?.id === m.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                            {m.description}
                                                        </p>
                                                    </div>
                                                    {selectedMode?.id === m.id && (
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                            <div className="w-3 h-3 bg-white rounded-full shadow-glow animate-pulse" />
                                                        </div>
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>


                                </>
                            );

                            return (
                                <>
                                    {/* Mobile Drawer */}
                                    <div className={`md:hidden fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl p-6 overflow-y-auto transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-slate-900/80 backdrop-blur-md -mx-6 px-6 py-2 z-10 border-b border-white/10">
                                            <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                                🎨 Magic Tools
                                            </h2>
                                            <button onClick={() => setIsDrawerOpen(false)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                        <div className="space-y-6">
                                            {toolsContent}
                                        </div>
                                    </div>

                                    {/* Desktop Sidebar - Fixed Width, Independent Scroll */}
                                    <div className="hidden md:block w-full md:w-[320px] lg:w-[380px] h-full overflow-y-auto scrollbar-hide space-y-4 shrink-0">
                                        {toolsContent}
                                    </div>
                                </>
                            );
                        })()}

                        {/* Right: Result & Quick Create Bar - Flex Grow to fill space */}
                        <div
                            className="flex-1 flex flex-col h-full rounded-[2rem] border-4 border-dotted border-white/50 p-3 shadow-none min-h-[500px] md:min-h-0 relative overflow-hidden w-full md:w-auto"
                        // Removed background color and backdrop blur for transparency
                        >
                            {resultImage ? (
                                // --- POST-GENERATION VIEW ---
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col h-full w-full"
                                >
                                    {/* 1. Large Result Display */}
                                    <div className="flex-1 relative rounded-[1.5rem] overflow-hidden bg-black/20 flex items-center justify-center group mb-4 min-h-0">
                                        <motion.img
                                            initial={{ scale: 0.9 }}
                                            animate={{ scale: 1 }}
                                            src={resultImage}
                                            className="w-full h-full object-contain p-2"
                                        />

                                        {/* Overlay Actions */}
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <button
                                                onClick={() => {
                                                    const link = document.createElement('a');
                                                    link.href = resultImage;
                                                    link.download = `magic-art-${Date.now()}.png`;
                                                    document.body.appendChild(link);
                                                    link.click();
                                                    document.body.removeChild(link);
                                                }}
                                                className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all shadow-lg border border-white/10"
                                                title="Download"
                                            >
                                                <ArrowRight className="w-5 h-5 rotate-90" />
                                            </button>
                                            <button
                                                onClick={() => setShowCanvasPreview(true)}
                                                className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white shadow-lg hover:scale-105 transition-transform border border-white/10"
                                                title="Preview on Canvas"
                                            >
                                                <Palette className="w-5 h-5" />
                                            </button>
                                        </div>

                                        {/* Back/Edit Button */}
                                        <button
                                            onClick={() => setResultImage(null)}
                                            className="absolute top-4 left-4 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white/90 hover:text-white transition-all flex items-center gap-2 border border-white/10"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            <span className="text-xs font-bold">Edit Again</span>
                                        </button>
                                    </div>

                                    {/* 2. Action Bar (Replaces Config) */}
                                    <div className="shrink-0 pb-2">
                                        <div className="flex items-center gap-2 mb-3 px-2">
                                            <Sparkles className="w-5 h-5 text-indigo-400" />
                                            <span className="text-white font-bold text-lg">Create with your Art</span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 h-auto md:h-32">
                                            {/* 1. Audio Story */}
                                            <button
                                                onClick={() => handleQuickCreate('/generate/audio')}
                                                className="relative overflow-hidden rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border-2 border-cyan-500/30 hover:border-cyan-400 transition-all group flex flex-col items-center justify-center gap-2 p-2"
                                            >
                                                <div className="p-2 rounded-full bg-cyan-500/20 group-hover:scale-110 transition-transform">
                                                    <Mic className="w-5 h-5 text-cyan-300" />
                                                </div>
                                                <span className="text-white font-bold text-xs md:text-sm">Audio Story</span>
                                            </button>

                                            {/* 2. Stories (Selection) */}
                                            <button
                                                onClick={() => handleQuickCreate('/story-selection')}
                                                className="relative overflow-hidden rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-500/30 hover:border-amber-400 transition-all group flex flex-col items-center justify-center gap-2 p-2"
                                            >
                                                <div className="p-2 rounded-full bg-amber-500/20 group-hover:scale-110 transition-transform">
                                                    <BookOpen className="w-5 h-5 text-amber-300" />
                                                </div>
                                                <span className="text-white font-bold text-xs md:text-sm">Stories</span>
                                            </button>

                                            {/* 3. Video */}
                                            <button
                                                onClick={() => handleQuickCreate('/generate/video')}
                                                className="relative overflow-hidden rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border-2 border-indigo-500/30 hover:border-indigo-400 transition-all group flex flex-col items-center justify-center gap-2 p-2"
                                            >
                                                <div className="p-2 rounded-full bg-indigo-500/20 group-hover:scale-110 transition-transform">
                                                    <Video className="w-5 h-5 text-indigo-300 fill-indigo-300" />
                                                </div>
                                                <span className="text-white font-bold text-xs md:text-sm">Video</span>
                                            </button>

                                            {/* 4. Card */}
                                            <button
                                                onClick={() => handleQuickCreate('/generate/greeting-card')}
                                                className="relative overflow-hidden rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border-2 border-emerald-500/30 hover:border-emerald-400 transition-all group flex flex-col items-center justify-center gap-2 p-2"
                                            >
                                                <div className="p-2 rounded-full bg-emerald-500/20 group-hover:scale-110 transition-transform">
                                                    <Mail className="w-5 h-5 text-emerald-300" />
                                                </div>
                                                <span className="text-white font-bold text-xs md:text-sm">Card</span>
                                            </button>

                                            {/* 5. Jump into Art */}
                                            <button
                                                onClick={() => handleQuickCreate('/jump-into-art')}
                                                className="relative overflow-hidden rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border-2 border-purple-500/30 hover:border-purple-400 transition-all group flex flex-col items-center justify-center gap-2 p-2 col-span-2 md:col-span-1"
                                            >
                                                <div className="p-2 rounded-full bg-purple-500/20 group-hover:scale-110 transition-transform">
                                                    <ImagePlus className="w-5 h-5 text-purple-300" />
                                                </div>
                                                <span className="text-white font-bold text-xs md:text-sm">Jump into Art</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                // --- EDITING VIEW ---
                                <>
                                    {/* Config Panel (Scrollable) */}
                                    <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0 mt-4">
                                        <AnimatePresence mode='wait'>
                                            {selectedMode && (
                                                <motion.div
                                                    key={selectedMode.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
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
                                                                        className={`relative aspect-square rounded-2xl transition-all shadow-sm overflow-hidden group flex flex-col items-center justify-center p-2
                                                        ${targetStyle === t.id
                                                                                ? 'ring-4 ring-purple-400 ring-offset-2 ring-offset-black/20 scale-105 z-10 bg-purple-500/20'
                                                                                : 'bg-white/5 border-2 border-white/10 hover:border-purple-400/50 hover:scale-105'}`}
                                                                    >
                                                                        {/* Icon Image or Fallback Emoji */}
                                                                        {(t as any).image ? (
                                                                            <div className="w-full h-full relative">
                                                                                <img src={(t as any).image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex flex-col items-center justify-center h-full w-full">
                                                                                <span className="text-5xl mb-2 filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{t.icon}</span>
                                                                            </div>
                                                                        )}

                                                                        {/* Label Overlay */}
                                                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent py-3 px-2 z-10">
                                                                            <span className={`text-xs font-bold drop-shadow-lg text-center block ${targetStyle === t.id ? 'text-white' : 'text-white/80'}`}>
                                                                                {t.label}
                                                                            </span>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* REMIX: Text Prompt + Voice UI - Expanded */}
                                                    {selectedMode.id === 'remix' && (
                                                        <div className="flex flex-col h-full">
                                                            <label className="block text-sm font-bold text-white mb-3">Magic Command</label>
                                                            <div className="relative flex-1 min-h-[200px] flex flex-col">
                                                                <textarea
                                                                    value={prompt}
                                                                    onChange={(e) => setPrompt(e.target.value)}
                                                                    placeholder={isListening ? "Listening..." : "Change the cat to a tiger...\nMake it a cyberpunk city...\nAdd a wizard hat..."}
                                                                    className={`w-full h-full p-6 text-lg bg-black/20 backdrop-blur-sm border-2 rounded-3xl focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none transition-all placeholder:text-white/30 text-white flex-1
                                                            ${isListening ? 'border-red-500/50 ring-2 ring-red-500/20' : 'border-white/10 focus:border-indigo-400'}`}
                                                                />
                                                                <button
                                                                    onClick={handleVoiceInput}
                                                                    className={`absolute bottom-4 right-4 p-4 rounded-full shadow-lg transition-all hover:scale-110 group
                                                            ${isListening ? 'bg-red-500 animate-pulse' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                                                                    title="Voice Input"
                                                                >
                                                                    {isListening ? (
                                                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                                                    ) : (
                                                                        <Wand2 className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Generate Button Area */}
                                    <div className="mt-4 flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                animatePoints({ x: e.clientX, y: e.clientY }, -25); // Deduct 25 points
                                                handleGenerate();
                                            }}
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
                                                    <span className="text-lg">Generate Magic Art (-25 Pts)</span>
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
                                </>
                            )}
                        </div>
                    </div >
                </main >
            </div >
            <MagicNavBar />

            {
                showCanvasPreview && resultImage && (
                    <CanvasPreviewModal image={resultImage} onClose={() => setShowCanvasPreview(false)} />
                )
            }
        </div >
    );
};
