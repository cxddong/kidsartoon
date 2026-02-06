import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv'; // Ensure dotenv is used

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;
const URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech';

console.log(`Testing qwen3-tts-flash with Key: ${API_KEY ? 'Present' : 'MISSING'}`);

async function test() {
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen3-tts-flash',
                input: { text: "Hello! This is the flash model." },
                parameters: {
                    voice: 'cherry',
                    format: 'mp3'
                }
            })
        });

        if (res.ok) {
            console.log("✅ SUCCESS: qwen3-tts-flash works!");
            const buf = await res.buffer();
            console.log(`Received ${buf.length} bytes audio.`);
        } else {
            const txt = await res.text();
            console.log(`❌ FAILED: ${res.status} ${txt}`);
        }
    } catch (e: any) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

test();
