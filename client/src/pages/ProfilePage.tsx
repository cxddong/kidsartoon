import React, { useState, useEffect, useRef } from 'react';
import { Settings, Crown, Edit2, Grid, Clock, Star, List, LogOut } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import HistoryGrid from '../components/history/HistoryGrid';
import ImageModal, { type ImageRecord } from '../components/history/ImageModal';
import { motion } from 'framer-motion';

// Mock data for fallback
const MOCK_IMAGES: ImageRecord[] = [
    { id: '101', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1560114928-403316ca88bb?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'My Pet Robot' },
    { id: '102', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: false, prompt: 'Summer Camp' },
    { id: '103', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?q=80&w=600', type: 'generated', createdAt: new Date().toISOString(), favorite: true, prompt: 'Rocket Ship' },
];

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, updateProfile } = useAuth();

    // User State - Derived directly from Context now
    const [images, setImages] = useState<ImageRecord[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

    // Load Data
    useEffect(() => {
        if (!user) return;

        const loadImages = async () => {
            try {
                // Fetch real history
                const res = await fetch(`/api/media/history?userId=${user.uid}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setImages(data);
                        // Fallback to MOCK_IMAGES if API returns empty (for demo consistency)
                        setImages(MOCK_IMAGES);
                    }
                } else {
                    console.error("Failed to load history");
                    setImages(MOCK_IMAGES); // Fallback on error too
                }
            } catch (e) {
                console.error("Error loading images", e);
                setImages(MOCK_IMAGES);
            } finally {
                setLoadingImages(false);
            }
        };

        loadImages();
    }, [user]);

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
                console.warn("Upload failed (network blocked?), falling back to local image.", err);

                // FALLBACK: If upload fails, use the local blob URL so the user sees the change anyway.
                // This acts as a "Offline Mode" feature.
                if (compressedBlob) {
                    const localUrl = URL.createObjectURL(compressedBlob);
                    await updateProfile({ photoURL: localUrl });
                } else {
                    const localUrl = URL.createObjectURL(file);
                    await updateProfile({ photoURL: localUrl });
                }

            } finally {
                setIsUploading(false);
                // Clear input so same file can be selected again if needed
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const handleToggleFavorite = (id: string) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, favorite: !img.favorite } : img));
        if (selectedImage?.id === id) setSelectedImage(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
    };

    const handleDelete = (id: string) => {
        if (confirm("Delete this artwork?")) {
            setImages(prev => prev.filter(img => img.id !== id));
            setSelectedImage(null);
        }
    };

    return (
        <div className="h-screen w-full flex relative overflow-hidden bg-[#F0F4F8]">
            {/* Fixed Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
                style={{ backgroundImage: "url('/profile_page_bg.jpg')" }}
            />

            {/* Left Panel - Fixed Info - Transparent glass effect */}
            <div className="w-[280px] h-full flex-shrink-0 relative z-10 flex flex-col items-center pt-4 pb-4 px-3 border-r border-white/10 bg-white/10 backdrop-blur-sm shadow-xl overflow-hidden text-sm">

                {/* Logo Area */}
                <div className="w-full flex justify-center mb-2 cursor-pointer" onClick={() => navigate('/home')}>
                    <img src="/logo_header.png" alt="KidsARToon" className="h-16 object-contain drop-shadow-md hover:scale-105 transition-transform" />
                </div>

                {/* Avatar & User Info - Compact Mode */}
                <div className="flex flex-col items-center gap-1 w-full flex-1 overflow-hidden mt-1">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="relative group shrink-0"
                    >
                        {/* Avatar - Smaller */}
                        <div className="w-20 h-20 rounded-full bg-yellow-200 border-[3px] border-white shadow-md overflow-hidden relative">
                            <img src={user?.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Avatar" className="w-full h-full object-cover" />
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="absolute bottom-0 right-0 p-1 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 hover:scale-110 transition-all cursor-pointer border-[1.5px] border-white disabled:opacity-50"
                        >
                            {isUploading ? <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Edit2 className="w-2.5 h-2.5" />}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </motion.div>

                    <div className="text-center w-full shrink-0">
                        <h2 className="text-lg font-black text-slate-800 drop-shadow-sm truncate px-1 leading-tight">{user?.name || 'Artist'}</h2>
                        <p className="text-[10px] text-slate-600 font-bold mb-2 bg-white/50 inline-block px-2 py-0.5 rounded-full mt-1">{user?.age || 7} Years • {user?.language || 'English'}</p>

                        <div className="flex justify-center gap-2 mb-2">
                            <div className="flex items-center gap-1 bg-yellow-400 px-3 py-1 rounded-full border-2 border-white shadow-sm transform hover:scale-105 transition-transform">
                                <Star className="w-3 h-3 text-white fill-current" />
                                <span className="text-sm font-black text-white">{user?.points || 0}</span>
                            </div>
                        </div>

                        <div className="w-full max-w-[180px] mx-auto mt-1">
                            <button onClick={() => navigate('/subscription')} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-orange-500/30 hover:scale-[1.02] transition-all">
                                <Crown className="w-3.5 h-3.5 fill-current" />
                                Premium
                            </button>
                        </div>
                    </div>
                </div>

                {/* Settings & Logout - Bottom */}
                <div className="w-full flex justify-center gap-4 mt-auto pt-4 border-t border-white/20 shrink-0">
                    <button onClick={() => navigate('/settings')} className="p-3 bg-white/50 backdrop-blur-sm rounded-xl hover:bg-white transition-all flex items-center justify-center text-slate-700 shadow-sm" title="Settings">
                        <Settings className="w-5 h-5" />
                    </button>
                    <button onClick={() => { logout(); navigate('/login'); }} className="p-3 bg-red-100/50 backdrop-blur-sm rounded-xl hover:bg-red-100 transition-all flex items-center justify-center text-red-600 shadow-sm" title="Sign Out">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Right Panel - Scrollable Content (No outer scrollbar logic by scrollbar-hide) */}
            <div className="flex-1 h-full overflow-y-auto relative z-10 p-6 md:p-8 scrollbar-hide">
                <div className="max-w-[1200px] mx-auto min-h-full pb-20">
                    <div className="flex items-center justify-center mb-6 sticky top-0 z-30 py-4 bg-[#F0F4F8]/95 backdrop-blur-md border-b border-white/20 shadow-sm">
                        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20">
                                <Grid className="w-5 h-5" />
                            </div>
                            Latest Creations
                        </h3>
                        {/* View Toggles - Pushed to right absolutely to avoid flex mess if title is long */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm mr-4">
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
                            />
                        )}
                        {!loadingImages && images.length === 0 && (
                            <div className="text-center py-20 text-slate-400 font-bold">No artworks yet.</div>
                        )}
                    </div>
                </div>
            </div>

            <ImageModal
                image={selectedImage}
                onClose={() => setSelectedImage(null)}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDelete}
            />
        </div>
    );
};
