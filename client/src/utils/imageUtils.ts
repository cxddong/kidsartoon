
/**
 * Captures the ArtClass canvas and composites it over a white background.
 * This fixes the issue where transparent backgrounds appear black to AI models.
 */
export const getCanvasAsBase64WithWhiteBg = (canvasRef: any) => {
    if (!canvasRef.current) return "";

    // Check if the ref exposes the internal canvas directly or via a method
    // Based on ArtClassCanvas.tsx, it likely exposes a reference or we might need to access the DOM node.
    // However, usually canvas-draw libs expose the canvas via a ref property.
    // Let's assume the standard 'react-canvas-draw' structure or similar for now, 
    // but we might need to adapt based on ArtClassCanvas implementation.
    // The user provided snippet suggests: canvasRef.current.canvas.drawing

    let canvas: HTMLCanvasElement | null = null;

    // Try to find the canvas element safely
    try {
        if (canvasRef.current.getCanvas) {
            canvas = canvasRef.current.getCanvas();
        } else if (canvasRef.current.canvas && canvasRef.current.canvas.drawing) {
            canvas = canvasRef.current.canvas.drawing;
        } else if (canvasRef.current.canvas instanceof HTMLCanvasElement) {
            canvas = canvasRef.current.canvas;
        } else {
            // Fallback: Query selector inside the component's container if ref is just a wrapper
            // This is risky without seeing ArtClassCanvas, but let's try the user's suggestion first.
            console.warn("Could not find canvas directly on ref", canvasRef.current);
            return "";
        }
    } catch (e) {
        console.error("Error accessing canvas", e);
        return "";
    }

    if (!canvas) return "";

    const context = canvas.getContext('2d');
    if (!context) return "";

    // 1. Create a temporary buffer canvas
    const w = canvas.width;
    const h = canvas.height;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

    if (!tempCtx) return "";

    // 2. Fill with White Background
    tempCtx.fillStyle = '#FFFFFF';
    tempCtx.fillRect(0, 0, w, h);

    // 3. Draw original canvas on top
    tempCtx.drawImage(canvas, 0, 0);

    // 4. Export as key
    // Returns data:image/jpeg;base64,...
    return tempCanvas.toDataURL('image/jpeg', 0.8);
};

// Alias for updated vision logic
export const captureDigitalCanvas = getCanvasAsBase64WithWhiteBg;
