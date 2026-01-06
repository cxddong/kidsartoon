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
    { id: 'mood_funny', label: 'Silly 🤡', icon: '🤡', color: '#FF69B4', image: '/assets/moods/mood_silly.jpg' },
    { id: 'mood_cool', label: 'Cool 😎', icon: '😎', color: '#4ADE80', image: '/assets/moods/mood_cool.jpg' },
    { id: 'mood_friends', label: 'Team Up 🙌', icon: '🙌', color: '#FFA500', image: '/assets/moods/mood_teamup.jpg' },
    { id: 'mood_dream', label: 'Dreamy ☁️', icon: '☁️', color: '#E0B0FF', image: '/assets/moods/mood_dreamy.png' }
];

// Redesigned Section 3: The Cast (Sidekicks)
const SIDEKICKS = [
    { id: 'cat', label: 'Cat', icon: '🐱' },
    { id: 'dog', label: 'Dog', icon: '🐶' },
    { id: 'dragon', label: 'Dragon', icon: '🐲' },
    { id: 'robot', label: 'Robot', icon: '🤖' },
];

const CHARACTERS = [
    { id: 'hero', label: 'Me!', icon: '🦸' },
    { id: 'mom', label: 'Mom', icon: '👩' },
    { id: 'dad', label: 'Dad', icon: '👨' },
    { id: 'grandma', label: 'Grandma', icon: '👵' },
    { id: 'grandpa', label: 'Grandpa', icon: '👴' },
    { id: 'teacher', label: 'Teacher', icon: '👩‍🏫' },
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

    // V4.0 Independent Bubble State
    const [questState, setQuestState] = useState<{ visible: boolean, text: string }>({ visible: false, text: "" });
    const [lootState, setLootState] = useState<{ visible: boolean, text: string }>({ visible: false, text: "" });
    console.log("ComicBuilderPanel Loaded V5 - New Button");
    const [selectedSidekickId, setSelectedSidekickId] = useState<string | null>(null);
    const [showSidekickModal, setShowSidekickModal] = useState(false);
    const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(CHARACTERS[0].id);
    const [customCharacterName, setCustomCharacterName] = useState("");
    const [isListening, setIsListening] = useState(false);

    // Magic Quests
    const MAGIC_QUESTS = [
        "Quest: Draw a robot baking a giant cake! 🤖🎂",
        "Quest: Draw a dragon sleeping on a cloud! 🐉☁️",
        "Quest: Draw a pixel cat chasing a mouse! 🐱🖱️",
        "Quest: Draw a neon city in the sky! 🌃✨",
        "Quest: Draw a blocky zombie dancing! 🧟🕺"
    ];

    const handleMagicQuest = () => {
        const isOpening = !questState.visible;
        if (isOpening) {
            // Play Pop
            playUiSound('pop');
            // Right Side: Magic Quest
            const randomQuest = MAGIC_QUESTS[Math.floor(Math.random() * MAGIC_QUESTS.length)];
            setQuestState({ visible: true, text: randomQuest });
        } else {
            // Play Swoosh
            playUiSound('swoosh');
            setQuestState(prev => ({ ...prev, visible: false }));
        }
    };

    const handleMagicLoot = () => {
        const isOpening = !lootState.visible;
        if (isOpening) {
            // Play Pop
            playUiSound('pop');
            // Left Side: Magic Loot
            const availableStyles = COMIC_STYLES.filter(s => s.id !== visualStyleId);
            const secretStyle = availableStyles[Math.floor(Math.random() * availableStyles.length)];
            const lootText = "Unlocking Rare Style... ✨ " + secretStyle.name + "!";

            setVisualStyleId(secretStyle.id);
            setLootState({ visible: true, text: lootText });
        } else {
            // Play Swoosh
            playUiSound('swoosh');
            setLootState(prev => ({ ...prev, visible: false }));
        }
    };

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

            {/* Left Column: STYLE ZONE + MAGIC LOOT */}
            {/* Left Column: STYLE ZONE + MAGIC LOOT */}
            <div className="w-full md:w-auto order-2 md:order-1 flex flex-col gap-8 relative min-h-[400px]">
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 justify-center md:justify-start">
                        <span className="bg-orange-400 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm">1</span>
                        Style 🎨
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-2 gap-2 pb-2 md:pb-0 justify-items-center relative z-10">
                        {/* Render ALL 6 Styles */}
                        {COMIC_STYLES.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => setVisualStyleId(prev => prev === item.id ? null : item.id)}
                                className={cn(
                                    "rounded-2xl border-4 transition-all w-full aspect-square animate-float overflow-hidden relative shadow-lg",
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
                                <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-[2px] py-0.5">
                                    <span className="text-[9px] font-black text-white uppercase tracking-wider block text-center shadow-sm">{item.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Left Floating Key: Magic Loot (In-Flow) */}
                <div className="mt-8 relative z-20 flex flex-col items-center w-full">
                    <button
                        className="relative flex flex-col items-center justify-center p-0 rounded-2xl bg-gradient-to-bl from-yellow-300 to-orange-500 w-full aspect-square text-white shadow-[0_0_20px_rgba(250,204,21,0.6)] transform hover:scale-110 active:scale-95 transition-all animate-wiggle overflow-hidden z-30"
                        onClick={handleMagicLoot}
                    >
                        <div className="absolute inset-0 rounded-2xl overflow-hidden isolation-auto">
                            <video
                                src="/assets/videos/loot.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                disablePictureInPicture
                                controlsList="nodownload noremoteplayback"
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay Label */}
                            <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-[2px] py-0.5 z-10">
                                <span className="text-[9px] font-black text-white uppercase tracking-wider block text-center shadow-sm">Magic Loot</span>
                            </div>
                        </div>
                        {/* Border Overlay */}
                        <div className="absolute inset-0 rounded-2xl border-4 border-yellow-200 pointer-events-none z-20"></div>
                    </button>

                    {/* Loot Bubble (Left) - Below Button */}
                    <div className={cn("bubble-container", lootState.visible ? "active" : "inactive")}>
                        <div className="bg-purple-900 border-4 border-purple-400 p-4 rounded-xl shadow-xl w-full text-center relative mt-4">
                            {/* Triangle (Points Up) */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-900 border-t-4 border-l-4 border-purple-400 rotate-45"></div>
                            <div className="text-sm font-black text-purple-200 mb-1">Rare Loot! 🎁</div>
                            <div className="text-xs font-bold text-white">{lootState.text}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Center Column: Upload Box + Role Labels + Generate */}
            <div className="w-full order-1 md:order-2 flex flex-col items-center gap-6">
                {/* Upload Box */}
                <div className="w-[85%] max-w-md aspect-[4/3] shadow-2xl rounded-3xl overflow-hidden border-4 border-white/50 bg-white/10 backdrop-blur-sm">
                    {children}
                </div>



                {/* Section 4: Role Labels (Optimized layout) */}
                <div className="w-full flex flex-col gap-4 bg-white/40 backdrop-blur-sm p-6 rounded-[32px] border-2 border-slate-100 shadow-xl">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 justify-center md:justify-start">
                        <span className="bg-green-400 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm shadow-sm">3</span>
                        Role Labels 🏷️
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-7 gap-2">
                        {CHARACTERS.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedCharacterId(prev => prev === item.id ? null : item.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all shrink-0 hover:bg-green-50 shadow-sm aspect-square w-full relative group",
                                    selectedCharacterId === item.id
                                        ? "border-green-500 bg-green-50 text-green-700 shadow-md scale-105 z-10"
                                        : "border-slate-100 bg-white text-slate-500 hover:border-green-200"
                                )}
                            >
                                <span className="text-2xl sm:text-3xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{item.icon}</span>
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-center leading-tight mt-1">{item.label}</span>
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

            {/* Right Column: MOOD ZONE + MAGIC QUEST */}
            <div className="w-full md:w-auto order-3 flex flex-col gap-8 relative min-h-[400px]">

                {/* Section 2: Mood */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2 justify-center md:justify-start">
                        <span className="bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm">2</span>
                        Mood 🎭
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-2 gap-2 pb-2 md:pb-0 justify-items-center relative z-10">
                        {/* Render 6 V4 Moods */}
                        {MOODS.map((item, index) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedMoodId(prev => prev === item.id ? null : item.id)}
                                className={cn(
                                    "rounded-2xl border-4 transition-all w-full aspect-square animate-float overflow-hidden relative shadow-lg",
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
                                <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-[2px] py-0.5">
                                    <span className="text-[9px] font-black text-white uppercase tracking-wider block text-center shadow-sm">{item.label.split(' ')[0]}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Floating Key: Magic Quest (In-Flow) */}
                <div className="mt-8 relative z-20 flex flex-col items-center w-full">
                    <button
                        className="relative flex flex-col items-center justify-center p-0 rounded-2xl bg-gradient-to-br from-yellow-300 to-amber-500 w-full aspect-square text-white shadow-[0_0_20px_rgba(245,158,11,0.6)] transform hover:scale-110 active:scale-95 transition-all animate-wiggle overflow-hidden z-30"
                        onClick={handleMagicQuest}
                    >
                        <div className="absolute inset-0 rounded-2xl overflow-hidden isolation-auto">
                            <video
                                src="/assets/videos/quest.mp4"
                                autoPlay
                                loop
                                muted
                                playsInline
                                disablePictureInPicture
                                controlsList="nodownload noremoteplayback"
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay Label */}
                            <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-[2px] py-1 z-10">
                                <span className="text-[10px] font-black uppercase tracking-wide leading-tight drop-shadow-md block text-center text-yellow-100">Magic Quest</span>
                            </div>
                        </div>
                        {/* Border Overlay */}
                        <div className="absolute inset-0 rounded-2xl border-4 border-yellow-200 pointer-events-none z-20"></div>


                    </button>

                    {/* Quest Bubble (Right) - Below Button */}
                    <div className={cn("bubble-container", questState.visible ? "active" : "inactive")}>
                        <div className="bg-white border-4 border-yellow-400 p-4 rounded-xl shadow-xl w-full text-center relative mt-4">
                            {/* Triangle (Points Up) */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-4 border-l-4 border-yellow-400 rotate-45"></div>
                            <div className="text-sm font-black text-yellow-600 mb-1">Quest Logic! 💡</div>
                            <div className="text-xs font-bold text-slate-700">{questState.text}</div>
                        </div>
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
