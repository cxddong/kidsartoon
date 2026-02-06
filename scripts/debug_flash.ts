import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;

const URL_AIGC = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech';
const URL_GEN = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation';

const MODEL = 'qwen3-tts-flash'; // As requested by user
const VOICE = 'cherry';

async function test(name: string, url: string, payload: any) {
    console.log(`\nTesting ${name} -> ${url}...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            console.log(`✅ SUCCESS! Status: ${res.status}`);
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

async function run() {
    // TEST 1: Standard AIGC format (User Guide)
    await test('AIGC Standard', URL_AIGC, {
        model: MODEL,
        input: { text: "Hello flash." },
        parameters: { voice: VOICE, format: 'mp3' }
    });

    // TEST 2: Generation format (Common for non-AIGC models)
    await test('Generation Standard', URL_GEN, {
        model: MODEL,
        input: { text: "Hello flash." },
        parameters: { voice: VOICE, format: 'mp3' }
    });

    // TEST 3: OpenAI Compatible Format (Some Qwen models use /v1/audio/speech)
    // Note: DashScope has an OpenAI compatible endpoint: https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech
    const URL_OPENAI = 'https://dashscope.aliyuncs.com/compatible-mode/v1/audio/speech';
    await test('OpenAI Compatible', URL_OPENAI, {
        model: MODEL,
        input: "Hello flash.",
        voice: VOICE,
        response_format: 'mp3'
    });
}

run();
