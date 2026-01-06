import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Volume2, Maximize2, CheckCircle2 } from 'lucide-react';
import { PuzzleButton } from '../puzzle/PuzzleButton';
import { PuzzleGame } from '../puzzle/PuzzleGame';

interface BookPage {
    pageNumber: number;
    imageUrl: string;
    narrativeText: string;
    audioUrl?: string;
}

interface PictureBookReaderProps {
    title: string;
    pages: BookPage[];
    onClose: () => void;
}

const PictureBookReader: React.FC<PictureBookReaderProps> = ({ title, pages, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [showPuzzle, setShowPuzzle] = useState(false);

    const currentPage = pages[currentIndex];

    useEffect(() => {
        // Reset audio when page changes
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.load();
            setIsPlaying(false);
        }
    }, [currentIndex]);

    const toggleAudio = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleNext = () => {
        if (currentIndex < pages.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-md overflow-hidden animate-in fade-in duration-500">
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-xl font-medium text-white/90 truncate max-w-[200px] md:max-w-md">
                        {title}
                    </h2>
                </div>

                <div className="flex items-center gap-4 text-white/60 text-sm font-medium">
                    <span className="bg-white/10 px-3 py-1 rounded-full">
                        Page {currentIndex + 1} of {pages.length}
                    </span>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="relative w-full max-w-6xl aspect-[16/10] md:aspect-[16/9] flex flex-col md:flex-row bg-[#fdfaf3] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden border border-[#e8dfc7]"
                    >
                        {/* Desktop: Side-by-side | Mobile: Stacked */}

                        {/* Left: Text Area (40% on desk) */}
                        <div className="w-full md:w-[40%] flex flex-col p-6 md:p-10 justify-center relative bg-[#fdfaf3]">
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>

                            <div className="relative z-10 space-y-6">
                                <div className="w-12 h-1 bg-amber-200 rounded-full mb-2"></div>
                                <p className="text-[#333] font-serif leading-relaxed text-lg md:text-xl lg:text-2xl" id="book-narrative-text">
                                    {currentPage.narrativeText}
                                </p>

                                {currentPage.audioUrl && (
                                    <button
                                        onClick={toggleAudio}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isPlaying ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                            }`}
                                    >
                                        <Volume2 size={20} className={isPlaying ? 'animate-pulse' : ''} />
                                        <span className="font-medium">{isPlaying ? 'Playing...' : 'Listen to Story'}</span>
                                        <audio
                                            ref={audioRef}
                                            src={currentPage.audioUrl}
                                            onEnded={() => setIsPlaying(false)}
                                            hidden
                                        />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Right: Image Area (60% on desk) */}
                        <div className="w-full h-64 md:h-auto md:w-[60%] relative bg-slate-100 overflow-hidden border-t md:border-t-0 md:border-l border-[#e8dfc7] flex items-center justify-center">
                            <img
                                src={currentPage.imageUrl}
                                alt={`Page ${currentIndex + 1}`}
                                className="w-full h-full object-contain select-none"
                            />
                            <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows (Desktop) */}
                <div className="absolute inset-x-4 md:inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all pointer-events-auto shadow-lg ${currentIndex === 0 ? 'opacity-0 scale-90' : 'opacity-100'
                            }`}
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <button
                        onClick={handleNext}
                        className={`p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all pointer-events-auto shadow-lg ${currentIndex === pages.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                            }`}
                    >
                        <ChevronRight size={32} />
                    </button>
                </div>

                {/* Floating Puzzle Button for the current book page */}
                {!showPuzzle && (
                    <PuzzleButton onClick={() => setShowPuzzle(true)} />
                )}
            </div>

            {/* Footer: Thumbnails and Actions */}
            <div className="relative z-10 bg-black/40 backdrop-blur-xl border-t border-white/10 p-4">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">

                    {/* Thumbnail Strip */}
                    <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
                        {pages.map((page, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${currentIndex === idx
                                    ? 'border-amber-400 scale-105 shadow-lg shadow-amber-400/20'
                                    : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'
                                    }`}
                            >
                                <img src={page.imageUrl} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 py-2">
                        {currentIndex === pages.length - 1 ? (
                            <button
                                onClick={onClose}
                                className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-bold shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <CheckCircle2 size={24} />
                                <span>Finish Reading</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="group flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold shadow-xl hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all"
                            >
                                <span>Next Page</span>
                                <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Magic Puzzle Game Overlay */}
            {showPuzzle && (
                <PuzzleGame
                    imageUrl={currentPage.imageUrl}
                    imageId={`book-${title.replace(/\s+/g, '-')}-${currentIndex}`}
                    onClose={() => setShowPuzzle(false)}
                />
            )}
        </div>
    );
};

export default PictureBookReader;
