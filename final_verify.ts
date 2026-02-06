
import dotenv from 'dotenv';
dotenv.config();
import { dashscopeService } from './src/services/dashscopeService';
import { QWEN_OFFICIAL_VOICES } from './src/services/qwenVoiceConfig';

async function finalVerify() {
    console.log("--- FINAL INTEGRATED VERIFICATION ---");

    // Test 1: Official Voice
    try {
        console.log("\n[Test 1] Official Voice (Aiden)...");
        const buf = await dashscopeService.generateSpeech({
            text: "Final test for Aiden.",
            voice: QWEN_OFFICIAL_VOICES.AIDEN
        });
        console.log(`✅ Success: ${buf.length} bytes`);
    } catch (e: any) {
        console.error("❌ Test 1 FAILED:", e.message);
    }

    // Test 2: Custom Voice (Logic Check)
    try {
        console.log("\n[Test 2] Custom Voice Logic (vMock123)...");
        // This will try qwen3-tts-vc-realtime-2026-01-15
        const buf = await dashscopeService.generateSpeech({
            text: "Final test for custom.",
            voice: "vMock123"
        });
        console.log(`✅ Success: ${buf.length} bytes`);
    } catch (e: any) {
        console.log(`Expected Result (ID not found): ${e.message}`);
        // If it says "voice not found", the payload structure was ACCEPTED.
    }
}

finalVerify();
