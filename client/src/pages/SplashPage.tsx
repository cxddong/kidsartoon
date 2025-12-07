import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Play, BookOpen, Mic, Star, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { CoCreateModal } from '../components/CoCreateModal';

// Mock Data for Feed (Expanded for Grid Demo)
const FEED_ITEMS = [
    { id: 1, type: 'picture-book', title: 'The Brave Little Toaster', author: 'Timmy (8)', likes: 124, cover: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=80', color: 'bg-accent-purple' },
    { id: 2, type: 'audio-story', title: 'My Dog Goes to Space', author: 'Sarah (6)', likes: 89, cover: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&q=80', color: 'bg-secondary' },
    { id: 3, type: 'animation', title: 'Dancing Robot', author: 'Alex (10)', likes: 256, cover: 'https://images.unsplash.com/photo-1535378437327-b7128d8e1d17?w=400&q=80', color: 'bg-primary' },
    { id: 4, type: 'picture-book', title: 'Magic Forest', author: 'Lily (7)', likes: 45, cover: 'https://images.unsplash.com/photo-1448375240586-dfd8f3793300?w=400&q=80', color: 'bg-green-500' },
    { id: 5, type: 'animation', title: 'Ocean Friends', author: 'Noah (9)', likes: 167, cover: 'https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=400&q=80', color: 'bg-blue-500' },
    { id: 6, type: 'audio-story', title: 'The Lost Bear', author: 'Emma (5)', likes: 23, cover: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80', color: 'bg-orange-500' },
    { id: 7, type: 'picture-book', title: 'Super Cat', author: 'Ben (8)', likes: 88, cover: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80', color: 'bg-red-500' },
    { id: 8, type: 'animation', title: 'Flying Car', author: 'Lucas (11)', likes: 312, cover: 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=400&q=80', color: 'bg-indigo-500' },
];

const ANNOUNCEMENTS = [
    { id: 1, title: "Draw Your Dream House!", subtitle: "Win 500 points", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80", color: "from-primary to-purple-500" },
    { id: 2, title: "Space Adventure Contest", subtitle: "Join the galaxy", image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80", color: "from-blue-500 to-cyan-500" },
    { id: 3, title: "New Sticker Pack", subtitle: "Available now", image: "https://images.unsplash.com/photo-1535378437327-b7128d8e1d17?w=800&q=80", color: "from-orange-500 to-red-500" },
];

export const SplashPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedWork, setSelectedWork] = React.useState<any>(null);
    const [currentSlide, setCurrentSlide] = React.useState(0);

    const { user } = useAuth(); // Add useAuth

    React.useEffect(() => {
        if (user) {
            navigate('/home');
        }
    }, [user, navigate]);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % ANNOUNCEMENTS.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen pb-24 flex justify-center relative">
            {/* Fixed Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/home_bg.jpg')" }}
            />
            {/* Overlay for readability */}
            <div className="fixed inset-0 bg-white/30 pointer-events-none" />

            {/* Main Content Container - Pad Size Adaptation */}
            <div className="w-full max-w-screen-lg bg-white/50 backdrop-blur-sm min-h-screen shadow-2xl relative">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 w-full">
                    <img
                        src="/top_banner_v2.png"
                        alt="KidsArToon"
                        className="w-full h-auto object-cover"
                    />

                    <div className="absolute top-4 right-4 flex items-center gap-3">
                        <button onClick={() => navigate('/profile')} className="p-2 bg-white/50 backdrop-blur-sm hover:bg-white/80 rounded-full transition-colors shadow-sm">
                            <User className="w-6 h-6 text-slate-700" />
                        </button>
                    </div>
                </header>

                <div className="p-4 space-y-6">
                    {/* Announcement Carousel */}
                    <div className="relative w-full aspect-[4/1] rounded-2xl overflow-hidden shadow-md">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0"
                        >
                            {/* Background Image */}
                            <img
                                src={ANNOUNCEMENTS[currentSlide].image}
                                alt={ANNOUNCEMENTS[currentSlide].title}
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient Overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${ANNOUNCEMENTS[currentSlide].color} opacity-80 mix-blend-multiply`} />
                            <div className="absolute inset-0 bg-black/20" />

                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white z-10">
                                <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] font-bold mb-2 w-fit">
                                    News
                                </span>
                                <h2 className="text-2xl font-bold mb-1">{ANNOUNCEMENTS[currentSlide].title}</h2>
                                <p className="text-white/90 text-sm">{ANNOUNCEMENTS[currentSlide].subtitle}</p>
                            </div>
                        </motion.div>

                        {/* Pagination Dots */}
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
                            {ANNOUNCEMENTS.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${currentSlide === index ? "bg-white w-4" : "bg-white/50"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Community Feed (Waterfall Grid) */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-800">Community Gallery</h3>
                            <button onClick={() => alert('Community Gallery is coming soon!')} className="text-primary text-xs font-bold">View All</button>
                        </div>

                        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2 space-y-2">
                            {FEED_ITEMS.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="break-inside-avoid bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 group"
                                >
                                    <div className="relative">
                                        <img src={item.cover} alt={item.title} className="w-full h-auto object-cover" />
                                        <div className="absolute top-1 left-1">
                                            <TypeBadge type={item.type} minimal />
                                        </div>
                                    </div>

                                    <div className="p-2">
                                        <h4 className="font-bold text-slate-800 text-[10px] truncate">{item.title}</h4>
                                        <div className="flex justify-between items-center mt-1">
                                            <p className="text-[10px] text-slate-500 truncate max-w-[60px]">{item.author}</p>
                                            <div className="flex items-center gap-0.5 text-slate-400">
                                                <Heart className="w-3 h-3" />
                                                <span className="text-[10px] font-medium">{item.likes}</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                <CoCreateModal
                    isOpen={!!selectedWork}
                    onClose={() => setSelectedWork(null)}
                    sourceWork={selectedWork}
                />
            </div>
        </div>
    );
};

const TypeBadge = ({ type, minimal = false }: { type: string, minimal?: boolean }) => {
    const config = {
        'picture-book': { icon: BookOpen, label: 'Story', color: 'bg-accent-purple' },
        'audio-story': { icon: Mic, label: 'Audio', color: 'bg-secondary' },
        'animation': { icon: Play, label: 'Video', color: 'bg-primary' }
    }[type] || { icon: Star, label: 'Work', color: 'bg-slate-500' };

    const Icon = config.icon;

    if (minimal) {
        return (
            <div className={cn("flex items-center justify-center w-5 h-5 rounded-full text-white shadow-sm", config.color)}>
                <Icon className="w-3 h-3" />
            </div>
        );
    }

    return (
        <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-bold shadow-sm", config.color)}>
            <Icon className="w-3 h-3" />
            <span>{config.label}</span>
        </div>
    );
};
