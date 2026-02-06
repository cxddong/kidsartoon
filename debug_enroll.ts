import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import NodeFormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debugEnroll() {
    if (!API_KEY) {
        console.error("Missing DASHSCOPE_API_KEY");
        return;
    }

    const testFile = path.resolve('uploads', 'voice_1770110613127.wav');
    console.log("Uploading...");
    const form = new NodeFormData();
    form.append('file', fs.createReadStream(testFile));

    const uploadResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/files?purpose=custom_voice', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}`, ...form.getHeaders() },
        body: form as any
    });

    const uploadData = await uploadResponse.json() as any;
    const fileId = uploadData.data?.uploaded_files?.[0]?.file_id;
    if (!fileId) return;

    const detailsRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/files/${fileId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const detailsData = await detailsRes.json() as any;
    const ossUrl = detailsData.data?.url?.replace('http://', 'https://');

    const combinations = [
        { action: "enroll", audio: { data: `dashscope://file-id/${fileId}` } },
        { action: "create", audio: { data: `dashscope://file-id/${fileId}` }, text: "你好，欢迎使用" },
        { action: "create", audio: { data: ossUrl } }
    ];

    const results = [];
    for (const c of combinations) {
        console.log(`Trying action: ${c.action}, audio: ${JSON.stringify(c.audio).substring(0, 30)}...`);
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "qwen-voice-enrollment",
                input: {
                    action: c.action,
                    target_model: "qwen3-tts-vc-realtime-2026-01-15",
                    preferred_name: "tv" + Math.random().toString(36).substring(2, 6),
                    audio: c.audio,
                    text: (c as any).text || "你好，测试录音",
                    language: "zh"
                }
            })
        });

        const data = await response.json() as any;
        console.log(`Result:`, JSON.stringify(data));
        results.push({ config: c, status: response.status, data });
    }

    fs.writeFileSync('debug_enroll_results.json', JSON.stringify(results, null, 2));
}

debugEnroll();
