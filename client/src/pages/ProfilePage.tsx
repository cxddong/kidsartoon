import React, { useState, useEffect, useRef } from 'react';
import { Settings, Crown, Edit2, Grid, Clock, Star, List, LogOut, Home, Heart, Mic, Search, Sparkles, CloudUpload, Trash2, X, CheckCircle, BookOpen, UserCircle, Plus, ChevronDown, Shield, Video, Palette } from 'lucide-react';
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
import { CartoonBookViewer } from '../components/viewer/CartoonBookViewer';
// import { BottomNav } from '../components/BottomNav';
import { MagicNavBar } from '../components/ui/MagicNavBar'; // IMPORTED
import { ParentCodeModal } from '../components/ParentCodeModal';

import profileLeftVideo from '../assets/profileleft.mp4';

// Mock data for fallback
const MOCK_IMAGES: ImageRecord[] = [
    { id: '101', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1560114928-403316ca88bb?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'My Pet Robot' },
    { id: '102', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: false, prompt: 'Summer Camp' },
    { id: '103', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?q=80&w=600', type: 'generated', createdAt: new Date().toISOString(), favorite: true, prompt: 'Rocket Ship' },
];

// Admin Modal Component
const AdminToolsModal = ({ onClose, user }: { onClose: () => void, user: any }) => {
    const [activeTab, setActiveTab] = useState<'codes' | 'feedback'>('codes');
    const [value, setValue] = useState(1000);
    const [quantity, setQuantity] = useState(1);
    const [generatedCodes, setGeneratedCodes] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    const handleGenerate = async () => {
        try {
            const res = await fetch('/api/referral/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value, quantity, userId: user.uid })
            });
            const data = await res.json();
            if (data.success) {
                setGeneratedCodes(data.codes);
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Network Error");
        }
    };

    const fetchFeedback = async () => {
        setLoadingFeedback(true);
        try {
            const res = await fetch('/api/feedback/all');
            const data = await res.json();
            if (Array.isArray(data)) {
                setFeedbacks(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFeedback(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'feedback') {
            fetchFeedback();
        }
    }, [activeTab]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl relative animate-in fade-in zoom-in duration-200 min-h-[600px] flex flex-col">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>

                <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-4">
                    <h2 className="text-2xl font-black text-slate-800">🛠️ Admin Tools</h2>
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('codes')}
                            className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", activeTab === 'codes' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            Referral Codes
                        </button>
                        <button
                            onClick={() => setActiveTab('feedback')}
                            className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all", activeTab === 'feedback' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >
                            User Feedback
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    {activeTab === 'codes' ? (
                        <div className="grid grid-cols-2 gap-8 h-full">
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg">Generate Codes</h3>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Value</label>
                                    <select value={value} onChange={e => setValue(Number(e.target.value))} className="w-full p-2 border rounded-xl">
                                        <option value={500}>500 Points</option>
                                        <option value={1000}>1000 Points</option>
                                        <option value={2000}>2000 Points</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Quantity</label>
                                    <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full p-2 border rounded-xl" min={1} max={50} />
                                </div>
                                <button onClick={handleGenerate} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold">Generate</button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-bold text-lg">New Codes</h3>
                                <div className="h-[400px] overflow-y-auto bg-slate-50 p-4 rounded-xl border font-mono text-sm space-y-2">
                                    {generatedCodes.map((c, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm">
                                            <span className="font-bold text-slate-700">{c.code}</span>
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{c.value}</span>
                                        </div>
                                    ))}
                                    {generatedCodes.length === 0 && <p className="text-slate-400 text-center italic mt-10">No codes generated yet</p>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg">Feedback History</h3>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{feedbacks.length} Submissions</span>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl border p-4 space-y-3">
                                {loadingFeedback ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-slate-400 font-bold text-sm">Fetching feedback...</p>
                                    </div>
                                ) : (
                                    <>
                                        {feedbacks.map((fb, i) => (
                                            <div key={fb.id || i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-1 text-amber-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={14} className={cn("fill-current", i < fb.rating ? "text-amber-400" : "text-slate-200")} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400">{new Date(fb.createdAt).toLocaleDateString()} {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                                                    {fb.comment || <span className="text-slate-300 italic">No comment provided</span>}
                                                </p>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">User ID: {fb.userId.slice(-6)}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {feedbacks.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 italic">
                                                <span className="text-3xl mb-2">🎈</span>
                                                No feedback received yet!
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { user, logout, updateProfile, addChildProfile, switchProfile, activeProfile, loading: authLoading } = useAuth();

    // User State - Derived directly from Context now
    const [images, setImages] = useState<ImageRecord[]>([]);
    const [loadingImages, setLoadingImages] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'books' | 'comics' | 'cards' | 'art' | 'likes' | 'studio'>('all');
    const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);

    // Deletion State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Profile Management State
    const [showAddProfile, setShowAddProfile] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');
    const [newProfileAge, setNewProfileAge] = useState('');
    const [showAdminTools, setShowAdminTools] = useState(false);
    const [showParentCode, setShowParentCode] = useState(false);


    const handleAddProfile = async () => {
        if (!newProfileName.trim()) return;
        try {
            await addChildProfile(newProfileName, `https://api.dicebear.com/7.x/avataaars/svg?seed=${newProfileName}`, Number(newProfileAge));
            setShowAddProfile(false);
            setNewProfileName('');
            setNewProfileAge('');
            // Redirect to onboarding for the new child
            navigate('/startup');
        } catch (e) {
            console.error("Failed to add profile", e);
            alert("Failed to add profile");
        }
    };



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

        if (!user) {
            alert("Error: No user logged in!");
            return;
        }

        const idsToDelete = Array.from(selectedIds);

        // Optimistic Update
        setImages(prev => prev.filter(img => !selectedIds.has(img.id)));
        setIsSelectionMode(false);
        setSelectedIds(new Set());

        // Backend Delete
        for (const id of idsToDelete) {
            try {
                const res = await fetch(`/api/images/${id}?userId=${user?.uid}`, { method: 'DELETE' });
                if (!res.ok) {
                    const err = await res.json();
                    console.error("Delete failed for", id, err);
                    alert(`Failed to delete item: ${err.error || 'Unknown error'}`);
                    // Revert optimistic update for this item if possible, or just reload
                    window.location.reload();
                }
            } catch (e) {
                console.error("Failed to delete", id, e);
                alert("Failed to delete item due to network error.");
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
                        // CLIENT-SIDE FILTERING FOR PROFILES
                        const filtered = data.filter(img => {
                            const imgProfileId = img.meta?.profileId;

                            if (activeProfile) {
                                // Child View: Only show exact matches
                                return imgProfileId === activeProfile.id;
                            } else {
                                // Parent View: Show items that are explicitly Parent's OR Legacy (no profileId)
                                // ALSO: Show "Orphaned" items (profileId exists but doesn't match any known child)
                                // This ensures data isn't hidden if IDs get mismatched.
                                const isKnownChild = user.profiles?.some(p => p.id === imgProfileId);

                                // Show if: 
                                // 1. No profileId (Legacy)
                                // 2. Explicitly matches Parent UID
                                // 3. ID exists but is NOT a known child (Fallback)
                                return !imgProfileId || imgProfileId === user.uid || !isKnownChild;
                            }
                        });
                        setImages(filtered);
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
    }, [user, activeTab, activeProfile]);

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
        if (activeTab === 'all') return images;

        switch (activeTab) {
            case 'videos': return images.filter(img => img.type === 'animation');
            case 'books': return images.filter(img => img.type === 'picturebook' || img.type === 'story');
            case 'comics': return images.filter(img => img.type === 'comic' || img.type === 'graphic-novel' || img.type === 'cartoon-book');
            case 'cards': return images.filter(img => img.type === 'cards');
            case 'studio': return images.filter(img => img.type === 'generated' && img.meta?.source === 'magic-art-studio');
            default: return images;
        }
    }, [images, activeTab]);

    return (
        <div className="h-screen w-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
            {/* Clean Header with User Info - Top Left */}
            {/* --- COMPACT UNIFIED HEADER --- */}
            <div className="relative w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm z-20">
                <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">

                    {/* LEFT: Identity Switcher (Dropdown) */}
                    <div className="relative z-50">
                        <button
                            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                            className="flex items-center gap-3 min-w-[200px] hover:bg-slate-50 p-2 rounded-xl transition-colors text-left"
                        >
                            <div className="relative">
                                <img
                                    src={activeProfile ? activeProfile.avatar : (user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`)}
                                    alt="Profile"
                                    className="w-10 h-10 rounded-full border-2 border-blue-500 shadow-sm object-cover"
                                />
                                <div className="absolute -bottom-2 -right-2 scale-75 bg-amber-100 flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-200 shadow-sm">
                                    <span className="text-[10px]">✨</span>
                                    <span className="text-[10px] font-bold text-amber-700">{user?.points || 0}</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-800 leading-none">
                                    {activeProfile ? activeProfile.name : (user?.name || 'Parent')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                    {activeProfile ? 'Child Profile' : 'Parent Account'}
                                    <ChevronDown size={12} />
                                </span>
                            </div>
                        </button>

                        {/* Profile Dropdown */}
                        {isProfileDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2 space-y-1">
                                    <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Switch Profile</div>

                                    {/* Parent Option */}
                                    <button
                                        onClick={() => { switchProfile(null); setIsProfileDropdownOpen(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-xl transition-colors",
                                            !activeProfile ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-600"
                                        )}
                                    >
                                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                                            <img src={user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-bold">{user?.name || 'Parent'}</span>
                                            <span className="text-[10px] opacity-75">Admin</span>
                                        </div>
                                        {!activeProfile && <CheckCircle size={14} className="ml-auto" />}
                                    </button>

                                    {/* Child Options */}
                                    {user?.profiles?.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { switchProfile(p.id); setIsProfileDropdownOpen(false); }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-2 rounded-xl transition-colors",
                                                activeProfile?.id === p.id ? "bg-purple-50 text-purple-700" : "hover:bg-slate-50 text-slate-600"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                                                <img src={p.avatar} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm font-bold">{p.name}</span>
                                                <span className="text-[10px] opacity-75">Child</span>
                                            </div>
                                            {activeProfile?.id === p.id && <CheckCircle size={14} className="ml-auto" />}
                                        </button>
                                    ))}

                                    <div className="h-px bg-slate-100 my-1" />

                                    {/* Add Profile */}
                                    <button
                                        onClick={() => { setShowAddProfile(true); setIsProfileDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                                            <Plus size={14} />
                                        </div>
                                        <span className="text-sm font-medium">Add Profile</span>
                                    </button>
                                    <button
                                        onClick={() => { setShowAddProfile(true); setIsProfileDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                                            <Plus size={14} />
                                        </div>
                                        <span className="text-sm font-medium">Add Profile</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* CENTER SPACER (Replacing Switcher) */}
                    <div className="flex-1" />

                    {/* RIGHT: Actions & Controls */}
                    <div className="flex items-center gap-3">
                        {/* Parent Zone Entry - HIGHLIGHTED */}
                        <button
                            onClick={() => navigate('/parent')}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all group"
                            title="Parent Dashboard"
                        >
                            <Shield size={16} className="fill-white/20" />
                            <span className="text-xs font-bold uppercase tracking-wide">Parent Zone</span>
                        </button>

                        {/* Progress Report Button */}
                        <button
                            onClick={() => navigate('/parent/report')}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
                            title="View Progress Report"
                        >
                            <span className="text-lg">📊</span>
                            <span className="text-xs font-bold uppercase tracking-wide">Report</span>
                        </button>

                        {/* Parent Code Button */}
                        <button
                            onClick={() => setShowParentCode(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
                            title="Parent Code Settings"
                        >
                            <span className="text-lg">🔐</span>
                            <span className="text-xs font-bold uppercase tracking-wide">Parent Code</span>
                        </button>

                        {/* Admin Tools Button */}
                        {user?.plan === 'admin' && (
                            <button
                                onClick={() => setShowAdminTools(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all"
                            >
                                <span className="text-xs font-bold uppercase tracking-wide">Admin Tools</span>
                            </button>
                        )}

                        <div className="w-px h-6 bg-slate-200" />

                        {/* Search */}
                        <button
                            onClick={() => setSearchExpanded(!searchExpanded)}
                            className={cn("p-2 rounded-full transition-colors", searchExpanded ? "bg-blue-100 text-blue-600" : "text-slate-500 hover:bg-slate-100")}
                        >
                            <Search size={18} />
                        </button>

                        {/* Select Mode */}
                        <button
                            onClick={toggleSelectionMode}
                            className={cn(
                                "p-2 rounded-full transition-colors",
                                isSelectionMode ? "bg-blue-500 text-white shadow-md" : "text-slate-500 hover:bg-slate-100"
                            )}
                        >
                            {isSelectionMode ? <CheckCircle size={18} /> : <CheckCircle size={18} />}
                        </button>

                        {/* Delete Action */}
                        {isSelectionMode && selectedIds.size > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 shadow-md animate-in fade-in zoom-in"
                            >
                                <Trash2 size={12} />
                                <span>{selectedIds.size}</span>
                            </button>
                        )}

                        <div className="w-px h-6 bg-slate-200" />

                        {/* System */}
                        <button onClick={() => navigate('/subscription')} className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors" title="Premium"><Crown size={18} /></button>
                        <button onClick={() => navigate('/edit-profile')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" title="Settings"><Settings size={18} /></button>
                        <button onClick={logout} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors" title="Logout"><LogOut size={18} /></button>
                    </div>
                </div>

                {/* Dropdown Search Bar */}
                {searchExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 flex justify-center animate-in slide-in-from-top-2">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by prompt..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-500 bg-white shadow-sm"
                                autoFocus
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto px-8 pt-8 pb-24">
                <div className="max-w-[1600px] mx-auto pb-8">


                    {/* Add spacing since title row is gone */}
                    <div className="h-4" />

                    {/* Category Tabs + View Toggle - Same Row */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        {/* Category Tabs - Categorized by Content Type */}
                        <div className="flex flex-wrap gap-2 bg-white/70 backdrop-blur-sm p-1.5 rounded-2xl shadow-sm border border-slate-200">
                            {[
                                { id: 'all', label: 'All', icon: Grid },
                                { id: 'videos', label: 'Magic Cinema', icon: Video }, // Requires Video icon import
                                { id: 'books', label: 'Stories', icon: BookOpen },
                                { id: 'comics', label: 'Comics', icon: BookOpen }, // Reuse BookOpen or import new
                                { id: 'cards', label: 'Cards', icon: Sparkles },
                                { id: 'studio', label: 'My Studio', icon: Palette },
                                { id: 'likes', label: 'Likes', icon: Heart }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                                        activeTab === tab.id
                                            ? "bg-blue-500 text-white shadow-md scale-105"
                                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                    )}
                                >
                                    {tab.id === 'likes' ? <tab.icon className="w-4 h-4 fill-current" /> : <tab.icon className="w-4 h-4" />}
                                    {tab.label}
                                </button>
                            ))}
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
                image={selectedImage && !selectedImage.meta?.isStoryBook && selectedImage.type !== 'picturebook' && selectedImage.type !== 'graphic-novel' && selectedImage.type !== 'cartoon-book' ? selectedImage : null}
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
                            const res = await fetch(`/api/images/${id}?userId=${user?.uid}`, { method: 'DELETE' });
                            if (!res.ok) {
                                const err = await res.json();
                                alert(`Delete failed: ${err.error}`);
                            }
                        } catch (e) {
                            console.error("Delete failed", e);
                            alert("Delete network error");
                        }
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
                                const res = await fetch(`/api/images/${selectedImage.id}?userId=${user?.uid}`, { method: 'DELETE' });
                                if (!res.ok) alert("Story delete failed");
                            } catch (e) {
                                console.error("Delete failed", e);
                            }
                        }
                    }}
                />
            )}

            {/* Cartoon Book Viewer */}
            {selectedImage && (selectedImage.type === 'graphic-novel' || selectedImage.type === 'cartoon-book') && (selectedImage.meta?.cartoonBook || selectedImage.meta?.graphicNovel || selectedImage.meta?.pages) && (
                <CartoonBookViewer
                    title={selectedImage.prompt || "Cartoon Book"}
                    vibe={selectedImage.meta?.cartoonBook?.vibe || selectedImage.meta?.graphicNovel?.vibe || "adventure"}
                    pages={selectedImage.meta?.cartoonBook?.pages || selectedImage.meta?.graphicNovel?.pages || selectedImage.meta?.pages || []}
                    assets={selectedImage.meta?.cartoonBook?.assets || selectedImage.meta?.graphicNovel?.assets}
                    settings={selectedImage.meta?.cartoonBook?.settings || selectedImage.meta?.graphicNovel?.settings}
                    createdAt={new Date(selectedImage.createdAt).getTime()} // Use record date
                    onClose={() => setSelectedImage(null)}
                />
            )}

            {/* Add Profile Modal */}
            {showAddProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setShowAddProfile(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                        >
                            <X size={24} />
                        </button>
                        <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                            <span className="text-3xl">👶</span> Add Child Profile
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    placeholder="e.g., Leo, Maya..."
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none transition-colors text-lg font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Age (Optional)</label>
                                <input
                                    type="number"
                                    value={newProfileAge}
                                    onChange={(e) => setNewProfileAge(e.target.value)}
                                    placeholder="e.g., 5"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:outline-none transition-colors text-lg font-medium"
                                />
                            </div>

                            <button
                                onClick={handleAddProfile}
                                disabled={!newProfileName.trim()}
                                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PARENT CODE MODAL */}
            {showParentCode && user && (
                <ParentCodeModal
                    onClose={() => setShowParentCode(false)}
                    userId={user.uid}
                />
            )}

            {/* ADMIN TOOLS MODAL */}
            {showAdminTools && user?.plan === 'admin' && (
                <AdminToolsModal onClose={() => setShowAdminTools(false)} user={user} />
            )}


            {/* Magic Capsule Nav */}
            <MagicNavBar />
        </div>
    );
};
