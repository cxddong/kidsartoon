import React, { useState, useEffect, useRef } from 'react';
import { Settings, Crown, Edit2, Grid, Clock, Star, List, LogOut, Home, Heart, Mic, Search, Sparkles, CloudUpload, Trash2, X, CheckCircle } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import HistoryGrid from '../components/history/HistoryGrid';
import ImageModal, { type ImageRecord } from '../components/history/ImageModal';
import { motion } from 'framer-motion';
import { StoryBookViewer } from '../components/viewer/StoryBookViewer';
import PictureBookReader from '../components/viewer/PictureBookReader';
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
    const [activeTab, setActiveTab] = useState<'works' | 'journey' | 'likes'>('works');
    const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Deletion State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Selection Handlers
    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds(new Set());
    };

    const handleToggleItem = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} items? This cannot be undone.`)) return;

        const idsToDelete = Array.from(selectedIds);

        // Optimistic Update
        setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
        setIsSelectionMode(false);
        setSelectedIds(new Set());

        // Backend Delete
        for (const id of idsToDelete) {
            try {
                await fetch(`/api/media/image/${id}?userId=${user?.uid}`, { method: 'DELETE' });
            } catch (e) {
                console.error("Failed to delete", id);
            }
        }
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            // Use Backend Upload (Admin SDK) to bypass client storage rules
            const formData = new FormData();
            formData.append('file', file);
            formData.append('userId', user.uid);
            formData.append('type', 'upload');

            const res = await fetch('/api/media/upload', {
                method: 'POST',
                // No Content-Type header needed for FormData, browser sets it with boundary
                body: formData
            });

            if (res.ok) {
                const newImage = await res.json();
                setImages(prev => [newImage, ...prev]);
            } else {
                let errorMsg = "Upload failed";
                try {
                    const data = await res.json();
                    if (data.details) errorMsg += `: ${data.details}`;
                } catch (e) { }
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            console.error("Upload failed", error);
            alert(error.message || "Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // Filtered Images based on Tab
    const filteredImages = React.useMemo(() => {
        if (activeTab === 'likes') return images; // API already returns likes
        if (activeTab === 'journey') return images.filter(img => img.type === 'masterpiece');
        // Works: Show everything else (generated, story, comic, animation, picturebook, upload)
        return images.filter(img => img.type !== 'masterpiece');
    }, [images, activeTab]);

    return (
        <div className="h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-[#F0F4F8]">
            {/* Background elements */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/30 rounded-full blur-[100px]" />
            </div>

            {/* Left Panel - Profile & Nav */}
            <div className="w-full md:w-[320px] lg:w-[380px] bg-white relative z-20 shadow-2xl flex flex-col h-full overflow-hidden border-r border-slate-100">

                {/* Profile Header Video Background */}
                <div className="relative h-48 w-full overflow-hidden">
                    <video
                        src={profileLeftVideo}
                        autoPlay
                        loop
                        muted
                        className="w-full h-full object-cover"
                    />

                    {/* Logout Button (Top Left) */}
                    <button
                        onClick={logout}
                        className="absolute top-4 left-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all border border-white/20 group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    </button>

                    {/* Edit Profile Button (Top Right) */}
                    <button
                        onClick={() => navigate('/edit-profile')}
                        className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all border border-white/20"
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    {/* User Info Overlay */}
                    <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
                        <div className="flex flex-col">
                            <h2 className="text-2xl font-black text-white drop-shadow-md">{user?.name || 'Artist'}</h2>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full border border-yellow-200 shadow-sm flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> {user?.plan === 'pro' ? 'Pro Artist' : 'Ready to Create'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-8">
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-800">{images.length}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Works</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col items-center">
                            <span className="text-2xl font-black text-slate-800">{images.filter(i => i.favorite).length}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Likes</span>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 flex flex-col items-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-yellow-200/20 blur-xl"></div>
                            <span className="text-2xl font-black text-amber-600 relative z-10">{user?.points || 0}</span>
                            <span className="text-[10px] font-bold text-amber-500 uppercase relative z-10">Points</span>
                        </div>
                    </div>

                    {/* Navigation Menu (Desktop Sidebar Mode) */}
                    <div className="hidden md:flex flex-col gap-2 mb-8">
                        <h3 className="text-xs font-bold text-slate-300 uppercase mb-2 ml-2 tracking-wider">Menu</h3>

                        <button onClick={() => navigate('/home')} className="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all font-bold">
                            <Home className="w-5 h-5" /> Home
                        </button>
                        <button onClick={() => navigate('/generate')} className="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-all font-bold">
                            <Sparkles className="w-5 h-5" /> Create New
                        </button>
                        <button onClick={() => navigate('/profile/history')} className="flex items-center gap-3 p-3 text-blue-600 bg-blue-50 rounded-xl transition-all font-bold">
                            <Grid className="w-5 h-5" /> My Gallery
                        </button>
                        <button onClick={() => navigate('/subscription')} className="flex items-center gap-3 p-3 text-slate-600 hover:bg-slate-50 hover:text-purple-600 rounded-xl transition-all font-bold">
                            <Crown className="w-5 h-5" /> Membership
                        </button>
                    </div>

                    {/* Quick Upload Action */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white text-center shadow-xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Edit2 className="w-24 h-24" />
                        </div>
                        <h3 className="font-bold text-lg mb-1 relative z-10">Have a drawing?</h3>
                        <p className="text-indigo-100 text-xs mb-4 relative z-10">Upload your own art to safe keep or turn into magic!</p>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 relative z-10"
                        >
                            {isUploading ? (
                                <span className="animate-pulse">Uploading...</span>
                            ) : (
                                <>
                                    <CloudUpload className="w-4 h-4" /> Upload Art
                                </>
                            )}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                </div>
            </div>

            {/* Right Panel - Scrollable Content */}
            <div className="flex-1 h-full overflow-y-auto relative z-10 p-6 md:p-8 scrollbar-hide">
                <div className="max-w-[1200px] mx-auto min-h-full pb-20">
                    <div className="flex items-center justify-between mb-6 sticky top-0 z-30 py-4 bg-transparent">

                        {/* Tabs */}
                        <div className="flex items-center gap-4">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl text-white shadow-lg",
                                    activeTab === 'works' ? "bg-blue-500 shadow-blue-500/20" :
                                        activeTab === 'journey' ? "bg-purple-500 shadow-purple-500/20" :
                                            "bg-pink-500 shadow-pink-500/20")}>
                                    {activeTab === 'works' ? <Grid className="w-5 h-5" /> :
                                        activeTab === 'journey' ? <Star className="w-5 h-5 fill-current" /> :
                                            <Heart className="w-5 h-5 fill-current" />}
                                </div>
                                {activeTab === 'works' ? 'My Masterpieces' :
                                    activeTab === 'journey' ? 'Creative Journey' :
                                        'Liked Artworks'}
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
                                <span className="text-[10px] font-black uppercase tracking-wide">Works</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('journey')}
                                className={cn(
                                    "flex flex-col items-center justify-center w-20 h-20 gap-1 rounded-xl transition-all border-2",
                                    activeTab === 'journey'
                                        ? "bg-purple-50 border-purple-400 text-purple-600 shadow-md scale-105"
                                        : "border-transparent text-slate-400 hover:bg-white hover:text-slate-600"
                                )}
                            >
                                <Star className="w-8 h-8 fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-wide">Journey</span>
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

                        {/* Selection Tools (New) */}
                        <div className="flex items-center gap-2 mr-2">
                            {isSelectionMode ? (
                                <>
                                    <button
                                        onClick={handleDeleteSelected}
                                        disabled={selectedIds.size === 0}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-full font-bold shadow-sm transition-all text-sm",
                                            selectedIds.size > 0
                                                ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200"
                                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        )}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete ({selectedIds.size})
                                    </button>
                                    <button
                                        onClick={toggleSelectionMode}
                                        className="p-2 bg-white border border-slate-200 text-slate-500 rounded-full hover:bg-slate-50 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={toggleSelectionMode}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 hover:text-blue-600 font-bold text-sm transition-all"
                                >
                                    <CheckCircle className="w-4 h-4" /> Select
                                </button>
                            )}
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
                                images={filteredImages}
                                onImageClick={setSelectedImage}
                                viewMode={viewMode}
                                isSelectionMode={isSelectionMode}
                                selectedIds={selectedIds}
                                onToggleItem={handleToggleItem}
                            />
                        )}
                        {!loadingImages && filteredImages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                                <p className="font-bold text-lg">No artworks found in {activeTab}.</p>
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
                image={selectedImage && !selectedImage.meta?.isStoryBook && selectedImage.type !== 'picturebook' ? selectedImage : null}
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
                onRegenerate={(image) => {
                    // Navigate to appropriate creation page based on type
                    setSelectedImage(null);
                    if (image.type === 'story') {
                        navigate('/generate/audio');
                    } else if (image.type === 'comic') {
                        navigate('/generate/comic');
                    } else if (image.type === 'animation') {
                        navigate('/generate/animation');
                    } else if (image.type === 'generated') {
                        navigate('/generate/cartoon');
                    } else {
                        navigate('/generate');
                    }
                }}
            />

            {/* Picture Book Viewer - Use PictureBookReader for picturebook type */}
            {selectedImage && selectedImage.type === 'picturebook' && selectedImage.meta?.pages && (() => {
                // Transform pages data to match PictureBookReader expected format
                const transformedPages = selectedImage.meta.pages.map((page: any, idx: number) => ({
                    pageNumber: page.pageNumber || idx + 1,
                    imageUrl: page.imageUrl || page.image_url || '',
                    narrativeText: page.narrativeText || page.text_overlay || page.visual_description || '',
                    audioUrl: page.audioUrl || page.audio_url
                }));

                return (
                    <PictureBookReader
                        title={selectedImage.prompt || "Picture Book"}
                        pages={transformedPages}
                        onClose={() => setSelectedImage(null)}
                    />
                );
            })()}

            {/* Story Book Viewer Integration - For other story types */}
            {selectedImage && selectedImage.meta?.isStoryBook && selectedImage.type !== 'comic' && selectedImage.type !== 'picturebook' && (
                <StoryBookViewer
                    book={selectedImage.meta.bookData || {
                        title: selectedImage.prompt || "My Story",
                        coverImage: selectedImage.imageUrl,
                        pages: selectedImage.meta.pages || []
                    }}
                    onClose={() => setSelectedImage(null)}
                    onDelete={async () => {
                        if (confirm("Delete this story book?")) {
                            setImages(prev => prev.filter(img => img.id !== selectedImage.id));
                            setSelectedImage(null);
                            try {
                                await fetch(`/api/media/image/${selectedImage.id}?userId=${user?.uid}`, { method: 'DELETE' });
                            } catch (e) {
                                console.error("Delete failed", e);
                            }
                        }
                    }}
                />
            )}

            <BottomNav />
        </div>
    );
};
