import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CloudUpload, Music, BookOpen, Video, Wand2, Check, Play, Pause, RotateCw, Volume2, Mic, ImageIcon, Clapperboard, Lock, X, Smile, Moon, Sun, Hand, Footprints, Sparkles, Film, PenTool, Gift, Zap, Globe, Fish, Castle, TreeDeciduous, Rocket, Tent, Snowflake } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenerationCancelButton from '../components/GenerationCancelButton';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from '../components/BottomNav';
import { VIPCover } from '../components/ui/VIPCover';

const backgroundUrl = '/bg_cartoon_new.jpg';

// --- Configuration Options ---
const STORY_STYLES = [
    { id: 'castle_ball', labels: { en: '🏰 Glittering Castle Ball', fr: '🏰 Bal du Château Scintillant', es: '🏰 Baile del Castillo Brillante' }, image: '/assets/story_icons/story_castle.jpg', icon: Castle },
    { id: 'little_wizard', labels: { en: '🧙‍♂️ Little Wizard\'s Magic School', fr: '🧙‍♂️ École de Magie du Petit Sorcier', es: '🧙‍♂️ Escuela de Magia del Pequeño Mago' }, image: '/assets/story_icons/story_wizard.jpg', icon: Wand2 },
    { id: 'ice_kingdom', labels: { en: '❄️ Winter Adventure in the Ice Kingdom', fr: '❄️ Aventure Hivernale au Royaume de Glace', es: '❄️ Aventura Invernal en el Reino de Hielo' }, image: '/assets/story_icons/story_ice.jpg', icon: Snowflake },
    { id: 'magic_woods', labels: { en: '🌳 Talking Magic Woods', fr: '🌳 Bois Magique Parlant', es: '🌳 Bosque Mágico Parlante' }, image: '/assets/story_icons/story_woods.png', icon: TreeDeciduous },
    { id: 'dino_egg', labels: { en: '🦖 Dino Island: Find the Egg', fr: '🦖 Île aux Dinos : Trouve l\'Œuf', es: '🦖 Isla Dino: Encuentra el Huevo' }, image: '/assets/story_icons/story_dino.jpg', icon: Footprints },
    { id: 'space_rescue', labels: { en: '🦸‍♂️ Superhero Space Rescue', fr: '🦸‍♂️ Sauvetage Spatial de Super-Héros', es: '🦸‍♂️ Rescate Espacial de Superhéroes' }, image: '/assets/story_icons/story_space.jpg', icon: Rocket },
    { id: 'marshmallow_clouds', labels: { en: '☁️ Sleepy Marshmallow Clouds', fr: '☁️ Nuages de Guimauve Endormis', es: '☁️ Nubes de Malvavisco Soñolientas' }, image: '/assets/story_icons/story_clouds.png', icon: Moon },
    { id: 'alien_base', labels: { en: '🛸 Alien Secret Base', fr: '🛸 Base Secrète Extraterrestre', es: '🛸 Base Secreta Alienígena' }, image: '/assets/story_icons/story_alien.jpg', icon: Globe },
    { id: 'rainbow_palace', labels: { en: '🧜‍♀️ Rainbow Pearl Palace', fr: '🧜‍♀️ Palais de Perles Arc-en-ciel', es: '🧜‍♀️ Palacio de Perlas Arcoíris' }, image: '/assets/story_icons/story_underwater.jpg', icon: Fish },
];

const MOODS = [
    { id: 'happy', labels: { en: 'Happy & Cheerful', fr: 'Joyeux & Gai', es: 'Feliz & Alegre' }, image: '/assets/mood_icons/mood_sun.jpg', color: 'bg-yellow-100 text-yellow-600', icon: Smile },
    { id: 'adventurous', labels: { en: 'Adventurous & Brave', fr: 'Aventureux & Courageux', es: 'Aventurero & Valiente' }, image: '/assets/mood_icons/mood_racing.jpg', color: 'bg-red-100 text-red-600', icon: Rocket },
    { id: 'calm', labels: { en: 'Calm & Soothing', fr: 'Calme & Apaisant', es: 'Calmado & Relajante' }, image: '/assets/mood_icons/mood_teddy.jpg', color: 'bg-blue-100 text-blue-600', icon: Moon },
    { id: 'mysterious', labels: { en: 'Mysterious & Magical', fr: 'Mystérieux & Magique', es: 'Misterioso & Mágico' }, image: '/assets/mood_icons/mood_magic.jpg', color: 'bg-purple-100 text-purple-600', icon: Sparkles },
    { id: 'silly', labels: { en: 'Silly & Funny', fr: 'Rigolo & Amusant', es: 'Tonto & Gracioso' }, image: '/assets/mood_icons/mood_party.jpg', color: 'bg-green-100 text-green-600', icon: Gift },
    { id: 'spooky', labels: { en: 'Spooky (But Safe!)', fr: 'Effrayant (Mais Sûr!)', es: 'Escalofriante (¡Pero Seguro!)' }, image: '/assets/mood_icons/mood_forest.jpg', color: 'bg-slate-100 text-slate-600', icon: Hand }
];

const VOICES = [
    { id: 'female', label: 'Gentle Female', icon: Volume2 },
    { id: 'male', label: 'Warm Male', icon: Volume2 },
    { id: 'storyteller', label: 'Storyteller', icon: Volume2 },
    { id: 'clone', label: 'Clone (VIP)', icon: Lock },
];

export const AudioStoryPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Steps: 1:Upload, 2:Audio/Story, 3:Result
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Data State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Community Gallery Data
    const [galleryImages, setGalleryImages] = useState<any[]>([]);

    React.useEffect(() => {
        fetch('/api/images/public?type=story')
            .then(res => res.json())
            .then(data => setGalleryImages(data))
            .catch(err => console.error("Failed to load gallery:", err));
    }, []);

    // Handle Remix / Incoming Data
    React.useEffect(() => {
        if (location.state?.remixImage) {
            const imgUrl = location.state.remixImage;
            setImagePreview(imgUrl);
        }
    }, [location]);

    // Step 2 Data
    const [storyStyle, setStoryStyle] = useState(STORY_STYLES[0].id);
    const [mood, setMood] = useState(MOODS[0].id);
    const [voice, setVoice] = useState(VOICES[0].id);
    const [storyData, setStoryData] = useState<any>(null); // {text, audioUrl}

    // Audio Player State
    const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Handlers
    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const [estTime, setEstTime] = useState('');

    const runProgress = (durationSeconds: number = 30) => {
        setProgress(0);
        // Calculate step to reach 95% in durationSeconds (10 updates per sec)
        const step = 95 / (durationSeconds * 10);
        const interval = setInterval(() => {
            setProgress(prev => (prev >= 95 ? prev : Math.min(prev + step, 95)));
        }, 100);
        return interval;
    };

    const toggleAudio = (url: string) => {
        if (audioRef) {
            if (isPlaying) {
                audioRef.pause();
                setIsPlaying(false);
            } else {
                audioRef.play();
                setIsPlaying(true);
            }
        } else {
            const audio = new Audio(url);
            audio.onended = () => setIsPlaying(false);
            setAudioRef(audio);
            audio.play();
            setIsPlaying(true);
        }
    };

    const goBack = () => {
        if (step > 1) {
            const confirmed = window.confirm("Are you sure you want to go back? Your current selections for this step might be lost.");
            if (!confirmed) return;
            setStep(prev => prev - 1);
        } else {
            navigate('/generate');
        }
    };

    const stopAudio = () => {
        if (audioRef) {
            audioRef.pause();
            audioRef.currentTime = 0;
            setIsPlaying(false);
        }
        window.speechSynthesis.cancel(); // Stop browser TTS too
    };

    const speakBrowser = (text: string) => {
        window.speechSynthesis.cancel();
        if (isPlaying) {
            setIsPlaying(false);
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        // Try to select a decent voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.includes('Google US English') || v.name.includes('Zira'));
        if (preferred) utterance.voice = preferred;

        utterance.onend = () => setIsPlaying(false);
        utterance.onstart = () => setIsPlaying(true);
        window.speechSynthesis.speak(utterance);
    };

    const generateStory = async () => {
        if (!imageFile && !imagePreview) return;
        setLoading(true);
        setEstTime('Estimated time: ~45 seconds');
        const interval = runProgress(45);

        // Timeout Controller (90s limit)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);

        try {
            // Lookup English Labels for Agent
            const styleLabel = STORY_STYLES.find(s => s.id === storyStyle)?.labels.en || storyStyle;
            const moodLabel = MOODS.find(m => m.id === mood)?.labels?.en || mood;

            // Agent Keyword Logic
            let extraKeywords = '';
            if (storyStyle === 'little_wizard') {
                extraKeywords = 'spells, potions, flying broomsticks, ancient libraries, magical sparks';
            } else if (storyStyle === 'ice_kingdom') {
                extraKeywords = 'crystalline textures, frozen landscapes, glowing snowflakes, winter animals, pixar style';
            }

            // Updated Prompt to emphasize Image Context + Visual Anchors
            const prompt = `
                                    ANALYZE the uploaded image in detail first. Then, create a short, engaging audio story based STRICTLY on the visible characters, setting, and actions in the image.
                                    
                                    VISUAL ANCHORS (Use these to pull lighting/texture from Context Cache):
                                    - Scene: ${styleLabel} ${extraKeywords ? `(${extraKeywords})` : ''}
                                    - Mood/Vibe: ${moodLabel}
                                    
                                    Narration Voice: ${voice}
                                    Rules: Friendly narration tone, short story suitable for children (approx 30-50 words). DO NOT make up generic elements; use what is seen in the picture.
                                    `.trim();

            const formData = new FormData();
            if (imageFile) {
                formData.append('image', imageFile);
            } else if (imagePreview) {
                formData.append('imageUrl', imagePreview);
            }
            formData.append('voiceText', prompt);
            formData.append('voice', voice); // 'female', 'male', 'storyteller'
            formData.append('userId', user?.uid || 'demo');

            const res = await fetch('/api/media/image-to-voice', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId); // Clear timeout on success response

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.details || errData.error || 'Story generation failed');
            }
            const data = await res.json();
            setStoryData(data);

            clearInterval(interval);
            setProgress(100);
            setTimeout(() => { setLoading(false); }, 500);
        } catch (e: any) {
            console.error(e);
            clearInterval(interval);
            setLoading(false);
            if (e.name === 'AbortError') {
                alert("Generation timed out. The server is taking too long. Please try again.");
            } else {
                alert("Oops! Failed to write story. " + (e.message || ""));
            }
        }
    };

    // Scroll Reset Logic
    const scrollRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [step]);

    return (
        <div className="fixed inset-0 w-full h-full bg-slate-50 flex flex-col z-[50]">
            {/* Header */}
            <div className="absolute top-0 left-0 p-4 z-50">
                <button onClick={goBack} className="p-2 bg-white/50 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-800" />
                </button>
            </div>

            {/* Content Area with Sidebars */}
            <div className="flex-1 relative w-full h-full flex overflow-hidden">

                {/* Background (Fixed) */}
                <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                    <img src={backgroundUrl} className="w-full h-full object-cover" />
                </div>

                {/* Left Sidebar (Community) */}
                <div className="hidden xl:flex w-80 flex-col gap-4 p-6 overflow-y-auto border-r border-slate-200/50 bg-white/30 backdrop-blur-sm z-20 custom-scrollbar">
                    <div className="sticky top-0 bg-white/0 backdrop-blur-md py-2 z-10">
                        <h3 className="font-black text-slate-500 uppercase tracking-widest text-xs">Community Stories</h3>
                    </div>
                    {galleryImages.map((img: any) => (
                        <div key={img.id} className="group relative aspect-[3/4] rounded-2xl bg-white shadow-md overflow-hidden cursor-pointer hover:ring-4 ring-purple-200 transition-all"
                            onClick={() => setSelectedImage(img.imageUrl)}>
                            <img src={img.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                            <div className="absolute top-2 right-2 bg-black/40 text-white p-1.5 rounded-full backdrop-blur-sm">
                                <Play className="w-3 h-3" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-white text-xs font-bold line-clamp-1">{img.meta?.title || "Untitled Story"}</p>
                            </div>
                        </div>
                    ))}
                    {galleryImages.length === 0 && (
                        <div className="text-center p-4 text-slate-400 text-sm">Loading community stories...</div>
                    )}
                </div>

                {/* Main Center Column */}
                <div ref={scrollRef} className="flex-1 h-full overflow-y-auto relative custom-scrollbar pb-24">
                    <div className="relative z-10 p-6 pt-6 max-w-lg mx-auto min-h-full flex flex-col">

                        {/* Progress Indicatior (Simpler for 2 Steps) */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="flex flex-col items-center gap-1">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                                    step >= 1 ? "bg-purple-600 text-white shadow-md scale-110" : "bg-slate-200 text-slate-400"
                                )}>
                                    1
                                </div>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Upload</span>
                            </div>
                            <div className="w-12 h-0.5 bg-slate-200" />
                            <div className="flex flex-col items-center gap-1">
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all",
                                    step >= 2 ? "bg-purple-600 text-white shadow-md scale-110" : "bg-slate-200 text-slate-400"
                                )}>
                                    2
                                </div>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Create</span>
                            </div>
                        </div>

                        {/* Step Content */}
                        <AnimatePresence mode="wait">

                            {/* STEP 1: Upload */}
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col">
                                    <div className={cn(
                                        "bg-white rounded-3xl shadow-xl flex flex-col items-center justify-center border-4 border-dashed border-slate-200 hover:border-purple-300 transition-colors group cursor-pointer overflow-hidden mx-auto",
                                        !imagePreview ? "w-full flex-1 p-6" : "w-fit h-auto border-purple-500"
                                    )}
                                        onClick={() => document.getElementById('step1-upload')?.click()}>
                                        <input type="file" id="step1-upload" className="hidden" accept="image/*" onChange={handleUpload} />
                                        {imagePreview ? (
                                            <div className="relative max-w-full">
                                                <img src={imagePreview} className="max-w-full max-h-[60vh] w-auto h-auto object-contain block" />
                                                <div className="absolute inset-x-0 bottom-0 p-2 bg-black/50 text-white text-xs text-center font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Click to Change
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center group-hover:scale-105 transition-transform">
                                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                                                    <CloudUpload className="w-10 h-10" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800 mb-2">Upload Photo</h3>
                                                <p className="text-slate-500 font-medium">Create a magical story from your photo!</p>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        disabled={!imageFile && !imagePreview}
                                        onClick={() => setStep(2)}
                                        className="mt-6 w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg disabled:opacity-50 disabled:grayscale transition-all shadow-lg hover:bg-purple-700"
                                    >
                                        Next Step ➡️
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 2: Story Settings */}
                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                                    {!storyData ? (
                                        <>
                                            {/* 1. Story Style */}
                                            <div className="bg-white p-5 rounded-3xl shadow-lg">
                                                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                                                    <span className="bg-yellow-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">1</span>
                                                    Story Style 🧚
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {STORY_STYLES.map(item => (
                                                        <button key={item.id} onClick={() => setStoryStyle(item.id)}
                                                            className={cn(
                                                                "flex flex-col items-center gap-2 p-2 rounded-2xl border-4 transition-all group hover:bg-slate-50",
                                                                storyStyle === item.id ? "border-yellow-400 bg-yellow-50 shadow-lg scale-105" : "border-slate-100 bg-white"
                                                            )}>

                                                            {/* Image Container */}
                                                            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-sm">
                                                                {/* @ts-ignore */}
                                                                {item.image ? (
                                                                    /* @ts-ignore */
                                                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                                        <item.icon className="w-10 h-10 text-slate-300" />
                                                                    </div>
                                                                )}

                                                                {/* Checkmark Overlay */}
                                                                {storyStyle === item.id && (
                                                                    <div className="absolute top-2 right-2 bg-yellow-500 text-white rounded-full p-1 shadow-md z-10 animate-in zoom-in">
                                                                        <Check className="w-3 h-3 md:w-4 md:h-4" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Text Label (Below Image) */}
                                                            <span className={cn(
                                                                "text-xs md:text-sm font-black text-center leading-tight px-1",
                                                                storyStyle === item.id ? "text-yellow-800" : "text-slate-600"
                                                            )}>
                                                                {item.labels?.en}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 2. Mood */}
                                            <div className="bg-white p-5 rounded-3xl shadow-lg">
                                                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                                                    <span className="bg-orange-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">2</span>
                                                    Mood 😊
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {MOODS.map(item => (
                                                        <button key={item.id} onClick={() => setMood(item.id)}
                                                            className={cn(
                                                                "flex flex-col items-center gap-2 p-2 rounded-2xl border-4 transition-all group hover:bg-slate-50",
                                                                mood === item.id ? "border-orange-400 bg-orange-50 shadow-lg scale-105" : "border-slate-100 bg-white"
                                                            )}>

                                                            {/* Image Container */}
                                                            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-sm">
                                                                {/* @ts-ignore */}
                                                                {item.image ? (
                                                                    /* @ts-ignore */
                                                                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                                        <item.icon className={cn("w-10 h-10 text-slate-300", mood === item.id && "text-orange-500")} />
                                                                    </div>
                                                                )}

                                                                {/* Checkmark */}
                                                                {mood === item.id && (
                                                                    <div className="absolute top-2 right-2 bg-orange-500 text-white rounded-full p-1 shadow-md z-10 animate-in zoom-in">
                                                                        <Check className="w-3 h-3" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <span className={cn(
                                                                "text-[10px] font-bold text-center leading-tight px-1",
                                                                mood === item.id ? "text-orange-700" : "text-slate-500"
                                                            )}>
                                                                {item.labels?.en}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* 3. Voice */}
                                            <div className="bg-white p-5 rounded-3xl shadow-lg">
                                                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                                                    <span className="bg-green-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">3</span>
                                                    Narrator 🗣️
                                                </h3>
                                                <div className="flex flex-col gap-2">
                                                    {VOICES.map(item => (
                                                        <div key={item.id} className="flex gap-2 w-full">
                                                            <button onClick={() => {
                                                                if (item.id === 'clone') {
                                                                    alert('🔒 This is a VIP feature. Upgrade to unlock Voice Cloning!');
                                                                    return;
                                                                }
                                                                setVoice(item.id);
                                                            }}
                                                                className={cn("flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all", voice === item.id ? "border-green-500 bg-green-50 text-green-700" : "border-slate-100 bg-white text-slate-500")}>
                                                                <item.icon className="w-5 h-5" />
                                                                <span className="text-sm font-bold flex-1 text-left">{item.label}</span>
                                                                {item.id === 'clone' && <span className="text-xs bg-black text-white px-2 py-0.5 rounded-full">Pro</span>}
                                                            </button>
                                                            {item.id === 'clone' && (
                                                                <button onClick={(e) => { e.stopPropagation(); alert("Playing Voice Sample... (Placeholder)"); }} className="p-3 bg-white border-2 border-slate-100 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-purple-500 transition-colors">
                                                                    <Play className="w-5 h-5 fill-current" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button onClick={generateStory} disabled={loading} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-lg disabled:opacity-70 shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                                                {loading ? "Writing Story..." : "Generate Audio Story ✨ (FREE!)"}
                                            </button>
                                        </>
                                    ) : (
                                        /* Result View: Play & Confirm */
                                        <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-xl flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4">
                                            <div className="text-center w-full flex flex-col items-center">
                                                <div className="w-48 h-48 mb-6 shadow-2xl rounded-2xl">
                                                    <VIPCover
                                                        imageUrl={imagePreview!}
                                                        isVIP={user?.plan === 'pro' || user?.plan === 'yearly_pro' || user?.plan === 'admin'}
                                                        childName={user?.name}
                                                        aspectRatio="square"
                                                    />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-800">Story Ready!</h3>
                                                <p className="text-slate-500 text-sm font-bold mt-1">Listen to your story</p>
                                            </div>

                                            {/* Audio Player */}
                                            {storyData.audioUrl ? (
                                                <button
                                                    onClick={() => toggleAudio(storyData.audioUrl)}
                                                    className="w-full py-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center gap-3 text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                                                >
                                                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                                                    <span className="font-black text-xl">{isPlaying ? "Pause Story" : "Play Story"}</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => speakBrowser(storyData.story)}
                                                    className="w-full py-6 bg-indigo-100/50 border-2 border-indigo-200 rounded-2xl flex items-center justify-center gap-3 text-indigo-600 shadow-sm hover:bg-indigo-100 transition-all"
                                                >
                                                    {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Volume2 className="w-8 h-8" />}
                                                    <span className="font-black text-xl">{isPlaying ? "Stop Reading" : "Read for Me (Browser)"}</span>
                                                </button>
                                            )}

                                            {/* Text Preview */}
                                            <div className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 max-h-40 overflow-y-auto">
                                                <p className="text-sm text-slate-600 italic">"{storyData.story}"</p>
                                            </div>

                                            {/* Actions */}
                                            <div className="w-full flex gap-3 mt-2">
                                                <button
                                                    onClick={() => { setStoryData(null); stopAudio(); }}
                                                    className="flex-1 py-3 bg-white border-2 border-slate-200 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                                                >
                                                    <RotateCw className="w-4 h-4" /> Try Again
                                                </button>
                                                <button
                                                    onClick={() => navigate('/generate')}
                                                    className="flex-1 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-bold hover:bg-indigo-200 transition-colors"
                                                >
                                                    Done (Go Home)
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Universal Exit Button */}
                        <div className="mt-auto pt-8 pb-12 flex justify-center">
                            <GenerationCancelButton
                                isGenerating={loading}
                                onCancel={() => navigate('/generate')}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Sidebar (Featured) - Optional (Keeping MakeCartoon Layout Balance) */}
                <div className="hidden xl:flex w-80 flex-col gap-4 p-6 border-l border-slate-200/50 bg-white/30 backdrop-blur-sm z-20">
                    <div className="sticky top-0 bg-white/0 backdrop-blur-md py-2 z-10">
                        <h3 className="font-black text-slate-500 uppercase tracking-widest text-xs">Magic Tips</h3>
                    </div>
                    <div className="p-6 bg-yellow-50 rounded-3xl border-2 border-yellow-200 shadow-sm">
                        <h4 className="font-bold text-yellow-800 mb-2">Did you know?</h4>
                        <p className="text-sm text-yellow-700">Different voices change how the story feels! Try the 'Storyteller' for a classic vibe.</p>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-3xl border-2 border-purple-200 shadow-sm">
                        <h4 className="font-bold text-purple-800 mb-2">Pro Tip</h4>
                        <p className="text-sm text-purple-700">Upload clear photos where characters are visible for the best stories.</p>
                    </div>
                </div>

            </div>

            {/* Saving / Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <Wand2 className="w-10 h-10 text-purple-600" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800 mb-2">Weaving Magic...</h2>
                    <p className="text-slate-500 font-medium text-lg max-w-md mx-auto">{estTime}</p>
                    {/* Progress Bar */}
                    <div className="w-64 h-3 bg-slate-100 rounded-full mt-8 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "linear" }}
                        />
                    </div>
                </div>
            )}
            <BottomNav />
        </div>
    );
};
