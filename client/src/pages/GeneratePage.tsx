import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mic, BookOpen, Video, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

// import generateBg from '../assets/generate_bg_slots.jpg';
import iconAudio from '../assets/icon_audio.png';
import iconComic from '../assets/icon_comic.png';
import iconAnimation from '../assets/icon_animation.png';
import iconPictureBook from '../assets/icon_picture_book.png';

const options = [
    {
        id: 'audio-story',
        title: 'Audio Story',
        icon: Mic,
        image: iconAudio,
        color: 'bg-secondary',
        path: '/generate/audio',
        imageScale: 1.75
    },
    {
        id: 'picture-book',
        title: '4-Panel Comic',
        icon: BookOpen,
        image: iconComic,
        color: 'bg-accent-purple',
        path: '/generate/comic',
        state: { mode: 'comic' },
        imageScale: 1.6
    },
    {
        id: 'story-book',
        title: 'Picture Book',
        icon: BookOpen,
        image: iconPictureBook,
        color: 'bg-accent-purple',
        path: '/generate/picture',
        state: { mode: 'book' },
        imageScale: 1.1
    },
    {
        id: 'animation',
        title: 'Animation',
        icon: Video,
        image: iconAnimation,
        color: 'bg-primary',
        path: '/generate/video',
        imageScale: 1.65
    }
];

export const GeneratePage: React.FC = () => {
    const navigate = useNavigate();
    // const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
    // const fileInputRef = React.useRef<HTMLInputElement>(null);

    // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = event.target.files?.[0];
    //     if (file) {
    //         const reader = new FileReader();
    //         reader.onloadend = () => {
    //             setSelectedImage(reader.result as string);
    //         };
    //         reader.readAsDataURL(file);
    //     }
    // };

    const handleNavigation = (path: string, state?: any) => {
        navigate(path, { state });
    };

    return (
        <div className="fixed inset-0 z-40 bg-white flex flex-col overflow-hidden overscroll-none">
            {/* Fixed Background */}
            <div
                className="fixed inset-0 z-0 bg-no-repeat"
                style={{
                    backgroundImage: "url('/generate_bg_final.jpg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            />

            {/* Content Overlay */}
            <div className="flex-1 flex flex-col relative z-10 p-4">
                <header className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    {/* <h1 className="text-2xl font-bold text-white drop-shadow-md">Create Magic</h1> */}
                </header>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">

                    {/* Image Upload - Positioned to the right or center as needed, 
                        but for now keeping it somewhat central but maybe smaller or moved 
                        to avoid blocking the main art if possible. 
                        Given the request focused on buttons, I'll keep it centered for now 
                        but ensure it doesn't overlap the bottom slots. */}
                    <div className="flex justify-center py-4 mt-8">
                        {/* <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-64 aspect-[4/3] bg-white/90 backdrop-blur-sm rounded-3xl border-4 border-pink-200/50 shadow-[0_0_20px_rgba(251,207,232,0.3)] flex flex-col items-center justify-center gap-3 cursor-pointer hover:scale-105 transition-all overflow-hidden relative group"
                        >
                            {selectedImage ? (
                                <img src={selectedImage} alt="Upload" className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                                        <Camera className="w-7 h-7 text-pink-400" />
                                    </div>
                                    <p className="text-slate-500 text-xs font-bold">Tap to upload</p>
                                </>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div> */}
                    </div>

                    {/* Horizontal Action Buttons - Aligned to Bottom Left Slots */}
                    <div className="absolute bottom-[18%] left-[4%] flex gap-[2vw]">
                        {options.map((opt, i) => (
                            <motion.button
                                key={opt.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => handleNavigation(opt.path, (opt as any).state)}
                                className="flex flex-col items-center gap-2 group"
                            >
                                <div className={cn(
                                    "w-[14vw] h-[14vw] max-w-[160px] max-h-[160px] rounded-2xl flex items-center justify-center transition-transform group-active:scale-95 group-hover:-translate-y-2 duration-300",
                                    // (opt as any).image ? "bg-transparent" : opt.color,
                                    // !(opt as any).image && "text-white shadow-lg"
                                )}>
                                    {(opt as any).image ? (
                                        <img
                                            src={(opt as any).image}
                                            alt={opt.title}
                                            className="w-full h-full object-contain drop-shadow-xl"
                                            style={{ transform: `scale(${(opt as any).imageScale || 1})` }}
                                        />
                                    ) : (
                                        <opt.icon className="w-12 h-12 text-white drop-shadow-md" />
                                    )}
                                </div>
                                {/* <span className="text-sm font-bold text-white drop-shadow-md text-center leading-tight px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full">{opt.title}</span> */}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div >
        </div >
    );
};
