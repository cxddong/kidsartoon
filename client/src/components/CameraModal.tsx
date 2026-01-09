// client/src/components/CameraModal.tsx

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera as CameraIcon, RotateCcw, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface CameraModalProps {
    isOpen: boolean;
    onCapture: (imageDataUrl: string) => void;
    onClose: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Use back camera on mobile
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            setError('Unable to access camera. Please ensure you have granted permission.');
            console.error('[CameraModal] Camera access error:', err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        if (isOpen) {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen]);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(dataUrl);
            }
        }
    }, []);

    const retake = () => {
        setCapturedImage(null);
    };

    const confirmPhoto = () => {
        if (capturedImage) {
            onCapture(capturedImage);
            setCapturedImage(null);
            stopCamera();
        }
    };

    const handleClose = () => {
        setCapturedImage(null);
        stopCamera();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {error ? (
                <div className="flex-1 flex items-center justify-center text-white text-center p-6">
                    <div>
                        <CameraIcon className="w-16 h-16 mx-auto mb-4 text-red-400" />
                        <p className="mb-4 text-lg">{error}</p>
                        <button onClick={startCamera} className="bg-purple-500 px-6 py-3 rounded-xl font-bold mb-2">
                            Try Again
                        </button>
                        <button onClick={handleClose} className="block mx-auto text-slate-400 underline mt-4">
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Camera/Preview Area */}
                    <div className="relative w-full flex-1 flex items-center justify-center bg-black overflow-hidden">
                        {!capturedImage ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                disablePictureInPicture
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-safe bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                        <div className="flex justify-around items-center max-w-md mx-auto">
                            {!capturedImage ? (
                                <>
                                    <button
                                        onClick={handleClose}
                                        className="p-4 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-md"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>

                                    <button
                                        onClick={capturePhoto}
                                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 transition-all active:scale-95 backdrop-blur-md"
                                    >
                                        <div className="w-16 h-16 bg-white rounded-full" />
                                    </button>

                                    <div className="w-16"></div> {/* Spacer for centering */}
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={retake}
                                        className="p-4 bg-white/20 rounded-full text-white hover:bg-white/30 backdrop-blur-md flex flex-col items-center gap-2"
                                    >
                                        <RotateCcw className="w-7 h-7" />
                                        <span className="text-xs font-bold">Retake</span>
                                    </button>

                                    <button
                                        onClick={confirmPhoto}
                                        className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white hover:scale-105 shadow-2xl transform transition-all flex flex-col items-center gap-2"
                                    >
                                        <Check className="w-8 h-8" />
                                        <span className="text-sm font-bold">Use Photo</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
