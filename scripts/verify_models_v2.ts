import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv'; // Ensure dotenv is used

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;

// URL for "Generation" (CosyVoice, Sambert)
const URL_GEN = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation';

console.log(`Checking API Key: ${API_KEY ? 'Present' : 'Missing'}`);

const CANDIDATES = [
    { model: 'cosyvoice-v1', voice: 'longxiaochun', endpoint: URL_GEN },
    { model: 'sambert-zh-v1', voice: 'longxiaochun', endpoint: URL_GEN },
    { model: 'qwen-tts-v1', voice: 'longxiaochun', endpoint: URL_GEN },
    // Trying the user's specific request again just in case, but using the generation endpoint?
    // The user guide said /aigc/ endpoint for qwen3. Let's try that endpoint again with correct model if possible.
    // { model: 'qwen3-tts-realtime-2026-01-15', voice: 'cherry', endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech' }
];

async function test() {
    for (const c of CANDIDATES) {
        console.log(`Testing ${c.model}...`);
        try {
            const res = await fetch(c.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: c.model,
                    input: { text: "Hello." },
                    parameters: {
                        voice: c.voice,
                        format: 'mp3'
                    }
                })
            });

            if (res.ok) {
                const msg = `✅ SUCCESS: ${c.model} works!`;
                console.log(msg);
                fs.writeFileSync(path.join(process.cwd(), 'verify_result.txt'), msg);
                process.exit(0); // Found a working one
            } else {
                const txt = await res.text();
                const msg = `❌ FAIL: ${c.model} - ${res.status} ${txt}\n`;
                console.log(msg);
                fs.appendFileSync(path.join(process.cwd(), 'verify_result.txt'), msg);
            }
        } catch (e) {
            console.log(`❌ ERR: ${e}`);
        }
    }
}

test();
