import React, { useState, useEffect, useRef } from 'react';

interface DebugResizableBoxProps {
    initialWidthPercent: number;
    initialHeightPercent: number;
    initialTopPercent: number;
    initialLeftPercent: number;
    parentRef: React.RefObject<HTMLDivElement | null>;
    children?: React.ReactNode;
    onChange?: (dims: { w: number, h: number, t: number, l: number }) => void;
}

export const DebugResizableBox: React.FC<DebugResizableBoxProps> = ({
    initialWidthPercent,
    initialHeightPercent,
    initialTopPercent,
    initialLeftPercent,
    parentRef,
    children,
    onChange
}) => {
    const [dims, setDims] = useState({
        w: initialWidthPercent,
        h: initialHeightPercent,
        t: initialTopPercent,
        l: initialLeftPercent
    });

    const draggingRef = useRef<{
        type: 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;
        startX: number;
        startY: number;
        startDims: typeof dims;
    }>({ type: null, startX: 0, startY: 0, startDims: dims });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingRef.current.type || !parentRef.current) return;

            const parentRect = parentRef.current.getBoundingClientRect();
            const dxPx = e.clientX - draggingRef.current.startX;
            const dyPx = e.clientY - draggingRef.current.startY;

            // Convert px delta to % delta
            const dx = (dxPx / parentRect.width) * 100;
            const dy = (dyPx / parentRect.height) * 100;

            const { startDims } = draggingRef.current;

            let newDims = { ...startDims };

            switch (draggingRef.current.type) {
                case 'move':
                    newDims.l = startDims.l + dx;
                    newDims.t = startDims.t + dy;
                    break;
                case 'e':
                    newDims.w = startDims.w + dx;
                    break;
                case 'w':
                    newDims.l = startDims.l + dx;
                    newDims.w = startDims.w - dx;
                    break;
                case 's':
                    newDims.h = startDims.h + dy;
                    break;
                case 'n':
                    newDims.t = startDims.t + dy;
                    newDims.h = startDims.h - dy;
                    break;
                // Add corners if needed, keeping simple for now as requested "4 edges"
            }

            setDims(newDims);
            if (onChange) onChange(newDims);
        };

        const handleMouseUp = () => {
            draggingRef.current.type = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [parentRef]);

    const startDrag = (e: React.MouseEvent, type: any) => {
        e.stopPropagation();
        e.preventDefault();
        draggingRef.current = {
            type,
            startX: e.clientX,
            startY: e.clientY,
            startDims: { ...dims }
        };
    };

    return (
        <div
            style={{
                top: `${dims.t}%`,
                left: `${dims.l}%`,
                width: `${dims.w}%`,
                height: `${dims.h}%`,
            }}
            className="absolute border-4 border-red-500 bg-red-500/10 z-50 group pointer-events-auto"
        >
            {/* Drag Handle (Center) */}
            <div
                onMouseDown={(e) => startDrag(e, 'move')}
                className="absolute inset-0 cursor-move z-0 hover:bg-red-500/20 active:bg-red-500/30 transition-colors"
            />

            {/* Resize Handles - Thicker & Visible */}
            <div onMouseDown={(e) => startDrag(e, 'n')} className="absolute -top-4 left-0 right-0 h-8 cursor-n-resize z-50 hover:bg-blue-500/50 bg-blue-500/20" />
            <div onMouseDown={(e) => startDrag(e, 's')} className="absolute -bottom-4 left-0 right-0 h-8 cursor-s-resize z-50 hover:bg-blue-500/50 bg-blue-500/20" />
            <div onMouseDown={(e) => startDrag(e, 'w')} className="absolute top-0 -left-4 bottom-0 w-8 cursor-w-resize z-50 hover:bg-blue-500/50 bg-blue-500/20" />
            <div onMouseDown={(e) => startDrag(e, 'e')} className="absolute top-0 -right-4 bottom-0 w-8 cursor-e-resize z-50 hover:bg-blue-500/50 bg-blue-500/20" />

            {/* Info Badge */}
            <div className="absolute -top-12 left-0 bg-black/80 text-white text-xs p-2 rounded whitespace-nowrap pointer-events-none">
                W: {dims.w.toFixed(1)}% | H: {dims.h.toFixed(1)}% <br />
                Top: {dims.t.toFixed(1)}% | Left: {dims.l.toFixed(1)}%
            </div>

            <div className="relative w-full h-full pointer-events-auto z-0">
                {children}
            </div>
        </div>
    );
};
