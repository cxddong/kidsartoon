import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, CheckCircle } from 'lucide-react';

interface CoCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceWork: {
        id: number;
        title: string;
        cover: string;
        type: string;
    } | null;
}

export const CoCreateModal: React.FC<CoCreateModalProps> = ({ isOpen, onClose, sourceWork }) => {
    const [step, setStep] = useState<'select' | 'mixing' | 'finished'>('select');
    const [result, setResult] = useState<any>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setStep('select');
            setResult(null);
        }
    }, [isOpen]);

    const handleMix = async () => {
        setStep('mixing');
        try {
            const res = await fetch('/api/media/cocreate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workIds: [sourceWork?.id, 999], // Mock second ID
                    type: sourceWork?.type,
                    userId: 'demo-user'
                })
            });
            const data = await res.json();

            // Simulate processing time for effect
            setTimeout(() => {
                setResult(data);
                setStep('finished');
            }, 2000);
        } catch (err) {
            console.error(err);
            setStep('select'); // Go back on error
        }
    };

    if (!isOpen || !sourceWork) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-hidden"
                    >
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full z-10">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>

                        {step === 'select' && (
                            <div className="text-center pt-4">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Create Together!</h2>
                                <p className="text-slate-500 mb-6">
                                    Mix <span className="font-bold text-primary">{sourceWork.title}</span> with a random community work to create something new!
                                </p>
                                <button
                                    onClick={handleMix}
                                    className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" /> Start Magic Mix
                                </button>
                            </div>
                        )}

                        {step === 'mixing' && (
                            <div className="text-center py-12">
                                <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-700">Mixing Magic...</h3>
                            </div>
                        )}

                        {step === 'finished' && result && (
                            <div className="text-center pt-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">It's Ready!</h2>
                                <p className="text-slate-500 mb-6">You created a new {result.type}!</p>

                                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                                    <p className="font-bold text-slate-700">✨ New Co-Creation ✨</p>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                                >
                                    Awesome!
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
