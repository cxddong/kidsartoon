import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, Loader2, Mic, Volume2 } from 'lucide-react';
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
    const [messages, setMessages] = useState<Message[]>([{
        role: 'assistant',
        content: "Hi! I'm Magic Kat, your creative guide! 🐱✨ What would you like to make today?"
    }]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const bgVideoRef = useVideoAutoplay<HTMLVideoElement>();
    const recognitionRef = useRef<any>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (content: string) => {
        if (!content.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/magic-lab/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: content,
                    conversationHistory
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Add AI response
            const aiMessage: Message = { role: 'assistant', content: data.reply };
            setMessages(prev => [...prev, aiMessage]);
            setConversationHistory(data.conversationHistory);

            // Play AI voice response if available
            if (data.audioUrl) {
                const audio = new Audio(data.audioUrl);
                setIsPlaying(true);
                audio.play().catch(err => console.error('Audio playback failed:', err));
                audio.onended = () => setIsPlaying(false);
            }

            // Handle navigation action
            if (data.action?.type === 'navigate') {
                setTimeout(() => {
                    navigate(data.action.route);
                }, 1500); // Small delay so user can read the message
            }

        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: "Oops! I got distracted by a laser pointer 🔴 Please try again!"
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(inputMessage);
    };

    const startVoiceInput = () => {
        // Check browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert('语音识别在当前浏览器不支持 🙀');
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
        recognition.lang = 'zh-CN'; // Chinese, can auto-detect or set to 'en-US'
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

    return (
        <div className="relative min-h-screen overflow-hidden bg-black flex flex-col">
            {/* Background Video */}
            <div className="absolute inset-0 z-0">
                <video
                    ref={bgVideoRef}
                    src={magicLabBg}
                    autoPlay
                    loop
                    muted
                    playsInline
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
            </header>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 z-10 pb-32">
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
            </div>

            {/* Quick Actions (show when no messages or few messages) */}
            {messages.length <= 2 && (
                <div className="fixed bottom-32 left-0 right-0 z-20 px-4">
                    <div className="max-w-3xl mx-auto flex flex-wrap gap-2 justify-center">
                        {QUICK_ACTIONS.map((action, idx) => (
                            <motion.button
                                key={idx}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleQuickAction(action.prompt)}
                                className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 text-white font-bold text-sm flex items-center gap-2 hover:bg-white/30 transition-all"
                            >
                                <span>{action.emoji}</span>
                                {action.label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Bar */}
            <div className="fixed bottom-20 left-0 right-0 z-30 px-4">
                <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                    <div className="relative flex gap-2 items-center">
                        {/* Microphone Button */}
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
        </div>
    );
};
