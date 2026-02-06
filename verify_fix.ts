
import dotenv from 'dotenv';
dotenv.config();
import { dashscopeService } from './src/services/dashscopeService';
import { QWEN_OFFICIAL_VOICES } from './src/services/qwenVoiceConfig';

async function verify() {
    console.log("Verifying DashScope Service Fixes...");
    console.log("API Key Trimmed:", process.env.DASHSCOPE_API_KEY?.trim() === process.env.DASHSCOPE_API_KEY ? "Yes (or already trimmed)" : "Was Trimmed");

    // 1. Test Official Voice (should use qwen3-tts-flash)
    console.log("\n--- Testing Official Voice (Cherry) ---");
    try {
        const buf = await dashscopeService.generateSpeech({
            text: "Official voice test.",
            voice: QWEN_OFFICIAL_VOICES.KIKI
        });
        console.log("✅ Official Voice SUCCESS:", buf.length, "bytes");
    } catch (e: any) {
        console.error("❌ Official Voice FAILED:", e.message);
    }

    // 2. Test Custom Voice (should use qwen3-tts-vc-realtime-2026-01-15)
    // We'll use a mocked custom ID that starts with 'v' to trigger the logic.
    // Note: This will likely fail with 400 because 'vMock' doesn't exist on server, 
    // but it will verify the PAYLOAD and ENDPOINT.
    console.log("\n--- Testing Custom Voice Logic (Mock ID: vMockTest) ---");
    try {
        const buf = await dashscopeService.generateSpeech({
            text: "Custom voice logic test.",
            voice: "vMockTest"
        });
        console.log("✅ Custom Voice SUCCESS (Unexpected):", buf.length, "bytes");
    } catch (e: any) {
        console.log("Custom Voice Result (Expected failure if non-existent, but check for payload errors):");
        console.log(e.message);
        // If it says "voice not found", the payload structure was ACCEPTED.
        // If it says "Field required: input.text" or "task can not be null", it's still broken.
    }
}

verify();
