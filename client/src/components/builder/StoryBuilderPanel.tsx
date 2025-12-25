import React, { useState, useEffect } from 'react';
import {
    Wand2, Sparkles, Castle, Map, Moon, ScrollText,
    Film, Wind, Grid2X2, PenTool, Smile,
    Flame, Rocket, Palette, PawPrint, Users, Cake, Music, Waves,
    Mic, MicOff, X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

// --- Configuration Data ---
const STORY_STYLES = [
    { id: 'fairy_tale', label: 'Fairy Tale', icon: Wand2, desc: 'Classic & Magical' },
    { id: 'magic_land', label: 'Magic Land', icon: Sparkles, desc: 'Wizards & Spells' },
    { id: 'disney_story', label: 'Disney Style', icon: Castle, desc: 'Heroic & Musical' },
    { id: 'adventure', label: 'Adventure', icon: Map, desc: 'Explorer & Brave' },
    { id: 'bedtime', label: 'Bedtime Story', icon: Moon, desc: 'Calm & Sweet' },
    { id: 'prophecy', label: 'Prophecy', icon: ScrollText, desc: 'Mysterious & Destiny' },
];

const VISUAL_STYLES = [
    { id: 'disney_visual', label: 'Disney Style', icon: Film },
    { id: 'ghibli', label: 'Ghibli Style', icon: Wind },
    { id: 'pixel', label: 'Pixel Art', icon: Grid2X2 },
    { id: 'crayon', label: 'Crayon Drawing', icon: PenTool },
    { id: 'cute', label: 'Cute Cartoon', icon: Smile },
];

// Map simple names to icons
const CONTENT_TAGS = [
    { id: 'Dragon', icon: Flame },
    { id: 'Unicorn', icon: Sparkles },
    { id: 'Space', icon: Rocket },
    { id: 'Rainbow', icon: Palette },
    { id: 'Animal Friend', icon: PawPrint },
    { id: 'Family', icon: Users },
    { id: 'Birthday', icon: Cake },
    { id: 'Music', icon: Music },
    { id: 'Ocean', icon: Waves },
];

interface StoryBuilderPanelProps {
    onGenerate: (data: StoryBuilderData) => void;
    imageUploaded: boolean;
}

export interface StoryBuilderData {
    storyStyle: string;
    visualStyle: string;
    contentTags: string[];
    voiceNote: string;
}

export const StoryBuilderPanel: React.FC<StoryBuilderPanelProps> = ({ onGenerate, imageUploaded }) => {
    const [storyStyle, setStoryStyle] = useState<string>('fairy_tale'); // Default
    const [visualStyle, setVisualStyle] = useState<string>('');
    const [contentTags, setContentTags] = useState<string[]>([]);
    const [voiceNote, setVoiceNote] = useState('');
    const [isListening, setIsListening] = useState(false);

    // Toggle Tag Logic (Max 3)
    const toggleTag = (tagId: string) => {
        setContentTags(prev => {
            if (prev.includes(tagId)) {
                return prev.filter(t => t !== tagId);
            }
            if (prev.length >= 3) return prev; // Max 3
            return [...prev, tagId];
        });
    };

    // Voice Input Logic
    const toggleVoiceInput = () => {
        if (isListening) {
            setIsListening(false);
            // Stop recognition (handled by browser usually)
        } else {
            setIsListening(true);
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setVoiceNote(prev => prev + (prev ? ' ' : '') + transcript);
                    setIsListening(false);
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                };

                recognition.onend = () => setIsListening(false);
                recognition.start();
            } else {
                alert('Voice input is not supported in this browser.');
                setIsListening(false);
            }
        }
    };

    // Check if ready to generate
    const isReady = imageUploaded && !!storyStyle && !!visualStyle;

    const handleGenerateClick = () => {
        if (isReady) {
            onGenerate({
                storyStyle,
                visualStyle,
                contentTags,
                voiceNote
            });
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-white/90 backdrop-blur-md rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32 scrollbar-none">

                {/* Module 1: Story Style */}
                <section>
                    <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                        <span className="bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm">1</span>
                        Pick a Story Vibe 📖
                    </h3>
                    <div className="flex gap-2 flex-wrap justify-between">
                        {STORY_STYLES.map(style => (
                            <button
                                key={style.id}
                                onClick={() => setStoryStyle(style.id)}
                                className={cn(
                                    "flex-shrink-0 flex flex-col items-center justify-center gap-0.5 p-1 rounded-xl border-2 transition-all w-12 h-12",
                                    storyStyle === style.id
                                        ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md scale-[1.02]"
                                        : "border-slate-100 bg-white text-slate-500 hover:border-purple-200 hover:bg-slate-50"
                                )}
                            >
                                <style.icon className={cn("w-4 h-4", storyStyle === style.id ? "text-purple-600" : "text-slate-400")} />
                                <div className="text-[8px] font-bold text-center leading-none truncate w-full px-0.5">
                                    {style.label}
                                </div>
                                {storyStyle === style.id && (
                                    <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Module 2: Visual Style */}
                <section>
                    <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                        <span className="bg-pink-400 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm">2</span>
                        Choose the Look 🎨
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                        {VISUAL_STYLES.map(style => (
                            <button
                                key={style.id}
                                onClick={() => setVisualStyle(style.id)}
                                className={cn(
                                    "flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all w-16 h-16",
                                    visualStyle === style.id
                                        ? "border-pink-500 bg-pink-50 text-pink-700 shadow-md"
                                        : "border-slate-100 bg-white text-slate-500 hover:border-pink-200"
                                )}
                            >
                                <style.icon className={cn("w-5 h-5", visualStyle === style.id ? "text-pink-500" : "text-slate-400")} />
                                <span className="text-[9px] font-bold text-center leading-tight truncate w-full">{style.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Module 3: Content Tags */}
                <section>
                    <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                        <span className="bg-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">3</span>
                        What's inside? (Max 3) 🏷️
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {CONTENT_TAGS.map(tag => {
                            const isSelected = contentTags.includes(tag.id);
                            return (
                                <button
                                    key={tag.id}
                                    onClick={() => toggleTag(tag.id)}
                                    className={cn(
                                        "flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold transition-all",
                                        isSelected
                                            ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                                    )}
                                >
                                    <tag.icon className="w-3 h-3" />
                                    {tag.id}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Module 4: Voice Input */}
                <section>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-bold text-slate-500">
                            Tell us more (Optional) 🎤
                        </h3>
                        {voiceNote && (
                            <button onClick={() => setVoiceNote('')} className="text-xs text-red-400 hover:text-red-500 font-medium">Clear</button>
                        )}
                    </div>
                    <div className="relative">
                        <textarea
                            value={voiceNote}
                            onChange={(e) => setVoiceNote(e.target.value)}
                            placeholder="You can also tell us more here, if you like 😊..."
                            className="w-full p-4 pr-12 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-purple-300 focus:ring-0 transition-all outline-none resize-none h-24 text-sm text-slate-700"
                        />
                        <button
                            onClick={toggleVoiceInput}
                            className={cn(
                                "absolute right-3 bottom-3 p-2 rounded-xl transition-all shadow-sm",
                                isListening ? "bg-red-500 text-white animate-pulse" : "bg-white text-slate-400 hover:text-purple-500 shadow-sm border border-slate-100"
                            )}
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                    </div>
                </section>

                {/* Generate Button moved here */}
                <div className="pt-4">
                    <button
                        onClick={handleGenerateClick}
                        disabled={!isReady}
                        className="w-full py-4 rounded-2xl text-white font-black text-lg tracking-wide shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    >
                        Generate My Story ✨
                    </button>
                </div>
            </div>
            {/* Removed Fixed Bottom Action */}
        </div>
    );
};
