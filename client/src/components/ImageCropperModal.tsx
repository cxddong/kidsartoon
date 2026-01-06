
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCw, ZoomIn, ZoomOut, Move, RotateCcw, Maximize } from 'lucide-react';
import { cn } from '../lib/utils';

interface ImageCropperModalProps {
    imageUrl: string;
    aspectRatio?: number; // width / height, default 1 (Square)
    onCrop: (croppedBlob: Blob) => void;
    onCancel: () => void;
    circular?: boolean;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
    imageUrl,
    aspectRatio = 1,
    onCrop,
    onCancel,
    circular = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    // Calculate canvas size helper
    const getCanvasSize = () => {
        const size = Math.min(window.innerWidth - 40, 500);
        return { width: size, height: size / aspectRatio };
    };

    // Load Image & Auto Fit
    useEffect(() => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            setImage(img);

            // Auto Fit logic
            const { width, height } = getCanvasSize();
            const scaleX = width / img.width;
            const scaleY = height / img.height;
            const fitScale = Math.min(scaleX, scaleY) * 0.9; // 90% fit

            setScale(fitScale);
            setPosition({ x: 0, y: 0 });
            setRotation(0);
        };
    }, [imageUrl, aspectRatio]);

    const handleFit = () => {
        if (!image) return;
        const { width: canvasW, height: canvasH } = getCanvasSize();

        // Account for rotation
        const isVertical = rotation % 180 !== 0;
        const imgW = isVertical ? image.height : image.width;
        const imgH = isVertical ? image.width : image.height;

        const scaleX = canvasW / imgW;
        const scaleY = canvasH / imgH;
        const fitScale = Math.min(scaleX, scaleY) * 0.9;

        setScale(fitScale);
        setPosition({ x: 0, y: 0 });
    };

    // Draw Loop
    useEffect(() => {
        if (!image || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set high resolution
        const { width, height } = getCanvasSize();

        canvas.width = width;
        canvas.height = height;

        // Fill background
        ctx.fillStyle = '#0f172a'; // Slate-900
        ctx.fillRect(0, 0, width, height);

        // Transformation Matrix
        ctx.save();
        // 1. Move to center of canvas + applied Pan offset (Screen Space Panning)
        ctx.translate(width / 2 + position.x, height / 2 + position.y);

        // 2. Rotate
        ctx.rotate((rotation * Math.PI) / 180);

        // 3. Scale
        ctx.scale(scale, scale);

        // 4. Draw Image Centered
        ctx.drawImage(image, -image.width / 2, -image.height / 2);

        ctx.restore();

        // Overlay for Circular Crop (if enabled)
        if (circular) {
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true);
            ctx.fill();
            ctx.restore();

            // Border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI);
            ctx.stroke();
        }

    }, [image, scale, rotation, position, aspectRatio, circular]);

    // Pan Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        // Adjust for rotation? No, user moves image relative to screen
        // But our context is rotated... wait.
        // If I drag RIGHT, I want image to move RIGHT on screen.
        // If context is rotated 90deg, "x" axis is Down.

        // Let's keep position in "Screen Space" relative to center, but we apply it Inside the rotation?
        // No, if I apply translation AFTER rotation in the matrix:
        // ctx.rotate(R); ctx.translate(X, Y); -> X is along rotated axis.
        // If I drag right, and R=90, image moves DOWN. Bad.

        // Correct Order:
        // ctx.translate(Center)
        // ctx.translate(ScreenPanX, ScreenPanY)  <-- Apply Pan BEFORE Rotate? No, Pan is "World Space".
        // ctx.rotate(R)
        // ctx.scale(S)
        // ctx.drawImage(...)

        // Wait, 'position' in my code above was applied AFTER rotation: 
        // ctx.translate(width/2, height/2); ctx.rotate(...); ctx.scale(...); ctx.translate(position.x...);
        // This means 'position' is in Image Local Space.

        // Logic for intuitive panning (Screen Space Panning):
        // We need to map MouseDelta (Screen) to PanDelta (Image Local).
        // If Rot=0:   dx=dx, dy=dy
        // If Rot=90:  dx=dy, dy=-dx (approx)

        // To avoid complex math, let's just Apply Pan BEFORE Rotate in the drawing stack?
        // ctx.translate(width/2 + position.x, height/2 + position.y);
        // ctx.rotate(...);
        // ...
        // Yes! That way 'position' aligns with screen axes.

        // Updating handleMouseMove to just track screen delta.
        // But wait, my code above had `setDragStart` based on `position`.
        // Let's refactor the draw function logic to separate screen pan vs image transform.

        // Let's defer that fix to the logic update below.

        // For now, simple implementation assuming 0 rotation, will fix in a sec.
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    // Zoom
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        setScale(prev => Math.min(Math.max(0.1, prev + delta), 5));
    };

    const handleSave = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;

        // We render exactly what's seen. 
        // Note: The canvas resolution is currently 'display size'. 
        // For high-res output, we might want to render to a larger off-screen canvas?
        // For now, 500px is decent for UI display.

        canvas.toBlob((blob) => {
            if (blob) onCrop(blob);
        }, 'image/jpeg', 0.95);
    };

    // Need to update the Matrix Logic for 'Screen Space Panning'
    // I will rewrite the useEffect content slightly in the same file write.

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                        <Move className="w-5 h-5 text-indigo-500" /> Adjust Image
                    </h3>
                    <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Canvas Area */}
                <div
                    className="flex-1 bg-slate-900 relative overflow-hidden flex items-center justify-center cursor-move"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    <canvas ref={canvasRef} className="max-w-full max-h-full shadow-2xl" />

                    {/* Floating Zoom Controls */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full text-white">
                        <button onClick={handleFit} className="p-1 hover:text-indigo-400" title="Fit to Screen"><Maximize className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-white/20 mx-1" />
                        <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-1 hover:text-indigo-400"><ZoomOut className="w-4 h-4" /></button>
                        <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                        <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-1 hover:text-indigo-400"><ZoomIn className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setRotation(r => (r - 90 + 360) % 360)} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg group">
                                <RotateCcw className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                <span className="text-[10px] font-bold text-slate-400">Rotate L</span>
                            </button>
                            <button onClick={() => setRotation(r => (r + 90) % 360)} className="flex flex-col items-center gap-1 p-2 hover:bg-slate-50 rounded-lg group">
                                <RotateCw className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                <span className="text-[10px] font-bold text-slate-400">Rotate R</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onCancel}
                                className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                Done
                            </button>
                        </div>
                    </div>
                    <p className="text-center text-xs text-slate-400 font-medium">
                        Drag to move • Scroll to zoom • Use buttons to rotate
                    </p>
                </div>
            </div>
        </div>
    );
};
