import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Play, RefreshCw, Video, Upload, Wand2, Volume2, CloudUpload, Sparkles, MoveLeft, Mic, Pause, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenerationCancelButton from '../components/GenerationCancelButton';
import { BottomNav } from '../components/BottomNav';
import { AuthButton } from '../components/auth/AuthButton';
import { useAuth } from '../context/AuthContext';
import { MAGIC_ACTIONS, MAGIC_STYLES, MAGIC_EFFECTS, VIDEO_DURATION_OPTIONS } from '../components/builder/AnimationBuilderPanel';
import { PureVideoPlayer } from '../components/PureVideoPlayer';
import { PuzzleButton } from '../components/puzzle/PuzzleButton';
import { PuzzleGame } from '../components/puzzle/PuzzleGame';
import { cn } from '../lib/utils';
import { ImageCropperModal } from '../components/ImageCropperModal';
import generateVideo from '../assets/genpage.mp4';

type Step = 'upload' | 'params' | 'generating' | 'finished';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const popInVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
};

export const AnimationPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const location = useLocation();

    // Steps: upload -> params -> generating -> finished
    const [step, setStep] = useState<Step>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [resultData, setResultData] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [showPuzzle, setShowPuzzle] = useState(false);

    // Builder States
    // Builder States
    const [action, setAction] = useState<string | undefined>(MAGIC_ACTIONS[0].id);
    const [style, setStyle] = useState<string | undefined>(undefined);
    const [effect, setEffect] = useState<string | undefined>(undefined);
    // New Doubao 1.5 States
    const [selectedSpell, setSelectedSpell] = useState<'quick' | 'story' | 'cinema'>('story');
    const [audioMode, setAudioMode] = useState<'talk' | 'scene'>('talk');
    const [voiceStyle, setVoiceStyle] = useState<'cute' | 'robot' | 'monster'>('cute');
    const [sceneMood, setSceneMood] = useState<'happy' | 'mysterious' | 'action'>('happy');
    const [textInput, setTextInput] = useState('');

    const SPELLS = {
        'quick': { duration: '4s', limit: 50, cost: 15, name: 'Quick Zap', ph: 'Say hi! (Max 10 words)' },
        'story': { duration: '8s', limit: 120, cost: 30, name: 'Story Time', ph: 'Tell a short story... (Max 25 words)' },
        'cinema': { duration: '12s', limit: 180, cost: 60, name: 'Cinema Mode', ph: 'Long story for a movie! (Max 40 words)' }
    };

    const addTag = (tag: string) => { setTextInput(prev => (tag + ' ' + prev).substring(0, SPELLS[selectedSpell].limit)); };

    const calculateCredits = (): number => {
        return SPELLS[selectedSpell].cost;
    };

    React.useEffect(() => {
        const remixUrl = location.state?.remixImage;
        if (remixUrl) {
            setImagePreview(remixUrl);
            setStep('params'); // Jump to params if remixing
            fetch(remixUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "remix.png", { type: blob.type });
                    setImageFile(file);
                })
                .catch(err => console.error("Failed to load remix image:", err));
        }
    }, [location.state]);

    // Cropper State
    const [cropImage, setCropImage] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Read for Cropper
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropImage(reader.result as string);
            };
            reader.readAsDataURL(file);

            e.target.value = ''; // Reset input
        }
    };

    const handleCropComplete = (blob: Blob) => {
        if (!cropImage) return;
        const url = URL.createObjectURL(blob);
        const file = new File([blob], "animation-input.jpg", { type: "image/jpeg" });

        setImagePreview(url);
        setImageFile(file);
        setStep('params'); // Auto-advance as before
        setCropImage(null);
    };

    const handleGenerate = async () => {
        if (!imageFile && !imagePreview) return;

        // Calculate credits
        const creditsNeeded = calculateCredits();
        if (!user) { alert('Please sign in to generate videos'); return; }
        if ((user.points || 0) < creditsNeeded) { alert(`Not enough points. You need ${creditsNeeded} points.`); return; }

        setStep('generating');
        setProgress(0);
        setStatusMessage('Uploading image...');

        const formData = new FormData();
        if (imageFile) formData.append('image', imageFile);
        else if (imagePreview) formData.append('imageUrl', imagePreview); // For Remix flow if file missing

        const selectedAction = MAGIC_ACTIONS.find(a => a.id === action);
        const selectedStyle = MAGIC_STYLES.find(s => s.id === style);
        const selectedEffect = MAGIC_EFFECTS.find(e => e.id === effect);

        let promptParts: string[] = [];
        if (selectedAction) promptParts.push(selectedAction.prompt);
        if (selectedStyle) promptParts.push(selectedStyle.prompt);
        if (selectedEffect) promptParts.push(selectedEffect.prompt);

        const finalPrompt = promptParts.join(', ');
        // Legacy fields
        formData.append('prompt', finalPrompt || 'character moving naturally');
        formData.append('duration', SPELLS[selectedSpell].duration.replace('s', ''));

        // New Doubao 1.5 fields
        formData.append('spell', selectedSpell);
        formData.append('audioMode', audioMode);
        formData.append('textInput', textInput);
        formData.append('voiceStyle', voiceStyle);
        formData.append('sceneMood', sceneMood);

        try {
            setStatusMessage('Sending to AI...');
            const response = await fetch('/api/media/image-to-video', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate video');
            }

            const data = await response.json();
            const taskId = data.taskId;

            setStatusMessage('AI is generating video...');
            const pollInterval = setInterval(async () => {
                try {
                    const statusRes = await fetch(`/api/media/image-to-video/${taskId}`);
                    const statusData = await statusRes.json();
                    if (statusData.progress !== undefined) setProgress(statusData.progress);

                    if (statusData.status === 'completed' && statusData.videoUrl) {
                        clearInterval(pollInterval);
                        setResultData({ videoUrl: statusData.videoUrl });
                        setStep('finished');
                        setStatusMessage('Complete!');
                        setProgress(100);
                    } else if (statusData.status === 'failed') {
                        clearInterval(pollInterval);
                        throw new Error(statusData.error || 'Generation failed');
                    }
                } catch (err: any) {
                    clearInterval(pollInterval);
                    alert(err.message || 'Failed to check status');
                    setStep('params');
                }
            }, 3000);

        } catch (err: any) {
            console.error('Generation error:', err);
            alert(err.message || 'Failed to generate video');
            setStep('params');
        }
    };

    const handleReset = () => {
        setStep('upload');
        setImageFile(null);
        setImagePreview(null);
        setResultData(null);
        setProgress(0);
        setAction(MAGIC_ACTIONS[0].id);
        setStyle(undefined);
        setEffect(undefined);
    };

    const handleRemix = () => {
        setStep('params');
        setResultData(null);
        setProgress(0);
    };

    return (
        <div className="min-h-screen bg-[#121826] relative overflow-hidden flex flex-col">
            {/* Header - Simplified */}
            <div className="relative z-30 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#121826]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/generate')} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                        <ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                    <h1 className="text-white text-lg font-black tracking-tight flex items-center gap-2">
                        <Video className="w-5 h-5 text-purple-400" />
                        Make it Move!
                    </h1>
                </div>
                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-full font-bold border border-amber-500/20 text-xs">
                    <span>✨</span>
                    <span>{user?.points || 0}</span>
                </div>
            </div>

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 overflow-y-auto custom-scrollbar">

                {/* STEP 1: UPLOAD */}
                {step === 'upload' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh]"
                    >
                        <h2 className="text-3xl font-black text-white mb-8 text-center">First, choose a picture! 📸</h2>

                        <div className="relative w-full aspect-[4/3] bg-slate-800/50 rounded-3xl border-4 border-dashed border-white/20 hover:border-purple-400/50 transition-colors group cursor-pointer overflow-hidden flex flex-col items-center justify-center max-w-2xl"
                            onClick={() => document.getElementById('anim-upload')?.click()}>

                            {/* Background Video Hint - Original, No Effects */}
                            <video src={generateVideo} autoPlay loop muted playsInline disablePictureInPicture className="absolute inset-0 w-full h-full object-cover pointer-events-none" />



                            <input type="file" id="anim-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </div>
                    </motion.div>
                )}

                {/* STEP 2: PARAMETERS */}
                {step === 'params' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 h-full">
                        {/* Left: Preview */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
                            <div className="relative w-full aspect-square rounded-3xl overflow-hidden border-4 border-white/10 bg-black/20 shadow-2xl max-w-[280px]">
                                <img src={imagePreview!} className="w-full h-full object-contain" />
                                <button
                                    onClick={() => setStep('upload')}
                                    className="absolute bottom-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-black/80 backdrop-blur-md transition-colors"
                                >
                                    Change Photo
                                </button>
                            </div>

                            {/* Generate Button (Desktop - Bottom Left) */}
                            <div className="hidden lg:block">
                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-3xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                        <span>Generate!</span>
                                    </div>
                                    <span className="text-xs font-bold text-white/70 bg-black/20 px-3 py-0.5 rounded-full mt-1">-{calculateCredits()} Credits</span>
                                </button>
                            </div>
                        </motion.div>

                        {/* Right: Controls */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8 pb-32 lg:pb-0">

                            {/* 3-COLUMN SELECTION GRID */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* LEFT COL: STYLE (2 cols x 3 rows) */}
                                <div className="space-y-3 order-1 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm h-full flex flex-col">
                                    <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">🎨 Style</h3>
                                    <div className="grid grid-cols-2 gap-1 w-full mx-auto lg:mx-0">
                                        {MAGIC_STYLES.map(sty => (
                                            <button
                                                key={sty.id}
                                                onClick={() => setStyle(prev => prev === sty.id ? undefined : sty.id)}
                                                className={cn(
                                                    "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden transition-all",
                                                    style === sty.id ? "border-emerald-500 bg-emerald-500/20 scale-105 shadow-lg z-10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <img src={sty.image} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                    <span className="text-[9px] font-black text-white uppercase block text-center truncate px-1">{sty.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <button className="w-full mt-auto py-3 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl text-[10px] font-black text-white/30 uppercase tracking-widest hover:bg-white/10 transition-colors cursor-not-allowed flex items-center justify-center gap-2">
                                        <span>More Incoming...</span>
                                        <span className="grayscale opacity-50">🚀</span>
                                    </button>
                                </div>

                                {/* MIDDLE COL: ACTION (2 cols x 4 rows) */}
                                <div className="space-y-3 order-2 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm h-full flex flex-col">
                                    <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">🎬 Action</h3>
                                    <div className="grid grid-cols-2 gap-1 w-full mx-auto">
                                        {MAGIC_ACTIONS.map(act => (
                                            <button
                                                key={act.id}
                                                onClick={() => setAction(prev => prev === act.id ? undefined : act.id)}
                                                className={cn(
                                                    "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden transition-all",
                                                    action === act.id ? "border-blue-500 bg-blue-500/20 scale-105 shadow-lg z-10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <img src={act.image} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                    <span className="text-[9px] font-black text-white uppercase block text-center truncate px-1">{act.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* RIGHT COL: EFFECT (2 cols x 3 rows) */}
                                <div className="space-y-3 order-3 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm h-full flex flex-col">
                                    <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2">✨ Effect</h3>
                                    <div className="grid grid-cols-2 gap-1 w-full mx-auto lg:ml-auto lg:mr-0">
                                        {MAGIC_EFFECTS.map(eff => (
                                            <button
                                                key={eff.id}
                                                onClick={() => setEffect(prev => prev === eff.id ? undefined : eff.id)}
                                                className={cn(
                                                    "w-full aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 relative overflow-hidden transition-all",
                                                    effect === eff.id ? "border-amber-500 bg-amber-500/20 scale-105 shadow-lg z-10" : "border-white/10 bg-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <img src={eff.image} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                                    <span className="text-[9px] font-black text-white uppercase block text-center truncate px-1">{eff.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <button className="w-full mt-auto py-3 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl text-[10px] font-black text-white/30 uppercase tracking-widest hover:bg-white/10 transition-colors cursor-not-allowed flex items-center justify-center gap-2">
                                        <span>More Incoming...</span>
                                        <span className="grayscale opacity-50">🚀</span>
                                    </button>
                                </div>

                            </div>

                            {/* SPELL & AUDIO SECTION */}
                            <div className="space-y-6">
                                {/* 1. CHOOSE SPELL */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center gap-2">🪄 Choose Spell</h3>
                                        <span className="text-xs font-bold text-yellow-400">{SPELLS[selectedSpell].cost} Credits</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <button onClick={() => { setSelectedSpell('quick'); setTextInput(prev => prev.slice(0, 50)); }}
                                            className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden",
                                                selectedSpell === 'quick' ? "ring-2 ring-blue-400 bg-slate-700/80 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}>
                                            <div className="text-2xl mb-1">⚡️</div>
                                            <div className="text-sm font-bold text-white">Quick</div>
                                            <div className="text-[10px] text-slate-400">4s</div>
                                        </button>

                                        {/* Wrapped in relative div to allow badge outside button */}
                                        <div className="relative group">
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-[9px] px-2 py-0.5 rounded-full text-white font-bold whitespace-nowrap z-20 shadow-lg border border-purple-400">BEST</div>
                                            <button onClick={() => { setSelectedSpell('story'); setTextInput(prev => prev.slice(0, 120)); }}
                                                className={cn("w-full h-full flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden",
                                                    selectedSpell === 'story' ? "ring-2 ring-purple-500 bg-slate-700/80 border-transparent shadow-[0_0_15px_rgba(168,85,247,0.4)]" : "bg-white/5 border-white/10 hover:bg-white/10"
                                                )}>
                                                <div className="text-2xl mb-1">📖</div>
                                                <div className="text-sm font-bold text-white">Story</div>
                                                <div className="text-[10px] text-slate-400">8s</div>
                                            </button>
                                        </div>

                                        <button onClick={() => { setSelectedSpell('cinema'); }}
                                            className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all relative overflow-hidden",
                                                selectedSpell === 'cinema' ? "ring-2 ring-yellow-500 bg-slate-700/80 border-transparent" : "bg-white/5 border-white/10 hover:bg-white/10"
                                            )}>
                                            <div className="text-2xl mb-1">🎬</div>
                                            <div className="text-sm font-bold text-white">Cinema</div>
                                            <div className="text-[10px] text-yellow-200">HD 720P</div>
                                        </button>
                                    </div>
                                </div>

                                {/* 2. AUDIO MAGIC (Kids Redesign) */}
                                <div className="bg-slate-800/50 rounded-3xl p-4 border-2 border-slate-700/50">
                                    {/* 2. AUDIO & TEXT (Simplified with Voice) */}
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-white/90 text-sm font-black uppercase tracking-widest flex items-center gap-2">🗣️ Speak or Type</h3>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-1">
                                                <div className="absolute -top-2 left-4 text-slate-500 text-[10px] bg-slate-800 px-2 rounded z-10">What should happen?</div>
                                                <textarea
                                                    value={textInput}
                                                    onChange={(e) => setTextInput(e.target.value)}
                                                    maxLength={SPELLS[selectedSpell].limit}
                                                    placeholder={`Type something...`}
                                                    className="w-full bg-slate-900/80 border-2 border-dashed border-slate-600 rounded-2xl p-4 pr-12 text-base text-white focus:border-purple-500 outline-none resize-none h-32 placeholder-slate-600 leading-normal"
                                                />

                                                {/* Character Counter */}
                                                <div className={cn("absolute bottom-3 right-3 text-[10px] font-mono", textInput.length >= SPELLS[selectedSpell].limit ? "text-red-400" : "text-slate-600")}>
                                                    {textInput.length}/{SPELLS[selectedSpell].limit}
                                                </div>

                                                {/* Clear Button */}
                                                {textInput.length > 0 && (
                                                    <button
                                                        onClick={() => setTextInput('')}
                                                        className="absolute top-3 right-3 p-2 text-slate-400 hover:text-white transition-colors"
                                                        title="Clear text"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Voice Input Button (Right Side) */}
                                            <button
                                                onClick={() => {
                                                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                                    if (!SpeechRecognition) {
                                                        alert("Voice input is not supported in this browser.");
                                                        return;
                                                    }

                                                    const recognition = new SpeechRecognition();
                                                    recognition.lang = 'en-US';
                                                    recognition.interimResults = false;
                                                    recognition.maxAlternatives = 1;

                                                    recognition.start();

                                                    recognition.onstart = () => {
                                                        // Visual feedback could be added here
                                                    };

                                                    recognition.onresult = (event: any) => {
                                                        const transcript = event.results[0][0].transcript;
                                                        // Append or replace? Let's append if there's space, or replace if empty.
                                                        // For kids, maybe just appending with a space is safest.
                                                        setTextInput(prev => {
                                                            const newVal = prev ? `${prev} ${transcript}` : transcript;
                                                            return newVal.slice(0, SPELLS[selectedSpell].limit);
                                                        });
                                                    };

                                                    recognition.onerror = (event: any) => {
                                                        console.error("Speech recognition error", event.error);
                                                    };
                                                }}
                                                className="relative shrink-0 p-2 hover:scale-110 active:scale-95 transition-transform group"
                                                title="Click to Speak"
                                            >
                                                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/40 transition-colors"></div>
                                                <img src="/mic_icon_3d.png" alt="Mic" className="relative w-32 h-32 object-contain drop-shadow-2xl" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Generate Button */}
                            <div className="lg:hidden w-full pt-8">
                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white rounded-3xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col items-center justify-center group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                                        <span>Generate!</span>
                                    </div>
                                    <span className="text-xs font-bold text-white/70 bg-black/20 px-3 py-0.5 rounded-full mt-1">-{calculateCredits()} Credits</span>
                                </button>
                            </div>

                        </motion.div>
                    </div>
                )
                }

                {/* STEP 3 & 4: GENERATING & FINISHED */}
                {
                    (step === 'generating' || step === 'finished') && (
                        <div className="w-full max-w-4xl mx-auto min-h-[60vh] flex flex-col items-center justify-center">
                            {step === 'generating' ? (
                                <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-8 rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center text-center">
                                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">{statusMessage || "AI is casting magic..."}</h3>
                                    <div className="w-full h-4 bg-black/30 rounded-full overflow-hidden mt-4">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                    <span className="text-sm font-bold text-purple-300 mt-2">{Math.round(progress)}%</span>
                                </div>
                            ) : (
                                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                                    <h2 className="text-white text-3xl font-black mb-6 text-center">🎉 Your Magic Video!</h2>
                                    <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-black shadow-2xl">
                                        <PureVideoPlayer src={resultData?.videoUrl} />
                                    </div>
                                    <div className="flex flex-wrap gap-4 justify-center">
                                        <button onClick={handleRemix} className="px-6 py-3 bg-white/10 text-white font-bold rounded-full hover:bg-white/20 hover:scale-105 transition-all flex items-center gap-2">
                                            <RefreshCw className="w-5 h-5" /> Try Again
                                        </button>
                                        <button onClick={handleReset} className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold rounded-full hover:scale-105 transition-all flex items-center gap-2 shadow-lg">
                                            <ArrowRight className="w-5 h-5" /> New Magic
                                        </button>
                                    </div>
                                    {/* Puzzle Integration */}
                                    {showPuzzle && imagePreview && (
                                        <PuzzleGame imageUrl={imagePreview} imageId={`animation-${Date.now()}`} onClose={() => setShowPuzzle(false)} videoUrl={resultData?.videoUrl} />
                                    )}
                                    <div className="mt-8 flex justify-center">
                                        <PuzzleButton onClick={() => setShowPuzzle(true)} disabled={!imagePreview} />
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )
                }

            </div >

            {/* Cropper Modal */}
            {
                cropImage && (
                    <ImageCropperModal
                        imageUrl={cropImage}
                        onCrop={handleCropComplete}
                        onCancel={() => setCropImage(null)}
                        aspectRatio={1}
                    />
                )
            }
            <BottomNav />
        </div >
    );
};
