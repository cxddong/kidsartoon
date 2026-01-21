
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Activity, Palette, Brain, Target, Sparkles, AlertCircle, CheckCircle, Smartphone, Zap, Clock, BookOpen, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { MagicNavBar } from '../components/ui/MagicNavBar';

// -- Charts Components (SVG) --

const RadarChart = ({ scores }: { scores: Record<string, number> }) => {
    // 5 Axis: Composition, Color, Imagination, Line, Story
    // Scores 0-10
    const axes = ['Composition', 'Color', 'Imagination', 'Line', 'Story'];
    const radius = 80;
    const center = 120; // Shift center to allow more padding

    // Calculate points
    const points = axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const key = axis.toLowerCase();
        let rawScore = scores[key] || 5;
        // Auto-normalize 0-100 scale to 0-10
        if (rawScore > 10) rawScore = rawScore / 10;

        const score = Math.min(rawScore / 10, 1); // Clamp to max 1.0 (radius)
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
        <svg viewBox="0 0 240 240" className="w-full h-full">
            {/* Background Pentagon */}
            <polygon points={bgPoints} fill="none" stroke="#e2e8f0" strokeWidth="1" />
            <circle cx={center} cy={center} r={radius * 0.5} fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />

            {/* Data Polygon */}
            <motion.polygon
                initial={{ opacity: 0, scale: 0, transformOrigin: `${center}px ${center}px` }}
                animate={{ opacity: 0.6, scale: 1 }}
                points={points}
                fill="#8b5cf6"
                stroke="#6d28d9"
                strokeWidth="2"
            />

            {/* Labels */}
            {axes.map((axis, i) => {
                const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
                const x = center + Math.cos(angle) * (radius + 25);
                const y = center + Math.sin(angle) * (radius + 25);
                return (
                    <text key={axis} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-slate-500 font-bold uppercase tracking-wider">
                        {axis}
                    </text>
                );
            })}
        </svg>
    );
};

// -- Color Logic --
const COLOR_MEANINGS: Record<string, string> = {
    'red': 'Energy, Passion, Confidence',
    '#ff0000': 'Energy, Passion',
    'blue': 'Calm, Logic, Trust',
    '#0000ff': 'Calm, Focus',
    'yellow': 'Happiness, Optimism',
    'green': 'Growth, Harmony, Nature',
    'purple': 'Imagination, Mystery',
    'orange': 'Creativity, Enthusiasm',
    'pink': 'Love, Playfulness',
    'black': 'Strength, Authority',
    'white': 'Purity, New Beginnings'
};

const ColorPie = ({ colors }: { colors: string[] }) => {
    // Determine colors or fallback
    const validColors = colors.length > 0 ? colors : ['#ef4444', '#f59e0b', '#3b82f6'];
    const total = validColors.length;

    // Helper to find closest meaning (very basic string match for MVP)
    const getMeaning = (c: string) => {
        // Try direct key match
        if (COLOR_MEANINGS[c]) return COLOR_MEANINGS[c];
        // Try basic color names check
        if (c.toLowerCase().includes('red')) return COLOR_MEANINGS['red'];
        if (c.toLowerCase().includes('blue')) return COLOR_MEANINGS['blue'];
        // Default
        return 'Unique Expression';
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex gap-1 h-8 w-full rounded-full overflow-hidden shadow-inner">
                {validColors.map((c, i) => (
                    <motion.div
                        key={i}
                        initial={{ width: 0 }}
                        animate={{ width: `${100 / total}%` }}
                        className="h-full"
                        style={{ backgroundColor: c }}
                        transition={{ delay: i * 0.1 }}
                    />
                ))}
            </div>

            <div className="w-full space-y-3">
                {validColors.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full shadow-sm" style={{ backgroundColor: c }} />
                            <span className="font-bold text-slate-700 capitalize">{c}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-500">{getMeaning(c)}</span>
                    </div>
                ))}
            </div>
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
    const [report, setReport] = useState<any>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Premium access state
    const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
    const [reportCost, setReportCost] = useState(60);
    const [hasEnoughPoints, setHasEnoughPoints] = useState(false);
    const [currentPoints, setCurrentPoints] = useState(0);
    const [isFirstTimeFree, setIsFirstTimeFree] = useState(false);

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

    // Check report access status
    const checkReportAccess = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/reports/check-cost?userId=${user.uid}`);
            const data = await res.json();

            if (data.needsPayment) {
                setShowPremiumPrompt(true);
                setReportCost(data.cost);
                setCurrentPoints(data.currentPoints);
                setHasEnoughPoints(data.hasEnough);
            } else if (data.isFirstTime) {
                setIsFirstTimeFree(true);
                setShowPremiumPrompt(true); // Re-use prompt but change content
                setReportCost(0);
                setHasEnoughPoints(true);
            } else {
                // Free access (VIP or already generated)
                // Report will load automatically via useEffect
            }
        } catch (err) {
            console.error('Check cost failed:', err);
            // Fallback: will load via useEffect
        } finally {
            setIsLoading(false);
        }
    };

    // Generate new report
    const generateReport = async () => {
        if (!user) return;

        setIsLoading(true);
        try {
            const res = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.uid,
                    childProfileId: activeProfile?.id,
                    childName: activeProfile?.name || user.name
                })
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.message || 'Failed to generate report');
                return;
            }

            const data = await res.json();
            setReport(data.report);
            setShowPremiumPrompt(false);
        } catch (err) {
            console.error('Generate report failed:', err);
            alert('Failed to generate report');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isVerified || !user) return;

        const fetchReport = async () => {
            setIsLoading(true);
            try {
                // Try to get latest
                const res = await fetch(`/api/reports/latest?userId=${user.uid}${activeProfile ? `&childProfileId=${activeProfile.id}` : ''}`);
                if (res.ok) {
                    const data = await res.json();
                    setReport(data);
                } else {
                    // Generate new if missing
                    const genRes = await fetch('/api/reports/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: user.uid,
                            childProfileId: activeProfile?.id,
                            childName: activeProfile?.name || user.name
                        })
                    });
                    const genData = await genRes.json();
                    setReport(genData.report);
                }
            } catch (e) {
                console.error("Report fetch failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [isVerified, user, activeProfile]);


    if (!user) return <div />;

    // PREMIUM UNLOCK MODAL
    if (showPremiumPrompt) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
                    <h3 className="text-2xl font-black mb-4">🧠 Unlock Scientific Analysis</h3>
                    <p className="text-slate-600 mb-6">
                        Get a professional growth report with:
                        <br />• Color Psychology Analysis
                        <br />• Career Talent Spotting
                        <br />• Personalized Parenting Tips
                    </p>

                    <div className={cn("rounded-xl p-4 mb-6 border", isFirstTimeFree ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200")}>
                        <p className={cn("text-sm", isFirstTimeFree ? "text-green-800" : "text-amber-900")}>
                            <strong>Cost:</strong> {isFirstTimeFree ? <span className="line-through opacity-50 mr-2">60 Points</span> : `${reportCost} Points`}
                            {isFirstTimeFree && <span className="font-bold text-green-600">FREE (First Time Gift!) 🎁</span>}
                            <br />
                            <strong>Your Balance:</strong> {currentPoints} Points
                        </p>
                    </div>

                    {hasEnoughPoints ? (
                        <button
                            onClick={generateReport}
                            disabled={isLoading}
                            className={cn(
                                "w-full text-white py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50",
                                isFirstTimeFree ? "bg-green-600 hover:bg-green-700" : "bg-amber-600 hover:bg-amber-700"
                            )}
                        >
                            {isLoading ? 'Generating...' : isFirstTimeFree ? 'Claim Free Report' : `Unlock Report (${reportCost} Points)`}
                        </button>
                    ) : (
                        <div>
                            <p className="text-red-600 text-sm mb-3 font-medium">⚠️ Insufficient points</p>
                            <button
                                onClick={() => navigate('/subscription')}
                                className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700"
                            >
                                Get VIP (Unlimited Reports)
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => setShowPremiumPrompt(false)}
                        className="w-full mt-3 text-slate-500 hover:text-slate-700 py-2"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

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

                {/* 1. Overview Cards */}
                {/* 1. Overview Cards (Production Stats) */}
                <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {[
                        { label: 'Magic Cinema', val: report?.stats?.videoCount || 0, icon: Video, color: 'bg-indigo-100 text-indigo-600' },
                        { label: 'Storybooks', val: report?.stats?.bookCount || 0, icon: BookOpen, color: 'bg-blue-100 text-blue-600' },
                        { label: 'Graphic Novels', val: report?.stats?.comicCount || 0, icon: Activity, color: 'bg-pink-100 text-pink-600' },
                        { label: 'Greeting Cards', val: report?.stats?.cardCount || 0, icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
                        { label: 'Puzzles', val: report?.stats?.puzzleCount || 0, icon: Zap, color: 'bg-orange-100 text-orange-600' },
                        { label: 'Magic Art', val: report?.stats?.magicImageCount || 0, icon: Palette, color: 'bg-emerald-100 text-emerald-600' },
                    ].map((item, i) => (
                        <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                            <div className={cn("p-2 rounded-full mb-1", item.color)}>
                                <item.icon size={16} />
                            </div>
                            <span className="text-xl font-black text-slate-800">{item.val}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase leading-tight">{item.label}</span>
                        </div>
                    ))}
                </section>

                {/* 2. Future Potential (Scientific Career Path) */}
                <section className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                    <Sparkles className="absolute top-0 right-0 w-64 h-64 text-white/5 -translate-y-1/2 translate-x-1/4" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6 opacity-80">
                            <div className="flex items-center gap-2">
                                <Target size={18} className="text-indigo-400" />
                                <span className="text-xs font-bold uppercase tracking-widest">AI Career Discovery</span>
                            </div>
                            {report?.aiCommentary?.learningStyle && (
                                <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20">
                                    {report.aiCommentary.learningStyle}
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="h-32 flex items-center justify-center">
                                <span className="animate-pulse">Analyzing patterns...</span>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <h2 className="text-3xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-white">
                                        {report?.aiCommentary?.potentialCareer || 'Creative Explorer'}
                                    </h2>
                                    <p className="text-indigo-200 text-sm leading-relaxed mb-4">
                                        {report?.aiCommentary?.careerReason || "Based on object detection of their recent works."}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {report?.artAnalysis?.topSubjects?.map((sub: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-indigo-500/30 rounded text-[10px] font-bold tracking-wider">
                                                {sub}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <p className="text-xs font-bold text-indigo-300 uppercase mb-2">Growth Advice</p>
                                    <p className="text-white text-sm italic">
                                        "{report?.artAnalysis?.adviceText || report?.aiCommentary?.strength || "Keep exploring!"}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. Creative DNA (Grid) */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Radar Chart */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Brain size={18} className="text-purple-500" />
                            Creative Stats
                        </h3>
                        <div className="flex-1 flex items-center justify-center">
                            <div className="aspect-square w-full max-w-[240px]">
                                {report?.artAnalysis?.radarScores && (
                                    <RadarChart scores={report.artAnalysis.radarScores} />
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Scientific Color Psychology */}
                    <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Palette size={18} className="text-pink-500" />
                            Color Psychology
                        </h3>

                        <div className="mb-6">
                            {report?.artAnalysis?.dominantColors && (
                                <ColorPie colors={report.artAnalysis.dominantColors} />
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Trend</span>
                                <p className="text-slate-800 font-bold">{report?.artAnalysis?.colorTrend || 'Mixed Palette'}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Scientific Interpretation</span>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {report?.artAnalysis?.colorPsychologyText || report?.artAnalysis?.colorAnalysis || "Analysis pending..."}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* 4. Parent Settings */}
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

                {/* Disclaimer */}
                <footer className="text-center py-8 px-4">
                    <div className="flex items-center justify-center gap-2 text-slate-400 mb-2">
                        <AlertCircle size={14} />
                        <span className="text-xs font-bold uppercase">AI Disclaimer</span>
                    </div>
                    <p className="text-[10px] text-slate-400 max-w-lg mx-auto leading-normal">
                        This report is generated by AI based on creative patterns. Each child is unique and has infinite potential.
                        Please use these insights as fun conversation starters rather than professional educational advice.
                    </p>
                </footer>
            </main>

            <MagicNavBar />
        </div>
    );
};
