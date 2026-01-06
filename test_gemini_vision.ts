import 'dotenv/config';
import fetch from 'node-fetch';

async function testVision() {
    const key = process.env.GOOGLE_API_KEY;
    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;

    // Tiny black pixel image base64
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "What is in this image?" },
                        { inline_data: { mime_type: "image/png", data: base64Image } }
                    ]
                }]
            })
        });
        const data: any = await res.json();
        if (data.error) {
            console.log(`Error: ${data.error.code} - ${data.error.message}`);
        } else {
            console.log("Vision Success:", data.candidates?.[0]?.content?.parts?.[0]?.text);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testVision();
