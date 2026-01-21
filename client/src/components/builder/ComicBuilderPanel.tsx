import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { BouncyButton } from '../ui/BouncyButton';
import { playUiSound } from '../../utils/SoundSynth';
import comicGenBtn from '../../assets/comic_gen_v2.jpg'; // Updated to V2 Asset

import { COMIC_STYLES } from '../../constants/comicStyles';

// --- Configuration ---
// Redesigned Section 2: Story Mood (V4.0 Game Moods)
const MOODS = [
    { id: 'mood_victory', label: 'Winner 🏆', icon: '🏆', color: '#FFD700', image: '/assets/moods/mood_winner.jpg' },
    { id: 'mood_explore', label: 'Explore 🗺️', icon: '🗺️', color: '#87CEEB', image: '/assets/moods/mood_explore.jpg' },
    { id: 'mood_funny', label: 'Silly  clowns', icon: '🤡', color: '#FF69B4', image: '/assets/moods/mood_silly.jpg' },
    { id: 'mood_cool', label: 'Cool 😎', icon: '😎', color: '#4ADE80', image: '/assets/moods/mood_cool.jpg' },
    { id: 'mood_friends', label: 'Team Up 🙌', icon: '🙌', color: '#FFA500', image: '/assets/moods/mood_teamup.jpg' },
    { id: 'mood_dream', label: 'Dreamy ☁️', icon: '☁️', color: '#E0B0FF', image: '/assets/moods/mood_dreamy.png' },
    { id: 'mood_battle', label: 'Battle 💥', icon: '💥', color: '#FF4500', image: '/assets/moods/mood_battle_v3.jpg' },
    { id: 'mood_spooky', label: 'Spooky 👻', icon: '👻', color: '#9370DB', image: '/assets/moods/mood_spooky_v2.jpg' },
    { id: 'mood_mystery', label: 'Mystery 🔍', icon: '🔍', color: '#483D8B', image: '/assets/moods/mood_mystery_v3.jpg' },
    { id: 'mood_magic', label: 'Magic ✨', icon: '✨', color: '#DA70D6', image: '/assets/moods/mood_magic_v3.jpg' }
];

// Redesigned Section 3: The Cast (Sidekicks)
const SIDEKICKS = [
    { id: 'cat', label: 'Cat', icon: '🐱' },
    { id: 'dog', label: 'Dog', icon: '🐶' },
    { id: 'dragon', label: 'Dragon', icon: '🐲' },
    { id: 'robot', label: 'Robot', icon: '🤖' },
];

const CHARACTERS = [
    { id: 'hero', label: 'Me!', icon: '🦸', image: '/assets/role_icons/role_hero.jpg' },
    { id: 'mom', label: 'Mom', icon: '👩', image: '/assets/role_icons/role_mom.png' },
    { id: 'dad', label: 'Dad', icon: '👨', image: '/assets/role_icons/role_dad.jpg' },
    { id: 'grandma', label: 'Grandma', icon: '👵', image: '/assets/role_icons/role_grandma.png' },
    { id: 'grandpa', label: 'Grandpa', icon: '👴', image: '/assets/role_icons/role_grandpa.jpg' },
    { id: 'teacher', label: 'Teacher', icon: '👩‍🏫', image: '/assets/role_icons/role_teacher.png' },
    { id: 'other', label: 'Other', icon: '✨' },
];

export interface ComicBuilderData {
    storyType: string;
    visualStyle: string;
    characters: string[];
}

interface ComicBuilderPanelProps {
    onGenerate: (data: any) => void;
    imageUploaded: boolean;
    children: React.ReactNode; // The Upload Box
}

export const ComicBuilderPanel: React.FC<ComicBuilderPanelProps> = ({ onGenerate, imageUploaded, children }) => {
    const { user } = useAuth();

    // State
    const [visualStyleId, setVisualStyleId] = useState<string | null>(null);
    const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);

    console.log("ComicBuilderPanel Loaded V5 - New Button");
    const [selectedSidekickId, setSelectedSidekickId] = useState<string | null>(null);
    const [showSidekickModal, setShowSidekickModal] = useState(false);
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(CHARACTERS[0].id);
    const [customCharacterName, setCustomCharacterName] = useState("");
    const [isListening, setIsListening] = useState(false);

    // Sparkle Voice Interaction Listener
    React.useEffect(() => {
        const handleSparkleUpdate = (e: CustomEvent) => {
            const tags = e.detail;
            if (!tags) return;
            // ... (Sparkle Logic Unchanged) ...
            if (tags.subject) {
                const subject = tags.subject.toLowerCase();
                const matchedChar = CHARACTERS.find(c => subject.includes(c.id) || subject.includes(c.label.toLowerCase()));
                if (matchedChar) setSelectedCharacterId(matchedChar.id);
            }
            if (tags.style) {
                const style = tags.style.toLowerCase();
                const matchedMood = MOODS.find(m => style.includes(m.id) || style.includes(m.label.toLowerCase()));
                if (matchedMood) setSelectedMoodId(matchedMood.id);
            }
        };
        window.addEventListener('sparkle-update' as any, handleSparkleUpdate);
        return () => window.removeEventListener('sparkle-update' as any, handleSparkleUpdate);
    }, []);

    const handleGenerateClick = () => {
        const selectedStyle = COMIC_STYLES.find(s => s.id === visualStyleId);
        const selectedMood = MOODS.find(m => m.id === selectedMoodId);

        // ... (Character List Logic - Unchanged) ...
        // Construct character list
        const role = CHARACTERS.find(c => c.id === selectedCharacterId);
        let characterList: string[] = [];
        if (role) {
            if (role.id === 'hero') characterList.push('Me (The Hero)');
            else if (role.id === 'other' && customCharacterName) characterList.push(customCharacterName);
            else characterList.push(role.label);
        }

        if (selectedSidekickId) {
            const sidekick = SIDEKICKS.find(s => s.id === selectedSidekickId);
            if (sidekick) characterList.push(sidekick.label);
        }

        onGenerate({
            storyType: selectedMood ? selectedMood.label : '',
            visualStyle: selectedStyle ? selectedStyle.prompt_modifier : '',
            characters: characterList
        });
    };

    const isReady = imageUploaded;
    const currentSidekick = selectedSidekickId ? SIDEKICKS.find(s => s.id === selectedSidekickId) : null;

    return (
        <div className="w-full flex flex-col md:grid md:grid-cols-[330px_1fr_330px] md:gap-3 items-center md:items-start p-4 md:p-10 max-w-7xl mx-auto relative">

            {/* Left Column: STYLE ZONE */}
            <div className="w-full md:w-auto order-2 md:order-1 flex flex-col gap-8 relative min-h-[400px]">
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex flex-col items-center md:items-start gap-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-orange-400 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm">1</span>
                            Comic Look 🎨
                        </div>
                        <span className="text-xs font-bold text-orange-200 uppercase tracking-wider ml-10">Choose an Art Style</span>
                    </h3>
                    <div className="flex overflow-x-auto snap-x gap-3 pb-4 md:pb-0 md:grid md:grid-cols-2 md:gap-2 md:overflow-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        {/* Render ALL 6 Styles */}
                        {COMIC_STYLES.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => setVisualStyleId(prev => prev === item.id ? null : item.id)}
                                className={cn(
                                    "rounded-2xl border-4 transition-all w-24 md:w-full aspect-square animate-float overflow-hidden relative shadow-lg shrink-0 snap-center",
                                    visualStyleId === item.id
                                        ? "border-orange-500 scale-105 shadow-xl z-10"
                                        : "border-slate-100 bg-white hover:border-orange-200 hover:scale-105",
                                )}
                                style={{ animationDelay: `${index * 0.1} s` }}
                            >
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl mb-1">{item.icon}</span>
                                )}
                                {/* Overlay Label */}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                    <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider block text-center shadow-sm">{item.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Center Column: Upload Box + Role Labels + Generate */}
            <div className="w-full order-1 md:order-2 flex flex-col items-center gap-6 md:pt-[60px]">
                {/* Upload Box */}
                <div className="w-full max-w-[330px] aspect-[4/3] shadow-2xl rounded-3xl overflow-hidden border-4 border-white/50 bg-white/10 backdrop-blur-sm">
                    {children}
                </div>



                {/* Section 4: Role Labels (Optimized layout) */}
                <div className="w-full flex flex-col gap-4 bg-white/40 backdrop-blur-sm p-6 rounded-[32px] border-2 border-slate-100 shadow-xl">
                    <h3 className="text-lg font-black text-white flex flex-col items-center md:items-start gap-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-green-400 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-sm">3</span>
                            Who is this? 🏷️
                        </div>
                        <span className="text-xs font-bold text-green-200 uppercase tracking-wider ml-10">Assign a Role to your photo!</span>
                    </h3>
                    <div className="flex overflow-x-auto snap-x gap-3 pb-2 md:pb-2 md:grid md:grid-cols-3 md:gap-2 md:overflow-visible scrollbar-hide -mx-2 px-2 md:mx-0 md:px-0">
                        {CHARACTERS.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedCharacterId(prev => prev === item.id ? null : item.id)}
                                className={cn(
                                    "rounded-2xl border-4 transition-all w-20 md:w-full aspect-square animate-float overflow-hidden relative shrink-0 snap-center",
                                    selectedCharacterId === item.id
                                        ? "border-green-500 scale-105 shadow-xl z-10"
                                        : "border-white/20 bg-transparent hover:border-green-200 hover:scale-105",
                                    item.id === 'other' && "md:col-start-2"
                                )}
                            >
                                {(item as any).image ? (
                                    <img src={(item as any).image} alt={item.label} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl mb-1 flex items-center justify-center h-full bg-black/10">{item.icon}</span>
                                )}

                                {/* Selection Checkmark Overlay */}
                                {selectedCharacterId === item.id && (
                                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1 shadow-md z-20">
                                        <span className="text-xs text-white">✅</span>
                                    </div>
                                )}

                                {/* Overlay Label */}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                    <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider block text-center shadow-sm">{item.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Custom Character Input */}
                    {selectedCharacterId === 'other' && (
                        <div className="w-full animate-in slide-in-from-top-4">
                            <div className="relative flex items-center gap-2 bg-white rounded-2xl border-2 border-green-200 p-2 shadow-inner">
                                <input
                                    type="text"
                                    value={customCharacterName}
                                    onChange={(e) => setCustomCharacterName(e.target.value)}
                                    placeholder="Enter character name..."
                                    className="flex-1 bg-transparent px-2 py-2 text-sm font-bold outline-none placeholder:text-slate-300"
                                />
                                <button
                                    onClick={() => {
                                        if (isListening) {
                                            setIsListening(false);
                                            return;
                                        }
                                        setIsListening(true);
                                        const recognition = new (window as any).webkitSpeechRecognition();
                                        recognition.lang = 'en-US';
                                        recognition.onresult = (event: any) => {
                                            const text = event.results[0][0].transcript;
                                            setCustomCharacterName(text);
                                            setIsListening(false);
                                        };
                                        recognition.onerror = () => setIsListening(false);
                                        recognition.onend = () => setIsListening(false);
                                        recognition.start();
                                    }}
                                    className={cn(
                                        "p-2 rounded-xl transition-colors",
                                        isListening ? "bg-red-500 text-white animate-pulse" : "bg-green-100 text-green-600 hover:bg-green-200"
                                    )}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Generate Button (Image Replacement - Clean) */}
                <div className="w-full flex flex-col items-center gap-2 py-4">
                    <button
                        onClick={handleGenerateClick}
                        disabled={!isReady}
                        className="relative w-40 h-40 md:w-48 md:h-48 hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                    >
                        <img
                            src={comicGenBtn}
                            alt="Generate"
                            className="w-full h-full object-contain"
                            style={{ filter: 'url(#remove-black)' }}
                        />
                        {/* SVG Filter to turn Black Background to Transparent */}
                        <svg width="0" height="0" className="absolute">
                            <filter id="remove-black">
                                <feColorMatrix
                                    type="matrix"
                                    values="1 0 0 0 0  
                                            0 1 0 0 0  
                                            0 0 1 0 0  
                                            4 4 4 0 -0.5"
                                />
                            </filter>
                        </svg>
                        {/* Cost Badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm border border-white/20 shadow-lg whitespace-nowrap">
                            30 Magic Pts
                        </div>
                    </button>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Ready to create!</p>
                </div>
            </div>

            {/* Right Column: MOOD ZONE */}
            <div className="w-full md:w-auto order-3 flex flex-col gap-8 relative min-h-[400px]">

                {/* Section 2: Mood */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex flex-col items-center md:items-start gap-1">
                        <div className="flex items-center gap-2">
                            <span className="bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm">2</span>
                            Story Vibe 🎭
                        </div>
                        <span className="text-xs font-bold text-yellow-200 uppercase tracking-wider ml-10">What is happening?</span>
                    </h3>
                    <div className="flex overflow-x-auto snap-x gap-3 pb-4 md:pb-0 md:grid md:grid-cols-2 md:gap-2 md:overflow-visible scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        {/* Render 6 V4 Moods */}
                        {MOODS.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedMoodId(prev => prev === item.id ? null : item.id)}
                                className={cn(
                                    "rounded-2xl border-4 transition-all w-24 md:w-full aspect-square animate-float overflow-hidden relative shadow-lg shrink-0 snap-center",
                                    selectedMoodId === item.id
                                        ? "border-yellow-500 scale-105 shadow-xl z-10"
                                        : "border-slate-100 bg-white hover:border-yellow-200 hover:scale-105"
                                )}
                                style={{ animationDelay: `${index * 0.1 + 0.2} s` }}
                            >
                                {(item as any).image ? (
                                    <img
                                        src={(item as any).image}
                                        alt={item.label}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl mb-1">{item.icon}</span>
                                )}
                                {/* Overlay Label */}
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm py-1">
                                    <span className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-wider block text-center shadow-sm">{item.label.split(' ')[0]}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Sidekick Modal (Keep existing) */}
            {showSidekickModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowSidekickModal(false)}>
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-4">
                            {SIDEKICKS.map(item => (
                                <button key={item.id} onClick={() => { setSelectedSidekickId(item.id); setShowSidekickModal(false); }} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-purple-50 transition-colors">
                                    <span className="text-4xl">{item.icon}</span>
                                    <span className="font-bold text-slate-600">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
