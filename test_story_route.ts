import fetch from 'node-fetch';
import FormData from 'form-data';

async function test() {
    console.log("Testing POST /api/media/image-to-voice...");
    const form = new FormData();
    form.append('userId', 'test_user');
    form.append('voice', 'female');
    form.append('lang', 'en');
    form.append('userVoiceText', 'A story about a brave cat');

    // We'll skip the actual image for simplicity if the backend handles it
    // Actually, media.ts requires an image or imageBuffer if it wants to do vision
    // But let's see if it fails gracefully if we send nothing.

    try {
        const res = await fetch('http://localhost:3001/api/media/image-to-voice', {
            method: 'POST',
            body: form
        });

        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response:", text);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

test();
