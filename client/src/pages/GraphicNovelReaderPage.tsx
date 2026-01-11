// client/src/pages/GraphicNovelReaderPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GraphicNovelViewer } from '../components/viewer/GraphicNovelViewer';

interface Page {
    pageNumber: number;
    imageUrl: string;
    chapterText: string;
    text?: string;
    panels?: any[];  // Enhanced panel data with bubbles
}

interface GraphicNovel {
    id: string;
    userId: string;
    pages: Page[];
    plotOutline: string[];
    status: string;
    createdAt: string;
    vibe?: string;
    layout?: string;
    assets?: any;
    settings?: any;
    plotHint?: string;
}

export const GraphicNovelReaderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [novel, setNovel] = useState<GraphicNovel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNovel = async () => {
            if (!id) {
                navigate('/home');
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
                navigate('/home');
            } finally {
                setLoading(false);
            }
        };

        fetchNovel();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-white text-2xl font-bold animate-pulse">Loading your story...</div>
            </div>
        );
    }

    if (!novel || !novel.pages || novel.pages.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <p className="text-2xl font-bold mb-4">No pages found</p>
                    <button onClick={() => navigate('/generate')} className="px-6 py-3 bg-white text-purple-900 rounded-xl font-bold hover:scale-105 transition-transform">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Transform pages to match GraphicNovelViewer interface
    const transformedPages = novel.pages.map(page => ({
        pageNumber: page.pageNumber,
        imageUrl: page.imageUrl,
        text: page.chapterText || page.text,
        panels: page.panels  // Include panel data if available
    }));

    return (
        <GraphicNovelViewer
            title={novel.vibe ? `${novel.vibe.charAt(0).toUpperCase() + novel.vibe.slice(1)} Story` : 'My Graphic Novel'}
            vibe={novel.vibe || 'adventure'}
            pages={transformedPages}
            assets={novel.assets}
            settings={{
                totalPages: novel.pages.length,
                layout: novel.layout || 'standard',
                plotHint: novel.plotHint
            }}
            createdAt={new Date(novel.createdAt).getTime()}
            onClose={() => navigate('/home')}
        />
    );
};
