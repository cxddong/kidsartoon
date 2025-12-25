
import { xunfeiTTS } from './src/services/xunfei';
import path from 'path';
import fs from 'fs';

async function test() {
    console.log("Testing Xunfei TTS...");
    const outputPath = path.resolve('test_xunfei_output.mp3');
    try {
        const result = await xunfeiTTS("Hello, this is a test of the Xunfei Text to Speech engine.", outputPath, 'en');
        console.log("Success! File saved to:", result);
        if (fs.existsSync(result)) {
            console.log("File exists. Size:", fs.statSync(result).size, "bytes");
        }
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
