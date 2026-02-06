import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;
console.log(`API KEY: ${API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING'}`);

const ENDPOINTS = {
    GEN: 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation',
    AIGC: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech'
};

const TESTS = [
    { name: 'Sambert', model: 'sambert-zh-v1', voice: 'longxiaochun', url: ENDPOINTS.GEN },
    { name: 'CosyVoice', model: 'cosyvoice-v1', voice: 'longxiaochun', url: ENDPOINTS.GEN },
    { name: 'Qwen3', model: 'qwen3-tts-realtime-2026-01-15', voice: 'cherry', url: ENDPOINTS.AIGC },
    // Try a potential 'latest' or 'v1' for qwen3 if date is wrong?
    { name: 'Qwen3-Simple', model: 'qwen3-tts', voice: 'cherry', url: ENDPOINTS.AIGC }
];

async function run() {
    for (const t of TESTS) {
        console.log(`\nTesting ${t.name} (${t.model})...`);
        try {
            const res = await fetch(t.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: t.model,
                    input: { text: "Hello." },
                    parameters: {
                        voice: t.voice,
                        format: 'mp3'
                    }
                })
            });

            if (res.ok) {
                console.log(`✅ SUCCESS!`);
            } else {
                const txt = await res.text();
                console.log(`❌ FAILED: ${res.status} ${txt}`);
            }
        } catch (e: any) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }
}

run();
