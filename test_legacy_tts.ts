
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

async function testLegacyTTS() {
    const API_KEY = process.env.DASHSCOPE_API_KEY?.replace(/\s/g, '');
    const url = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation';

    const payload = {
        model: "qwen3-tts-flash",
        input: {
            text: "Testing legacy direct binary output."
        },
        parameters: {
            voice: "Cherry",
            format: "mp3"
        }
    };

    console.log("Calling DashScope Legacy TTS Endpoint...");
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    console.log("Status:", response.status);
    console.log("Content-Type:", response.headers.get('content-type'));

    if (response.headers.get('content-type')?.includes('application/json')) {
        console.log("JSON Body:", await response.text());
    } else {
        const buffer = await response.buffer();
        console.log("Binary Success! Size:", buffer.length);
    }
}

testLegacyTTS();
