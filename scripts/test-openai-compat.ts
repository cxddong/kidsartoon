import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;
const URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech';

console.log(`Testing OpenAI Compat: ${URL}`);

async function test() {
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen3-tts-flash', // User's requested model
                input: "Hello world.",
                voice: 'cherry', // Qwen voice
                response_format: 'mp3'
            })
        });

        if (res.ok) {
            console.log("✅ SUCCESS!");
        } else {
            const text = await res.text();
            console.log(`❌ FAILED: ${res.status} ${text}`);
        }
    } catch (e: any) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

test();
