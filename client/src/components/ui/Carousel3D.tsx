
import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '../../lib/utils';
import { playUiSound } from '../../utils/SoundSynth';

interface CarouselItem {
    id: string;
    label: string;
    icon: any;
    image?: string;
}

interface Carousel3DProps {
    items: CarouselItem[];
    selectedId: string;
    onSelect: (id: string) => void;
}

export const Carousel3D: React.FC<Carousel3DProps> = ({ items, selectedId, onSelect }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Physics State ---
    const rotationX = useMotionValue(0);
    const velocity = useRef(0);
    const isDragging = useRef(false);
    const lastY = useRef(0);
    const lastTime = useRef(0);
    const animationFrame = useRef<number>(0);

    // Constants for 3D Halo
    // Slightly smaller radius to fit container
    const RADIUS = 110;
    const ANGLE_PER_ITEM = 360 / items.length;

    // --- Interaction Handlers (Vertical) ---
    const handlePointerDown = (e: React.PointerEvent) => {
        isDragging.current = true;
        lastY.current = e.clientY;
        lastTime.current = performance.now();
        velocity.current = 0;

        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        (e.target as Element).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;

        const now = performance.now();
        const deltaY = e.clientY - lastY.current;
        const deltaTime = now - lastTime.current;

        // Drag Sensitivity (Positive = Natural Scroll)
        // Drag Down (Pos Y) -> Content Moves Down (Pos Y) -> Angle Increases (Pos Rotation)
        const deltaRotation = deltaY * 0.6;

        rotationX.set(rotationX.get() + deltaRotation);

        if (deltaTime > 0) {
            velocity.current = deltaRotation / deltaTime;
        }

        lastY.current = e.clientY;
        lastTime.current = now;
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        isDragging.current = false;
        (e.target as Element).releasePointerCapture(e.pointerId);
        startPhysicsLoop();
    };

    // --- Inertia & Snap ---
    const startPhysicsLoop = () => {
        if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
        requestAnimationFrame(inertiaStep);
    };

    const inertiaStep = () => {
        if (isDragging.current) return;

        // Snap Threshold
        if (Math.abs(velocity.current) < 0.02) {
            snapToGrid();
            return;
        }

        const currentRot = rotationX.get();
        rotationX.set(currentRot + velocity.current * 16);
        velocity.current *= 0.95; // Friction

        animationFrame.current = requestAnimationFrame(inertiaStep);
    };

    const snapToGrid = () => {
        const current = rotationX.get();
        // Since we want index * ANGLE + rotation = 0 for center...
        // rotation = -index * ANGLE.
        // So target nearest multiple of ANGLE, but what index?
        // Let's just snap to nearest multiple logic.
        const target = Math.round(current / ANGLE_PER_ITEM) * ANGLE_PER_ITEM;

        animate(rotationX, target, {
            type: "spring",
            stiffness: 400,
            damping: 40,
            onComplete: () => {
                // Determine selected ID
                // Logic: rot = -index * angle
                // index = -rot / angle
                const indexRaw = Math.round(-target / ANGLE_PER_ITEM);
                const index = ((indexRaw % items.length) + items.length) % items.length;

                if (items[index] && items[index].id !== selectedId) {
                    onSelect(items[index].id);
                    playUiSound('pop');
                }
            }
        });
    };

    // Find active item for side display
    const activeItem = items.find(i => i.id === selectedId);

    // --- Render ---
    return (
        <div
            className="relative w-full h-[260px] flex items-center justify-center touch-none cursor-grab active:cursor-grabbing group"
            style={{ perspective: '1000px' }}
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* 1. Background Halo/Glow - Optional for "Holographic" feel */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full bg-blue-500/5 blur-3xl -z-20 pointer-events-none" />

            {/* 2. Selection Ring (Horizontal) - Floating in center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[6px] bg-sky-400/30 blur-sm rounded-full -z-10 pointer-events-none" />



            {/* 3. The 3D Stage */}
            <div className="relative w-full h-full flex items-center justify-center transform-style-3d select-none">
                {items.map((item, index) => {
                    const isSelected = item.id === selectedId;
                    return (
                        <CarouselItemHolographic
                            key={item.id}
                            item={item}
                            index={index}
                            isSelected={isSelected}
                            rotationX={rotationX}
                            radius={RADIUS}
                            anglePerItem={ANGLE_PER_ITEM}
                            onSelect={() => {
                                // Snap logic
                                const current = rotationX.get();
                                const idealTarget = -index * ANGLE_PER_ITEM; // Target for center

                                // Shortest path
                                const diff = idealTarget - current;
                                const circles = Math.round(diff / 360);
                                const optimized = idealTarget - (circles * 360);

                                animate(rotationX, optimized, { type: "spring", stiffness: 200, damping: 25 });
                                onSelect(item.id);
                                playUiSound('pop');
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

// Holographic Item Component
const CarouselItemHolographic = ({ item, index, isSelected, rotationX, radius, anglePerItem, onSelect }: any) => {

    // We need strict trigonometry to position items on a ring.
    // Framer Motion transforms usually work on single values.
    // To map `rotationX` (angle) to `y/z` coordinates, we use `useTransform`.

    // Current Angle of this item = base + rotation
    const angle = useTransform(rotationX, (r: number) => {
        return (index * anglePerItem) + r;
    });

    const radian = useTransform(angle, (a: number) => (a * Math.PI) / 180);

    // Calculate Y and Z
    // Cylinder vertical axis is X? No, "Vertical Carousel" means rotating around X axis.
    // Rotation varies angle in Y-Z plane.
    // y = R * sin(theta)
    // z = R * cos(theta) -- 0 deg = cos(0)=1 (Front), 180 deg = cos(180)=-1 (Back)

    const y = useTransform(radian, r => radius * Math.sin(r));
    const z = useTransform(radian, r => radius * Math.cos(r));

    // Rotate the item itself to face forward, or follow the ring curvature?
    // "rotateX(-angle)" makes it always face 'up' relative to ring, effectively locking it vertical?
    // Or follows face.
    // Let's try to keeping it tangent (following curve) but text readable?
    // Ideally for a "Ferris Wheel" (Upright), we rotateX(-angle).
    // For a "Roller" (Sticker on drum), we rotateX(angle).
    // User said: "Vertical 3D Carousel" - usually implies Ferris Wheel or Roller.
    // Given the "Holographic" descriptor, Ferris Wheel (upright items floating) often looks cleaner.
    // BUT "Main Character" selector usually has faces.
    // Let's stick to the user's code snippet hint: `rotateX(${-angle}deg)` implies counter-rotation to stay upright (Ferris Wheel).
    const rotateXStyle = useTransform(angle, a => `${-a}deg`);

    // Scale and Opacity based on Z depth
    // z goes from -Radius to +Radius.
    // Front (+Radius): Scale 1.2, Opacity 1
    // Back (-Radius): Scale 0.5, Opacity 0.2
    const scale = useTransform(z, [-radius, radius], [0.5, 1.2]);
    const opacity = useTransform(z, [-radius, radius], [0.3, 1]);

    // Dynamic Z-Index
    const zIndex = useTransform(z, (depth) => Math.round(depth + radius));

    return (
        <motion.div
            className="absolute top-1/2 left-1/2 w-20 h-20 -ml-10 -mt-10 origin-center backface-visible"
            style={{
                y: y,
                z: z,
                rotateX: rotateXStyle, // Keep item upright!
                scale: scale,
                opacity: opacity,
                zIndex: zIndex,
            }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
            <div className={cn(
                "w-full h-full rounded-full border-2 shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center select-none backdrop-blur-sm transition-all duration-300 overflow-hidden",
                isSelected
                    ? "bg-gradient-to-br from-orange-100 to-white border-orange-400 ring-4 ring-orange-200 shadow-[0_0_20px_rgba(251,146,60,0.5)] scale-110"
                    : "bg-gradient-to-br from-white/90 to-white/40 border-white/60 hover:border-white hover:scale-105"
            )}>
                {item.image ? (
                    <img src={item.image} className="w-full h-full object-cover pointer-events-none scale-110" />
                ) : (
                    <span className="text-4xl filter drop-shadow-sm pointer-events-none">{item.icon}</span>
                )}
            </div>
            {/* Floating Label (Visible ONLY if selected) */}
            {isSelected && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap backdrop-blur-md pointer-events-none shadow-lg border border-white/20">
                    {item.label}
                </div>
            )}
        </motion.div>
    );
};
