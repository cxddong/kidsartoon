
import React, { useState, useRef, useEffect } from 'react';
import { X, Check, RotateCw, ZoomIn, ZoomOut, Move, RotateCcw, Maximize } from 'lucide-react';
import { cn } from '../lib/utils';
import adjustBgImage from '../assets/adjust-image-bg.png';

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
        ctx.translate(width / 2 + position.x, height / 2 + position.y);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(scale, scale);
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
        if (!image) return;

        // Create a temporary high-res canvas
        const outputCanvas = document.createElement('canvas');
        const OUTPUT_SIZE = 1024;

        outputCanvas.width = OUTPUT_SIZE;
        outputCanvas.height = OUTPUT_SIZE / aspectRatio;

        const ctx = outputCanvas.getContext('2d');
        if (!ctx) return;

        // Fill background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

        // Calculate scaling factor between display canvas and output canvas
        // We rely on the internal 'scale', 'position', 'rotation' state which describes the transform relative to the DISPLAY canvas.
        // So we need to map those to the 1024px canvas.

        const { width: displayW, height: displayH } = getCanvasSize();
        const ratio = OUTPUT_SIZE / displayW;

        ctx.save();

        // Translate to the center point (including the user's pan offset, scaled)
        // This matches the display logic: ctx.translate(width / 2 + position.x, ...);
        const centerX = outputCanvas.width / 2 + position.x * ratio;
        const centerY = outputCanvas.height / 2 + position.y * ratio;

        ctx.translate(centerX, centerY);

        // Apply rotation
        ctx.rotate((rotation * Math.PI) / 180);

        // Apply scale (adjusted by the ratio of output/display size)
        ctx.scale(scale * ratio, scale * ratio);

        // Draw image centered at origin
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        ctx.restore();

        outputCanvas.toBlob((blob) => {
            if (blob) onCrop(blob);
        }, 'image/jpeg', 0.95);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{
                backgroundImage: `url(${adjustBgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Central Content Box - Matches the gradient box in the image */}
            <div className="relative w-full max-w-4xl aspect-[16/10] flex items-center justify-center">
                {/* Gradient Box Content Area - Shifted right to match background */}
                <div className="bg-gradient-to-br from-blue-100/40 via-purple-100/40 to-pink-100/40 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/50 p-8 w-[70%] h-[70%] flex flex-col ml-16">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-slate-800 text-2xl flex items-center gap-2">
                            <Move className="w-6 h-6 text-indigo-500" /> Adjust Image
                        </h3>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-white/50 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6 text-slate-600" />
                        </button>
                    </div>

                    {/* Canvas Area */}
                    <div
                        className="flex-1 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center cursor-move shadow-xl"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    >
                        <canvas ref={canvasRef} className="max-w-full max-h-full" />

                        {/* Floating Zoom Controls */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-md p-2 rounded-full text-white">
                            <button onClick={handleFit} className="p-1.5 hover:text-indigo-400 transition" title="Fit to Screen">
                                <Maximize className="w-4 h-4" />
                            </button>
                            <div className="w-px h-4 bg-white/30 mx-1" />
                            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-1.5 hover:text-indigo-400 transition">
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-1.5 hover:text-indigo-400 transition">
                                <ZoomIn className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="mt-4 flex items-center justify-between">
                        {/* Rotation Controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white rounded-lg transition group shadow-sm"
                            >
                                <RotateCcw className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                <span className="text-sm font-bold text-slate-700">Rotate L</span>
                            </button>
                            <button
                                onClick={() => setRotation(r => (r + 90) % 360)}
                                className="flex items-center gap-2 px-4 py-2 bg-white/70 hover:bg-white rounded-lg transition group shadow-sm"
                            >
                                <RotateCw className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                                <span className="text-sm font-bold text-slate-700">Rotate R</span>
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onCancel}
                                className="px-6 py-3 font-bold text-slate-600 hover:text-slate-800 bg-white/70 hover:bg-white rounded-xl transition shadow-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-black shadow-lg transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Check className="w-5 h-5" />
                                Done
                            </button>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
};
