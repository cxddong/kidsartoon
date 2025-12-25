
import { doubaoService } from './src/services/doubao';
import dotenv from 'dotenv';
dotenv.config();

async function testStrictMode() {
    console.log("--- Testing Strict Mode Parameters ---");

    // Using a placeholder base64 image (small red dot)
    const base64Ref = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    // Strict Mode Prompt
    const prompt = "( Best Quality ), Classic Style, A cute dog, interacting, Bedtime Story environment, masterpiece children's book style, soft colors, high quality, distinct features matching reference";

    console.log("Testing with image_weight = 0.75...");
    try {
        const url = await doubaoService.generateImageFromImage(prompt, base64Ref, '2K', undefined, 0.75);
        console.log("✅ Success! URL:", url);
    } catch (e: any) {
        console.error("❌ Failed with 0.75");
        console.error("Error Message:", e.message);
    }

    console.log("\nTesting with image_weight = 0.6 (Previous)...");
    try {
        const url = await doubaoService.generateImageFromImage(prompt, base64Ref, '2K', undefined, 0.6);
        console.log("✅ Success! URL:", url);
    } catch (e: any) {
        console.error("❌ Failed with 0.6");
        console.error("Error Message:", e.message);
    }
}

testStrictMode();
