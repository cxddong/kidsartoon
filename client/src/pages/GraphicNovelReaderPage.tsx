// client/src/pages/GraphicNovelReaderPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Page {
    pageNumber: number;
    imageUrl: string;
    chapterText: string;
}

interface GraphicNovel {
    id: string;
    userId: string;
    pages: Page[];
    plotOutline: string[];
    status: string;
    createdAt: string;
}

export const GraphicNovelReaderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [novel, setNovel] = useState<GraphicNovel | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNovel = async () => {
            if (!id) {
                navigate('/generate');
                return;
            }

            try {
                const res = await fetch(`/api/graphic-novel/${id}`);
                if (!res.ok) throw new Error('Graphic novel not found');

                const data = await res.json();
                setNovel(data);
            } catch (err) {
                console.error('[GraphicNovelReader] Error:', err);
                alert('Failed to load graphic novel');
                navigate('/generate');
            } finally {
                setLoading(false);
            }
        };

        fetchNovel();
    }, [id, navigate]);

    const nextPage = () => {
        if (novel && currentPage < novel.pages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-white text-2xl font-bold">Loading your story...</div>
            </div>
        );
    }

    if (!novel || !novel.pages || novel.pages.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-2xl font-bold mb-4">No pages found</p>
                    <button onClick={() => navigate('/generate')} className="px-6 py-3 bg-white text-purple-900 rounded-xl font-bold">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const currentPageData = novel.pages[currentPage];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-8 px-4">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate('/generate')}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <div className="text-white font-bold text-lg">
                    Page {currentPage + 1} of {novel.pages.length}
                </div>
            </div>

            {/* Comic Page Display */}
            <div className="max-w-4xl mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Page Image */}
                        <div className="relative">
                            <img
                                src={currentPageData.imageUrl}
                                alt={`Page ${currentPage + 1}`}
                                className="w-full h-auto"
                            />
                        </div>

                        {/* Chapter Text */}
                        {currentPageData.chapterText && (
                            <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                                <p className="text-gray-800 text-lg leading-relaxed italic">
                                    "{currentPageData.chapterText}"
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between mt-8">
                    <button
                        onClick={prevPage}
                        disabled={currentPage === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/30 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                    </button>

                    {/* Page Indicators */}
                    <div className="flex gap-2">
                        {novel.pages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentPage(idx)}
                                className={`w-3 h-3 rounded-full transition-all ${idx === currentPage
                                        ? 'bg-white w-8'
                                        : 'bg-white/40 hover:bg-white/60'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={nextPage}
                        disabled={currentPage === novel.pages.length - 1}
                        className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/30 transition-all"
                    >
                        Next
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* End of Story */}
                {currentPage === novel.pages.length - 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 text-center"
                    >
                        <p className="text-white text-2xl font-bold mb-4">🎉 The End</p>
                        <button
                            onClick={() => navigate('/generate')}
                            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold rounded-xl hover:scale-105 transition-transform"
                        >
                            Create Another Story
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};
