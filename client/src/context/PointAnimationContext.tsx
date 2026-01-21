import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CircleDollarSign } from 'lucide-react';

interface PointAnimationContextType {
    animatePoints: (start: { x: number; y: number }, amount: number) => void;
    targetRef: React.RefObject<HTMLDivElement | null>;
}

const PointAnimationContext = createContext<PointAnimationContextType | null>(null);

export const usePointAnimation = () => {
    const context = useContext(PointAnimationContext);
    if (!context) throw new Error('usePointAnimation must be used within PointAnimationProvider');
    return context;
};

interface FlyingCoin {
    id: string;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
}

export const PointAnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const targetRef = useRef<HTMLDivElement>(null);
    const [coins, setCoins] = useState<FlyingCoin[]>([]);

    // Generate deterministic random offset
    const getOffset = (seed: number) => (Math.sin(seed) * 20);

    const animatePoints = useCallback((start: { x: number; y: number }, amount: number) => {
        if (!targetRef.current) return;

        const rect = targetRef.current.getBoundingClientRect();
        // Target center
        const targetX = rect.left + rect.width / 2;
        const targetY = rect.top + rect.height / 2;

        const count = Math.min(Math.abs(amount), 10); // Max 10 coins visually
        const newCoins: FlyingCoin[] = [];

        // If deducting (negative), fly FROM balance TO start
        // If adding (positive), fly FROM start TO balance
        const isDeduction = amount < 0;

        const finalStartX = isDeduction ? targetX : start.x;
        const finalStartY = isDeduction ? targetY : start.y;
        const finalTargetX = isDeduction ? start.x : targetX;
        const finalTargetY = isDeduction ? start.y : targetY;

        for (let i = 0; i < count; i++) {
            newCoins.push({
                id: Math.random().toString(36).substr(2, 9),
                startX: finalStartX,
                startY: finalStartY,
                targetX: finalTargetX,
                targetY: finalTargetY
            });
        }

        setCoins(prev => [...prev, ...newCoins]);
    }, []);

    const removeCoin = (id: string) => {
        setCoins(prev => prev.filter(c => c.id !== id));
    };

    return (
        <PointAnimationContext.Provider value={{ animatePoints, targetRef }}>
            {children}
            {/* Animation Layer */}
            <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                <AnimatePresence>
                    {coins.map((coin, i) => (
                        <Coin
                            key={coin.id}
                            coin={coin}
                            index={i}
                            onComplete={() => removeCoin(coin.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </PointAnimationContext.Provider>
    );
};

const Coin = ({ coin, index, onComplete }: { coin: FlyingCoin, index: number, onComplete: () => void }) => {
    // Add some random spread to start
    const spreadX = (Math.random() - 0.5) * 50;
    const spreadY = (Math.random() - 0.5) * 50;

    return (
        <motion.div
            initial={{
                x: coin.startX + spreadX,
                y: coin.startY + spreadY,
                scale: 0,
                opacity: 0
            }}
            animate={{
                x: coin.targetX,
                y: coin.targetY,
                scale: [0.5, 1.2, 0.4],
                opacity: [0, 1, 0.8]
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
                duration: 0.8 + (index * 0.05),
                ease: "easeInOut",
                times: [0, 0.6, 1]
            }}
            onAnimationComplete={onComplete}
            className="absolute text-yellow-400 drop-shadow-md"
        >
            <Sparkles size={20} fill="currentColor" />
        </motion.div>
    );
};
