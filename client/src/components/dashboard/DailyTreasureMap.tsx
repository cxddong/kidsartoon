
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Sparkles, Lock, Gift, Check, Map as MapIcon } from 'lucide-react';

interface CheckInStatus {
    streak: number;
    lastCheckInDate: string | null;
    canCheckIn: boolean;
    nextReward: number;
    dayCycle: number;
}

export const DailyTreasureMap: React.FC = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<CheckInStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [showMap, setShowMap] = useState(false); // Can be toggleable or always visible

    const isVip = user?.plan && user.plan !== 'free';

    useEffect(() => {
        if (user) fetchStatus();
    }, [user]);

    const fetchStatus = async () => {
        if (!user) return;
        try {
            const res = await fetch(`/api/checkin/status?userId=${user.uid}`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch check-in status", error);
        }
    };

    const handleClaim = async () => {
        if (!user || !status?.canCheckIn || loading) return;
        setLoading(true);

        try {
            const res = await fetch('/api/checkin/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.uid, isVip })
            });

            if (res.ok) {
                const data = await res.json();
                setClaimed(true);
                // Trigger confetti or sound effect here?
                // User credits update automatically via AuthContext subscription
                fetchStatus(); // Refresh local status
                setTimeout(() => setClaimed(false), 3000); // Reset claim animation state
            }
        } catch (error) {
            console.error("Claim failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (!status) return null;

    // Rewards Map Config
    const REWARDS = [
        { day: 1, base: 2, label: 'Start!' },
        { day: 2, base: 2, label: 'Keep it up' },
        { day: 3, base: 3, label: 'Great!' },
        { day: 4, base: 3, label: 'Halfway' },
        { day: 5, base: 5, label: 'Almost' },
        { day: 6, base: 5, label: 'So close' },
        { day: 7, base: 10, label: 'Jackpot!', icon: '🏆' },
    ];

    return (
        <div className="w-full max-w-lg mx-auto bg-gradient-to-b from-indigo-900/80 to-slate-900/90 rounded-3xl p-6 border border-indigo-500/30 shadow-xl backdrop-blur-sm relative overflow-hidden group">

            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-yellow-400" />
                        Daily Treasure Hunt
                    </h3>
                    <p className="text-xs text-indigo-200">Streak: <span className="text-yellow-400 font-bold">{status.streak} Days</span></p>
                </div>

                {status.canCheckIn ? (
                    <button
                        onClick={handleClaim}
                        disabled={loading}
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-slate-900 font-bold px-6 py-2 rounded-full shadow-lg transform transition-all active:scale-95 flex items-center gap-2 animate-pulse"
                    >
                        {loading ? 'Claiming...' : 'Claim Treasure!'}
                    </button>
                ) : (
                    <div className="bg-white/10 px-4 py-2 rounded-full text-xs font-bold text-green-300 flex items-center gap-2">
                        <Check className="w-4 h-4" /> Claimed Today
                    </div>
                )}
            </div>

            {/* Map Grid */}
            <div className="relative">
                {/* Connecting Line (Dashed) */}
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-white/10 -translate-y-1/2 rounded-full hidden sm:block" />

                <div className="grid grid-cols-7 gap-1 sm:gap-2 relative z-10">
                    {REWARDS.map((r, i) => {
                        const isCurrent = status.dayCycle === r.day; // Assuming dayCycle is 1-based next day? 
                        // Wait, DB returns 'dayCycle' as next reward cycle.
                        // If I checked in today, 'dayCycle' might be tomorrow? 
                        // Actually logic in DB: dayCycle = (streak % 7) + 1. 
                        // If I have streak 0, dayCycle is 1. I haven't checked in.
                        // If I check in, streak becomes 1. dayCycle stays 1? No.
                        // Let's rely on `status.streak`.
                        // If `canCheckIn` is true, current position is `status.streak + 1` (conceptually), or just mapped to `dayCycle`.
                        // Let's simply highlight the day corresponding to `status.dayCycle`.

                        // Wait, if I claimed, streak increased. `dayCycle` recalculates.
                        // To show "Today" as claimed, we need to handle that state.

                        const isConfigDayPast = r.day <= status.streak % 7 && status.streak % 7 !== 0; // Rough logic
                        // Better logic: `status.dayCycle` tells us what the NEXT reward is (or current target).

                        const isActive = r.day === status.dayCycle;
                        const isPast = r.day < status.dayCycle;
                        const isJackpot = r.day === 7;

                        return (
                            <div key={r.day} className="flex flex-col items-center gap-2 group/day">

                                {/* Reward Node */}
                                <div className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all relative",
                                    isActive
                                        ? "bg-gradient-to-br from-yellow-400 to-orange-500 border-white shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-110 z-10"
                                        : isPast
                                            ? "bg-indigo-500/50 border-indigo-400/30 text-indigo-300" // Claimed
                                            : "bg-slate-800 border-white/10 text-slate-500" // Future
                                )}>
                                    {isPast ? <Check className="w-5 h-5" /> : (
                                        <span className={cn("font-bold text-xs sm:text-sm", isActive ? "text-slate-900" : "")}>
                                            {isJackpot ? '🎁' : `+${r.base * (isVip ? 2 : 1)}`}
                                        </span>
                                    )}

                                    {/* VIP Badge Hint */}
                                    {!isVip && isActive && (
                                        <div className="absolute -top-3 -right-3 bg-slate-900 border border-slate-700 rounded-full p-1 shadow-lg" title="VIP gets 2x!">
                                            <div className="bg-yellow-500/20 text-yellow-500 text-[8px] font-bold px-1 rounded flex items-center gap-0.5">
                                                <Lock className="w-2 h-2" /> x2
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Label */}
                                <span className={cn(
                                    "text-[10px] font-medium text-center hidden sm:block",
                                    isActive ? "text-white" : "text-slate-500"
                                )}>
                                    {r.day === 7 ? 'Big Prize' : `Day ${r.day}`}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* VIP Upsell for Non-VIP */}
            {!isVip && (
                <div className="mt-4 bg-slate-800/50 rounded-xl p-2 flex items-center justify-between border border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-500/20 p-1.5 rounded-lg">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                        </div>
                        <div className="text-xs">
                            <span className="text-white font-bold block">Upgrade to VIP</span>
                            <span className="text-slate-400">Get 2x check-in gems daily!</span>
                        </div>
                    </div>
                    <button className="text-[10px] font-bold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-indigo-50 filter drop-shadow">
                        Upgrade
                    </button>
                </div>
            )}
        </div>
    );
};
