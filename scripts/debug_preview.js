
const fetch = require('node-fetch');

async function testPreview() {
    try {
        console.log("Testing Preview Endpoint...");
        const response = await fetch('http://localhost:3001/api/voice-lab/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: "Hello testing",
                voiceId: "my_voice",
                userId: "demo"
            })
        });

        if (!response.ok) {
            console.error("Status:", response.status);
            const text = await response.text();
            console.error("Body:", text);
        } else {
            console.log("Success! Status:", response.status);
            // const buffer = await response.buffer();
            // console.log("Audio size:", buffer.length);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testPreview();
