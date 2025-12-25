import React, { useState, useEffect, useRef } from 'react';
import { Settings, Crown, Edit2, Grid, Clock, Star, List, LogOut, Home, Heart, Mic, Search } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import HistoryGrid from '../components/history/HistoryGrid';
import ImageModal, { type ImageRecord } from '../components/history/ImageModal';
import { motion } from 'framer-motion';
import { StoryBookViewer } from '../components/viewer/StoryBookViewer';
import { BottomNav } from '../components/BottomNav';

import profileLeftVideo from '../assets/profileleft.mp4';

// Mock data for fallback
const MOCK_IMAGES: ImageRecord[] = [
    { id: '101', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1560114928-403316ca88bb?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'My Pet Robot' },
    { id: '102', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: false, prompt: 'Summer Camp' },
    { id: '103', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?q=80&w=600', type: 'generated', createdAt: new Date().toISOString(), favorite: true, prompt: 'Rocket Ship' },
];

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, updateProfile, loading: authLoading } = useAuth();

    // User State - Derived directly from Context now
    const [images, setImages] = useState<ImageRecord[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'works' | 'likes'>('works');
    const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper: Compress Image
    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const MAX_SIZE = 800; // Resize to max 800px

                if (width > height) {
                    if (width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    }
                } else {
                    if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error("Compression failed"));
                    }, 'image/jpeg', 0.7); // 70% Quality
                } else {
                    reject(new Error("Canvas context missing"));
                }
            };
            img.onerror = (err) => reject(err);
        });
    };

    const handleToggleFavorite = async (id: string) => {
        // Optimistic Update
        setImages(prev => prev.map(img => img.id === id ? { ...img, favorite: !img.favorite } : img));

        try {
            await fetch('/api/media/favorite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.uid, id: id })
            });
        } catch (e) {
            console.error("Favorite failed", e);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this artwork?")) {
            setImages(prev => prev.filter(img => img.id !== id));
            setSelectedImage(null);
            try {
                await fetch(`/api/media/image/${id}?userId=${user?.uid}`, { method: 'DELETE' });
            } catch (e) {
                console.error("Delete failed", e);
            }
        }
    };

    // Load Data
    useEffect(() => {
        if (!user) return;

        const loadImages = async () => {
            setLoadingImages(true);
            try {
                // Fetch real history or likes
                const url = activeTab === 'likes'
                    ? `/api/media/liked?userId=${user.uid}`
                    : `/api/media/history?userId=${user.uid}`;

                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setImages(data);
                    } else {
                        setImages([]);
                    }
                } else {
                    console.error("Failed to load images");
                    setImages([]);
                }
            } catch (e) {
                console.error("Error loading images", e);
                setImages([]);
            } finally {
                setLoadingImages(false);
            }
        };

        loadImages();
    }, [user, activeTab]);

    // Handle Upload
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && user) {
            setIsUploading(true);
            let compressedBlob: Blob | null = null;

            try {
                // 1. Compress
                compressedBlob = await compressImage(file);

                // 2. Upload with Timeout
                const uploadPromise = (async () => {
                    if (!compressedBlob) throw new Error("Compression failed");
                    const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}.jpg`);
                    const snapshot = await uploadBytes(storageRef, compressedBlob);
                    return await getDownloadURL(snapshot.ref);
                })();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Upload Timed Out (30s limit)")), 30000)
                );

                const url = await Promise.race([uploadPromise, timeoutPromise]) as string;

                // 3. Update Profile
                await updateProfile({ photoURL: url });

            } catch (err: any) {
                console.error("Avatar upload failed:", err);
                alert(`Avatar upload failed: ${err.message || err}`);

            } finally {
                setIsUploading(false);
                // Clear input so same file can be selected again if needed
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    // Original handleToggleFavorite and handleDelete are replaced by inline functions in ImageModal
    // const handleToggleFavorite = async (id: string) => {
    //     // Toggle Locally first (Optimistic)
    //     setImages(prev => prev.map(img => img.id === id ? { ...img, favorite: !img.favorite } : img));
    //     if (expandedImage?.id === id) setExpandedImage(prev => prev ? { ...prev, favorite: !prev.favorite } : null);

    //     // Call API
    //     try {
    //         await fetch('/api/media/favorite', {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             body: JSON.stringify({ userId: user?.uid, id: id })
    //         });
    //     } catch (e) { console.error("Favorite failed", e); }
    // };

    // const handleDelete = async (id: string) => {
    //     if (confirm("Delete this artwork?")) {
    //         setImages(prev => prev.filter(img => img.id !== id));
    //         setExpandedImage(null);
    //         // API Call assumed to exist or needs implementation
    //         await fetch(`/api/media/image/${id}?userId=${user?.uid}`, { method: 'DELETE' });
    //     }
    // };

    if (authLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F0F4F8]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Loading Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex relative overflow-hidden bg-[#F0F4F8]">
            {/* Fixed Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
                style={{ backgroundImage: "url('/profile_page_bg.jpg')" }}
            />

            {/* Left Panel - Fixed Info - Custom Background */}
            <div className="w-[280px] h-full flex-shrink-0 relative z-10 flex flex-col items-center pt-2 pb-4 px-3 border-r border-white/10 shadow-xl overflow-hidden text-sm">
                <video
                    src={profileLeftVideo}
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                    autoPlay
                    loop
                    muted
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload noremoteplayback"
                />

                {/* Avatar & User Info - Main Identity */}
                <div className="relative z-10 flex flex-col items-center gap-1 w-full flex-1 overflow-hidden">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="relative group shrink-0 mt-1"
                    >
                        {/* Avatar container with overlaid name */}
                        <div className="w-24 h-24 rounded-full bg-yellow-200 border-[3px] border-white shadow-md overflow-hidden relative">
                            <img src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Avatar" className="w-full h-full object-cover" />

                            {/* Name Overlay */}
                            <div className="absolute bottom-0 w-full bg-black/40 backdrop-blur-[1px] py-0.5 text-center">
                                <span className="text-white text-[10px] font-bold tracking-wide drop-shadow-sm truncate px-1 block">
                                    {user?.name || 'Artist'}
                                </span>
                                <span className="text-white/70 text-[8px] font-mono block">
                                    {user?.uid}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 p-1.5 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 hover:scale-110 transition-all cursor-pointer border-[1.5px] border-white disabled:opacity-50 z-10"
                        >
                            {isUploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Edit2 className="w-3 h-3" />}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </motion.div>

                    {/* Points & Premium - Pushed to Bottom & Smaller */}
                    <div className="mt-auto flex flex-col items-center gap-2 w-full pb-2">
                        <div className="flex items-center gap-1 bg-yellow-400 px-3 py-1 rounded-full border border-white shadow-sm transform hover:scale-105 transition-transform">
                            <Star className="w-3 h-3 text-white fill-current" />
                            <span className="text-xs font-black text-white">{user?.points || 0}</span>
                        </div>

                        <div className="w-full max-w-[140px]">
                            <button
                                onClick={() => navigate('/subscription')}
                                className={cn(
                                    "w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-black shadow-md transition-all",
                                    (user?.plan === 'pro' || user?.plan === 'yearly_pro' || user?.plan === 'admin')
                                        ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-purple-500/30 hover:scale-[1.02]"
                                        : user?.plan === 'basic'
                                            ? "bg-blue-500 text-white shadow-blue-500/30 hover:bg-blue-600"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                <Crown className={cn("w-3 h-3", (user?.plan && user.plan !== 'free') ? "fill-current" : "")} />
                                {user?.plan === 'pro' ? 'Pro Member' :
                                    user?.plan === 'yearly_pro' ? 'Yearly Pro' :
                                        user?.plan === 'basic' ? 'Basic Member' :
                                            user?.plan === 'admin' ? 'Admin' :
                                                'Free Explorer'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Actions: Home, Settings, Logout */}
                <div className="relative z-10 w-full flex justify-center gap-4 mt-auto pt-4 border-t border-white/20 shrink-0">
                    <button onClick={() => navigate('/home')} className="p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white transition-all flex items-center justify-center text-blue-600 shadow-sm" title="Home">
                        <Home className="w-5 h-5" />
                    </button>
                    <button onClick={() => navigate('/settings')} className="p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white transition-all flex items-center justify-center text-slate-700 shadow-sm" title="Settings">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button onClick={() => { logout(); navigate('/login'); }} className="p-3 bg-red-100/50 backdrop-blur-sm rounded-xl hover:bg-red-100 transition-all flex items-center justify-center text-red-600 shadow-sm" title="Sign Out">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Right Panel - Scrollable Content */}
            <div className="flex-1 h-full overflow-y-auto relative z-10 p-6 md:p-8 scrollbar-hide">
                <div className="max-w-[1200px] mx-auto min-h-full pb-20">
                    <div className="flex items-center justify-between mb-6 sticky top-0 z-30 py-4 bg-transparent">

                        {/* Tabs */}
                        <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl text-white shadow-lg", activeTab === 'works' ? "bg-blue-500 shadow-blue-500/20" : "bg-pink-500 shadow-pink-500/20")}>
                                    {activeTab === 'works' ? <Grid className="w-5 h-5" /> : <Heart className="w-5 h-5 fill-current" />}
                                </div>
                                {activeTab === 'works' ? 'My Masterpieces' : 'Liked Artworks'}
                            </h3>

                        </div>

                        {/* Search / Word Refers */}
                        <div className="flex-1 max-w-md mx-6 relative hidden md:block">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search your magic..."
                                    className="w-full pl-10 pr-10 py-2 rounded-full border border-slate-200 bg-white/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-200"
                                />
                                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm">
                                    <Mic className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-2xl shadow-sm border border-white/50 gap-2">
                            <button
                                onClick={() => setActiveTab('works')}
                                className={cn(
                                    "flex flex-col items-center justify-center w-20 h-20 gap-1 rounded-xl transition-all border-2",
                                    activeTab === 'works'
                                        ? "bg-blue-50 border-blue-400 text-blue-600 shadow-md scale-105"
                                        : "border-transparent text-slate-400 hover:bg-white hover:text-slate-600"
                                )}
                            >
                                <Grid className="w-8 h-8" />
                                <span className="text-[10px] font-black uppercase tracking-wide">My Works</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('likes')}
                                className={cn(
                                    "flex flex-col items-center justify-center w-20 h-20 gap-1 rounded-xl transition-all border-2",
                                    activeTab === 'likes'
                                        ? "bg-pink-50 border-pink-400 text-pink-600 shadow-md scale-105"
                                        : "border-transparent text-slate-400 hover:bg-white hover:text-slate-600"
                                )}
                            >
                                <Heart className="w-8 h-8 fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-wide">Likes</span>
                            </button>
                        </div>

                        {/* View Toggles */}
                        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600")}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-blue-100 text-blue-600" : "text-slate-400 hover:text-slate-600")}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Image Grid */}
                    <div className="bg-transparent min-h-[500px]">
                        {loadingImages ? (
                            <div className="flex justify-center py-20">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <HistoryGrid
                                images={images}
                                onImageClick={setSelectedImage}
                                viewMode={viewMode}
                            />
                        )}
                        {!loadingImages && images.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                                <p className="font-bold text-lg">No artworks found yet.</p>
                                <p className="text-sm max-w-xs text-center">Start creating or try logging in again if you expected to see something.</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-2 bg-white border border-slate-200 rounded-full font-bold shadow-sm hover:bg-slate-50 transition-colors"
                                >
                                    Refresh Page
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ImageModal
                image={selectedImage && !selectedImage.meta?.isStoryBook ? selectedImage : null}
                onClose={() => setSelectedImage(null)}
                // Inline handlers to prevent ReferenceError if definition is lost or shadowed
                onToggleFavorite={async (id) => {
                    setImages(prev => prev.map(img => img.id === id ? { ...img, favorite: !img.favorite } : img));
                    try {
                        await fetch('/api/media/favorite', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user?.uid, id: id })
                        });
                    } catch (e) { console.error("Favorite failed", e); }
                }}
                onDelete={async (id) => {
                    if (confirm("Delete this artwork?")) {
                        setImages(prev => prev.filter(img => img.id !== id));
                        setSelectedImage(null);
                        try {
                            await fetch(`/api/media/image/${id}?userId=${user?.uid}`, { method: 'DELETE' });
                        } catch (e) { console.error("Delete failed", e); }
                    }
                }}
            />

            {/* Story Book Viewer Integration */}
            {selectedImage && selectedImage.meta?.isStoryBook && (
                <StoryBookViewer
                    book={selectedImage.meta.bookData || {
                        title: selectedImage.prompt || "My Story",
                        coverImage: selectedImage.imageUrl,
                        pages: selectedImage.meta.pages || []
                    }}
                    onClose={() => setSelectedImage(null)}
                />
            )}

            <BottomNav />
        </div>
    );
};
