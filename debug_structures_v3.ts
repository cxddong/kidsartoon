import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debugStructuresV3() {
    if (!API_KEY) return;

    const testFile = path.resolve('uploads', 'voice_1770110613127.wav');
    const audioBuffer = fs.readFileSync(testFile);
    const base64 = audioBuffer.toString('base64');
    const dataUri = `data:audio/wav;base64,${base64}`;

    const variations = [
        {
            name: "audio: { data_url: v }",
            input: {
                action: "create",
                target_model: "qwen3-tts-vc-realtime-2026-01-15",
                preferred_name: "vs" + Math.random().toString(36).substring(2, 6),
                audio: { data_url: dataUri },
                text: "你好，测试录音",
                language: "zh"
            }
        },
        {
            name: "audio: [ { audio_url: v } ]",
            input: {
                action: "create",
                target_model: "qwen3-tts-vc-realtime-2026-01-15",
                preferred_name: "vs" + Math.random().toString(36).substring(2, 6),
                audio: [{ audio_url: dataUri }],
                text: "你好，测试录音",
                language: "zh"
            }
        },
        {
            name: "audio: [ { data: v } ]",
            input: {
                action: "create",
                target_model: "qwen3-tts-vc-realtime-2026-01-15",
                preferred_name: "vs" + Math.random().toString(36).substring(2, 6),
                audio: [{ data: dataUri }],
                text: "你好，测试录音",
                language: "zh"
            }
        }
    ];

    const results = [];
    for (const v of variations) {
        console.log(`Trying: ${v.name}`);
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "qwen-voice-enrollment",
                input: v.input
            })
        });

        const data = await response.json() as any;
        console.log(`Result:`, JSON.stringify(data));
        results.push({ name: v.name, status: response.status, data });
    }

    fs.writeFileSync('debug_structures_v3_results.json', JSON.stringify(results, null, 2));
}

debugStructuresV3();
