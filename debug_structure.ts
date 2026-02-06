import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import NodeFormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debugStructure() {
    if (!API_KEY) {
        console.error("Missing DASHSCOPE_API_KEY");
        return;
    }

    const testFile = path.resolve('uploads', 'voice_1770110613127.wav');
    const audioBuffer = fs.readFileSync(testFile);
    const base64 = audioBuffer.toString('base64');
    const dataUri = `data:audio/wav;base64,${base64}`;

    const payloads = [
        {
            name: "Standard Object",
            payload: {
                model: "qwen-voice-enrollment",
                input: {
                    action: "create",
                    target_model: "qwen3-tts-vc-realtime-2026-01-15",
                    preferred_name: "vstruct" + Math.random().toString(36).substring(2, 6),
                    audio: { data: dataUri },
                    text: "你好，测试录音",
                    language: "zh"
                }
            }
        },
        {
            name: "Array of Objects",
            payload: {
                model: "qwen-voice-enrollment",
                input: {
                    action: "create",
                    target_model: "qwen3-tts-vc-realtime-2026-01-15",
                    preferred_name: "vstruct" + Math.random().toString(36).substring(2, 6),
                    audio: [{ data: dataUri }],
                    text: "你好，测试录音",
                    language: "zh"
                }
            }
        },
        {
            name: "Direct Audio String (Base64)",
            payload: {
                model: "qwen-voice-enrollment",
                input: {
                    action: "create",
                    target_model: "qwen3-tts-vc-realtime-2026-01-15",
                    preferred_name: "vstruct" + Math.random().toString(36).substring(2, 6),
                    audio: dataUri,
                    text: "你好，测试录音",
                    language: "zh"
                }
            }
        }
    ];

    const results = [];
    for (const p of payloads) {
        console.log(`Trying variation: ${p.name}`);
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(p.payload)
        });

        const data = await response.json() as any;
        console.log(`Result:`, JSON.stringify(data));
        results.push({ name: p.name, status: response.status, data });
    }

    fs.writeFileSync('debug_structure_results.json', JSON.stringify(results, null, 2));
}

debugStructure();
