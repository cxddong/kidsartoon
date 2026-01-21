import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { RefreshCcw, Eraser, PenTool } from 'lucide-react';

interface Point {
    x: number;
    y: number;
}

interface ArtClassCanvasProps {
    color?: string;
    brushSize?: number;
    brushType?: 'pen' | 'marker' | 'crayon' | 'eraser';
    ghostPath?: Point[]; // Points to show as a guide
    onStrokeComplete?: (points: Point[]) => void;
    className?: string;
    smartPenEnabled?: boolean;
}

export interface ArtClassCanvasRef {
    clear: () => void;
    getImage: () => string; // Returns base64
    handleUndo: () => void;
}

export const ArtClassCanvas = forwardRef<ArtClassCanvasRef, ArtClassCanvasProps>(({
    color = '#000000',
    brushSize = 5,
    brushType = 'pen',
    ghostPath,
    onStrokeComplete,
    className = '',
    smartPenEnabled = false
}, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [points, setPoints] = useState<Point[]>([]);
    const [history, setHistory] = useState<ImageData[]>([]);

    // Expose methods
    useImperativeHandle(ref, () => ({
        clear: () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                setPoints([]);
                setHistory([]);
            }
        },
        getImage: () => {
            return canvasRef.current?.toDataURL('image/png') || '';
        },
        handleUndo: () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx && history.length > 0) {
                const newHistory = [...history];
                newHistory.pop(); // Remove current state
                const previousState = newHistory[newHistory.length - 1];

                if (previousState) {
                    ctx.putImageData(previousState, 0, 0);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                setHistory(newHistory);
            }
        }
    }));

    // Setup Canvas Size
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                const parent = canvas.parentElement;
                if (parent) {
                    // Save content
                    const ctx = canvas.getContext('2d');
                    const content = ctx?.getImageData(0, 0, canvas.width, canvas.height);

                    canvas.width = parent.clientWidth;
                    canvas.height = parent.clientHeight;

                    // Restore if possible (naive, better to redraw paths usually but this is MVP)
                    if (content && ctx) {
                        ctx.putImageData(content, 0, 0);
                    }
                    // Set props again as resize clears them
                    if (ctx) {
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                    }
                }
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Ghost Path Rendering
    useEffect(() => {
        if (!ghostPath || ghostPath.length < 2) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.save();
        ctx.strokeStyle = 'rgba(200, 200, 255, 0.5)';
        ctx.lineWidth = brushSize * 1.5;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(ghostPath[0].x, ghostPath[0].y);
        for (let i = 1; i < ghostPath.length; i++) {
            // Simple quadratic bezier for transparency? Or just lines for ghost
            ctx.lineTo(ghostPath[i].x, ghostPath[i].y);
        }
        ctx.stroke();
        ctx.restore();

    }, [ghostPath, brushSize]);

    // Drawing Logic
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault(); // Prevent scrolling
        setIsDrawing(true);
        const { x, y } = getCoords(e);
        setPoints([{ x, y }]);

        // Save history state before new stroke
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            setHistory(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        e.preventDefault();

        const { x, y } = getCoords(e);
        const newPoint = { x, y };
        setPoints(prev => [...prev, newPoint]);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || points.length === 0) return;

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;

        // Handle Brush Types
        if (brushType === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineCap = brushType === 'marker' ? 'square' : 'round';
            ctx.lineJoin = brushType === 'marker' ? 'bevel' : 'round';

            if (brushType === 'marker') {
                ctx.globalAlpha = 0.6; // Marker effect
            } else if (brushType === 'crayon') {
                ctx.setLineDash([1, 4]); // Simple noise effect for crayon
                ctx.globalAlpha = 0.8;
            } else {
                ctx.globalAlpha = 1.0;
                ctx.setLineDash([]);
            }
        }

        // Basic Line Rendering (Raw) -> Smoothing applied on end or real-time?
        // Real-time quadratic curves for smoothness
        const p1 = points[points.length - 1];
        const p2 = newPoint;

        ctx.beginPath();
        // Move to the last point
        if (points.length > 2) {
            const lastP = points[points.length - 2];
            ctx.moveTo(lastP.x, lastP.y);
            ctx.quadraticCurveTo(lastP.x, lastP.y, p2.x, p2.y); // Simplified for MVP
        } else {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
        }
        // ctx.stroke(); 
        // Actually, pure quadratic real-time is tricky without lookahead. Use simple line for fast feedback.
        ctx.beginPath();
        ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        // Apply "Smart Pen" Smoothing here!
        smoothStroke();

        if (onStrokeComplete) {
            onStrokeComplete(points);
        }
    };

    const getCoords = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    // Smoothing Logic (Smart Pen)
    const smoothStroke = () => {
        if (!smartPenEnabled) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx || points.length < 3) return;

        // Revert to history state (remove the raw shaky line)
        if (history.length > 0) {
            const lastState = history[history.length - 1];
            ctx.putImageData(lastState, 0, 0);
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (brushType === 'marker') {
            ctx.globalAlpha = 0.6;
        } else if (brushType === 'crayon') {
            ctx.setLineDash([1, 4]);
            ctx.globalAlpha = 0.8;
        } else {
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        // Simple averaging for smoother look
        for (let i = 1; i < points.length - 2; i++) {
            const xc = (points[i].x + points[i + 1].x) / 2;
            const yc = (points[i].y + points[i + 1].y) / 2;
            ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }

        // Connect last points
        if (points.length > 2) {
            ctx.quadraticCurveTo(
                points[points.length - 2].x,
                points[points.length - 2].y,
                points[points.length - 1].x,
                points[points.length - 1].y
            );
        }

        ctx.stroke();

        // We modified the canvas, so the current "state" is now the smoothed one.
        // If we want undo to work, the "history" we pushed at startDrawing is the clean slate.
        // So hitting undo will remove this stroke. That is correct.
    };

    return (
        <canvas
            ref={canvasRef}
            className={`touch-none cursor-crosshair ${className}`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
    );
});

ArtClassCanvas.displayName = 'ArtClassCanvas';
