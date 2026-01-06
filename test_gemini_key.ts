import 'dotenv/config';
import fetch from 'node-fetch';

async function testGen() {
    const key = process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error("No GOOGLE_API_KEY found in .env");
        return;
    }

    const model = 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;

    console.log(`Testing model: ${model}`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say hello in 2 words." }] }]
            })
        });
        const data: any = await res.json();
        if (data.error) {
            console.log(`Error: ${data.error.code} - ${data.error.message}`);
        } else {
            console.log("Success:", data.candidates?.[0]?.content?.parts?.[0]?.text);
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
testGen();
