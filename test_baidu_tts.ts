
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { baiduService } from './src/services/baidu.js';
import fs from 'fs';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testBaidu() {
    console.log("=== Testing Baidu TTS ===");

    const text = "Hello! This is a test of the audio generation system. If you can hear this, it works.";
    console.log(`Text to synthesize: "${text}"`);

    try {
        console.log("Attempting to generate speech...");
        const buffer = await baiduService.generateSpeech(text, 'en');

        if (buffer) {
            console.log(`SUCCESS! Received audio buffer of size: ${buffer.length} bytes`);
            fs.writeFileSync('test_output.mp3', buffer);
            console.log("Saved to test_output.mp3");
        } else {
            console.error("FAILURE: Received null buffer. Check backend logs for detailed error.");
        }
    } catch (e) {
        console.error("EXCEPTION:", e);
    }
}

testBaidu();
