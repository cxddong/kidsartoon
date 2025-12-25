import React, { useRef, useState, useEffect } from 'react';
import { Loader2, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming utils exists, or simple className join

interface UniversalVideoPlayerProps {
    source: string;
    className?: string;
    poster?: string;
    loop?: boolean;
    autoPlay?: boolean;
}

export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
    source,
    className = "",
    poster,
    loop = true,
    autoPlay = true
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        setIsLoading(true);
    }, [source]);

    return (
        <div className={cn("relative overflow-hidden bg-black", className)}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/10">
                    <Loader2 className="w-8 h-8 text-white/80 animate-spin" />
                </div>
            )}
            <video
                ref={videoRef}
                src={source}
                poster={poster}
                loop={loop}
                autoPlay={autoPlay}
                muted={isMuted}
                playsInline
                className="w-full h-full object-cover"
                controlsList="nodownload noremoteplayback"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => setIsLoading(false)}
                onLoadedData={() => setIsLoading(false)}
            />
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                }}
                className="absolute bottom-3 right-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-sm transition-colors z-20"
            >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
        </div>
    );
};
