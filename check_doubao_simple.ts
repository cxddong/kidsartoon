import 'dotenv/config';
import { doubaoService } from './src/services/doubao.js';
import fs from 'fs';

async function testDoubao() {
    console.log("Testing Doubao English TTS...");
    try {
        const buffer = await doubaoService.generateSpeech("Hello, this is a test story.", "en_us_female_sally_premium");
        console.log("Success! Audio buffer length:", buffer.length);
        fs.writeFileSync("test_doubao_en.mp3", buffer);
    } catch (e: any) {
        console.error("Doubao Failed:", e.message);
        try {
            console.log("Retrying with 'zh_female_tianmei'...");
            const buffer2 = await doubaoService.generateSpeech("Hello fallback.", "zh_female_tianmei");
            console.log("Fallback Success! Buffer:", buffer2.length);
            fs.writeFileSync("test_doubao_fallback.mp3", buffer2);
        } catch (e2: any) {
            console.error("Fallback Failed:", e2.message);
        }
    }
}

testDoubao();
