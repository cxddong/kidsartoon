import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debugUpload() {
    if (!API_KEY) {
        console.error("Missing DASHSCOPE_API_KEY");
        return;
    }

    const testFile = path.resolve('uploads', 'voice_1770110613127.wav');
    const form = new FormData();
    form.append('file', fs.createReadStream(testFile));

    const url = 'https://dashscope.aliyuncs.com/api/v1/files?purpose=custom_voice';

    console.log("Uploading...");
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await response.json();
        console.log("UPLOAD RESPONSE:", JSON.stringify(data, null, 2));

        const fileId = data.data?.uploaded_files?.[0]?.file_id;
        if (fileId) {
            console.log(`Fetching details for file ${fileId}`);
            const detailsUrl = `https://dashscope.aliyuncs.com/api/v1/files/${fileId}`;
            const detailsRes = await fetch(detailsUrl, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });
            const detailsData = await detailsRes.json();
            console.log("DETAILS FETCHED");

            const variations = [
                `dashscope://file-id/${fileId}`,
                `dashscope://file/${fileId}`
            ];

            const results = [];
            for (const v of variations) {
                console.log(`Trying variation: ${v}`);
                const enrollUrl = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization';
                const enrollPayload = {
                    model: "qwen-voice-enrollment",
                    input: {
                        action: "create",
                        target_model: "qwen3-tts-vc-realtime-2026-01-15",
                        preferred_name: "vtest" + Math.random().toString(36).substring(2, 6),
                        audio: { data: v },
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

                const enrollData = await enrollRes.json();
                console.log(`Result for ${v}:`, JSON.stringify(enrollData));
                results.push({ variation: v, response: enrollData });
            }
            fs.writeFileSync('debug_full_results.json', JSON.stringify({ upload: data, details: detailsData, results }, null, 2));
        }

        console.log("Trying MULTIPART enrollment...");
        const mform = new FormData();
        mform.append('model', 'qwen-voice-enrollment');
        mform.append('action', 'create');
        mform.append('target_model', 'qwen3-tts-vc-realtime-2026-01-15');
        mform.append('preferred_name', 'vmulti' + Math.random().toString(36).substring(2, 6));
        mform.append('audio_file', fs.createReadStream(testFile));
        mform.append('text', 'Hello world testing multipart.');
        mform.append('language', 'zh');

        const murl = 'https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization/multipart';
        const mres = await fetch(murl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                ...mform.getHeaders()
            },
            body: mform
        });

        const mdata = await mres.json();
        console.log("MULTIPART RESPONSE:", JSON.stringify(mdata, null, 2));
        fs.writeFileSync('debug_multipart_results.json', JSON.stringify(mdata, null, 2));
    } catch (error) {
        console.error("ERROR:", error);
    }
}

debugUpload();
