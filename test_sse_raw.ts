
import dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';

async function testSSERaw() {
    const API_KEY = process.env.DASHSCOPE_API_KEY?.replace(/\s/g, '');
    const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

    // Test Case: REAL Custom Realtime Model
    const payload = {
        model: "qwen3-tts-vc-realtime-2026-01-15",
        input: { text: "Testing the robust SSE fix with your actual magic voice." },
        parameters: { voice: "qwen-tts-vc-v7b3643m2p6-voice-20260203164906287-be33", format: "mp3" }
    };

    console.log("Calling DashScope with SSE enabled...");
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
        const err = await response.text();
        console.error("FULL ERROR RESPONSE:", err);
        return;
    }

    console.log("✅ Connection established. Processing stream...");

    let totalSize = 0;
    response.body.on('data', (chunk: Buffer) => {
        totalSize += chunk.length;
        const head = chunk.toString('utf8').substring(0, 50);
        console.log(`CHUNK: ${chunk.length} bytes. Sample: [${head.replace(/\n/g, '\\n')}]`);
    });

    response.body.on('end', () => {
        console.log(`DONE. Received ${totalSize} total bytes.`);
    });
}

testSSERaw();
