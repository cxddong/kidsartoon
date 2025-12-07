import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, User as UserIcon, ChevronRight, Check, Sparkles, ArrowLeft } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

// Steps
const STEPS = ['Identity', 'About You', 'Interests', 'Welcome'];

// Interests Data
const INTERESTS_LIST = [
    { id: 'robots', label: '🤖 Robots' },
    { id: 'animals', label: '🦊 Animals' },
    { id: 'space', label: '🚀 Space' },
    { id: 'princess', label: '👑 Princess' },
    { id: 'dinosaurs', label: '🦖 Dinosaurs' },
    { id: 'superheroes', label: '🦸 Superheroes' },
    { id: 'cars', label: '🏎️ Cars' },
    { id: 'magic', label: '✨ Magic' },
];

const StartupPage: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    // Wizard State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // Form Data
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [age, setAge] = useState<number | ''>('');
    const [gender, setGender] = useState<'Boy' | 'Girl' | null>(null);
    const [language, setLanguage] = useState('English');
    const [interests, setInterests] = useState<string[]>([]);

    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Initial Data Load
    useEffect(() => {
        if (user?.profileCompleted && step < 4) {
            // If already done, just go home (unless we are showing the success screen)
            // navigate('/home'); 
        }
        if (step === 1 && user?.name && user.name !== 'New Artist' && user.name !== 'Apple User') {
            setName(user.name);
        }
        if (step === 1 && user?.photoURL && !photo) {
            setPhoto(user.photoURL);
        }
    }, [user, navigate, step]);

    // Countdown Logic for Step 4
    useEffect(() => {
        if (step === 4) {
            const timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate('/home');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step, navigate]);

    // --- Camera Logic ---
    const startCamera = async () => {
        try {
            setShowCamera(true); // Show modal first
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: "user" } });
            // Small delay to ensure modal DOM exists
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error("Camera Error:", err);
            setShowCamera(false);
            alert("Could not access camera. Try uploading instead.");
        }
    };

    const takeSnapshot = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            // Set canvas to match video dimensions
            canvas.width = video.videoWidth || 400;
            canvas.height = video.videoHeight || 400;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Flip horizontally for mirror effect if needed, but standard is fine
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const url = URL.createObjectURL(blob);
                        setPhoto(url);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.8);
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    // --- Navigation Logic ---
    const handleNext = async () => {
        if (step === 1) {
            if (!name.trim()) return alert("Please enter your name!");
            setStep(2);
        } else if (step === 2) {
            if (!age || !gender) return alert("Please select age and gender!");
            setStep(3);
        } else if (step === 3) {
            // Final Save
            await handleSaveProfile();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    // Helper: Compress Image
    const compressImage = (src: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 800; // Resize to max 800px

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
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Compression failed"));
                    }, 'image/jpeg', 0.7); // 70% Quality
                } else {
                    reject(new Error("Canvas context missing"));
                }
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setLoading(true);

        try {
            let downloadUrl = user.photoURL;

            // 1. Image Upload (Isolated Step)
            if (photo && photo.startsWith('blob:')) {
                try {
                    // Compress first
                    const compressedBlob = await compressImage(photo);

                    // 20s Timeout for upload
                    const uploadPromise = (async () => {
                        const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}.jpg`);
                        const snapshot = await uploadBytes(storageRef, compressedBlob);
                        return await getDownloadURL(snapshot.ref);
                    })();

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Image Upload Timed Out")), 20000)
                    );

                    // @ts-ignore
                    downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
                } catch (e: any) {
                    console.warn("Image upload failed or timed out, skipping...", e);
                    // SILENT FAIL: Do not alert user, just proceed with text save.
                    // This provides a smoother experience on bad networks.
                }
            }

            // 2. Profile Save (Firestore)
            const savePromise = updateProfile({
                name,
                photoURL: downloadUrl,
                age: Number(age),
                gender: gender || undefined,
                language,
                interests,
                profileCompleted: true,
                points: (user.points || 0) + 100
            });

            const saveTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore Save Timed Out")), 15000)
            );

            await Promise.race([savePromise, saveTimeout]);

            setStep(4); // Success!

        } catch (err: any) {
            console.error("Save Error:", err);
            // Only alert if the CRITICAL profile save fails
            alert(`Save Failed: ${err.message}. Please check your internet.`);
        } finally {
            setLoading(false);
        }
    };

    const toggleInterest = (id: string) => {
        setInterests(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // --- Renders ---

    const renderStep1_Identity = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Who are you?</h2>

            <div className="flex flex-col items-center gap-6 mb-8">
                <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                        {photo ? (
                            <img src={photo} alt="Me" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-12 h-12 text-slate-300" />
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-bold shadow-sm relative overflow-hidden group">
                        <Upload className="w-3 h-3 inline mr-1" /> Upload
                        <input type="file" accept="image/*" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setPhoto(URL.createObjectURL(f));
                        }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </button>
                    <button onClick={startCamera} className="px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-xs font-bold shadow-sm hover:bg-indigo-100">
                        <Camera className="w-3 h-3 inline mr-1" /> Camera
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <label className="text-xs font-bold text-slate-400 ml-3 mb-1 block">MY NAME IS</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold text-lg outline-none focus:border-indigo-400"
                    placeholder="Enter your name"
                />
            </div>
        </motion.div>
    );

    const renderStep2_Demographics = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">About You</h2>

            <div className="space-y-6">
                <div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 ml-3 mb-3 block">I AM A ...</label>
                        <div className="flex gap-6 justify-center">
                            {/* Boy Option */}
                            <button
                                onClick={() => setGender('Boy')}
                                className={`relative w-32 h-32 rounded-full overflow-hidden border-4 transition-all shadow-lg ${gender === 'Boy'
                                    ? 'border-indigo-500 scale-110 ring-4 ring-indigo-200'
                                    : 'border-white opacity-70 hover:opacity-100 hover:scale-105'
                                    }`}
                            >
                                <img src="/boy_avatar.jpg" alt="Boy" className="w-full h-full object-cover" />
                                {gender === 'Boy' && (
                                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                                        <Check className="w-10 h-10 text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>

                            {/* Girl Option */}
                            <button
                                onClick={() => setGender('Girl')}
                                className={`relative w-32 h-32 rounded-full overflow-hidden border-4 transition-all shadow-lg ${gender === 'Girl'
                                    ? 'border-pink-500 scale-110 ring-4 ring-pink-200'
                                    : 'border-white opacity-70 hover:opacity-100 hover:scale-105'
                                    }`}
                            >
                                <img src="/girl_avatar.jpg" alt="Girl" className="w-full h-full object-cover" />
                                {gender === 'Girl' && (
                                    <div className="absolute inset-0 bg-pink-500/20 flex items-center justify-center">
                                        <Check className="w-10 h-10 text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 ml-3 mb-1 block">MY AGE</label>
                    <input
                        type="number"
                        value={age}
                        onChange={e => setAge(Number(e.target.value))}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold text-lg outline-none focus:border-indigo-400 text-center"
                        placeholder="0"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-400 ml-3 mb-1 block">LANGUAGE</label>
                    <select
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold text-lg outline-none focus:border-indigo-400"
                    >
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>Chinese</option>
                        <option>Japanese</option>
                    </select>
                </div>
            </div>
        </motion.div>
    );

    const renderStep3_Interests = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
            <h2 className="text-2xl font-black text-slate-800 mb-2 text-center">I Love...</h2>
            <p className="text-center text-slate-400 text-sm mb-6">Pick things you like!</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
                {INTERESTS_LIST.map(item => (
                    <button
                        key={item.id}
                        onClick={() => toggleInterest(item.id)}
                        className={`p-3 rounded-xl font-bold text-sm border-2 transition-all ${interests.includes(item.id)
                            ? 'bg-pink-50 border-pink-400 text-pink-600'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </motion.div>
    );

    const renderStep4_Welcome = () => (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
                <Sparkles className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 mb-4">You're Ready!</h1>
            <p className="text-slate-500 font-medium text-lg mb-8">
                Welcome to Kids Art Tales, <strong>{name}</strong>!
            </p>

            <div className="text-sm font-bold text-slate-400 bg-slate-100 py-2 px-4 rounded-full inline-block">
                Launching in {countdown}s...
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center p-6 bg-[url('/onboarding_bg.jpg')] bg-cover bg-center">
            {/* Absolute Overlay */}
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-0" />

            <div className="relative z-10 w-full max-w-lg">
                {/* Progress Indicators (Clickable) */}
                {step < 4 && (
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3].map(i => (
                            <button
                                key={i}
                                onClick={() => setStep(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-200 hover:bg-slate-300'}`}
                                aria-label={`Go to step ${i}`}
                            />
                        ))}
                    </div>
                )}

                <div className="relative bg-[url('/startup_card_bg.png')] bg-cover bg-no-repeat bg-center rounded-[40px] shadow-2xl p-8 border border-white/50 overflow-hidden">
                    {step === 1 && renderStep1_Identity()}
                    {step === 2 && renderStep2_Demographics()}
                    {step === 3 && renderStep3_Interests()}
                    {step === 4 && renderStep4_Welcome()}

                    {/* Navigation Buttons */}
                    {step < 4 && (
                        <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
                            <button
                                onClick={handleBack}
                                disabled={loading || step === 1}
                                className={`px-6 py-4 rounded-2xl font-bold text-lg transition-all ${step === 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                Back
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={loading}
                                className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? 'Saving...' : (step === 3 ? 'Finish' : 'Next')}
                                {!loading && <ChevronRight className="w-5 h-5" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Camera Modal - Clean and High Z-Index */}
            {showCamera && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
                    <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-lg overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100" />
                        <canvas ref={canvasRef} className="hidden" />

                        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8 items-center">
                            <button onClick={stopCamera} className="text-white font-bold p-4 bg-white/10 rounded-full backdrop-blur-md">Cancel</button>
                            <button onClick={takeSnapshot} className="w-20 h-20 bg-white rounded-full border-4 border-slate-300 shadow-xl"></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StartupPage;
