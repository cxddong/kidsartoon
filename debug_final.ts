import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import NodeFormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debugFinal() {
    if (!API_KEY) {
        console.error("Missing DASHSCOPE_API_KEY");
        return;
    }

    const testFile = path.resolve('uploads', 'voice_1770110613127.wav');
    console.log("Uploading file...");
    const form = new NodeFormData();
    form.append('file', fs.createReadStream(testFile));

    const uploadResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/files?purpose=custom_voice', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            ...form.getHeaders()
        },
        body: form as any
    });

    const uploadData = await uploadResponse.json() as any;
    const fileId = uploadData.data?.uploaded_files?.[0]?.file_id;
    if (!fileId) {
        console.error("Upload failed:", JSON.stringify(uploadData));
        return;
    }

    console.log("File ID:", fileId);

    // Get the OSS URL
    const detailsRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/files/${fileId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const detailsData = await detailsRes.json() as any;
    const ossUrl = detailsData.data?.url;
    console.log("OSS URL:", ossUrl);

    const variations = [
        ossUrl,
        `dashscope://v1/file-id/${fileId}`,
        `dashscope://v1/file/${fileId}`,
        `dashscope://file-id/${fileId}`
    ];

    const results = [];
    for (const v of variations) {
        if (!v) continue;
        console.log(`Trying variation: ${v.substring(0, 50)}...`);
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
                    target_model: "qwen3-tts-flash",
                    preferred_name: "vflash" + Math.random().toString(36).substring(2, 6),
                    audio: { data: v },
                    text: "你好，测试录音",
                    language: "zh"
                }
            })
        });

        const data = await response.json() as any;
        console.log(`Result:`, JSON.stringify(data));
        results.push({ variation: v.substring(0, 100), status: response.status, data });
    }

    fs.writeFileSync('debug_final_results.json', JSON.stringify(results, null, 2));
}

debugFinal();
