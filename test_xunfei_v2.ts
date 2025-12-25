
import { xunfeiTTS } from './src/services/xunfei';
import path from 'path';

async function test() {
    console.log("Testing Xunfei TTS import and execution...");
    try {
        const outputPath = path.join(process.cwd(), 'test_output.mp3');
        const url = await xunfeiTTS("Hello world", outputPath, 'en', { speed: 50, volume: 50 });
        console.log("Success:", url);
    } catch (e) {
        console.error("Test Failed:", e);
    }
}

test();
