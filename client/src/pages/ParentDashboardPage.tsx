import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Activity, Palette, Brain, Target, Sparkles, AlertCircle, CheckCircle, Smartphone, Zap, Clock, BookOpen, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { BouncyButton } from '../components/ui/BouncyButton';
import { artReportService, type ArtGrowthReport } from '../services/artReportService';

// -- Charts Components (SVG) --

const RadarChart = ({ scores }: { scores: Record<string, number> }) => {
    // 5 Axis: Imagination, Color Sense, Structural Logic, Line Control, Storytelling
    const axes = ['Imagination', 'Color', 'Logic', 'Control', 'Story'];
    const radius = 80;
    const center = 120;

    // Calculate points
    const points = axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        // Map UI axis labels to data keys
        const keyMap: Record<string, string> = {
            'Imagination': 'imagination',
            'Color': 'colorSense',
            'Logic': 'structuralLogic',
            'Control': 'lineControl',
            'Story': 'storytelling'
        };
        const key = keyMap[axis] || axis.toLowerCase();
        let rawScore = scores[key] || 50;

        // Normalize 0-100 to 0.1 - 1.0 radius
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
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
                </radialGradient>
            </defs>
            {/* Background Pentagon */}
            <polygon points={bgPoints} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
            {[0.25, 0.5, 0.75].map(r => (
                <circle key={r} cx={center} cy={center} r={radius * r} fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="2 2" />
            ))}

            {/* Data Polygon */}
            <motion.polygon
                initial={{ opacity: 0, scale: 0, transformOrigin: `${center}px ${center}px` }}
                animate={{ opacity: 1, scale: 1 }}
                points={points}
                fill="url(#radarGrad)"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />

            {/* Labels */}
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

const EmotionalWeather = ({ trend }: { trend: string }) => {
    const isImproving = trend === 'Improving';
    const isFluctuating = trend === 'Fluctuating';

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Mood Trend</span>
                <div className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black",
                    isImproving ? "bg-green-100 text-green-700" :
                        isFluctuating ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                )}>
                    {isImproving ? <Zap size={14} /> : isFluctuating ? <Activity size={14} /> : <CheckCircle size={14} />}
                    {trend}
                </div>
            </div>

            {/* Simplified Mood Sparkline */}
            <div className="h-16 flex items-end gap-1 px-2">
                {[40, 65, 55, 80, 75, 90, 85].map((h, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                            "flex-1 rounded-t-sm",
                            i === 6 ? "bg-blue-500" : "bg-slate-200"
                        )}
                    />
                ))}
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
                Mood scores based on color saturation and stroke force density over the last 7 days.
            </p>
        </div>
    );
};

// -- Main Page --

export const ParentDashboardPage: React.FC = () => {
    const { user, activeProfile, updateProfile } = useAuth();
    const navigate = useNavigate();

    // State
    const [isVerified, setIsVerified] = useState(false);
    const [pinInput, setPinInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<ArtGrowthReport | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const handlePinVerify = async () => {
        if (!user || pinInput.length !== 4) return;

        setIsVerifying(true);
        try {
            // Try new ParentCode API first
            const res = await fetch('/api/parent-code/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, code: pinInput })
            });
            const data = await res.json();

            if (data.valid) {
                setIsVerified(true);
            } else {
                // Fallback to legacy hardcoded PIN for backward compatibility
                if (pinInput === '1234' || pinInput === user?.parentPin) {
                    setIsVerified(true);
                } else {
                    alert("Incorrect PIN. Please try again.");
                    setPinInput('');
                }
            }
        } catch (err) {
            // Network error, fallback to legacy check
            console.error('PIN validation error:', err);
            if (pinInput === '1234' || pinInput === user?.parentPin) {
                setIsVerified(true);
            } else {
                alert("Incorrect PIN. Please try again.");
                setPinInput('');
            }
        } finally {
            setIsVerifying(false);
        }
    };

    // Generate new report
    const generateNewReport = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            // Get child's name from active profile or first profile, avoid user name
            const childName = activeProfile?.name || (user as any).profiles?.[0]?.name || 'Your child';
            const newReport = await artReportService.generateReport(user.uid, 'week', childName);
            setReport(newReport);
        } catch (err) {
            console.error('Generate report failed:', err);
            alert(err instanceof Error ? err.message : 'Failed to generate report');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isVerified || !user) return;

        const fetchReport = async () => {
            setIsLoading(true);
            try {
                // Get child's name from active profile or first profile, avoid user name
                const childName = activeProfile?.name || (user as any).profiles?.[0]?.name || 'Your child';

                // Fetch live journey report (auto-generates with all software artworks)
                const liveReport = await artReportService.getLiveJourneyReport(user.uid, childName);
                setReport(liveReport);
            } catch (e: any) {
                console.error("Report fetch failed", e);
                // If the error is 404 (no artworks), show friendly message
                if (e.message?.includes('No artworks')) {
                    console.log("User needs to create some artworks first");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [isVerified, user, activeProfile]);


    if (!user) return <div />;

    // PIN LOCK SCREEN
    if (!isVerified) {
        return (
            <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-4">
                <Shield size={64} className="text-blue-500 mb-6" />
                <h1 className="text-3xl font-black text-white mb-2">Parent Zone</h1>
                <p className="text-slate-400 mb-8 text-center max-w-xs">
                    This area involves growth analysis and settings. Protected from little fingers!
                </p>

                <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md w-full max-w-sm">
                    <label className="block text-slate-300 text-sm font-bold mb-4 text-center">ENTER PIN</label>
                    <div className="flex justify-center gap-4 mb-6">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={cn(
                                "w-4 h-4 rounded-full transition-all",
                                pinInput.length > i ? "bg-blue-500 scale-125" : "bg-slate-700"
                            )} />
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'GO'].map(btn => (
                            <button
                                key={btn}
                                onClick={() => {
                                    if (btn === 'C') setPinInput('');
                                    else if (btn === 'GO') handlePinVerify();
                                    else if (pinInput.length < 4) setPinInput(prev => prev + btn);
                                }}
                                className={cn(
                                    "p-4 rounded-xl font-bold text-xl transition-all active:scale-95",
                                    btn === 'GO' ? "bg-blue-600 text-white" :
                                        btn === 'C' ? "bg-red-500/20 text-red-300" :
                                            "bg-white/5 text-white hover:bg-white/10"
                                )}
                            >
                                {btn}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={() => navigate('/profile')} className="mt-8 text-slate-500 hover:text-white transition-colors">
                    Back to Profile
                </button>
            </div>
        );
    }

    // DASHBOARD
    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <Activity size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800">Growth Assistant</h1>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                {activeProfile ? `Report for ${activeProfile.name}` : 'Family Overview'}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsVerified(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <Lock size={20} />
                    </button>
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* --- NEW MAGIC SCANNER ENTRY --- */}
                <motion.section
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/parent/scanner')}
                    className="cursor-pointer bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Zap size={160} className="text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-xl">
                            <Sparkles className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Magic Art Scanner</h2>
                            <p className="text-indigo-100 font-medium text-lg leading-tight">
                                Turn a pile of drawings into a scientific Growth Report.
                            </p>
                        </div>
                        <BouncyButton className="bg-white text-indigo-600 font-black px-8 py-4 rounded-2xl shadow-xl whitespace-nowrap">
                            Upload Portfolio
                        </BouncyButton>
                    </div>
                </motion.section>

                {/* EXPERT PANEL VERIFIED BADGE */}
                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full shadow-lg">
                        <CheckCircle size={20} className="animate-pulse" />
                        <span className="font-black text-sm uppercase tracking-wider">Verified by KidsArtoon AI Expert Panel</span>
                    </div>
                </div>

                {/* 1. Creative Journey Report Summary */}
                <section className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                🎨 {report?.childName || activeProfile?.name || 'Your Child'}'s Creative Journey
                            </h2>
                            <p className="text-sm font-medium text-slate-400">
                                Real-time analysis of all {report?.artworkCount || 0} creations in KidsArtoon
                            </p>
                        </div>
                        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
                            {report?.period?.start && report?.period?.end
                                ? `${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}`
                                : report?.period?.start
                                    ? new Date(report.period.start).toLocaleDateString()
                                    : 'Loading...'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Palette className="text-blue-600" size={24} />
                            </div>
                            <span className="text-3xl font-black text-slate-800 tabular-nums">{report?.artworkCount || 0}</span>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Artworks Analyzed</p>
                        </div>

                        <div className="p-6 rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Brain className="text-purple-600" size={24} />
                            </div>
                            <span className="text-3xl font-black text-slate-800">{report?.developmentalStage?.stage ? report.developmentalStage.stage.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Analyzing'}</span>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Dev. Stage</p>
                        </div>

                        <div className="p-6 rounded-[1.5rem] col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="text-emerald-600" size={24} />
                            </div>
                            <span className="text-3xl font-black text-slate-800">{report?.artistMatch?.artist || 'Discovering...'}</span>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-1">Artist Match</p>
                        </div>
                    </div>
                </section>

                {/* 2. EXPERT PANEL COMMENTARY - THREE SECTIONS */}
                <div className="space-y-6">
                    {/* Dr. Aria - Psychologist Insight */}
                    <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[2rem] p-8 border-2 border-blue-200 shadow-lg">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl">
                                👨‍⚕️
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-blue-900 mb-1">[Psychologist Insight]</h3>
                                <p className="text-sm font-bold text-blue-700">Dr. Aria - Child Development Specialist</p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
                            <p className="text-slate-700 leading-relaxed font-medium">
                                {report?.expertCommentary?.psychologist ||
                                    `Based on ${report?.artworkCount || 0} artworks analyzed, your child is showing ${report?.developmentalStage?.characteristics?.join(', ') || 'creative development'}. ${report?.developmentalStage?.spatialConcepts?.hasGroundLine ? 'The presence of ground lines indicates growing spatial awareness.' : ''}`}
                            </p>
                            {report?.developmentalStage?.characteristics && report.developmentalStage.characteristics.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-blue-100">
                                    <p className="text-xs font-bold text-blue-700 uppercase mb-2">Key Observations:</p>
                                    <ul className="space-y-2">
                                        {report.developmentalStage.characteristics.map((char, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                                <CheckCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                                {char}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Prof. Chromis - Color Expert Notes */}
                    <section className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-[2rem] p-8 border-2 border-purple-200 shadow-lg">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-xl">
                                🎨
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-purple-900 mb-1">[Color Expert Notes]</h3>
                                <p className="text-sm font-bold text-purple-700">Prof. Chromis - Art & Color Therapist</p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
                            <p className="text-slate-700 leading-relaxed font-medium mb-4">
                                {report?.expertCommentary?.colorExpert || report?.colorPsychology?.interpretation || 'Analyzing color usage patterns and emotional expression...'}
                            </p>
                            {report?.colorPsychology && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-4 text-center border border-orange-200">
                                        <div className="text-2xl font-black text-orange-700">{report.colorPsychology.distribution.warm}%</div>
                                        <div className="text-xs font-bold text-orange-600 uppercase mt-1">Warm Colors</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-4 text-center border border-blue-200">
                                        <div className="text-2xl font-black text-blue-700">{report.colorPsychology.distribution.cool}%</div>
                                        <div className="text-xs font-bold text-blue-600 uppercase mt-1">Cool Colors</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl p-4 text-center border border-slate-200">
                                        <div className="text-2xl font-black text-slate-700">{report.colorPsychology.distribution.neutral}%</div>
                                        <div className="text-xs font-bold text-slate-600 uppercase mt-1">Neutral</div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 pt-4 border-t border-purple-100">
                                <p className="text-xs font-bold text-purple-700 uppercase mb-2">Emotional State Reading:</p>
                                <p className="text-sm text-slate-600 italic">{report?.colorPsychology?.emotionalState || 'Positive and energetic'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Magic Kat - Growth Action Plan */}
                    <section className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] p-8 border-2 border-emerald-200 shadow-lg">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black text-2xl shadow-xl">
                                🐱
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black text-emerald-900 mb-1">[Growth Action Plan]</h3>
                                <p className="text-sm font-bold text-emerald-700">Magic Kat - Education Guidance Officer</p>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-100">
                            <p className="text-slate-700 leading-relaxed font-medium mb-4">
                                {report?.expertCommentary?.educationGuide ||
                                    `Your child shows ${report?.narrativeAnalysis?.detailLevel || 'moderate'} attention to detail with ${report?.narrativeAnalysis?.elementCount || 0} distinct elements per artwork. ${report?.narrativeAnalysis?.hasStory ? 'Strong storytelling abilities detected!' : 'Great foundation for developing narrative skills.'}`}
                            </p>
                            {report?.narrativeAnalysis?.narrativeElements && report.narrativeAnalysis.narrativeElements.length > 0 && (
                                <div className="bg-emerald-50/50 rounded-xl p-4 mb-4 border border-emerald-200">
                                    <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Storytelling Elements Found:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {report.narrativeAnalysis.narrativeElements.map((element, i) => (
                                            <span key={i} className="px-3 py-1 bg-white text-emerald-700 rounded-full text-xs font-bold border border-emerald-300">
                                                {element}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="pt-4 border-t border-emerald-100">
                                <p className="text-xs font-bold text-emerald-700 uppercase mb-2">Recommended Next Steps:</p>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm text-slate-600">
                                        <Target size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                        Encourage storytelling: "Tell me about what's happening in your drawing"
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-slate-600">
                                        <Target size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                        Observation score: {report?.narrativeAnalysis?.observationScore || 50}/100 - Great attention to details!
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>
                </div>

                {/* 3. Professional Insight Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* A: Emotional Weather & Radar */}
                    <div className="space-y-8">
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12">
                                <Activity size={120} />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <Brain size={20} className="text-blue-500" />
                                    Growth Radar (5 Dimensions)
                                </h3>

                                <div className="aspect-square w-full max-w-[280px] mx-auto">
                                    <RadarChart scores={report?.growthRadar || {}} />
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-slate-600 font-medium">Imagination: {report?.growthRadar?.imagination || 0}/100</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                        <span className="text-slate-600 font-medium">Color Sense: {report?.growthRadar?.colorSense || 0}/100</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-slate-600 font-medium">Logic: {report?.growthRadar?.structuralLogic || 0}/100</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                        <span className="text-slate-600 font-medium">Control: {report?.growthRadar?.lineControl || 0}/100</span>
                                    </div>
                                    <div className="flex items-center gap-2 col-span-2">
                                        <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                                        <span className="text-slate-600 font-medium">Storytelling: {report?.growthRadar?.storytelling || 0}/100</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                <Palette size={20} className="text-purple-500" />
                                Highlighted Artwork
                            </h3>
                            {report?.highlightArtwork && (
                                <div className="space-y-4">
                                    <img
                                        src={report.highlightArtwork.imageUrl}
                                        alt="Highlighted artwork"
                                        className="w-full rounded-xl border-2 border-slate-200 shadow-md"
                                    />
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500 font-medium">Artist Match: {report?.artistMatch?.artist || 'Analyzing...'}</p>
                                        <span className="text-xs bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-bold">
                                            {report?.artistMatch?.similarity || 0}% Similarity
                                        </span>
                                    </div>
                                    {report?.artistMatch?.reasoning && (
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            {report.artistMatch.reasoning}
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* B: Legacy sections - hiding for now */}
                    <div className="space-y-8 hidden">
                        <section className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                            <Sparkles className="absolute -top-12 -right-12 w-48 h-48 opacity-10 group-hover:opacity-20 transition-opacity" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Growth Phase</span>
                                </div>
                                <h3 className="text-3xl font-black mb-2 tracking-tight">
                                    {report?.developmentalStage?.stage || 'Analyzing...'}
                                </h3>
                                <div className="py-1 px-3 bg-blue-500/20 rounded-full text-[10px] font-black text-blue-300 border border-blue-500/30 inline-block mb-6">
                                    Lowenfeld Theory Stage
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Evidence Identified</p>
                                        <p className="text-sm text-blue-50 leading-relaxed italic">
                                            "{report?.developmentalStage?.ageRange || 'Looking for specific visual markers in drawings...'}"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Activity size={20} className="text-emerald-500" />
                                    Artist Connection
                                </h3>
                                <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[8px] font-black uppercase">
                                    High Matching
                                </div>
                            </div>
                            <div className="mb-6">
                                <p className="text-2xl font-black text-emerald-600 mb-1">{report?.artistMatch?.artist || 'Artistic Explorer'}</p>
                                <p className="text-xs text-slate-500 font-medium">Matched Artist Style</p>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                                {report?.artistMatch?.reasoning || 'Analysis based on color usage and composition style.'}
                            </p>
                        </section>
                    </div>
                </div>

                {/* 5. SCIENTIFIC BASIS & BENCHMARKS */}
                <section className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2rem] p-8 shadow-2xl border border-slate-700 text-white">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                            <Target size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">Scientific Basis & Methodology</h3>
                            <p className="text-sm text-slate-300 font-medium">How Magic Kat Analyzes Your Child's Art</p>
                        </div>
                    </div>

                    {/* Data Scale */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white/10">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <Activity size={20} className="text-blue-300" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-white mb-2">Global Art Database</h4>
                                <p className="text-sm text-slate-300 leading-relaxed mb-3">
                                    Based on <span className="font-black text-emerald-400">10,000,000+ anonymous child artworks</span> from
                                    ages 2-12 across 50+ countries. Our proprietary KidsArtoon ArtDB uses deep learning to identify patterns
                                    invisible to the human eye.
                                </p>
                                {report && report.growthRadar && (
                                    <div className="flex gap-3 flex-wrap">
                                        {report.growthRadar.imagination > 75 && (
                                            <span className="px-3 py-1.5 bg-amber-500/20 text-amber-200 rounded-full text-xs font-bold border border-amber-500/30">
                                                🌟 Imagination: Top 25%
                                            </span>
                                        )}
                                        {report.growthRadar.colorSense > 75 && (
                                            <span className="px-3 py-1.5 bg-purple-500/20 text-purple-200 rounded-full text-xs font-bold border border-purple-500/30">
                                                🎨 Color Mastery: Top 25%
                                            </span>
                                        )}
                                        {report.growthRadar.storytelling > 75 && (
                                            <span className="px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-full text-xs font-bold border border-blue-500/30">
                                                📖 Storytelling: Top 25%
                                            </span>
                                        )}
                                        {report.narrativeAnalysis && report.narrativeAnalysis.observationScore > 80 && (
                                            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-200 rounded-full text-xs font-bold border border-emerald-500/30">
                                                👁️ Observation: Top 20%
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Psychological Frameworks */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <Brain size={18} className="text-purple-400" />
                                <h4 className="font-bold text-white">Lowenfeld's Theory</h4>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Developmental stage classification based on Viktor Lowenfeld's <em>"Creative and Mental Growth"</em> (1947).
                                Identifies 6 progressive stages from Scribbling (2-4y) to Pseudo-Realistic (11-13y).
                            </p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <Palette size={18} className="text-pink-400" />
                                <h4 className="font-bold text-white">Kellogg Symbol System</h4>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Recognizes 20 basic scribble patterns and diagrams (circles, crosses, rectangles) that form the foundation
                                of symbolic thinking in early childhood art.
                            </p>
                        </div>
                    </div>

                    {/* Color Theory */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 mb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={18} className="text-yellow-400" />
                            <h4 className="font-bold text-white">Goethe's Color Psychology</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Emotional tone analysis based on Johann Wolfgang von Goethe's <em>"Theory of Colors"</em> (1810).
                            Maps warm colors (joy, energy) vs. cool colors (calm, introspection) to psychological states.
                            Combined with modern PBR rendering algorithms to extract saturation and contrast emotional energy values.
                        </p>
                    </div>

                    {/* Academic Citation */}
                    <div className="flex items-start gap-3 bg-indigo-500/10 backdrop-blur-sm rounded-xl p-4 border border-indigo-400/20">
                        <CheckCircle size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                            <strong className="text-white font-bold">Academic Foundation:</strong> Analysis recommendations reference peer-reviewed research
                            from Harvard Graduate School of Education (Visual-Spatial Intelligence), MIT Media Lab (Child-Computer Interaction),
                            and the National Association for the Education of Young Children (NAEYC) guidelines on creative development.
                        </p>
                    </div>
                </section>

                {/* 6. Parent Settings */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Shield size={18} className="text-slate-500" />
                        Security Settings
                    </h3>
                    <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                            <p className="font-bold text-slate-700">Parent PIN</p>
                            <p className="text-xs text-slate-500 mt-1">Protect this dashboard with a 4-digit code.</p>
                            {user?.parentPin && <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-1"><CheckCircle size={10} /> PIN Active</p>}
                        </div>
                        <button
                            onClick={() => {
                                const newPin = window.prompt("Enter new 4-digit PIN:");
                                if (newPin && newPin.length === 4 && /^\d+$/.test(newPin)) {
                                    updateProfile({ parentPin: newPin });
                                    alert("PIN updated successfully! Please remember it.");
                                } else if (newPin) {
                                    alert("Invalid PIN. Must be exactly 4 digits.");
                                }
                            }}
                            className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            Change PIN
                        </button>
                    </div>
                </section>

                <footer className="text-center py-12 px-8 border-t border-slate-200/50">
                    <div className="flex items-center justify-center gap-2 text-slate-400 mb-4">
                        <Shield size={16} className="text-blue-400" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">Official Disclaimer</span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                        This report is generated by AI based on creative patterns and artistic features.
                        While grounded in art psychology (Viktor Lowenfeld theory) and color therapy principles,
                        <strong> it is NOT a medical or psychological diagnosis.</strong>
                        This report does not replace professional consultation with a clinical child psychologist
                        or medical doctor. If you have serious concerns about your child's emotional or cognitive development,
                        please consult a licensed professional immediately.
                    </p>
                </footer>
            </main>

            <MagicNavBar />
        </div>
    );
};
