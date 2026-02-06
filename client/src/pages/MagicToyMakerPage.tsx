
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Loader2, Sparkles, AlertCircle, Save, Share2, RotateCcw, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FileUpload from '../components/common/FileUpload';

// Extend JSX for model-viewer
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': any;
        }
    }
}

const BASE_COST = 80; // Standard cost for 3D generation
const ESTIMATED_TIME = 120; // Estimated time in seconds (2 minutes average)

export const MagicToyMakerPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // States: 'upload' | 'generating' | 'viewing'
    const [step, setStep] = useState<'upload' | 'generating' | 'viewing'>('upload');
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [userPoints, setUserPoints] = useState<number | null>(null);
    const [userPlan, setUserPlan] = useState<string>('free');
    const [elapsedTime, setElapsedTime] = useState(0); // Elapsed time in seconds

    // Calculate effective cost based on plan
    let effectiveCost = BASE_COST;
    if (userPlan === 'basic') effectiveCost = 50;
    if (userPlan === 'pro' || userPlan === 'yearly_pro' || userPlan === 'admin') effectiveCost = 40;

    // Tips for waiting
    const LOADING_TIPS = [
        "Sending your drawing to the Magic Factory... 🏭",
        "The elves are sculpting the clay... 🎨",
        "Adding magical sparkle dust... ✨",
        "Almost ready to pop out! 📦",
        "Polishing the surfaces... 🧹"
    ];
    const [tipIndex, setTipIndex] = useState(0);

    // Fetch user points on mount
    useEffect(() => {
        const fetchPoints = async () => {
            if (!user?.uid) return;
            try {
                const res = await fetch('/api/points/balance', {
                    headers: { 'x-user-id': user.uid }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUserPoints(data.points);
                    if (data.plan) setUserPlan(data.plan);
                }
            } catch (err) {
                console.error('Failed to fetch points:', err);
            }
        };
        fetchPoints();
    }, [user?.uid]);

    // Elapsed time tracker
    useEffect(() => {
        let timer: any;
        if (step === 'generating') {
            setElapsedTime(0);
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [step]);

    // Tip rotation
    useEffect(() => {
        if (step === 'generating') {
            const interval = setInterval(() => {
                setTipIndex(prev => (prev + 1) % LOADING_TIPS.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [step]);

    // Polling Logic
    useEffect(() => {
        let pollInterval: any;

        if (step === 'generating' && taskId) {
            pollInterval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/media/tasks/${taskId}`);
                    if (!res.ok) throw new Error('Status check failed');

                    const data = await res.json();
                    console.log('Poll Status:', data.status);

                    if (data.status === 'SUCCEEDED') {
                        // Success!
                        setModelUrl(data.modelUrl);
                        setStep('viewing');
                        clearInterval(pollInterval);
                    } else if (data.status === 'FAILED') {
                        setError('Oh no! The magic failed. Please try a simpler drawing.');
                        setStep('upload');
                        clearInterval(pollInterval);
                    } else {
                        // Still running
                        // Simulate progress if not provided
                        setProgress(prev => Math.min(prev + 5, 95));
                    }
                } catch (e) {
                    console.error('Poll error', e);
                }
            }, 3000);
        }

        return () => clearInterval(pollInterval);
    }, [step, taskId]);

    const handleFileSelect = (file: File) => {
        setSelectedImage(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
        setError(null);
    };

    const handleGenerate = async () => {
        if (!selectedImage || !user) return;

        // Check if user has enough points
        if (userPoints !== null && userPoints < effectiveCost) {
            setError(`Not enough gems! You need ${effectiveCost} gems but only have ${userPoints}. Please purchase more gems to continue.`);
            return;
        }

        try {
            setStep('generating');
            setProgress(10);
            setError(null);

            const formData = new FormData();
            formData.append('image', selectedImage);
            formData.append('userId', user.uid);
            formData.append('voice', 'custom_toy'); // Dummy
            formData.append('customVoiceId', 'toy_maker_v1');

            const res = await fetch('/api/media/image-to-3d', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                // Check for point error
                if (data.errorCode === 'NOT_ENOUGH_POINTS') {
                    throw new Error(`Not enough gems! You need ${effectiveCost} gems. Please purchase more.`);
                }
                const errMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to start magic.');
                throw new Error(errMsg);
            }

            setTaskId(data.taskId);
            // Deduct points from local state (will be refreshed later)
            if (userPoints !== null) {
                setUserPoints(prev => (prev !== null ? prev - effectiveCost : 0));
            }

        } catch (e: any) {
            console.error(e);
            setError(e.message);
            setStep('upload');
        }
    };

    const handleReset = () => {
        setStep('upload');
        setSelectedImage(null);
        setImagePreview(null);
        setModelUrl(null);
        setTaskId(null);
        setProgress(0);
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden font-sans">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 z-0" />

            {/* Nav */}
            <div className="relative z-10 p-4 flex items-center">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="ml-4 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300">
                    Magic Toy Maker 🧸
                </h1>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-6 max-w-4xl h-[80vh] flex flex-col items-center justify-center">

                <AnimatePresence mode="wait">

                    {step === 'upload' && (
                        <motion.div
                            key="upload"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-lg bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl flex flex-col items-center"
                        >
                            <h2 className="text-3xl font-bold mb-2 text-center">Draw it, Pop it!</h2>
                            <p className="text-center text-white/70 mb-6">Upload a drawing to turn it into a REAL 3D Toy!</p>

                            <FileUpload
                                onFileSelect={handleFileSelect}
                                maxSize={10}
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                                className="w-full aspect-square max-h-[300px] mb-6"
                            />

                            {imagePreview && (
                                <motion.div className="w-full flex flex-col items-center space-y-4">
                                    {/* User Points Balance */}
                                    {userPoints !== null && (
                                        <div className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-3 rounded-xl border border-purple-400/30">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white/80 text-sm">Your Balance:</span>
                                                <span className="text-yellow-200 font-bold text-lg">{userPoints} Gems</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cost & Time Warning */}
                                    <div className="w-full space-y-2">
                                        <div className="bg-yellow-400/20 text-yellow-200 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-400/30 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Magic Cost: {effectiveCost < BASE_COST ? (
                                                <span className="flex items-center">
                                                    <span className="line-through opacity-60 mr-2 text-xs">{BASE_COST}</span>
                                                    <span className="font-bold">{effectiveCost} Gems</span>
                                                    <span className="ml-1 text-xs bg-white/20 px-1 rounded">PRO</span>
                                                </span>
                                            ) : (
                                                <span>{BASE_COST} Gems</span>
                                            )}
                                        </div>
                                        <div className="bg-blue-400/20 text-blue-200 px-4 py-2 rounded-lg text-xs border border-blue-400/30 flex items-center">
                                            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                                            <span>⏱️ 3D generation takes 1-3 minutes due to complex calculations. Please be patient!</span>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="w-full bg-red-500/20 text-red-100 px-4 py-3 rounded-lg text-sm border border-red-500/30 flex items-start">
                                            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p>{error}</p>
                                                {error.includes('Not enough gems') && (
                                                    <button
                                                        onClick={() => navigate('/subscription')}
                                                        className="mt-2 text-xs underline hover:text-red-200"
                                                    >
                                                        Purchase More Gems →
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleGenerate}
                                        disabled={userPoints !== null && userPoints < effectiveCost}
                                        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all flex items-center justify-center space-x-2 ${userPoints !== null && userPoints < effectiveCost
                                                ? 'bg-gray-500 cursor-not-allowed opacity-50'
                                                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:scale-105'
                                            }`}
                                    >
                                        <span>Bring it to Life!</span>
                                        <Sparkles className="w-5 h-5 fill-white" />
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {step === 'generating' && (
                        <motion.div
                            key="generating"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center text-center space-y-8"
                        >
                            {/* Circular Progress Indicator */}
                            <div className="relative w-72 h-72">
                                {/* Background Ring */}
                                <div className="absolute inset-0 border-8 border-purple-950/50 rounded-full" />

                                {/* Animated Spinning Gradient Ring */}
                                <motion.div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: 'conic-gradient(from 0deg, #f093fb 0%, #f5576c 30%, #4facfe 60%, #f093fb 100%)',
                                    }}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                >
                                    <div className="w-full h-full rounded-full" style={{
                                        maskImage: 'radial-gradient(circle, transparent 48%, black 50%)',
                                        WebkitMaskImage: 'radial-gradient(circle, transparent 48%, black 50%)'
                                    }} />
                                </motion.div>

                                {/* Center Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    {imagePreview && (
                                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 mb-4">
                                            <img src={imagePreview} className="w-full h-full object-cover opacity-60 blur-sm" alt="Preview" />
                                        </div>
                                    )}

                                    {/* Elapsed Time */}
                                    <div className="text-3xl font-bold text-white drop-shadow-lg">
                                        {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
                                    </div>
                                    <div className="text-sm text-purple-200 mt-1">
                                        Est. ~{Math.floor(ESTIMATED_TIME / 60)}:{String(ESTIMATED_TIME % 60).padStart(2, '0')}
                                    </div>
                                </div>
                            </div>

                            {/* Status Text */}
                            <div className="space-y-3">
                                <motion.h3
                                    className="text-2xl font-bold"
                                    animate={{ opacity: [1, 0.7, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                >
                                    Making Magic... ✨
                                </motion.h3>
                                <p className="text-lg text-pink-200 min-h-[1.5em] transition-opacity duration-500">
                                    {LOADING_TIPS[tipIndex]}
                                </p>
                                <p className="text-xs text-white/50">
                                    Processing complex 3D calculations...
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {step === 'viewing' && modelUrl && (
                        <motion.div
                            key="viewing"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full h-full flex flex-col items-center"
                        >
                            <div className="w-full flex-1 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
                                <model-viewer
                                    src={modelUrl}
                                    ios-src="" // TODO: Add USDZ conversion if needed for AR on iOS
                                    poster={imagePreview}
                                    alt="A 3D model of your toy"
                                    shadow-intensity="1"
                                    camera-controls
                                    auto-rotate
                                    ar
                                    style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }} // Inline style works better
                                >
                                </model-viewer>

                                {/* Controls Overlay */}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4 pointer-events-none">
                                    <button
                                        className="pointer-events-auto p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/20 transition"
                                        title="Rotate"
                                        onClick={() => {
                                            const mb = document.querySelector('model-viewer') as any;
                                            if (mb) mb.resetTurntableRotation();
                                        }}
                                    >
                                        <RotateCcw className="w-6 h-6 text-white" />
                                    </button>
                                    <button
                                        className="pointer-events-auto px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold shadow-lg hover:scale-105 transition flex items-center"
                                        onClick={() => window.open(modelUrl, '_blank')}
                                    >
                                        <Save className="w-5 h-5 mr-2" />
                                        Download 3D
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleReset}
                                className="mt-8 text-white/50 hover:text-white flex items-center hover:underline"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Make Another One
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default MagicToyMakerPage;
