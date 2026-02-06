
import dotenv from 'dotenv';
dotenv.config();
import { dashscopeService } from './src/services/dashscopeService';
import { resolveVoiceId } from './src/services/qwenVoiceConfig';

async function simulatePreview() {
    console.log("Simulating /api/voice-lab/preview...");

    // Test Case: Aiden (Official)
    const voiceId = "aiden";
    const text = "Testing the preview simulation.";

    try {
        console.log(`Step 1: Resolving Voice ID for ${voiceId}...`);
        const qwenVoiceId = resolveVoiceId(voiceId);
        console.log(`Resolved ID: ${qwenVoiceId}`);

        console.log(`Step 2: Generating Speech via DashScope...`);
        const buffer = await dashscopeService.generateSpeech({
            text: text,
            voice: qwenVoiceId,
            format: 'mp3',
            volume: 1.0,
            rate: 1.0
        });

        console.log(`✅ SUCCESS! Buffer length: ${buffer.length}`);
    } catch (e: any) {
        console.error("❌ FAILED:", e.message);
        console.error("Stack:", e.stack);
    }
}

simulatePreview();
