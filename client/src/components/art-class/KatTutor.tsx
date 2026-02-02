import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Volume2 } from 'lucide-react';

interface KatTutorProps {
    message: string;
    emotion?: 'happy' | 'thinking' | 'waiting' | 'celebrate';
    onSpeak?: () => void;
    position?: 'left' | 'right' | 'center' | 'bottom-right' | 'static';
    className?: string;
    startSpeaking?: boolean;
    videoSrc?: string; // Optional video source
    isSpeaking?: boolean; // Control video playback
}

export const KatTutor: React.FC<KatTutorProps> = ({
    message,
    emotion = 'happy',
    onSpeak,
    position = 'bottom-right',
    className = '',
    startSpeaking = false,
    videoSrc,
    isSpeaking = false
}) => {
    // Determine Kat Image based on emotion usually
    // detailed implementations would swap images
    const [displayedMessage, setDisplayedMessage] = useState(message);
    const [hasSpoken, setHasSpoken] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const prevStartSpeakingRef = useRef(startSpeaking);

    useEffect(() => {
        setDisplayedMessage(message);
    }, [message]);

    // Auto-speak support - only trigger on false->true transition of startSpeaking
    useEffect(() => {
        const prevValue = prevStartSpeakingRef.current;
        prevStartSpeakingRef.current = startSpeaking;

        // Only speak when transitioning from false to true
        if (!prevValue && startSpeaking && onSpeak && !hasSpoken) {
            console.log("[KatTutor] Auto-speaking triggered (transition detected)");
            onSpeak();
            setHasSpoken(true);
        }
    }, [startSpeaking, onSpeak, hasSpoken]);

    // Video playback control based on isSpeaking
    useEffect(() => {
        if (!videoRef.current || !videoSrc) return;

        if (isSpeaking) {
            // AI is speaking - play video
            videoRef.current.play().catch(err => console.warn('Video play failed:', err));
        } else {
            // AI stopped speaking - pause and reset to start
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [isSpeaking, videoSrc]);

    const positionClasses = {
        'left': 'top-20 left-4 flex-row',
        'right': 'top-20 right-4 flex-row-reverse',
        'center': 'top-1/4 left-1/2 -translate-x-1/2 flex-col items-center',
        'bottom-right': 'bottom-8 right-8 flex-col-reverse items-end'
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`${position === 'static' ? 'relative flex-col items-center' : `absolute z-50 flex gap-4 pointer-events-none ${positionClasses[position]}`} ${className} w-full h-full`}
            >
                {/* Kat Avatar */}
                {/* Kat Avatar Container Wrapper */}
                <div className="relative group cursor-pointer w-full h-full" onClick={onSpeak}>
                    {/* Main Circular Avatar */}
                    <div className="relative w-full h-full rounded-full border-[5px] border-white shadow-xl overflow-hidden bg-white hover:scale-105 transition-transform duration-300">
                        {videoSrc ? (
                            <video
                                ref={videoRef}
                                src={videoSrc}
                                loop
                                muted
                                playsInline
                                // Classic 'Cover Background' approach
                                className="absolute top-1/2 left-1/2 w-full h-full object-cover origin-center bg-black"
                                style={{
                                    // Scale down slightly (0.85) to ensure the face (usually center) isn't too close to edges
                                    // This creates a "safe area" effect inside the circle without black bars if we match bg
                                    // But wait, if we scale down, we might see background. 
                                    // User said "shortest side set a circle". That is exactly object-cover.
                                    // "No zoom" means don't scale UP.
                                    // Let's stick to standard transform.
                                    transform: 'translate(-50%, -50%)',
                                    maxWidth: 'none',
                                    maxHeight: 'none'
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl">
                                {emotion === 'happy' && '🦁'}
                                {emotion === 'thinking' && '🤔'}
                                {emotion === 'waiting' && '👀'}
                                {emotion === 'celebrate' && '🎉'}
                            </div>
                        )}
                    </div>

                    {/* Speaker Icon Badge - OUTSIDE the overflow-hidden avatar */}
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1.5 rounded-full border-2 border-white z-10 shadow-sm pointer-events-none group-hover:scale-110 transition-transform">
                        <Volume2 className="w-4 h-4 text-yellow-900" />
                    </div>
                </div>

                {/* Speech Bubble */}
                {displayedMessage && (
                    <motion.div
                        key={message}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="bg-white/95 backdrop-blur-md p-3 rounded-2xl rounded-tr-none shadow-lg border-2 border-indigo-100 max-w-[200px] pointer-events-auto"
                    >
                        <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-slate-800 leading-tight">
                                {displayedMessage}
                            </p>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AnimatePresence >
    );
};
