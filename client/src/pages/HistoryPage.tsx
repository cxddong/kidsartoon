import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, SortDesc } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HistoryGrid from '../components/history/HistoryGrid';
import ImageModal, { type ImageRecord } from '../components/history/ImageModal';

const FILTERS = ['All', 'Uploaded', 'Generated', 'Story', 'Audio Story', 'Animation'];

const HistoryPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [images, setImages] = useState<ImageRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFilter, setSelectedFilter] = useState('All');
    const [sortNewest, setSortNewest] = useState(true);
    const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);

    useEffect(() => {
        if (!user) return;

        // Fetch images
        fetch(`/api/images/${user.uid}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setImages(data);
                }
            })
            .catch(err => console.error('Failed to load history', err))
            .finally(() => setLoading(false));
    }, [user]);

    const filteredImages = images
        .filter(img => {
            if (selectedFilter === 'All') return true;
            if (selectedFilter === 'Uploaded') return img.type === 'upload';
            if (selectedFilter === 'Generated') return img.type === 'generated';
            if (selectedFilter === 'Story') return img.type === 'story' || img.type === 'comic' || img.type === 'picturebook' || img.type === 'graphic-novel' || img.type === 'cartoon-book';
            if (selectedFilter === 'Audio Story') return img.type === 'story' && img.meta?.audioUrl; // Use specific type or property check
            if (selectedFilter === 'Animation') return img.type === 'animation';
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortNewest ? dateB - dateA : dateA - dateB;
        });

    const handleToggleFavorite = async (id: string) => {
        if (!user) return;
        try {
            const res = await fetch(`/api/images/${id}/toggle-favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid })
            });
            if (res.ok) {
                setImages(prev => prev.map(img =>
                    img.id === id ? { ...img, favorite: !img.favorite } : img
                ));
                if (selectedImage && selectedImage.id === id) {
                    setSelectedImage(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
                }
            }
        } catch (error) {
            console.error('Failed to toggle favorite', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to delete this artwork?')) return;

        try {
            const res = await fetch(`/api/images/${id}?userId=${user.uid}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setImages(prev => prev.filter(img => img.id !== id));
                setSelectedImage(null);
            }
        } catch (error) {
            console.error('Failed to delete image', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F4F8]">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
                    >
                        <ArrowLeft />
                    </button>
                    <h1 className="text-2xl font-black text-slate-800">My Artwork Gallery</h1>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    {/* Filters */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {FILTERS.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setSelectedFilter(filter)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${selectedFilter === filter
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <button
                        onClick={() => setSortNewest(!sortNewest)}
                        className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all"
                    >
                        <SortDesc size={18} className={sortNewest ? "transform rotate-0" : "transform rotate-180"} />
                        {sortNewest ? 'Newest' : 'Oldest'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <main className="p-6 max-w-[1600px] mx-auto">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <HistoryGrid
                        images={filteredImages}
                        onImageClick={setSelectedImage}
                    />
                )}
            </main>

            <ImageModal
                image={selectedImage}
                onClose={() => setSelectedImage(null)}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default HistoryPage;
