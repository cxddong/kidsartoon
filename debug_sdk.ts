import dashscope from 'dashscope';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;
if (API_KEY) dashscope.apiKey = API_KEY;

async function debugWithSDK() {
    if (!API_KEY) {
        console.error("Missing DASHSCOPE_API_KEY");
        return;
    }

    const testFile = path.resolve('uploads', 'voice_1770110613127.wav');

    // Upload first via fetch (standard way)
    console.log("Uploading...");
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile));
    const uploadRes = await fetch('https://dashscope.aliyuncs.com/api/v1/files?purpose=custom_voice', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}`, ...form.getHeaders() },
        body: form
    });
    const uploadData = await uploadRes.json() as any;
    const fileId = uploadData.data?.uploaded_files?.[0]?.file_id;

    if (!fileId) {
        console.error("Upload failed");
        return;
    }
    console.log("File ID:", fileId);

    const variations = [
        `dashscope://file-id/${fileId}`,
        `dashscope://file/${fileId}`
    ];

    for (const v of variations) {
        console.log(`Trying variation with SDK: ${v}`);
        try {
            const result = await dashscope.audio.SpeechSynthesizer.call({
                model: "qwen-voice-enrollment",
                input: {
                    action: "create",
                    target_model: "qwen3-tts-vc-realtime-2026-01-15",
                    preferred_name: "vsdk" + Math.random().toString(36).substring(2, 6),
                    audio: { data: v },
                    text: "你好，测试录音",
                    language: "zh"
                }
            });
            console.log("SUCCESS:", JSON.stringify(result, null, 2));
        } catch (e: any) {
            console.log("FAILED:", e.message || e);
        }
    }
}

debugWithSDK();
