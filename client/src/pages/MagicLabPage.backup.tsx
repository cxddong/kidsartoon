
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Wand2, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparkleVoiceFab } from '../components/sparkle/SparkleVoiceFab';
import { cn } from '../lib/utils';
import { RechargeModal } from '../components/payment/RechargeModal';
import { MagicFireworks } from '../components/effects/MagicFireworks';
import { WelcomeCard } from '../components/magic/WelcomeCard';
import { QuickChips } from '../components/magic/QuickChips';
import { MagicOverlay } from '../components/magic/MagicOverlay';
import { useAuth } from '../context/AuthContext'; // Making sure we have auth
import { getAuth } from 'firebase/auth'; // Direct auth fallback
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'; // Direct firestore for speed or use service
import { db } from '../firebase'; // Assuming export
import { BottomNav } from '../components/BottomNav';
import { storybookFlipVariants } from '../lib/animations';

// Fallback scripts
const VICTORY_SCRIPTS = {
    'en-US': "Yippee! Magic energy full! I feel so strong, I could turn the moon pink! Come on, let's keep making magic!",
};

export const MagicLabPage: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [extractedTags, setExtractedTags] = useState<any>(null);
    const [magicResult, setMagicResult] = useState<string | null>(null);
    const [isTransforming, setIsTransforming] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [showChips, setShowChips] = useState(false);

    // Credit System
    // Credit System
    // const [credits, setCredits] = useState<number>(0); // Removed local state
    // const [showRecharge, setShowRecharge] = useState(false); // Removed Recharge
    const [showFireworks, setShowFireworks] = useState(false);

    // Ref for controlling Sparkle
    const sparkleRef = React.useRef<any>(null);
    const [commandText, setCommandText] = useState('');
    const { user } = useAuth(); // Use Extended User
    // const auth = getAuth(); // Not needed 

    // Fetch Credits - NO LONGER NEEDED as we use user.points directly
    /*
    useEffect(() => {
    */ // Use global points from AuthContext
    const credits = user?.points || 0;

    const handleRechargeClick = () => {
        // Redirect to Subscription Page instead of Modal
        navigate('/subscription');
    };

    // Replaces handleRechargeSuccess - removed localized logic here as it moves to SubscriptionPage

    // Handlers
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const url = URL.createObjectURL(file);
            setImagePreview(url);
            setMagicResult(null);
            setShowWelcome(false); // Hide welcome card on upload

            // Trigger Vision Analysis (Vision Capability)
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const base64 = reader.result?.toString().split(',')[1];
                if (base64 && sparkleRef.current) {
                    // Auto-Trigger AI Analysis (Hands-Free)
                    // Wait longer to avoid conflict with welcome greeting
                    setTimeout(() => {
                        sparkleRef.current.triggerAnalysis(base64);
                    }, 1500);
                }
            };
        }
    };

    const handleApprenticeResponse = (response: any) => {
        console.log("Apprentice caught response:", response);
        setExtractedTags(response.tags);

        // Show quick chips after analysis (if not auto-generating)
        if (response.tags && !response.readyToGenerate) {
            setShowChips(true);
        }

        // NEW: Auto-generate if AI indicates ready
        if (response.readyToGenerate && response.tags && imageFile) {
            console.log("✨ AI is confident! Auto-generating...");
            setShowChips(false);
            // Small delay for better UX (let user hear the response first)
            setTimeout(() => {
                handleTransform();
            }, 2000);
        } else if (response.needsClarification) {
            console.log("🤔 AI needs more info, waiting for user input...");
        }
    };

    const handleChipSelect = (action: 'movie' | 'story' | 'comic') => {
        console.log("User selected:", action);
        setShowChips(false);
        // Trigger corresponding action
        if (sparkleRef.current) {
            const actionText = action === 'movie' ? 'Make a movie' : action === 'story' ? 'Write a story' : 'Draw a comic';
            sparkleRef.current.triggerSpeak(
                `Got it! Let's ${actionText.toLowerCase()}!`,
                undefined
            );
        }
        // Auto-trigger generation
        setTimeout(() => {
            handleTransform();
        }, 1500);
    };

    const handleCommandSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commandText.trim()) return;
        if (sparkleRef.current) {
            sparkleRef.current.triggerChat(commandText);
            setCommandText('');
        }
    };

    const handleTransform = async () => {
        if (!imageFile || !extractedTags) {
            alert("Master, please show me a drawing and tell me what to do first! 🐾");
            return;
        }

        // CHECK CREDITS: Cost 10
        // CHECK CREDITS: Cost 10
        if (credits < 10) {
            navigate('/subscription');
            return;
        }

        setIsTransforming(true);
        // Deduct handled by backend or optimistic update via AuthContext? 
        // AuthContext updates are realtime via snapshot, so we don't need manual deduction here unless for speed.
        // We'll rely on backend deduction which triggers Firestore update.

        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageFile);
            reader.onloadend = async () => {
                const base64Part = reader.result?.toString().split(',')[1];
                try {
                    const response = await fetch('/api/sparkle/transform', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image: base64Part,
                            tags: extractedTags,
                            userId: user?.uid // Ensure backend logs transaction
                        })
                    });

                    const data = await response.json();
                    if (data.imageUrl) {
                        setMagicResult(data.imageUrl);
                        // Proud Delivery Dialogue
                        if (sparkleRef.current) {
                            setTimeout(() => {
                                sparkleRef.current.triggerSpeak(
                                    "Ta-da! ✨ Look what I made for you! Can I have a fish cookie now? Just kidding... unless? 🍪",
                                    undefined
                                );
                            }, 500);
                        }
                    } else if (data.error) {
                        throw new Error(data.error);
                    }
                } catch (err: any) {
                    console.error("Transform error", err);
                    alert("Magic Kat got tangled in a spell! Please try again! 🙀");
                    // Credits are managed by backend transaction normally.
                } finally {
                    setIsTransforming(false);
                }
            };
        } catch (e) {
            console.error(e);
            setIsTransforming(false);
        }
    };

    // Intercept Sparkle Voice (Cost 1 per turn, but 'check 1' required to start)
    const canStartMagicKat = () => {
        if (credits < 1) {
            navigate('/subscription');
            return false;
        }
        return true;
    };

    return (
        <div className="magic-lab-container w-full h-screen overflow-y-auto flex flex-col relative text-white font-sans bg-slate-900" style={{ perspective: '1000px' }}>

            {/* Calibration / Fireworks Overlay */}
            <MagicFireworks isVisible={showFireworks} onComplete={() => setShowFireworks(false)} />

            {/* --- Header --- */}
            <header className="p-4 flex items-center justify-between gap-4 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/generate')}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-all"
                    >
                        <ArrowLeft className="w-8 h-8 text-black" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                            My Apprentice ✨
                        </h1>
                        <p className="text-white/80 text-sm font-bold">Magic Kat</p>
                    </div>
                </div>

                {/* Magic Bubble (Balance) */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-lg cursor-pointer hover:scale-105 transition-transform" onClick={handleRechargeClick}>
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-inner">
                        <Zap className="w-5 h-5 text-purple-600 fill-purple-600" />
                    </div>
                    <span className="text-2xl font-black text-yellow-300 drop-shadow-md">{credits}</span>
                </div>
            </header>

            {/* --- Main Content (Split View) --- */}
            <main className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-4 md:gap-8 z-10">

                {/* Left: Original Drawing */}
                <motion.div
                    variants={storybookFlipVariants}
                    initial="initial"
                    animate="animate"
                    className="flex flex-col items-center gap-2 w-full max-w-lg md:w-1/2 h-full justify-center"
                >
                    <div className="bg-white/90 text-purple-600 px-4 py-1 rounded-full font-bold text-sm shadow-md">
                        Your Drawing 📝
                    </div>

                    <div className="image-preview-box relative group cursor-pointer" onClick={() => document.getElementById('magic-upload')?.click()}>
                        {imagePreview ? (
                            <img src={imagePreview} alt="Original" className="w-full h-full object-contain" />
                        ) : (
                            <div className="flex flex-col items-center text-purple-800/50">
                                <Upload className="w-12 h-12 mb-2" />
                                <span className="font-bold text-lg">Pick a Picture</span>
                            </div>
                        )}
                        <input
                            type="file"
                            id="magic-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-bold bg-black/50 px-3 py-1 rounded-full">Change</span>
                        </div>
                    </div>

                    {/* Tags Display (Feedback) */}
                    {extractedTags && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap gap-2 justify-center"
                        >
                            {Object.entries(extractedTags).map(([k, v]: any) => (
                                <span key={k} className="bg-yellow-400 text-purple-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {v}
                                </span>
                            ))}
                        </motion.div>
                    )}
                </motion.div>

                {/* Center: Sparkle FAB */}
                <div className="flex flex-col items-center justify-center z-20">
                    <div className="relative">
                        <SparkleVoiceFab
                            ref={sparkleRef}
                            className={cn("w-16 h-16 md:w-20 md:h-20 text-xl relative transform-none shadow-xl", isSpeaking && "sparkle-talking")}
                            autoStart={true} // Auto-Start Greeting as requested
                            onTagsExtracted={handleApprenticeResponse}
                            imageContext={imageFile ? { hasImage: true, description: "User has uploaded a drawing to the canvas." } : null}
                            // @ts-ignore - Will update component to accept this shortly
                            accessCheck={canStartMagicKat}
                        />

                        {/* Helper Text Bubble */}
                        {!extractedTags && (
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-purple-600 px-4 py-2 rounded-xl text-sm font-bold shadow-lg animate-bounce border-2 border-purple-200 z-50 pointer-events-none">
                                Talk to My Apprentice (1 <Zap className="inline w-3 h-3 fill-yellow-500 text-yellow-500" />)
                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-purple-200 transform rotate-45"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Magic Result */}
                <motion.div
                    variants={storybookFlipVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-2 w-full max-w-lg md:w-1/2 h-full justify-center"
                >
                    <div className="bg-gradient-to-r from-yellow-400 to-pink-500 text-white px-4 py-1 rounded-full font-bold text-sm shadow-md flex items-center gap-1">
                        Magic Movie 🎬 (10 <Zap className="inline w-3 h-3 fill-white text-white" />)
                    </div>

                    <div
                        onClick={!isTransforming ? handleTransform : undefined}
                        className={cn(
                            "image-preview-box transition-all duration-500 cursor-pointer hover:scale-[1.02] active:scale-95 relative group",
                            magicResult ? "border-yellow-400 shadow-[0_0_30px_rgba(255,215,0,0.3)]" : "border-purple-300 hover:border-purple-100 shadow-lg"
                        )}
                    >
                        {isTransforming ? (
                            <div className="flex flex-col items-center text-center p-4">
                                <div className="text-4xl animate-bounce mb-2">🐱🖌️</div>
                                <span className="font-bold text-purple-800 text-lg">Apprentice at Work!</span>
                                <p className="text-purple-600/70 text-xs mt-1">Chasing magic particles... (So fast!)</p>
                            </div>
                        ) : magicResult ? (
                            <img src={magicResult} alt="Magic" className="w-full h-full object-contain" />
                        ) : (
                            /* Before & After Demo State */
                            <div className="flex flex-col items-center justify-center w-full h-full relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzM0YjM0YjM0YjM0YjM0YjM0YjM0YjM0YjM0YjM0YjM/3o7aD2saalBwwftBIY/giphy.gif')] bg-cover bg-center grayscale" />
                                <div className="z-10 bg-white/80 backdrop-blur-sm p-4 rounded-2xl flex flex-col items-center border border-purple-200 shadow-xl group-hover:bg-white group-hover:scale-110 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center text-xl">🖼️</div>
                                        <ArrowLeft className="w-4 h-4 text-purple-400 rotate-180" />
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl animate-pulse">🎬</div>
                                    </div>
                                    <span className="font-bold text-purple-800">Command: Animate It!</span>
                                    <p className="text-[10px] text-purple-600 font-bold mt-1">10s to animate</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

            </main>

            {/* --- Bottom Controls --- */}
            {/* --- Bottom Controls REMOVED user request --- */}

            {/* NEW: Welcome Card */}
            <WelcomeCard isVisible={showWelcome && !imageFile} />

            {/* NEW: Quick Chips */}
            <div className="fixed bottom-24 left-0 right-0 z-40 flex flex-col items-center gap-4">
                <QuickChips isVisible={showChips} onSelect={handleChipSelect} />

                {/* Command Input Bar */}
                {imageFile && !isTransforming && (
                    <motion.form
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleCommandSubmit}
                        className="w-full max-w-md px-4"
                    >
                        <div className="relative group">
                            <input
                                type="text"
                                value={commandText}
                                onChange={(e) => setCommandText(e.target.value)}
                                placeholder='Command: "Turn this drawing into a cat."'
                                className="w-full bg-white/10 backdrop-blur-md border-2 border-white/20 rounded-full py-3 px-6 text-white placeholder:text-white/40 focus:outline-none focus:border-yellow-400/50 transition-all font-bold"
                            />
                            <button type="submit" className="absolute right-2 top-1.2 p-2 bg-yellow-400 text-purple-900 rounded-full hover:scale-110 active:scale-95 transition-transform mt-1">
                                <Zap className="w-4 h-4 fill-purple-900" />
                            </button>
                        </div>
                    </motion.form>
                )}
            </div>

            {/* NEW: Magic Overlay */}
            <MagicOverlay isVisible={isTransforming} />

            <BottomNav />
        </div>
    );
};
