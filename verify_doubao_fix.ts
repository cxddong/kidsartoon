import { doubaoService } from './src/services/doubao.js';
import dotenv from 'dotenv';
dotenv.config();

async function testFixes() {
    console.log("--- Testing Doubao Service Fixes ---");

    const mockFetch = async (url: string, options: any) => {
        const body = JSON.parse(options.body);
        console.log(`[Mock] URL: ${url}`);

        if (url.includes('/images/generations')) {
            console.log(`[Mock] Seed: ${body.seed}, Image Field Present: ${!!body.image}`);
            if (body.image) {
                console.log(`[Mock] Image starts with: ${body.image.substring(0, 30)}...`);
                if (body.image.includes('base64,base64,')) throw new Error("Double prefix!");
            }
            return { ok: true, json: async () => ({ data: [{ url: 'http://test.url' }] }) };
        }

        if (url.includes('/chat/completions')) {
            const imageUrl = body.messages[0].content[1].image_url?.url;
            if (imageUrl) {
                console.log(`[Mock] Vision Image starts with: ${imageUrl.substring(0, 30)}...`);
                if (imageUrl.includes('base64,base64,')) throw new Error("Double prefix!");
            }
            return { ok: true, json: async () => ({ choices: [{ message: { content: 'test result' } }] }) };
        }

        if (url.includes('/tasks')) {
            const imageUrl = body.content[1].image_url?.url;
            console.log(`[Mock] Video Task Image starts with: ${imageUrl.substring(0, 30)}...`);
            if (imageUrl.includes('base64,base64,')) throw new Error("Double prefix!");
            return { ok: true, json: async () => ({ id: 'task_123' }) };
        }

        return { ok: true, json: async () => ({}) };
    };

    const originalFetch = global.fetch;
    (global as any).fetch = mockFetch;

    try {
        const testBase64 = "data:image/png;base64,VGVzdERhdGE=";

        console.log("\n1. Testing generateImage seed...");
        await doubaoService.generateImage("test", "2K", 123.456);
        await doubaoService.generateImage("test", "2K", NaN);

        console.log("\n2. Testing generateImageFromImage base64...");
        await doubaoService.generateImageFromImage("test", testBase64);

        console.log("\n3. Testing analyzeImage base64...");
        await doubaoService.analyzeImage(testBase64);

        console.log("\n4. Testing createSeedanceVideoTask base64...");
        await doubaoService.createSeedanceVideoTask(testBase64, { action: 'dance' });

        console.log("\n5. Testing createSeedanceVideoTask1_5 base64...");
        await doubaoService.createSeedanceVideoTask1_5(testBase64, { spell: 'quick', audioMode: 'scene', textInput: 'test' });

        console.log("\nPASS: All base64 normalization and seed validation checks passed!");
    } catch (e) {
        console.error("FAIL:", e);
    } finally {
        (global as any).fetch = originalFetch;
    }

    console.log("\n--- Verification Complete ---");
}

testFixes();
