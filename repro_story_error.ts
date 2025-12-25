
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function test() {
    console.log("Testing /api/media/image-to-voice...");

    const form = new FormData();
    // Create a dummy image file (1x1 pixel or just text masquerading as image if backend is loose, 
    // but backend uses sharp so might need real image. Let's try to find one or create one.)
    // We'll create a simple text file and hope sharp fails gracefully or we use a real image if found.
    // Let's check for an image in public/assets.
    const imagePath = path.resolve('client/public/favicons/favicon-32x32.png'); // Should exist

    if (fs.existsSync(imagePath)) {
        console.log("Using image:", imagePath);
        form.append('image', fs.createReadStream(imagePath));
    } else {
        console.log("No favicon found, creating dummy buffer");
        form.append('image', Buffer.from("fake image data"), { filename: 'test.jpg' });
    }

    form.append('voiceText', 'A test story context');
    form.append('voice', 'storyteller');
    form.append('userId', 'demo');

    try {
        const res = await fetch('http://127.0.0.1:3001/api/media/image-to-voice', {
            method: 'POST',
            body: form
        });

        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Request Failed:", e);
    }
}

test();
