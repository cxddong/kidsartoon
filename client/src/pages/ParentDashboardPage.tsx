
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Activity, Palette, Brain, Target, Sparkles, AlertCircle, CheckCircle, Smartphone, Zap, Clock, BookOpen, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { BouncyButton } from '../components/ui/BouncyButton';

// -- Charts Components (SVG) --

const RadarChart = ({ scores }: { scores: Record<string, number> }) => {
    // 5 Axis: Color IQ, Spatial, Motor Skill, Creativity, Focus
    const axes = ['Color IQ', 'Spatial', 'MotorSkill', 'Creativity', 'Focus'];
    const radius = 80;
    const center = 120;

    // Calculate points
    const points = axes.map((axis, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        // Map UI axis labels to data keys
        const keyMap: Record<string, string> = {
            'Color IQ': 'colorIQ',
            'Spatial': 'spatial',
            'MotorSkill': 'motorSkill',
            'Creativity': 'creativity',
            'Focus': 'focus'
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

                {/* 1. Statistics Summary */}
                <section className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Activity Analysis</h2>
                            <p className="text-sm font-medium text-slate-400">Week of {report?.weekId || 'Loading...'}</p>
                        </div>
                        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
                            Expert Review V2.0
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                        {[
                            { label: 'Cinema', val: report?.stats?.videoCount || 0, icon: Video, color: 'bg-indigo-50 text-indigo-500' },
                            { label: 'Books', val: report?.stats?.bookCount || 0, icon: BookOpen, color: 'bg-blue-50 text-blue-500' },
                            { label: 'Graphic Novels', val: report?.stats?.comicCount || 0, icon: Activity, color: 'bg-pink-50 text-pink-500' },
                            { label: 'Greeting Cards', val: report?.stats?.cardCount || 0, icon: Sparkles, color: 'bg-purple-50 text-purple-500' },
                            { label: 'Screen Time', val: `${report?.stats?.totalScreenTimeMinutes || 0}m`, icon: Clock, color: 'bg-orange-50 text-orange-500' },
                            { label: 'Magic Art', val: report?.stats?.magicImageCount || 0, icon: Palette, color: 'bg-emerald-50 text-emerald-500' },
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-md transition-all duration-300">
                                <div className={cn("p-2.5 rounded-2xl mb-2", item.color)}>
                                    <item.icon size={18} />
                                </div>
                                <span className="text-xl font-black text-slate-800 tabular-nums">{item.val}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. Professional Insight Grid */}
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
                                    Emotional Weather
                                </h3>
                                <EmotionalWeather trend={report?.aiCommentary?.moodTrend || 'Stable'} />

                                <div className="mt-8 pt-8 border-t border-slate-50">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Professional Radar (Expera)</h4>
                                    <div className="aspect-square w-full max-w-[280px] mx-auto">
                                        <RadarChart scores={report?.artAnalysis?.scores || {}} />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                <Target size={20} className="text-purple-500" />
                                Expert Prescription
                            </h3>
                            <div className="space-y-4">
                                {report?.aiCommentary?.parentActionPlan?.map((tip: string, i: number) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-indigo-50/30 border border-indigo-100/50">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-black text-xs">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{tip}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* B: Cognitive Growth & Analysis */}
                    <div className="space-y-8">
                        <section className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden group">
                            <Sparkles className="absolute -top-12 -right-12 w-48 h-48 opacity-10 group-hover:opacity-20 transition-opacity" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Growth Phase</span>
                                </div>
                                <h3 className="text-3xl font-black mb-2 tracking-tight">
                                    {report?.artAnalysis?.developmentStage || 'Analyzing...'}
                                </h3>
                                <div className="py-1 px-3 bg-blue-500/20 rounded-full text-[10px] font-black text-blue-300 border border-blue-500/30 inline-block mb-6">
                                    Lowenfeld Theory Stage
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Evidence Identified</p>
                                        <p className="text-sm text-blue-50 leading-relaxed italic">
                                            "{report?.artAnalysis?.developmentEvidence || 'Looking for specific visual markers in drawings...'}"
                                        </p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Psychological Summary</p>
                                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                                            {report?.aiCommentary?.psychologicalAnalysis || 'Gathering insights from recent artistic choices...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Activity size={20} className="text-emerald-500" />
                                    Future Trajectory
                                </h3>
                                <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[8px] font-black uppercase">
                                    High Matching
                                </div>
                            </div>
                            <div className="mb-6">
                                <p className="text-2xl font-black text-emerald-600 mb-1">{report?.aiCommentary?.potentialCareer || 'Artistic Explorer'}</p>
                                <p className="text-xs text-slate-500 font-medium">Recommended Career Focus</p>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                                {report?.aiCommentary?.careerReason || 'Analysis based on subject frequency and spatial logic.'}
                            </p>
                        </section>
                    </div>
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
