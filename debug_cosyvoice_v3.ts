import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import NodeFormData from 'form-data';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function testDashscopeURI() {
    if (!API_KEY) {
        console.error("Missing DASHSCOPE_API_KEY");
        return;
    }

    const audioPath = path.resolve("uploads/voice_1770086883582.wav");
    if (!fs.existsSync(audioPath)) {
        console.error("Audio file not found:", audioPath);
        return;
    }

    // 1. Upload File
    console.log("Uploading file...");
    const form = new NodeFormData();
    form.append('file', fs.createReadStream(audioPath));
    const uploadRes = await fetch('https://dashscope.aliyuncs.com/api/v1/files?purpose=custom_voice', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${API_KEY}`, ...form.getHeaders() },
        body: form as any
    });
    const uploadData = await uploadRes.json() as any;
    const fileId = uploadData.data?.uploaded_files?.[0]?.file_id || uploadData.id;
    if (!fileId) {
        console.error("Upload failed:", uploadData);
        return;
    }
    const dashscopeUri = `dashscope://file-id/${fileId}`;
    console.log("Got URI:", dashscopeUri);

    const tests = [
        {
            name: "NewEP_DSURI_URL_Param",
            url: "https://dashscope.aliyuncs.com/api/v1/services/audio/voice-enrollment/voice",
            payload: {
                model: "voice-enrollment",
                input: {
                    target_model: "cosyvoice-v3-plus",
                    prefix: "cv3ds",
                    url: dashscopeUri
                }
            }
        },
        {
            name: "NewEP_DSURI_AudioURL_Param",
            url: "https://dashscope.aliyuncs.com/api/v1/services/audio/voice-enrollment/voice",
            payload: {
                model: "voice-enrollment",
                input: {
                    target_model: "cosyvoice-v3-plus",
                    prefix: "cv3ds",
                    audio_url: dashscopeUri
                }
            }
        },
        {
            name: "NewEP_CosyModelName",
            url: "https://dashscope.aliyuncs.com/api/v1/services/audio/voice-enrollment/voice",
            payload: {
                model: "cosyvoice-enrollment",
                input: {
                    target_model: "cosyvoice-v3-plus",
                    prefix: "cv3ds",
                    url: dashscopeUri
                }
            }
        }
    ];

    const results = [];
    for (const t of tests) {
        console.log(`Running test: ${t.name}`);
        try {
            const res = await fetch(t.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(t.payload)
            });
            const data = await res.json() as any;
            console.log(`Status: ${res.status}`);
            results.push({ name: t.name, status: res.status, data });
        } catch (e: any) {
            results.push({ name: t.name, error: e.message });
        }
    }

    fs.writeFileSync('debug_cosyvoice_dsuri_results.json', JSON.stringify(results, null, 2));
}

testDashscopeURI();
