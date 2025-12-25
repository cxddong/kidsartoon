import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Play, RefreshCw, Video } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import GenerationCancelButton from '../components/GenerationCancelButton';
import { BottomNav } from '../components/BottomNav';
import { AuthButton } from '../components/auth/AuthButton';
import { useAuth } from '../context/AuthContext';
import { AnimationBuilderPanel, type AnimationBuilderData, RENDER_STYLES, VIDEO_MOODS } from '../components/builder/AnimationBuilderPanel';
import { PureVideoPlayer } from '../components/PureVideoPlayer';
import genVideo from '../assets/gen.mp4';

type Step = 'upload' | 'generating' | 'finished';

export const AnimationPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const goBack = () => {
        const confirmed = window.confirm("Are you sure you want to go back? Your current progress might be lost.");
        if (confirmed) navigate('/generate');
    };

    const [step, setStep] = useState<Step>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [resultData, setResultData] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [galleryImages, setGalleryImages] = useState<any[]>([]);

    const location = useLocation();

    React.useEffect(() => {
        // Handle incoming remix image from other pages
        const remixUrl = location.state?.remixImage;
        if (remixUrl) {
            setImagePreview(remixUrl);
            // Convert URL to File object if possible, or adjust handleGenerate to handle URL mode
            // For now, setting preview is enough visually, but we need the file for the API.
            // Let's fetch it and convert to Blob/File to fully support the existing upload flow.
            fetch(remixUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "remix.png", { type: blob.type });
                    setImageFile(file);
                })
                .catch(err => console.error("Failed to load remix image:", err));
        }

        fetch('/api/images/public?type=animation')
            .then(res => res.json())
            .then(data => setGalleryImages(data))
            .catch(err => console.error("Failed to load gallery:", err));
    }, [location.state]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async (builderData: AnimationBuilderData) => {
        if (!imageFile) return;

        // Construct Prompt
        let finalPrompt = builderData.prompt;
        if (!finalPrompt || finalPrompt.trim().length === 0) {
            // Fallback Prompt Construction
            const selectedRender = RENDER_STYLES.find(s => s.id === builderData.renderStyle);
            const selectedMood = VIDEO_MOODS.find(m => m.id === builderData.mood);

            const userInterestsStr = user?.interests && user.interests.length > 0
                ? ` Incorporate elements related to user preferences: ${user.interests.join(', ')}.`
                : "";

            const renderDesc = (selectedRender as any)?.promptText || selectedRender?.label || 'Standard';
            const moodDesc = (selectedMood as any)?.promptText || selectedMood?.label || 'Happy';
            const audioPrompt = builderData.addAudio ? " With sound effects and music." : " Silent video.";

            const baseMotion = builderData.cameraFixed ? "Static camera, subtle movements" : "Cinematic camera movement, dynamic motion";

            finalPrompt = `Child friendly animation. Motion: ${baseMotion}. Style: ${renderDesc}. Mood: ${moodDesc}.${audioPrompt} High quality, smooth motion, consistent character.${userInterestsStr}`.replace(/\s+/g, ' ').trim();
        }

        setStep('generating');
        setProgress(0);
        setStatusMessage('Starting upload...');

        // Progress Simulation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return 95;
                if (prev < 10) { setStatusMessage('Uploading image...'); return prev + 4; }
                if (prev < 30) { setStatusMessage('Queueing on Cloud...'); return prev + 1; }
                if (prev < 60) { setStatusMessage('Rendering Keyframes...'); return prev + 0.2; }
                if (prev < 90) { setStatusMessage('Finalizing animation...'); return prev + 0.05; }
                setStatusMessage('Almost done, please wait...');
                return prev + 0.01;
            });
        }, 1000);

        try {
            // Convert to Base64
            const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = error => reject(error);
            });
            const base64Image = await toBase64(imageFile);

            // 1. Start Task
            console.log("Starting Animation Task (Doubao)...");
            const taskRes = await fetch('/api/video/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: base64Image,
                    prompt: finalPrompt,
                    camera_fixed: builderData.cameraFixed,
                    userId: user?.uid || 'demo-user'
                }),
            });

            const taskData = await taskRes.json();

            if (!taskRes.ok || !taskData.id) {
                throw new Error(taskData.error || 'Failed to start video task');
            }

            const taskId = taskData.id;
            console.log("Task Started, ID:", taskId);

            // 2. Poll Status
            let attempts = 0;
            const maxAttempts = 300; // 10 mins

            const checkStatus = async () => {
                if (attempts++ >= maxAttempts) {
                    throw new Error("Generation timed out");
                }

                try {
                    const statusRes = await fetch(`/api/video/status/${taskId}`);
                    if (!statusRes.ok) {
                        console.warn("Status check failed, retrying...");
                        setTimeout(checkStatus, 3000);
                        return;
                    }

                    const statusData = await statusRes.json();
                    console.log("Task Status:", statusData.status);

                    if (statusData.status === 'SUCCEEDED') {
                        clearInterval(progressInterval);
                        setProgress(100);
                        setTimeout(() => {
                            setResultData(statusData);
                            setStep('finished');
                        }, 500);
                        return;
                    } else if (statusData.status === 'FAILED') {
                        throw new Error(`Generation Failed: ${statusData.error?.message || statusData.error || 'Unknown error'}`);
                    } else {
                        // RUNNING or PENDING
                        setTimeout(checkStatus, 3000); // 3s polling as requested
                    }
                } catch (e: any) {
                    clearInterval(progressInterval);
                    alert(`Error: ${e.message}`);
                    setStep('upload');
                }
            };

            setTimeout(checkStatus, 3000);

        } catch (err: any) {
            clearInterval(progressInterval);
            alert(`Error: ${err.message}`);
            setStep('upload');
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full bg-slate-900 z-[60] overflow-y-auto">
            {/* Background Video (Audio Page Style) */}
            <div className="fixed inset-0 z-0">
                <video
                    src={genVideo}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full object-cover"
                />
            </div>

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

            <div className="relative w-full min-h-full flex flex-col">
                <div className="relative w-full min-h-[35vh] shrink-0 flex items-center justify-center p-4 pb-4">

                    <AnimatePresence mode="wait">
                        {step === 'finished' && resultData ? (
                            <motion.div
                                key="finished"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative z-10 w-full max-w-md bg-black rounded-3xl shadow-2xl overflow-hidden border-4 border-white/20 mb-12"
                            >
                                <PureVideoPlayer
                                    src={resultData.videoUrl}
                                    className="w-full aspect-square"
                                />
                                <div className="p-4 bg-white/10 backdrop-blur-md flex flex-col gap-3">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-2 text-white/90 font-bold">
                                            <Video className="w-5 h-5" />
                                            <span>Animation Ready!</span>
                                        </div>
                                        <button
                                            onClick={() => { setStep('upload'); setResultData(null); }}
                                            className="text-white/70 text-sm font-bold flex items-center gap-1 hover:text-white"
                                        >
                                            <RefreshCw className="w-3 h-3" /> New
                                        </button>
                                    </div>
                                    {/* Download Button REMOVED */}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="upload" className="relative z-10 w-full h-full flex items-center justify-center p-4 mb-16">

                                <div className="relative w-full max-w-sm aspect-[4/3] flex items-center justify-center overflow-hidden hover:scale-105 transition-all group cursor-pointer border-4 border-dotted border-white hover:border-purple-300 rounded-3xl bg-white/10 shadow-2xl"
                                    onClick={() => !((step === 'generating')) && document.getElementById('anim-upload')?.click()}
                                >
                                    {/* Background Removed */}
                                    <input type="file" id="anim-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={step === 'generating'} />
                                    {imagePreview ? (
                                        <img src={imagePreview} className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <div className="flex flex-col items-center text-white/80 group-hover:text-white">
                                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                                                <img src="/upload_icon_v2.png" className="w-10 h-10 opacity-80" />
                                            </div>
                                            <p className="font-bold">Tap to Upload Photo</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {(step === 'upload' || step === 'generating') && (
                    <div className="relative z-20 max-w-3xl mx-auto w-full">
                        <AnimationBuilderPanel
                            imageUploaded={!!imageFile}
                            onGenerate={handleGenerate}
                            isGenerating={step === 'generating'}
                            progress={progress}
                            statusMessage={statusMessage}
                        />

                        {/* Universal Exit Button */}
                        <div className="mt-8 mb-12 flex justify-center pb-24">
                            <GenerationCancelButton
                                isGenerating={step === 'generating'}
                                onCancel={() => {
                                    if (step === 'generating') {
                                        const confirmed = window.confirm("Generation is in progress (Points already deducted). Are you sure you want to cancel?");
                                        if (confirmed) navigate('/generate');
                                    } else {
                                        navigate('/generate');
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div >
    );
};
