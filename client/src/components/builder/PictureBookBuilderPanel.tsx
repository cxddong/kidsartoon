import React, { useState } from 'react';
import { Book, Heart, Globe, Moon, Wand2, Flower2, Palette, PenTool, Smile, Zap, Coffee, Mic, MicOff, Rocket, Ghost, Fish, Crown, Cat, Footprints, Search, Box, Scissors, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import generateVideo from '../../assets/generate.mp4';
import { Carousel3D } from '../ui/Carousel3D';

// --- Configuration ---
const THEMES = [
    { id: 'theme_magic', label: 'Magic Land', icon: Wand2, image: '/assets/theme_magic.jpg' },
    { id: 'theme_dino', label: 'Dino Park', icon: Footprints, image: '/assets/theme_dino.jpg' },
    { id: 'theme_space', label: 'Space Trip', icon: Rocket, image: '/assets/theme_space.jpg' },
    { id: 'theme_hero', label: 'Super Hero', icon: Zap, image: '/assets/theme_hero.jpg' },
    { id: 'theme_royal', label: 'Royal Castle', icon: Crown, image: '/assets/theme_royal.jpg' },
    { id: 'theme_animals', label: 'Animal Town', icon: Cat, image: '/assets/theme_animals.jpg' },
    { id: 'theme_ocean', label: 'Under Sea', icon: Fish, image: '/assets/theme_ocean.jpg' },
    { id: 'theme_spooky', label: 'Spooky Fun', icon: Ghost, image: '/assets/theme_spooky.jpg' },
];

const ILLUSTRATION_STYLES = [
    { id: 'style_3d', label: '3D Magic', icon: Box, image: '/assets/style_3d.jpg' },
    { id: 'style_watercolor', label: 'Watercolor', icon: Palette, image: '/assets/style_watercolor.jpg' },
    { id: 'style_paper', label: 'Paper Cut', icon: Scissors, image: '/assets/style_paper.jpg' },
    { id: 'style_clay', label: 'Clay World', icon: Smile, image: '/assets/style_clay.jpg' },
    { id: 'style_doodle', label: 'Doodle', icon: PenTool, image: '/assets/style_doodle.jpg' },
    { id: 'style_real', label: 'Real Life', icon: Camera, image: '/assets/style_real.jpg' },
];

const STORY_VIBES = [
    { id: 'vibe_adventure', label: 'Adventure', icon: Rocket, image: '/assets/vibe_adventure.jpg' },
    { id: 'vibe_funny', label: 'Funny', icon: Smile, image: '/assets/vibe_funny.jpg' },
    { id: 'vibe_bedtime', label: 'Bedtime', icon: Moon, image: '/assets/vibe_bedtime.jpg' },
    { id: 'vibe_mystery', label: 'Mystery', icon: Search, image: '/assets/vibe_mystery.jpg' },
    { id: 'vibe_heartwarm', label: 'Heartwarm', icon: Heart, image: '/assets/vibe_heartwarm.jpg' },
];

const CHARACTERS = [
    { id: 'dinosaur', label: 'Dino', icon: '🦕', image: '/assets/icons/char_dinosaur.png' },
    { id: 'space', label: 'Space', icon: '🚀', image: '/assets/char_space.jpg' },
    { id: 'hero', label: 'Hero', icon: '🦸', image: '/assets/char_hero.jpg' },
    { id: 'robot', label: 'Bot', icon: '🤖', image: '/assets/char_robot_new.jpg' },
    { id: 'fairytale', label: 'Fairy', icon: '🧚', image: '/assets/char_fairytale.jpg' },
    // IP Characters
    { id: 'char_roblox', label: 'Robo', icon: '🕹️', image: '/assets/char_roblox.jpg' },
    { id: 'char_minecraft', label: 'Cube', icon: '🟩', image: '/assets/char_minecraft_new.jpg' },
    { id: 'char_fortnite', label: 'Battle', icon: '🛡️', image: '/assets/char_fortnite.jpg' },
    { id: 'char_pokemon', label: 'Pika', icon: '⚡', image: '/assets/char_robot.jpg' },
    { id: 'char_stitch', label: 'Alien', icon: '👾', image: '/assets/char_alien.jpg' },
    { id: 'char_lego', label: 'Brick', icon: '🧱', image: '/assets/char_lego_new.jpg' },
];

const PAGE_COUNTS = [
    { value: 4, label: '4 Pages', desc: 'Short Story', cost: 30, image: '/assets/page_count_4.jpg' },
    { value: 8, label: '8 Pages', desc: 'Deep Story', cost: 50, image: '/assets/page_count_8.jpg' },
    { value: 12, label: '12 Pages', desc: 'Epic Adventure', cost: 70, image: '/assets/page_count_12.jpg' },
];

export interface PictureBookBuilderData {
    theme: string;
    illustrationStyle: string;
    vibe: string;
    character: string;
    pageCount: number;
    storyText?: string;
}

interface Props {
    onGenerate: (data: PictureBookBuilderData) => void;
    imageUploaded: boolean;
    children?: React.ReactNode;
}

export const PictureBookBuilderPanel: React.FC<Props> = ({ onGenerate, imageUploaded, children }) => {
    const [theme, setTheme] = useState(THEMES[0].id);
    const [illustrationStyle, setIllustrationStyle] = useState(ILLUSTRATION_STYLES[0].id);
    const [vibe, setVibe] = useState(STORY_VIBES[0].id);
    const [character, setCharacter] = useState(CHARACTERS[0].id);
    const [pageCount, setPageCount] = useState(PAGE_COUNTS[0].value);
    const [storyText, setStoryText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isCharSelectorOpen, setIsCharSelectorOpen] = useState(false); // Fan Selector State
    const recognitionRef = React.useRef<any>(null);

    // Voice Input Logic
    const toggleVoiceInput = () => {
        if (isListening) {
            // Stop listening
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
            setIsListening(false);
        } else {
            // Start listening
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;
                recognition.continuous = true; // Keep listening until user stops it

                recognition.onstart = () => {
                    setIsListening(true);
                };

                recognition.onresult = (event: any) => {
                    let newContent = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            newContent += event.results[i][0].transcript;
                        }
                    }
                    if (newContent) {
                        // Append with a space if needed
                        setStoryText(prev => {
                            const spacer = prev && !prev.endsWith(' ') ? ' ' : '';
                            return prev + spacer + newContent;
                        });
                    }
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    if (event.error === 'not-allowed') {
                        alert('Microphone access blocked. Please allow permissions.');
                    }
                    // Don't kill it on 'no-speech', just let it continue or user can toggle off
                    if (event.error !== 'no-speech') {
                        setIsListening(false);
                        recognitionRef.current = null;
                    }
                };

                recognition.onend = () => {
                    // Only auto-turn off if it wasn't stopped manually (handled by ref check usually)
                    // With continuous=true, it stops on 'stop()' or fatal error
                    setIsListening(false);
                    recognitionRef.current = null;
                };

                recognitionRef.current = recognition;
                recognition.start();
            } else {
                alert('Voice input is not supported in this browser.');
            }
        }
    };

    const isReady = imageUploaded;

    return (
        <div className="w-full flex flex-col md:grid md:grid-cols-[330px_1fr_330px] md:gap-3 items-center md:items-start p-4 md:p-10 max-w-7xl mx-auto pb-40">

            {/* Left Column: Theme & Style */}
            <div className="w-full md:w-auto order-2 md:order-1 flex flex-col gap-8">
                {/* Section A: Theme */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center justify-center md:justify-start">
                        Story Theme 📖
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {THEMES.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setTheme(item.id)}
                                className={cn(
                                    "relative w-full aspect-square rounded-2xl border-3 transition-all bg-white overflow-hidden group",
                                    theme === item.id
                                        ? "border-pink-500 shadow-xl ring-4 ring-pink-200"
                                        : "border-slate-200 shadow-md hover:border-pink-300"
                                )}
                            >
                                <img
                                    src={item.image}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />

                                {theme === item.id && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                )}

                                {/* Text at Bottom Inside Button */}
                                <div className={cn(
                                    "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 py-2 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-200",
                                    theme === item.id || "opacity-0 group-hover:opacity-100"
                                )}>
                                    <item.icon className="w-3 h-3 text-white" />
                                    <span className="text-xs font-bold text-white drop-shadow-lg">{item.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section D: Book Length (Moved from Center) */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center justify-center md:justify-start">
                        Pages 📖
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {PAGE_COUNTS.map(item => (
                            <button
                                key={item.value}
                                onClick={() => setPageCount(item.value)}
                                className="flex flex-col items-center gap-2 group w-[47%]"
                            >
                                <div className={cn(
                                    "relative w-full aspect-square rounded-2xl border-3 transition-all bg-white overflow-hidden",
                                    pageCount === item.value
                                        ? "border-amber-500 shadow-xl ring-4 ring-amber-200"
                                        : "border-slate-200 shadow-md hover:border-amber-300"
                                )}>
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                    {pageCount === item.value && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                                            <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Text Below Button */}
                                <div className="flex flex-col items-center">
                                    <span className={cn("text-[10px] sm:text-xs font-black drop-shadow-lg text-center leading-tight", pageCount === item.value ? "text-amber-400" : "text-white")}>{item.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>


            </div>

            {/* Center Column: Upload + Pace + Roles + Generate */}
            <div className="w-full order-1 md:order-2 flex flex-col items-center gap-6">
                {/* Upload Box (Children) */}
                <div className="w-[85%] max-w-sm aspect-square shadow-2xl rounded-3xl overflow-hidden border-4 border-white/50 bg-white/10 backdrop-blur-sm">
                    {children}
                </div>



                {/* Main Character (Moved from Right) */}
                <div className="w-full max-w-2xl flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white text-center">
                        Main Character 🏷️
                    </h3>
                    <div className="relative h-[260px] w-full flex items-center justify-center overflow-visible z-10">
                        <Carousel3D
                            items={CHARACTERS}
                            selectedId={character}
                            onSelect={(id) => setCharacter(id)}
                        />
                    </div>
                </div>



                {/* Module 6: Story Text Input (NEW) */}
                <section className="mt-8">
                    <div className="relative">
                        <textarea
                            value={storyText}
                            onChange={(e) => setStoryText(e.target.value)}
                            placeholder="Add your own story ideas here... 😊 (Optional)"
                            className="w-full p-4 pr-12 rounded-2xl border-2 border-slate-100 bg-white/50 focus:bg-white focus:border-purple-300 focus:ring-0 transition-all outline-none resize-none h-28 text-sm text-slate-700 shadow-inner"
                        />
                        {storyText && (
                            <button
                                onClick={() => setStoryText('')}
                                className="absolute right-3 top-3 text-xs text-red-300 hover:text-red-500 font-bold transition-colors z-10"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={toggleVoiceInput}
                            type="button"
                            className={cn(
                                "absolute right-3 bottom-3 p-2 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95",
                                isListening
                                    ? "bg-red-500 text-white animate-pulse shadow-red-200"
                                    : "bg-slate-100 text-slate-400 hover:text-purple-600 hover:bg-purple-50"
                            )}
                            title="Voice Input"
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                    </div>
                </section>

                {/* Generate Button (Video Replacement) */}
                {/* Generate Button (Floating Fixed Bottom) */}
                <div className="fixed bottom-20 md:bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
                    <div className="flex flex-col items-center pointer-events-auto">
                        <button
                            onClick={() => onGenerate({ theme, illustrationStyle, vibe, character, pageCount, storyText })}
                            disabled={!isReady}
                            className="relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group border-4 border-white/40 bg-white"
                        >
                            <video
                                src={generateVideo}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover scale-110"
                            />
                        </button>
                        {/* Helper Text */}
                        {!isReady && (
                            <div className="mt-2 px-4 py-1 bg-black/60 backdrop-blur-md rounded-full">
                                <p className="text-xs text-white font-bold animate-pulse">
                                    Upload a photo to start!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Role Labels */}
            <div className="w-full md:w-auto order-3 flex flex-col gap-8">
                {/* Section B: Visual Style (Now First in Right Column) */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center justify-center md:justify-start">
                        Art Style 🎨
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {ILLUSTRATION_STYLES.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setIllustrationStyle(item.id)}
                                className={cn(
                                    "relative w-full aspect-square rounded-2xl border-3 transition-all bg-white overflow-hidden group",
                                    illustrationStyle === item.id
                                        ? "border-purple-500 shadow-xl ring-4 ring-purple-200"
                                        : "border-slate-200 shadow-md hover:border-purple-300"
                                )}
                            >
                                <img
                                    src={item.image}
                                    alt={item.label}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />

                                {illustrationStyle === item.id && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                )}

                                {/* Text at Bottom Inside Button */}
                                <div className={cn(
                                    "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 py-1 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-200",
                                    illustrationStyle === item.id || "opacity-0 group-hover:opacity-100"
                                )}>
                                    <item.icon className="w-3 h-3 text-white" />
                                    <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-lg">{item.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section E: Story Vibe (Moved to Bottom Right) */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center justify-center md:justify-start">
                        What kind of story? 🤔
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                        {STORY_VIBES.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setVibe(item.id)}
                                className={cn(
                                    "relative w-[47%] aspect-square rounded-2xl border-3 transition-all bg-white overflow-hidden group",
                                    vibe === item.id
                                        ? "border-sky-500 shadow-xl ring-4 ring-sky-200"
                                        : "border-slate-200 shadow-md hover:border-sky-300"
                                )}
                            >
                                <img
                                    src={item.image}
                                    alt={item.label}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />

                                {vibe === item.id && (
                                    <div className="absolute top-2 right-2 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center shadow-lg">
                                        <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24" stroke="currentColor">
                                            <path d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                )}

                                {/* Text at Bottom Inside Button */}
                                <div className={cn(
                                    "absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 py-1 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-200",
                                    vibe === item.id || "opacity-0 group-hover:opacity-100"
                                )}>
                                    <item.icon className="w-3 h-3 text-white" />
                                    <span className="text-[10px] font-bold text-white drop-shadow-lg">{item.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>


        </div>
    );
};
