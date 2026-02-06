import React, { useState, useRef } from 'react';
import {
    Wand2, Sparkles, Castle, Map, Moon, ScrollText,
    Smile, Flame, Rocket, Palette, PawPrint,
    Users, Cake, Music, Waves, Mic, MicOff, Check,
    Play, Pause, Volume2, Volume, Globe, Fish, Snowflake,
    TreeDeciduous, Footprints, Hand, Gift, Lock, Brain, Trash2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { playAudioWithPitchShift } from '../../lib/audioUtils';
import { VoiceCloneModal } from '../../components/voice/VoiceCloneModal';
import { STORY_STYLES, MOODS, VOICES, CONTENT_TAGS, MODELS, type StoryBuilderData } from '../../data/storyOptions';

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
    const [customVoices, setCustomVoices] = useState<any[]>([]);

    const fetchCustomVoices = async () => {
        if (!userId || userId === 'guest') return;
        try {
            const res = await fetch(`/api/voice-lab/voices?userId=${userId}&t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                console.log("[StoryBuilder] Fetched custom voices:", data.voices);
                setCustomVoices(data.voices || []);
            } else {
                console.error("[StoryBuilder] Failed to fetch voices:", res.status);
            }
        } catch (e) {
            console.error("Failed to fetch custom voices", e);
        }
    };

    React.useEffect(() => {
        fetchCustomVoices();
    }, [userId]);

    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

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

    const handleDeleteVoice = async (voiceId: string) => {
        if (!window.confirm("Are you sure you want to delete this magic voice?")) return;

        try {
            const res = await fetch(`/api/voice-lab/voices/${voiceId}?userId=${userId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Refresh list
                fetchCustomVoices();
                if (voice === voiceId) {
                    setVoice('standard');
                    setVoiceTier('standard');
                }
            } else {
                const data = await res.json();
                alert("Failed to delete voice: " + (data.error || "Unknown error"));
            }
        } catch (e) {
            console.error("Delete failed", e);
            alert("Delete failed. Please check your connection.");
        }
    };

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
                // Determine Endpoint: Use Voice Lab for Premium/Qwen voices
                const isQwenVoice = ['aiden', 'ryan', 'mochi', 'my_voice'].includes(voiceId) || customVoices.some(cv => cv.id === voiceId);
                const endpoint = isQwenVoice ? '/api/voice-lab/preview' : '/api/sparkle/speak';

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: demoText,
                        voiceId: voiceId,
                        userId: userId || 'demo',
                        customVoiceId: customVoices.find(cv => cv.id === voiceId) ? voiceId : undefined // Pass custom ID
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
            <VoiceCloneModal
                isOpen={isCloneModalOpen}
                onClose={() => setIsCloneModalOpen(false)}
                onCloneSuccess={(voiceOrId) => {
                    if (typeof voiceOrId === 'object' && voiceOrId.id) {
                        // Optimistic Update: Add to list immediately
                        console.log("[StoryBuilder] Optimistic add:", voiceOrId);
                        setCustomVoices(prev => {
                            // Deduplicate
                            const exists = prev.find(v => v.id === voiceOrId.id);
                            if (exists) return prev;
                            return [voiceOrId, ...prev];
                        });
                        setVoice(voiceOrId.id);
                    } else {
                        // Fallback: Refresh list
                        fetchCustomVoices();
                        setVoice(voiceOrId);
                    }
                    // Double-check refresh after 1.5s to catch eventual consistency
                    setTimeout(() => fetchCustomVoices(), 1500);

                    setIsCloneModalOpen(false);
                }}
                userId={userId || 'guest'}
            />
            {/* 1. Story Style */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-orange-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">1</span>
                    Story World 🏰
                </h3>

                <div className="grid grid-cols-3 gap-3">
                    {STORY_STYLES.map((style) => {
                        const isSelected = storyStyle === style.id;
                        return (
                            <div key={style.id} className="relative aspect-square">
                                <button
                                    onClick={() => setStoryStyle(style.id)}
                                    className={cn(
                                        "w-full h-full rounded-2xl border-2 transition-all relative overflow-hidden p-0",
                                        isSelected
                                            ? "border-orange-500 ring-2 ring-orange-200 scale-[1.02]"
                                            : "border-transparent hover:scale-[1.02]"
                                    )}
                                >
                                    <img src={style.image} alt={style.labels.en} className="absolute inset-0 w-full h-full object-cover" />
                                    {/* Removed Gradient Overlay */}

                                    {/* Icon Badge */}
                                    <div className="absolute top-2 right-2 w-8 h-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                                        <style.icon className="w-4 h-4 text-white" />
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                                        <span className={cn("text-base font-black block text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-tight")}>{style.labels.en}</span>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-2 right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                            <Check className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 2. Content Tags */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-pink-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">2</span>
                    Magic Elements ✨ <span className="text-xs font-normal text-slate-500 ml-auto">(Pick up to 3)</span>
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {CONTENT_TAGS.map((tag) => {
                        const isSelected = contentTags.includes(tag.id);
                        return (
                            <div key={tag.id} className="relative aspect-square">
                                <button
                                    onClick={() => {
                                        if (isSelected) {
                                            setContentTags(prev => prev.filter(t => t !== tag.id));
                                        } else {
                                            if (contentTags.length < 3) {
                                                setContentTags(prev => [...prev, tag.id]);
                                            }
                                        }
                                    }}
                                    className={cn(
                                        "w-full h-full rounded-2xl border-2 transition-all relative overflow-hidden p-0",
                                        isSelected
                                            ? "border-pink-500 ring-2 ring-pink-200 scale-95"
                                            : "border-transparent hover:scale-[1.02]"
                                    )}
                                >
                                    <img src={tag.image} alt={tag.id} className="absolute inset-0 w-full h-full object-cover" />
                                    {/* Removed Color Overlay */}

                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center">
                                        <tag.icon className={cn("w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1 transition-transform", isSelected ? "scale-110" : "")} />
                                        <span className="text-[10px] font-bold text-white leading-tight drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{tag.id}</span>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center border border-white">
                                            <Check className="w-3 h-3 text-white" />
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
                    <span className="bg-blue-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">3</span>
                    Story Vibe 🎭
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {MOODS.map((m) => {
                        const isSelected = mood === m.id;
                        return (
                            <div key={m.id} className="relative aspect-square">
                                <button
                                    onClick={() => setMood(m.id)}
                                    className={cn(
                                        "w-full h-full rounded-2xl border-2 transition-all relative overflow-hidden p-0",
                                        isSelected
                                            ? "border-blue-500 ring-2 ring-blue-200 scale-[1.02]"
                                            : "border-transparent hover:scale-[1.02]"
                                    )}
                                >
                                    <img src={m.image} alt={m.labels.en} className="absolute inset-0 w-full h-full object-cover" />
                                    {/* Removed Gradient Overlay */}

                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                                        <m.icon className={cn("w-6 h-6 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mb-1", isSelected ? "text-blue-200" : "")} />
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 p-2 text-center">
                                        <span className="text-[10px] font-bold text-white leading-tight block drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{m.labels.en}</span>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border border-white">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 4. Voice Actor (V6 Redesign: Two-Tier Layout) */}
            <div className="p-5 bg-white/50 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50">
                <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <span className="bg-green-400 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs">4</span>
                    Voice Actor 🎙️
                </h3>

                {/* Section A: Professional Narrators (Horizontal Scroll) */}
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Professional Narrators</h4>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {VOICES.map((item) => {
                            const isPremium = item.tier === 'premium';
                            const effectiveCost = isPro ? 0 : 5; // Fixed 5 gems for Pro voices as per V6 spec
                            const isSelected = voice === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setVoice(item.id);
                                        setVoiceTier(item.tier as any);
                                    }}
                                    className={cn(
                                        "relative flex-shrink-0 w-24 flex flex-col items-center gap-2 group snap-start transition-all",
                                        isSelected ? "scale-105" : "opacity-70 hover:opacity-100 hover:scale-105"
                                    )}
                                >
                                    {/* Avatar Circle */}
                                    <div className={cn(
                                        "w-20 h-20 rounded-full p-1 border-2 relative shadow-md transition-all",
                                        isSelected ? "border-green-500 bg-white" : "border-transparent bg-white/50"
                                    )}>
                                        <img src={item.image} className="w-full h-full rounded-full object-cover" />

                                        {/* Audio Preview Icon */}
                                        <div
                                            onClick={(e) => { e.stopPropagation(); playVoiceDemo(item); }}
                                            className={cn(
                                                "absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-sm border border-white transition-all",
                                                playingDemo === item.id ? "bg-green-500 text-white animate-pulse" : "bg-white text-slate-400 hover:bg-slate-100"
                                            )}
                                        >
                                            {playingDemo === item.id ? <Volume className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                                        </div>
                                    </div>

                                    {/* Label & Cost */}
                                    <div className="text-center">
                                        <span className={cn("block text-sm font-bold leading-tight", isSelected ? "text-slate-800" : "text-slate-600")}>{item.label}</span>
                                        {isPremium ? (
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {isPro ? "PRO FREE" : `5 💎`}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-green-600">FREE</span>
                                        )}
                                    </div>

                                    {isSelected && (
                                        <div className="absolute -top-2 right-4 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Section B: Magic Voice Lab (Prominent Card) */}
                <div className="relative">
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
                        Magic Voice Lab <Sparkles className="w-4 h-4 text-purple-500" />
                    </h4>

                    {customVoices.length > 0 ? (
                        /* ACTIVE STATE: User has custom voices */
                        <div className="grid grid-cols-1 gap-3">
                            {customVoices.map((cv) => {
                                const isSelected = voice === cv.id;
                                return (
                                    <div key={cv.id}
                                        className={cn(
                                            "relative w-full bg-white rounded-3xl p-4 border-2 transition-all shadow-md group overflow-hidden",
                                            isSelected ? "border-purple-500 ring-2 ring-purple-100" : "border-slate-100 hover:border-purple-200"
                                        )}
                                        onClick={() => {
                                            setVoice(cv.id);
                                            setVoiceTier('premium');
                                        }}
                                    >
                                        <div className="flex items-center gap-4 relative z-10 pr-10">
                                            {/* Avatar */}
                                            <div className="w-16 h-16 rounded-full border-2 border-purple-100 p-0.5 shadow-sm bg-white shrink-0">
                                                <img
                                                    src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${cv.id}`}
                                                    className="w-full h-full rounded-full bg-purple-50"
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-black text-slate-800 text-lg">{cv.name}</h5>
                                                    <span className="bg-purple-100 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Master's Voice</span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">Ready to narrate your story!</p>
                                            </div>

                                            {/* BIG Play Button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); playVoiceDemo({ ...cv, demoText: "I am the master of this story!" }); }}
                                                className={cn(
                                                    "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md border-2",
                                                    playingDemo === cv.id ? "bg-purple-500 text-white border-purple-500 scale-110" : "bg-white text-purple-600 border-purple-100 hover:bg-purple-50 hover:scale-105"
                                                )}
                                            >
                                                {playingDemo === cv.id ? <Volume className="w-6 h-6 animate-pulse" /> : <Play className="w-6 h-6 ml-0.5" />}
                                            </button>

                                            {/* Top Right: Delete & Selected Badge */}
                                            <div className="absolute -top-2 -right-2 flex flex-col gap-2">
                                                {isSelected && (
                                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteVoice(cv.id); }}
                                                    className="w-6 h-6 rounded-full bg-white text-slate-300 border border-slate-100 flex items-center justify-center hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                                                    title="Delete Voice"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Background Decoration */}
                                        <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-purple-100/50 to-transparent rounded-bl-[100px] pointer-events-none" />

                                        {/* Selected Badge */}

                                    </div>
                                );
                            })}

                            {/* Add Another Voice Button (Small) */}
                            <button
                                onClick={() => setIsCloneModalOpen(true)}
                                className="w-full py-3 mt-2 text-sm text-purple-600 font-bold hover:bg-purple-50 rounded-xl transition-colors flex items-center justify-center gap-2 dashed border border-purple-200"
                            >
                                <Mic className="w-4 h-4" /> Add Another Voice (20 💎)
                            </button>
                        </div>
                    ) : (
                        /* EMPTY STATE: "Plus" Card */
                        <button
                            onClick={() => setIsCloneModalOpen(true)}
                            className="w-full aspect-[2/1] rounded-3xl border-4 border-dashed border-purple-200 bg-purple-50/50 hover:bg-purple-100/50 hover:border-purple-300 transition-all group relative overflow-hidden flex flex-col items-center justify-center gap-3"
                        >
                            {/* Background Image (Subtle) */}
                            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                <img src="/assets/voice_lab_bg.png" className="w-full h-full object-cover" />
                            </div>

                            {/* Content */}
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                    <Mic className="w-8 h-8 text-purple-600" />
                                </div>
                                <h5 className="text-lg font-black text-purple-900">+ Add My Magic Voice</h5>
                                <p className="text-sm font-bold text-purple-500">Clone your voice in 15 seconds!</p>
                                <span className="mt-2 text-xs bg-white/80 backdrop-blur text-purple-800 px-3 py-1 rounded-full font-bold shadow-sm">
                                    20 💎 / Free for Pro
                                </span>
                            </div>
                        </button>
                    )}
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
                        const effectiveCost = isPro ? 0 : 15; // User said 15 gems for story generation

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

            {/* 6. Voice Note */}
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
