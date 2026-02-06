import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

async function run() {
    const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
    if (!apiKey) { console.error("No API Key"); return; }

    const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    const voiceId = 'v7b364377cz-voice-20260206104034587-6365';

    // Test with parameters that might break CosyVoice
    const payload = {
        model: "cosyvoice-v3-plus",
        input: { text: "Protocol verification test." },
        parameters: {
            voice: voiceId,
            format: "mp3",
            speech_rate: 1.0,
            pitch: 1.0
        }
    };

    console.log("Testing cosyvoice-v3-plus with extra parameters...");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable'
            },
            body: JSON.stringify(payload)
        });

        console.log("Response Status:", response.status);

        const fs = require('fs');
        fs.writeFileSync('d:/KAT/KAT/logs/test_voice_result.log', `Status: ${response.status}\n`);

        let chunkCount = 0;
        await new Promise<void>((resolve, reject) => {
            response.body?.on('data', (chunk) => {
                chunkCount++;
                fs.appendFileSync('d:/KAT/KAT/logs/test_voice_result.log', `Chunk: ${chunk.toString().length} bytes\n`);
            });
            response.body?.on('end', () => {
                console.log(`Stream ended. Total chunks: ${chunkCount}`);
                fs.appendFileSync('d:/KAT/KAT/logs/test_voice_result.log', `Stream Ended. Total Chunks: ${chunkCount}\n`);
                resolve();
            });
            response.body?.on('error', (e) => reject(e));
        });

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
