import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import NodeFormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debugFinalV2() {
    if (!API_KEY) return;

    const testFile = path.resolve('uploads', 'voice_1770110613127.wav');
    const audioBuffer = fs.readFileSync(testFile);
    const base64 = audioBuffer.toString('base64');

    console.log("Uploading for fileid test...");
    const form = new NodeFormData();
    form.append('file', fs.createReadStream(testFile));
    const uploadRes = await fetch('https://dashscope.aliyuncs.com/api/v1/files?purpose=custom_voice', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}`, ...form.getHeaders() },
        body: form
    });
    const uploadData = await uploadRes.json() as any;
    const fileId = uploadData.data?.uploaded_files?.[0]?.file_id;
    console.log("File ID:", fileId);

    const variations = [
        { name: "fileid:// URI", audio: { data: `fileid://${fileId}` } },
        { name: "Raw Base64 (No prefix)", audio: { data: base64 } },
        { name: "Audio Object with URL field", audio: { url: `dashscope://file-id/${fileId}` } },
        { name: "Audio Object with direct fileid", audio: { file_id: fileId } }
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
                input: {
                    action: "create",
                    target_model: "qwen3-tts-vc-realtime-2026-01-15",
                    preferred_name: "vv" + Math.random().toString(36).substring(2, 6),
                    audio: v.audio,
                    text: "你好，欢迎使用",
                    language: "zh"
                }
            })
        });

        const data = await response.json() as any;
        console.log(`Result:`, JSON.stringify(data));
        results.push({ name: v.name, status: response.status, data });
    }

    fs.writeFileSync('debug_final_v2_results.json', JSON.stringify(results, null, 2));
}

debugFinalV2();
