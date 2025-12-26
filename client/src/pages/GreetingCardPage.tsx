import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Camera, Upload, Wand2, Video, Sparkles,
    Check, X, Mic, Download, Share2, Info, Loader2,
    RefreshCw, Image as ImageIcon, User, Sparkles as SparklesIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { UniversalVideoPlayer } from '../components/ui/UniversalVideoPlayer';
import { BouncyButton } from '../components/ui/BouncyButton';
import twoCatsBg from '../assets/2cats.mp4';

// --- Assets & Constants ---
const ART_STYLES = [
    { id: 'disney_3d', label: 'Disney 3D', bg: 'bg-blue-100', prompt: 'Disney Pixar 3D animation style, cute, vibrant, high detail' },
    { id: 'watercolor', label: 'Watercolor', bg: 'bg-green-100', prompt: 'Soft watercolor painting, dreamy, artistic, fluid strokes' },
    { id: 'paper_cut', label: 'Paper Cut', bg: 'bg-orange-100', prompt: 'Paper cut art style, layered, textured, shadows, craft' },
    { id: 'comic', label: 'Comic Book', bg: 'bg-yellow-100', prompt: 'Colorful comic book style, bold outlines, energetic' },
];



const RECIPIENTS = [
    { id: 'Mom', label: 'Mom' },
    { id: 'Dad', label: 'Dad' },
    { id: 'Grandma', label: 'Grandma' },
    { id: 'Grandpa', label: 'Grandpa' },
    { id: 'Others', label: 'Others ✏️' },
];

// --- Smart Occasion System ---
const BASE_OCCASIONS = [
    { id: 'birthday', label: 'Birthday 🎂', prompt: 'Happy Birthday theme, birthday cake, candles, party hats, festive atmosphere' },
    { id: 'thankyou', label: 'Thank You 🙏', prompt: 'Thank You theme, gratitude, flowers, warm colors' },
    { id: 'friendship', label: 'Friendship 👯', prompt: 'Friendship theme, best friends, holding hands, hearts, happy' },
    { id: 'love', label: 'Love ❤️', prompt: 'Love theme, romance, hearts, couple, red and pink colors' },
    { id: 'general', label: 'General / Daily', prompt: 'Warm greeting, bright, happy atmosphere' },
];

const SEASONAL_OCCASIONS = [
    {
        id: 'christmas',
        label: 'Christmas 🎄',
        prompt: 'Christmas theme, winter wonderland, pine tree, ornaments, snow, cozy',
        startMonth: 11, startDay: 25, endMonth: 12, endDay: 26, // Nov 25 - Dec 26
        icon: '🎄', mood: 'festive'
    },
    {
        id: 'newyear',
        label: 'New Year 🧨',
        prompt: 'New Year celebration, fireworks, sparkles, festive, golden colors',
        startMonth: 12, startDay: 1, endMonth: 1, endDay: 15, // Dec 01 - Jan 15
        icon: '🧨', mood: 'celebration'
    },
    {
        id: 'halloween',
        label: 'Halloween 🎃',
        prompt: 'Halloween theme, cute pumpkins, bats, magic, spooky fun',
        startMonth: 10, startDay: 1, endMonth: 11, endDay: 1, // Oct 01 - Nov 01
        icon: '🎃', mood: 'spooky'
    },
    {
        id: 'mothersday',
        label: 'Mother\'s Day 🌸',
        prompt: 'Mother\'s Day theme, flowers, hearts, soft pinks, love',
        startMonth: 4, startDay: 15, endMonth: 5, endDay: 15, // Mid-April - Mid-May (Approx)
        icon: '🌸', mood: 'loving'
    }
];

// --- Expanded Decorations ---
const CARD_FRAMES = [
    { id: 'none', label: 'None', prompt: '' },
    { id: 'magic_border', label: 'Magic Border ✨', prompt: 'with a glowing magical border frame' },
    { id: 'postal', label: 'Postal 📮', prompt: 'styled like a vintage postcard with stamps and postmarks' },
    { id: 'floral', label: 'Floral 🌺', prompt: 'wrapped in a beautiful floral vine border' },
    { id: 'pixel', label: 'Pixel 👾', prompt: 'with a retro pixel art game border' },
];

const STICKERS = [
    { id: 'confetti', label: 'Confetti 🎉', prompt: 'floating colorful confetti' },
    { id: 'sparkles', label: 'Sparkles ✨', prompt: 'magical sparkles and glimmers' },
    { id: 'balloons', label: 'Balloons 🎈', prompt: 'bunches of party balloons' },
    { id: 'emojis', label: '3D Emojis 😂', prompt: 'floating 3D emoji faces' },
    { id: 'hearts', label: 'Hearts ❤️', prompt: 'floating 3D hearts' },
];

const TEXT_STYLES = [
    { id: 'standard', label: 'Standard', prompt: 'clean bold typography' },
    { id: 'neon', label: 'Neon 💡', prompt: 'glowing neon tube text style' },
    { id: 'cloud', label: 'Cloud ☁️', prompt: 'fluffy white cloud text style' },
    { id: 'gold', label: 'Gold 🏆', prompt: 'shiny metallic gold foil text style' },
    { id: 'candy', label: 'Candy 🍬', prompt: 'sweet colorful rounded candy text style' },
];

const SELFIE_ROLES = [
    { id: 'myself', label: 'Just Me', prompt: 'the user as themselves' },
    { id: 'princess', label: 'Princess 👑', prompt: 'a beautiful fairy tale princess' },
    { id: 'superhero', label: 'Superhero 🦸', prompt: 'a brave superhero' },
    { id: 'wizard', label: 'Wizard 🧙', prompt: 'a magical wizard' },
    { id: 'astronaut', label: 'Astronaut 🚀', prompt: 'an intrepid astronaut' },
    { id: 'elf', label: 'Elf 🧝', prompt: 'a magical elf' },
];

const FILTERS = [
    { id: 'original', label: 'Original', icon: '📷', prompt: 'as is, realistic photo' },
    { id: 'funny', label: 'Funny 🤪', icon: '🤪', prompt: 'funny style, slight caricature, big eyes, joyful expression' },
    { id: 'cartoon', label: 'Cartoon 🦁', icon: '🦁', prompt: '3D Disney Pixar character style, big expressive eyes, cute' },
    { id: 'beauty', label: 'Beauty ✨', icon: '✨', prompt: 'beautified, glowing skin, sparkles, angelic lighting' },
];

const COMPOSITION_MODES = [
    { id: 'just_me', label: 'Just Me', icon: '🖼️', description: 'Photo in center' },
    { id: 'magic_mix', label: 'Magic Mix', icon: '🧙‍♀️', description: 'Face swap / Cosplay' },
];

export const GreetingCardPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- State: Assets ---
    const [drawing, setDrawing] = useState<string | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    // const [shouldFuse, setShouldFuse] = useState(false); // Validated Removal: Replaced by compositionMode


    // --- State: Preferences ---
    // --- State: Preferences ---
    const [occasions, setOccasions] = useState<typeof BASE_OCCASIONS>([]);
    const [selectedOccasion, setSelectedOccasion] = useState(BASE_OCCASIONS[0]);
    const [selectedStyle, setSelectedStyle] = useState(ART_STYLES[0]);

    // New Decoration States
    const [selectedFrame, setSelectedFrame] = useState(CARD_FRAMES[0]);
    const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
    const [selectedTextStyle, setSelectedTextStyle] = useState(TEXT_STYLES[0]);

    const [selectedSelfieRole, setSelectedSelfieRole] = useState(SELFIE_ROLES[0]);

    // Smart Occasion Init
    useEffect(() => {
        const today = new Date();
        const month = today.getMonth() + 1; // 1-12
        const day = today.getDate();

        const activeSeasonals = SEASONAL_OCCASIONS.filter(occ => {
            // Check if current date is within range
            // Handle year wrap (e.g. Dec to Jan)
            if (occ.startMonth > occ.endMonth) {
                // Wrap case (e.g. 12 to 1)
                return (month === occ.startMonth && day >= occ.startDay) || (month === occ.endMonth && day <= occ.endDay) || (month > occ.startMonth) || (month < occ.endMonth);
            } else {
                // Normal case
                return (month > occ.startMonth || (month === occ.startMonth && day >= occ.startDay)) &&
                    (month < occ.endMonth || (month === occ.endMonth && day <= occ.endDay));
            }
        });

        const merged = [...activeSeasonals, ...BASE_OCCASIONS];
        setOccasions(merged);

        // Auto-select first seasonal if available
        if (activeSeasonals.length > 0) {
            setSelectedOccasion(activeSeasonals[0]);
        } else {
            setSelectedOccasion(BASE_OCCASIONS[0]);
        }
    }, []);


    // Selfie Upgrades
    const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
    const [compositionMode, setCompositionMode] = useState(COMPOSITION_MODES[1]); // Default to Mix as it's more fun? Or Just Me? Request implied mix is "Option 2". Let's default to Mix if photo is uploaded based on existing behavior.

    // --- State: UI ---
    const [isZoomed, setIsZoomed] = useState(false);

    // --- State: Content ---
    const [recipientSelection, setRecipientSelection] = useState<string>('Mom');
    const [customRecipientName, setCustomRecipientName] = useState('');
    const [customMessage, setCustomMessage] = useState('');

    // --- State: System ---
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const [pointsError, setPointsError] = useState<{ required: number; current: number } | null>(null);
    const [planError, setPlanError] = useState(false);
    const [pointAnimation, setPointAnimation] = useState(false);

    const [showCamera, setShowCamera] = useState(false);
    const [cameraMode, setCameraMode] = useState<'drawing' | 'photo'>('drawing');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // --- Gallery Logic (Show during loading) ---
    const [publicGallery, setPublicGallery] = useState<any[]>([]);
    const [galleryIndex, setGalleryIndex] = useState(0);

    useEffect(() => {
        // Fetch gallery for loading screen
        fetch('/api/media/public').then(res => res.json()).then(data => {
            if (Array.isArray(data)) setPublicGallery(data);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        let interval: any;
        if (loading && publicGallery.length > 0) {
            interval = setInterval(() => {
                setGalleryIndex(prev => (prev + 1) % publicGallery.length);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [loading, publicGallery]);


    // --- Handlers: Upload ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'drawing' | 'photo') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (type === 'drawing') setDrawing(reader.result as string);
                else {
                    setPhoto(reader.result as string);
                    // setShouldFuse(true); // Deprecated
                    setCompositionMode(COMPOSITION_MODES[1]); // Auto-enable Mix
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Handlers: Camera ---
    const startCamera = (mode: 'drawing' | 'photo') => {
        setCameraMode(mode);
        setShowCamera(true);
        navigator.mediaDevices.getUserMedia({ video: { facingMode: mode === 'photo' ? 'user' : 'environment' } })
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(err => alert("Camera error: " + err.message));
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                // Determine crop/aspect ratio if needed, or just grab frame
                ctx.drawImage(videoRef.current, 0, 0, 300, 400);
                const dataUrl = canvasRef.current.toDataURL('image/png');
                if (cameraMode === 'drawing') setDrawing(dataUrl);
                else {
                    setPhoto(dataUrl);
                    // setShouldFuse(true); // Deprecated
                    setCompositionMode(COMPOSITION_MODES[1]);
                }
            }
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            setShowCamera(false);
        }
    };

    const closeCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setShowCamera(false);
    };

    // --- Handlers: Downloads ---
    const handleSaveImage = () => {
        if (!generatedImage) return;

        // Create a temporary link element
        const link = document.createElement('a');
        link.href = generatedImage;
        link.download = `kidsart-card-${Date.now()}.png`; // Provide a default filename
        link.target = "_blank"; // Fallback for some browsers

        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    };

    // --- Logic: Image Composition for API (Fusion) ---
    const getCompositeImage = async (): Promise<Blob | null> => {
        if (!drawing) return null;
        if (!photo) {
            const res = await fetch(drawing);
            return await res.blob();
        }

        // Composition Logic
        // Whether "Just Me" or "Magic Mix", we need to send the photo to the API.
        // The API (image-to-image) takes one input image usually. 
        // We will compose them on canvas so AI sees both.


        // Fusion Mode: Draw Photo onto Drawing (Side-by-side or picture-in-picture) to let AI blend them
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img1 = new Image();
            const img2 = new Image();

            img1.onload = () => {
                img2.src = photo;
            };

            img2.onload = () => {
                // Set canvas to drawing size
                canvas.width = img1.width;
                canvas.height = img1.height;

                // Draw Drawing
                ctx?.drawImage(img1, 0, 0);

                // Draw Photo (Avatar) in top right corner (approx 25% size)
                // This gives the AI both contexts in one image file
                const photoW = img1.width * 0.3;
                const photoH = (img2.height / img2.width) * photoW;

                // Draw a white border for clarity to AI
                if (ctx) {
                    ctx.fillStyle = 'white';
                    ctx.fillRect(img1.width - photoW - 10, 10, photoW + 10, photoH + 10);
                    ctx.drawImage(img2, img1.width - photoW - 5, 15, photoW, photoH);
                }

                canvas.toBlob((blob) => resolve(blob));
            };

            img1.src = drawing;
        });
    };

    // --- Core: Generator ---
    const handleGenerate = async () => {
        if (!user) {
            alert("Please log in to create and save your Magic Card!");
            return;
        }
        if (!drawing) return;
        if (!drawing) return;
        setPointAnimation(true);
        setTimeout(() => setPointAnimation(false), 2000);
        setLoading(true);
        setLoadingMsg('Preparing your masterpiece...');
        setGeneratedImage(null);
        setVideoUrl(null);

        try {
            // 1. Prompt Construction
            const finalRecipient = recipientSelection === 'Others' ? customRecipientName : recipientSelection;
            let prompt = "";
            // 2. Prepare Detailed Prompts
            // User Interests (Personalization)
            const userInterestsStr = user?.interests && user.interests.length > 0
                ? ` Incorporate elements related to user's favorites: ${user.interests.join(', ')}.`
                : "";

            const framePrompt = selectedFrame.id !== 'none' ? `framed with ${selectedFrame.prompt}` : '';

            // Map sticker IDs back to prompts
            const stickerPrompts = selectedStickers.map(id => STICKERS.find(s => s.id === id)?.prompt).filter(Boolean);
            const stickersStr = stickerPrompts.length > 0 ? `decorated with ${stickerPrompts.join(', ')}` : '';

            const textStylePrompt = selectedTextStyle.id !== 'standard' ? `text style is ${selectedTextStyle.prompt}` : '';

            // Combine Decorations
            const decorationDetails = [framePrompt, stickersStr, textStylePrompt].filter(Boolean).join('. ');
            let decorationsStr = decorationDetails ? `Decorations: ${decorationDetails}.` : "";

            // Add Occasion context
            const occasionContext = `Occasion: ${selectedOccasion.label}. Elements to include: ${selectedOccasion.prompt}.${userInterestsStr}`;

            if (photo) {
                if (compositionMode.id === 'magic_mix') {
                    // Scenario 1: Magic Mix (Face Swap / Fusion)
                    prompt = `(Fusion Mode) A magical greeting card for ${selectedOccasion.label}. Transform the user (from the inset photo) into ${selectedSelfieRole.prompt}. Blend them naturally into the illustration style. Art Style: ${selectedStyle.prompt}. ${occasionContext} ${decorationsStr} User Face Filter: ${selectedFilter.prompt}. Text content context: "To ${finalRecipient}: ${customMessage}". High quality, cute, heartwarming.`;
                } else {
                    // Scenario 2: Just Me (Photo Layer)
                    prompt = `(Composition Mode) A magical greeting card for ${selectedOccasion.label}. Place the user's photo (from input) prominently in the center or artistically framed. Apply filter style to user: ${selectedFilter.prompt}. Surrounding Art Style: ${selectedStyle.prompt}. ${occasionContext} ${decorationsStr} Text content context: "To ${finalRecipient}: ${customMessage}". High quality, clear face.`;
                }
            } else {
                // Scenario 3: Drawing Only
                prompt = `(Enhance Mode) A high-quality greeting card based on this drawing for ${selectedOccasion.label}. Art Style: ${selectedStyle.prompt}. ${occasionContext} ${decorationsStr} Text content context: "To ${finalRecipient}: ${customMessage}". Enhance details, vibrant colors, clean lines.`;
            }

            // 2. Prepare Image
            const imageBlob = await getCompositeImage();
            if (!imageBlob) throw new Error("Failed to process image");

            const formData = new FormData();
            formData.append('image', imageBlob, 'input.png');
            formData.append('prompt', prompt);
            formData.append('userId', user?.uid || 'anonymous');

            // 3. API Call
            setLoadingMsg('Painting with magic colors...');
            const res = await fetch('/api/media/image-to-image', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.errorCode === 'NOT_ENOUGH_POINTS') {
                setPointsError({ required: data.required, current: data.current });
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error(data.error || "Generation failed");

            if (data.cartoonImageUrl) {
                // 4. Overlay Text (Client Side or just show image if AI handles text well? AI usually bad at text)
                // We will rely on text overlay UI logic similar to previous version, OR assume AI does it?
                // Request said: "Text content context" in prompt. AI often messes up text. 
                // Let's rely on the previous method: Show generated image -> Overlay Text in UI.
                setGeneratedImage(data.cartoonImageUrl);
            }

        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Upsell: Video ---
    const handleVideoGeneration = async () => {
        if (!generatedImage) return;
        setVideoLoading(true);

        try {
            const res = await fetch('/api/media/image-to-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: generatedImage,
                    prompt: "Animate this greeting card, subtle movements, particles, magical atmosphere",
                    userId: user?.uid || 'anonymous'
                })
            });
            const data = await res.json();

            if (data.errorCode === 'PLAN_RESTRICTED') {
                setPlanError(true);
                setVideoLoading(false);
                return;
            }

            if (data.errorCode === 'NOT_ENOUGH_POINTS') {
                setPointsError({ required: data.required, current: data.current });
                setVideoLoading(false);
                return;
            }

            if (data.videoUrl) setVideoUrl(data.videoUrl);
        } catch (e) {
            alert("Video generation failed");
        } finally {
            setVideoLoading(false);
        }
    };

    // --- Render ---
    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] font-sans pb-24 pt-safe relative custom-scrollbar flex flex-col">
            {/* Background Image - Fixed */}
            <div className="fixed inset-0 z-0 h-full w-full">
                <video
                    src={twoCatsBg}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Header */}
            <div className="fixed top-0 inset-x-0 z-40 px-4 py-3 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/50 backdrop-blur-md rounded-full hover:bg-white/80 text-slate-800 transition-colors shadow-sm">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-bold shadow-sm border border-amber-200">
                    <Sparkles className="w-4 h-4 fill-amber-500" />
                    <span>{user?.points || 0}</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-4 mt-20 space-y-12 relative z-10">

                {/* SECTION A: Dual Asset Upload */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                        <h2 className="text-xl font-bold text-slate-900">Upload Assets</h2>
                    </div>

                    {/* Responsive Layout: Stack on Mobile, Row on Desktop */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch">
                        {/* Slot 1: Drawing (Required) */}
                        <div className="flex-1 space-y-3 min-h-[300px]">
                            <label className="block text-sm font-bold text-slate-400 uppercase">Drawing</label>
                            <div className="relative w-full h-full min-h-[300px] aspect-[3/2] bg-white/20 backdrop-blur-md rounded-3xl border-4 border-dashed border-slate-200 hover:border-blue-400 transition-colors group overflow-hidden shadow-sm">
                                {drawing ? (
                                    <>
                                        <img src={drawing} className="w-full h-full object-contain bg-slate-100" alt="Drawing" />
                                        <button
                                            onClick={() => setDrawing(null)}
                                            className="absolute top-2 right-2 p-2 bg-white/80 rounded-full shadow-sm text-red-500 hover:bg-white"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => startCamera('drawing')} className="p-4 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-100 transition-colors">
                                                <Camera className="w-6 h-6" />
                                            </button>
                                            <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-purple-50 text-purple-500 rounded-2xl hover:bg-purple-100 transition-colors">
                                                <Upload className="w-6 h-6" />
                                            </button>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">Upload your art</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Slot 2: Photo (Optional - Selfie Only) */}
                        <div className="w-full md:w-1/3 space-y-3">
                            <label className="block text-sm font-bold text-slate-400 uppercase">Input You</label>
                            <div className="relative w-full aspect-square bg-white/20 backdrop-blur-md rounded-[2rem] border-4 border-dashed border-slate-200 hover:border-pink-400 transition-colors overflow-hidden group shadow-sm">
                                {photo ? (
                                    <>
                                        <img src={photo} className="w-full h-full object-cover" alt="Photo" />
                                        <button
                                            onClick={() => setPhoto(null)}
                                            className="absolute top-1 right-1 p-1.5 bg-white/80 rounded-full shadow-sm text-red-500 hover:bg-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <button onClick={() => startCamera('photo')} className="p-3 bg-pink-50 text-pink-500 rounded-2xl mb-2 hover:bg-pink-100">
                                            <Camera className="w-5 h-5" />
                                        </button>
                                        <span className="text-[10px] font-bold text-slate-400 text-center leading-tight">Take Selfie</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Hidden Inputs */}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'drawing')} />

                    {/* NEW: Selfie Upgrade Section (RESTORED & VISIBLE) */}
                    {photo && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-inner">
                            <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-purple-500" />
                                Selfie Visual Settings
                            </h3>

                            {/* A. Fun Filters */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-purple-400 uppercase tracking-widest">Selfie Style</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {FILTERS.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFilter(f)}
                                            className={cn(
                                                "aspect-square rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1",
                                                selectedFilter.id === f.id
                                                    ? "bg-purple-500 text-white border-purple-500 shadow-md transform scale-105"
                                                    : "bg-white text-slate-600 border-purple-200 hover:bg-purple-100"
                                            )}
                                        >
                                            <span className="text-2xl">{f.icon}</span>
                                            {f.label.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* B. Composition Mode (Hidden as requested? No, user asked for params back) */}
                            {/* We'll show Roles directly if Mixed, simpler UI */}

                            {/* C. Role Selection */}
                            <div className="space-y-2 pt-2 border-t border-purple-200/50">
                                <label className="text-xs font-bold text-purple-500 uppercase flex items-center gap-2">
                                    <Wand2 className="w-3 h-3" /> Mix with Character
                                </label>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                    {SELFIE_ROLES.map(role => (
                                        <button
                                            key={role.id}
                                            onClick={() => setSelectedSelfieRole(role)}
                                            className={cn(
                                                "aspect-square p-1 rounded-xl font-bold text-[10px] border transition-all flex flex-col items-center justify-center gap-1 text-center leading-tight",
                                                selectedSelfieRole.id === role.id
                                                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                            )}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* SECTION B: Customize */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                        <h2 className="text-xl font-bold text-slate-900">Customize</h2>
                    </div>

                    {/* 0. Occasion/Festival (Smart System) */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Occasion</label>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {occasions.map(occ => {
                                const isSeasonal = SEASONAL_OCCASIONS.some(s => s.id === occ.id);
                                return (
                                    <button
                                        key={occ.id}
                                        onClick={() => setSelectedOccasion(occ)}
                                        className={cn(
                                            "aspect-square p-2 rounded-2xl font-bold text-xs border transition-all flex flex-col items-center justify-center text-center relative overflow-hidden gap-1",
                                            selectedOccasion.id === occ.id
                                                ? (isSeasonal ? "bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-200 scale-105" : "bg-pink-500 text-white border-pink-500 shadow-md scale-105")
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:scale-[1.02]"
                                        )}
                                    >
                                        {isSeasonal && <span className="absolute top-2 right-2 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>}
                                        <span className="text-2xl">{(occ as any).icon || (occ.label.includes('Birthday') ? '🎂' : '💝')}</span>
                                        <span>{occ.label.split(' ')[0]}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 1. Art Style */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Art Style</label>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {ART_STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style)}
                                    className={cn(
                                        "min-w-[120px] aspect-square p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 snap-center shrink-0",
                                        selectedStyle.id === style.id ? "border-slate-900 shadow-lg bg-white scale-105" : "border-transparent bg-white shadow-sm"
                                    )}
                                >
                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl", style.bg)}>
                                        🎨
                                    </div>
                                    <span className="font-bold text-sm text-center leading-tight">{style.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Expanded Decorations */}
                    <div className="space-y-6 bg-white/50 p-6 rounded-2xl border border-slate-100">
                        {/* A. Frame */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Card Frame</label>
                            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                                {CARD_FRAMES.map(frame => (
                                    <button
                                        key={frame.id}
                                        onClick={() => setSelectedFrame(frame)}
                                        className={cn(
                                            "aspect-square p-2 rounded-xl font-bold text-[10px] border transition-all flex flex-col items-center justify-center text-center gap-1",
                                            selectedFrame.id === frame.id ? "bg-slate-800 text-white border-slate-800 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <span className="text-lg">🖼️</span>
                                        {frame.label.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* B. Stickers */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Stickers</label>
                            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                                {STICKERS.map(sticker => {
                                    const isSelected = selectedStickers.includes(sticker.id);
                                    return (
                                        <button
                                            key={sticker.id}
                                            onClick={() => {
                                                if (isSelected) setSelectedStickers(prev => prev.filter(id => id !== sticker.id));
                                                else setSelectedStickers(prev => [...prev, sticker.id]);
                                            }}
                                            className={cn(
                                                "aspect-square p-2 rounded-xl font-bold text-[10px] border transition-all flex flex-col items-center justify-center text-center gap-1",
                                                isSelected ? "bg-purple-600 text-white border-purple-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <span className="text-lg">{sticker.label.split(' ').pop()}</span>
                                            {sticker.label.split(' ')[0]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* C. Text Style */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Text Style</label>
                            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                                {TEXT_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedTextStyle(style)}
                                        className={cn(
                                            "aspect-square p-2 rounded-xl font-bold text-[10px] border transition-all flex flex-col items-center justify-center text-center gap-1",
                                            selectedTextStyle.id === style.id ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <span className="text-lg">Aa</span>
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. Recipient */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Who is this for?</label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            {RECIPIENTS.map(rec => (
                                <button
                                    key={rec.id}
                                    onClick={() => setRecipientSelection(rec.id)}
                                    className={cn(
                                        "aspect-square p-2 rounded-2xl font-bold text-sm border transition-all flex flex-col items-center justify-center text-center gap-1",
                                        recipientSelection === rec.id ? "bg-blue-100 text-blue-700 border-blue-200 scale-105 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    <span className="text-2xl">👤</span>
                                    {rec.label}
                                </button>
                            ))}
                        </div>
                        {recipientSelection === 'Others' && (
                            <motion.input
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                type="text"
                                placeholder="Enter name..."
                                value={customRecipientName}
                                onChange={e => setCustomRecipientName(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none font-bold text-slate-700 bg-white"
                            />
                        )}
                    </div>

                    {/* 4. Warm Wishes */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500">Warm Wishes</label>
                        <textarea
                            placeholder="Write your blessing here..."
                            value={customMessage}
                            onChange={e => setCustomMessage(e.target.value)}
                            className="w-full p-4 rounded-2xl border-none shadow-sm bg-white font-medium text-slate-700 resize-none h-32 focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>
                </section>

                {/* SECTION C: Generation */}
                <div className="pt-8 pb-32">
                    <button
                        onClick={handleGenerate}
                        className="relative w-full py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 overflow-hidden"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Wand2 className="w-6 h-6" />}
                        Generate Magic Card
                        <AnimatePresence>
                            {pointAnimation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.5 }}
                                    animate={{ opacity: 1, y: -50, scale: 1.5 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-screen"
                                >
                                    <span className="text-amber-300 font-extrabold text-5xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flex items-center gap-2">
                                        ✨ -8
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* RESULT VIEW (Modal/Overlay) */}
            <AnimatePresence>
                {generatedImage && (
                    <motion.div
                        initial={{ opacity: 0, y: '100%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: '100%' }}
                        className="fixed inset-0 z-50 bg-white flex flex-col pt-safe overflow-y-auto"
                    >
                        {/* Result Header */}
                        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                            <button onClick={() => setGeneratedImage(null)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Image Display */}
                        <div className="flex-1 bg-slate-100/50 relative flex flex-col items-center justify-center p-2 overflow-hidden h-full">
                            {/* The Card Container - Click to Zoom */}
                            <div
                                onClick={() => setIsZoomed(true)}
                                className="relative w-auto max-w-full h-full max-h-[75vh] flex-shrink-1 bg-white rounded-xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-50 duration-300 cursor-zoom-in group"
                            >
                                <div className=" bg-slate-50 flex-1 flex items-center justify-center p-0 min-h-0 relative">
                                    <img
                                        src={generatedImage}
                                        alt="Card"
                                        className="max-w-full max-h-full w-auto h-auto object-contain"
                                        style={{ display: 'block' }}
                                    />

                                    {/* Minimal Tags - Bottom Right Overlay */}
                                    <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <span className="px-2 py-0.5 bg-black/50 backdrop-blur-md text-white rounded-md text-[10px] font-bold shadow-sm">
                                            {selectedStyle.label}
                                        </span>
                                        <span className="px-2 py-0.5 bg-white/80 backdrop-blur-md text-slate-800 rounded-md text-[10px] font-bold shadow-sm border border-white/50">
                                            For: {recipientSelection === 'Others' ? customRecipientName : recipientSelection}
                                        </span>
                                        {customMessage && (
                                            <span className="px-2 py-0.5 bg-white/80 backdrop-blur-md text-slate-800 rounded-md text-[10px] font-bold shadow-sm border border-white/50 max-w-[150px] truncate">
                                                "{customMessage}"
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Panel - Compact */}
                        <div className="bg-white px-6 py-4 space-y-3 pb-safe border-t border-slate-100 shrink-0 relative z-20">
                            {/* Removed 'Card Ready' Text */}

                            {/* Upsell Video */}
                            {!videoUrl ? (
                                <BouncyButton
                                    onClick={handleVideoGeneration}
                                    disabled={videoLoading}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
                                >
                                    {videoLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Video className="w-4 h-4" />}
                                    Make it Move!
                                </BouncyButton>
                            ) : (
                                <div className="space-y-2">
                                    <UniversalVideoPlayer source={videoUrl} className="w-full h-32 rounded-xl shadow-md" />
                                    <div className="text-center text-green-600 font-bold text-xs flex items-center justify-center gap-1">
                                        <Check className="w-3 h-3" /> Video Created!
                                    </div>
                                </div>
                            )}

                            {/* Standard Actions */}
                            <div className="flex gap-2">

                                <button className="flex-1 py-2.5 rounded-xl bg-slate-100 font-bold text-slate-600 text-xs hover:bg-slate-200 flex items-center justify-center gap-1.5">
                                    <Share2 className="w-4 h-4" /> Share
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Overlay (Gallery) */}
            {loading && (
                <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                    <div className="mb-6">
                        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-3xl font-black text-slate-800 mb-2">{loadingMsg}</h2>
                        <p className="text-slate-500 font-medium text-lg">Wait for it...</p>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-64 h-3 bg-slate-100 rounded-full mt-6 overflow-hidden border border-slate-200">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${galleryIndex * 25}%` }} // Mock progress based on gallery rotation or just auto
                            transition={{ duration: 0.5 }}
                        />
                        {/* Better Mock Progress using time */}
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 absolute top-0 left-0"
                            initial={{ width: "0%" }}
                            animate={{ width: "95%" }}
                            transition={{ duration: 15, ease: "linear" }}
                        />
                    </div>

                    {/* Gallery Carousel */}
                    {publicGallery.length > 0 && (
                        <div className="w-full max-w-xs aspect-[4/5] bg-slate-100 rounded-3xl shadow-2xl overflow-hidden relative border-8 border-white transform rotate-2 mt-8">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={galleryIndex}
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    src={publicGallery[galleryIndex]?.imageUrl}
                                    className="w-full h-full object-cover absolute inset-0"
                                />
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-[70] bg-black flex flex-col">
                    <video ref={videoRef} autoPlay playsInline disablePictureInPicture controlsList="nodownload noremoteplayback" className="flex-1 object-cover" />
                    <canvas ref={canvasRef} width="300" height="400" className="hidden" />
                    <div className="p-8 pb-12 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 inset-x-0 flex justify-between items-center">
                        <button onClick={closeCamera} className="p-4 rounded-full bg-white/20 text-white backdrop-blur-md">
                            <X className="w-6 h-6" />
                        </button>
                        <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white bg-white/50 hover:bg-white transition-all hover:scale-110 shadow-lg" />
                        <div className="w-14" />
                    </div>
                </div>
            )}
            {/* Not Enough Points Modal */}
            <AnimatePresence>
                {pointsError && (
                    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-4xl">😿</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Magic Points Low!</h3>
                                <p className="text-slate-500 font-medium">
                                    You need <span className="text-purple-600 font-bold">{pointsError.required} points</span>,<br />
                                    but you only have <span className="text-orange-500 font-bold">{pointsError.current}</span>.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPointsError(null)}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                                >
                                    Later
                                </button>
                                <button
                                    onClick={() => {
                                        setPointsError(null);
                                        navigate('/subscription');
                                    }}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
                                >
                                    Get Points
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Upgrade Modal */}
            <AnimatePresence>
                {planError && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 border-4 border-purple-100"
                        >
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto relative">
                                <span className="text-4xl">🚀</span>
                                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">PRO</div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Upgrade to Animate!</h3>
                                <p className="text-slate-500 font-medium text-sm">
                                    Video generation is a <b>Pro Feature</b>.<br />
                                    Upgrade your plan to bring your drawings to life!
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPlanError(false)}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                                >
                                    Later
                                </button>
                                <button
                                    onClick={() => {
                                        setPlanError(false);
                                        navigate('/subscription');
                                    }}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
                                >
                                    View Plans
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
    // --- Zoom Modal ---
            {/* Image Zoom Modal */}
            <AnimatePresence>
                {isZoomed && generatedImage && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setIsZoomed(false)}
                    >
                        <motion.img
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            src={generatedImage}
                            alt="Zoomed Card"
                            className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
                        />
                        <button className="absolute top-4 right-4 p-3 bg-white/20 rounded-full text-white hover:bg-white/40">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </AnimatePresence>
            <BottomNav />
        </div>
    );
};
