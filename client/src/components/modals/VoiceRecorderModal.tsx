import React, { useState, useRef } from 'react';
import { Mic, Square, Save, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onVoiceCloned: (voiceId: string) => void;
    userId: string;
    provider?: 'minimax' | 'qwen';
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({ isOpen, onClose, onVoiceCloned, userId, provider = 'minimax' }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);

    const TRAINING_TEXT = provider === 'qwen'
        ? "Hello! I am ready to tell amazing stories. My voice can travel to space, dive into the ocean, and explore magical worlds!"
        : "小朋友，请大声读出这段神奇的咒语：在彩虹的尽头，有一座会飞的巧克力城堡。小猫法师挥动魔杖，变出了漫天的糖果雪花。让我们一起开启这场甜蜜的冒险吧！";

    const startRecording = async () => {
        try {
            setError(null);
            chunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Standard MediaRecorder (browser default format, usually webm/ogg)
            const recorder = new MediaRecorder(stream);

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // Browsers often record WebM
                setAudioBlob(blob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Mic Error:", err);
            setError("Could not access microphone. Please allow permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleUpload = async () => {
        if (!audioBlob) return;
        setUploading(true);
        setError(null);

        try {
            // Convert Blob to Base64 (Optional, but Multer handles form-data better usually. 
            // Previous implementation sent JSON with base64, so we stick to that or FormData if backend changed.
            // Wait, backend uses `upload.single('audio')` which expects FormData file, BUT
            // the previous frontend implementation sent JSON `audioBase64`. 
            // Backend `voiceLab.ts` uses `upload.single('audio')`. This means it expects multipart/form-data!
            // The previous frontend code I saw sent JSON: `body: JSON.stringify({ ... audioBase64 ... })`.
            // AND backend checked `if (!req.file)`.
            // THIS MEANS THE PREVIOUS CODE WAS BROKEN OR I MISREAD IT.
            // Let's check the previous `VoiceRecorderModal.tsx` again.
            // It sent: `body: JSON.stringify({ ... audioBase64 ... })`.
            // It sent to `/api/voice-lab/clone`.
            // Backend: `voiceLabRouter.post('/clone', upload.single('audio'), ...)`
            // If backend uses `upload.single('audio')`, it parsers multipart. If body is JSON, `req.file` will be undefined!
            // BUT, `upload.single` might be just middleware. The route handler checks `if (!req.file)`.
            // If the old code was working, maybe there was another text-field handler?
            // Actually, I should switch to FormData to be safe and match the `upload.single` expectation.

            const formData = new FormData();
            // Append file
            const fileCallback = (blob: Blob) => {
                formData.append('audio', blob, 'recording.webm');
                formData.append('userId', userId);
                formData.append('provider', provider);
                formData.append('transcript', TRAINING_TEXT); // Send transcript for language detection

                // Send
                fetch('/api/voice-lab/clone', {
                    method: 'POST',
                    body: formData
                })
                    .then(async (res) => {
                        if (!res.ok) {
                            const d = await res.json();
                            throw new Error(d.error || "Cloning failed");
                        }
                        return res.json();
                    })
                    .then((data) => {
                        onVoiceCloned(data.voiceId);
                        onClose();
                    })
                    .catch((e) => {
                        setError(e.message);
                    })
                    .finally(() => {
                        setUploading(false);
                    });
            };

            // Execute
            fileCallback(audioBlob);

        } catch (e: any) {
            setError(e.message);
            setUploading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full relative overflow-hidden"
                    >
                        {/* Close Button */}
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mic className="w-8 h-8 text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">
                                {provider === 'qwen' ? "Magic Voice Lab 2" : "Create Your Magic Voice"}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                {provider === 'qwen' ? "English Model (Qwen)" : "Chinese Model (MiniMax)"}
                            </p>
                        </div>

                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-6 text-center shadow-sm">
                            <p className="text-lg font-bold text-amber-900 leading-relaxed">
                                "{TRAINING_TEXT}"
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {!audioBlob ? (
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-lg ${isRecording
                                        ? "bg-red-500 text-white animate-pulse shadow-red-200"
                                        : "bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:scale-105"
                                        }`}
                                >
                                    {isRecording ? (
                                        <> <Square className="fill-current" /> Stop Recording </>
                                    ) : (
                                        <> <Mic className="fill-current" /> Start Recording </>
                                    )}
                                </button>
                            ) : (
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setAudioBlob(null)}
                                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl"
                                    >
                                        Record Again
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={uploading}
                                        className="flex-1 py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                                    >
                                        {uploading ? <Loader2 className="animate-spin" /> : <Save />}
                                        {uploading ? "Creating..." : "Create Voice"}
                                    </button>
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center font-bold">
                                    {error}
                                </div>
                            )}

                            <div className="text-center text-xs text-slate-400 font-medium">
                                Cost: <span className="text-purple-500 font-bold">-500 pts</span> (One-time)
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
