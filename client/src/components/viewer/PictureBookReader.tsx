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

    // Hardcoded Layout Parameters (Optimized for Magical Background)
    const layout = {
        bg: { scale: 102, x: 50, y: 50 },
        text: { padding: 12, fontSize: 21, posX: 153, posY: 8 },
        image: { padding: 12, scale: 106, posX: -111, posY: 0 }
    };

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

    useEffect(() => {
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
        <div className="fixed inset-0 z-50 flex flex-col bg-[#1a1a1a] overflow-hidden animate-in fade-in duration-500">
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>

            {/* Header */}
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-black/60 backdrop-blur-md border-b border-white/10 gap-4">
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

                    <div className="flex flex-col gap-1 w-full ml-2">
                        <h2 className="text-xl font-bold text-white/95 font-serif tracking-wide truncate max-w-md">
                            {title}
                        </h2>
                        <div className="flex flex-wrap gap-2 text-xs">
                            {metadata?.theme && (
                                <span className="px-2.5 py-1 rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/30 uppercase tracking-wider font-semibold">
                                    {metadata.theme.replace('theme_', '')}
                                </span>
                            )}
                            {metadata?.vibe && (
                                <span className="px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 uppercase tracking-wider font-semibold">
                                    {metadata.vibe.replace('vibe_', '')}
                                </span>
                            )}
                            {metadata?.style && (
                                <span className="px-2.5 py-1 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/30 uppercase tracking-wider font-semibold">
                                    {metadata.style.replace('style_', '')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-white/60 text-sm font-medium">
                    <span className="bg-white/10 px-4 py-1.5 rounded-full border border-white/5">
                        Page {currentIndex + 1} / {pages.length}
                    </span>
                </div>
            </div>

            {/* Main Content Area - The "Open Book" */}
            <div className="flex-1 relative flex items-center justify-center p-0 overflow-hidden min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative w-full h-full flex flex-col md:flex-row shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] overflow-hidden bg-[#f0e6d2]"
                        style={{
                            backgroundImage: "url('/assets/picture_book_bg_magical.jpg')",
                            backgroundSize: `${layout.bg.scale}% ${layout.bg.scale}%`,
                            backgroundPosition: `${layout.bg.x}% ${layout.bg.y}%`,
                            backgroundRepeat: 'no-repeat'
                        }}
                    >
                        {/* Left Page: Text */}
                        <div
                            className="w-full md:w-1/2 flex flex-col justify-center relative bg-transparent"
                            style={{
                                padding: `${layout.text.padding}%`,
                                transform: `translate(${layout.text.posX}px, ${layout.text.posY}px)`
                            }}
                        >
                            <div className="relative z-10 h-full flex flex-col max-h-full">
                                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent flex items-center">
                                    <p
                                        className="text-[#1a0f0a] font-serif leading-relaxed font-bold tracking-tight first-letter:font-black first-letter:text-[#4a2e1d] first-letter:mr-4 first-letter:float-left"
                                        style={{ fontSize: `${layout.text.fontSize}px` }}
                                    >
                                        <span
                                            className="float-left font-black text-[#4a2e1d] mr-4"
                                            style={{ fontSize: `${layout.text.fontSize * 3}px`, lineHeight: 1 }}
                                        >
                                            {currentPage.narrativeText.charAt(0)}
                                        </span>
                                        {currentPage.narrativeText.slice(1)}
                                    </p>
                                </div>

                                {currentPage.audioUrl && (
                                    <div className="mt-4 flex-shrink-0 flex justify-center">
                                        <button
                                            onClick={toggleAudio}
                                            className={`flex items-center gap-3 px-8 py-2.5 rounded-full transition-all duration-300 ${isPlaying
                                                ? 'bg-[#4a2e1d] text-white shadow-xl scale-105'
                                                : 'bg-white/30 text-[#1a0f0a] hover:bg-white/50 border-2 border-[#4a2e1d]/20 backdrop-blur-sm'
                                                }`}
                                        >
                                            <Volume2 size={24} className={isPlaying ? 'animate-pulse' : ''} />
                                            <span className="font-serif font-black text-base uppercase tracking-wider">{isPlaying ? 'Listen...' : 'Read Aloud'}</span>
                                            <audio
                                                ref={audioRef}
                                                src={currentPage.audioUrl}
                                                onEnded={() => setIsPlaying(false)}
                                                hidden
                                            />
                                        </button>
                                    </div>
                                )}

                                <div className="text-center mt-4 flex-shrink-0 text-[#1a0f0a]/60 font-serif text-sm italic font-black">
                                    ~ Page {currentIndex + 1} ~
                                </div>
                            </div>
                        </div>

                        {/* Right Page: Image */}
                        <div
                            className="w-full md:w-1/2 relative bg-transparent flex items-center justify-center overflow-hidden"
                            style={{
                                padding: `${layout.image.padding}%`,
                                transform: `translate(${layout.image.posX}px, ${layout.image.posY}px)`
                            }}
                        >
                            <div className="relative z-10 w-full h-full flex items-center justify-center">
                                <img
                                    src={currentPage.imageUrl}
                                    alt={`Page ${currentIndex + 1}`}
                                    className="object-contain shadow-2xl rounded-lg border-2 border-white/5"
                                    style={{
                                        maxWidth: `${layout.image.scale}%`,
                                        maxHeight: `${layout.image.scale}%`
                                    }}
                                />
                            </div>

                            <div className="absolute bottom-8 text-[#1a0f0a]/60 font-serif text-sm italic left-0 right-0 text-center pointer-events-none font-black">
                                ~ Page {currentIndex + 1} ~
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows */}
                <div className="absolute inset-x-2 md:inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-30">
                    <button
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all pointer-events-auto transform hover:scale-110 ${currentIndex === 0 ? 'opacity-0 scale-90' : 'opacity-100'}`}
                    >
                        <ChevronLeft size={36} />
                    </button>

                    <button
                        onClick={handleNext}
                        className={`p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all pointer-events-auto transform hover:scale-110 ${currentIndex === pages.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <ChevronRight size={36} />
                    </button>
                </div>

                {!showPuzzle && <PuzzleButton onClick={() => setShowPuzzle(true)} />}
            </div>

            {/* Footer */}
            <div className="relative z-10 bg-black/40 backdrop-blur-xl border-t border-white/10 p-4">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
                        {pages.map((page, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${currentIndex === idx ? 'border-amber-400 scale-105 shadow-lg shadow-amber-400/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                            >
                                <img src={page.imageUrl} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        {currentIndex === pages.length - 1 ? (
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                <CheckCircle2 size={24} />
                                <span>Finish</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                <span>Next</span>
                                <ChevronRight size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

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
