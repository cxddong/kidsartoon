import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenerationCancelButton from '../components/GenerationCancelButton';
import { cn } from '../lib/utils';
import { BottomNav } from '../components/BottomNav';
import { AuthButton } from '../components/auth/AuthButton';
import { useAuth } from '../context/AuthContext';

import { PictureBookBuilderPanel, type PictureBookBuilderData } from '../components/builder/PictureBookBuilderPanel';
import PictureBookReader from '../components/viewer/PictureBookReader';
import { ImageCropperModal } from '../components/ImageCropperModal';
import catlogoVideo from '../assets/catlogo.mp4';

type Step = 'upload' | 'generating-book' | 'finished';

export const PictureBookPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Default to Picture Book mode
    const [step, setStep] = useState<Step>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [bookData, setBookData] = useState<any>(null);
    const [, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Initializing..."); // Added status message

    const goBack = () => {
        sessionStorage.removeItem('book-result');
        navigate('/generate');
    };

    // Clear stale session on mount to ensure fresh start
    React.useEffect(() => {
        sessionStorage.removeItem('book-result');
        setBookData(null);
        setStep('upload');
    }, []);

    // Cropper State
    const [cropImage, setCropImage] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                alert("File is too large! Please upload under 50MB.");
                return;
            }

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
        const file = new File([blob], "book-input.jpg", { type: "image/jpeg" });

        setImagePreview(url);
        setImageFile(file);
        setCropImage(null);
    };

    const handleGenerate = async (builderData: PictureBookBuilderData) => {
        if (!user?.uid) {
            alert('User ID required! Please log in to create amazing content.');
            return;
        }

        if (!imageFile && !builderData) return; // imageFile might be optional if we supported text-only but we don't yet

        setStep('generating-book');
        setError(null);
        setProgress(0);
        setStatusMessage("Analyzing your image...");

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 98) return prev;
                // Slower progress stages
                if (prev < 20) { setStatusMessage("Analyzing characters..."); return prev + 1; }
                if (prev < 40) { setStatusMessage("Writing story script..."); return prev + 0.5; }
                if (prev < 80) { setStatusMessage("Painting illustrations..."); return prev + 0.2; }
                return prev + 0.1;
            });
        }, 300);

        try {
            // Need to convert File to Base64 first for the new JSON endpoint
            let imageUrl = '';
            if (imageFile) {
                const reader = new FileReader();
                imageUrl = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(imageFile);
                });
            } else {
                throw new Error("Please upload an image first!");
            }

            // Call V2 Endpoint
            const res = await fetch('/api/picturebook/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user?.uid,
                    imageUrl: imageUrl,
                    theme: builderData.theme, // e.g. 'Fairy Tale'
                    pageCount: builderData.pageCount,
                    illustrationStyle: builderData.illustrationStyle,
                    vibe: builderData.vibe,
                    character: builderData.character,
                    storyText: builderData.storyText
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate book');
            }

            const data = await res.json();

            clearInterval(progressInterval);
            setProgress(100);

            // Map Backend Response to Frontend Reader Format
            // Backend: data.story = [{ text_overlay, imageUrl, ... }]
            const mappedBook = {
                title: builderData.theme, // Or derive from story?
                pages: data.story.map((p: any, idx: number) => ({
                    pageNumber: idx + 1,
                    imageUrl: p.imageUrl,
                    narrativeText: p.text_overlay,
                    audioUrl: null // Generated on demand? Or need to add TTS step?
                }))
            };

            setTimeout(() => {
                setBookData(mappedBook);
                // Persistence: Save to session storage
                sessionStorage.setItem('book-result', JSON.stringify(mappedBook));
                setStep('finished');
            }, 500);
        } catch (err: any) {
            console.error("Generation Error:", err);
            clearInterval(progressInterval);

            let userError = 'Failed to create the storybook. Please try again.';
            if (err.message && !err.message.includes('Unexpected token')) {
                userError = err.message;
            }

            setError(userError);
            alert(`Error: ${userError}`);
            setStep('upload');
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-slate-900 to-indigo-900 z-[60] overflow-y-auto">
            {/* Top Center Logo Video Removed */}

            {/* Header */}
            <header className="w-full relative z-50 flex items-center gap-4 p-4 pointer-events-none">
                <button onClick={goBack} className="pointer-events-auto p-2 bg-white/20 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/30 transition-colors">
                    <ArrowRight className="w-6 h-6 text-white rotate-180" />
                </button>
                <div className="flex-1" />
                <div className="pointer-events-auto flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-bold shadow-sm border border-amber-200">
                        <span>✨</span>
                        <span>{user?.points || 0}</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="relative w-full flex flex-col items-center justify-start pt-2 px-4 pb-20">


                <AnimatePresence mode="wait">
                    {/* State 1: Finished (Show Result) */}
                    {step === 'finished' && bookData && (
                        <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10 w-full h-full flex flex-col items-center justify-center overflow-y-auto"
                        >
                            <PictureBookReader
                                title={bookData.title}
                                pages={bookData.pages}
                                onClose={() => {
                                    setStep('upload');
                                    setBookData(null);
                                    sessionStorage.removeItem('book-result');
                                }}
                            />
                        </motion.div>
                    )}

                    {/* State 2: Generating (Loading) */}
                    {step === 'generating-book' && (
                        <motion.div key="loading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative z-10 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl flex flex-col items-center mb-12"
                        >
                            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                            <h3 className="text-2xl font-bold text-slate-800 text-center mb-2">
                                Creating your<br />Picture Book...
                            </h3>
                            <p className="text-slate-500 mb-6 font-medium">Writing story and drawing panels...</p>
                            <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300 ease-out"
                                    style={{ width: `${Math.round(progress)}%` }}
                                />
                            </div>
                            <p className="text-xs text-pink-500 mt-2 font-bold">{Math.round(progress)}% - {statusMessage}</p>

                            <div className="mt-8">
                                <GenerationCancelButton
                                    isGenerating={true}
                                    onCancel={() => navigate('/generate')}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* State 3: Upload / Builder (Default) */}
                    {step === 'upload' && (
                        <motion.div key="upload" className="w-full flex flex-col items-center justify-start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <PictureBookBuilderPanel
                                imageUploaded={!!imageFile}
                                onGenerate={handleGenerate}
                            >
                                {/* Embedded Upload Box */}
                                <div className="relative w-full h-full flex items-center justify-center flex-col overflow-hidden hover:scale-105 transition-all group">
                                    {/* Video Background (Restored) */}
                                    <video
                                        src={catlogoVideo}
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                        disablePictureInPicture
                                    />

                                    {/* File Input as Full Overlay - Direct Click */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />

                                    {imagePreview && (
                                        <img src={imagePreview} alt="Uploaded preview" className="relative z-10 w-full h-full object-cover pointer-events-none" />
                                    )}
                                </div>
                            </PictureBookBuilderPanel>


                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Image Cropper Modal */}
            {cropImage && (
                <ImageCropperModal
                    imageUrl={cropImage}
                    onCrop={handleCropComplete}
                    onCancel={() => setCropImage(null)}
                />
            )}

            <BottomNav />
        </div >
    );
};


