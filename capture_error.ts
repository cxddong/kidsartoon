
import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';

async function captureError() {
    const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
    const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

    const voiceId = "qwen-tts-vc-v7b3643gkuw-voice-20260203170146905-2612";
    const models = ["qwen3-tts-flash", "qwen3-tts-vc-realtime", "qwen3-tts-v1"];

    for (const model of models) {
        console.log(`\n--- Testing Model: ${model} ---`);
        const payload = {
            model: model,
            input: { text: "Testing " + model },
            parameters: { voice: voiceId, format: "mp3" }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable'
            },
            body: JSON.stringify(payload)
        });

        const buf = await response.buffer();
        const text = buf.toString('utf8');
        console.log(`Status: ${response.status}, Bytes: ${buf.length}`);
        if (text.includes("error_message")) {
            console.log("Error:", text.substring(0, 200));
        } else {
            console.log("SUCCESS or Binary received.");
            fs.writeFileSync(`success_${model}.mp3`, buf);
        }
    }
}

captureError();
