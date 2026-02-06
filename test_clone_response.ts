
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function run() {
    console.log("Testing /api/voice-lab/clone response structure...");

    // Create a dummy file
    const dummyPath = path.join(process.cwd(), 'dummy_voice.wav');
    fs.writeFileSync(dummyPath, 'RIFF....WAVEfmt ... data....');

    const form = new FormData();
    form.append('audio', fs.createReadStream(dummyPath));
    form.append('userId', 'debug_user_123');
    form.append('voiceName', 'Debug Voice');
    form.append('provider', 'qwen'); // Mock qwen provider

    try {
        const res = await fetch('http://localhost:3001/api/voice-lab/clone', {
            method: 'POST',
            body: form
        });

        const data = await res.json();
        const output = `Status: ${res.status}\nBody: ${JSON.stringify(data, null, 2)}`;
        fs.writeFileSync('d:/KAT/KAT/logs/test_response.log', output);
        console.log("Log returned to file logs/test_response.log");

        if (data.voice && data.voice.id) {
            console.log("PASS: Response contains 'voice' object.");
        } else {
            console.log("FAIL: Response Missing 'voice' object.");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    }
}

run();
