import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    Upload, Sparkles, ArrowLeft, Star,
    BookOpen, Palette, Camera, CheckCircle2,
    ChevronRight, Info, Volume2, Film
} from 'lucide-react';
import type { CreativeSeries, Chapter } from '../types/mentor';
import { jsPDF } from 'jspdf';
import { ImageCropperModal } from '../components/ImageCropperModal';
import masterpieceVideo from '../assets/masterpiece.mp4';

export default function CreativeJourneyPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // --- State ---
    const [series, setSeries] = useState<CreativeSeries | null>(null);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showFinale, setShowFinale] = useState(false);
    const [cropImage, setCropImage] = useState<string | null>(null);

    // --- V2 Improvement Tracking ---
    const [showV2Challenge, setShowV2Challenge] = useState(false);
    const [v2UploadedImage, setV2UploadedImage] = useState<string | null>(null);
    const [v2CropImage, setV2CropImage] = useState<string | null>(null);
    const [improvementReport, setImprovementReport] = useState<any>(null);
    const [analyzingImprovement, setAnalyzingImprovement] = useState(false);

    // --- Init: Load active series ---
    useEffect(() => {
        if (user) {
            checkActiveSeries();
        }
    }, [user]);

    // Handle navigation from other pages (e.g., "Ask a Teacher" from Comic)
    useEffect(() => {
        // @ts-ignore
        if (location.state && location.state.uploadedImage) {
            console.log('[CreativeJourney] Received uploadedImage from navigation');
            // Reset to new series and pre-populate the image
            handleStartNew();
            // @ts-ignore
            setUploadedImage(location.state.uploadedImage);
            // Clear the navigation state
            window.history.replaceState({}, document.title);
        }
    }, []);

    const checkActiveSeries = async () => {
        try {
            const res = await fetch(`/api/mentor/active/${user?.uid}`);
            const data = await res.json();
            if (data.series) {
                setSeries(data.series);
            }
        } catch (err) {
            console.error('Failed to load active series', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartNew = () => {
        setSeries({
            id: 'new-' + Date.now(),
            userId: user?.uid || 'guest',
            title: 'My Magic Journey',
            status: 'active',
            currentStep: 0,
            context: {},
            chapters: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setCropImage(reader.result as string);
        };
        reader.readAsDataURL(file);
        event.target.value = ''; // Reset input
    };

    const handleCropComplete = (blob: Blob) => {
        if (!cropImage) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedImage(reader.result as string);
            setCropImage(null);
        };
        reader.readAsDataURL(blob);
    };

    const handleContinue = async (isFinishing: any = false) => {
        if (!series || !user) return;

        // Ensure isFinishing is strictly true (not a truthy event object)
        if (isFinishing === true) {
            setShowFinale(true);
            return;
        }

        if (!uploadedImage) return;

        setAnalyzing(true);
        setError(null);

        try {
            // Convert base64 to Blob
            const fetchRes = await fetch(uploadedImage);
            const blob = await fetchRes.blob();

            const formData = new FormData();
            formData.append('userId', user.uid);
            formData.append('step', (series.currentStep + 1).toString());
            if (series.id && !series.id.startsWith('new-')) {
                formData.append('seriesId', series.id);
            }
            formData.append('image', blob, 'drawing.jpg');

            const response = await fetch('/api/mentor/step', {
                method: 'POST',
                // Content-Type header must be omitted for FormData to set boundary
                body: formData
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Magic analysis failed');
            }

            setSeries(data.series);
            setUploadedImage(null); // Reset for next step

            if (data.isComplete) {
                setShowFinale(true);
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong with the magic...');
        } finally {
            setAnalyzing(false);
        }
    };

    // --- V2 Improvement Tracking Handlers ---
    const handleV2ImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setV2CropImage(reader.result as string);
        };
        reader.readAsDataURL(file);
        event.target.value = '';
    };

    const handleV2CropComplete = (blob: Blob) => {
        if (!v2CropImage) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setV2UploadedImage(reader.result as string);
            setV2CropImage(null);
        };
        reader.readAsDataURL(blob);
    };

    const handleAnalyzeImprovement = async () => {
        if (!uploadedImage || !v2UploadedImage || !series) return;

        setAnalyzingImprovement(true);
        setError(null);

        try {
            const lastIteration = series.chapters[series.chapters.length - 1];
            const previousAdvice = lastIteration?.coachingFeedback?.advice?.actionableTask || "Improve your artwork";

            const response = await fetch('/api/mentor/analyze-improvement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalImageBase64: uploadedImage,
                    newImageBase64: v2UploadedImage,
                    previousAdvice: previousAdvice
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Improvement analysis failed');
            }

            setImprovementReport(data);

            // Celebrate with confetti if score > 80
            if (data.improvement_score > 80) {
                // Add confetti animation here if you have a library
                console.log('🎉 High score! Celebrate!');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to analyze improvement');
        } finally {
            setAnalyzingImprovement(false);
        }
    };

    const handleKeepImproving = () => {
        setV2UploadedImage(null);
        setImprovementReport(null);
    };

    const handleFinalize = () => {
        // Save the improved version and navigate to profile
        navigate('/profile', { state: { tab: 'journey' } });
    };

    const handleFinaleAction = async (type: 'pdf' | 'video') => {
        if (!series || !user) return;

        if (type === 'video') {
            setAnalyzing(true);
            try {
                const res = await fetch('/api/points/consume', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.uid,
                        action: 'magic_mentor_video'
                    })
                });
                const data = await res.json();
                if (!data.success) {
                    alert('Not enough Magic Points for the Premium Movie! 🌟');
                    return;
                }
                alert('✨ Magic Binding Started! Your movie is being created...');
            } catch (err) {
                console.error(err);
            } finally {
                setAnalyzing(false);
            }
        } else {
            generatePDF();
        }
    };

    const generatePDF = async () => {
        if (!series) return;
        setAnalyzing(true);
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const titlePageColor = [79, 70, 229]; // Indigo-600
            const storyPageColor = [249, 250, 251]; // Gray-50
            const margin = 20;
            const contentWidth = pageWidth - (margin * 2);

            // --- 🎨 Title Page ---
            doc.setFillColor(titlePageColor[0], titlePageColor[1], titlePageColor[2]);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // Decorative background elements (subtle circles)
            doc.setFillColor(255, 255, 255, 0.1);
            doc.circle(pageWidth, 0, 80, 'F');
            doc.circle(0, pageHeight, 60, 'F');

            // Add first user image to cover if available
            if (series.chapters && series.chapters.length > 0 && series.chapters[0].userImageUrl) {
                try {
                    const imgSize = 80;
                    const imgX = (pageWidth - imgSize) / 2;
                    const imgY = 40;
                    const imgData = await getImageDataUrl(series.chapters[0].userImageUrl);
                    doc.addImage(imgData, 'JPEG', imgX, imgY, imgSize, imgSize);
                } catch (err) {
                    console.warn('Failed to add cover image:', err);
                }
            }

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(40);
            const title = series.title || "My Masterpiece";
            doc.text(title, pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });

            doc.setFontSize(22);
            doc.text("A Masterpiece Storybook", pageWidth / 2, pageHeight / 2 + 35, { align: 'center' });

            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(1);
            doc.line(pageWidth / 4, pageHeight / 2 + 45, (pageWidth * 3) / 4, pageHeight / 2 + 45);

            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text(`By Little Artist: ${(user as any)?.email || 'Hero'}`, pageWidth / 2, pageHeight - 50, { align: 'center' });
            doc.text("Guided by Magic Kat", pageWidth / 2, pageHeight - 35, { align: 'center' });

            // --- 📖 Story Pages ---
            for (let i = 0; i < series.chapters.length; i++) {
                const chapter = series.chapters[i];
                const feedback = chapter.coachingFeedback;
                doc.addPage();

                // Background color per page (alternating subtle tints)
                const tint = i % 2 === 0 ? [243, 244, 255] : [255, 242, 248]; // Subtle Blue vs Subtle Pink
                doc.setFillColor(tint[0], tint[1], tint[2]);
                doc.rect(0, 0, pageWidth, pageHeight, 'F');

                // Header info
                doc.setTextColor(140, 140, 140);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.text(`ITERATION V${chapter.step}`, margin, 15);

                // Add Image with Decorative Frame
                try {
                    const imgData = await getImageDataUrl(chapter.userImageUrl);
                    const imgProps = doc.getImageProperties(imgData);
                    const imgRatio = imgProps.height / imgProps.width;
                    const imgWidth = contentWidth;
                    const imgHeight = contentWidth * imgRatio;

                    // Draw Frame Shadow
                    doc.setFillColor(0, 0, 0, 0.05);
                    doc.roundedRect(margin + 2, 22, imgWidth, imgHeight, 5, 5, 'F');

                    // Draw White Frame
                    doc.setDrawColor(255, 255, 255);
                    doc.setLineWidth(4);
                    doc.addImage(imgData, 'JPEG', margin, 20, imgWidth, imgHeight);
                    doc.rect(margin, 20, imgWidth, imgHeight, 'S');

                    // Artistic Style Tag
                    if (feedback.masterConnection?.artist) {
                        doc.setFillColor(255, 255, 255, 0.9);
                        doc.setDrawColor(79, 70, 229);
                        doc.setLineWidth(0.5);
                        const styleLabel = `Master Style: ${feedback.masterConnection.artist}`;
                        const labelWidth = doc.getTextWidth(styleLabel) + 10;
                        doc.roundedRect(pageWidth - margin - labelWidth, 20 + imgHeight - 10, labelWidth, 8, 2, 2, 'FD');
                        doc.setTextColor(79, 70, 229);
                        doc.setFontSize(8);
                        doc.text(styleLabel, pageWidth - margin - labelWidth + 5, 20 + imgHeight - 4);
                    }

                    // Feedback Loop Text
                    const textY = 30 + imgHeight;
                    const textPadding = 10;
                    const storyText = feedback.advice.actionableTask;
                    const textLines = doc.splitTextToSize(`Coach Mission: ${storyText}`, contentWidth - (textPadding * 2));
                    const textHeight = (textLines.length * 7) + (textPadding * 2);

                    doc.setFillColor(255, 255, 255);
                    doc.setDrawColor(229, 231, 235);
                    doc.setLineWidth(0.2);
                    doc.roundedRect(margin, textY, contentWidth, textHeight, 4, 4, 'FD');

                    doc.setTextColor(31, 41, 55);
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'italic');
                    doc.text(textLines, margin + textPadding, textY + textPadding + 5);

                    // Improvement Tag
                    if (feedback.improvement) {
                        doc.setTextColor(22, 163, 74); // Green-600
                        doc.setFontSize(10);
                        doc.text(feedback.improvement, margin, textY + textHeight + 5);
                    }

                } catch (e) {
                    console.error("Failed to add image to PDF", e);
                    doc.text("[A Beautiful Masterpiece Drawing]", margin, 40);
                }
            }

            // --- 🏆 Conclusion Page ---
            doc.addPage();
            doc.setFillColor(236, 72, 153); // Pink-500
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            doc.setFillColor(255, 255, 255, 0.1);
            doc.circle(0, 0, 100, 'F');
            doc.circle(pageWidth, pageHeight, 80, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(36);
            doc.setFont('helvetica', 'bold');
            (doc as any).text("The End", pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });

            doc.setFontSize(18);
            doc.setFont('helvetica', 'normal');
            (doc as any).text("Every child is an artist.", pageWidth / 2, pageHeight / 2 + 15, { align: 'center' });
            doc.setFontSize(14);
            (doc as any).text("- Pablo Picasso", pageWidth / 2, pageHeight / 2 + 25, { align: 'center' });

            doc.setFontSize(16);
            (doc as any).text("You created magic today! Keep drawing! ✨", pageWidth / 2, pageHeight * 0.8, { align: 'center' });

            doc.save(`${series.title?.replace(/\s+/g, '_') || 'Magic_Masterpiece'}.pdf`);
        } catch (err) {
            console.error("PDF Generation failed", err);
            alert("Oops! The Magic PDF binder got stuck. Please try again!");
        } finally {
            setAnalyzing(false);
        }
    };

    /**
     * Helper to load image and return as Base64 for jsPDF
     */
    const getImageDataUrl = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            img.onerror = reject;
            // If it's already a data URL, just resolve
            if (url.startsWith('data:')) resolve(url);
            else img.src = url;
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <Sparkles className="w-12 h-12 text-purple-600 animate-spin" />
    </div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/generate')}
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold mb-6 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    Back to Magic Lab
                </button>

                <div className="text-center">
                    {/* Removed title section as requested */}
                </div>
            </div>

            <div className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    {!series ? (
                        <WelcomeSection onStart={handleStartNew} key="welcome" />
                    ) : showFinale ? (
                        <FinaleSection series={series} onAction={handleFinaleAction} key="finale" />
                    ) : (
                        <JourneyFlow
                            series={series}
                            uploadedImage={uploadedImage}
                            analyzing={analyzing}
                            onUpload={handleImageUpload}
                            onContinue={handleContinue}
                            onResetUpload={() => setUploadedImage(null)}
                            error={error}
                            v2UploadedImage={v2UploadedImage}
                            onV2Upload={handleV2ImageUpload}
                            onResetV2={() => setV2UploadedImage(null)}
                            improvementReport={improvementReport}
                            analyzingImprovement={analyzingImprovement}
                            onAnalyzeImprovement={handleAnalyzeImprovement}
                            onKeepImproving={handleKeepImproving}
                            onFinalize={handleFinalize}
                            showV2Challenge={showV2Challenge}
                            onToggleV2Challenge={() => setShowV2Challenge(!showV2Challenge)}
                            key="flow"
                        />
                    )}
                </AnimatePresence>
            </div>
            {/* Cropper Modal */}
            {cropImage && (
                <ImageCropperModal
                    imageUrl={cropImage}
                    onCrop={handleCropComplete}
                    onCancel={() => setCropImage(null)}
                    aspectRatio={1}
                />
            )}
            {/* V2 Cropper Modal */}
            {v2CropImage && (
                <ImageCropperModal
                    imageUrl={v2CropImage}
                    onCrop={handleV2CropComplete}
                    onCancel={() => setV2CropImage(null)}
                    aspectRatio={1}
                />
            )}
        </div>
    );
}



function WelcomeSection({ onStart }: { onStart: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border-4 border-white overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Palette className="w-48 h-48 rotate-12" />
            </div>

            <div className="relative z-10">
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="mb-6 inline-block"
                >
                    <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-indigo-100 shadow-xl mx-auto relative group">
                        <video
                            src={masterpieceVideo}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-50 pointer-events-none" />
                    </div>
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Hi! I'm Magic Kat, your Art Coach!</h2>
                <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                    I'm here to help you turn your ideas into a real masterpiece!
                    Upload a sketch, and I'll give you professional feedback to help you improve.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[
                        { icon: Camera, title: "1. Upload Sketch", desc: "Show me your first draft!" },
                        { icon: Sparkles, title: "2. Get Coaching", desc: "I'll give you specific tips." },
                        { icon: Palette, title: "3. Improve Together", desc: "We'll polish it iteration by iteration." }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 p-6 rounded-3xl bg-indigo-50 border border-indigo-100 shadow-sm">
                            <item.icon className="w-8 h-8 text-indigo-500 mb-2" />
                            <h3 className="font-black text-indigo-900 leading-none">{item.title}</h3>
                            <p className="text-xs text-indigo-600 font-medium">{item.desc}</p>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onStart}
                    className="group relative px-10 py-5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-black text-xl rounded-full hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                >
                    Start Coaching Session
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
}

function JourneyFlow({
    series, uploadedImage, analyzing, onUpload, onContinue, onResetUpload, error,
    v2UploadedImage, onV2Upload, onResetV2, improvementReport, analyzingImprovement,
    onAnalyzeImprovement, onKeepImproving, onFinalize, showV2Challenge, onToggleV2Challenge
}: any) {
    const currentStep = series.currentStep + 1;
    const isStepDone = uploadedImage !== null;

    const lastIteration = series.chapters[series.chapters.length - 1];
    const coachingFeedback = lastIteration?.coachingFeedback;

    return (
        <div className="space-y-8">
            {/* Progress Header */}
            <div className="flex justify-between items-center bg-white/40 backdrop-blur-sm p-6 rounded-3xl border border-white">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                        V{currentStep}
                    </div>
                    <div>
                        <h3 className="font-black text-gray-800 leading-none">Drawing Session</h3>
                        <p className="text-xs text-gray-500 font-bold">Iteration {currentStep} of your Masterpiece</p>
                    </div>
                </div>
                <div className="hidden md:flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={`w-8 h-2 rounded-full ${series.currentStep >= s ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                    ))}
                </div>
            </div>

            {/* Main Interaction Area */}
            <motion.div
                key={series.currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] shadow-2xl p-8 border-4 border-white overflow-hidden"
            >
                <div className="flex flex-col md:flex-row gap-8 items-stretch">
                    {/* Left: Coaching & Mission */}
                    <div className="flex-1 space-y-6 bg-white/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/60 shadow-inner">
                        {!coachingFeedback ? (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 text-indigo-600 font-black text-xs uppercase tracking-tighter">
                                    <Sparkles className="w-4 h-4" />
                                    Starting Phase
                                </div>
                                <h2 className="text-3xl font-black text-gray-800 leading-tight">
                                    Upload your first sketch!
                                </h2>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Don't worry about being perfect. Just show me your idea and I'll help you grow it!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Visual Diagnosis */}
                                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                                    <Camera className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Visual Diagnosis</p>
                                        <p className="text-sm font-bold text-indigo-900 leading-tight">{coachingFeedback.visualDiagnosis}</p>
                                    </div>
                                </div>

                                {/* Master Connection */}
                                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-3">
                                    <Palette className="w-5 h-5 text-purple-500 flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Master Inspiration: {coachingFeedback.masterConnection.artist}</p>
                                        <p className="text-sm text-purple-900 leading-tight italic">"{coachingFeedback.masterConnection.reason}"</p>
                                    </div>
                                </div>

                                {/* NEW: Top 3 Masterpiece Matches */}
                                {lastIteration?.masterpieceMatches && lastIteration.masterpieceMatches.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest text-center">🖼️ Your Art Style Matches These Masters!</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            {lastIteration.masterpieceMatches.map((match: any) => (
                                                <div
                                                    key={match.matchId}
                                                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-3 hover:shadow-lg transition-all cursor-pointer group"
                                                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(match.artist + ' artist')}`, '_blank')}
                                                >
                                                    {/* Rank Badge */}
                                                    <div className="flex justify-center mb-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${match.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                                                            match.rank === 2 ? 'bg-gray-300 text-gray-800' :
                                                                'bg-orange-400 text-orange-900'
                                                            }`}>
                                                            {match.rank === 1 ? '🥇' : match.rank === 2 ? '🥈' : '🥉'}
                                                        </span>
                                                    </div>
                                                    {/* Image */}
                                                    <img
                                                        src={match.imagePath}
                                                        alt={match.title}
                                                        className="w-full h-20 object-contain rounded-lg border border-purple-100 bg-white mb-2"
                                                    />
                                                    {/* Info */}
                                                    <p className="text-xs font-bold text-center text-gray-800 truncate">{match.artist}</p>
                                                    <p className="text-[10px] text-center text-purple-600 truncate">{match.title}</p>
                                                    {/* Common Features */}
                                                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                                                        {match.commonFeatures?.slice(0, 2).map((f: string, i: number) => (
                                                            <span key={i} className="px-1 py-0.5 bg-white rounded text-[8px] text-purple-500 border border-purple-100">
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {/* Click hint */}
                                                    <p className="text-[8px] text-center text-gray-400 mt-1 group-hover:text-purple-600 transition-colors">
                                                        Click to learn more
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Mission Card */}
                                <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                        <Sparkles className="w-32 h-32 rotate-12 fill-white" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                Active Mission
                                            </div>
                                        </div>
                                        <h3 className="text-2xl font-black mb-2 leading-tight">
                                            {coachingFeedback.advice.actionableTask}
                                        </h3>
                                        <p className="text-indigo-100 text-sm font-medium mb-4 italic leading-relaxed">
                                            "{coachingFeedback.advice.compliment} {coachingFeedback.advice.gapAnalysis}"
                                        </p>
                                        <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-sm">
                                            <Palette className="w-5 h-5 text-indigo-200" />
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-tighter">Technique Tip</p>
                                                <p className="text-xs font-bold">{coachingFeedback.advice.techniqueTip}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {coachingFeedback.improvement && (
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-2xl border border-green-100 italic text-xs font-bold justify-center">
                                        <CheckCircle2 className="w-4 h-4" />
                                        {coachingFeedback.improvement}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Upload & Actions Area */}
                    <div className="w-full md:w-96 flex flex-col gap-6">

                        {analyzing ? (
                            <AnalysisProgress step={currentStep} />
                        ) : (
                            <>
                                {/* 1. Upload or Preview */}
                                <AnimatePresence mode="wait">
                                    {!uploadedImage ? (
                                        <motion.label
                                            key="upload-box"
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.9, opacity: 0 }}
                                            className="w-full aspect-square bg-indigo-50 rounded-[2.5rem] border-4 border-dashed border-indigo-200 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-100 hover:border-indigo-300 transition-all group shadow-sm hover:shadow-md"
                                        >
                                            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform mb-4">
                                                <Camera className="w-10 h-10 text-indigo-500" />
                                            </div>
                                            <span className="font-black text-indigo-900 text-lg">Snap Drawing</span>
                                            <span className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-wider">Step {series.currentStep + 1}</span>
                                        </motion.label>
                                    ) : (
                                        <motion.div
                                            key="image-preview"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="relative bg-white p-2 rounded-[2.5rem] shadow-xl border-4 border-white"
                                        >
                                            <img src={uploadedImage} className="w-full aspect-square object-cover rounded-[2rem]" />
                                            <button
                                                onClick={onResetUpload}
                                                className="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 border-2 border-white transition-transform hover:scale-110"
                                            >
                                                ×
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* 2. Progress Bar (Percentage) */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest px-2">
                                        <span>Journey Progress</span>
                                        <span>{Math.round(((series.currentStep) / 5) * 100)}%</span>
                                    </div>
                                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((series.currentStep) / 5) * 100}%` }}
                                            className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                        />
                                    </div>
                                </div>

                                {/* 3. Audio Player (If available) */}
                                {lastIteration?.audioUrl && (
                                    <AudioPlayer audioUrl={lastIteration.audioUrl} />
                                )}

                                {/* 4. Continue Buttons */}
                                <div className="pt-2">
                                    <button
                                        disabled={!isStepDone}
                                        onClick={onContinue}
                                        className={`w-full py-5 rounded-[1.5rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${isStepDone ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02] active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        <span>Next Level V{currentStep + 1}</span>
                                        <ChevronRight className="w-6 h-6" />
                                    </button>

                                    {series.chapters.length >= 2 && (
                                        <button
                                            onClick={() => onContinue(true)}
                                            className="w-full mt-4 py-3 rounded-[1.5rem] font-bold text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors text-sm"
                                        >
                                            I'm finished! Show Finale 🏆
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-center font-bold">
                        {error}
                    </div>
                )}
            </motion.div>

            {/* V2 Improvement Challenge Section */}
            {coachingFeedback && uploadedImage && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[2.5rem] shadow-xl p-8 border-4 border-dashed border-purple-200"
                >
                    {!showV2Challenge ? (
                        <div className="text-center">
                            <div className="text-6xl mb-4">🚀</div>
                            <h3 className="text-2xl font-black text-purple-900 mb-3">Ready for the Improvement Challenge?</h3>
                            <p className="text-purple-600 mb-6 text-lg">
                                Try following Magic Kat's suggestions and upload your improved drawing to see your progress!
                            </p>
                            <button
                                onClick={onToggleV2Challenge}
                                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-full hover:shadow-2xl transition-all hover:scale-105"
                            >
                                ✨ Start Improvement Challenge
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-purple-900">📈 Improvement Challenge</h3>
                                <button
                                    onClick={onToggleV2Challenge}
                                    className="text-purple-500 hover:text-purple-700 font-bold text-sm"
                                >
                                    ✕ Close
                                </button>
                            </div>

                            {/* Split Screen: V1 vs V2 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left: Original V1 */}
                                <div className="bg-white rounded-2xl p-4 shadow-md">
                                    <h4 className="text-sm font-black text-gray-500 uppercase mb-3 text-center">V1 - Original</h4>
                                    {uploadedImage && (
                                        <img src={uploadedImage} alt="V1" className="w-full aspect-square object-cover rounded-xl border-2 border-gray-200" />
                                    )}
                                    <div className="mt-3 text-xs text-gray-600 italic">
                                        "{coachingFeedback.advice.actionableTask}"
                                    </div>
                                </div>

                                {/* Right: V2 Upload or Growth Report */}
                                <div className="bg-white rounded-2xl p-4 shadow-md">
                                    {!v2UploadedImage ? (
                                        <label className="w-full aspect-square bg-purple-50 rounded-xl border-4 border-dashed border-purple-200 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-100 transition-all">
                                            <input type="file" accept="image/*" onChange={onV2Upload} className="hidden" />
                                            <Camera className="w-16 h-16 text-purple-400 mb-3" />
                                            <span className="text-purple-900 font-black">Upload V2</span>
                                            <span className="text-purple-500 text-xs mt-1">Try the suggestions!</span>
                                        </label>
                                    ) : (
                                        <div className="relative">
                                            <h4 className="text-sm font-black text-gray-500 uppercase mb-3 text-center">V2 - Improved</h4>
                                            <img src={v2UploadedImage} alt="V2" className="w-full aspect-square object-cover rounded-xl border-2 border-purple-300" />
                                            <button
                                                onClick={onResetV2}
                                                className="absolute top-0 right-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600"
                                            >
                                                ×
                                            </button>

                                            {/* Growth Report */}
                                            {improvementReport && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-4 border-green-200 shadow-lg"
                                                >
                                                    <div className="text-center">
                                                        <h5 className="text-lg font-black text-green-800 mb-2">🎉 Growth Report</h5>
                                                        <div className="text-7xl font-black text-green-600 mb-3">
                                                            {improvementReport.improvement_score}%
                                                        </div>
                                                        <p className="text-green-900 font-bold text-sm mb-4">
                                                            {improvementReport.feedback}
                                                        </p>

                                                        {/* Improvements Detected */}
                                                        <div className="bg-white/60 rounded-xl p-4 mb-4">
                                                            <h6 className="text-xs font-black text-green-700 uppercase mb-2">What You Improved:</h6>
                                                            <ul className="space-y-1">
                                                                {improvementReport.improvements_detected?.map((imp: string, idx: number) => (
                                                                    <li key={idx} className="text-xs text-green-800 flex items-center gap-2">
                                                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                                        {imp}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {/* Next Suggestion */}
                                                        {improvementReport.next_suggestion && (
                                                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 mb-4">
                                                                <p className="text-xs font-black text-yellow-800 uppercase mb-1">💡 Next Challenge:</p>
                                                                <p className="text-sm text-yellow-900">{improvementReport.next_suggestion}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 justify-center flex-wrap">
                                {v2UploadedImage && !improvementReport && (
                                    <button
                                        onClick={onAnalyzeImprovement}
                                        disabled={analyzingImprovement}
                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {analyzingImprovement ? (
                                            <>🔄 Analyzing...</>
                                        ) : (
                                            <>✨ Analyze Improvement</>
                                        )}
                                    </button>
                                )}
                                {improvementReport && (
                                    <>
                                        <button
                                            onClick={onKeepImproving}
                                            className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-all"
                                        >
                                            🔄 Keep Improving
                                        </button>
                                        <button
                                            onClick={onFinalize}
                                            className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all"
                                        >
                                            ✅ Use This One
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {/* "Evolution" Gallery */}
            {series.chapters.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3 px-4">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">Masterpiece Evolution</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {series.chapters.map((chapter: Chapter, idx: number) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group relative"
                            >
                                <img
                                    src={chapter.userImageUrl}
                                    alt={`Iteration ${chapter.step}`}
                                    className="w-full aspect-square object-cover rounded-2xl shadow-md border-2 border-white group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex flex-col justify-end p-4">
                                    <p className="text-[8px] text-white line-clamp-3 italic font-black leading-tight">
                                        "{chapter.coachingFeedback.advice.actionableTask}"
                                    </p>
                                </div>
                                <div className="absolute -top-2 -left-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-white">
                                    V{chapter.step}
                                </div>
                                <div className="absolute -bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[8px] font-bold text-indigo-600 shadow-sm border border-indigo-100">
                                    {chapter.coachingFeedback.masterConnection.artist}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

        </div>
    );
}

function FinaleSection({ series, onAction }: { series: CreativeSeries, onAction: (type: 'pdf' | 'video') => void }) {
    const navigate = useNavigate();

    // Get the last chapter's image for pre-population
    const lastChapterImage = series.chapters && series.chapters.length > 0
        ? series.chapters[series.chapters.length - 1].userImageUrl
        : null;

    const handleCreateComic = () => {
        if (lastChapterImage) {
            navigate('/generate/comic', { state: { remixImage: lastChapterImage, mode: 'comic' } });
        }
    };

    const handleCreatePictureBook = () => {
        if (lastChapterImage) {
            navigate('/generate/picture', { state: { remixImage: lastChapterImage, mode: 'book' } });
        }
    };

    const handleCreateVideo = () => {
        if (lastChapterImage) {
            navigate('/generate/video', { state: { remixImage: lastChapterImage } });
        } else {
            onAction('video');
        }
    };
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl p-10 text-center border-4 border-white"
        >
            <div className="text-8xl mb-6">🏆</div>
            <h2 className="text-4xl font-black text-gray-800 mb-6">Congratulations!</h2>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                You've completed your artistic evolution journey!
                Your masterpiece "{series.title}" is now ready for the **Magic Binding**.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
                <div
                    onClick={() => onAction('pdf')}
                    className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-left relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all"
                >
                    <BookOpen className="w-12 h-12 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">Magic PDF Book</h3>
                    <p className="text-sm opacity-80 mb-4">Print your creation into a real physical-style book!</p>
                    <div className="bg-white/20 px-4 py-2 rounded-full inline-block text-xs font-bold">
                        FREE - Draft Version
                    </div>
                </div>

                <div
                    onClick={handleCreateVideo}
                    className="p-8 rounded-[2rem] bg-gradient-to-br from-pink-500 to-orange-500 text-white text-left relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all"
                >
                    <Film className="w-12 h-12 mb-4 opacity-50" />
                    <h3 className="text-xl font-bold mb-2">Dynamic Movie</h3>
                    <p className="text-sm opacity-80 mb-4">Turn your drawings into an animated musical video!</p>
                    <div className="bg-white/20 px-4 py-2 rounded-full inline-block text-xs font-bold">
                        ✨ 20 Magic Points
                    </div>
                </div>
            </div>

            {/* NEW: More Creation Options */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
                <div
                    onClick={handleCreateComic}
                    className="p-6 rounded-[1.5rem] bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-left relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all"
                >
                    <BookOpen className="w-10 h-10 mb-3 opacity-50" />
                    <h3 className="text-lg font-bold mb-2">Create Comic</h3>
                    <p className="text-xs opacity-80">Turn your final artwork into a comic strip!</p>
                </div>

                <div
                    onClick={handleCreatePictureBook}
                    className="p-6 rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-left relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all"
                >
                    <BookOpen className="w-10 h-10 mb-3 opacity-50" />
                    <h3 className="text-lg font-bold mb-2">Create Picture Book</h3>
                    <p className="text-xs opacity-80">Make a storybook from your masterpiece!</p>
                </div>
            </div>

            <button
                onClick={() => navigate('/generate')}
                className="text-indigo-600 font-bold hover:underline"
            >
                Back to Lab
            </button>
        </motion.div>
    );
}

function AudioPlayer({ audioUrl }: { audioUrl: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative group overflow-hidden">
            {/* Sparkle Decoration */}
            <div className="absolute top-0 right-0 p-2 opacity-20">
                <Sparkles className="w-16 h-16 transform rotate-12" />
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4">
                <button
                    onClick={togglePlay}
                    className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-md hover:scale-110 active:scale-95 transition-all"
                >
                    {isPlaying ? <Volume2 className="w-8 h-8 animate-pulse" /> : <Volume2 className="w-8 h-8" />}
                </button>

                <div className="flex-1">
                    <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Magic Voice</p>
                    <p className="text-sm font-bold leading-tight">Listen to your Art Coach!</p>
                </div>

                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    className="hidden"
                />
            </div>
        </div>
    );
}

function AnalysisProgress({ step }: { step: number }) {
    const steps = [
        "Scanning artistic elements...",
        "Identifying color palettes...",
        "Connecting with art history...",
        "Generating coaching feedback...",
        "Composing magic script..."
    ];

    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep(prev => (prev + 1) % steps.length);
        }, 1500); // Change text every 1.5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full bg-white rounded-[2.5rem] p-8 shadow-xl border border-indigo-50 flex flex-col items-center text-center space-y-6">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-ping opacity-20" />
                <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin" />
                <div className="absolute inset-2 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" />
                </div>
            </div>

            <div>
                <h3 className="text-xl font-black text-indigo-900 mb-2">Analyzing...</h3>
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="h-8"
                >
                    <p className="text-gray-500 font-medium">{steps[currentStep]}</p>
                </motion.div>
            </div>

            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 8, ease: "linear" }} // Approx total time
                    className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"
                />
            </div>
        </div>
    );
}
