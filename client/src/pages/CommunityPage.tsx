import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeaderBar } from '../components/home/HeaderBar';
import { LogoArea } from '../components/home/LogoArea';
import { FeatureButtonsRow } from '../components/home/FeatureButtonsRow';
import { ContentGrid } from '../components/home/ContentGrid';
import { DetailModal } from '../components/home/DetailModal';
// import { BottomNav } from '../components/BottomNav';
import type { ImageRecord } from '../components/history/ImageModal';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { magicFloatVariants } from '../lib/animations';
import { DailyTreasureMap } from '../components/dashboard/DailyTreasureMap';
import { MagicNavBar } from '../components/ui/MagicNavBar'; // IMPORTED

const MOCK_PUBLIC_ITEMS: ImageRecord[] = [
    { id: '1', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: false, prompt: 'Space Adventure' },
    { id: '2', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: true, prompt: 'Funny Cat' },
    { id: '3', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600', type: 'generated', createdAt: new Date().toISOString(), favorite: false, prompt: 'Dragon Tale' },
    { id: '4', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1629812456605-4a044aa1d632?q=80&w=600', type: 'animation', createdAt: new Date().toISOString(), favorite: false, prompt: 'Under the Sea' },
    { id: '5', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Magical Forest' },
];

const PROMO_SLIDES = [
    {
        id: 0,
        title: "SUPER CARTOON BOOK 📚",
        subtitle: 'Build Your World! Create cartoon books!',
        gradient: "from-purple-600 via-pink-600 to-orange-600",
        link: '/cartoon-book/builder',
        decor: (
            <>
                <div className="absolute inset-0 opacity-30">
                    <img src="/assets/graphic_novel_icon.png" alt="Cartoon Book" className="w-full h-full object-contain animate-pulse" />
                </div>
                <div className="absolute top-4 left-4 w-16 h-16 bg-yellow-400 rounded-full blur-xl animate-ping opacity-50" />
                <div className="absolute bottom-4 right-4 w-20 h-20 bg-pink-400 rounded-full blur-2xl animate-pulse opacity-50" />
            </>
        )
    },
    {
        id: 99,
        title: "MAGIC LAB ✨",
        subtitle: 'Cast spells with your apprentice!',
        gradient: "from-purple-600 to-indigo-600",
        link: '/magic-lab',
        decor: (
            <>
                <div className="absolute top-0 right-0 w-full h-full bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzM0YjM0YjM0YjM0YjM0YjM0YjM0YjM0YjM0YjM0YjM/3o7aD2saalBwwftBIY/giphy.gif')] opacity-20 bg-cover grayscale mix-blend-overlay" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Sparkles className="w-32 h-32 text-yellow-300 animate-pulse drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]" />
                </div>
            </>
        )
    },
    {
        id: 1,
        title: "Magic Mirror 🪞",
        subtitle: 'See what your drawing reveals!',
        gradient: "from-indigo-600 to-purple-800",
        link: '/magic-discovery',
        decor: (
            <>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800')] bg-cover opacity-20 mix-blend-overlay" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Sparkles className="w-24 h-24 text-cyan-300 animate-pulse drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                </div>
            </>
        )
    },
    {
        id: 2,
        title: "Send a Magic Card! 💌",
        subtitle: 'Turn photos into voice greetings!',
        gradient: "from-pink-400 to-purple-300",
        link: '/generate/greeting-card',
        decor: (
            <>
                <div className="absolute top-10 right-10 w-20 h-20 bg-white/30 rounded-full blur-xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <Sparkles className="w-32 h-32 text-white" />
                </div>
            </>
        )
    },
    {
        id: 3,
        title: "Premium Membership",
        subtitle: 'Unlock unlimited generations! 🚀',
        gradient: "from-orange-400 to-red-400",
        link: '/subscription',
        decor: (
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30" />
        )
    }
];

const PromoBanner: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % PROMO_SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleBannerClick = () => {
        const link = (PROMO_SLIDES[currentSlide] as any).link;
        if (link) navigate(link);
    };

    return (
        <div className="px-4 mb-8 w-full max-w-4xl mx-auto flex-shrink-0 flex flex-col items-center">
            {/* Slide Area - Taller */}
            <div
                onClick={handleBannerClick}
                className="w-full h-[200px] relative overflow-hidden rounded-3xl shadow-xl group cursor-pointer border-4 border-white transition-all duration-500 bg-white hover:scale-[1.02]"
            >
                {PROMO_SLIDES.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} flex items-center justify-center transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        {slide.decor}
                        {slide.title && (
                            <div className="text-center z-20 text-white transform group-hover:scale-105 transition-transform duration-500">
                                <h2 className="text-4xl font-black drop-shadow-md mb-2">{slide.title}</h2>
                                <p className="text-xl font-bold opacity-90">{slide.subtitle}</p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleBannerClick();
                                    }}
                                    className="mt-6 px-8 py-3 bg-white text-slate-800 rounded-full font-black shadow-lg hover:bg-yellow-100 transition-colors cursor-pointer"
                                >
                                    Explore Now
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Dots Selector - User Choice */}
            <div className="flex gap-2 mt-4">
                {PROMO_SLIDES.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-blue-500 w-8' : 'bg-slate-300 hover:bg-blue-300'
                            }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export const CommunityPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [publicItems, setPublicItems] = useState<ImageRecord[]>([]);
    const [filteredItems, setFilteredItems] = useState<ImageRecord[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch with timeout/mock fallback
        const fetchPublicGallery = async () => {
            try {
                const res = await fetch('/api/images/public');
                if (res.ok) {
                    const data = await res.json();
                    // Filter out failed items or invalid images
                    const validData = Array.isArray(data)
                        ? data.filter((item: any) => item.imageUrl && item.status !== 'failed')
                        : [];

                    setPublicItems(validData);
                    setFilteredItems(validData);
                }
            } catch (error) {
                console.error("Failed to fetch public gallery", error);
                setPublicItems([]);
                setFilteredItems([]);
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
                const t = (item.type || '').toLowerCase();

                if (activeFilter === 'story') {
                    return t === 'story' || t === 'audio-story';
                }

                if (activeFilter === 'comic') {
                    return t === 'comic' || t === 'comic-strip' || t === 'picture-book' || t === 'book' || t === 'cartoon-book';
                }

                if (activeFilter === 'generated') {
                    // Greeting Cards
                    return t === 'greeting-card' || t === 'card' || t === 'generated';
                }

                if (activeFilter === 'animation') {
                    return t === 'animation' || t === 'video';
                }

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

            {/* 2. Header (Relative) */}
            <div className="z-20 relative">
                <HeaderBar />
            </div>

            {/* 3. Main Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto z-10 relative w-full scrollbar-hide">
                <div className="pb-24 pt-20">
                    {/* Dev Links - Only visible in development */}
                    {import.meta.env.DEV && (
                        <div className="flex justify-center gap-4 mb-2 opacity-50 hover:opacity-100 transition-opacity">
                            <button onClick={() => navigate('/splash')} className="text-[10px] bg-black/10 px-2 py-1 rounded text-red-500 font-bold">dev: Splash</button>
                            <button onClick={() => navigate('/startup?reset=true')} className="text-[10px] bg-black/10 px-2 py-1 rounded text-red-500 font-bold">dev: Startup</button>
                            <button onClick={() => window.dispatchEvent(new Event('trigger-debug-rest'))} className="text-[10px] bg-black/10 px-2 py-1 rounded text-green-600 font-bold">dev: Test Rest</button>
                        </div>
                    )}

                    {/* Logo Area (Scrolls) */}
                    <motion.div variants={magicFloatVariants} initial="initial" animate="animate">
                        <LogoArea />
                    </motion.div>

                    <motion.div variants={magicFloatVariants} initial="initial" animate="animate" transition={{ delay: 0.1 }}>
                        <PromoBanner />
                    </motion.div>

                    {/* Daily Check-in Map */}
                    <div className="mb-8 px-4">
                        <motion.div variants={magicFloatVariants} initial="initial" animate="animate" transition={{ delay: 0.15 }}>
                            <DailyTreasureMap />
                        </motion.div>
                    </div>

                    {/* Filter & Gallery Area - TRANSPARENT */}
                    <div className="relative min-h-screen">

                        {/* Sticky Filter Bar - TRANSPARENT */}
                        <div className="sticky top-0 z-30 pt-2 pb-2 px-4">
                            <FeatureButtonsRow activeFilter={activeFilter} onFilterChange={setActiveFilter} />
                        </div>

                        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
                            <div className="flex justify-center py-20">
                                {loading ? (
                                    <div className="flex justify-center py-20">
                                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : filteredItems.length === 0 ? (
                                    <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-gray-300">
                                        <div className="text-6xl mb-4">🎨</div>
                                        <h3 className="text-xl font-bold text-gray-700">No masterpieces yet!</h3>
                                        <p className="text-gray-500">Be the first to share your magic creation.</p>
                                    </div>
                                ) : (
                                    <motion.div variants={magicFloatVariants} initial="initial" animate="animate" transition={{ delay: 0.2 }}>
                                        <ContentGrid items={filteredItems} onItemClick={(item) => setSelectedId(item.id)} />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DetailModal
                item={publicItems.find(i => i.id === selectedId) || null}
                onClose={() => setSelectedId(null)}
                onToggleFavorite={handleToggleFavorite}
            />

            {/* 4. Magic Floating Capsule Nav */}
            <MagicNavBar />
        </div>
    );
};
