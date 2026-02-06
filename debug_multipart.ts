import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import NodeFormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debugMultipart() {
    if (!API_KEY) {
        console.error("Missing DASHSCOPE_API_KEY");
        return;
    }

    const testFile = path.resolve('uploads', 'voice_1770110613127.wav');
    console.log("Preparing multipart enrollment...");

    const form = new NodeFormData();
    // Some Aliyun APIs want the JSON params in a 'parameter' field or as individual fields
    const model = "qwen-voice-enrollment";
    const input = {
        action: "create",
        target_model: "qwen3-tts-vc-realtime-2026-01-15",
        preferred_name: "vmulti" + Math.random().toString(36).substring(2, 6),
        text: "你好，测试录音",
        language: "zh"
    };

    form.append('model', model);
    form.append('input', JSON.stringify(input));
    form.append('audio', fs.createReadStream(testFile));

    const url = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                ...form.getHeaders()
            },
            body: form as any
        });

        const data = await response.json() as any;
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));

        fs.writeFileSync('debug_multipart_direct_results.json', JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.error("ERROR:", e.message);
    }
}

debugMultipart();
