
import { doubaoService } from './src/services/doubao';
import dotenv from 'dotenv';
dotenv.config();

async function testImageGen() {
    console.log("--- Testing Doubao Image Generation (Advanced) ---");

    const prompts = [
        "A cute dog exploring the moon, holding a flag, cartoon style",
        "The dog meeting a moon alien, friendly encounter, cartoon style"
    ];

    for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i];
        console.log(`\n[Test ${i + 1}] Prompt: "${prompt.substring(0, 40)}..."`);

        try {
            console.time("ImageGen");
            // forcing the exact call from media.ts
            const url = await doubaoService.generateImage(prompt, '2K');
            console.timeEnd("ImageGen");

            if (!url) {
                console.error("❌ FAILED: URL is empty/undefined");
            } else {
                console.log("✅ SUCCESS: " + url.substring(0, 50) + "...");
            }
        } catch (e: any) {
            console.error("❌ CRASH: ", e.message);
            if (e.response) {
                const text = await e.response.text();
                console.error("   API Response:", text);
            }
        }
    }
}

testImageGen();
