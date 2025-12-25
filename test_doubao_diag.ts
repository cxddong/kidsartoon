import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { doubaoService } from './src/services/doubao.js';

async function diagnose() {
    console.log("=== Diag Start ===");

    // 1. API Key Check (Skipped as hardcoded in service)
    console.log("Using hardcoded API Key in service.");

    // 2. Sharp Check
    try {
        console.log("Testing Sharp import...");
        const sharp = (await import('sharp')).default;
        console.log("Sharp version:", sharp ? 'Loaded' : 'Failed');
    } catch (e: any) {
        console.error("Sharp Import Failed:", e.message);
    }

    // 3. Doubao Image Gen (Quick check)
    try {
        console.log("Testing Doubao Image Gen...");
        const url = await doubaoService.generateImage("A red apple");
        console.log("Image Gen Success:", url ? 'Yes' : 'No');
    } catch (e: any) {
        console.error("Image Gen Failed:", e.message);
        if (e.message.includes('Unauthorized')) console.error("AUTH ERROR DETECTED");
    }

    // 4. Doubao Text Gen (Story)
    try {
        console.log("Testing Doubao Text Gen...");
        const story = await doubaoService.generateStory("Tell me a tiny story about a cat.");
        console.log("Story Gen Success. Length:", story.length);
        console.log("Story Content Preview:", story.substring(0, 50));
        fs.writeFileSync('diag_result.txt', `Image Gen URL: OK\nStory: ${story}`);
    } catch (e: any) {
        console.error("Text Gen Failed:", e.message);
        fs.writeFileSync('diag_result.txt', `Error: ${e.message}`);
    }

    console.log("=== Diag End ===");
}

diagnose();
