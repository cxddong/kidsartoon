import { useEffect, useRef, type RefObject } from 'react';

/**
 * Custom hook to force video autoplay on mobile devices
 * Mobile browsers often block autoplay even with autoPlay attribute
 * This hook programmatically calls play() to bypass restrictions
 */
export const useVideoAutoplay = <T extends HTMLVideoElement>() => {
    const videoRef = useRef<T>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Attempt to play video
        const playVideo = async () => {
            try {
                await video.play();
            } catch (error) {
                // Autoplay blocked - will show play button
                console.log('Video autoplay prevented:', error);
            }
        };

        // Play immediately
        playVideo();

        // Also retry on any user interaction
        const handleInteraction = () => {
            playVideo();
            // Remove listener after first interaction
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('click', handleInteraction);
        };

        document.addEventListener('touchstart', handleInteraction, { once: true });
        document.addEventListener('click', handleInteraction, { once: true });

        return () => {
            document.removeEventListener('touchstart', handleInteraction);
            document.removeEventListener('click', handleInteraction);
        };
    }, []);

    return videoRef;
};
