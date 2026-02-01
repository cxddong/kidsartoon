import React, { useState, useRef } from 'react';
import {
    Wand2, Sparkles, Castle, Map, Moon, ScrollText,
    Smile, Flame, Rocket, Palette, PawPrint,
    Users, Cake, Music, Waves, Mic, MicOff, Check,
    Play, Pause, Volume2, Volume, Globe, Fish, Snowflake,
    TreeDeciduous, Footprints, Hand, Gift, Lock, Brain
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
    { id: 'standard', label: 'Robot Friend', tier: 'standard', cost: 0, image: '/assets/role_icons/icon_robot.png', icon: Volume2, description: '[FREE] Robot Friend', demoText: 'Hello! I am the standard narrator voice.', demoUrl: '/assets/audio_demos/standard_preview.mp3' },
    { id: 'kiki', label: 'Kiki', tier: 'premium', cost: 20, image: '/assets/role_icons/icon_gigi.png', icon: Volume2, description: '20 💎 (Pro FREE ✨)', demoText: 'Hi there! I\'m Kiki, and I love telling magical stories!', demoUrl: '/assets/audio_demos/kiki_preview.mp3' },
    { id: 'aiai', label: 'Aiai', tier: 'premium', cost: 20, image: '/assets/role_icons/icon_lily.png', icon: Volume2, description: '20 💎 (Pro FREE ✨)', demoText: 'Good day! I\'m Aiai, and I shall narrate your wonderful tale.', demoUrl: '/assets/audio_demos/aiai_preview.mp3' },
    { id: 'titi', label: 'Titi', tier: 'premium', cost: 20, image: '/assets/role_icons/icon_leo.png', icon: Volume2, description: '20 💎 (Pro FREE ✨)', demoText: 'Hey! I\'m Titi, and I\'m super excited to tell your story!', demoUrl: '/assets/audio_demos/titi_preview.mp3' },
];

export const MODELS = [
    { id: 'standard', label: 'Quick Story (1 min)', tier: 'standard', cost: 0, image: '/assets/story_icons/icon_basic.png', icon: Sparkles, description: '[FREE] Quick Story' },
    { id: 'gpt5', label: 'Epic Story (3 mins)', tier: 'premium', cost: 50, image: '/assets/story_icons/icon_smartest.png', icon: Brain, description: '50 💎 (Premium ✨) - Double the magic!' },
];

export interface StoryBuilderData {
    storyStyle: string;
    contentTags: string[];
    mood: string;
    voice: string;
    voiceTier: 'standard' | 'premium';
    modelTier: 'standard' | 'premium';
    voiceNote: string;
}

interface StoryBuilderPanelProps {
    onGenerate: (data: StoryBuilderData) => void;
    imageUploaded: boolean;
    userId?: string;
    isRecharging?: boolean;
    rechargeTime?: number;
    userPlan?: string;
}

export const StoryBuilderPanel: React.FC<StoryBuilderPanelProps> = ({ onGenerate, imageUploaded, userId, isRecharging, rechargeTime, userPlan }) => {
    // State
    const [storyStyle, setStoryStyle] = useState(STORY_STYLES[0].id);
    const [contentTags, setContentTags] = useState<string[]>([]);
    const [mood, setMood] = useState(MOODS[0].id);
    const [voice, setVoice] = useState('standard');
    const [voiceTier, setVoiceTier] = useState<'standard' | 'premium'>('standard');
    const [modelTier, setModelTier] = useState<'standard' | 'premium'>('standard');
    const [voiceNote, setVoiceNote] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [playingDemo, setPlayingDemo] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const currentAudioController = useRef<{ stop: () => void } | null>(null);

    // Stop audio on unmount
    React.useEffect(() => {
        return () => {
            if (currentAudioController.current) {
                currentAudioController.current.stop();
                currentAudioController.current = null;
            }
        };
    }, []);

    const handleSubmit = () => {
        if (currentAudioController.current) {
            currentAudioController.current.stop(); // Stop demo before generating
            currentAudioController.current = null;
        }
        onGenerate({ storyStyle, contentTags, mood, voice, voiceTier, modelTier, voiceNote });
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

    const playbackRequestId = useRef(0);

    // Voice Preview Logic
    const playVoiceDemo = async (item: any) => {
        const { id: voiceId, tier: voiceTier, demoText, demoUrl } = item;
        const requestId = ++playbackRequestId.current;

        // 1. Stop any currently playing audio immediately
        if (currentAudioController.current) {
            currentAudioController.current.stop();
            currentAudioController.current = null;
        }

        // Toggle OFF if clicking same icon
        if (playingDemo === voiceId) {
            setPlayingDemo(null);
            return;
        }

        setPlayingDemo(voiceId);

        try {
            let controller;

            if (demoUrl) {
                // Check if file exists first (optional, but good for error catching)
                const check = await fetch(demoUrl, { method: 'HEAD' });
                if (check.ok) {
                    // Check ID before playing (in case check took time)
                    if (playbackRequestId.current !== requestId) return;

                    controller = await playAudioWithPitchShift(demoUrl, 1.0, () => {
                        if (playbackRequestId.current === requestId) setPlayingDemo(null);
                    });
                }
            }

            // Check if ignored during file check or play setup
            if (playbackRequestId.current !== requestId) {
                if (controller) controller.stop();
                return;
            }

            if (!controller) {
                // Fallback / standard generation if no demoUrl or failed
                const endpoint = voiceTier === 'premium' ? '/api/sparkle/speak-minimax' : '/api/sparkle/speak';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: demoText,
                        voiceId: voiceId, // Pass the raw ID (kiki, aiai, titi), backend maps it
                        userId: userId || 'demo'
                    })
                });

                // Check ID after slow fetch
                if (playbackRequestId.current !== requestId) return;

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

                    controller = await playAudioWithPitchShift(
                        audioUrl,
                        voiceTier === 'premium' ? 1.0 : 1.1,
                        () => {
                            if (playbackRequestId.current === requestId) setPlayingDemo(null);
                        }
                    );
                }
            }

            // Final check before storing controller
            if (playbackRequestId.current !== requestId) {
                if (controller) controller.stop();
                return;
            }

            // Store controller so we can stop it later
            if (controller) {
                currentAudioController.current = controller;
            }

        } catch (error) {
            console.error('Demo playback failed:', error);
            if (playbackRequestId.current === requestId) setPlayingDemo(null);
        }
    };

    const isReady = imageUploaded;

    // Helper to check if user is pro
    const isProUser = () => {
        const plan = userPlan || 'free';
        return ['pro', 'yearly', 'yearly_pro', 'admin'].includes(plan);
    };

    const isPro = isProUser();

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
                        <div key={item.id} className="relative aspect-square">
                            <button onClick={() => setStoryStyle(item.id)}
                                className={cn(
                                    "w-full h-full rounded-2xl border-2 transition-all relative overflow-hidden p-0",
                                    storyStyle === item.id ? "border-yellow-500 ring-2 ring-yellow-300 scale-105" : "border-transparent hover:scale-105"
                                )}>
                                <img src={item.image} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 p-2 text-left">
                                    <span className={cn("text-xs font-black block text-white drop-shadow-md leading-tight")}>
                                        {item.labels.en.split(':').pop()?.trim()}
                                    </span>
                                </div>
                                {storyStyle === item.id && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                    </div>
                                )}
                            </button>
                        </div>
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
                            <div key={tag.id} className="relative aspect-square">
                                <button onClick={() => {
                                    setContentTags(prev => {
                                        if (prev.includes(tag.id)) return prev.filter(t => t !== tag.id);
                                        if (prev.length >= 3) return prev;
                                        return [...prev, tag.id];
                                    });
                                }} className={cn(
                                    "w-full h-full rounded-2xl border-2 transition-all relative overflow-hidden p-0",
                                    isSelected ? "border-blue-500 ring-2 ring-blue-300 scale-105" : "border-transparent hover:scale-105"
                                )}>
                                    <img src={tag.image} className="absolute inset-0 w-full h-full object-cover" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                    <div className="absolute inset-x-0 bottom-0 p-2 text-left">
                                        <span className={cn("text-xs font-bold block text-white drop-shadow-md leading-tight")}>{tag.id}</span>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                        </div>
                                    )}
                                </button>
                            </div>
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
                        <div key={item.id} className="relative aspect-square">
                            <button key={item.id} onClick={() => setMood(item.id)}
                                className={cn(
                                    "w-full h-full rounded-2xl border-2 transition-all relative overflow-hidden p-0",
                                    mood === item.id ? "border-orange-500 ring-2 ring-orange-300 scale-105" : "border-transparent hover:scale-105"
                                )}>
                                <img src={item.image} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                <div className="absolute inset-x-0 bottom-0 p-2 text-left">
                                    <span className={cn("text-xs font-black block text-white drop-shadow-md leading-tight")}>
                                        {item.labels.en.split('&').shift()?.trim()}
                                    </span>
                                </div>
                                {mood === item.id && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                    </div>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Narrator */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-green-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">4</span>
                    Voice Actor 🎙️
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {/* Changed from list to grid for better avatar display */}
                    {VOICES.map(item => {
                        const isPremium = item.tier === 'premium';
                        const effectiveCost = isPro ? 0 : item.cost;
                        const isSelected = voice === item.id;

                        return (
                            <div key={item.id} className="relative aspect-square">
                                <button
                                    onClick={() => {
                                        setVoice(item.id);
                                        setVoiceTier(item.tier as any);
                                    }}
                                    className={cn(
                                        "w-full h-full rounded-2xl border-2 transition-all relative overflow-hidden p-0",
                                        isSelected
                                            ? "border-green-500 ring-2 ring-green-300 scale-[1.02]"
                                            : "border-transparent hover:scale-[1.02]"
                                    )}
                                >
                                    {/* Full Image */}
                                    <img src={item.image} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />

                                    {/* Gradient Overlay for Text Readability */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                                    {/* Content Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                                        <span className={cn("text-base font-black block text-white drop-shadow-md")}>{item.label}</span>
                                        <span className="text-xs text-white/90 font-medium block mt-0.5 drop-shadow-sm">{item.description}</span>
                                    </div>

                                    {/* Selected Indicator */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-green-500 rounded-full shadow-lg">
                                            <div className="w-2.5 h-2.5 bg-white rounded-full translate-y-px" />
                                            {/* <Check className="w-3.5 h-3.5 text-white" /> */}
                                        </div>
                                    )}

                                    {/* Cost / Badge Display for Voices */}
                                    {isPremium && (
                                        <div className='absolute top-2 right-9'>
                                            {isPro ? (
                                                <span className="text-[10px] bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm backdrop-blur-sm">PRO FREE</span>
                                            ) : (
                                                <span className="text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full font-bold backdrop-blur-sm border border-white/20">
                                                    -{effectiveCost} 💎
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Audio Preview Button - Floating Top Left */}
                                    <div
                                        onClick={(e) => { e.stopPropagation(); playVoiceDemo(item); }}
                                        className={cn(
                                            "absolute top-2 left-2 p-2 rounded-full cursor-pointer backdrop-blur-md transition-all shadow-lg active:scale-95 group",
                                            playingDemo === item.id ? "bg-green-500 text-white" : "bg-black/30 text-white hover:bg-black/50"
                                        )}
                                    >
                                        {playingDemo === item.id ? <Volume className="w-4 h-4 animate-pulse" /> : <Play className="w-4 h-4 group-hover:fill-current" />}
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 5. Story Smarts (Model Selection) */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-purple-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">5</span>
                    Story Smarts 🧠
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {MODELS.map(item => {
                        const isSelected = modelTier === item.tier;
                        const isPremium = item.tier === 'premium';
                        const effectiveCost = isPro ? 0 : item.cost;
                        // const isStandard = item.id === 'standard'; // Check for standard story

                        return (
                            <div key={item.id} className="relative aspect-square">
                                <button
                                    onClick={() => {
                                        setModelTier(item.tier as any);
                                    }}
                                    className={cn(
                                        "w-full h-full rounded-2xl border-2 transition-all relative overflow-hidden p-0",
                                        isSelected
                                            ? "border-purple-500 ring-2 ring-purple-300 scale-[1.02]"
                                            : "border-transparent hover:scale-[1.02]"
                                    )}
                                >
                                    {/* Full Image */}
                                    <div className="absolute inset-0 w-full h-full bg-slate-100">
                                        <img src={item.image} className="w-full h-full object-cover" />
                                    </div>

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                                    {/* Content Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                                        <span className={cn("text-base font-black block text-white drop-shadow-md")}>{item.label}</span>
                                        <span className="text-xs text-white/90 font-medium block mt-0.5 drop-shadow-sm">{item.description}</span>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full shadow-lg">
                                            {/* Custom dot usage consistent with style selection */}
                                            <div className="w-2.5 h-2.5 bg-white rounded-full translate-y-px" />
                                        </div>
                                    )}

                                    {/* Cost / Badge Display for Models */}
                                    {isPremium ? (
                                        <div className='absolute top-2 left-2'>
                                            {isPro ? (
                                                <span className="text-[10px] bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full font-bold shadow-sm backdrop-blur-sm">PRO FREE</span>
                                            ) : (
                                                <span className="text-[10px] bg-black/50 text-white px-2 py-1 rounded-full font-bold backdrop-blur-sm border border-white/20">
                                                    -{effectiveCost} 💎
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className='absolute top-2 left-2'>
                                            <span className="text-[10px] bg-green-500 text-white px-2 py-1 rounded-full font-bold shadow-sm backdrop-blur-sm shadow-green-200">FREE ✨</span>
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
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
