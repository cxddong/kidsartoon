import 'dotenv/config';
import fetch from 'node-fetch';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

const payload = {
    model: "qwen3-tts-flash",
    input: {
        text: "Hello, testing the audio format."
    },
    parameters: {
        voice: "Cherry",
        format: "mp3"
    }
};

async function inspect() {
    console.log("Calling URL:", url);
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
            'Content-Type': 'application/json',
            'X-DashScope-Data-Inspection': 'enable' // Optional debug header
        },
        body: JSON.stringify(payload)
    });

    console.log("Status:", response.status);
    console.log("Headers:");
    response.headers.forEach((v, k) => console.log(`  ${k}: ${v}`));

    const contentType = response.headers.get('content-type');
    const buffer = await response.buffer();
    console.log("Body Size:", buffer.length);
    console.log("Body Hex Start:", buffer.slice(0, 10).toString('hex'));

    if (contentType?.includes('application/json') || buffer.slice(0, 1).toString() === '{') {
        const text = buffer.toString('utf-8');
        console.log("Response is JSON. Body Length:", text.length);
        const fs = await import('fs');
        fs.writeFileSync('dashscope_body_sample.txt', text);
    } else {
        console.log("Response is likely Binary Audio.");
    }
}

inspect();
