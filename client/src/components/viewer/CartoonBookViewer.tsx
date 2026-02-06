// client/src/components/viewer/CartoonBookViewer.tsx

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComicBubbleGrid } from '../ComicBubble';
import jsPDF from 'jspdf';
import { cn } from '../../lib/utils';

interface CartoonBookPage {
    pageNumber: number;
    imageUrl: string;
    text?: string;
    panels?: Array<{     // NEW: Panel dialogue data
        panel: number;
        caption: string;
        sceneDescription: string;
        emotion?: string;
        bubbleType?: string;
        bubblePosition?: string;
    }>;
}

interface CartoonBookViewerProps {
    title: string;
    vibe: string;
    pages: CartoonBookPage[];
    assets?: {
        slot1?: { imageUrl: string; description: string };
        slot2?: { imageUrl: string; description: string };
        slot3?: { imageUrl: string; description: string };
        slot4?: { imageUrl: string; description: string };
    };
    settings?: {
        totalPages: number;
        layout: string;
        plotHint?: string;
    };
    createdAt: number;
    onClose: () => void;
}

export const CartoonBookViewer: React.FC<CartoonBookViewerProps> = ({
    title,
    vibe,
    pages,
    assets,
    settings,
    createdAt,
    onClose
}) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [showMetadata, setShowMetadata] = useState(false);

    const nextPage = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleDownload = async () => {
        const link = document.createElement('a');
        link.href = pages[currentPage].imageUrl;
        link.download = `${title}-page-${currentPage + 1}.jpg`;
        link.click();
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: title,
                text: `Check out my graphic novel: ${title}`,
                url: window.location.href
            });
        } else {
            alert('Share functionality not supported in your browser');
        }
    };

    const handleDownloadPDF = async () => {
        try {
            console.log('[PDF] Starting PDF generation for', pages.length, 'pages...');

            const pdf = new jsPDF('portrait', 'mm', 'a4');
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 10;
            const imgWidth = pageWidth - (2 * margin);

            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                console.log(`[PDF] Processing page ${i + 1}/${pages.length}...`);

                const pageData = pages[i];
                let imageLoaded = false;
                let finalImgHeight = 0;

                try {
                    // ROBUST IMAGE LOADING: Use Backend Proxy to bypass CORS completely
                    const rawImageUrl = pageData.imageUrl;
                    if (rawImageUrl) {
                        const proxyUrl = `/api/media/proxy-image?url=${encodeURIComponent(rawImageUrl)}`;
                        const img = new Image();
                        img.crossOrigin = "anonymous";

                        const imgDataUrl = await new Promise<string>((resolve, reject) => {
                            const timeout = setTimeout(() => reject(new Error('Proxy timeout')), 15000);
                            img.onload = () => {
                                clearTimeout(timeout);
                                const canvas = document.createElement('canvas');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    ctx.drawImage(img, 0, 0);
                                    try {
                                        resolve(canvas.toDataURL('image/jpeg', 0.8));
                                    } catch (e) {
                                        reject(e);
                                    }
                                } else {
                                    reject(new Error('Failed canvas ctx'));
                                }
                            };
                            img.onerror = () => {
                                clearTimeout(timeout);
                                reject(new Error('Failed to load proxied image'));
                            };
                            img.src = proxyUrl;
                        });

                        const tempImg = new Image();
                        tempImg.src = imgDataUrl;
                        await new Promise(r => tempImg.onload = r);

                        const imgHeight = (tempImg.height / tempImg.width) * imgWidth;
                        const maxHeight = pageHeight - 110; // Extra room for panel text
                        finalImgHeight = Math.min(imgHeight, maxHeight);
                        const finalWidth = (tempImg.width / tempImg.height) * finalImgHeight;

                        pdf.addImage(imgDataUrl, 'JPEG', margin, margin, finalWidth, finalImgHeight);
                        imageLoaded = true;
                    }
                } catch (imgError) {
                    console.error(`[PDF] Proxy error on page ${i + 1}:`, imgError);

                    pdf.setFontSize(10);
                    pdf.setTextColor(255, 0, 0);
                    pdf.text(`[Image load failed: ${i + 1}] Connection to Magic Lab Proxy failed.`, margin, 50);
                    pdf.setTextColor(0, 0, 0);
                    finalImgHeight = 35;
                }

                // IMPROVED: Render panel scripts instead of overall chapter text
                if (pageData.panels && pageData.panels.length > 0) {
                    pdf.setFontSize(10);

                    let yPos = margin + finalImgHeight + 10;
                    pageData.panels.forEach((p: any, pIdx: number) => {
                        const content = p.dialogue || p.caption || p.story_text || p.text || '';
                        if (!content) return;

                        const panelLabel = `Panel ${pIdx + 1}: `;

                        pdf.setFont('helvetica', 'bold');
                        pdf.setTextColor(128, 0, 128); // Purple label
                        pdf.text(panelLabel, margin, yPos);

                        pdf.setFont('helvetica', 'normal');
                        pdf.setTextColor(40, 40, 40);
                        const labelWidth = pdf.getTextWidth(panelLabel);
                        const textLines = pdf.splitTextToSize(content, imgWidth - labelWidth);

                        pdf.text(textLines, margin + labelWidth, yPos);
                        yPos += (textLines.length * 5) + 4;
                    });
                } else if (pageData.text) {
                    // Fallback to page text if no panels
                    pdf.setFontSize(12);
                    pdf.setFont('helvetica', 'italic');
                    pdf.setTextColor(100, 100, 100);
                    const textY = margin + finalImgHeight + 15;
                    const textLines = pdf.splitTextToSize(pageData.text, imgWidth);
                    pdf.text(textLines, margin, textY);
                }
            }

            // Save PDF
            const filename = `${title.replace(/[^a-z0-9]/gi, '_')}_cartoon_book.pdf`;
            pdf.save(filename);

            console.log('[PDF] PDF saved successfully:', filename);
            alert(`✅ PDF downloaded: ${filename}`);

        } catch (error) {
            console.error('[PDF] Critical error:', error);
            alert(`❌ PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Consolidated Layout Parameters (Identical to PictureBookReader)
    const layout = {
        bg: { scale: 102, x: 50, y: 50 },
        text: { padding: 12, fontSize: 21, posX: 153, posY: 8 },
        image: { padding: 12, scale: 106, posX: -111, posY: 0 }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1a1a] p-0 overflow-hidden">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full h-full flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Header (Matching PictureBookReader style) */}
                <div className="relative z-50 flex items-center justify-between p-4 bg-black/60 backdrop-blur-md border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-white/95 font-serif tracking-wide truncate max-w-md">
                            {title}
                        </h2>
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/30 text-blue-200 border border-blue-500/30 text-[10px] uppercase tracking-wider font-semibold">
                            {vibe}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-white/60 text-sm font-medium">
                        <span className="bg-white/10 px-4 py-1.5 rounded-full border border-white/5">
                            Page {currentPage + 1} / {pages.length}
                        </span>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 relative flex items-center justify-center p-0 overflow-hidden min-h-0 bg-[#f0e6d2]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="relative w-full h-full flex flex-col md:flex-row shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
                            style={{
                                backgroundImage: "url('/assets/picture_book_bg_magical.jpg')",
                                backgroundSize: `${layout.bg.scale}% ${layout.bg.scale}%`,
                                backgroundPosition: `${layout.bg.x}% ${layout.bg.y}%`,
                                backgroundRepeat: 'no-repeat'
                            }}
                        >
                            {/* Left Page (Text) - Matching PictureBookReader logic */}
                            <div
                                className="w-full md:w-1/2 flex flex-col justify-center relative bg-transparent"
                                style={{
                                    padding: `${layout.text.padding}%`,
                                    transform: `translate(${layout.text.posX}px, ${layout.text.posY}px)`
                                }}
                            >
                                <div className="relative z-10 h-full flex flex-col max-h-full">
                                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent flex items-center">
                                        <div className="w-full">
                                            <p
                                                className="text-[#1a0f0a] font-serif leading-relaxed font-bold tracking-tight first-letter:font-black first-letter:text-[#4a2e1d] first-letter:mr-4 first-letter:float-left"
                                                style={{ fontSize: `${layout.text.fontSize}px` }}
                                            >
                                                <span
                                                    className="float-left font-black text-[#4a2e1d] mr-4"
                                                    style={{ fontSize: `${layout.text.fontSize * 3}px`, lineHeight: 1 }}
                                                >
                                                    {(pages[currentPage]?.text || pages[currentPage]?.panels?.[0]?.caption || title).charAt(0)}
                                                </span>
                                                {(pages[currentPage]?.text || pages[currentPage]?.panels?.map(p => p.caption).join('\n\n') || '').slice(1)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-center mt-4 flex-shrink-0 text-[#1a0f0a]/60 font-serif text-sm italic font-black">
                                        ~ Page {currentPage + 1} ~
                                    </div>
                                </div>
                            </div>

                            {/* Right Page (Image & Bubbles) */}
                            <div
                                className="w-full md:w-1/2 relative bg-transparent flex items-center justify-center overflow-hidden"
                                style={{
                                    padding: `${layout.image.padding}%`,
                                    transform: `translate(${layout.image.posX}px, ${layout.image.posY}px)`
                                }}
                            >
                                <div className="relative z-10 w-full h-full flex items-center justify-center">
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <img
                                            src={pages[currentPage]?.imageUrl}
                                            alt={`Page ${currentPage + 1}`}
                                            className="object-contain shadow-2xl rounded-lg border-2 border-white/5"
                                            style={{
                                                maxWidth: `${layout.image.scale}%`,
                                                maxHeight: `${layout.image.scale}%`
                                            }}
                                        />

                                        {/* Bubbles Integration */}
                                        {pages[currentPage]?.panels && pages[currentPage].panels.length > 0 && (
                                            <div className="absolute inset-0 pointer-events-none">
                                                <ComicBubbleGrid
                                                    panels={pages[currentPage].panels.map(p => ({
                                                        caption: p.caption,
                                                        bubblePosition: p.bubblePosition || 'bottom',
                                                        bubbleType: p.bubbleType || 'speech',
                                                        emotion: p.emotion || 'happy'
                                                    }))}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute bottom-8 text-[#1a0f0a]/60 font-serif text-sm italic left-0 right-0 text-center pointer-events-none font-black">
                                    ~ Page {currentPage + 1} ~
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Arrows */}
                    <div className="absolute inset-x-2 md:inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-[60]">
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 0}
                            className={`p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all pointer-events-auto transform hover:scale-110 ${currentPage === 0 ? 'opacity-0 scale-90' : 'opacity-100'}`}
                        >
                            <ChevronLeft size={36} />
                        </button>

                        <button
                            onClick={nextPage}
                            disabled={currentPage === pages.length - 1}
                            className={`p-4 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-sm transition-all pointer-events-auto transform hover:scale-110 ${currentPage === pages.length - 1 ? 'opacity-0' : 'opacity-100'}`}
                        >
                            <ChevronRight size={36} />
                        </button>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="relative z-50 bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 shrink-0">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                        <div className="flex gap-3">
                            <button
                                onClick={handleDownloadPDF}
                                className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-full font-bold text-white text-sm transition-all flex items-center gap-2 shadow-lg"
                            >
                                <FileDown size={18} />
                                PDF
                            </button>
                            <button
                                onClick={() => setShowMetadata(!showMetadata)}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full font-bold text-white text-sm transition-all shadow-lg"
                            >
                                {showMetadata ? 'Hide' : 'Show'} Details
                            </button>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-md">
                            {pages.map((p, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentPage(idx)}
                                    className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${currentPage === idx ? 'border-amber-400 scale-105' : 'border-transparent opacity-40'}`}
                                >
                                    <img src={p.imageUrl} className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onClose}
                            className="px-8 py-2 bg-white text-black rounded-full font-bold shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Metadata Overlay */}
                <AnimatePresence>
                    {showMetadata && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-24 right-4 z-[70] bg-black/80 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-white w-64 shadow-2xl"
                        >
                            <h3 className="font-black text-amber-400 text-lg mb-3 uppercase tracking-widest text-xs">Book Details</h3>
                            <div className="space-y-3 text-xs">
                                <div>
                                    <p className="text-white/40 font-bold uppercase tracking-tighter">Title</p>
                                    <p className="font-bold">{title}</p>
                                </div>
                                <div>
                                    <p className="text-white/40 font-bold uppercase tracking-tighter">Vibe</p>
                                    <p className="font-bold capitalize">{vibe}</p>
                                </div>
                                <div>
                                    <p className="text-white/40 font-bold uppercase tracking-tighter">Created</p>
                                    <p className="font-bold">{new Date(createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-white/40 font-bold uppercase tracking-tighter">Pages</p>
                                    <p className="font-bold">{pages.length}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
