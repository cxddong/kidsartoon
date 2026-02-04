import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Wand2, X, Loader2, Play, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceCloneModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCloneSuccess: (voiceId: string) => void;
    userId: string;
}

export const VoiceCloneModal: React.FC<VoiceCloneModalProps> = ({ isOpen, onClose, onCloneSuccess, userId }) => {
    const [voiceName, setVoiceName] = useState("My Voice");
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Record, 2: Clone, 3: Done
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isCloning, setIsCloning] = useState(false);
    const [clonedVoiceId, setClonedVoiceId] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const audioChunksRef = useRef<Blob[]>([]);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<any>(null);

    const REQUIRED_TEXT = "I am ready to tell a magical story!";

    useEffect(() => {
        if (isOpen) {
            resetState();
        }
    }, [isOpen]);

    const resetState = () => {
        setStep(1);
        setIsRecording(false);
        setAudioBlob(null);
        setAudioUrl(null);
        setIsCloning(false);
        setClonedVoiceId(null);
        setRecordingTime(0);
        setVoiceName("My Voice");
        audioChunksRef.current = [];
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stopTimer();
            };

            mediaRecorder.start();
            setIsRecording(true);
            startTimer();
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const startTimer = () => {
        setRecordingTime(0);
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleClone = async () => {
        if (!audioBlob || isCloning) return;

        setIsCloning(true);
        setStep(2);

        try {
            // Create a File object from Blob
            const file = new File([audioBlob], "recording.webm", { type: "audio/webm" });

            const formData = new FormData();
            formData.append('audio', file);
            formData.append('userId', userId);
            formData.append('transcript', REQUIRED_TEXT);
            formData.append('voiceName', voiceName.trim() || "My Voice");

            console.log('[VoiceClone] Uploading audio file:', file.name, file.size, 'bytes');

            const response = await fetch('/api/voice-lab/clone', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                console.error("Clone failed response:", result);
                throw new Error(result.error || result.details || 'Voice cloning failed');
            }

            console.log('[VoiceClone] Success! Voice ID:', result.voiceId);

            if (onCloneSuccess && result.voiceId) {
                onCloneSuccess(result.voiceId);
                setClonedVoiceId(result.voiceId);
                setStep(3);
            }

        } catch (error: any) {
            console.error('[VoiceClone] Error:', error);
            alert("Failed to clone voice: " + error.message);
            setStep(1); // Go back to retry
        } finally {
            setIsCloning(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                <Mic className="w-5 h-5 text-indigo-500" />
                                Voice Lab
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* Step 1: Record & Review */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div className="text-center space-y-2">
                                        <h3 className="text-xl font-bold text-slate-800">
                                            {!audioBlob ? "Record Your Voice" : "Review Recording"}
                                        </h3>
                                        <p className="text-slate-500 text-sm px-4">
                                            {!audioBlob ? (
                                                <>
                                                    Please read this sentence clearly:<br />
                                                    <span className="font-bold text-indigo-600">"{REQUIRED_TEXT}"</span>
                                                </>

                                            ) : "Sound good? Give it a name!"}
                                        </p>
                                    </div>

                                    {!audioBlob ? (
                                        <div className="flex flex-col items-center gap-4 py-4">
                                            <button
                                                onClick={isRecording ? stopRecording : startRecording}
                                                className={cn(
                                                    "w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl",
                                                    isRecording ? "bg-red-500 animate-pulse ring-4 ring-red-200" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
                                                )}
                                            >
                                                {isRecording ? <Square className="w-10 h-10 text-white fill-current" /> : <Mic className="w-10 h-10 text-white" />}
                                            </button>
                                            <div className="font-mono text-slate-400 font-bold">
                                                {isRecording ? `${recordingTime}s` : "Tap to Record"}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full space-y-4">
                                            <div className="flex items-center gap-4 bg-slate-100 p-3 rounded-xl">
                                                <button
                                                    onClick={() => { const a = new Audio(audioUrl!); a.play(); }}
                                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-105"
                                                >
                                                    <Play className="w-4 h-4 text-indigo-600 fill-current" />
                                                </button>
                                                <div className="flex-1 h-1 bg-slate-300 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500 w-full opacity-50" />
                                                </div>
                                                <button onClick={resetState} className="text-slate-400 hover:text-red-500">
                                                    <RotateCcw className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Voice Name Input */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Name Your Voice</label>
                                                <input
                                                    type="text"
                                                    value={voiceName}
                                                    onChange={(e) => setVoiceName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                                    placeholder="e.g. Storyteller Mom"
                                                    maxLength={20}
                                                />
                                            </div>

                                            <button
                                                onClick={handleClone}
                                                disabled={!voiceName.trim() || recordingTime < 10}
                                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                                            >
                                                <Wand2 className="w-4 h-4" />
                                                {recordingTime < 10 ? `Record at least 10s (${10 - recordingTime}s left)` : "Clone Voice (20 💎)"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Cloning */}
                            {step === 2 && (
                                <div className="py-10 text-center space-y-4">
                                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Brewing Magic Potion...</h3>
                                        <p className="text-slate-500 text-sm">Analyzing your voice patterns</p>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Success */}
                            {step === 3 && (
                                <div className="py-8 text-center space-y-6">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                        <Check className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Voice Cloned!</h3>
                                        <p className="text-slate-500 text-sm">Your custom voice is ready to use.</p>
                                    </div>
                                    <div className="bg-slate-100 p-3 rounded-lg font-mono text-xs text-slate-600 break-all select-all">
                                        ID: {clonedVoiceId}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch('/api/voice-lab/preview', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            text: "Hello! This is my new magical voice.",
                                                            voiceId: clonedVoiceId,
                                                            customVoiceId: clonedVoiceId,
                                                            userId: userId
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error("Preview failed");
                                                    const blob = await res.blob();
                                                    const url = URL.createObjectURL(blob);
                                                    const audio = new Audio(url);
                                                    audio.play();
                                                } catch (e) {
                                                    console.error("Preview failed", e);
                                                    alert("Could not play preview.");
                                                }
                                            }}
                                            className="flex-1 py-3 bg-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-200 flex items-center justify-center gap-2"
                                        >
                                            <Play className="w-4 h-4" /> Test Voice
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="flex-[2] py-3 bg-green-500 text-white font-bold rounded-xl shadow-md hover:bg-green-600"
                                        >
                                            Start Using It
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
