import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;
console.log(`API KEY: ${API_KEY ? 'Loaded' : 'Missing'}`);

// Possible Endpoints
const URL_TTS = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-to-speech/generation'; // Standard for Qwen-TTS
const URL_MM = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'; // Inferred from MultiModalConversation

const TESTS = [
    {
        name: 'TTS Endpoint (Capitalized Voice)',
        url: URL_TTS,
        body: {
            model: 'qwen3-tts-flash',
            input: { text: "Hello, this is a test." },
            parameters: {
                voice: 'Cherry', // Capitalized per doc
                format: 'mp3',
                sample_rate: 24000
            }
        }
    },
    {
        name: 'Qwen-TTS Legacy Model (Capitalized Voice)',
        url: URL_TTS,
        body: {
            model: 'qwen-tts-latest',
            input: { text: "Hello, this is a test." },
            parameters: {
                voice: 'Cherry',
                format: 'mp3'
            }
        }
    }
];

async function run() {
    for (const t of TESTS) {
        console.log(`\nTesting ${t.name}...`);
        try {
            const res = await fetch(t.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json',
                    'X-DashScope-Async': 'enable' // Sometimes needed for generation endpoint? typically not for flash
                },
                body: JSON.stringify(t.body)
            });

            if (res.ok) {
                console.log("✅ SUCCESS!");
                const buf = await res.buffer();
                console.log(`Received ${buf.length} bytes.`);
                process.exit(0);
            } else {
                const txt = await res.text();
                // console.log(`❌ FAILED: ${res.status} ${txt.substring(0, 200)}`);
                console.log(`❌ FAILED: ${res.status} ${txt}`);
            }
        } catch (e: any) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }
}

run();
