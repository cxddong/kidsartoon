import { dashscopeService } from './src/services/dashscopeService';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        console.log("Starting test...");
        // Use the CLEANED ID as dashscopeService expects (without prefix if logic handles it)
        // In voiceLab.ts: cleanVoiceId = targetVoiceId.replace('qwen-tts-vc-', '');
        const voiceId = 'v7b364377cz-voice-20260206104034587-6365';
        console.log("Testing with Voice ID:", voiceId);

        const buffer = await dashscopeService.generateSpeech({
            text: "This is a test of the custom voice system.",
            voice: voiceId,
            format: 'mp3'
        });
        console.log("Success! Buffer length:", buffer.length);
    } catch (e: any) {
        console.error("Test failed:", e.message);
    }
}

run();
