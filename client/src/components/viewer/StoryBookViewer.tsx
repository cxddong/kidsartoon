import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX, FileDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface StoryPage {
    pageNumber: number;
    imageUrl: string;
    narrativeText: string;
    audioUrl?: string;
    text?: string;
}

export interface StoryBook {
    title: string;
    coverImage: string;
    pages: StoryPage[];
    selectionTags?: {
        theme: string;
        visualStyle: string;
        pace: string;
        characterRole: string;
    };
}

interface StoryBookViewerProps {
    book: StoryBook;
    onClose: () => void;
    onRemix?: (url: string) => void;
}

export const StoryBookViewer: React.FC<StoryBookViewerProps> = ({ book, onClose, onRemix }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const totalPages = book.pages.length;
    const pages = book.pages.map(p => ({
        ...p,
        narrativeText: p.narrativeText || p.text || "",
        imageUrl: p.imageUrl || (p as any).image_url || (p as any).url || ""
    }));

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert('Please allow popups for PDF export');

        const htmlContent = `
            <html>
            <head>
                <title>${book.title} - Printable</title>
                <style>
                    body { font-family: sans-serif; margin: 0; padding: 0; }
                    .page { page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; box-sizing: border-box; }
                    img { max-width: 100%; max-height: 70vh; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    p { font-size: 24px; line-height: 1.6; max-width: 800px; text-align: center; color: #333; font-family: 'Georgia', serif; }
                    h1 { font-size: 48px; margin-bottom: 40px; color: #4a148c; }
                    .cover { text-align: center; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="page cover">
                    <h1>${book.title || 'My Magic Story'}</h1>
                    <img src="${book.coverImage}" alt="Cover" style="max-height: 60vh;">
                    <p>Created with Kids Art Tales</p>
                </div>
                ${pages.map((p, i) => `
                    <div class="page">
                        <img src="${p.imageUrl}" alt="Page ${i + 1}">
                        <p>${p.narrativeText}</p>
                        <div style="font-size: 12px; color: #999; margin-top: 20px;">Page ${i + 1}</div>
                    </div>
                `).join('')}
                <script>
                    window.onload = () => { setTimeout(() => window.print(), 500); };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleNext = () => {
        if (currentPage < totalPages - 1) {
            paginate(1);
        }
    };

    // ... (rest of logic handles)

    const handlePrev = () => {
        if (currentPage > 0) {
            paginate(-1);
        }
    };

    // Auto-play audio on page change
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        const pageAudio = pages[currentPage]?.audioUrl;
        if (pageAudio && isPlaying) {
            audioRef.current = new Audio(pageAudio);
            audioRef.current.play().catch(e => console.warn("Audio play failed:", e));
        }

        return () => {
            if (audioRef.current) audioRef.current.pause();
        };
    }, [currentPage, isPlaying, book]);

    const currentPageData = pages[currentPage];

    // Slide/Flip Animation Variants
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            rotateY: direction > 0 ? 90 : -90, // Increased for distinct flip
            scale: 0.8
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            rotateY: 0,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
            rotateY: direction < 0 ? 90 : -90,
            scale: 0.8
        })
    };

    const [direction, setDirection] = useState(0);

    const paginate = (newDirection: number) => {
        if (newDirection === 1 && currentPage === totalPages - 1) return;
        if (newDirection === -1 && currentPage === 0) return;

        setDirection(newDirection);
        setCurrentPage(prev => prev + newDirection);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') paginate(1);
            if (e.key === 'ArrowLeft') paginate(-1);
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentPage]);

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-0 md:p-8 overflow-hidden">

            {/* Header / Controls */}
            <div className="absolute top-4 right-4 flex gap-4 z-50 pointer-events-auto">
                <button
                    onClick={handleExportPDF}
                    className="p-3 bg-purple-600/80 backdrop-blur-md rounded-full text-white hover:bg-purple-700 transition-all border border-white/10"
                    title="Print PDF"
                >
                    <FileDown className="w-6 h-6" />
                </button>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/10"
                    title="Toggle Narration"
                >
                    {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
                </button>
                <button
                    onClick={onClose}
                    className="p-3 bg-red-500/80 backdrop-blur-md rounded-full text-white hover:bg-red-600 transition-all shadow-lg"
                    title="Close"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Book Layout Container */}
            <div className="relative w-full max-w-4xl h-full flex flex-col items-center justify-center perspective-[2000px]">

                <div className="relative w-full h-[85vh] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden bg-white border-[12px] border-white/5 mx-auto">

                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={currentPage}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 200, damping: 25 },
                                opacity: { duration: 0.3 },
                                rotateY: { duration: 0.6 }
                            }}
                            className="absolute inset-0 w-full h-full flex flex-col bg-white"
                        >
                            {/* Top Panel: Visuals (55%) - Higher Frame for Cinematic Feel */}
                            <div className="relative w-full h-[55%] flex items-center justify-center p-0 overflow-hidden bg-slate-200">
                                <img
                                    src={currentPageData?.imageUrl}
                                    alt={`Page ${currentPage + 1}`}
                                    className="w-full h-full object-contain"
                                />
                                {/* Bottom Shadow for Image Depth - Page Fold Simulation */}
                                <div className="absolute inset-x-0 bottom-0 h-4 bg-black/5 shadow-[0_-4px_12px_rgba(0,0,0,0.3)] z-10" />
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                            </div>

                            {/* Bottom Panel: Story Text (45%) - Premium "Story Page" Area */}
                            <div className="relative w-full h-[45%] bg-[#FAF9F6] flex flex-col items-center justify-center px-10 md:px-24 py-12 text-center shadow-inner">

                                {/* Parchment Texture */}
                                <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply rounded-b-2xl"
                                    style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}
                                />

                                {/* Subtle Fold/Crease at the top */}
                                <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/[0.03] to-transparent pointer-events-none" />

                                {/* Decoration: Elegant Page Marker */}
                                <div className="absolute top-10 flex items-center gap-4 opacity-40">
                                    <div className="h-px w-10 bg-amber-900/40" />
                                    <span className="font-serif font-black tracking-[0.4em] text-amber-900 text-[10px] md:text-xs uppercase">
                                        EPISODE {currentPage + 1}
                                    </span>
                                    <div className="h-px w-10 bg-amber-900/40" />
                                </div>

                                <div className="relative w-full max-w-4xl flex flex-col items-center justify-center gap-10 mt-6 z-10">
                                    <p className="font-serif text-xl md:text-3xl font-black text-slate-800 leading-tight tracking-tight drop-shadow-sm transition-all duration-700">
                                        {currentPageData?.narrativeText}
                                    </p>

                                    {onRemix && (
                                        <button
                                            onClick={() => onRemix(currentPageData.imageUrl)}
                                            className="px-10 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-full text-sm font-black hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl group border border-white/10"
                                        >
                                            <span className="bg-white/20 p-1 rounded-md group-hover:rotate-12 transition-transform">✨</span>
                                            Animate this scene
                                        </button>
                                    )}
                                </div>

                                {/* Navigation - Integrated into Paper Area */}
                                <div className="mt-auto w-full flex justify-between items-center z-10 px-4">
                                    <button
                                        onClick={() => paginate(-1)}
                                        disabled={currentPage === 0}
                                        className="p-5 text-slate-300 hover:text-purple-600 hover:bg-white disabled:opacity-0 transition-all rounded-full shadow-sm hover:shadow-lg"
                                    >
                                        <ChevronLeft className="w-10 h-10" />
                                    </button>

                                    <div className="flex gap-4">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "w-3 h-3 rounded-full transition-all duration-500",
                                                    i === currentPage ? "bg-purple-600 w-12 shadow-[0_0_15px_rgba(147,51,234,0.3)]" : "bg-slate-200"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => paginate(1)}
                                        disabled={currentPage === totalPages - 1}
                                        className="p-5 text-slate-300 hover:text-purple-600 hover:bg-white disabled:opacity-0 transition-all rounded-full shadow-sm hover:shadow-lg"
                                    >
                                        <ChevronRight className="w-10 h-10" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Mobile Touch Zones */}
                <div className="absolute inset-y-0 left-0 w-16 z-30 md:hidden" onClick={() => paginate(-1)} />
                <div className="absolute inset-y-0 right-0 w-16 z-30 md:hidden" onClick={() => paginate(1)} />

            </div>
        </div>
    );
};
