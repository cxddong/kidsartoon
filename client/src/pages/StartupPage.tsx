import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, User as UserIcon, ChevronRight, Check, Sparkles, Baby, Palette } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import maleVideo from '../assets/male.mp4';
import femaleVideo from '../assets/female.mp4';

// Steps
const STEPS = ['Identity', 'About You', 'Interests', 'Welcome'];

// Interests Data
const INTERESTS_LIST = [
    { id: 'robots', label: 'Robots', icon: '🤖' },
    { id: 'animals', label: 'Animals', icon: '🦊' },
    { id: 'space', label: 'Space', icon: '🚀' },
    { id: 'princess', label: 'Princess', icon: '👑' },
    { id: 'dinosaurs', label: 'Dinosaurs', icon: '🦖' },
    { id: 'superheroes', label: 'Heroes', icon: '🦸' },
    { id: 'cars', label: 'Cars', icon: '🏎️' },
    { id: 'magic', label: 'Magic', icon: '✨' },
];

const StartupPage: React.FC = () => {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();

    // Wizard State
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [error, setError] = useState<string | null>(null);

    // Form Data
    const [name, setName] = useState('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [age, setAge] = useState<number | ''>(5);
    const [gender, setGender] = useState<'Boy' | 'Girl' | null>(null);
    const [language, setLanguage] = useState('English');
    const [interests, setInterests] = useState<string[]>([]);

    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Gender Video Refs
    const maleVidRef = useRef<HTMLVideoElement>(null);
    const femaleVidRef = useRef<HTMLVideoElement>(null);

    // Initial Data Load
    useEffect(() => {
        if (user?.profileCompleted && step < 5) {
            // navigate('/home'); 
        }

        if (step === 2 && user?.name && user.name !== 'New Artist' && user.name !== 'Apple User') {
            setName(user.name);
        }
        if (step === 2 && user?.photoURL && !photo) {
            setPhoto(user.photoURL);
        }
    }, [user, navigate, step]);

    // Countdown Logic
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

    // Play/Pause Gender Videos based on selection
    useEffect(() => {
        if (maleVidRef.current) {
            if (gender === 'Boy') maleVidRef.current.play();
            else {
                maleVidRef.current.pause();
                maleVidRef.current.currentTime = 0;
            }
        }
        if (femaleVidRef.current) {
            if (gender === 'Girl') femaleVidRef.current.play();
            else {
                femaleVidRef.current.pause();
                femaleVidRef.current.currentTime = 0;
            }
        }
    }, [gender, step]);

    // Clear error
    useEffect(() => {
        setError(null);
    }, [name, age, gender, interests]);

    // --- Camera Logic ---
    const startCamera = async () => {
        try {
            setShowCamera(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: "user" } });
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error("Camera Error:", err);
            setShowCamera(false);
            setError("Could not access camera. Try uploading instead.");
        }
    };

    const takeSnapshot = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth || 400;
            canvas.height = video.videoHeight || 400;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        setPhoto(URL.createObjectURL(blob));
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
        setError(null);
        if (step === 1) {
            if (!name.trim()) { setError("You need a name, adventurer!"); return; }
            setStep(2);
        } else if (step === 2) {
            if (!age) { setError("How old are you?"); return; }
            if (!gender) { setError("Are you a boy or a girl?"); return; }
            setStep(3);
        } else if (step === 3) {
            await handleSaveProfile();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            setError(null);
        }
    };



    // Compress Image
    const compressImage = (src: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 800;

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
                    }, 'image/jpeg', 0.7);
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

            if (photo && photo.startsWith('blob:')) {
                try {
                    const compressedBlob = await compressImage(photo);
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
                    console.warn("Upload failed", e);
                }
            }

            const savePromise = updateProfile({
                name,
                photoURL: downloadUrl,
                age: Number(age),
                gender: gender || undefined,
                language,
                interests,
                profileCompleted: true,
                uiMode: 'standard', // Defaulting to standard as UI picker is removed
                points: (user.points || 0) + 100
            });

            const saveTimeout = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Firestore Save Timed Out")), 15000)
            );

            await Promise.race([savePromise, saveTimeout]);
            setStep(4);

        } catch (err: any) {
            console.error("Save Error:", err);
            setError("Connection issue. Please try again!");
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



    const renderStep2_Identity = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
            <h2 className="text-xl font-black text-slate-800 mb-4 text-center">Who are you?</h2>

            <div className="flex flex-col items-center gap-4 mb-6">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                        {photo ? (
                            <img src={photo} alt="Me" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-10 h-10 text-slate-300" />
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold shadow-sm relative overflow-hidden group">
                        <Upload className="w-3 h-3 inline mr-1" /> Upload
                        <input type="file" accept="image/*" onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) setPhoto(URL.createObjectURL(f));
                        }} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </button>
                    <button onClick={startCamera} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full text-[10px] font-bold shadow-sm hover:bg-indigo-100">
                        <Camera className="w-3 h-3 inline mr-1" /> Camera
                    </button>
                </div>
            </div>

            <div className="mb-2">
                <label className="text-[10px] font-bold text-slate-400 ml-2 mb-1 block">MY NAME IS</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-xl p-3 font-bold text-base outline-none focus:border-indigo-400"
                    placeholder="Enter your name"
                />
            </div>
        </motion.div>
    );

    const renderStep3_Demographics = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-white ml-2 mb-2 block drop-shadow-md">I AM A ...</label>
                    <div className="flex gap-4 justify-center">
                        {/* Boy Option */}
                        <button
                            onClick={() => setGender('Boy')}
                            className={`relative w-36 h-36 rounded-2xl overflow-hidden border-4 transition-all shadow-lg ${gender === 'Boy'
                                ? 'border-indigo-500 scale-105 ring-4 ring-indigo-200'
                                : 'border-white/50 opacity-80 hover:opacity-100 hover:scale-105'
                                }`}
                        >
                            <video
                                ref={maleVidRef}
                                src={maleVideo}
                                loop muted playsInline
                                controlsList="nodownload noremoteplayback"
                                disablePictureInPicture
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full h-full object-cover"
                            />
                            {gender === 'Boy' && (
                                <div className="absolute top-2 right-2 bg-indigo-500 rounded-full p-1 shadow-md">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </button>

                        {/* Girl Option */}
                        <button
                            onClick={() => setGender('Girl')}
                            className={`relative w-36 h-36 rounded-2xl overflow-hidden border-4 transition-all shadow-lg ${gender === 'Girl'
                                ? 'border-pink-500 scale-105 ring-4 ring-pink-200'
                                : 'border-white/50 opacity-80 hover:opacity-100 hover:scale-105'
                                }`}
                        >
                            <video
                                ref={femaleVidRef}
                                src={femaleVideo}
                                loop muted playsInline
                                controlsList="nodownload noremoteplayback"
                                disablePictureInPicture
                                onContextMenu={(e) => e.preventDefault()}
                                className="w-full h-full object-cover"
                            />
                            {gender === 'Girl' && (
                                <div className="absolute top-2 right-2 bg-pink-500 rounded-full p-1 shadow-md">
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-white ml-2 mb-1 block drop-shadow-md">MY AGE</label>
                        <input
                            type="number"
                            value={age}
                            onChange={e => setAge(Number(e.target.value))}
                            className="w-full bg-white/90 backdrop-blur-sm border-2 border-slate-100 rounded-xl p-3 font-bold text-lg outline-none focus:border-indigo-400 text-center shadow-lg"
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-white ml-2 mb-1 block drop-shadow-md">LANGUAGE</label>
                        <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className="w-full bg-white/90 backdrop-blur-sm border-2 border-slate-100 rounded-xl p-3 font-bold text-sm outline-none focus:border-indigo-400 shadow-lg"
                        >
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>Japanese</option>
                        </select>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    const renderStep4_Interests = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
            <h2 className="text-xl font-black text-slate-800 mb-4 text-center">I Love...</h2>

            <div className="grid grid-cols-4 gap-2 mb-4">
                {INTERESTS_LIST.map(item => (
                    <button
                        key={item.id}
                        onClick={() => toggleInterest(item.id)}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border-2 transition-all aspect-square ${interests.includes(item.id)
                            ? 'bg-pink-50 border-pink-400'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <span className={`text-[9px] font-bold truncate w-full ${interests.includes(item.id) ? 'text-pink-600' : 'text-slate-400'}`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </motion.div>
    );

    const renderStep5_Welcome = () => (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
            <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                <Sparkles className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-3">You're Ready!</h1>
            <p className="text-slate-500 font-medium text-base mb-6">
                Welcome to <strong>KidsArToon</strong>, <br /><span className="text-indigo-600">{name}</span>!
            </p>

            <div className="text-xs font-bold text-slate-400 bg-slate-100 py-1.5 px-3 rounded-full inline-block">
                Launching in {countdown}s...
            </div>
        </motion.div>
    );

    return (
        <div className="fixed inset-0 w-full h-full bg-[#FAFAFA] overflow-hidden">
            {/* Backgrounds */}
            <div className="fixed inset-0 bg-[url('/onboarding_bg.jpg')] bg-cover bg-center z-0 opacity-80" />
            <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-0" />

            {/* Content Wrapper */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm"> {/* Compact Width */}

                    {/* Progress (Compact) */}
                    {step < 4 && (
                        <div className="flex justify-center gap-1.5 mb-4">
                            {[1, 2, 3].map(i => (
                                <button
                                    key={i}
                                    onClick={() => { if (i < step) setStep(i); }}
                                    className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-300/50'}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Main Card */}
                    <div className="relative bg-white/80 backdrop-blur-xl rounded-[32px] shadow-2xl p-6 border border-white">
                        {step === 1 && renderStep2_Identity()}
                        {step === 2 && renderStep3_Demographics()}
                        {step === 3 && renderStep4_Interests()}
                        {step === 4 && renderStep5_Welcome()}

                        {/* Navigation Buttons */}
                        {step < 4 && (
                            <div className="mt-4 flex flex-col gap-2">
                                {/* Error Message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-red-50 text-red-500 text-[10px] font-bold py-2 px-3 rounded-lg text-center"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={handleBack}
                                        disabled={loading || step === 1}
                                        className={`px-4 py-3 rounded-xl font-bold text-sm transition-all ${step === 1 ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        disabled={loading}
                                        className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-black text-lg shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        {loading ? 'Saving...' : (step === 3 ? 'Let\'s Go!' : 'Next')}
                                        {!loading && <ChevronRight className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center">
                    <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-2xl overflow-hidden border-4 border-white/20">
                        <video ref={videoRef} autoPlay playsInline disablePictureInPicture controlsList="nodownload noremoteplayback" className="w-full h-full object-cover transform -scale-x-100" />
                        <canvas ref={canvasRef} className="hidden" />

                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-8 items-center">
                            <button onClick={stopCamera} className="text-white font-bold px-6 py-3 bg-white/10 rounded-full backdrop-blur-md">Cancel</button>
                            <button onClick={takeSnapshot} className="w-16 h-16 bg-white rounded-full border-4 border-slate-300 shadow-xl active:scale-95 transition-transform"></button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StartupPage;
