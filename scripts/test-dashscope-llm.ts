import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;
console.log(`API KEY: ${API_KEY ? 'Present' : 'MISSING'}`);

const URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

async function test() {
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                input: { messages: [{ role: 'user', content: 'Hello' }] }
            })
        });

        if (res.ok) {
            console.log("✅ LLM SUCCESS: Key works for Chat!");
        } else {
            const txt = await res.text();
            console.log(`❌ LLM FAILED: ${res.status} ${txt}`);
        }
    } catch (e: any) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

test();
