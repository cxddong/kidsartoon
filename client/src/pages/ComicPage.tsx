import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GenerationCancelButton from '../components/GenerationCancelButton';
import { cn } from '../lib/utils';
import { BottomNav } from '../components/BottomNav';
import { AuthButton } from '../components/auth/AuthButton';
import ImageModal, { type ImageRecord } from '../components/history/ImageModal';
import { useAuth } from '../context/AuthContext';

import { ComicBuilderPanel, type ComicBuilderData } from '../components/builder/ComicBuilderPanel';
import comicVideo from '../assets/comic.mp4';
import magicBookVideo from '../assets/magicbook.mp4';

export const ComicPage: React.FC = () => {
    // ... (existing hooks)
    const navigate = useNavigate();
    const { user } = useAuth();

    const [step, setStep] = useState<'upload' | 'generating' | 'finished'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [resultData, setResultData] = useState<any>(null);
    const [, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [expandedImage, setExpandedImage] = useState<ImageRecord | null>(null);

    // Architecture C: Text-First Editable Overlays
    const [editableCaptions, setEditableCaptions] = useState<string[]>([]);

    const goBack = () => {
        if (imageFile || imagePreview || resultData) {
            const confirmed = window.confirm("Are you sure you want to go back? Your current progress might be lost.");
            if (!confirmed) return;
        }
        navigate('/generate');
    };

    // Persistence: Restore state on mount
    React.useEffect(() => {
        const saved = sessionStorage.getItem('comic-result');
        const savedReview = sessionStorage.getItem('comic-review');
        const savedPreview = sessionStorage.getItem('comic-preview'); // RESTORE PREVIEW

        if (saved) {
            try {
                const data = JSON.parse(saved);
                setResultData(data);
                setStep('finished');

                if (savedReview) {
                    const reviewData = JSON.parse(savedReview);
                    setAiReview(prev => ({ ...prev, text: reviewData.text, shown: false }));
                }

                if (savedPreview) {
                    setImagePreview(savedPreview); // Restore the image persistence
                }

                // Restore editable captions if available
                if (data.storyCaptions) {
                    setEditableCaptions(data.storyCaptions);
                } else if (data.pages) {
                    setEditableCaptions(data.pages.map((p: any) => p.text || p.text_overlay || p.narrativeText));
                }
            } catch (e) {
                console.error("Failed to restore comic state", e);
                sessionStorage.removeItem('comic-result');
                sessionStorage.removeItem('comic-review');
                sessionStorage.removeItem('comic-preview');
            }
        }

        // Handle Sparkle Tags from Navigation
        // @ts-ignore
        if (location.state && location.state.sparkleTags) {
            // @ts-ignore
            console.log("ComicPage received tags from nav:", location.state.sparkleTags);
            // Dispatch with a small delay to ensure listeners are mounted
            setTimeout(() => {
                // @ts-ignore
                window.dispatchEvent(new CustomEvent('sparkle-update', { detail: location.state.sparkleTags }));
            }, 800);
        }
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                alert("File is too large! Please upload under 50MB.");
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                // Saving on generate is cleaner usually, but saving here prevents loss if user refreshes before invalid input. 
                // Let's save on GENERATE success to be consistent with result.
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async (builderData: ComicBuilderData) => {
        if (!imageFile) return;

        // Construct Prompt
        // Create a 4-panel comic based on the uploaded image. Story Type: {{ComicType}} Visual Style: {{VisualStyle}} Characters: {{CharacterFocus}}
        // Personalization: Inject User Interests
        const userInterestsStr = user?.interests && user.interests.length > 0
            ? ` Incorporate elements related to the child's interests: ${user.interests.join(', ')}.`
            : "";

        const compositePrompt = `
        Create a 4-panel comic strip based on the uploaded image.
        
        CRITICAL STYLE INSTRUCTIONS:
        - Visual Style: ${builderData.visualStyle || "3d render, high quality, cute, pixar style, bright colors"} (Apply this style STRICTLY to all panels)
        - Mood/Genre: ${builderData.storyType || "Open Interpretation"}
        - Main Character Role: ${builderData.characters.find(c => ['Dinosaur', 'Space', 'Hero', 'Robot', 'Fairy Tale', 'Car'].includes(c)) || 'Child'} (Center the story around this role)
        - Other Characters: ${builderData.characters.join(', ')}
        ${userInterestsStr}
        
        Narrative Structure:
        1. Setup
        2. Action
        3. Twist
        4. Conclusion
        
        Output only the comic panels.
        `.trim();

        setStep('generating');
        setError(null);
        setProgress(0);

        const progressInterval = setInterval(() => {
            setProgress(prev => (prev >= 98 ? prev : (prev < 90 ? prev + 0.5 : prev + 0.1)));
        }, 100);

        try {
            const formData = new FormData();
            formData.append('cartoonImage', imageFile); // Using update endpoint logic if needed or standard
            // We use generate-picture-book endpoint for comics too (as established in previous turns) or separate if available.
            // Previous code used generate-picture-book.
            formData.append('prompt', compositePrompt);
            formData.append('userId', user?.uid || 'demo-user');
            formData.append('pageCount', '4');

            // NEW: Use Magic Comic Endpoint (Creative Director Flow)
            const res = await fetch('/api/media/generate-magic-comic', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to generate comic');
            const data = await res.json();

            clearInterval(progressInterval);
            setProgress(100);
            setTimeout(() => {
                // Attach Builder Tags to Result Data for Persistence & Display
                const finalData = {
                    ...data,
                    tags: {
                        storyType: builderData.storyType,
                        visualStyle: builderData.visualStyle,
                        characters: builderData.characters
                    }
                };
                setResultData(finalData);

                // Architecture C: Initialize editable captions
                if (finalData.storyCaptions) {
                    setEditableCaptions(finalData.storyCaptions);
                } else if (finalData.pages) {
                    setEditableCaptions(data.pages.map((p: any) => p.text || p.text_overlay || p.narrativeText));
                }

                // Persistence: Save to session storage
                sessionStorage.setItem('comic-result', JSON.stringify(finalData));
                if (imagePreview) {
                    try { sessionStorage.setItem('comic-preview', imagePreview); } catch (e) { }
                }
                setStep('finished');
            }, 500);
        } catch (err: any) {
            console.error(err);
            clearInterval(progressInterval);
            setError('Failed to create the comic. Please try again.');
            alert(`Error: ${err.message}`);
            setStep('upload');
        }
    };

    const [aiReview, setAiReview] = useState<{ loading: boolean, text: string | null, shown: boolean }>({ loading: false, text: null, shown: false });
    const [isPlaying, setIsPlaying] = useState(false);

    const handleAiReview = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!resultData) return;

        // Check if we already have the review (Don't regenerate)
        if (aiReview.text) {
            setAiReview(prev => ({ ...prev, shown: true }));
            return;
        }

        // Use the Original Uploaded Image for analysis (as requested by user)
        // Fallback to result if for some reason original is missing, but prioritize original.
        const imageUrl = imagePreview || resultData.gridImageUrl || resultData.coverImageUrl || resultData.pages?.[0]?.imageUrl;
        if (!imageUrl) return;

        setAiReview({ loading: true, text: null, shown: true });

        try {
            const res = await fetch('/api/feedback/evaluate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl,
                    imageId: resultData.id // Pass ID for DB saving
                })
            });
            const data = await res.json();
            setAiReview({ loading: false, text: data.text, shown: true });
            sessionStorage.setItem('comic-review', JSON.stringify({ text: data.text }));
        } catch (err) {
            console.error(err);
            setAiReview({ loading: false, text: "The art teacher is on a coffee break! Try again later.", shown: true });
        }
    };

    const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

    const playFeedback = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!aiReview.text) return;

        if (isPlaying && audioRef) {
            audioRef.pause();
            audioRef.currentTime = 0;
            setIsPlaying(false);
            return;
        }

        // Use Expressive TTS Endpoint
        try {
            const res = await fetch('/api/media/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: aiReview.text })
            });
            const data = await res.json();

            if (data.audioUrl) {
                const audio = new Audio(data.audioUrl);
                audio.onended = () => setIsPlaying(false);
                setAudioRef(audio);
                setIsPlaying(true);
                audio.play();
            }
        } catch (err) {
            console.error("TTS Failed:", err);
            // Fallback to browser TTS if backend fails (e.g., 403 Quota/Permission)
            const utterance = new SpeechSynthesisUtterance(aiReview.text);
            // Simple language detection
            utterance.lang = /[\u4e00-\u9fa5]/.test(aiReview.text) ? 'zh-CN' : 'en-US';
            utterance.onend = () => setIsPlaying(false);
            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-slate-900 z-[60] overflow-y-auto">
            {/* Background Video (Audio Page Style) */}
            <div className="fixed inset-0 z-0">
                <video
                    src={comicVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload noremoteplayback"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-50 flex items-center gap-4 p-4 pointer-events-none sticky top-0">
                <button onClick={goBack} className="pointer-events-auto p-2 bg-white/20 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/30 transition-colors">
                    <ArrowRight className="w-6 h-6 text-white rotate-180" />
                </button>
                <div className="flex-1" />
                <div className="pointer-events-auto flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-bold shadow-sm border border-amber-200">
                        <span>✨</span>
                        <span>{user?.points || 0}</span>
                    </div>
                    <AuthButton />
                </div>
            </header>

            {/* Main Content Area */}
            <div className="relative w-full min-h-full flex flex-col items-center justify-center p-4">
                <AnimatePresence mode="wait">
                    {/* State 1: Finished (Show Result) */}
                    {step === 'finished' && resultData && (
                        <motion.div
                            key="finished"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative z-10 w-full max-w-4xl h-full flex flex-col items-center justify-center p-4"
                        >
                            {/* Magic Comic Display (Single Image + Overlays) */}
                            <div
                                className="relative flex items-center justify-center bg-white p-2 rounded-xl shadow-2xl border-[6px] border-white overflow-hidden max-h-[70vh] w-auto max-w-full"
                                onClick={() => setExpandedImage({
                                    id: resultData.id || 'comic-result',
                                    userId: resultData.userId || 'me',
                                    imageUrl: resultData.gridImageUrl || resultData.coverImage || resultData.pages?.[0]?.imageUrl,
                                    type: 'comic',
                                    createdAt: new Date().toISOString(),
                                    prompt: "Magic Comic",
                                    meta: {
                                        isStoryBook: true,
                                        bookData: resultData,
                                        originalImageUrl: resultData.originalImageUrl || imagePreview,
                                        feedback: aiReview.text,
                                        isTextBurnedIn: resultData.isTextBurnedIn,
                                        // Pass Builder Tags for Display (Retrieved from persisted resultData)
                                        tags: resultData.tags
                                    }
                                })}
                            >
                                <div className="relative flex items-center justify-center w-full h-full">
                                    <img
                                        src={resultData.gridImageUrl || resultData.coverImageUrl || resultData.pages?.[0]?.imageUrl}
                                        className="block w-auto h-auto max-h-[68vh] max-w-full object-contain"
                                        alt="Comic Strip"
                                    />

                                    {/* Architecture C: Interactive Text Overlays for 2x2 Grid */}
                                    {editableCaptions.length === 4 && !resultData.isTextBurnedIn && (
                                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 w-full h-full pointer-events-none p-1 md:p-4">
                                            {editableCaptions.map((caption, i) => (
                                                <div
                                                    key={i} className="relative w-full h-full flex flex-col justify-end p-2 md:p-4">
                                                    <div
                                                        className="bg-white/90 backdrop-blur-sm p-1.5 md:p-3 rounded-2xl border-2 border-slate-200/50 shadow-xl pointer-events-auto text-center transition-all hover:scale-[1.02]"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className="w-full bg-transparent border-none text-[9px] md:text-[14px] font-black text-slate-800 text-center leading-tight">
                                                            {caption}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6 pointer-events-auto">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setStep('upload');
                                        setResultData(null); // Clear Persistence
                                        setAiReview({ loading: false, text: null, shown: false }); // Clear Review State
                                        sessionStorage.removeItem('comic-result');
                                        sessionStorage.removeItem('comic-review');
                                    }}
                                    className="bg-white text-slate-800 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-slate-50 transition-colors"
                                >
                                    Make Another
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Prioritize the first panel for animation to avoid "4 grid" video artifact.
                                        // User wants a cinematic animation, not an animated grid.
                                        const remixUrl = resultData.pages?.[0]?.imageUrl || resultData.gridImageUrl || resultData.coverImageUrl;
                                        if (remixUrl) {
                                            navigate('/generate/video', { state: { remixImage: remixUrl } });
                                        }
                                    }}
                                    className="bg-purple-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                >
                                    Make Animation 🎬
                                </button>
                                <button
                                    onClick={handleAiReview}
                                    className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 hover:brightness-110 transition-colors"
                                >
                                    <Star className="w-5 h-5 fill-current" />
                                    Rate It!
                                </button>
                            </div>

                            {/* Review Modal / Popup (Existing Logic preserved) */}
                            {aiReview.shown && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { e.stopPropagation(); setAiReview(prev => ({ ...prev, shown: false })); }}>
                                    {aiReview.loading ? (
                                        <div className="bg-black/60 backdrop-blur-sm p-6 rounded-2xl flex flex-col items-center justify-center text-white">
                                            <Loader2 className="w-12 h-12 animate-spin mb-4" />
                                            <p className="text-xl font-bold animate-pulse">Art Teacher is watching...</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white text-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative border-4 border-purple-200 animate-in fade-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setAiReview(prev => ({ ...prev, shown: false })); window.speechSynthesis.cancel(); setIsPlaying(false); }}
                                                className="absolute top-2 right-2 p-2 bg-slate-100 rounded-full hover:bg-slate-200"
                                            >
                                                <ArrowRight className="w-4 h-4 rotate-45" /> {/* Close Icon */}
                                            </button>
                                            <div className="flex-1 overflow-y-auto max-h-[60vh] flex flex-col items-center text-center gap-4">
                                                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center relative flex-shrink-0">
                                                    <Star className="w-8 h-8 text-purple-600 fill-current" />
                                                    <button
                                                        onClick={playFeedback}
                                                        className="absolute -bottom-2 -right-2 p-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition-colors"
                                                    >
                                                        {isPlaying ? <span className="animate-pulse">🔊</span> : "🔊"}
                                                    </button>
                                                </div>
                                                <h3 className="text-xl font-bold text-purple-900">Great Job! 🎨</h3>
                                                <p className="text-lg leading-relaxed font-medium text-slate-600">
                                                    "{aiReview.text}"
                                                </p>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setAiReview(prev => ({ ...prev, shown: false })); window.speechSynthesis.cancel(); setIsPlaying(false); }}
                                                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 mt-2"
                                                >
                                                    Thanks!
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* State 2: Generating (Loading) */}
                    {step === 'generating' && (
                        <motion.div key="loading"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative z-10 bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl flex flex-col items-center mb-12"
                        >
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <h3 className="text-xl font-bold text-slate-800">Drawing...</h3>
                            <div className="w-48 h-3 bg-slate-200 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${Math.round(progress)}%` }} />
                            </div>

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
                        <motion.div key="upload" className="w-full flex flex-col items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ComicBuilderPanel
                                imageUploaded={!!imageFile}
                                onGenerate={handleGenerate}
                            >
                                <div className="w-full h-full flex items-center justify-center p-4">
                                    <div className="relative w-full aspect-[4/3] flex items-center justify-center overflow-hidden hover:scale-[1.02] transition-all group cursor-pointer border-4 border-dashed border-white/60 rounded-3xl bg-white/10 shadow-lg"
                                        onClick={() => document.getElementById('comic-upload')?.click()}
                                    >

                                        <input type="file" id="comic-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        {imagePreview ? (
                                            <img src={imagePreview} className="relative z-10 w-full h-full object-contain" />
                                        ) : (
                                            <div className="relative z-10 flex flex-col items-center text-white group-hover:scale-105 transition-transform">
                                                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-2 shadow-lg backdrop-blur-md">
                                                    <img src="/upload_icon_v2.png" className="w-12 h-12" />
                                                </div>
                                                <p className="font-bold drop-shadow-md text-xl">Tap to Upload Photo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ComicBuilderPanel>

                            {/* Universal Exit Button */}
                            <div className="mt-8 mb-12">
                                <GenerationCancelButton
                                    isGenerating={false}
                                    onCancel={() => navigate('/generate')}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


            <ImageModal
                image={expandedImage}
                onClose={() => setExpandedImage(null)}
                onToggleFavorite={async (id) => {
                    if (expandedImage) {
                        setExpandedImage(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
                        // Save to API
                        await fetch('/api/media/favorite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, userId: user?.uid || 'demo-user' })
                        });
                    }
                }}
                onDelete={async (id) => {
                    if (confirm("Delete this creation?")) {
                        await fetch(`/api/media/image/${id}?userId=${user?.uid || 'demo-user'}`, { method: 'DELETE' });
                        setExpandedImage(null);
                        setExpandedImage(null);
                        setStep('upload'); // Go back to start
                        setResultData(null);
                        sessionStorage.removeItem('comic-result');
                    }
                }}
                onRegenerate={(img) => {
                    // Close modal
                    setExpandedImage(null);
                    // TODO: Map prompt string back to builder state if possible, or just reset
                    setStep('upload');
                }}
            />
            <BottomNav />
        </div >
    );
};

