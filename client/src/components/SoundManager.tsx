import React, { useEffect, useRef } from 'react';

export const SoundManager: React.FC = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        // Initialize AudioContext on first user interaction to handle autoplay policies
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
        };

        const playClickSound = () => {
            if (!audioContextRef.current) initAudio();
            const ctx = audioContextRef.current;
            if (!ctx) return;

            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc.connect(gainNode);
            gainNode.connect(ctx.destination);

            // "Cute Bubble" Pop
            osc.type = 'sine';

            // Pitch Bend UP (Bubble effect)
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.08);

            // Envelope (Attack -> Decay)
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01); // Quick attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08); // Fade out

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.08);
        };

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // Check if clicked element is a button, link, or interactive element
            if (target.closest('button') || target.closest('a') || target.closest('[role="button"]') || target.closest('.cursor-pointer')) {
                playClickSound();
            }
        };

        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, []);

    return null;
};
