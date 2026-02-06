import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;
console.log(`API KEY: ${API_KEY ? 'Loaded' : 'Missing'}`);

const ENDPOINTS = {
    AIGC: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech',
    GEN: 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation',
    OPENAI: 'https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech'
};

const COMBOS = [
    { name: 'Qwen3 Flash (AIGC)', url: ENDPOINTS.AIGC, body: { model: 'qwen3-tts-flash', input: { text: 'hi' }, parameters: { voice: 'cherry', format: 'mp3' } } },
    { name: 'CosyVoice V1 (GEN)', url: ENDPOINTS.GEN, body: { model: 'cosyvoice-v1', input: { text: 'hi' }, parameters: { voice: 'longxiaochun', format: 'mp3' } } },
    { name: 'Sambert (GEN)', url: ENDPOINTS.GEN, body: { model: 'sambert-zh-v1', input: { text: 'hi' }, parameters: { voice: 'longxiaochun', format: 'mp3' } } },
    { name: 'Speech Synth (GEN)', url: ENDPOINTS.GEN, body: { model: 'speech-synthesizer', input: { text: 'hi' }, parameters: { voice: 'longxiaochun', format: 'mp3' } } },
    { name: 'Qwen OpenAI', url: ENDPOINTS.OPENAI, body: { model: 'qwen3-tts-flash', input: 'hi', voice: 'cherry', response_format: 'mp3' } },
];

async function run() {
    for (const c of COMBOS) {
        process.stdout.write(`Testing ${c.name}... `);
        try {
            const res = await fetch(c.url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(c.body)
            });
            if (res.ok) {
                console.log("✅ PASS");
                console.log(`>>> SUGGESTED FIX: Use ${c.name} configuration.`);
                process.exit(0);
            } else {
                const txt = await res.text();
                // console.log(`❌ FAIL (${res.status}): ${txt.substring(0, 100)}`);
                console.log(`❌ FAIL (${res.status})`);
            }
        } catch (e) {
            console.log("❌ ERR");
        }
    }
    console.log("ALL TESTS FAILED. Service likely not activated.");
}

run();
