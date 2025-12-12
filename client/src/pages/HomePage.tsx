import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeaderBar } from '../components/home/HeaderBar';
import { LogoArea } from '../components/home/LogoArea';
import { FeatureButtonsRow } from '../components/home/FeatureButtonsRow';
import { ContentGrid } from '../components/home/ContentGrid';
import { DetailModal } from '../components/home/DetailModal';
import { BottomNav } from '../components/BottomNav';
import type { ImageRecord } from '../components/history/ImageModal';
import { Sparkles } from 'lucide-react';

const MOCK_PUBLIC_ITEMS: ImageRecord[] = [
    { id: '1', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: false, prompt: 'Space Adventure' },
    { id: '2', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: true, prompt: 'Funny Cat' },
    { id: '3', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600', type: 'generated', createdAt: new Date().toISOString(), favorite: false, prompt: 'Dragon Tale' },
    { id: '4', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1629812456605-4a044aa1d632?q=80&w=600', type: 'animation', createdAt: new Date().toISOString(), favorite: false, prompt: 'Under the Sea' },
    { id: '5', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Magical Forest' },
];

// Mock promotion Banner
const PromoBanner: React.FC = () => (
    <div className="px-6 mb-8 w-full max-w-4xl mx-auto flex-shrink-0">
        <div className="w-full h-[180px] bg-gradient-to-r from-pink-400 to-purple-400 rounded-3xl shadow-xl flex items-center justify-center relative overflow-hidden group cursor-pointer border-4 border-white">
            <div className="absolute top-[-50px] left-[-50px] w-32 h-32 bg-white/20 rounded-full blur-2xl" />
            <div className="absolute bottom-[-30px] right-[-20px] w-40 h-40 bg-yellow-300/30 rounded-full blur-3xl" />
            <div className="text-center z-10 text-white transform group-hover:scale-105 transition-transform">
                <h2 className="text-3xl font-black drop-shadow-md mb-2">Weekly Art Challenge!</h2>
                <p className="text-lg font-bold opacity-90">Draw a "Flying Fish" 🐟✈️</p>
                <div className="mt-4 px-6 py-2 bg-white text-purple-600 rounded-full font-bold shadow-lg inline-block">Join Now</div>
            </div>
        </div>
    </div>
);

export const HomePage: React.FC = () => {
    const { user } = useAuth();
    const [publicItems, setPublicItems] = useState<ImageRecord[]>([]);
    const [filteredItems, setFilteredItems] = useState<ImageRecord[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch with timeout/mock fallback
        const fetchPublicGallery = async () => {
            try {
                // Short timeout to fallback quickly if API down
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const res = await fetch('/api/images/public', { signal: controller.signal });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setPublicItems(data);
                        setFilteredItems(data);
                        return;
                    }
                }
                throw new Error("API Failed");
            } catch (error) {
                console.warn("API unavailable, using mock data", error);
                setPublicItems(MOCK_PUBLIC_ITEMS);
                setFilteredItems(MOCK_PUBLIC_ITEMS);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicGallery();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (!activeFilter) {
            setFilteredItems(publicItems);
        } else {
            setFilteredItems(publicItems.filter(item => {
                if (activeFilter === 'story') return item.type === 'story';
                if (activeFilter === 'comic') return item.type === 'comic';
                if (activeFilter === 'picture-book') return item.type === 'generated';
                if (activeFilter === 'animation') return item.type === 'animation';
                return true;
            }));
        }
    }, [activeFilter, publicItems]);

    const handleToggleFavorite = async (id: string) => {
        if (!user) {
            alert("Please sign in to collect your favorite artworks!");
            return;
        }
        // Optimistic update
        setPublicItems(prev => prev.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item));
        try {
            await fetch(`/api/images/${id}/toggle-favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid })
            });
        } catch (error) { console.error(error); } // Revert if wanted, but simpler to ignore for prototype
    };

    return (
        <div className="h-screen w-full flex flex-col relative overflow-hidden bg-[#FAFAFA]">
            {/* 1. Global Background (Fixed) */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/main_bg.jpg')" }}
            >
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
            </div>

            {/* 2. Header (Fixed) */}
            <HeaderBar />

            {/* 3. Main Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto z-10 relative w-full scrollbar-hide">
                <div className="pb-24 pt-4">

                    {/* Logo Area (Scrolls) */}
                    <LogoArea />

                    <PromoBanner />

                    {/* Filter & Gallery Area - TRANSPARENT */}
                    <div className="relative min-h-screen">

                        {/* Sticky Filter Bar - TRANSPARENT */}
                        <div className="sticky top-0 z-30 pt-6 pb-2 px-4">
                            <FeatureButtonsRow activeFilter={activeFilter} onFilterChange={setActiveFilter} />
                        </div>

                        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">


                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : (
                                <ContentGrid items={filteredItems} onItemClick={(item) => setSelectedId(item.id)} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <DetailModal
                item={publicItems.find(i => i.id === selectedId) || null}
                onClose={() => setSelectedId(null)}
                onToggleFavorite={handleToggleFavorite}
            />

            {/* 4. Bottom Nav (Explicitly added since we are outside Layout) */}
            <BottomNav />
        </div >
    );
};
