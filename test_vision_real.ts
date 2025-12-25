
import { doubaoService } from './src/services/doubao.js';
import { geminiService } from './src/services/gemini.js';
import fs from 'fs';
import path from 'path';

async function testVisionDebug() {
    function log(msg: string) {
        console.log(msg);
        fs.appendFileSync('vision_debug_result.txt', msg + '\n');
    }

    log('[DEBUG] Starting Vision Robustness Check...');

    // 1. Create a sample base64 image (Simple red pixel or read local)
    // Actually, I need a real-ish image for vision models to not reject it.
    // I'll try to use a placeholder image URL fetched and converted, OR just a very simple known image data URI.
    // A 1x1 red pixel is too small.
    // Let's rely on a hardcoded "Test Image" that I know exists or can fetch.
    // I'll download a small public image.

    // Better: Read API_KEY from doubao.ts by instantiating it.
    // The service is already imported.

    // FETCH SAMPLE IMAGE
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png'; // Dice
    log(`[DEBUG] Fetching sample image: ${imageUrl}`);
    const imgRes = await fetch(imageUrl);
    const buffer = await imgRes.arrayBuffer();
    const base64Image = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
    log(`[DEBUG] Image fetched. Size: ${base64Image.length} chars.`);

    // TEST DOUBAO VISION
    log('\n--- TESTING DOUBAO VISION ---');
    try {
        const desc = await doubaoService.analyzeImage(base64Image, "Describe this image.");
        log(`[PASS] Doubao Result: "${desc}"`);
        if (desc.length < 20) log('[WARN] Doubao result suspiciously short.');
    } catch (e: any) {
        log(`[FAIL] Doubao Vision Error: ${e.message}`);
        if (e.message.includes('404')) log('Hint: Endpoint or Model ID wrong.');
        if (e.message.includes('401')) log('Hint: API Key invalid.');
        if (e.message.includes('400')) log('Hint: Bad Request (Image format?).');
    }

    // TEST GEMINI VISION
    log('\n--- TESTING GEMINI VISION ---');
    try {
        const desc2 = await geminiService.analyzeImage(base64Image, "Describe this image.");
        log(`[PASS] Gemini Result: "${desc2}"`);
    } catch (e: any) {
        log(`[FAIL] Gemini Vision Error: ${e.message}`);
    }
}

testVisionDebug().catch(console.error);
