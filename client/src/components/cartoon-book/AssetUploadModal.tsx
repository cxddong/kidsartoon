// client/src/components/graphic-novel/AssetUploadModal.tsx

import React, { useState } from 'react';
import { X, Upload, Camera, Sparkles, Check, RotateCcw, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CameraModal } from '../CameraModal';

interface AssetUploadModalProps {
    isOpen: boolean;
    slot: 'slot1' | 'slot2' | 'slot3' | 'slot4';
    slotLabel: string;
    vibe: string;
    userId: string;  // Added
    userPoints: number;
    onClose: () => void;
    onComplete: (asset: { imageUrl: string; description: string; isCoached: boolean; coachFeedback?: string }) => void;
}

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
    isOpen,
    slot,
    slotLabel,
    vibe,
    userId,
    userPoints,
    onClose,
    onComplete
}) => {
    const [step, setStep] = useState<'upload' | 'decision' | 'coaching'>('upload');
    const [uploadedImage, setUploadedImage] = useState<string>('');
    const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
    const [loading, setLoading] = useState(false);
    const [coachingData, setCoachingData] = useState<any>(null);
    const [showCamera, setShowCamera] = useState(false);

    // V2 Improvement Tracking
    const [v2Image, setV2Image] = useState<string>('');
    const [improvementReport, setImprovementReport] = useState<any>(null);
    const [analyzingImprovement, setAnalyzingImprovement] = useState(false);
    const [showV2Upload, setShowV2Upload] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Resize logic: Max 1024px
                    const MAX_SIZE = 1024;
                    let width = img.width;
                    let height = img.height;

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

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG 0.8
                    const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    console.log(`[AssetUpload] Optimized image: ${Math.round(optimizedDataUrl.length / 1024)}KB (Original: ${Math.round((event.target?.result as string).length / 1024)}KB)`);

                    setUploadedImage(optimizedDataUrl);
                    setStep('decision');
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCameraCapture = (imageDataUrl: string) => {
        console.log('[AssetUploadModal] Camera captured image');
        setUploadedImage(imageDataUrl);
        setShowCamera(false);
        setStep('decision');
    };

    const rotateImage = (degrees: number) => {
        setRotation((prev) => (prev + degrees) % 360);
    };

    const applyRotationToImage = (imageDataUrl: string, degrees: number): Promise<string> => {
        return new Promise((resolve) => {
            if (degrees === 0) {
                resolve(imageDataUrl);
                return;
            }

            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(imageDataUrl);
                    return;
                }

                // Swap dimensions for 90/270 degree rotations
                if (degrees === 90 || degrees === 270) {
                    canvas.width = img.height;
                    canvas.height = img.width;
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }

                // Translate and rotate
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((degrees * Math.PI) / 180);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);

                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = imageDataUrl;
        });
    };

    const handleDirectUse = async () => {
        let finalImage = uploadedImage;
        if (rotation !== 0) {
            finalImage = await applyRotationToImage(uploadedImage, rotation);
        }
        onComplete({
            imageUrl: finalImage,
            description: `User-uploaded ${slotLabel}`,
            isCoached: false
        });
        resetAndClose();
    };

    const handleRequestCoaching = async () => {
        console.log('[AssetUploadModal] ✨ handleRequestCoaching FUNCTION CALLED!');
        console.log('[AssetUploadModal] 📊 Checking points:', userPoints, 'Required: 5');
        if (userPoints < 5) {
            alert('Not enough points! You need 5 points for AI coaching.');
            return;
        }

        if (!confirm('🐱 Ask Magic Kat for help?\n\nCost: -5 💎\n\nMagic Kat will analyze your drawing and give you friendly suggestions to make it even better!')) {
            return;
        }

        console.log('[AssetUploadModal] 🔄 Setting loading=true and step=coaching');
        setLoading(true);
        setStep('coaching');

        try {
            console.log('[AssetUploadModal] 🌐 Calling API with:', { userId, slot, vibe, imageLength: uploadedImage?.length });
            const response = await fetch('/api/cartoon-book/coach-asset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    imageUrl: uploadedImage,
                    role: slot,
                    vibe
                })
            });

            console.log('[AssetUploadModal] 📥 API Response status:', response.status);
            const data = await response.json();
            console.log('[AssetUploadModal] 📦 API Response data:', data);

            if (!response.ok) {
                throw new Error(data.error || 'Coaching failed');
            }

            setCoachingData(data);
        } catch (err: any) {
            alert(err.message || 'Failed to get coaching');
            setStep('decision');
        } finally {
            setLoading(false);
        }
    };

    const handleUseWithCoaching = async () => {
        let finalImage = uploadedImage;
        if (rotation !== 0) {
            finalImage = await applyRotationToImage(uploadedImage, rotation);
        }
        onComplete({
            imageUrl: finalImage,
            description: coachingData?.detected || `User-uploaded ${slotLabel}`,
            isCoached: true,
            coachFeedback: coachingData?.feedback
        });
        resetAndClose();
    };

    // V2 Improvement Tracking Handlers
    const handleV2Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Optimize V2 image same as V1
                const MAX_SIZE = 1024;
                let width = img.width;
                let height = img.height;

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

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setV2Image(optimizedDataUrl);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyzeImprovement = async () => {
        if (!uploadedImage || !v2Image) return;

        setAnalyzingImprovement(true);
        try {
            const previousAdvice = coachingData?.suggestions?.join(', ') || 'Improve your artwork';

            const response = await fetch('/api/mentor/analyze-improvement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalImageBase64: uploadedImage,
                    newImageBase64: v2Image,
                    previousAdvice: previousAdvice
                })
            });

            const data = await response.json();
            if (data.success) {
                setImprovementReport(data);
            } else {
                throw new Error(data.message || 'Analysis failed');
            }
        } catch (error: any) {
            alert(error.message || 'Failed to analyze improvement');
        } finally {
            setAnalyzingImprovement(false);
        }
    };

    const handleChooseVersion = async (version: 'v1' | 'v2') => {
        const selectedImage = version === 'v2' ? v2Image : uploadedImage;
        let finalImage = selectedImage;

        if (rotation !== 0) {
            finalImage = await applyRotationToImage(selectedImage, rotation);
        }

        onComplete({
            imageUrl: finalImage,
            description: coachingData?.detected || `User-uploaded ${slotLabel}`,
            isCoached: true,
            coachFeedback: JSON.stringify({
                originalSuggestions: coachingData?.suggestions,
                improvementReport: improvementReport,
                chosenVersion: version,
                improvementScore: improvementReport?.improvement_score
            })
        });
        handleReset();
        onClose();
    };

    const handleReset = () => {
        // Reset to upload step for revision
        setStep('upload');
        setUploadedImage('');
        setRotation(0);
        setCoachingData(null);
    };

    const resetAndClose = () => {
        setStep('upload');
        setUploadedImage('');
        setRotation(0);
        setCoachingData(null);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div key="upload-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-white/20"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-white text-2xl font-black">{slotLabel}</h2>
                        <button onClick={resetAndClose} className="text-white/70 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Step 1: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            <p className="text-white/80 text-center text-lg">Upload or take a photo of your {slotLabel.toLowerCase()}</p>

                            <div className="grid grid-cols-2 gap-4">
                                <label className="flex flex-col items-center justify-center p-8 bg-white/10 rounded-2xl border-2 border-dashed border-white/30 hover:border-white hover:bg-white/20 transition-all cursor-pointer">
                                    <Upload className="w-12 h-12 text-white mb-3" />
                                    <span className="text-white font-bold text-sm">Upload Image</span>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>

                                <button
                                    onClick={() => {
                                        console.log('[AssetUploadModal] Take Photo clicked');
                                        setShowCamera(true);
                                    }}
                                    className="flex flex-col items-center justify-center p-8 bg-white/10 rounded-2xl border-2 border-white/30 hover:border-white hover:bg-white/20 transition-all"
                                >
                                    <Camera className="w-12 h-12 text-white mb-3" />
                                    <span className="text-white font-bold text-sm">Take Photo</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Decision */}
                    {step === 'decision' && uploadedImage && (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <img
                                    src={uploadedImage}
                                    alt="Uploaded"
                                    className="max-h-64 rounded-xl border-4 border-white/20 transition-transform duration-300"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                />
                            </div>

                            {/* Rotation Controls */}
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => rotateImage(-90)}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border-2 border-white/30 transition-all"
                                    title="Rotate Left"
                                >
                                    <RotateCcw className="w-5 h-5 text-white" />
                                </button>
                                <span className="text-white/70 text-sm font-bold">{rotation}°</span>
                                <button
                                    onClick={() => rotateImage(90)}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl border-2 border-white/30 transition-all"
                                    title="Rotate Right"
                                >
                                    <RotateCw className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            <div className="text-center text-white/80 text-sm mb-4">
                                Choose what to do with this image:
                            </div>

                            <div className="space-y-3">
                                {/* Direct Use - Free */}
                                <button
                                    onClick={handleDirectUse}
                                    className="w-full py-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3"
                                >
                                    <Check className="w-6 h-6" />
                                    <div>
                                        <div className="text-lg">Use This Image</div>
                                        <div className="text-sm text-white/60">FREE - Use as-is</div>
                                    </div>
                                </button>

                                {/* AI Coaching - Paid */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        console.log('🔥 BUTTON CLICKED!', { userPoints, userId });
                                        handleRequestCoaching();
                                    }}
                                    disabled={userPoints < 5}
                                    style={{ position: 'relative', zIndex: 10 }}
                                    className="w-full py-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 text-white rounded-2xl font-black text-xl transition-all shadow-2xl disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <Sparkles className="w-7 h-7" />
                                        <span>✨ Magic Coach Review</span>
                                    </div>
                                    <div className="text-sm font-bold text-white/90">-5 💎 Get AI suggestions</div>
                                    <div className="text-xs text-white/70 mt-1">Your points: {userPoints}</div>
                                </button>
                            </div>

                            {userPoints < 5 && (
                                <p className="text-red-300 text-center text-sm">
                                    You need 5 points for AI coaching (you have {userPoints})
                                </p>
                            )}
                        </div>
                    )}

                    {/* Step 3: Coaching Results */}
                    {step === 'coaching' && (
                        <div className="space-y-6">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="w-full max-w-xs mx-auto mb-6">
                                        <div className="h-6 bg-white/10 rounded-full overflow-hidden border border-white/20 relative">
                                            {/* Repeating Indeterminate Animation */}
                                            <motion.div
                                                key="shimmer"
                                                className="absolute top-0 bottom-0 bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full opacity-50"
                                                initial={{ x: "-100%" }}
                                                animate={{ x: "100%" }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 1.5,
                                                    ease: "linear"
                                                }}
                                            />
                                            <motion.div
                                                key="fill"
                                                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "95%" }}
                                                transition={{ duration: 20, ease: "circOut" }}
                                            />
                                        </div>
                                    </div>
                                    <h3 className="text-white font-black text-xl mb-2 animate-pulse">🐱 Magic Kat is thinking...</h3>
                                    <p className="text-white/70">Scanning colors, shapes, and creativity!</p>
                                </div>
                            ) : coachingData && (
                                <>
                                    <div className="bg-white/10 rounded-xl p-6 border border-white/20">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="text-4xl">🐱</div>
                                            <div className="flex-1">
                                                <h3 className="text-white font-black text-lg mb-2">Magic Kat says:</h3>
                                                <p className="text-white/90 leading-relaxed">{coachingData.feedback}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-white/20">
                                            <h4 className="text-white font-bold mb-2">💡 Suggestions:</h4>
                                            <ul className="space-y-2">
                                                {coachingData.suggestions?.map((suggestion: string, i: number) => (
                                                    <li key={`sugg-${i}`} className="text-white/80 flex items-start gap-2">
                                                        <span className="text-yellow-400">•</span>
                                                        <span>{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex justify-center">
                                        <img src={uploadedImage} alt="Your drawing" className="max-h-48 rounded-xl border-2 border-white/20" />
                                    </div>

                                    {/* V2 Improvement Challenge */}
                                    {!showV2Upload && !improvementReport && (
                                        <button
                                            onClick={() => setShowV2Upload(true)}
                                            className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black rounded-xl hover:scale-105 transition-all shadow-lg"
                                        >
                                            🚀 Try Improvement Challenge
                                        </button>
                                    )}

                                    {showV2Upload && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-6 bg-purple-900/30 backdrop-blur-md rounded-2xl border-2 border-purple-400"
                                        >
                                            <h4 className="font-bold text-white mb-4 text-lg flex items-center gap-2">
                                                <Sparkles className="w-5 h-5" />
                                                Upload Your Improved Version
                                            </h4>

                                            {!v2Image ? (
                                                <label className="flex flex-col items-center justify-center w-full h-40 border-4 border-dashed border-purple-300 rounded-xl cursor-pointer hover:bg-purple-800/30 transition-all bg-purple-900/20">
                                                    <input type="file" accept="image/*" onChange={handleV2Upload} className="hidden" />
                                                    <Camera className="w-12 h-12 text-purple-300 mb-2" />
                                                    <span className="text-white font-bold">Upload V2</span>
                                                    <span className="text-purple-300 text-sm mt-1">Try the suggestions!</span>
                                                </label>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="relative">
                                                        <img src={v2Image} className="w-full rounded-xl border-2 border-purple-300" alt="V2" />
                                                        <button
                                                            onClick={() => { setV2Image(''); setImprovementReport(null); }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    {!improvementReport && (
                                                        <button
                                                            onClick={handleAnalyzeImprovement}
                                                            disabled={analyzingImprovement}
                                                            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-purple-500"
                                                        >
                                                            {analyzingImprovement ? '🔄 Analyzing...' : '✨ Analyze Improvement'}
                                                        </button>
                                                    )}

                                                    {improvementReport && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            className="bg-gradient-to-br from-green-400 to-emerald-500 p-6 rounded-2xl shadow-xl"
                                                        >
                                                            <div className="text-center mb-4">
                                                                <h5 className="text-lg font-black text-white mb-2">🎉 Growth Report</h5>
                                                                <div className="text-7xl font-black text-white drop-shadow-lg">
                                                                    {improvementReport.improvement_score}%
                                                                </div>
                                                                <p className="text-white font-bold mt-2 text-sm">
                                                                    {improvementReport.feedback}
                                                                </p>
                                                            </div>

                                                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
                                                                <h6 className="text-xs font-black text-white uppercase mb-2">What You Improved:</h6>
                                                                <ul className="space-y-1">
                                                                    {improvementReport.improvements_detected?.map((item: string, idx: number) => (
                                                                        <li key={idx} className="text-xs flex items-center gap-2 text-white">
                                                                            <Check className="w-4 h-4" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>

                                                            {improvementReport.next_suggestion && (
                                                                <div className="bg-yellow-300 rounded-xl p-3 mb-4">
                                                                    <p className="text-xs font-black text-yellow-900 uppercase">💡 Next Challenge:</p>
                                                                    <p className="text-sm text-yellow-900 mt-1 font-bold">{improvementReport.next_suggestion}</p>
                                                                </div>
                                                            )}

                                                            <div className="grid grid-cols-3 gap-2">
                                                                <button
                                                                    onClick={() => handleChooseVersion('v1')}
                                                                    className="py-2 bg-white/30 hover:bg-white/40 backdrop-blur-sm text-white font-bold rounded-lg text-sm"
                                                                >
                                                                    Use V1
                                                                </button>
                                                                <button
                                                                    onClick={() => handleChooseVersion('v2')}
                                                                    className="py-2 bg-white text-green-600 font-bold rounded-lg text-sm hover:bg-green-50"
                                                                >
                                                                    ✅ Use V2
                                                                </button>
                                                                <button
                                                                    onClick={() => { setV2Image(''); setImprovementReport(null); }}
                                                                    className="py-2 bg-white/30 hover:bg-white/40 backdrop-blur-sm text-white font-bold rounded-lg text-sm"
                                                                >
                                                                    🔄 Retry
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {!improvementReport && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={handleReset}
                                                className="w-full py-3 bg-gray-600/80 backdrop-blur-md text-white rounded-xl font-bold hover:bg-gray-700 transition-colors"
                                            >
                                                🔄 Revise
                                            </button>
                                            <button
                                                onClick={handleUseWithCoaching}
                                                className="py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:scale-105 text-white rounded-xl font-bold transition-all"
                                            >
                                                ✅ Use This
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Camera Modal */}
            <CameraModal
                key="camera-modal"
                isOpen={showCamera}
                onCapture={handleCameraCapture}
                onClose={() => setShowCamera(false)}
            />
        </AnimatePresence>
    );
};
