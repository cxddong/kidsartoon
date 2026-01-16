import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Camera, Sparkles, Image as ImageIcon, Zap, Wand2, Plus, Download, ArrowRight } from 'lucide-react';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { CameraModal } from '../components/CameraModal';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import jumpIntoArtBg from '../assets/jump into art.mp4';

export const JumpIntoArtPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, updateProfile } = useAuth();

    // State
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Mode, 3: Result
    const [generating, setGenerating] = useState(false);

    // Inputs
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const [artFile, setArtFile] = useState<File | null>(null);
    const [artPreview, setArtPreview] = useState<string | null>(null);

    const [selectedMode, setSelectedMode] = useState<'A' | 'B' | null>(null);

    // Result
    const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);

    // Progress tracking
    const [generationProgress, setGenerationProgress] = useState<string>('');


    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const [cameraSlot, setCameraSlot] = useState<'photo' | 'art'>('photo');

    // Points directly from user context (same as Profile page)
    const userPoints = user?.points || 0;


    // Refs
    // const photoInputRef = useRef<HTMLInputElement>(null); // Replaced by distinct handlers
    // const artInputRef = useRef<HTMLInputElement>(null);

    // Helper to convert dataURL to File
    const dataURLtoFile = (dataurl: string, filename: string) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1];
        let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    // Handlers
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setArtFile(file);
            setArtPreview(URL.createObjectURL(file));
        }
    };

    const openCamera = (slot: 'photo' | 'art') => {
        setCameraSlot(slot);
        setShowCamera(true);
    };

    const handleCameraCapture = (dataUrl: string) => {
        const file = dataURLtoFile(dataUrl, `camera_${cameraSlot}_${Date.now()}.jpg`);
        if (cameraSlot === 'photo') {
            setPhotoFile(file);
            setPhotoPreview(dataUrl);
        } else {
            setArtFile(file);
            setArtPreview(dataUrl);
        }
        setShowCamera(false);
    };

    const handleNext = () => {
        if (step === 1 && photoFile && artFile) {
            setStep(2);
        } else if (step === 2 && selectedMode) {
            handleGenerate();
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
                const MAX_SIZE = 1024;

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
                    }, 'image/jpeg', 0.8);
                } else {
                    reject(new Error("Canvas context missing"));
                }
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleGenerate = async () => {
        if (!photoFile || !artFile || !selectedMode || !user) return;

        // Check if admin (admins have unlimited credits)
        const isAdmin = user.email === 'cxd.dong@gmail.com' || user.email?.endsWith('@admin.kat.com');

        // Check credits (15 Magic Stars required) - skip for admins
        if (!isAdmin && userPoints < 15) {
            alert('❌ Not enough Magic Stars! You need 15 ⭐ to create fusion magic. Current balance: ' + userPoints);
            return;
        }

        setGenerating(true);
        setGenerationProgress('Preparing your magical ingredients...');

        try {
            // Deduct credits first (skip for admins)
            if (!isAdmin) {
                setGenerationProgress('✨ Using 15 Magic Stars...');
                const deductResponse = await fetch('/api/points/deduct', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.uid,
                        amount: 15,
                        reason: 'Jump Into Art fusion generation'
                    })
                });

                const deductData = await deductResponse.json();
                if (deductData.success) {
                    console.log('[Credits] Successfully deducted 15 Magic Stars. New balance:', deductData.newBalance);
                    // Update user context to reflect new balance (forces re-render with new points)
                    updateProfile({ points: deductData.newBalance });
                } else {
                    throw new Error('Credit deduction failed: ' + deductData.error);
                }
            } else {
                console.log('[Admin] Skipping credit deduction');
            }

            // 1. Upload photo to Firebase Storage
            setGenerationProgress('📸 Uploading your photo...');
            let photoUrl = '';
            if (photoPreview) {
                const photoBlob = await compressImage(photoPreview);
                const photoRef = ref(storage, `jump-into-art/photos/${user.uid}_${Date.now()}.jpg`);
                const photoSnapshot = await uploadBytes(photoRef, photoBlob);
                photoUrl = await getDownloadURL(photoSnapshot.ref);
            }

            // 2. Upload art to Firebase Storage
            setGenerationProgress('🎨 Uploading your artwork...');
            let artUrl = '';
            if (artPreview) {
                const artBlob = await compressImage(artPreview);
                const artRef = ref(storage, `jump-into-art/arts/${user.uid}_${Date.now()}.jpg`);
                const artSnapshot = await uploadBytes(artRef, artBlob);
                artUrl = await getDownloadURL(artSnapshot.ref);
            }

            // 3. Call backend API
            setGenerationProgress('✨ Creating magical fusion... (This may take 15-25 seconds)');
            const response = await fetch('/api/jump-into-art/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoUrl,
                    artUrl,
                    mode: selectedMode,
                    userId: user.uid
                })
            });

            const data = await response.json();

            if (data.success && data.results) {
                // Save result
                setResultImageUrl(data.results.snapshot);

                // AUTO-SAVE to profile (no manual button needed)
                if (user) {
                    try {
                        await fetch('/api/profile/add-artwork', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: user.uid,
                                imageUrl: data.results.snapshot,
                                contentType: 'jump_into_art',
                                mode: selectedMode,
                                isPrivate: false,
                                metadata: {
                                    originalPhotoUrl: photoUrl,
                                    originalArtUrl: artUrl,
                                    fusionMode: selectedMode === 'A' ? 'Jump Into Drawing' : 'Bring Art to Life'
                                }
                            })
                        });
                        console.log('[JumpIntoArt] ✅ Auto-saved to profile');
                    } catch (saveError) {
                        console.error('[JumpIntoArt] Failed to auto-save:', saveError);
                        // Don't block user flow if save fails
                    }
                }

                setStep(3);
            } else {
                console.error('Generation failed:', data.error);
                alert('生成失败，请重试');
            }
        } catch (error) {
            console.error('Generation error:', error);
            alert('发生错误，请重试');
        } finally {
            setGenerating(false);
        }
    };

    // Handler: Download Result Image
    const handleDownload = () => {
        if (!resultImageUrl) return;

        const link = document.createElement('a');
        link.href = resultImageUrl;
        link.download = `jump-into-art-${selectedMode}-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            {/* Background Video */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <video
                    src={jumpIntoArtBg}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Header */}
            <div className="relative z-10 px-6 py-4 flex items-center justify-between">
                <button onClick={() => navigate('/home')} className="p-2 hover:bg-white/50 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-slate-700" />
                </button>
                <div className="text-center">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent inline-block px-6 py-2 bg-white/20 backdrop-blur-sm rounded-2xl">
                        Jump Into Art
                    </h1>
                </div>
                {/* Points Display */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full border-2 border-purple-200">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-sm text-slate-800">{userPoints}</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 relative z-10 container mx-auto px-4 py-8 max-w-5xl">
                <AnimatePresence mode="wait">
                    {/* STEP 1: UPLOAD */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col h-full"
                        >
                            <div className="text-center mb-8 inline-block mx-auto">
                                <p className="text-lg md:text-xl text-white font-bold bg-black/30 backdrop-blur-sm px-6 py-3 rounded-2xl">Combine your photo with your drawing!</p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-8 items-stretch justify-center mb-8">
                                {/* Left: Reality */}
                                <div className="flex-1 bg-white/30 backdrop-blur-md rounded-3xl border-4 border-dashed border-slate-300 hover:border-purple-400 p-6 flex flex-col items-center justify-center transition-all group hover:shadow-xl relative overflow-hidden min-h-[350px]">
                                    {photoPreview ? (
                                        <>
                                            <img src={photoPreview} className="absolute inset-0 w-full h-full object-cover rounded-[20px] opacity-90 group-hover:opacity-100 transition-opacity" />
                                            {/* Overlay Controls */}
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                                                <label className="cursor-pointer bg-white text-slate-800 px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                                                    <Upload size={18} />
                                                    Change Photo
                                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                                </label>
                                                <button onClick={() => openCamera('photo')} className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                                                    <Camera size={18} />
                                                    Retake
                                                </button>
                                            </div>
                                            <div className="absolute bottom-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">You</div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 w-full">
                                            <div className="text-center">
                                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                                                    <Camera className="w-10 h-10 text-purple-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-700">Upload Photo</h3>
                                                <p className="text-sm text-slate-400 mt-1">A clear photo of you</p>
                                            </div>

                                            <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                                <button
                                                    onClick={() => openCamera('photo')}
                                                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 hover:scale-105 transition-all shadow-md"
                                                >
                                                    <Camera size={18} />
                                                    Take Photo
                                                </button>
                                                <label className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-200 transition-colors">
                                                    <Upload size={18} />
                                                    Upload File
                                                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Generate Button - Desktop: Center Between Boxes, Mobile: Hidden */}
                                <div className="hidden md:flex items-center justify-center">
                                    <button
                                        onClick={handleNext}
                                        disabled={!photoFile || !artFile}
                                        className="px-8 py-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-lg shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex flex-col items-center gap-2"
                                    >
                                        <ArrowRight className="w-8 h-8" />
                                        <span className="text-sm">Next</span>
                                    </button>
                                </div>

                                {/* Right: Imagination */}
                                <div className="flex-1 bg-white/30 backdrop-blur-md rounded-3xl border-4 border-dashed border-slate-300 hover:border-blue-400 p-6 flex flex-col items-center justify-center transition-all group hover:shadow-xl relative overflow-hidden min-h-[350px]">
                                    {artPreview ? (
                                        <>
                                            <img src={artPreview} className="absolute inset-0 w-full h-full object-cover rounded-[20px] opacity-90 group-hover:opacity-100 transition-opacity" />
                                            {/* Overlay Controls */}
                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4">
                                                <label className="cursor-pointer bg-white text-slate-800 px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                                                    <Upload size={18} />
                                                    Change Art
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleArtUpload} />
                                                </label>
                                                <button onClick={() => openCamera('art')} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2">
                                                    <Camera size={18} />
                                                    Retake
                                                </button>
                                            </div>
                                            <div className="absolute bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">Art</div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-6 w-full">
                                            <div className="text-center">
                                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                                                    <Wand2 className="w-10 h-10 text-blue-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-700">Upload Art</h3>
                                                <p className="text-sm text-slate-400 mt-1">Your drawing or doodle</p>
                                            </div>

                                            <div className="flex flex-col gap-3 w-full max-w-[200px]">
                                                <button
                                                    onClick={() => openCamera('art')}
                                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 hover:scale-105 transition-all shadow-md"
                                                >
                                                    <Camera size={18} />
                                                    Scan Art
                                                </button>
                                                <label className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-200 transition-colors">
                                                    <Upload size={18} />
                                                    Upload File
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleArtUpload} />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Generate Button - Mobile: Bottom of Page */}
                            <button
                                onClick={handleNext}
                                disabled={!photoFile || !artFile}
                                className="md:hidden w-full px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-20"
                            >
                                Next Step
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: MODE SELECTION */}
                    {
                        step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col h-full"
                            >
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Choose Your Magic</h2>
                                    <p className="text-slate-500">How do you want to blend these worlds?</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto w-full">
                                    {/* Mode A */}
                                    <button
                                        onClick={() => setSelectedMode('A')}
                                        className={cn(
                                            "relative p-6 rounded-3xl border-4 transition-all text-left group overflow-hidden h-64 flex flex-col justify-end",
                                            selectedMode === 'A' ? "border-purple-500 bg-purple-50 ring-4 ring-purple-200" : "border-slate-200 bg-white hover:border-purple-300"
                                        )}
                                    >
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600')] bg-cover bg-center" />
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center mb-4 shadow-md">
                                                <ImageIcon className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800">Jump Into Drawing</h3>
                                            <p className="text-sm text-slate-500 mt-2">You enter the world of your art. You become a cartoon!</p>
                                        </div>
                                        {selectedMode === 'A' && <div className="absolute top-4 right-4 bg-purple-500 text-white p-1 rounded-full"><Sparkles size={16} /></div>}
                                    </button>

                                    {/* Mode B */}
                                    <button
                                        onClick={() => setSelectedMode('B')}
                                        className={cn(
                                            "relative p-6 rounded-3xl border-4 transition-all text-left group overflow-hidden h-64 flex flex-col justify-end",
                                            selectedMode === 'B' ? "border-blue-500 bg-blue-50 ring-4 ring-blue-200" : "border-slate-200 bg-white hover:border-blue-300"
                                        )}
                                    >
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?q=80&w=600')] bg-cover bg-center" />
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-4 shadow-md">
                                                <Zap className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800">Bring Art to Life</h3>
                                            <p className="text-sm text-slate-500 mt-2">Your drawing jumps into reality next to you!</p>
                                        </div>
                                        {selectedMode === 'B' && <div className="absolute top-4 right-4 bg-blue-500 text-white p-1 rounded-full"><Sparkles size={16} /></div>}
                                    </button>
                                </div>

                                <button
                                    onClick={handleNext}
                                    disabled={!selectedMode}
                                    className="mx-auto px-12 py-4 bg-slate-800 text-white rounded-full font-bold text-xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
                                >
                                    {generating ? "Generating..." : "Cast Spell - 15 ⭐"}
                                </button>
                            </motion.div>
                        )
                    }

                    {/* STEP 3: RESULT - THREE-IMAGE COMPARISON */}
                    {
                        step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col h-full items-center overflow-y-auto"
                            >
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-6">
                                    ✨ Magic Happened!
                                </h2>

                                {/* THREE-IMAGE COMPARISON LAYOUT (三图对比) */}
                                <div className="w-full max-w-6xl px-4 mb-8">
                                    {/* Mobile: Stacked Layout */}
                                    <div className="md:hidden flex flex-col gap-6">
                                        {/* Center: Magic Result (Large) */}
                                        <div className="w-full">
                                            <p className="text-center text-sm font-bold text-purple-600 mb-2">🪄 Magic Result</p>
                                            <div className="relative w-full aspect-[3/4] bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-gradient-to-r from-purple-500 to-pink-500">
                                                {resultImageUrl ? (
                                                    <img
                                                        src={resultImageUrl}
                                                        className="w-full h-full object-cover"
                                                        alt="Magic Result"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                        <p className="text-slate-400">Generating...</p>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                                                    <p className="text-white font-medium">Your magical fusion!</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Left & Right: Original Images (Small) */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-center text-xs font-semibold text-slate-600 mb-2">📸 Your Photo</p>
                                                <div className="relative w-full aspect-[3/4] bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-slate-200">
                                                    {photoPreview && (
                                                        <img src={photoPreview} className="w-full h-full object-cover" alt="Original Photo" />
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-center text-xs font-semibold text-slate-600 mb-2">🎨 Your Art</p>
                                                <div className="relative w-full aspect-[3/4] bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-slate-200">
                                                    {artPreview && (
                                                        <img src={artPreview} className="w-full h-full object-cover" alt="Original Art" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desktop: Three-Column Layout */}
                                    <div className="hidden md:grid md:grid-cols-7 gap-6 items-center">
                                        {/* Left: Original Photo (Small) */}
                                        <div className="col-span-2">
                                            <p className="text-center text-sm font-semibold text-slate-600 mb-2">📸 Your Photo</p>
                                            <div className="relative w-full aspect-[3/4] bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-slate-200 hover:scale-105 transition-transform">
                                                {photoPreview && (
                                                    <img src={photoPreview} className="w-full h-full object-cover" alt="Original Photo" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Center: Magic Result (Large) */}
                                        <div className="col-span-3">
                                            <p className="text-center text-lg font-bold text-purple-600 mb-2">🪄 Magic Result</p>
                                            <div className="relative w-full aspect-[3/4] bg-white rounded-3xl shadow-2xl overflow-hidden border-8 border-purple-500 animate-pulse-slow">
                                                {resultImageUrl ? (
                                                    <img
                                                        src={resultImageUrl}
                                                        className="w-full h-full object-cover"
                                                        alt="Magic Result"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                        <div className="text-center">
                                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                                                            <p className="text-slate-400">Creating magic...</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
                                                    <p className="text-white font-medium">✨ Your magical fusion!</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Original Art (Small) */}
                                        <div className="col-span-2">
                                            <p className="text-center text-sm font-semibold text-slate-600 mb-2">🎨 Your Art</p>
                                            <div className="relative w-full aspect-[3/4] bg-white rounded-2xl shadow-lg overflow-hidden border-4 border-slate-200 hover:scale-105 transition-transform">
                                                {artPreview && (
                                                    <img src={artPreview} className="w-full h-full object-cover" alt="Original Art" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => {
                                            setStep(1);
                                            setResultImageUrl(null);
                                            setSelectedMode(null);
                                        }}
                                        className="px-6 py-3 bg-white border-2 border-slate-200 rounded-full font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        disabled={!resultImageUrl}
                                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full font-bold shadow-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download
                                    </button>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >

                {/* Loading Overlay with Progress */}
                {
                    generating && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center px-4">
                            <div className="w-24 h-24 mb-4 relative">
                                <div className="absolute inset-0 border-4 border-purple-200 rounded-full animate-ping" />
                                <div className="absolute inset-2 border-4 border-t-purple-600 border-r-blue-600 border-b-purple-600 border-l-blue-600 rounded-full animate-spin" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Creating Magic...</h3>
                            {generationProgress && (
                                <p className="text-sm text-slate-600 text-center max-w-md animate-pulse">
                                    {generationProgress}
                                </p>
                            )}
                            <div className="mt-4 flex items-center gap-2 text-sm text-purple-600">
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                <span>Used 15 Magic Stars ⭐</span>
                            </div>
                        </div>
                    )
                }
            </div >

            {/* CAMERA MODAL */}
            < CameraModal
                isOpen={showCamera}
                onClose={() => setShowCamera(false)}
                onCapture={handleCameraCapture}
            />

            <MagicNavBar />
        </div >
    );
};
