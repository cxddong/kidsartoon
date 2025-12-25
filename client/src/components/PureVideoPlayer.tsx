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
        <div className={`relative overflow-hidden bg-black rounded-lg ${className || ''}`}>
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-contain" // Allow interaction, contain to see full video
                playsInline
                loop
                autoPlay
                muted // Essential for autoplay
                controls // Native controls
                disablePictureInPicture
                controlsList="noremoteplayback" // Allow download
                onContextMenu={(e) => e.stopPropagation()} // Allow context menu
            />
        </div>
    );
};
