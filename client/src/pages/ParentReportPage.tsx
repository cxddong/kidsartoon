import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, BookOpen, Image, Palette, TrendingUp, Clock, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export const ParentReportPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Fetch user activity stats
        fetch(`/api/media/history?userId=${user.uid}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Calculate stats
                    const statsByType = {
                        videos: data.filter(item => item.type === 'animation').length,
                        stories: data.filter(item => item.type === 'story' || item.type === 'picturebook').length,
                        comics: data.filter(item => item.type === 'comic' || item.type === 'graphic-novel').length,
                        art: data.filter(item => item.type === 'generated' || item.type === 'jump_into_art').length,
                        total: data.length
                    };
                    setStats(statsByType);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load stats:', err);
                setLoading(false);
            });
    }, [user]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-8">
                <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all mb-6"
                >
                    <ArrowLeft size={20} />
                    <span className="font-bold">Back to Profile</span>
                </button>

                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-800 mb-2">📊 Progress Report</h1>
                    <p className="text-slate-600">Track your child's creative journey</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="max-w-4xl mx-auto">
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : stats ? (
                    <>
                        {/* Total Creations */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 text-white mb-6 shadow-xl"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 font-bold mb-1">Total Creations</p>
                                    <h2 className="text-6xl font-black">{stats.total}</h2>
                                </div>
                                <Star size={80} className="opacity-20" />
                            </div>
                        </motion.div>

                        {/* Breakdown by Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <StatCard
                                icon={<Video size={32} />}
                                title="Magic Cinema"
                                count={stats.videos}
                                color="from-blue-500 to-cyan-500"
                            />
                            <StatCard
                                icon={<BookOpen size={32} />}
                                title="Stories & Books"
                                count={stats.stories}
                                color="from-green-500 to-emerald-500"
                            />
                            <StatCard
                                icon={<Image size={32} />}
                                title="Comics"
                                count={stats.comics}
                                color="from-orange-500 to-red-500"
                            />
                            <StatCard
                                icon={<Palette size={32} />}
                                title="Art Studio"
                                count={stats.art}
                                color="from-purple-500 to-pink-500"
                            />
                        </div>

                        {/* Encouragement Message */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 bg-white rounded-3xl p-6 shadow-lg text-center"
                        >
                            <h3 className="text-2xl font-black text-slate-800 mb-2">🎉 Keep Creating!</h3>
                            <p className="text-slate-600">
                                {stats.total === 0
                                    ? "Start your creative journey today!"
                                    : stats.total < 10
                                        ? "You're off to a great start!"
                                        : stats.total < 50
                                            ? "Amazing progress! Keep exploring your creativity!"
                                            : "Wow! You're a creative superstar! 🌟"}
                            </p>
                        </motion.div>
                    </>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-500 text-lg">No activity data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon, title, count, color }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className={`bg-gradient-to-r ${color} rounded-2xl p-6 text-white shadow-lg`}
    >
        <div className="flex items-center gap-4 mb-2">
            <div className="opacity-80">{icon}</div>
            <div>
                <p className="text-white/80 text-sm font-bold">{title}</p>
                <h3 className="text-4xl font-black">{count}</h3>
            </div>
        </div>
    </motion.div>
);
