import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function testSynthesis() {
    if (!API_KEY) {
        console.error("Missing DASHSCOPE_API_KEY");
        return;
    }

    // This is the Voice ID from our successful fixed enrollment
    const voiceId = "qwen-tts-vc-vcf9712q2l8-voice-20260203181443716-cb61";

    // Testing both Sambert (standard) and CosyVoice V3
    const models = ["qwen3-tts-flash", "cosyvoice-v3-plus", "cosyvoice-v3-flash"];

    for (const model of models) {
        console.log(`\n--- Testing Model: ${model} ---`);
        // We've verified that Qwen3 and newer models often use the AIGC endpoint
        const url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

        const payload = {
            model: model,
            input: { text: "Hello, this is a test of the upgraded CosyVoice platform." },
            parameters: {
                voice: voiceId,
                format: "mp3"
            }
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json() as any;
            console.log(`Status: ${res.status}`);
            console.log(`Response:`, JSON.stringify(data, null, 2));

            if (data.output?.audio_url || data.output?.url) {
                console.log(`SUCCESS: Found audio at: ${data.output.audio_url || data.output.url}`);
            }
        } catch (e: any) {
            console.error(`Error with ${model}:`, e.message);
        }
    }
}

testSynthesis();
