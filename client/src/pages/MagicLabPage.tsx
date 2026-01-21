import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Loader2, Mic, Volume2, RotateCcw, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { useVideoAutoplay } from '../hooks/useVideoAutoplay';
import magicLabBg from '../assets/magiclab.mp4';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const QUICK_ACTIONS = [
    { emoji: '📚', label: 'Story', prompt: 'I want to create a story' },
    { emoji: '🎨', label: 'Art', prompt: 'Help me make some art' },
    { emoji: '🎬', label: 'Video', prompt: 'I want to make a video' },
    { emoji: '💫', label: 'Surprise Me', prompt: 'Surprise me with something fun!' }
];

export const MagicLabPage: React.FC = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<{ route: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const bgVideoRef = useVideoAutoplay<HTMLVideoElement>();
    const recognitionRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Audio & Streaming Refs
    const audioQueue = useRef<string[]>([]);
    const isPlayingRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const typewriterIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const fullTextRef = useRef(""); // Keeps track of full text being displayed

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial Welcome Message & Audio
    useEffect(() => {
        let isMounted = true;
        const initWelcome = async () => {
            // Only fetch/play if we haven't already populated messages
            if (messages.length > 0 && messages[0].role === 'assistant') return;

            try {
                // 1. Try to get from Cache first (v4 for model/audio update)
                const cachedData = localStorage.getItem('magic_lab_welcome_v4');
                let data;

                if (cachedData) {
                    try {
                        data = JSON.parse(cachedData);
                    } catch (e) {
                        console.error("Invalid cache", e);
                        localStorage.removeItem('magic_lab_welcome');
                    }
                }

                // 2. If no cache, fetch from API
                if (!data) {
                    const res = await fetch('/api/magic-lab/welcome', {
                        method: 'POST',
                    });

                    if (!isMounted) return;

                    data = await res.json();

                    // Cache the result if successful (v4)
                    if (data.message && data.audioUrl) {
                        localStorage.setItem('magic_lab_welcome_v4', JSON.stringify(data));
                    }
                }

                if (!isMounted) return;

                if (data.message) {
                    setMessages([{
                        role: 'assistant',
                        content: data.message
                    }]);
                }

                if (data.audioUrl) {
                    const audio = new Audio(data.audioUrl);
                    audioRef.current = audio;
                    setIsPlaying(true);
                    try {
                        await audio.play();
                    } catch (e) {
                        console.log("Autoplay blocked, waiting for interaction", e);
                    }
                    audio.onended = () => {
                        if (isMounted) setIsPlaying(false);
                        audioRef.current = null;
                    };
                }
            } catch (error) {
                if (!isMounted) return;
                console.error("Failed to load welcome:", error);
                // Fallback to local default if API fails
                setMessages([{
                    role: 'assistant',
                    content: "Heyyy! *stretches and yawns* I'm Magic Kat, your SUPER creative guide! 🐱✨ I was just chasing a laser pointer but NOW I'm here to help YOU make something AMAZING! What do you wanna create??"
                }]);
            }
        };

        if (messages.length === 0) {
            initWelcome();
        }

        return () => {
            isMounted = false;
            // Stop audio if navigating away
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    /**
     * 🎵 Sequential Audio Player
     */
    const playAudioQueue = () => {
        if (isPlayingRef.current || audioQueue.current.length === 0) return;

        isPlayingRef.current = true;
        setIsPlaying(true);
        const nextAudioBase64 = audioQueue.current.shift();
        console.log(`[MagicLab] Playing audio segment. Queue remaining: ${audioQueue.current.length}`);
        const audio = new Audio(`data:audio/mpeg;base64,${nextAudioBase64}`);
        audioRef.current = audio;

        audio.onended = () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            audioRef.current = null;
            playAudioQueue(); // Play next in line
        };

        audio.play().catch(err => {
            console.error('[MagicLab] Audio playback failed:', err);
            isPlayingRef.current = false;
            setIsPlaying(false);
            playAudioQueue();
        });
    };

    /**
     * ⌨️ Smooth Typewriter Effect
     */
    const startTypewriter = (targetText: string, msgIndex: number) => {
        if (typewriterIntervalRef.current) clearInterval(typewriterIntervalRef.current);

        typewriterIntervalRef.current = setInterval(() => {
            setMessages(prev => {
                const newMessages = [...prev];
                const currentContent = newMessages[msgIndex]?.content || "";

                if (currentContent.length < targetText.length) {
                    // Add next character
                    newMessages[msgIndex] = {
                        ...newMessages[msgIndex],
                        content: targetText.slice(0, currentContent.length + 1)
                    };
                    return newMessages;
                } else {
                    // Finished typing this chunk
                    if (typewriterIntervalRef.current) {
                        clearInterval(typewriterIntervalRef.current);
                        typewriterIntervalRef.current = null;
                    }
                    return prev;
                }
            });
        }, 30); // 30ms per character for smooth feel
    };

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        // 1. Cancel any ongoing stream
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        // 2. Clear typewriter
        if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
        }

        const userMessage: Message = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);

        // Add a placeholder for AI response
        const aiMessagePlaceholder: Message = { role: 'assistant', content: "" };
        setMessages(prev => [...prev, aiMessagePlaceholder]);

        const aiMsgIndex = messages.length + 1;

        setInputMessage('');
        setIsLoading(true);
        fullTextRef.current = "";

        // Reset Audio Queue
        audioQueue.current = [];
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        isPlayingRef.current = false;
        setIsPlaying(false);

        try {
            const response = await fetch('/api/magic-lab/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    conversationHistory
                }),
                signal: abortControllerRef.current.signal
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Parse SSE format (data: {...}\n\n)
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || ""; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;

                    try {
                        const data = JSON.parse(line.replace('data: ', ''));

                        if (data.error) {
                            throw new Error(data.error);
                        }

                        if (data.type === 'text') {
                            fullTextRef.current += data.content;
                            // Trigger typewriter to catch up to fullTextRef.current
                            startTypewriter(fullTextRef.current, aiMsgIndex);
                        } else if (data.type === 'audio') {
                            console.log(`[MagicLab] Received audio segment, queueing...`);
                            // Push to audio queue and trigger playback
                            audioQueue.current.push(data.audio);
                            playAudioQueue();
                        } else if (data.type === 'action') {
                            setPendingNavigation({ route: data.action.route });
                        } else if (data.type === 'done') {
                            setConversationHistory(data.conversationHistory);
                        }
                    } catch (e) {
                        console.warn("[MagicLab] SSE Parse Error:", e);
                    }
                }
            }

        } catch (error: any) {
            console.error('Chat error:', error);
            const errorMessage = "Oops! I got distracted by a laser pointer 🔴 Please try again!";
            setMessages(prev => {
                const newMessages = [...prev];
                if (newMessages.length > 0) {
                    newMessages[newMessages.length - 1] = {
                        role: 'assistant',
                        content: errorMessage
                    };
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(inputMessage);
    };

    const startVoiceInput = () => {
        // Stop any ongoing stream or audio
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        if (typewriterIntervalRef.current) {
            clearInterval(typewriterIntervalRef.current);
            typewriterIntervalRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setIsPlaying(false);
        }
        isPlayingRef.current = false;
        audioQueue.current = [];

        // Check browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('Voice recognition is not supported in this browser 🙀');
            return;
        }

        if (isListening) {
            // Stop listening if already active
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US'; // English (US)
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            sendMessage(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleQuickAction = (prompt: string) => {
        sendMessage(prompt);
    };

    const confirmNavigation = () => {
        if (pendingNavigation) {
            navigate(pendingNavigation.route);
            setPendingNavigation(null);
        }
    };

    const cancelNavigation = () => {
        setPendingNavigation(null);
    };

    const handleClearChat = () => {
        if (window.confirm("Start a new conversation?")) {
            setMessages([{
                role: 'assistant',
                content: "Heyyy! *stretches and yawns* I'm Magic Kat, your SUPER creative guide! 🐱✨ I was just chasing a laser pointer but NOW I'm here to help YOU make something AMAZING! What do you wanna create??"
            }]);
            setConversationHistory([]);
            setPendingNavigation(null);
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
            {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <video
                    ref={bgVideoRef}
                    src={magicLabBg}
                    autoPlay
                    loop
                    muted={true}
                    playsInline
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
            </div>

            {/* Header */}
            <header className="p-4 flex items-center justify-between gap-4 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/home')}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-all"
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            Magic Kat Guide ✨
                        </h1>
                        <p className="text-white/80 text-sm font-bold">Your Creative Assistant</p>
                    </div>
                </div>
                <button
                    onClick={handleClearChat}
                    className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-all text-white"
                    title="Start Over"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </header >

            {/* Chat Messages */}
            < div className="flex-1 overflow-y-auto px-4 py-6 z-10 pb-32" >
                <div className="max-w-3xl mx-auto space-y-4">
                    <AnimatePresence>
                        {messages.map((msg, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/90 backdrop-blur-md text-gray-900 border-2 border-purple-200'
                                        }`}
                                >
                                    {msg.role === 'assistant' && (
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm">
                                                🐱
                                            </div>
                                            <span className="text-xs font-bold text-purple-600">Magic Kat</span>
                                        </div>
                                    )}
                                    <p className="text-sm md:text-base whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Loading Indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-start"
                        >
                            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border-2 border-purple-200">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                                    <span className="text-sm text-gray-600">Magic Kat is thinking...</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div >

            {/* Quick Actions (show when no messages or few messages) */}
            {
                messages.length <= 2 && (
                    <div className="fixed bottom-32 left-0 right-0 z-20 px-4">
                        <div className="max-w-3xl mx-auto flex flex-wrap gap-2 justify-center">
                            {QUICK_ACTIONS.map((action, idx) => (
                                <motion.button
                                    key={idx}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleQuickAction(action.prompt)}
                                    className="bg-slate-900/60 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white font-bold text-sm flex items-center gap-2 hover:bg-slate-800/80 transition-all shadow-lg"
                                >
                                    <span>{action.emoji}</span>
                                    {action.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Navigation Confirmation (show when AI suggests a page) */}
            {
                pendingNavigation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-36 left-0 right-0 z-30 px-4"
                    >
                        <div className="max-w-3xl mx-auto flex gap-3 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={confirmNavigation}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl flex items-center gap-2 hover:from-purple-700 hover:to-indigo-700"
                            >
                                <Sparkles className="w-5 h-5" />
                                Let's Go! ✓
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={cancelNavigation}
                                className="bg-white/20 backdrop-blur-md border-2 border-white/40 text-white px-6 py-4 rounded-full font-bold text-lg shadow-xl hover:bg-white/30"
                            >
                                Not Now ✗
                            </motion.button>
                        </div>
                    </motion.div>
                )
            }

            {/* Input Bar */}
            <div className="fixed bottom-20 left-0 right-0 z-30 px-4">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="relative flex gap-2 items-center">
                        {/* Microphone Button Wrapper */}
                        <div className="relative">
                            {!isListening && !isLoading && (
                                <motion.div
                                    initial={{ y: -5, opacity: 0.8 }}
                                    animate={{ y: 5, opacity: 1 }}
                                    transition={{
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        duration: 0.8,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none"
                                >
                                    <div className="flex flex-col items-center">
                                        <ArrowDown className="w-8 h-8 text-yellow-400 fill-yellow-400/50 drop-shadow-[0_2px_8px_rgba(250,204,21,0.6)] stroke-[3px]" />
                                    </div>
                                </motion.div>
                            )}
                            <button
                                type="button"
                                onClick={startVoiceInput}
                                disabled={isLoading}
                                className={`p-4 rounded-full transition-all shadow-xl ${isListening
                                    ? 'bg-red-500 animate-pulse'
                                    : 'bg-purple-600 hover:bg-purple-700'
                                    } text-white disabled:opacity-50`}
                            >
                                <Mic className={`w-6 h-6 ${isListening ? 'animate-bounce' : ''}`} />
                            </button>
                        </div>

                        {/* Text Input */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder={isListening ? "Listening..." : "Ask Magic Kat anything..."}
                                className="w-full bg-white/95 backdrop-blur-md border-2 border-purple-300 rounded-full py-4 px-6 pr-14 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-purple-500 transition-all font-medium shadow-xl"
                                disabled={isLoading || isListening}
                            />

                            {/* Send Button */}
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || isLoading || isListening}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-purple-600 text-white rounded-full hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </button>
                        </div>

                        {/* Speaker Indicator (when AI is speaking) */}
                        {isPlaying && (
                            <div className="p-4 bg-green-500 rounded-full shadow-xl">
                                <Volume2 className="w-6 h-6 text-white animate-pulse" />
                            </div>
                        )}
                    </div>
                </form>
            </div>

            <MagicNavBar />
        </div >
    );
};
