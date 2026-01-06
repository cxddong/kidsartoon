import { useState, useEffect } from 'react';

const SESSION_KEY = 'kat_puzzle_session';

interface PuzzleSession {
    gamesPlayed: number;
    startTime: number;
    lastReset: number;
}

export function usePuzzleSession() {
    const [session, setSession] = useState<PuzzleSession>(() => {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Reset if last play was more than 4 hours ago
            if (Date.now() - parsed.lastReset > 4 * 60 * 60 * 1000) {
                return { gamesPlayed: 0, startTime: Date.now(), lastReset: Date.now() };
            }
            return parsed;
        }
        return { gamesPlayed: 0, startTime: Date.now(), lastReset: Date.now() };
    });

    useEffect(() => {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }, [session]);

    const incrementGames = () => {
        setSession(prev => ({ ...prev, gamesPlayed: prev.gamesPlayed + 1, lastReset: Date.now() }));
    };

    const resetSession = () => {
        setSession({ gamesPlayed: 0, startTime: Date.now(), lastReset: Date.now() });
    };

    const needsRest = (isAdvanced: boolean) => {
        const playTimeMinutes = (Date.now() - session.startTime) / (60 * 1000);

        if (isAdvanced) {
            // Advanced Mode: 1 game or 20 minutes
            return session.gamesPlayed >= 1 || playTimeMinutes >= 20;
        } else {
            // Kids Mode: 3 games or 10 minutes
            return session.gamesPlayed >= 3 || playTimeMinutes >= 10;
        }
    };

    return { session, incrementGames, resetSession, needsRest };
}
