// client/src/pages/CartoonBookBuilderPage.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, BookOpen, Wand2, Loader2, Sparkles, Plus, Mic, X } from 'lucide-react';
import { incrementUsage } from '../components/FeedbackWidget';
import { motion } from 'framer-motion';
import { AssetUploadModal } from '../components/cartoon-book/AssetUploadModal';
import cartoonBookBg from '../assets/cartoon book.mp4';

type Step = 'vibe' | 'assets' | 'configure' | 'generating' | 'complete';

interface Asset {
    id: string;
    imageUrl: string;
    description: string;
    isCoached?: boolean;
    coachFeedback?: string;
}

interface Vibe {
    id: string;
    name: string;
    emoji: string;
    description: string;
    image?: string;
}

const STORY_VIBES: Record<string, Vibe> = {
    adventure: { id: 'adventure', name: 'Adventure', emoji: '🌋', description: 'Hero vs Villain', image: '/assets/vibes/adventure.jpg' },
    funny: { id: 'funny', name: 'Funny', emoji: '🤪', description: 'Pranks & Mishaps', image: '/assets/vibes/funny.png' },
    fairytale: { id: 'fairytale', name: 'Fairy Tale', emoji: '🧚', description: 'Magic & Wonder', image: '/assets/vibes/fairytale.png' },
    school: { id: 'school', name: 'School Life', emoji: '🏫', description: 'Friends & Teachers', image: '/assets/vibes/school.png' }
};

const VIBE_HINTS: Record<string, string[]> = {
    adventure: [
        "Finds a hidden treasure map in the attic",
        "Discovers a portal behind the waterfall",
        "Rescues a baby dragon from a dark cave",
        "Solves the riddle of the ancient guardians"
    ],
    funny: [
        "Accidentally drinks a floaty potion",
        "A regular sandwich starts telling jokes",
        "Dresses up as a bush to prank the gardener",
        "The pet cat starts wearing human clothes"
    ],
    fairytale: [
        "A magical fairy grants three unusual wishes",
        "Travels to a kingdom made of candy",
        "Meets a misunderstood dragon who knits",
        "Finds boots that can jump over mountains"
    ],
    school: [
        "Finds a pen that does homework automatically",
        "The school bus turns into a space rocket",
        "A science experiment creates friendly slime",
        "Wins the talent show with a real magic trick"
    ]
};

const VISUAL_STYLES = [
    { id: 'movie_magic', label: 'Movie Magic', emoji: '🎬', prompt: '3D Pixar style, high detail, vibrant, character-focused', image: '/styles/movie_magic.png' },
    { id: 'toy_kingdom', label: 'Toy Kingdom', emoji: '🧸', prompt: 'Toy style, plastic textures, miniature world', image: '/styles/toy_kingdom.png' },
    { id: 'clay_world', label: 'Clay World', emoji: '🎨', prompt: 'Clay stop-motion, Aardman style, soft shadows', image: '/styles/clay_world.png' },
    { id: 'paper_craft', label: 'Paper Craft', emoji: '📄', prompt: 'Cut paper layers, origami, textured paper', image: '/styles/paper_craft.png' },
    { id: 'pixel_land', label: 'Pixel Land', emoji: '🎮', prompt: 'Minecraft/Roblox style, blocky, 8-bit voxel art', image: '/styles/pixel_land.png' },
    { id: 'doodle_magic', label: 'Doodle Magic', emoji: '✏️', prompt: 'Chalkboard drawing, glowing chalk lines', image: '/styles/doodle_magic.png' },
    { id: 'watercolor', label: 'Watercolor', emoji: '🌸', prompt: 'Soft watercolor painting, gentle brushstrokes', image: '/styles/watercolor.png' },
    { id: 'comic_book', label: 'Comic Book', emoji: '💥', prompt: 'Classic American comic book style, bold lines, halftone dots', image: '/styles/comic_book.png' },
];

const BOOK_LENGTH_OPTIONS = [
    { pages: 4, label: 'Short', cost: 100, image: '/assets/length_short.png' },
    { pages: 8, label: 'Epic', cost: 180, image: '/assets/length_epic.png' },
    { pages: 12, label: 'Masterpiece', cost: 250, image: '/assets/length_masterpiece.png' }
];

const LAYOUT_OPTIONS = [
    { id: 'standard', label: 'Standard', desc: '4 Panels/page', image: '/assets/layout_standard.png' },
    { id: 'dynamic', label: 'Dynamic', desc: '6-8 Panels/page', image: '/assets/layout_dynamic.png' }
];

export const CartoonBookBuilderPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('vibe');
    const [selectedVibe, setSelectedVibe] = useState<string>('');
    const [assets, setAssets] = useState<{
        slot1?: Asset;
        slot2?: Asset;
        slot3?: Asset;
        slot4?: Asset;
    }>({});
    const [totalPages, setTotalPages] = useState<4 | 8 | 12>(4);
    const [layout, setLayout] = useState<'standard' | 'dynamic'>('standard');
    const [plotHint, setPlotHint] = useState('');
    const [visualStyle, setVisualStyle] = useState(VISUAL_STYLES[0].id);
    const [taskId, setTaskId] = useState('');
    const [completedTaskId, setCompletedTaskId] = useState(''); // Preserve taskId for navigation
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [pagesCompleted, setPagesCompleted] = useState(0);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState<'slot1' | 'slot2' | 'slot3' | 'slot4' | null>(null);

    // Voice input state
    const [isListening, setIsListening] = useState(false);

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [generatedPages, setGeneratedPages] = useState<any[]>([]);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        incrementUsage();
    }, []);

    const calculateCost = () => {
        const costs: Record<number, number> = { 4: 100, 8: 180, 12: 250 };
        return costs[totalPages];
    };

    const handleVibeSelect = (vibeId: string) => {
        setSelectedVibe(vibeId);
        setStep('assets');
    };

    const openAssetModal = (slot: 'slot1' | 'slot2' | 'slot3' | 'slot4') => {
        setEditingSlot(slot);
        setModalOpen(true);
    };

    const handleAssetComplete = (asset: Omit<Asset, 'id'>) => {
        if (editingSlot) {
            setAssets(prev => ({
                ...prev,
                [editingSlot]: { ...asset, id: `${editingSlot}_${Date.now()}` }
            }));
        }
        setModalOpen(false);
        setEditingSlot(null);
    };

    const removeAsset = (slot: 'slot1' | 'slot2' | 'slot3' | 'slot4') => {
        setAssets(prev => {
            const newAssets = { ...prev };
            delete newAssets[slot];
            return newAssets;
        });
    };

    const getSlotLabel = (slotId: string): string => {
        const labels: Record<string, Record<string, string>> = {
            adventure: { slot1: '🦸 Hero', slot2: '🦹 Villain', slot3: '🏰 Place', slot4: '✨ Extra' },
            funny: { slot1: '🤡 Trickster', slot2: '😵 Target', slot3: '🏫 Place', slot4: '✨ Extra' },
            fairytale: { slot1: '🧚 Dreamer', slot2: '🧙 Magical Being', slot3: '🌟 Magical Place', slot4: '✨ Extra' },
            school: { slot1: '🎒 Student', slot2: '👫 Best Friend', slot3: '🏫 School Place', slot4: '✨ Extra' }
        };
        return labels[selectedVibe]?.[slotId] || slotId;
    };

    const canProceed = () => {
        return !!(assets.slot1 || assets.slot2 || assets.slot3 || assets.slot4);
    };

    const handleGenerate = async () => {
        if (!user) {
            alert('Please sign in first!');
            return;
        }

        if (!canProceed()) {
            alert('Please add at least one asset');
            return;
        }

        setStep('generating');
        setProgress(5);
        setStatusMessage('Connecting to Magic Lab AI...');

        try {
            const response = await fetch('/api/cartoon-book/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    vibe: selectedVibe,
                    assets,
                    totalPages,
                    layout,
                    plotHint: plotHint || undefined,
                    style: visualStyle
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Generation failed');
            }

            setTaskId(data.taskId);
            pollProgress(data.taskId);

        } catch (err: any) {
            console.error('Generation error:', err);
            alert(err.message || 'Failed to start generation');
            setStep('configure');
            setGenerating(false);
        }
    };

    const pollProgress = (id: string) => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        intervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/cartoon-book/status/${id}`);
                const data = await res.json();

                console.log('[CartoonBook] Status check:', data.status, `${data.pagesCompleted}/${data.totalPages}`, data.statusMessage);

                setPagesCompleted(data.pagesCompleted || 0);

                if (data.progress !== undefined) {
                    setProgress(data.progress);
                } else {
                    const pageBase = ((data.pagesCompleted || 0) / (data.totalPages || 4)) * 100;
                    setProgress(pageBase);
                }

                if (data.statusMessage) {
                    setStatusMessage(data.statusMessage);
                } else {
                    setStatusMessage(`Generating page ${data.currentPage || 1} of ${data.totalPages || 4}...`);
                }

                if (data.status === 'COMPLETED') {
                    console.log('[CartoonBook] Generation COMPLETED!');
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }

                    const novelRes = await fetch(`/api/cartoon-book/${id}`);
                    const novelData = await novelRes.json();

                    setGeneratedPages(novelData.pages || []);
                    setPagesCompleted(novelData.pages?.length || 0);
                    setGenerating(false);
                    setCompletedTaskId(id);
                    setTaskId('');
                    setStep('complete');

                    try {
                        await fetch('/api/media/save-cartoon-book', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userId: user?.uid,
                                taskId: id,
                                title: `Cartoon Book - ${selectedVibe.charAt(0).toUpperCase() + selectedVibe.slice(1)}`,
                                type: 'cartoon-book',
                                imageUrl: novelData.pages?.[0]?.imageUrl || '',
                                prompt: `${selectedVibe} graphic novel with ${visualStyle} style`,
                                meta: {
                                    cartoonBook: {
                                        taskId: id,
                                        vibe: selectedVibe,
                                        visualStyle: visualStyle,
                                        pages: novelData.pages,
                                        assets: {
                                            slot1: assets.slot1,
                                            slot2: assets.slot2,
                                            slot3: assets.slot3,
                                            slot4: assets.slot4
                                        },
                                        settings: {
                                            totalPages: totalPages,
                                            plotHint: plotHint
                                        },
                                        createdAt: Date.now()
                                    }
                                }
                            })
                        });
                        console.log('[CartoonBook] Saved to user history');
                    } catch (saveErr) {
                        console.error('Failed to save to history:', saveErr);
                    }
                } else if (data.status === 'PARTIAL_SUCCESS') {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    setGeneratedPages(data.pages || []);
                    setPagesCompleted(data.pagesCompleted || 0);
                    setGenerating(false);
                    setTaskId('');
                    alert(`Generated ${data.pagesCompleted}/${data.totalPages} pages. ${data.error || ''}`);
                    setStep('complete');
                } else if (data.status === 'FAILED') {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    setGenerating(false);
                    setTaskId('');
                    alert(`Generation failed: ${data.error || 'Unknown error'}`);
                    setStep('configure');
                }
            } catch (err) {
                console.error('[CartoonBook] Polling error:', err);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                setGenerating(false);
                setTaskId('');
            }
        }, 3000);
    };

    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser. Please try Chrome or Edge.');
            return;
        }

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setPlotHint((prev) => (prev ? prev + ' ' + transcript : transcript));
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="fixed inset-0 z-0">
                <video
                    src={cartoonBookBg}
                    autoPlay loop muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            <div className="relative z-10 p-2 sm:p-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header - Compact */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <button
                            onClick={() => navigate('/home')}
                            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="font-bold text-xs sm:text-sm">Back</span>
                        </button>

                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border border-white/20">
                            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                            <span className="text-white font-black text-xs sm:text-lg">Creator Studio</span>
                        </div>

                        {user && (
                            <div className="text-white text-[10px] sm:text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                                {user.points || 0} pts
                            </div>
                        )}
                    </div>

                    {/* Step 1: Vibe Selection */}
                    {step === 'vibe' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-4xl mx-auto">
                            <div className="text-center">
                                <h1 className="text-white text-2xl sm:text-4xl font-black mb-1 leading-tight">What's the vibe?</h1>
                                <p className="text-white/70 text-sm sm:text-lg italic">Choose a theme for your story</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:gap-6">
                                {Object.values(STORY_VIBES).map(vibe => (
                                    <button
                                        key={vibe.id}
                                        onClick={() => handleVibeSelect(vibe.id)}
                                        className="group relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 border-2 border-white/20 hover:border-white hover:scale-[1.02] transition-all overflow-hidden aspect-video shadow-xl"
                                    >
                                        {vibe.image && (
                                            <>
                                                <div className="absolute inset-0 w-full h-full group-hover:scale-110 transition-transform duration-700">
                                                    <img src={vibe.image} alt={vibe.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                            </>
                                        )}
                                        <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 text-left relative z-10">
                                            <h3 className="text-white text-lg sm:text-3xl font-black drop-shadow-xl tracking-tight leading-tight">{vibe.name}</h3>
                                            <p className="text-white/80 text-[10px] sm:text-base font-bold drop-shadow-lg hidden sm:block">{vibe.description}</p>
                                        </div>
                                        <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-[-25deg] group-hover:left-[100%] transition-all duration-1000" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Assets */}
                    {step === 'assets' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
                            <div className="text-center">
                                <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">{STORY_VIBES[selectedVibe]?.emoji}</div>
                                <h1 className="text-white text-2xl sm:text-4xl font-black mb-1 sm:mb-2 italic leading-tight">Build {STORY_VIBES[selectedVibe]?.name}</h1>
                                <p className="text-white/70 text-sm sm:text-lg italic">Add your characters & places!</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                {(['slot1', 'slot2', 'slot3', 'slot4'] as const).map(slot => {
                                    const asset = assets[slot];
                                    return (
                                        <div key={slot} className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border-2 border-white/10">
                                            <h3 className="text-white text-xs sm:text-sm font-bold mb-2 sm:mb-3 text-center">{getSlotLabel(slot)}</h3>
                                            {asset ? (
                                                <div className="relative group">
                                                    <img src={asset.imageUrl} alt={slot} className="w-full aspect-square object-cover rounded-xl" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-xl">
                                                        <button onClick={() => openAssetModal(slot)} className="px-2 py-1 bg-blue-500 text-white text-[10px] rounded">Edit</button>
                                                        <button onClick={() => removeAsset(slot)} className="px-2 py-1 bg-red-500 text-white text-[10px] rounded">Del</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => openAssetModal(slot)}
                                                    className="w-full aspect-square border-2 border-dashed border-white/20 hover:border-white/50 rounded-xl flex flex-col items-center justify-center gap-1 sm:gap-2 transition-all hover:bg-white/10"
                                                >
                                                    <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-white/30" />
                                                    <span className="text-white/30 text-[10px] sm:text-xs">Add</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => canProceed() ? setStep('configure') : alert('Add at least one asset')}
                                disabled={!canProceed()}
                                className="w-full py-4 sm:py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl sm:text-2xl font-black rounded-2xl hover:scale-[1.02] transition-transform disabled:opacity-50"
                            >
                                Next Step ✨
                            </button>
                        </motion.div>
                    )}

                    {/* Step 3: Configure */}
                    {step === 'configure' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
                            <h1 className="text-white text-2xl sm:text-4xl font-black text-center italic leading-tight">Final Touches</h1>

                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20 space-y-6 sm:space-y-8">
                                <div>
                                    <label className="text-white text-lg sm:text-xl font-bold block mb-2 sm:mb-4 italic">📖 Book Length:</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                                        {BOOK_LENGTH_OPTIONS.map(opt => (
                                            <button
                                                key={opt.pages}
                                                onClick={() => setTotalPages(opt.pages as 4 | 8 | 12)}
                                                className={`relative overflow-hidden rounded-xl transition-all group aspect-square shadow-lg ${totalPages === opt.pages ? 'scale-105 ring-4 ring-yellow-400 z-10' : 'hover:scale-105 hover:ring-2 hover:ring-white/50'}`}
                                            >
                                                <img src={opt.image} alt={opt.label} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2 sm:p-3 text-center">
                                                    <div className="text-white font-black text-sm sm:text-lg">{opt.label}</div>
                                                    <div className="text-white/80 text-[10px] sm:text-xs font-bold">{opt.pages} Pages</div>
                                                    <div className="text-yellow-300 text-[10px] sm:text-xs font-bold sm:mt-1">-{opt.cost} pts</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-white text-lg sm:text-xl font-bold block mb-2 sm:mb-4 italic">🎨 Layout:</label>
                                    <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                        {LAYOUT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setLayout(opt.id as 'standard' | 'dynamic')}
                                                className={`relative overflow-hidden rounded-xl transition-all group aspect-[4/3] shadow-lg ${layout === opt.id ? 'scale-105 ring-4 ring-yellow-400 z-10' : 'hover:scale-105 hover:ring-2 hover:ring-white/50'}`}
                                            >
                                                <img src={opt.image} alt={opt.label} className="absolute inset-0 w-full h-full object-cover" />
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2 sm:p-3 text-center">
                                                    <div className="text-white font-black text-sm sm:text-lg">{opt.label}</div>
                                                    <div className="text-white/80 text-[10px] sm:text-xs font-bold">{opt.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-white text-lg sm:text-xl font-bold block mb-2 sm:mb-4 italic">🖌️ Art Style:</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                                        {VISUAL_STYLES.map(style => (
                                            <button
                                                key={style.id}
                                                onClick={() => setVisualStyle(style.id)}
                                                className={`relative overflow-hidden rounded-xl transition-all group aspect-square ${visualStyle === style.id ? 'scale-105 shadow-xl ring-4 ring-yellow-400 z-10' : 'hover:scale-105 hover:ring-2 hover:ring-white/50'}`}
                                            >
                                                {style.image ? <img src={style.image} alt={style.label} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-slate-800" />}
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-1.5 sm:p-2">
                                                    <span className="text-white font-bold text-xs sm:text-sm block text-center leading-tight">{style.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-white/50 text-[10px] sm:text-sm text-center italic">{VISUAL_STYLES.find(s => s.id === visualStyle)?.prompt}</div>
                                </div>

                                <div>
                                    <label className="text-white text-base sm:text-lg font-bold block mb-2 italic">Story Direction (Optional)</label>
                                    {selectedVibe && VIBE_HINTS[selectedVibe] && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {VIBE_HINTS[selectedVibe].map((hint, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setPlotHint(hint)}
                                                    className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[10px] sm:text-xs text-white/80 transition-all font-medium"
                                                >
                                                    + {hint}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="relative">
                                        <textarea
                                            value={plotHint}
                                            onChange={e => setPlotHint(e.target.value)}
                                            className="w-full p-3 pr-20 rounded-xl bg-white/10 text-white border border-white/20 focus:border-purple-500 focus:outline-none text-sm" rows={3}
                                            placeholder={`e.g., ${VIBE_HINTS[selectedVibe]?.[0] || 'The hero rescues a dragon...'}`}
                                        />
                                        <div className="absolute top-2 right-2 flex gap-1.5">
                                            <button type="button" onClick={handleVoiceInput} className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/10 text-white hover:bg-white/20'}`} title="Voice Input">
                                                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </button>
                                            {plotHint && (
                                                <button type="button" onClick={() => setPlotHint('')} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all" title="Clear Text">
                                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <button onClick={() => setStep('assets')} className="w-full py-3 sm:py-4 bg-white/10 text-white font-bold rounded-xl text-sm sm:text-base border border-white/10 hover:bg-white/20 transition-all">Back</button>
                                <button onClick={handleGenerate} className="w-full py-4 sm:py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl sm:text-2xl font-black rounded-2xl hover:scale-[1.02] transition-transform shadow-lg shadow-purple-500/20">
                                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                                        <Wand2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                        <span>Create Masterpiece!</span>
                                    </div>
                                    <div className="text-[10px] sm:text-sm mt-0.5 sm:mt-1 font-bold text-white/90">-{calculateCost()} pts</div>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Generating */}
                    {step === 'generating' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center min-h-[60vh]">
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 sm:p-12 border border-white/20 max-w-md w-full text-center">
                                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400 animate-spin mx-auto mb-4 sm:mb-6" />
                                <h2 className="text-white text-xl sm:text-2xl font-black mb-2 sm:mb-4">Creating Magic...</h2>
                                <p className="text-white/70 text-sm mb-4 sm:mb-6">{statusMessage}</p>
                                <div className="w-full bg-black/30 rounded-full h-4 sm:h-6 overflow-hidden mb-4">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                                </div>
                                <div className="text-white font-bold text-sm sm:text-lg">{pagesCompleted} / {totalPages} pages</div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Complete */}
                    {step === 'complete' && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 sm:space-y-8">
                            <div>
                                <Sparkles className="w-16 h-16 sm:w-20 sm:h-20 text-yellow-400 mx-auto mb-4 animate-pulse" />
                                <h1 className="text-white text-3xl sm:text-5xl font-black mb-2 sm:mb-4">🎉 Ready!</h1>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                                <button onClick={() => navigate(`/cartoon-book/reader/${completedTaskId}`)} className="px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg sm:text-xl font-bold rounded-xl hover:scale-105 transition-transform">
                                    📖 Read Now
                                </button>
                                <button onClick={() => {
                                    setStep('vibe');
                                    setSelectedVibe('');
                                    setAssets({});
                                    setPlotHint('');
                                }} className="px-6 py-3 sm:px-8 sm:py-4 bg-white/10 text-white text-lg sm:text-xl font-bold rounded-xl hover:bg-white/20 transition-all">
                                    ✨ Create New
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Asset Modal */}
                {editingSlot && user && (
                    <AssetUploadModal
                        isOpen={modalOpen}
                        slot={editingSlot}
                        slotLabel={getSlotLabel(editingSlot)}
                        vibe={selectedVibe}
                        userId={user.uid}
                        userPoints={user.points || 0}
                        onClose={() => {
                            setModalOpen(false);
                            setEditingSlot(null);
                        }}
                        onComplete={handleAssetComplete}
                    />
                )}
            </div>
        </div>
    );
};
