import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function testFileUpload() {
    if (!API_KEY) {
        console.error("Missing DASHSCOPE_API_KEY");
        return;
    }

    const testFile = path.resolve('success_qwen3-tts-flash.mp3');
    if (!fs.existsSync(testFile)) {
        console.error("Test file not found:", testFile);
        return;
    }

    console.log("Uploading file to DashScope...");
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile));

    // Aliyun DashScope Files API requires 'X-DashScope-WorkSpace' if you have multiple, 
    // but usually just 'Authorization' is enough.
    // The query param 'purpose' is often passed in the URL or sometimes in the form.
    const url = 'https://dashscope.aliyuncs.com/api/v1/files?purpose=custom_voice';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await response.json() as any;
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));

        if (response.ok && data.output?.file_id) {
            const fileId = data.output.file_id;
            console.log("UPLOAD SUCCESS! File ID:", fileId);

            // Now try to enroll using this fileId
            console.log("Attempting to enroll voice using File ID...");
            const enrollUrl = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization';
            const enrollPayload = {
                model: "qwen-voice-enrollment",
                input: {
                    action: "create",
                    target_model: "qwen3-tts-vc-realtime-2026-01-15",
                    preferred_name: "vtest" + Math.random().toString(36).substring(2, 6),
                    audio: { data: `dashscope://file-id-${fileId}` },
                    text: "Hello world testing.",
                    language: "zh"
                }
            };

            const enrollRes = await fetch(enrollUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(enrollPayload)
            });

            const enrollData = await enrollRes.json() as any;
            console.log("Enroll Status:", enrollRes.status);
            console.log("Enroll Response:", JSON.stringify(enrollData, null, 2));

        } else {
            console.error("UPLOAD FAILED", JSON.stringify(data));
        }
    } catch (error) {
        console.error("ERROR during test:", error);
    }
}

testFileUpload();
