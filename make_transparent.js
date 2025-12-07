import { createCanvas, loadImage } from 'canvas';
import fs from 'fs';

async function makeCircleTransparent(inputPath, outputPath) {
    try {
        const image = await loadImage(inputPath);
        const w = image.width;
        const h = image.height;
        const minDim = Math.min(w, h);

        const canvas = createCanvas(minDim, minDim);
        const ctx = canvas.getContext('2d');

        // Draw circular mask
        ctx.beginPath();
        ctx.arc(minDim / 2, minDim / 2, minDim / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        // Draw image centered
        // Calculate source rectangle to crop from center
        const sx = (w - minDim) / 2;
        const sy = (h - minDim) / 2;

        ctx.drawImage(image, sx, sy, minDim, minDim, 0, 0, minDim, minDim);

        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);

        console.log(`Successfully processed ${inputPath} -> ${outputPath}`);
    } catch (err) {
        console.error(`Error processing ${inputPath}:`, err);
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log("Usage: node make_transparent.js <input_path> <output_path>");
} else {
    makeCircleTransparent(args[0], args[1]);
}
