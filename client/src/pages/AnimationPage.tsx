import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

export const AnimationPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState<'confirm' | 'generating' | 'finished'>('confirm');

    // Check for passed bookId from PictureBookPage
    const bookId = location.state?.bookId;

    useEffect(() => {
        // If accessed directly without bookId, check localStorage or redirect
        if (!bookId) {
            const hasPictureStory = localStorage.getItem('hasPictureStory');
            if (!hasPictureStory) {
                // Redirect handled in GeneratePage, but double check here
            }
        }
    }, [bookId]);

    const generateAnimation = () => {
        setStep('generating');
        // Mock API call
        setTimeout(() => {
            setStep('finished');
        }, 4000);
    };

    return (
        <div className="min-h-screen bg-background pb-24">
            <div className="p-4">
                <header className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">Create Animation</h1>
                </header>

                <div className="max-w-2xl mx-auto">
                    {step === 'confirm' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm text-center">
                            <div className="aspect-video bg-slate-100 rounded-xl mb-6 flex items-center justify-center">
                                <Play className="w-16 h-16 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-bold mb-2">Ready to animate?</h2>
                            <p className="text-slate-500 mb-6">We will bring your comic book characters to life!</p>
                            <button onClick={generateAnimation} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform">
                                Start Magic Animation
                            </button>
                        </motion.div>
                    )}

                    {step === 'generating' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                            <Loader2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-slate-700">Animating your world...</h3>
                            <p className="text-slate-500 mt-2">This is the coolest part!</p>
                        </motion.div>
                    )}

                    {step === 'finished' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="aspect-video bg-black rounded-xl mb-6 relative overflow-hidden group">
                                <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80" alt="Video" className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Play className="w-16 h-16 text-white fill-current opacity-80 group-hover:scale-110 transition-transform" />
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-center mb-6">It's Alive!</h2>
                            <button onClick={() => navigate('/home')} className="w-full bg-slate-100 text-slate-700 py-3 rounded-xl font-bold">
                                Back Home
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
            <BottomNav />
        </div>
    );
};
