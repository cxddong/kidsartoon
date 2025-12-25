import React, { useRef, useState } from 'react';
import { Play } from 'lucide-react';

interface PureVideoPlayerProps {
    src: string;
    className?: string;
}

export const PureVideoPlayer: React.FC<PureVideoPlayerProps> = ({ src, className }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

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

    return (
        <div className={`relative group cursor-pointer overflow-hidden ${className || ''}`} onClick={togglePlay}>
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover pointer-events-none" // Block all mouse events on video to hide browser overlays
                playsInline
                loop
                disablePictureInPicture
                controlsList="nodownload noremoteplayback"
                // onContextMenu is now redundant on video but good safety
                onContextMenu={(e) => e.preventDefault()}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {/* Click Capture Overlay (Transparent) */}
            <div className="absolute inset-0 z-10" />

            {/* Custom Play Button Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-[1px] transition-all hover:bg-black/40">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border border-white/30">
                        <Play className="w-8 h-8 text-white fill-current ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
};
