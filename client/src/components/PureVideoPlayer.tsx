import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface PureVideoPlayerProps {
    src: string;
    className?: string;
}

export const PureVideoPlayer: React.FC<PureVideoPlayerProps> = ({ src, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(videoRef.current.muted);
    };

    useEffect(() => {
        // Auto-play when src changes if possible, but keep muted
        if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
        }
    }, [src]);

    return (
        <div className={`relative overflow-hidden bg-black rounded-lg group ${className || ''}`} onClick={togglePlay}>
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain bg-black"
                playsInline
                loop
                muted // Default muted
                disablePictureInPicture
                controlsList="nodownload noremoteplayback"
                onContextMenu={(e) => e.stopPropagation()}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {/* Play/Pause Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                <button
                    className="p-4 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white hover:scale-110 transition-transform shadow-lg"
                >
                    {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
                </button>
            </div>

            {/* Mute Toggle (Top Right) */}
            <button
                onClick={toggleMute}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors z-10"
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
    );
};
