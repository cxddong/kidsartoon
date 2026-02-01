import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeaderBar } from '../components/home/HeaderBar';
import { LogoArea } from '../components/home/LogoArea';
import { FeatureButtonsRow } from '../components/home/FeatureButtonsRow';
import ImageModal from '../components/history/ImageModal';
import type { ImageRecord } from '../components/history/ImageModal';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { magicFloatVariants } from '../lib/animations';
import { DailyTreasureMap } from '../components/dashboard/DailyTreasureMap';
import { RippleEffect } from '../components/ui/RippleEffect';
import { MagicNavBar } from '../components/ui/MagicNavBar';

// R3F Imports
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Image as DreiImage, Text, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const MOCK_PUBLIC_ITEMS: ImageRecord[] = [
    { id: '1', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: false, prompt: 'Space Adventure' },
    { id: '2', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: true, prompt: 'Funny Cat' },
    { id: '3', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600', type: 'generated', createdAt: new Date().toISOString(), favorite: false, prompt: 'Dragon Tale' },
    { id: '4', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1629812456605-4a044aa1d632?q=80&w=600', type: 'animation', createdAt: new Date().toISOString(), favorite: false, prompt: 'Under the Sea' },
    { id: '5', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Magical Forest' },
    { id: '6', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1605415460061-055259463b7d?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: false, prompt: 'Starry Night' },
    { id: '7', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: true, prompt: 'Fantasy Castle' },
    { id: '8', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1622542796254-5b9c46a3d201?q=80&w=600', type: 'generated', createdAt: new Date().toISOString(), favorite: false, prompt: 'Cute Robot' },
    { id: '9', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1618588507085-c79565432917?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Sunset Beach' },
    { id: '10', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: false, prompt: 'Abstract Art' },
    { id: '11', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Mountain Peak' },
    { id: '12', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: false, prompt: 'City Lights' },
    { id: '13', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1614730341194-75c60740a1d3?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Neon Future' },
    { id: '14', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: false, prompt: 'Deep Ocean' },
    { id: '15', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Magical Forest' },
    { id: '16', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: false, prompt: 'Abstract Art' },
    { id: '17', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1617791160536-598cf32026fb?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Mountain Peak' },
    { id: '18', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: false, prompt: 'City Lights' },
    { id: '19', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1614730341194-75c60740a1d3?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Neon Future' },
    { id: '20', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: false, prompt: 'Deep Ocean' },
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
        <div className="px-4 mb-2 w-full max-w-4xl mx-auto flex-shrink-0 flex flex-col items-center z-10 relative">
            {/* Slide Area - Compact */}
            <div
                onClick={handleBannerClick}
                className="w-full h-[120px] relative overflow-hidden rounded-3xl shadow-xl group cursor-pointer border-2 border-white/20 transition-all duration-500 bg-white/10 hover:scale-[1.02] backdrop-blur-md"
            >
                {PROMO_SLIDES.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} flex items-center justify-center transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-90 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        {slide.decor}
                        {slide.title && (
                            <div className="text-center z-20 text-white transform group-hover:scale-105 transition-transform duration-500">
                                <h2 className="text-2xl font-black drop-shadow-md">{slide.title}</h2>
                                <p className="text-sm font-bold opacity-90">{slide.subtitle}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {/* Dots */}
            <div className="flex gap-2 mt-2">
                {PROMO_SLIDES.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

// --- 3D Components ---

// Safe Gallery Item using manual TextureLoader
function SafelyLoadedGalleryItem({ item, position, rotation, onClick }: { item: ImageRecord, position: [number, number, number], rotation: [number, number, number], onClick: (id: string) => void }) {
    const [texture1, setTexture1] = useState<THREE.Texture | null>(null);
    const [texture2, setTexture2] = useState<THREE.Texture | null>(null);
    const [showFirst, setShowFirst] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [hovered, setHover] = useState(false);
    const meshRef = useRef<THREE.Group>(null);

    // Load Textures
    useEffect(() => {
        setTexture1(null);
        setTexture2(null);
        setHasError(false);
        setShowFirst(true);

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');

        const loadTex = (url: string, setters: (t: THREE.Texture) => void) => {
            let loadUrl = url;
            if (url.startsWith('http')) {
                loadUrl = `/api/images/proxy?url=${encodeURIComponent(url)}`;
            }
            loader.load(
                loadUrl,
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    setters(tex);
                },
                undefined,
                () => { if (setters === setTexture1) setHasError(true); } // Only error if main fails
            );
        };

        if (item.imageUrl) loadTex(item.imageUrl, setTexture1);
        if ((item as any).secondaryUrl) loadTex((item as any).secondaryUrl, setTexture2);

    }, [item.imageUrl, (item as any).secondaryUrl, item.id]);

    // Swap Timer
    useEffect(() => {
        if (texture1 && texture2) {
            const timer = setInterval(() => {
                setShowFirst(prev => !prev);
            }, 3000);
            return () => clearInterval(timer);
        }
    }, [texture1, texture2]);

    // Generate a stable color based on item ID for the fallback
    const fallbackColor = useMemo(() => {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD'];
        let hash = 0;
        for (let i = 0; i < item.id.length; i++) {
            hash = item.id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }, [item.id]);

    if (hasError) {
        // FALLBACK: Render a colorful placeholder card
        const width = 2.5;
        const height = 2.5;
        const scale = hovered ? 1.1 : 1.0;

        return (
            <group position={position} rotation={rotation} ref={meshRef}>
                <group
                    onClick={(e) => { e.stopPropagation(); onClick(item.id); }}
                    onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }}
                    onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
                    scale={[scale, scale, 1]}
                >
                    <RoundedBox args={[width, height, 0.1]} radius={0.2} smoothness={4} rotation={[0, Math.PI, 0]}>
                        <meshStandardMaterial color={fallbackColor} roughness={0.4} />
                    </RoundedBox>
                </group>
            </group>
        );
    }

    const activeTexture = (texture2 && !showFirst) ? texture2 : texture1;
    if (!activeTexture) return null; // Wait for load

    // Uniform "Squircle" Card Style calculations based on PRIMARY texture aspect ratio
    // We stick to one aspect ratio to avoid jitter during swap
    // Cast to HTMLImageElement to access width/height safely
    const img = (texture1?.image || activeTexture.image) as HTMLImageElement;
    const imgAspect = (img && img.width && img.height) ? (img.width / img.height) : 1;

    let width = 2.5;
    let height = 2.5;

    if (imgAspect > 1.2) {
        height = width / 1.2;
    } else if (imgAspect < 0.8) {
        width = height * 0.8;
    }

    const scale = hovered ? 1.1 : 1.0;
    // Cast type to string to avoid TS union errors if 'audio' is not in the type definition yet
    const isAudio = item.type === 'story' || (item.type as string) === 'audio';

    return (
        <group position={position} rotation={rotation} ref={meshRef}>
            <group
                onClick={(e) => { e.stopPropagation(); onClick(item.id); }}
                onPointerOver={() => { document.body.style.cursor = 'pointer'; setHover(true); }}
                onPointerOut={() => { document.body.style.cursor = 'auto'; setHover(false); }}
                scale={[scale, scale, 1]}
            >
                {/* Rounded Card Geometry */}
                <RoundedBox args={[width, height, 0.1]} radius={0.2} smoothness={4} rotation={[0, Math.PI, 0]}>
                    <meshBasicMaterial map={activeTexture} side={THREE.DoubleSide} />
                </RoundedBox>

                {/* Audio Icon Overlay */}
                {isAudio && (
                    <Text
                        position={[0.8, -height / 2 + 0.5, 0.06]} // Bottom right corner
                        rotation={[0, Math.PI, 0]}
                        fontSize={0.8}
                        color="white"
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.05}
                        outlineColor="black"
                    >
                        🎧
                    </Text>
                )}
            </group>

            {/* Minimal Label on Hover */}
            {hovered && (
                <Text
                    position={[0, -height / 2 - 0.4, -0.2]}
                    rotation={[0, Math.PI, 0]}
                    fontSize={0.3}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.03}
                    outlineColor="black"
                >
                    {item.prompt?.slice(0, 15) || 'Untitled'}
                </Text>
            )}
        </group>
    );
}

function SphereGallery({ items, onItemClick }: { items: ImageRecord[], onItemClick: (id: string) => void }) {
    const count = items.length;
    // Radius 10: Compromise between 8 (too crowded) and 12 (too sparse)
    const radius = 10;

    const positions = useMemo(() => {
        const temp = [];
        // Dense Latitude Rings
        // Increase rows to fill space better vertically?
        // 6 rows * ~10-15 items per row = 60-90 items
        const rowCount = 7;
        const itemsPerRow = Math.ceil(count / rowCount);

        for (let i = 0; i < count; i++) {
            // Determine which row (ring) this item belongs to
            const rowIndex = Math.floor(i / itemsPerRow);
            const colIndex = i % itemsPerRow;

            // Tighter vertical spread: 0.85 to -0.85
            const yNorm = 0.85 - (rowIndex / (rowCount - 1)) * 1.7;
            const y = yNorm * radius;

            // Radius of the ring at this height
            const ringRadius = Math.sqrt(1 - yNorm * yNorm) * radius;

            // Angle around the ring
            const theta = (colIndex / itemsPerRow) * 2 * Math.PI;

            const x = Math.cos(theta) * ringRadius;
            const z = Math.sin(theta) * ringRadius;

            temp.push([x, y, z] as [number, number, number]);
        }
        return temp;
    }, [count, radius]);

    return (
        <group>
            {items.map((item, i) => {
                const pos = positions[i];
                const dummy = new THREE.Object3D();
                dummy.position.set(pos[0], pos[1], pos[2]);
                dummy.lookAt(0, 0, 0);

                return (
                    // We don't need ErrorBoundary here anymore since SafeLoader handles it locally
                    <SafelyLoadedGalleryItem
                        key={item.id}
                        item={item}
                        position={pos}
                        rotation={[dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]}
                        onClick={onItemClick}
                    />
                );
            })}
        </group>
    );
}


export const CommunityPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [publicItems, setPublicItems] = useState<ImageRecord[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch with timeout/mock fallback
        const fetchPublicGallery = async () => {
            try {
                // 1. Fetch Public Global Gallery
                const response = await fetch('/api/images/public');
                let publicData = [];
                if (response.ok) {
                    publicData = await response.json();
                }

                // 2. Fetch User's Own Gallery (to ensure they are represented)
                let userData = [];
                if (user?.uid) {
                    try {
                        const userResponse = await fetch(`/api/images/${user.uid}`);
                        if (userResponse.ok) {
                            userData = await userResponse.json();
                        }
                    } catch (e) {
                        console.warn("Failed to fetch user personal gallery for globe", e);
                    }
                }

                // 3. Merge & Deduplicate
                // Prioritize User Data first so it shows up
                const combined = [...userData, ...publicData];
                const seen = new Set();
                const validData: ImageRecord[] = [];

                combined.forEach(item => {
                    // Filter invalid items immediately
                    if (!item.id || seen.has(item.id)) return;

                    // Extract User Upload (Input)
                    let userUrl: string | undefined;
                    if (item.meta?.originalImageUrl?.startsWith('http')) userUrl = item.meta.originalImageUrl;
                    else if (item.meta?.inputImageUrl?.startsWith('http')) userUrl = item.meta.inputImageUrl;

                    const displayItem = { ...item };

                    // 1. STORY/AUDIO Handling:
                    // Requirement: "Directly display user upload + Audio Icon"
                    if (item.type === 'story' || item.type === 'audio') {
                        const hasStory = !!(item.meta?.story || item.meta?.bookData);
                        const hasAudio = !!(item.meta?.audioUrl && item.meta.audioUrl.length > 10);
                        if (!hasStory && !hasAudio) return; // Skip empty

                        // Prefer User Upload as the main texture
                        if (userUrl) {
                            displayItem.imageUrl = userUrl;
                        }
                        // If no user upload, keep original imageUrl (likely a generated cover)
                    }
                    // 2. GENERATED/ART Handling:
                    // Requirement: "Interactive swap between User Upload and Result"
                    else {
                        // If we have a user upload that matches the concept of "input"
                        if (userUrl && userUrl !== item.imageUrl) {
                            // Store secondary URL for swapping
                            // We attach it to the item object (casting as any since interface isn't updated yet)
                            (displayItem as any).secondaryUrl = userUrl;
                        }
                    }

                    // Validate Final URL
                    if (!displayItem.imageUrl || !displayItem.imageUrl.startsWith('http') || displayItem.imageUrl.includes('undefined')) {
                        return; // Skip broken
                    }

                    seen.add(item.id);
                    validData.push(displayItem);
                });

                if (validData.length > 0) {
                    // --- SMART DENSITY CONTROL ---
                    // Goal: Ensure the globe always looks "full" using REAL data.
                    const TARGET_MIN = 40;
                    const TARGET_MAX = 80;

                    let pool = validData;

                    // REPEAT REAL DATA to fill space, DO NOT use Mocks.
                    // This creates a "hall of mirrors" effect rather than showing fake content.
                    while (pool.length < TARGET_MIN) {
                        pool = [...pool, ...pool];
                    }

                    // Cap at MAX
                    const finalItems = pool.slice(0, TARGET_MAX);

                    // Re-map to ensure strictly unique IDs for the final set
                    const displayData = finalItems.map((item, index) => ({
                        ...item,
                        id: `sphere-item-${index}-${item.id}` // Guaranteed unique
                    }));

                    setPublicItems(displayData);
                } else {
                    // Only use minimal info if absolutely NOTHING exists
                    setPublicItems([]);
                }
            } catch (error) {
                console.error("Failed to fetch public gallery", error);
                setPublicItems([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicGallery();
    }, [user?.uid]); // Re-run if user logs in


    const handleToggleFavorite = async (id: string) => {
        if (!user) {
            alert("Please sign in to collect your favorite artworks!");
            return;
        }
        setPublicItems(prev => prev.map(item => item.id === id ? { ...item, favorite: !item.favorite } : item));
        try {
            await fetch(`/api/images/${id}/toggle-favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid })
            });
        } catch (error) { console.error(error); }
    };

    return (
        <div className="h-screen w-full flex flex-col relative overflow-hidden bg-black">
            {/* 1. Global Background (Fixed) - Video with preserved Ripple Effect (if supported) or just Video */}
            <div className="fixed inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source src="/assets/HOME1.mp4" type="video/mp4" />
                </video>
                {/* Note: Interactive RippleEffect (jQuery) does not support video sources. 
                    Disabling it to prioritize the requested video background. */}
            </div>

            {/* 2. Header (Absolute Overlay) */}
            <div className="z-30 absolute top-0 w-full pointer-events-none">
                <div className="pointer-events-auto">
                    <HeaderBar />
                </div>
            </div>

            {/* 3. Helper UI */}
            <div className="z-20 absolute top-24 w-full flex justify-center pointer-events-none">
                <div className="pointer-events-auto">
                    <PromoBanner />
                </div>
            </div>

            {/* 4. 3D Scene */}
            <div className="absolute inset-0 z-10 w-full h-full">
                <Canvas camera={{ position: [0, 0, 25], fov: 60 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} />

                    <Suspense fallback={null}>
                        <SphereGallery items={publicItems} onItemClick={setSelectedId} />
                    </Suspense>

                    <OrbitControls
                        enableZoom={false}
                        autoRotate={true}
                        autoRotateSpeed={0.5}
                        enablePan={false}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 1.5}
                    />
                </Canvas>
            </div>


            {/* 5. Detail Modal */}
            {
                selectedId && (
                    <ImageModal
                        image={publicItems.find(i => i.id === selectedId) || null}
                        onClose={() => setSelectedId(null)}
                        onToggleFavorite={handleToggleFavorite}
                    />
                )
            }

            {/* 6. Nav (Fixed Bottom) */}
            <div className="z-40">
                <MagicNavBar />
            </div>
        </div >
    );
};
