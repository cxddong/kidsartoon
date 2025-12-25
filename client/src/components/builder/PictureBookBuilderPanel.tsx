import React, { useState } from 'react';
import { Book, Heart, Globe, Moon, Wand2, Flower2, Palette, PenTool, Smile, Zap, Coffee, Mic, MicOff, Rocket } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// --- Configuration ---
const THEMES = [
    { id: 'fairy_tale', label: 'Fairy Tale Book', icon: Wand2 },
    { id: 'growing_up', label: 'Growing Up', icon: Flower2 },
    { id: 'explore', label: 'Explore World', icon: Globe },
    { id: 'family_love', label: 'Family Love', icon: Heart },
    { id: 'bedtime', label: 'Bedtime Book', icon: Moon },
    { id: 'theme_space_journey', label: 'Space Journey', icon: Rocket },
];

const ILLUSTRATION_STYLES = [
    { id: 'ghibli', label: 'Ghibli Style', icon: Flower2 },
    { id: 'storybook', label: 'Storybook', icon: Book },
    { id: 'crayon', label: 'Soft Crayon', icon: PenTool },
    { id: 'pastel', label: 'Cute Pastel', icon: Palette },
];

const PACING_OPTIONS = [
    { id: 'slow', label: 'Slow & Calm', icon: Coffee },
    { id: 'adventure', label: 'Gentle Adventure', icon: Zap },
];

const CHARACTERS = [
    { id: 'dinosaur', label: 'Dino', icon: '🦖' },
    { id: 'space', label: 'Space', icon: '🚀' },
    { id: 'hero', label: 'Hero', icon: '🦸' },
    { id: 'robot', label: 'Bot', icon: '🤖' },
    { id: 'fairytale', label: 'Fairy', icon: '🧚' },
    // IP Characters (Fallback to icons if images missing)
    { id: 'char_roblox', label: 'Robo', icon: '🕹️' /*, image: '/assets/icons/char_roblox.png' */ },
    { id: 'char_minecraft', label: 'Cube', icon: '🟩' /*, image: '/assets/icons/char_minecraft.png' */ },
    { id: 'char_fortnite', label: 'Battle', icon: '🛡️' /*, image: '/assets/icons/char_fortnite.png' */ },
    { id: 'char_pokemon', label: 'Pika', icon: '⚡' /*, image: '/assets/icons/char_pokemon.png' */ },
    { id: 'char_stitch', label: 'Alien', icon: '👾' /*, image: '/assets/icons/char_stitch.png' */ },
    { id: 'char_lego', label: 'Brick', icon: '🧱' /*, image: '/assets/icons/char_lego.png' */ },
];

const PAGE_COUNTS = [
    { value: 4, label: '4 Pages', desc: 'Short Story' },
    { value: 8, label: '8 Pages', desc: 'Deep Story' },
    { value: 12, label: '12 Pages', desc: 'Epic Adventure' },
];

export interface PictureBookBuilderData {
    theme: string;
    illustrationStyle: string;
    pace: string;
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
    const [illustrationStyle, setIllustrationStyle] = useState(ILLUSTRATION_STYLES[1].id);
    const [pace, setPace] = useState(PACING_OPTIONS[0].id);
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
        <div className="w-full flex flex-col md:grid md:grid-cols-[250px_1fr_250px] md:gap-8 items-center md:items-start p-4 md:p-10 max-w-7xl mx-auto">

            {/* Left Column: Theme & Style */}
            <div className="w-full md:w-auto order-2 md:order-1 flex flex-col gap-8">
                {/* Section A: Theme */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center justify-center md:justify-start">
                        Story Theme 📖
                    </h3>
                    <div className="grid grid-cols-2 gap-3 pb-2 md:pb-0 justify-center md:justify-start">
                        {THEMES.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setTheme(item.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all shrink-0 aspect-square",
                                    item.id === 'theme_space_journey'
                                        ? (theme === item.id
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md scale-105"
                                            : "border-slate-100 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50")
                                        : (theme === item.id
                                            ? "border-pink-500 bg-pink-50 text-pink-700 shadow-md scale-105"
                                            : "border-slate-100 bg-white text-slate-500 hover:border-pink-200 hover:bg-pink-50")
                                )}
                            >
                                <item.icon className="w-8 h-8 mb-2 shrink-0" />
                                <span className="text-[10px] font-bold text-center leading-tight">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section B: Visual Style */}
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
                                    "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all shrink-0 hover:bg-purple-50 aspect-square",
                                    illustrationStyle === item.id
                                        ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md scale-105"
                                        : "border-slate-100 bg-white text-slate-500 hover:border-purple-200"
                                )}
                            >
                                <item.icon className="w-8 h-8 mb-2 shrink-0" />
                                <span className="text-[10px] font-bold text-center leading-tight">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Center Column: Upload + Pace + Roles + Generate */}
            <div className="w-full order-1 md:order-2 flex flex-col items-center gap-6">
                {/* Upload Box (Children) */}
                <div className="w-full max-w-md aspect-[4/3]">
                    {children}
                </div>



                {/* Section D: Page Count (NEW) */}
                <div className="w-full max-w-sm flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white text-center">
                        Book Length 📖
                    </h3>
                    <div className="flex gap-2 justify-center">
                        {PAGE_COUNTS.map(item => (
                            <button
                                key={item.value}
                                onClick={() => setPageCount(item.value)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all flex-1 hover:bg-amber-50",
                                    pageCount === item.value
                                        ? "border-amber-500 bg-amber-50 text-amber-700 shadow-md scale-105"
                                        : "border-slate-100 bg-white text-slate-500 hover:border-amber-200"
                                )}
                            >
                                <span className="text-sm font-black">{item.label}</span>
                                <span className="text-[10px] font-bold opacity-70">{item.desc}</span>
                            </button>
                        ))}
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

                {/* Generate Button */}
                <button
                    onClick={() => onGenerate({ theme, illustrationStyle, pace, character, pageCount, storyText })}
                    disabled={!isReady}
                    className="w-full max-w-sm py-4 rounded-full text-white font-black text-xl shadow-xl shadow-pink-500/20 bg-gradient-to-r from-pink-500 to-rose-500 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                    Create My Book ✨ (Costs {pageCount === 4 ? 30 : pageCount === 8 ? 50 : 70} Points)
                </button>
            </div>

            {/* Right Column: Role Labels */}
            <div className="w-full md:w-auto order-3 flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center justify-center md:justify-start">
                        Main Character 🏷️
                    </h3>
                    <div className="relative h-[350px] flex items-center justify-center">
                        {/* Fan Selector Container */}

                        {/* Outer Orbit (IP Characters - 6) */}
                        <AnimatePresence>
                            {isCharSelectorOpen && CHARACTERS.slice(5, 11).map((item, i) => {
                                const total = 6;
                                const radius = 140;
                                // Angle range: -60 to 240 (300 degree fan to cover mostly everything except bottom left obscured?? or full circle?)
                                // User suggested: -30 to 210.
                                const angleStart = -60;
                                const angleEnd = 240;
                                const span = angleEnd - angleStart;
                                const angle = angleStart + (i * (span / (total - 1)));
                                const radian = (angle * Math.PI) / 180;
                                const x = radius * Math.cos(radian);
                                const y = radius * Math.sin(radian);

                                return (
                                    <motion.button
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                        animate={{ opacity: 1, scale: 1, x, y }}
                                        exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                        transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
                                        onClick={() => { setCharacter(item.id); setIsCharSelectorOpen(false); }}
                                        className={cn(
                                            "absolute w-14 h-14 rounded-full border-2 bg-white shadow-lg flex flex-col items-center justify-center z-20 hover:scale-110 hover:z-30 transition-all",
                                            character === item.id ? "border-green-500 ring-2 ring-green-200" : "border-slate-100"
                                        )}
                                        title={item.label}
                                    >
                                        {(item as any).image ? (
                                            <img src={(item as any).image} className="w-10 h-10 object-contain" />
                                        ) : (
                                            <span className="text-2xl">{item.icon}</span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>

                        {/* Inner Orbit (Basic Characters - 5) */}
                        <AnimatePresence>
                            {isCharSelectorOpen && CHARACTERS.slice(0, 5).map((item, i) => {
                                const total = 5;
                                const radius = 80;
                                // Stagger angle slightly differently
                                const angleStart = -45;
                                const angleEnd = 225;
                                const span = angleEnd - angleStart;
                                const angle = angleStart + (i * (span / (total - 1)));
                                const radian = (angle * Math.PI) / 180;
                                const x = radius * Math.cos(radian);
                                const y = radius * Math.sin(radian);

                                return (
                                    <motion.button
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                        animate={{ opacity: 1, scale: 1, x, y }}
                                        exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                        transition={{ delay: i * 0.03 + 0.1, type: "spring", stiffness: 260, damping: 20 }}
                                        onClick={() => { setCharacter(item.id); setIsCharSelectorOpen(false); }}
                                        className={cn(
                                            "absolute w-12 h-12 rounded-full border-2 bg-white shadow-md flex items-center justify-center z-20 hover:scale-110 hover:z-30 transition-all",
                                            character === item.id ? "border-green-500 ring-2 ring-green-200" : "border-slate-100"
                                        )}
                                        title={item.label}
                                    >
                                        <span className="text-2xl">{item.icon}</span>
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>

                        {/* Central Trigger Button */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsCharSelectorOpen(!isCharSelectorOpen)}
                            className={cn(
                                "relative z-30 w-20 h-20 rounded-full shadow-xl border-4 flex flex-col items-center justify-center bg-white transition-all",
                                isCharSelectorOpen ? "border-green-400 bg-green-50 scale-105" : "border-green-500 hover:scale-105"
                            )}
                        >
                            {(() => {
                                const selected = CHARACTERS.find(c => c.id === character) || CHARACTERS[0];
                                return (
                                    <>
                                        {(selected as any).image ? (
                                            <img src={(selected as any).image} className="w-10 h-10 object-contain mb-1" />
                                        ) : (
                                            <span className="text-3xl mb-1">{selected.icon}</span>
                                        )}
                                        <div className="absolute -bottom-8 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                                            {isCharSelectorOpen ? "Close" : selected.label}
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.button>
                    </div>
                </div>

                {/* Section C: Pace (Moved to Right) */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center justify-center md:justify-start">
                        Story Pace 🐢
                    </h3>
                    <div className="grid grid-cols-2 gap-3 justify-center md:justify-start">
                        {PACING_OPTIONS.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setPace(item.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all shrink-0 hover:bg-blue-50 shadow-sm aspect-square",
                                    pace === item.id
                                        ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md scale-105"
                                        : "border-slate-100 bg-white text-slate-500 hover:border-blue-200"
                                )}
                            >
                                <item.icon className="w-8 h-8 mb-2 shrink-0" />
                                <span className="text-[10px] font-bold text-center leading-tight">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>


        </div>
    );
};
