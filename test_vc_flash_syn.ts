
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

async function testVCFlashSynthesis() {
    const API_KEY = process.env.DASHSCOPE_API_KEY?.replace(/\s/g, '');
    const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

    // We'll use the ID from our previous successful enrollment
    const voiceId = "qwen-tts-vc-v7b36435j3f-voice-20260203124955726-cc55";

    const payload = {
        model: "qwen3-tts-vc-flash",
        input: {
            text: "Testing Qwen3 VC-Flash synthesis with binary SSE."
        },
        parameters: {
            voice: voiceId
        }
    };

    console.log(`Calling Qwen3 VC-Flash with ID: ${voiceId} and SSE enabled...`);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        console.error("Error:", response.status, await response.text());
        return;
    }

    response.body.on('data', (chunk: Buffer) => {
        const line = chunk.toString();
        if (line.includes('audio_bin')) {
            console.log("Found binary chunk!");
        } else {
            console.log("Chunk:", line.substring(0, 100));
        }
    });

    response.body.on('end', () => {
        console.log("DONE");
    });
}

testVCFlashSynthesis();
