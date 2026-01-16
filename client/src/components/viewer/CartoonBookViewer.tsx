// client/src/components/viewer/CartoonBookViewer.tsx

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2, FileDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComicBubbleGrid } from '../ComicBubble';
import jsPDF from 'jspdf';

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl"
            >
                {/* Header REMOVED - Replaced by Vertical Title */}

                {/* Main Content Area - Immersive Reader */}
                <div className="flex h-[95vh] w-full items-center justify-center p-4">

                    {/* 📱 MOBILE LAYOUT: Vertical Scroll Card */}
                    <div className="md:hidden w-full h-full overflow-y-auto pb-20">
                        <div className="bg-white rounded-3xl p-4 shadow-xl mb-4">
                            <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-100 mb-4">
                                <img
                                    src={pages[currentPage]?.imageUrl}
                                    alt={`Page ${currentPage + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {/* Mobile Bubbles */}
                                {pages[currentPage]?.panels && pages[currentPage].panels.length > 0 && (
                                    <div className="absolute inset-0">
                                        <ComicBubbleGrid
                                            panels={pages[currentPage].panels.map(p => ({
                                                caption: p.caption,
                                                bubblePosition: p.bubblePosition || 'bottom',
                                                bubbleType: p.bubbleType || 'speech',
                                                emotion: p.emotion || 'happy'
                                            }))}
                                            onBubbleClick={(i) => console.log(`Panel ${i + 1} clicked`)}
                                        />
                                    </div>
                                )}
                            </div>
                            <p className="font-comic text-slate-800 text-lg leading-relaxed">
                                {pages[currentPage]?.text || pages[currentPage]?.panels?.map(p => p.caption).join(' ')}
                            </p>
                            <div className="mt-4 text-center text-slate-400 text-sm font-bold">
                                {currentPage + 1} / {pages.length}
                            </div>
                        </div>
                    </div>

                    {/* 💻 DESKTOP LAYOUT: Panoramic Full Book */}
                    <div className="hidden md:block relative w-full h-full shadow-2xl rounded-lg overflow-hidden group select-none mx-auto">

                        {/* 1. Underlying Book Asset (Panoramic) */}
                        <img
                            src="/assets/blank_comic_book_panoramic.png"
                            className="absolute inset-0 w-full h-full object-fill z-0"
                            alt="Open Comic Book"
                        />

                        {/* Vertical Title (Top Left) */}
                        <div className="absolute top-8 left-2 z-30 pointer-events-none mix-blend-multiply opacity-80">
                            <h1 className="text-slate-900 font-black text-5xl tracking-widest [writing-mode:vertical-rl] rotate-180 uppercase drop-shadow-sm whitespace-nowrap text-center leading-tight">
                                {title}
                            </h1>
                        </div>

                        {/* Close Button (Top Right Absolute) */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 z-50 p-3 bg-black/5 hover:bg-black/10 rounded-full transition-all text-slate-600 hover:text-red-500"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* 2. LEFT PAGE (Image & Bubbles) - Locked via % */}
                        <div
                            className="absolute z-10 bg-white/90 mix-blend-multiply flex items-center justify-center"
                            style={{
                                top: '8%',
                                right: '6%',
                                width: '42%',
                                height: '84%'
                            }}
                        >
                            <div className="relative w-full h-full">
                                <img
                                    src={pages[currentPage]?.imageUrl}
                                    className="w-full h-full object-contain"
                                    alt="Comic Page"
                                />
                                {/* Desktop Bubbles - Overlaying image but under blend? Or top? 
                                    If we put bubbles here, they get multiplied (ink effect). 
                                    If we want them to pop, we might need them outside this div or removed mix-blend for them.
                                    Let's keep them here for the 'printed' look user requested. 
                                */}
                                {pages[currentPage]?.panels && pages[currentPage].panels.length > 0 && (
                                    <div className="absolute inset-0">
                                        <ComicBubbleGrid
                                            panels={pages[currentPage].panels.map(p => ({
                                                caption: p.caption,
                                                bubblePosition: p.bubblePosition || 'bottom',
                                                bubbleType: p.bubbleType || 'speech',
                                                emotion: p.emotion || 'happy'
                                            }))}
                                            onBubbleClick={(i) => console.log(`Panel ${i + 1} clicked`)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. RIGHT PAGE (Text) - Locked via % */}
                        <div
                            className="absolute z-10 flex items-center justify-center p-8 overflow-y-auto custom-scrollbar"
                            style={{
                                top: '8%',
                                left: '6%',
                                width: '42%',
                                height: '84%',
                                containerType: 'inline-size'
                            }}
                        >
                            <div className="w-full h-full flex flex-col justify-center">
                                <p className="font-comic text-slate-900 leading-relaxed font-medium" style={{ fontSize: '6cqw' }}>
                                    {(pages[currentPage]?.panels && pages[currentPage].panels.length > 0)
                                        ? pages[currentPage].panels.map(p => p.caption).join('\n\n')
                                        : pages[currentPage]?.text}
                                </p>
                            </div>
                        </div>

                        {/* Page Numbers (Simulated) */}
                        <div className="absolute bottom-[3%] left-[25%] text-slate-400/50 text-xs font-bold font-serif">{currentPage * 2 + 1}</div>
                        <div className="absolute bottom-[3%] right-[25%] text-slate-400/50 text-xs font-bold font-serif">{currentPage * 2 + 2}</div>

                        {/* Metadata Overlay Panel (Show Details) */}
                        <AnimatePresence>
                            {showMetadata && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="absolute top-4 right-4 z-50 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-slate-100 w-64"
                                >
                                    <h3 className="font-black text-slate-800 text-lg mb-2">Book Details</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Title</p>
                                            <p className="font-bold text-slate-700">{title}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Vibe</p>
                                            <p className="font-bold text-slate-700 capitalize">{vibe}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Created</p>
                                            <p className="font-bold text-slate-700">{new Date(createdAt || Date.now()).toLocaleDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase">Length</p>
                                            <p className="font-bold text-slate-700">{pages.length} Pages</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </div>

                {/* Side Navigation Arrows (Always Visible) */}
                <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className="absolute left-8 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/20 hover:bg-white/40 rounded-full transition-all disabled:opacity-0 disabled:pointer-events-none text-white hover:scale-110 backdrop-blur-sm"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>

                <button
                    onClick={nextPage}
                    disabled={currentPage === pages.length - 1}
                    className="absolute right-8 top-1/2 -translate-y-1/2 z-50 p-4 bg-white/20 hover:bg-white/40 rounded-full transition-all disabled:opacity-0 disabled:pointer-events-none text-white hover:scale-110 backdrop-blur-sm"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>

                {/* Bottom Controls (Hover Only) */}
                <div className="absolute bottom-0 left-0 right-0 z-40 p-8 flex justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="flex gap-3 bg-black/50 backdrop-blur-md p-3 rounded-2xl shadow-xl">
                        <button
                            onClick={() => setShowMetadata(!showMetadata)}
                            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-white transition-all"
                        >
                            {showMetadata ? 'Hide' : 'Show'} Details
                        </button>
                        <button
                            onClick={handleDownload}
                            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-white transition-all flex items-center gap-2"
                        >
                            <Download className="w-5 h-5" />
                            Page
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-bold text-white transition-all flex items-center gap-2"
                        >
                            <FileDown className="w-5 h-5" />
                            PDF
                        </button>
                        <button
                            onClick={handleShare}
                            className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-white transition-all flex items-center gap-2"
                        >
                            <Share2 className="w-5 h-5" />
                            Share
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
