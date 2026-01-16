import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Volume2, Maximize2, Minimize2, CheckCircle2 } from 'lucide-react';
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
    metadata?: any;
    onClose: () => void;
}

const PictureBookReader: React.FC<PictureBookReaderProps> = ({ title, pages, metadata, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [showPuzzle, setShowPuzzle] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const currentPage = pages[currentIndex];

    // ... (keep useEffect/handlers same)

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
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/10 gap-4">
                <div className="flex items-start gap-3 flex-1">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white mt-1"
                    >
                        <X size={24} />
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white mt-1"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                    </button>

                    <div className="flex flex-col gap-1 w-full">
                        <h2 className="text-xl font-bold text-white/95 font-serif tracking-wide">
                            {title}
                        </h2>
                        {/* Metadata Badges */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            {metadata?.vibe && (
                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 uppercase tracking-wider font-semibold">
                                    {metadata.vibe.replace('vibe_', '')}
                                </span>
                            )}
                            {metadata?.style && (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/30 uppercase tracking-wider font-semibold">
                                    {metadata.style.replace('style_', '')}
                                </span>
                            )}
                        </div>
                        {/* Full Prompt Display */}
                        {metadata?.storyText && (
                            <div className="mt-1 bg-white/5 p-2 rounded-lg border border-white/5 text-sm text-white/70 max-h-[60px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                                <span className="text-white/40 font-medium uppercase text-xs mr-2">Story Idea:</span>
                                {metadata.storyText}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-white/60 text-sm font-medium">
                    <span className="bg-white/10 px-4 py-1.5 rounded-full border border-white/5">
                        Page {currentIndex + 1} / {pages.length}
                    </span>
                </div>
            </div>

            {/* Main Content Area - The "Open Book" */}
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.5, type: "spring", bounce: 0 }}
                        // Added 'max-h-full' and 'h-auto' to ensure it fits within the parent flex container
                        // On small screens, we ensure scrolling happens at page level or inner level
                        className="relative w-full max-w-6xl max-h-full aspect-[16/10] md:aspect-[3/2] lg:aspect-[16/9] flex flex-col md:flex-row rounded-md shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] overflow-hidden bg-[#fffbf4]"
                    >
                        {/* Book Spine Effect */}
                        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 z-20 bg-gradient-to-r from-neutral-300/30 via-neutral-100/10 to-neutral-400/30 mix-blend-multiply pointer-events-none"></div>

                        {/* Left Page: Text */}
                        <div className="w-full md:w-1/2 flex flex-col p-6 md:p-12 justify-center relative bg-[#fffbf4]">
                            {/* Page Texture */}
                            <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
                            {/* Inner Shadow for fold */}
                            <div className="absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-l from-black/5 to-transparent pointer-events-none md:block hidden"></div>

                            <div className="relative z-10 h-full flex flex-col max-h-full">
                                {/* Scrollable Text Area */}
                                <div className="flex-1 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-amber-200/50 scrollbar-track-transparent">
                                    <p className="text-[#2c1810] font-serif leading-loose text-lg md:text-xl tracking-wide first-letter:text-5xl first-letter:font-bold first-letter:text-amber-800 first-letter:mr-3 first-letter:float-left">
                                        {currentPage.narrativeText}
                                    </p>
                                </div>

                                {currentPage.audioUrl && (
                                    <div className="mt-4 flex-shrink-0 flex justify-center">
                                        <button
                                            onClick={toggleAudio}
                                            className={`flex items-center gap-3 px-6 py-2.5 rounded-full transition-all duration-300 ${isPlaying
                                                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 scale-105'
                                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200/50'
                                                }`}
                                        >
                                            <Volume2 size={20} className={isPlaying ? 'animate-pulse' : ''} />
                                            <span className="font-serif font-medium">{isPlaying ? 'Listen...' : 'Read Aloud'}</span>
                                            <audio
                                                ref={audioRef}
                                                src={currentPage.audioUrl}
                                                onEnded={() => setIsPlaying(false)}
                                                hidden
                                            />
                                        </button>
                                    </div>
                                )}

                                <div className="text-center mt-2 flex-shrink-0 text-[#2c1810]/30 font-serif text-sm italic">
                                    - {currentIndex + 1} -
                                </div>
                            </div>
                        </div>

                        {/* Right Page: Image */}
                        <div className="w-full md:w-1/2 relative bg-white flex items-center justify-center p-4 overflow-hidden">
                            {/* Page Texture */}
                            <div className="absolute inset-0 opacity-[0.4] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>
                            {/* Inner Shadow for fold */}
                            <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-black/5 to-transparent pointer-events-none md:block hidden"></div>

                            <div className="relative z-10 w-full h-full flex items-center justify-center p-2 md:p-6 max-h-full">
                                <img
                                    src={currentPage.imageUrl}
                                    alt={`Page ${currentIndex + 1}`}
                                    className="max-w-full max-h-full object-contain drop-shadow-xl transform rotate-1 rounded-sm"
                                />
                            </div>

                            <div className="absolute bottom-6 text-[#2c1810]/30 font-serif text-sm italic left-0 right-0 text-center pointer-events-none">
                                - {currentIndex + 1} -
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows (Desktop) - Moved outside text flow */}
                <div className="absolute inset-x-2 md:inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-30">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all pointer-events-auto transform hover:scale-110 ${currentIndex === 0 ? 'opacity-0 scale-90' : 'opacity-100'
                            }`}
                    >
                        <ChevronLeft size={36} />
                    </button>

                    <button
                        onClick={handleNext}
                        className={`p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all pointer-events-auto transform hover:scale-110 ${currentIndex === pages.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                            }`}
                    >
                        <ChevronRight size={36} />
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
