import 'dotenv/config';
import { doubaoService } from './src/services/doubao.js';

async function testGeneration() {
    console.log("Testing Doubao Image Generation...");
    const prompt = "Interstellar, black hole, a retro train rushing out of the black hole, almost falling apart";

    // Manually setting env vars if they aren't loaded (just in case, though dotenv/config should work)
    // We can't see the .env, so we rely on the system environment or the file being loaded.

    try {
        console.log("Model ID:", process.env.DOUBAO_IMAGE_MODEL || 'ep-20251209124008-rp9n8'); // Verify default
        const url = await doubaoService.generateImage(prompt);
        console.log("Success! Image URL:", url);
    } catch (error: any) {
        console.error("Test Failed!");
        console.error("Error Message:", error.message);
        if (error.cause) console.error("Cause:", error.cause);
    }
}

testGeneration();
