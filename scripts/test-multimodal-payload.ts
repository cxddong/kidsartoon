import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;
// Using the MultiModal generation endpoint
const URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

console.log(`Testing MultiModal Payload on ${URL}`);

async function test() {
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'X-DashScope-WorkSpace': 'default' // sometimes needed
            },
            body: JSON.stringify({
                model: 'qwen3-tts-flash',
                input: {
                    messages: [
                        {
                            role: 'user',
                            content: [
                                { text: 'Hello, this is a test.' }
                            ]
                        }
                    ]
                },
                parameters: {
                    voice: 'Cherry',
                    format: 'mp3'
                }
            })
        });

        if (res.ok) {
            console.log("✅ SUCCESS!");
            const buf = await res.buffer();
            console.log(`Received ${buf.length} bytes.`);
        } else {
            const txt = await res.text();
            console.log(`❌ FAILED: ${res.status} ${txt}`);
        }
    } catch (e: any) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

test();
