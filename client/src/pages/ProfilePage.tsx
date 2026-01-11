import React, { useState, useEffect, useRef } from 'react';
import { Settings, Crown, Edit2, Grid, Clock, Star, List, LogOut, Home, Heart, Mic, Search, Sparkles, CloudUpload, Trash2, X, CheckCircle, BookOpen } from 'lucide-react';
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
import { GraphicNovelViewer } from '../components/viewer/GraphicNovelViewer';
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
    const [activeTab, setActiveTab] = useState<'works' | 'journey' | 'graphic-novels' | 'likes'>('works');
    const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);

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
        if (activeTab === 'graphic-novels') return images.filter(img => img.type === 'graphic-novel');
        // Works: Show everything else (generated, story, comic, animation, picturebook, upload)
        return images.filter(img => img.type !== 'masterpiece' && img.type !== 'graphic-novel');
    }, [images, activeTab]);

    return (
        <div className="h-screen w-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Clean Header with User Info - Top Left */}
            <div className="relative w-full bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-8 py-6 flex items-start gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user?.name || 'User'}
                                className="w-28 h-28 rounded-full border-4 border-blue-500 shadow-lg object-cover"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-4 border-blue-500 shadow-lg">
                                <span className="text-white text-5xl font-black">
                                    {(user?.name || 'A').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* User Info + Action Buttons */}
                    <div className="flex-1">
                        {/* Username */}
                        <h2 className="text-3xl font-black text-slate-800 mb-1">
                            {user?.name || 'Artist'}
                        </h2>

                        {/* Points Display */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                                <span className="text-amber-700 font-bold text-sm">✨ {user?.points || 0} Points</span>
                            </div>
                        </div>

                        {/* Icon-Only Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/subscription')}
                                className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
                                title="Membership"
                            >
                                <Crown className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => navigate('/edit-profile')}
                                className="p-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition-all shadow-sm hover:shadow-md"
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </button>

                            <button
                                onClick={logout}
                                className="p-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all shadow-sm hover:shadow-md"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto px-8 pt-8 pb-24">
                <div className="max-w-[1600px] mx-auto pb-8">

                    {/* Title Row with Search */}
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-4xl font-black text-slate-800">
                            My Masterpieces
                        </h3>

                        <div className="flex items-center gap-3">
                            {/* Search - Icon or Expanded */}
                            {searchExpanded ? (
                                <div className="flex items-center gap-2 bg-white rounded-2xl border-2 border-blue-500 shadow-lg px-4 py-2 animate-in fade-in slide-in-from-right">
                                    <Search className="w-5 h-5 text-blue-500" />
                                    <input
                                        type="text"
                                        placeholder="Search your magic..."
                                        className="outline-none w-64"
                                        autoFocus
                                    />
                                    <button onClick={() => setSearchExpanded(false)} className="p-1 hover:bg-slate-100 rounded-full">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setSearchExpanded(true)}
                                    className="p-3 bg-white rounded-xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                                >
                                    <Search className="w-5 h-5 text-slate-600" />
                                </button>
                            )}

                            {/* Select - Icon Only */}
                            <button
                                onClick={toggleSelectionMode}
                                className={cn(
                                    "p-3 rounded-full border-2 transition-all shadow-sm",
                                    isSelectionMode
                                        ? "bg-blue-500 border-blue-600 text-white"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:bg-blue-50"
                                )}
                            >
                                {isSelectionMode ? <X className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                            </button>

                            {/* Delete Button (when selection mode active) */}
                            {isSelectionMode && selectedIds.size > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg animate-in fade-in slide-in-from-right"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete ({selectedIds.size})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Category Tabs + View Toggle - Same Row */}
                    <div className="flex justify-between items-center mb-6">
                        {/* Category Tabs */}
                        <div className="flex gap-2 bg-white/70 backdrop-blur-sm p-1 rounded-2xl shadow-sm border border-slate-200">
                            <button
                                onClick={() => setActiveTab('works')}
                                className={cn(
                                    "px-6 py-3 rounded-xl font-bold transition-all",
                                    activeTab === 'works'
                                        ? "bg-blue-500 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <Grid className="w-5 h-5 inline-block mr-2" />
                                Works
                            </button>
                            <button
                                onClick={() => setActiveTab('journey')}
                                className={cn(
                                    "px-6 py-3 rounded-xl font-bold transition-all",
                                    activeTab === 'journey'
                                        ? "bg-purple-500 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <Star className="w-5 h-5 inline-block mr-2 fill-current" />
                                Journey
                            </button>
                            <button
                                onClick={() => setActiveTab('graphic-novels')}
                                className={cn(
                                    "px-6 py-3 rounded-xl font-bold transition-all",
                                    activeTab === 'graphic-novels'
                                        ? "bg-orange-500 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <BookOpen className="w-5 h-5 inline-block mr-2" />
                                Graphic Novels
                            </button>
                            <button
                                onClick={() => setActiveTab('likes')}
                                className={cn(
                                    "px-6 py-3 rounded-xl font-bold transition-all",
                                    activeTab === 'likes'
                                        ? "bg-pink-500 text-white shadow-md"
                                        : "text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <Heart className="w-5 h-5 inline-block mr-2 fill-current" />
                                Likes
                            </button>
                        </div>

                        {/* View Toggle - Right Side */}
                        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-3 rounded-lg transition-all",
                                    viewMode === 'grid'
                                        ? "bg-blue-100 text-blue-600"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-3 rounded-lg transition-all",
                                    viewMode === 'list'
                                        ? "bg-blue-100 text-blue-600"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                )}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Image Grid - Enlarged */}
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

            {/* Modals */}
            <ImageModal
                image={selectedImage && !selectedImage.meta?.isStoryBook && selectedImage.type !== 'picturebook' && selectedImage.type !== 'graphic-novel' ? selectedImage : null}
                onClose={() => setSelectedImage(null)}
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

            {/* Picture Book Viewer */}
            {selectedImage && selectedImage.type === 'picturebook' && selectedImage.meta?.pages && (() => {
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

            {/* Story Book Viewer */}
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

            {/* Graphic Novel Viewer */}
            {selectedImage && selectedImage.type === 'graphic-novel' && selectedImage.meta?.graphicNovel && (
                <GraphicNovelViewer
                    title={selectedImage.prompt || "Graphic Novel"}
                    vibe={selectedImage.meta.graphicNovel.vibe || "adventure"}
                    pages={selectedImage.meta.graphicNovel.pages || []}
                    assets={selectedImage.meta.graphicNovel.assets}
                    settings={selectedImage.meta.graphicNovel.settings}
                    createdAt={selectedImage.meta.graphicNovel.createdAt || Date.now()}
                    onClose={() => setSelectedImage(null)}
                />
            )}

            <BottomNav />
        </div>
    );
};
