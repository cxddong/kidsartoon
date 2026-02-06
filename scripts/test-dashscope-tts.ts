import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv'; // Ensure you have this or use simple require if needed

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const API_KEY = process.env.DASHSCOPE_API_KEY;
const URL = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/generation';

console.log(`API KEY: ${API_KEY ? 'YES' : 'NO'}`);

async function test() {
    try {
        const res = await fetch(URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sambert-zh-v1',
                input: { text: "Hello." },
                parameters: {
                    voice: 'longxiaochun',
                    format: 'mp3'
                }
            })
        });

        let msg = "";
        if (!res.ok) {
            const txt = await res.text();
            msg = `FAILED: ${res.status} - ${txt}`;
        } else {
            const buf = await res.buffer();
            msg = `SUCCESS! Size: ${buf.length}`;
        }

        fs.writeFileSync(path.join(process.cwd(), 'sambert_result.txt'), msg);
        console.log(msg);

    } catch (e: any) {
        fs.writeFileSync(path.join(process.cwd(), 'sambert_result.txt'), `EXCEPTION: ${e.message}`);
    }
}

test();
