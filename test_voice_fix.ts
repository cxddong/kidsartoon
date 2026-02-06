import { dashscopeService } from './src/services/dashscopeService';
import dotenv from 'dotenv';
dotenv.config();

// We need to subclass or mock to change the model, OR just call the internal fetch directly if possible.
// But simpler: just modify dashscopeService.ts temporarily OR use a direct fetch script.

// Direct fetch script to bypass dashscopeService logic
import fetch from 'node-fetch';

async function run() {
    const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
    if (!apiKey) { console.error("No API Key"); return; }

    const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    const voiceId = 'v7b364377cz-voice-20260206104034587-6365';

    // Try qwen3-tts-flash
    const payload = {
        model: "qwen3-tts-flash", // TRYING THIS
        input: { text: "This is a test of the custom voice system." },
        parameters: {
            voice: voiceId,
            format: "mp3"
        }
    };

    console.log("Testing qwen3-tts-flash with custom voice...");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable' // or disable
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Status:", response.status);
            console.error("Text:", await response.text());
        } else {
            console.log("Success! Status:", response.status);
            // Read stream briefly
            response.body?.on('data', (chunk) => console.log("Chunk:", chunk.toString().substring(0, 50)));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
