
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Upload,
    X,
    Zap,
    Scan,
    ChevronLeft,
    Sparkles,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { BouncyButton } from '../components/ui/BouncyButton';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const MagicArtScannerPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedFiles, setSelectedFiles] = useState<{ file: File, preview: string }[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (selectedFiles.length + files.length > 50) {
            alert("Maximum 50 drawings allowed at once!");
            return;
        }

        const newFiles = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));

        setSelectedFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const calculateCost = (count: number) => {
        if (count <= 5) return 0;
        if (count <= 20) return 60;
        return 120;
    };

    const handleAnalyze = async () => {
        if (selectedFiles.length === 0 || !user) return;

        setIsAnalyzing(true);
        setUploadProgress(0);

        try {
            // 1. Batch Upload (MULTIPART) to avoid 413 Errors
            const BATCH_SIZE = 5;
            const allImageIds: string[] = [];
            const filesToUpload = selectedFiles;
            const totalBatches = Math.ceil(filesToUpload.length / BATCH_SIZE);

            for (let i = 0; i < totalBatches; i++) {
                const start = i * BATCH_SIZE;
                const end = Math.min(start + BATCH_SIZE, filesToUpload.length);
                const batch = filesToUpload.slice(start, end);

                const formData = new FormData();
                formData.append('userId', user.uid);
                batch.forEach(item => {
                    formData.append('images', item.file);
                });

                // Progress Calculation: 80% assigned to uploading
                const progressPerBatch = 80 / totalBatches;

                const uploadRes = await fetch('/api/audit/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) throw new Error(`Batch ${i + 1}/${totalBatches} upload failed`);

                const { imageIds } = await uploadRes.json();
                allImageIds.push(...imageIds);

                setUploadProgress(prev => Math.min(prev + progressPerBatch, 80));
            }

            setUploadProgress(90);

            // 2. Call Analyze
            // @ts-ignore
            const childName = user.profiles?.find(p => p.id === user.currentProfileId)?.name || user.name || "Your child";

            const analyzeRes = await fetch('/api/audit/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    imageIds: allImageIds,
                    childName
                })
            });

            if (!analyzeRes.ok) throw new Error("Analysis failed");

            const { report } = await analyzeRes.json();
            setUploadProgress(100);

            if (report && report.id) {
                setTimeout(() => {
                    navigate(`/parent/portfolio-report/${report.id}`);
                }, 500);
            } else {
                throw new Error("Failed to generate report");
            }

        } catch (error) {
            console.error('Analysis failed:', error);
            alert("Something went wrong with the scan. Please try again!");
            setIsAnalyzing(false);
        }
    };

    const cost = calculateCost(selectedFiles.length);

    return (
        <div className="min-h-screen bg-[#FDFCFB] p-6 pb-32">
            {/* Header */}
            <header className="max-w-4xl mx-auto flex items-center justify-between mb-8">
                <button
                    onClick={() => navigate('/parent')}
                    className="p-3 bg-white shadow-sm rounded-2xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-800">Magic Art Scanner</h1>
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Portfolio Audit</p>
                </div>
                <div className="w-12 h-12" /> {/* Spacer */}
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                {/* Upload Zone */}
                <div className="relative">
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={onFileSelect}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={isAnalyzing}
                    />
                    <div className={cn(
                        "border-4 border-dashed rounded-[3rem] p-12 text-center transition-all duration-500",
                        selectedFiles.length > 0
                            ? "border-emerald-100 bg-emerald-50/30"
                            : "border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50"
                    )}>
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl mx-auto mb-6 flex items-center justify-center">
                            <Upload className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Select Artwork Portfolio</h2>
                        <p className="text-slate-500 font-medium mb-4">Drag & drop or click to pick up to 50 drawings</p>

                        <div className="max-w-md mx-auto bg-indigo-50/50 rounded-2xl p-4 mb-2 text-sm text-indigo-800/80 font-medium text-left">
                            <p>
                                Already have a collection of masterpieces? Upload them here (up to 50)!
                                Magic Kat will analyze their unique artistic style, characteristics, and provide a multi-faceted growth report.
                            </p>
                        </div>

                        {selectedFiles.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-bold"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {selectedFiles.length} Masterpieces Selected
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Preview Grid */}
                {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        <AnimatePresence>
                            {selectedFiles.map((item, idx) => (
                                <motion.div
                                    key={item.preview}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm group"
                                >
                                    <img src={item.preview} className="w-full h-full object-cover" alt="Preview" />
                                    <button
                                        onClick={() => removeFile(idx)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Cost & Summary Card */}
                {selectedFiles.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center">
                                    <Zap className="w-8 h-8 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">Smart Analysis Package</h3>
                                    <p className="text-slate-400 font-medium">
                                        Cross-referencing {selectedFiles.length} drawings for growth insights
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-4xl font-black text-slate-900 mb-1">
                                    {cost === 0 ? "FREE" : `-${cost} Pt`}
                                </div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">
                                    {cost === 0 ? "TRIAL OFFER" : "PREMIUM ANALYTICS"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-50">
                            <BouncyButton
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full bg-indigo-600 text-white font-black py-6 rounded-3xl text-xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-4 group"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                                            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                                        </div>
                                        <span>ANALYZING {uploadProgress}%</span>
                                    </>
                                ) : (
                                    <>
                                        <Scan className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                                        START PORTFOLIO CHECKUP
                                        <Sparkles className="w-6 h-6" />
                                    </>
                                )}
                            </BouncyButton>
                        </div>
                    </motion.div>
                )}

                {/* Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
                        <h4 className="font-black text-indigo-900 mb-2 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Why Batch Analyze?
                        </h4>
                        <p className="text-indigo-800/60 text-sm font-medium leading-relaxed">
                            Single artworks show a moment. A portfolio shows a journey. Our AI analyzes patterns in colors, subjects, and lines over time to discover your child's true creative potential.
                        </p>
                    </div>
                    <div className="p-8 bg-amber-50/50 rounded-[2rem] border border-amber-100">
                        <h4 className="font-black text-amber-900 mb-2">Pricing Tiers</h4>
                        <ul className="space-y-2 text-sm font-bold text-amber-800/70">
                            <li className="flex justify-between"><span>1 - 5 Drawings</span> <span className="text-emerald-600">Free Trial</span></li>
                            <li className="flex justify-between"><span>6 - 20 Drawings</span> <span>60 Pt</span></li>
                            <li className="flex justify-between"><span>21 - 50 Drawings</span> <span>120 Pt (Best Value)</span></li>
                        </ul>
                    </div>
                </div>
            </main>

            {/* Scanning Overlay Animation */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-12 text-center"
                    >
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="relative mb-12"
                        >
                            <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] shadow-2xl flex items-center justify-center">
                                <Scan className="w-16 h-16 text-white" />
                            </div>
                            <motion.div
                                animate={{ y: [-40, 80, -40] }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_cyan]"
                            />
                        </motion.div>

                        <h2 className="text-5xl font-black text-slate-800 mb-6 tracking-tight">Magical AI Processing...</h2>
                        <p className="text-slate-500 text-xl font-medium max-w-lg mx-auto">
                            Magic Kat is reviewing {selectedFiles.length} masterpieces to build your growth report.
                        </p>

                        <div className="mt-12 w-full max-w-md h-3 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-indigo-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
