import React, { useState, useRef } from 'react';
import {
    Wand2, Sparkles, Castle, Map, Moon, ScrollText,
    Smile, Flame, Rocket, Palette, PawPrint,
    Users, Cake, Music, Waves, Mic, MicOff, Check,
    Play, Pause, Volume2, Volume, Globe, Fish, Snowflake,
    TreeDeciduous, Footprints, Hand, Gift
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { playAudioWithPitchShift } from '../../lib/audioUtils';

// --- Configuration Data (Sourced from AudioStoryPage) ---
export const STORY_STYLES = [
    { id: 'castle_ball', labels: { en: 'Castle Ball' }, image: '/assets/story_icons/story_castle.jpg', icon: Castle },
    { id: 'little_wizard', labels: { en: 'Magic School' }, image: '/assets/story_icons/story_wizard.jpg', icon: Wand2 },
    { id: 'ice_kingdom', labels: { en: 'Ice Kingdom' }, image: '/assets/story_icons/story_ice.jpg', icon: Snowflake },
    { id: 'magic_woods', labels: { en: 'Magic Woods' }, image: '/assets/story_icons/story_woods.png', icon: TreeDeciduous },
    { id: 'dino_egg', labels: { en: 'Dino Island' }, image: '/assets/story_icons/story_dino.jpg', icon: Footprints },
    { id: 'space_rescue', labels: { en: 'Space Rescue' }, image: '/assets/story_icons/story_space.jpg', icon: Rocket },
    { id: 'marshmallow_clouds', labels: { en: 'Cloud Adventure' }, image: '/assets/story_icons/story_clouds.png', icon: Moon },
    { id: 'alien_base', labels: { en: 'Alien Base' }, image: '/assets/story_icons/story_alien.jpg', icon: Globe },
    { id: 'rainbow_palace', labels: { en: 'Pearl Palace' }, image: '/assets/story_icons/story_underwater.jpg', icon: Fish },
];

export const CONTENT_TAGS = [
    { id: 'Dragon', icon: Flame, image: '/assets/themes/dragon.jpg' },
    { id: 'Unicorn', icon: Sparkles, image: '/assets/themes/unicorn.jpg' },
    { id: 'Space', icon: Rocket, image: '/assets/themes/space.jpg' },
    { id: 'Rainbow', icon: Palette, image: '/assets/themes/rainbow.jpg' },
    { id: 'Animal Friend', icon: PawPrint, image: '/assets/themes/animal_friends.jpg' },
    { id: 'Family', icon: Users, image: '/assets/themes/family.jpg' },
    { id: 'Birthday', icon: Cake, image: '/assets/themes/birthday.jpg' },
    { id: 'Music', icon: Music, image: '/assets/themes/music.jpg' },
    { id: 'Ocean', icon: Waves, image: '/assets/themes/ocean.jpg' },
];

export const MOODS = [
    { id: 'happy', labels: { en: 'Happy' }, image: '/assets/mood_icons/mood_sun.jpg', icon: Smile },
    { id: 'adventurous', labels: { en: 'Adventurous' }, image: '/assets/mood_icons/mood_racing.jpg', icon: Rocket },
    { id: 'calm', labels: { en: 'Calm' }, image: '/assets/mood_icons/mood_teddy.jpg', icon: Moon },
    { id: 'mysterious', labels: { en: 'Mysterious' }, image: '/assets/mood_icons/mood_magic.jpg', icon: Sparkles },
    { id: 'silly', labels: { en: 'Silly' }, image: '/assets/mood_icons/mood_party.jpg', icon: Gift },
    { id: 'spooky', labels: { en: 'Spooky' }, image: '/assets/mood_icons/mood_forest.jpg', icon: Hand }
];

export const VOICES = [
    { id: 'standard', label: 'Standard Voice', tier: 'standard', cost: 0, icon: Volume2, description: 'Clear HD voice', demoText: 'Hello! I am the standard narrator voice.', demoUrl: '/assets/audio_demos/standard_preview.mp3' },
    { id: 'kiki', label: 'Kiki (Premium)', tier: 'premium', cost: 20, icon: Volume2, description: '3-5yo girl, cute & curious', demoText: 'Hi there! I\'m Kiki, and I love telling magical stories!', demoUrl: '/assets/audio_demos/kiki_preview.mp3' },
    { id: 'aiai', label: 'Aiai (Premium)', tier: 'premium', cost: 20, icon: Volume2, description: 'British girl, educated', demoText: 'Good day! I\'m Aiai, and I shall narrate your wonderful tale.', demoUrl: '/assets/audio_demos/aiai_preview.mp3' },
    { id: 'titi', label: 'Titi (Premium)', tier: 'premium', cost: 20, icon: Volume2, description: 'Senior male, captivating & cold', demoText: 'Hey! I\'m Titi, and I\'m super excited to tell your story!', demoUrl: '/assets/audio_demos/titi_preview.mp3' },
];

export interface StoryBuilderData {
    storyStyle: string;
    contentTags: string[];
    mood: string;
    voice: string;
    voiceTier: 'standard' | 'premium';
    voiceNote: string;
}

interface StoryBuilderPanelProps {
    onGenerate: (data: StoryBuilderData) => void;
    imageUploaded: boolean;
    userId?: string;
    isRecharging?: boolean;
    rechargeTime?: number;
}

export const StoryBuilderPanel: React.FC<StoryBuilderPanelProps> = ({ onGenerate, imageUploaded, userId, isRecharging, rechargeTime }) => {
    // State
    const [storyStyle, setStoryStyle] = useState(STORY_STYLES[0].id);
    const [contentTags, setContentTags] = useState<string[]>([]);
    const [mood, setMood] = useState(MOODS[0].id);
    const [voice, setVoice] = useState('standard');
    const [voiceTier, setVoiceTier] = useState<'standard' | 'premium'>('standard');
    const [voiceNote, setVoiceNote] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [playingDemo, setPlayingDemo] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);

    const handleSubmit = () => {
        onGenerate({ storyStyle, contentTags, mood, voice, voiceTier, voiceNote });
    };

    // Voice Input Logic
    const toggleVoiceInput = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
        } else {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                recognition.onstart = () => setIsListening(true);
                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setVoiceNote(prev => prev + (prev ? ' ' : '') + transcript);
                };
                recognition.onerror = () => setIsListening(false);
                recognition.onend = () => setIsListening(false);

                recognitionRef.current = recognition;
                recognition.start();
            } else {
                alert('Voice input is not supported in this browser.');
            }
        }
    };

    // Voice Preview Logic
    const playVoiceDemo = async (item: any) => {
        const { id: voiceId, tier: voiceTier, demoText, demoUrl } = item;
        if (playingDemo === voiceId) {
            setPlayingDemo(null);
            return;
        }
        setPlayingDemo(voiceId);

        try {
            if (demoUrl) {
                const check = await fetch(demoUrl, { method: 'HEAD' });
                if (check.ok) {
                    await playAudioWithPitchShift(demoUrl, 1.0, () => setPlayingDemo(null));
                    return;
                }
            }

            const response = await fetch(voiceTier === 'premium' ? '/api/sparkle/speak-premium' : '/api/sparkle/speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: demoText,
                    voiceId: voiceId === 'kiki' ? 'Nggzl2QAXh3OijoXD116' :
                        voiceId === 'aiai' ? 'zrHiDhphv9ZnVXBqCLjf' :
                            voiceId === 'titi' ? 'D38z5RcWu1voky8WS1ja' : undefined,
                    userId: userId || 'demo'
                })
            });

            if (response.ok) {
                const contentType = response.headers.get('Content-Type');
                let audioUrl: string;
                if (contentType?.includes('application/json')) {
                    const data = await response.json();
                    audioUrl = data.audioUrl;
                } else {
                    const arrayBuffer = await response.arrayBuffer();
                    audioUrl = URL.createObjectURL(new Blob([arrayBuffer], { type: 'audio/mp3' }));
                }
                await playAudioWithPitchShift(
                    audioUrl,
                    voiceTier === 'premium' ? 1.0 : 1.1,
                    () => setPlayingDemo(null)
                );
            }
        } catch (error) {
            console.error('Demo playback failed:', error);
            setPlayingDemo(null);
        }
    };

    const isReady = imageUploaded;

    return (
        <div className="w-full flex-1 flex flex-col gap-6">
            {/* 1. Story Style */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-yellow-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">1</span>
                    Where is the story? 🌍
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    {STORY_STYLES.map(item => (
                        <button key={item.id} onClick={() => setStoryStyle(item.id)}
                            className="flex flex-col items-center gap-2 transition-all group">
                            <div className={cn(
                                "relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all shadow-sm",
                                storyStyle === item.id ? "border-yellow-500 ring-2 ring-yellow-300 scale-105" : "border-transparent bg-white/50"
                            )}>
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {storyStyle === item.id && (
                                    <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                    </div>
                                )}
                            </div>
                            <span className={cn("text-[10px] font-black text-center leading-tight", storyStyle === item.id ? "text-yellow-800" : "text-slate-600")}>
                                {item.labels.en.split(':').pop()?.trim()}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. What's Inside */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">2</span>
                    What's inside? (Max 3) 🏷️
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {CONTENT_TAGS.map(tag => {
                        const isSelected = contentTags.includes(tag.id);
                        return (
                            <button key={tag.id} onClick={() => {
                                setContentTags(prev => {
                                    if (prev.includes(tag.id)) return prev.filter(t => t !== tag.id);
                                    if (prev.length >= 3) return prev;
                                    return [...prev, tag.id];
                                });
                            }} className="flex flex-col items-center gap-2 transition-all group">
                                <div className={cn(
                                    "relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all shadow-sm",
                                    isSelected ? "border-blue-500 ring-2 ring-blue-300 scale-105" : "border-transparent bg-white/50"
                                )}>
                                    <img src={tag.image} className="w-full h-full object-cover" />
                                    {isSelected && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                        </div>
                                    )}
                                </div>
                                <span className={cn("text-[10px] font-bold text-center", isSelected ? "text-blue-600" : "text-slate-600")}>{tag.id}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Mood */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-orange-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">3</span>
                    Story Feeling 😊
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    {MOODS.map(item => (
                        <button key={item.id} onClick={() => setMood(item.id)}
                            className="flex flex-col items-center gap-2 transition-all group">
                            <div className={cn(
                                "relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all shadow-sm",
                                mood === item.id ? "border-orange-500 ring-2 ring-orange-300 scale-105" : "border-transparent bg-white/50"
                            )}>
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {mood === item.id && (
                                    <div className="absolute top-1 right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                    </div>
                                )}
                            </div>
                            <span className={cn("text-[10px] font-black text-center leading-tight", mood === item.id ? "text-orange-800" : "text-slate-600")}>
                                {item.labels.en.split('&').shift()?.trim()}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Narrator */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-green-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">4</span>
                    Voice Actor 🎙️
                </h3>
                <div className="flex flex-col gap-2">
                    {VOICES.map(item => (
                        <div key={item.id} className="flex gap-2">
                            <button onClick={() => { setVoice(item.id); setVoiceTier(item.tier as any); }}
                                className={cn(
                                    "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                                    voice === item.id ? "border-green-500 bg-green-50 text-green-700" : "border-transparent bg-white/50 text-slate-500"
                                )}>
                                <item.icon className="w-5 h-5" />
                                <div className="flex-1 text-left">
                                    <span className="text-sm font-bold block">{item.label}</span>
                                    <span className="text-xs text-slate-400">{item.description}</span>
                                </div>
                                {item.cost > 0 && (
                                    <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-0.5 rounded-full font-bold">✨ {item.cost} Points</span>
                                )}
                            </button>
                            <button onClick={() => playVoiceDemo(item)}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all",
                                    playingDemo === item.id ? "bg-purple-100 border-purple-500 text-purple-600" : "bg-white/50 border-transparent text-slate-400"
                                )}>
                                {playingDemo === item.id ? <Volume className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5" />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. Voice Note */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-slate-800">Tell us more (Optional) 🎤</h3>
                    {voiceNote && <button onClick={() => setVoiceNote('')} className="text-xs text-red-500 font-bold">Clear</button>}
                </div>
                <div className="relative">
                    <textarea value={voiceNote} onChange={(e) => setVoiceNote(e.target.value)}
                        placeholder="Add your own story ideas here... 😊"
                        className="w-full p-4 pr-12 rounded-2xl border-2 border-transparent bg-white/50 focus:bg-white focus:border-purple-300 transition-all outline-none h-24 text-sm scrollbar-none"
                    />
                    <button onClick={toggleVoiceInput} className={cn(
                        "absolute right-3 bottom-3 p-2 rounded-xl transition-all shadow-sm",
                        isListening ? "bg-red-500 text-white animate-pulse" : "bg-white text-slate-400 hover:text-purple-600"
                    )}>
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Generate Button - Floating */}
            {/* Generate Button - Standard Flow */}
            <div className="mt-4 pb-8">
                {isRecharging && (
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mb-2">
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 15, ease: "linear" }}
                            className="h-full bg-indigo-400"
                        />
                    </div>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={!imageUploaded || (!voiceNote && !voice) /* Basic validation */ || isRecharging}
                    className={cn(
                        "w-full py-4 text-xl font-black text-white rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 relative overflow-hidden",
                        isRecharging ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:scale-[1.02] active:scale-95 hover:shadow-2xl"
                    )}
                >
                    {isRecharging ? (
                        <>
                            <Sparkles className="w-5 h-5 animate-spin" />
                            Magic Recharging... ({rechargeTime}s)
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-6 h-6 animate-pulse" />
                            Generate Story!
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
