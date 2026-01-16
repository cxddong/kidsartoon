// client/src/pages/CartoonBookReaderPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CartoonBookViewer } from '../components/viewer/CartoonBookViewer';

interface Page {
    pageNumber: number;
    imageUrl: string;
    chapterText: string;
    text?: string;
    panels?: any[];  // Enhanced panel data with bubbles
}

interface CartoonBook {
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

export const CartoonBookReaderPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [novel, setNovel] = useState<CartoonBook | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNovel = async () => {
            if (id === 'demo') {
                setNovel({
                    id: 'demo',
                    userId: 'user1',
                    pages: [
                        { pageNumber: 1, imageUrl: '/assets/sample_comic_page.png', chapterText: 'Chapter 1: The Beginning', panels: [{ caption: 'Panel 1 text' }, { caption: 'Panel 2 text' }] },
                        { pageNumber: 2, imageUrl: '/assets/sample_comic_page.png', chapterText: 'Chapter 2: The End', panels: [{ caption: 'Panel 3 text' }, { caption: 'Panel 4 text' }] }
                    ],
                    plotOutline: ['Chapter 1', 'Chapter 2'],
                    status: 'COMPLETED',
                    createdAt: new Date().toISOString(),
                    vibe: 'funny',
                    layout: 'standard',
                    plotHint: 'A funny story about a cat'
                });
                setLoading(false);
                return;
            }

            if (!id) {
                navigate('/home');
                return;
            }

            try {
                const res = await fetch(`/api/cartoon-book/${id}`);
                if (!res.ok) throw new Error('Cartoon book not found');

                const data = await res.json();
                setNovel(data);
            } catch (err) {
                console.error('[CartoonBookReader] Error:', err);
                alert('Failed to load cartoon book');
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

    // Transform pages to match CartoonBookViewer interface
    const transformedPages = novel.pages.map(page => ({
        pageNumber: page.pageNumber,
        imageUrl: page.imageUrl,
        text: page.chapterText || page.text,
        panels: page.panels  // Include panel data if available
    }));

    return (
        <CartoonBookViewer
            title={novel.vibe ? `${novel.vibe.charAt(0).toUpperCase() + novel.vibe.slice(1)} Story` : 'My Cartoon Book'}
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
