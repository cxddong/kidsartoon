
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    Download,
    Share2,
    Brain,
    Palette,
    Zap,
    Target,
    Sparkles,
    Star,
    Video,
    BookOpen,
    Activity,
    Lock,
    X,
    Plus
} from 'lucide-react';
import { BouncyButton } from '../components/ui/BouncyButton';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

// --- Shared Components (Extracted/Copied from Dashboard) ---

const RadarChart = ({ scores }: { scores: Record<string, number> }) => {
    const axes = ['Color IQ', 'Spatial', 'MotorSkill', 'Creativity', 'Focus'];
    const radius = 80;
    const center = 120;

    const points = axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const keyMap: Record<string, string> = {
            'Color IQ': 'colorIQ',
            'Spatial': 'spatial',
            'MotorSkill': 'motorSkill',
            'Creativity': 'creativity',
            'Focus': 'focus'
        };
        const key = keyMap[axis] || axis.toLowerCase();
        const rawScore = scores[key] || 50;
        const score = Math.max(0.1, Math.min(rawScore / 100, 1));
        const x = center + Math.cos(angle) * (radius * score);
        const y = center + Math.sin(angle) * (radius * score);
        return `${x},${y}`;
    }).join(' ');

    const bgPoints = axes.map((_, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-xl">
            <defs>
                <radialGradient id="radarGrad">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
                </radialGradient>
            </defs>
            <polygon points={bgPoints} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            {[0.25, 0.5, 0.75].map(r => (
                <circle key={r} cx={center} cy={center} r={radius * r} fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
            ))}
            <motion.polygon
                initial={{ opacity: 0, scale: 0, transformOrigin: `${center}px ${center}px` }}
                animate={{ opacity: 1, scale: 1 }}
                points={points}
                fill="url(#radarGrad)"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
            {axes.map((axis, i) => {
                const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
                const x = center + Math.cos(angle) * (radius + 30);
                const y = center + Math.sin(angle) * (radius + 30);
                return (
                    <text key={axis} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-slate-400 font-black uppercase tracking-tighter">
                        {axis}
                    </text>
                );
            })}
        </svg>
    );
};

export const PortfolioReportPage: React.FC = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const { user, activeProfile } = useAuth();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedMasterpiece, setSelectedMasterpiece] = useState<any>(null);

    useEffect(() => {
        const fetchReport = async () => {
            if (reportId === 'mock-id') {
                const name = activeProfile?.name || user?.name?.split(' ')[0] || "Your Artist";

                // Try to get real user images for the mock
                let realImages: string[] = [];
                if (user) {
                    try {
                        const res = await fetch(`/api/audit/user-images/${user.uid}`);
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            realImages = data.slice(0, 12).map(img => img.imageUrl);
                        }
                    } catch (e) {
                        console.warn("Could not fetch user images for mock:", e);
                    }
                }

                // Default placeholder images if no user images exist
                const defaultPlacements = [
                    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
                    'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400',
                    'https://images.unsplash.com/photo-1533158307587-828f0a76ef46?w=400',
                    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400',
                    'https://images.unsplash.com/photo-1488167428129-aa5840cac5dc?w=400',
                    'https://images.unsplash.com/photo-1512418490979-92798ccc1380?w=400',
                    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400',
                    'https://images.unsplash.com/photo-1491243959279-0c365ec99a0d?w=400'
                ];

                const finalImages = realImages.length >= 4 ? realImages : [...realImages, ...defaultPlacements.slice(realImages.length)];

                setReport({
                    id: 'mock-id',
                    childName: name,
                    createdAt: Date.now(),
                    imageCount: Math.max(22, realImages.length),
                    isMock: true,
                    analyzedImages: finalImages,
                    psychologicalProfile: {
                        colorTrends: `${name}'s palette has evolved dramatically over the last batch of drawings. Early preference for dark outlines and monochromatic themes has transitioned significantly to vibrant yellows, warm oranges, and deep purples. This shift suggests a blossoming of self-confidence and a more extroverted approach to their surroundings. We see a brave use of contrasting colors that indicates a growing willingness to take creative risks and express complex emotions through bold visual choices.`,
                        contentProjection: `Frequent depiction of 'smiling monsters' by ${name} indicates healthy emotional processing and high psychological resilience. By giving fears a friendly face, they are using their art to personify abstract anxieties and then neutralize them with joy and humor. This shows a sophisticated psychological coping mechanism for their age group. The recurring themes of adventure and companionship in these monster stories suggest a strong sense of inner security and a vivid, positive imagination.`,
                        emotionalState: `${name} is currently in a state of 'Curious Exploration', displaying high openness to new experiences and a hunger for learning. Their compositions are becoming more open and expansive, indicating a sense of safety and a desire to interact more deeply with the world around them. We observe a clear trend toward more detailed environments, which reflects an increasing ability to focus and a growing interest in the underlying logic of their subjects. They are ready for more complex narrative challenges.`
                    },
                    scores: { colorIQ: 88, spatial: 72, motorSkill: 65, creativity: 94, focus: 78 },
                    topPicks: [
                        {
                            imageId: '1',
                            imageUrl: finalImages[0],
                            strength: 'Storytelling',
                            reason: `${name}'s incredible dynamic character interaction here shows an emergent narrative flow that would make an exceptional graphic novel.`,
                            recommendation: { target: 'comic', label: "Comic Prototype", cta: "Turn into a Graphic Novel" }
                        },
                        {
                            imageId: '2',
                            imageUrl: finalImages[1],
                            strength: 'Composition',
                            reason: `Sophisticated use of negative space by ${name} suggests a cinematic eye. This background is perfect for 3D animation.`,
                            recommendation: { target: 'animation', label: "Cinematic Background", cta: "Bring to Life in Cinema" }
                        },
                        {
                            imageId: '3',
                            imageUrl: finalImages[2],
                            strength: 'Line Detail',
                            reason: `Exceptional fine motor control in this intricate texture. ${name} is ready for advanced light and shadow practice.`,
                            recommendation: { target: 'creative-journey', label: "Advanced Coloring", cta: "Master Colors with Coach" }
                        }
                    ]
                });
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/audit/report/${reportId}`);
                const data = await res.json();
                setReport(data);
            } catch (err) {
                console.error('Fetch report failed:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [reportId]);

    const handleRecommendationClick = (target: string, imageUrl: string) => {
        // Navigate to target page and pass the image as state
        navigate(`/${target}`, { state: { preloadedImage: imageUrl } });
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
        </div>
    );

    if (!report) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <Lock className="w-12 h-12 text-slate-300" />
            <p className="text-slate-500 font-bold">Report not found</p>
            <BouncyButton onClick={() => navigate('/parent')}>Back to Dashboard</BouncyButton>
        </div>
    );

    const childName = report.childName || "Your child";

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button onClick={() => navigate('/parent')} className="p-2 text-slate-400 hover:text-slate-600">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-black text-slate-800 tracking-tight">Portfolio Analysis</h1>
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] leading-none mt-1">Growth Audit v2.0</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600"><Download size={20} /></button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600"><Share2 size={20} /></button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 pt-32 pb-32 space-y-8">

                {/* --- NEW: Image Thumbnails Strip --- */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Analyzed Masterpieces</h3>
                        <span className="text-[10px] font-bold text-slate-300">{report.imageCount} total</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-2 select-none">
                        {report.analyzedImages?.map((url: string, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 hover:scale-105 transition-transform cursor-pointer"
                                onClick={() => setSelectedImage(url)}
                            >
                                <img src={url} className="w-full h-full object-cover" alt="Thumb" />
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* 1. The Summary Card */}
                <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="w-full max-w-[300px] aspect-square relative z-10">
                        <RadarChart scores={report.scores} />
                    </div>
                    <div className="flex-1 space-y-6 relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest">
                            <Sparkles className="w-4 h-4" />
                            Elite Potential Detected
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 leading-none tracking-tight">
                            A Journey of {report.imageCount} Masterpieces.
                        </h2>
                        <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            Based on your latest portfolio, <span className="text-slate-900 font-bold">{childName}</span> is showing significant growth in <span className="text-indigo-600 font-bold">Spatial Logic</span> and <span className="text-pink-600 font-bold">Emotional Storytelling</span>.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Top Skill</span>
                                <span className="text-lg font-black text-slate-800">Visual Creativity</span>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mood Weather</span>
                                <span className="text-lg font-black text-slate-800">Radiant & Open</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Psychological Deep Dive */}
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Color Psychology', content: report.psychologicalProfile.colorTrends, icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50' },
                        { title: 'Inner Content', content: report.psychologicalProfile.contentProjection, icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                        { title: 'Growth Stage', content: report.psychologicalProfile.emotionalState, icon: Target, color: 'text-amber-500', bg: 'bg-amber-50' }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm"
                        >
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", item.bg)}>
                                <item.icon className={cn("w-6 h-6", item.color)} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 mb-4">{item.title}</h3>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed text-justify">{item.content}</p>
                        </motion.div>
                    ))}
                </div>

                {/* --- NEW: Artist Style Matches --- */}
                {report.artistMatches && report.artistMatches.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Palette className="w-4 h-4 text-purple-600" />
                            </div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Artist Spirit Matches</h3>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            {report.artistMatches.map((match: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]"
                                    onClick={() => setSelectedMasterpiece(match)}
                                >
                                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-slate-50 border border-slate-100">
                                        <img
                                            src={match.imagePath}
                                            alt={match.title}
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 p-2"
                                        />
                                        <div className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-purple-100 font-black text-xs text-purple-600 shadow-sm">
                                            #{idx + 1}
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 leading-tight mb-1">{match.artist}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 line-clamp-1">{match.title}</p>
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3 italic">
                                        "{match.analysis}"
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-indigo-500 group-hover:text-indigo-600 transition-colors">
                                        <Plus className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Admire Masterpiece</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. The Top Picks (CTA Section) */}
                <section className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Smart Recommendations</h2>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">3 Opportunity Picks</span>
                    </div>

                    <div className="space-y-6">
                        {report.topPicks?.map((pick: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center group"
                            >
                                <div className="w-full md:w-56 aspect-[4/3] rounded-3xl overflow-hidden border-4 border-slate-50 shrink-0 shadow-inner bg-slate-100 cursor-pointer" onClick={() => setSelectedImage(pick.imageUrl)}>
                                    <img src={pick.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Pick" />
                                </div>
                                <div className="flex-1 space-y-4 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <Star className="w-3 h-3 fill-current" />
                                        High {pick.strength} Potential
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800">The "{pick.recommendation.label}" Path</h3>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{pick.reason}</p>
                                </div>
                                <div className="shrink-0 w-full md:w-auto">
                                    <BouncyButton
                                        onClick={() => handleRecommendationClick(pick.recommendation.target, pick.imageUrl)}
                                        className="w-full md:px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 whitespace-nowrap hover:bg-indigo-700"
                                    >
                                        {pick.recommendation.cta}
                                    </BouncyButton>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* Footer Quote */}
                <footer className="py-12 text-center">
                    <div className="w-16 h-1 bg-slate-200 mx-auto mb-8 rounded-full" />
                    <p className="text-slate-400 font-bold italic max-w-lg mx-auto leading-relaxed">
                        "Every child is an artist. The problem is how to remain an artist once he grows up." — Pablo Picasso
                    </p>
                </footer>
            </main>

            {/* --- Modals for Interaction --- */}
            <AnimatePresence>
                {/* 1. Simple Image Zoom */}
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="bg-white rounded-[3rem] overflow-hidden max-w-2xl w-full shadow-2xl relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={selectedImage} className="max-w-full max-h-[80vh] object-contain mx-auto" alt="Enlarged" />
                            <div className="p-6 bg-white border-t border-slate-100 text-center">
                                <BouncyButton onClick={() => setSelectedImage(null)}>Back to Report</BouncyButton>
                            </div>
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute top-6 right-6 w-12 h-12 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}

                {/* 2. Masterpiece Detail Viewer */}
                {selectedMasterpiece && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl"
                        onClick={() => setSelectedMasterpiece(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] overflow-hidden max-w-2xl w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="relative aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                                <img
                                    src={selectedMasterpiece.imagePath}
                                    className="w-full h-full object-contain"
                                    alt={selectedMasterpiece.title}
                                />
                                <button
                                    onClick={() => setSelectedMasterpiece(null)}
                                    className="absolute top-6 right-6 w-12 h-12 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                            Master Artwork
                                        </div>
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 leading-none tracking-tight">
                                        {selectedMasterpiece.title}
                                    </h2>
                                    <p className="text-xl font-bold text-purple-600">by {selectedMasterpiece.artist}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Why it connects</p>
                                        <p className="text-slate-700 font-bold leading-relaxed italic">
                                            "{selectedMasterpiece.analysis}"
                                        </p>
                                    </div>
                                    {selectedMasterpiece.biography && (
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                            {selectedMasterpiece.biography}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <BouncyButton
                                        className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100"
                                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedMasterpiece.artist + ' ' + (selectedMasterpiece.title || ''))}`, '_blank')}
                                    >
                                        Learn More Secret
                                    </BouncyButton>
                                    <button
                                        className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-colors"
                                        onClick={() => setSelectedMasterpiece(null)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
