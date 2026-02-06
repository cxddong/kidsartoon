
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Loader2, Sparkles, AlertCircle, Save, Share2, RotateCcw } from 'lucide-react';
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

    // Tips for waiting
    const LOADING_TIPS = [
        "Sending your drawing to the Magic Factory... 🏭",
        "The elves are sculpting the clay... 🎨",
        "Adding magical sparkle dust... ✨",
        "Almost ready to pop out! 📦",
        "Polishing the surfaces... 🧹"
    ];
    const [tipIndex, setTipIndex] = useState(0);

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
                const errMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to start magic.');
                throw new Error(errMsg);
            }

            setTaskId(data.taskId);

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
                                    <div className="bg-yellow-400/20 text-yellow-200 px-4 py-2 rounded-full text-sm font-semibold border border-yellow-400/30 flex items-center">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Magic Cost: 50 Gems
                                    </div>

                                    {error && (
                                        <div className="bg-red-500/20 text-red-100 px-4 py-2 rounded-lg text-sm border border-red-500/30 flex items-center">
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleGenerate}
                                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center justify-center space-x-2"
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
                            <div className="relative w-64 h-64">
                                <motion.div
                                    className="absolute inset-0 border-8 border-purple-500/30 rounded-full"
                                />
                                <motion.div
                                    className="absolute inset-0 border-8 border-t-purple-400 border-r-pink-400 border-b-transparent border-l-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                />
                                {imagePreview && (
                                    <div className="absolute inset-4 rounded-full overflow-hidden border-4 border-white/20">
                                        <img src={imagePreview} className="w-full h-full object-cover opacity-50 blur-sm" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold animate-pulse">Making Magic...</h3>
                                <p className="text-lg text-pink-200 min-h-[1.5em] transition-opacity duration-500">
                                    {LOADING_TIPS[tipIndex]}
                                </p>
                            </div>

                            {/* Progress Bar (Fake) */}
                            <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                                    animate={{ width: `${progress}%` }}
                                />
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
