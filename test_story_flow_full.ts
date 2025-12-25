import { doubaoService } from './src/services/doubao.js';
import { geminiService } from './src/services/gemini.js';
import fs from 'fs';

async function testFlow() {
    console.log("Starting Full Flow Test...");
    const start = Date.now();

    try {
        // 1. Vision (Mocking the image)
        // We'll use a placeholder image URL for analysis if possible, or just skip passing image to `generateStoryJSON` test?
        // Actually, the route calls `doubaoService.analyzeImage` with base64.

        // Let's create a minimal 1x1 base64 png
        const base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

        console.log(`[${(Date.now() - start) / 1000}s] Step 1: Vision Analysis via Doubao...`);
        const desc = await doubaoService.analyzeImage(base64Image, "Describe this.");
        console.log(`[${(Date.now() - start) / 1000}s] Vision Result: ${desc.substring(0, 30)}...`);

        // 2. Story Generation
        const prompt = `Create a story based on: ${desc}`;
        console.log(`[${(Date.now() - start) / 1000}s] Step 2: Story Gen via Doubao...`);
        const story = await doubaoService.generateStory(prompt);
        console.log(`[${(Date.now() - start) / 1000}s] Story Result Length: ${story.length}`);

        // 3. Audio Generation
        console.log(`[${(Date.now() - start) / 1000}s] Step 3: TTS via Google...`);
        const audio = await geminiService.generateSpeech(story.substring(0, 200), 'en-US'); // Limit text for test
        console.log(`[${(Date.now() - start) / 1000}s] Audio Result Size: ${audio.length}`);

        console.log(`[${(Date.now() - start) / 1000}s] Flow Complete!`);
        fs.writeFileSync('flow_test_result.txt', 'SUCCESS');

    } catch (e: any) {
        console.error("FLOW FAILED:", e);
        fs.writeFileSync('flow_test_result.txt', `FAILED: ${e.message}`);
    }
}

testFlow();
