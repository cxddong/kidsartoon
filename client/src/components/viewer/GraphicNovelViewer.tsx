// client/src/components/viewer/GraphicNovelViewer.tsx

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GraphicNovelPage {
    pageNumber: number;
    imageUrl: string;
    text?: string;
}

interface GraphicNovelViewerProps {
    title: string;
    vibe: string;
    pages: GraphicNovelPage[];
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

export const GraphicNovelViewer: React.FC<GraphicNovelViewerProps> = ({
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-gradient-to-br from-purple-900 to-pink-900 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-white text-3xl font-black">{title}</h2>
                            <p className="text-white/70 text-sm">
                                {vibe.charAt(0).toUpperCase() + vibe.slice(1)} • {pages.length} pages
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex h-[95vh]">
                    {/* Page Display */}
                    <div className="flex-1 flex flex-col items-center justify-center p-20">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPage}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.3 }}
                                className="relative max-w-full max-h-full"
                            >
                                <img
                                    src={pages[currentPage]?.imageUrl}
                                    alt={`Page ${currentPage + 1}`}
                                    className="w-full h-full object-contain rounded-xl shadow-2xl border-4 border-white/20"
                                />
                                {pages[currentPage]?.text && (
                                    <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl">
                                        <p className="text-slate-800 text-center font-medium">
                                            {pages[currentPage].text}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Page Counter */}
                        <div className="mt-6 text-white/70 font-bold">
                            {currentPage + 1} / {pages.length}
                        </div>
                    </div>

                    {/* Metadata Sidebar (Optional) */}
                    {showMetadata && (
                        <motion.div
                            initial={{ x: 300 }}
                            animate={{ x: 0 }}
                            className="w-80 bg-black/40 backdrop-blur-xl p-6 overflow-y-auto border-l border-white/10"
                        >
                            <h3 className="text-white text-xl font-black mb-4">Creation Details</h3>

                            {/* Assets Used */}
                            {assets && (
                                <div className="mb-6">
                                    <h4 className="text-white/70 text-sm font-bold mb-3">Assets Used:</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(assets).map(([key, asset]) => asset && (
                                            <div key={key} className="bg-white/10 rounded-lg p-2">
                                                <img
                                                    src={asset.imageUrl}
                                                    alt={asset.description}
                                                    className="w-full aspect-square object-cover rounded mb-1"
                                                />
                                                <p className="text-white/80 text-xs text-center truncate">
                                                    {asset.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Settings */}
                            {settings && (
                                <div className="mb-6">
                                    <h4 className="text-white/70 text-sm font-bold mb-3">Settings:</h4>
                                    <div className="space-y-2 text-white/80 text-sm">
                                        <p>📖 Pages: {settings.totalPages}</p>
                                        <p>🎨 Layout: {settings.layout}</p>
                                        {settings.plotHint && (
                                            <p className="text-xs">💡 Story: {settings.plotHint}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Created At */}
                            <div className="text-white/60 text-xs">
                                Created: {new Date(createdAt).toLocaleDateString()}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Navigation Controls */}
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 0}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>

                        <div className="flex gap-3">
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
                                Download
                            </button>
                            <button
                                onClick={handleShare}
                                className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-white transition-all flex items-center gap-2"
                            >
                                <Share2 className="w-5 h-5" />
                                Share
                            </button>
                        </div>

                        <button
                            onClick={nextPage}
                            disabled={currentPage === pages.length - 1}
                            className="p-3 bg-white/20 hover:bg-white/30 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
