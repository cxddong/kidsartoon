import React, { useRef, useState, useCallback } from 'react';
import { Camera as CameraIcon, RotateCcw, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CameraPage: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            setError('Unable to access camera. Please ensure you have granted permission.');
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    React.useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const capturePhoto = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
            }
        }
    }, []);

    const retake = () => {
        setCapturedImage(null);
    };

    const confirmPhoto = () => {
        // Here you would typically save the image or pass it to the next step
        // For now, we'll just navigate back or to generate page with state
        // navigate('/generate/picture', { state: { image: capturedImage } });
        alert("Photo captured! (Integration pending)");
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
            {error ? (
                <div className="text-white text-center p-6">
                    <p className="mb-4">{error}</p>
                    <button onClick={startCamera} className="bg-primary px-4 py-2 rounded-lg">Try Again</button>
                    <button onClick={() => navigate('/home')} className="block mt-4 text-slate-400 underline">Back Home</button>
                </div>
            ) : (
                <>
                    <div className="relative w-full h-full flex-1 flex items-center justify-center bg-black">
                        {!capturedImage ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-24 bg-gradient-to-t from-black/80 to-transparent flex justify-around items-center">
                        {!capturedImage ? (
                            <button
                                onClick={capturePhoto}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 transition-all active:scale-95"
                            >
                                <div className="w-16 h-16 bg-white rounded-full" />
                            </button>
                        ) : (
                            <>
                                <button onClick={retake} className="p-4 bg-white/20 rounded-full text-white hover:bg-white/30">
                                    <RotateCcw className="w-8 h-8" />
                                </button>
                                <button onClick={confirmPhoto} className="p-4 bg-primary rounded-full text-white hover:bg-primary-hover shadow-lg transform scale-110">
                                    <Check className="w-8 h-8" />
                                </button>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => navigate('/home')}
                        className="absolute top-4 left-4 p-2 bg-black/40 rounded-full text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </>
            )}
        </div>
    );
};
