
import { doubaoService } from './src/services/doubao.js';
import { geminiService } from './src/services/gemini.js';
import fs from 'fs';

// Tiny 1x1 transparent pixel base64
const TEST_IMAGE_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runDebug() {
    console.log("=== Debugging Hybrid AI Logic ===");

    try {
        console.log("1. Testing Doubao (Vision)...");
        const description = await doubaoService.analyzeImage(TEST_IMAGE_BASE64, "What color is this?");
        console.log("✅ Doubao Success:", description);
    } catch (e: any) {
        const errorMsg = `❌ DOUBLE FAILURE: ${e.message}\nStack: ${e.stack}\nDetails: ${JSON.stringify(e.response?.data || {}, null, 2)}`;
        fs.writeFileSync('debug_error.log', errorMsg);
        console.error(errorMsg);
    }
}

runDebug();
