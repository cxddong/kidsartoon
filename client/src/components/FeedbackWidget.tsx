import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageCircle, X, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const USAGE_KEY = 'kat_feature_usage_count';
const LAST_FEEDBACK_KEY = 'kat_last_feedback_timestamp';
const USAGE_THRESHOLD = 3; // Show after 3 feature uses

export const FeedbackWidget: React.FC = () => {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        // Check usage on mount
        const usage = parseInt(localStorage.getItem(USAGE_KEY) || '0');
        const lastFeedback = localStorage.getItem(LAST_FEEDBACK_KEY);

        // Only show if usage threshold met AND not submitted recently (e.g. within last 7 days)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentlySubmitted = lastFeedback && parseInt(lastFeedback) > sevenDaysAgo;

        if (usage >= USAGE_THRESHOLD && !recentlySubmitted) {
            // Delay showing to not overwhelm
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            await fetch('/api/feedback/user-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.uid || 'anonymous',
                    rating,
                    comment
                })
            });
            setIsSubmitted(true);
            localStorage.setItem(LAST_FEEDBACK_KEY, Date.now().toString());
            // Reset usage after successful feedback
            localStorage.setItem(USAGE_KEY, '0');

            setTimeout(() => {
                setIsOpen(false);
                setIsVisible(false);
            }, 3000);
        } catch (error) {
            console.error('Feedback submission failed', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-indigo-100 w-80 mb-4 overflow-hidden relative"
                    >
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {!isSubmitted ? (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-indigo-900 mb-1">How's your magic? ✨</h3>
                                    <p className="text-sm text-gray-500">Your feedback helps Magic Kat learn!</p>
                                </div>

                                {/* Star Rating */}
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            onClick={() => setRating(star)}
                                            className="transition-transform active:scale-90"
                                        >
                                            <Star
                                                className={cn(
                                                    "w-8 h-8 transition-colors",
                                                    (hoverRating || rating) >= star
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-gray-200"
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Comment Area */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Any advice or suggestions?</label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="What can we do better? 😺"
                                        className="w-full h-24 p-3 bg-gray-50 rounded-2xl border border-gray-100 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none text-sm text-gray-700 outline-none"
                                    />
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={rating === 0 || isSubmitting}
                                    className={cn(
                                        "w-full py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all shadow-lg",
                                        rating > 0
                                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-500/25 hover:scale-[1.02]"
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    )}
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Feedback
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="py-8 text-center space-y-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                                >
                                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                                </motion.div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Magical!</h3>
                                    <p className="text-sm text-gray-500">Thanks for helping us improve!</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            {!isOpen && (
                <div className="relative">
                    <motion.button
                        layoutId="feedback-trigger"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        className="group relative flex items-center gap-2 bg-white/90 backdrop-blur-md p-3 px-5 rounded-full shadow-xl border border-indigo-100 text-indigo-600 font-bold transition-all hover:bg-indigo-600 hover:text-white"
                    >
                        <MessageCircle className="w-5 h-5" />
                        <span>Feedback</span>

                        {/* Pulsing indicator */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white animate-bounce" />
                    </motion.button>

                    {/* Close button for the floating trigger */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsVisible(false);
                        }}
                        className="absolute -top-2 -left-2 w-6 h-6 bg-gray-600 hover:bg-gray-800 rounded-full flex items-center justify-center text-white shadow-lg transition-colors z-10"
                        title="关闭反馈"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
};

export const incrementUsage = () => {
    const usage = parseInt(localStorage.getItem(USAGE_KEY) || '0');
    localStorage.setItem(USAGE_KEY, (usage + 1).toString());
};
