import 'dotenv/config';
import { dashscopeService } from './src/services/dashscopeService';
import { QWEN_OFFICIAL_VOICES } from './src/services/qwenVoiceConfig';
import fs from 'fs';

async function diagnose() {
    console.log("--- STARTING VOICE DIAGNOSIS ---");

    // 1. Test Official Voice (Aiden)
    try {
        console.log("\n[Test 1] Official Voice (Aiden)...");
        const buf = await dashscopeService.generateSpeech({
            text: "This is a diagnostic test for official voices.",
            voice: QWEN_OFFICIAL_VOICES.AIDEN
        });
        console.log(`✅ Success (Internal): ${buf.length} bytes`);
        fs.writeFileSync('diag_aiden.mp3', buf);
        console.log("Written to diag_aiden.mp3. Check if it's playable.");
    } catch (e: any) {
        console.error("❌ Test 1 FAILED:", e.message);
    }

    // 2. Test Custom Voice (using the user's latest ID if possible, or a placeholder)
    const latestCid = "qwen-tts-vc-v7b3643ykzj-voice-20260203165620307-0f4a";
    try {
        console.log(`\n[Test 2] Custom Voice (${latestCid})...`);
        const buf = await dashscopeService.generateSpeech({
            text: "This is a diagnostic test for custom voices.",
            voice: latestCid
        });
        console.log(`✅ Success (Internal): ${buf.length} bytes`);
        fs.writeFileSync('diag_custom.mp3', buf);
        console.log("Written to diag_custom.mp3. Check if it's playable.");
    } catch (e: any) {
        console.error("❌ Test 2 FAILED:", e.message);
    }
}

diagnose();
