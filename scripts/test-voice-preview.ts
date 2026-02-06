
import dotenv from 'dotenv';
dotenv.config();
import { dashscopeService } from '../src/services/dashscopeService';
import { QWEN_OFFICIAL_VOICES } from '../src/services/qwenVoiceConfig';

async function verifyPreview() {
    console.log("Starting Voice Preview Verification (Refined)...");
    console.log("API KEY (trimmed):", process.env.DASHSCOPE_API_KEY?.trim() ? "Yes" : "No");

    const testVoices = [
        { name: 'Official Flash (Cherry)', id: QWEN_OFFICIAL_VOICES.KIKI },
        { name: 'Official Flash (Aiden)', id: QWEN_OFFICIAL_VOICES.AIDEN }
    ];

    for (const v of testVoices) {
        console.log(`\n--- Testing ${v.name} (${v.id}) ---`);
        try {
            const buffer = await dashscopeService.generateSpeech({
                text: `Checking the ${v.name} voice performance. Magic is in the air!`,
                voice: v.id,
                format: 'mp3'
            });
            console.log(`✅ Success! Received ${buffer.length} bytes.`);
        } catch (err: any) {
            console.error(`❌ FAILED for ${v.name}:`, err.message);
        }
    }
}

verifyPreview();
