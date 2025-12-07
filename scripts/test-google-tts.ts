
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from root
dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GOOGLE_API_KEY;
console.log("Testing Google TTS with Key:", apiKey ? `${apiKey.slice(0, 5)}...${apiKey.slice(-5)}` : "MISSING");

async function testTTS() {
    if (!apiKey) {
        console.error("No API Key found.");
        return;
    }

    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
    console.log(`Endpoint: ${url.split('?')[0]}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text: "Hello, this is a test of the specific voice." },
                voice: { languageCode: "en-US", ssmlGender: "MALE", name: "en-US-Journey-D" },
                audioConfig: { audioEncoding: "MP3" }
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const text = await response.text();
            console.error("Error Body:", text);
        } else {
            console.log("Success! Audio generated.");
            const data = await response.json();
            console.log("Audio Content Length:", data.audioContent?.length);
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testTTS();
