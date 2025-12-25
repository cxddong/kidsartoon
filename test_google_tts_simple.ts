import fetch from 'node-fetch';
import fs from 'fs';

const API_KEY = 'AIzaSyCvy_90ga9nVN0316J1cwXoRbPHp7vkhqY'; // The key from gemini.ts

async function testTTS() {
    console.log("Testing Google TTS...");
    const text = "This is a test story.";
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text },
                voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });

        if (!response.ok) {
            console.error(`Status: ${response.status}`);
            console.error(await response.text());
            return;
        }

        const data: any = await response.json();
        console.log("TTS Success. Audio length:", data.audioContent?.length);
    } catch (e: any) {
        console.error("TTS Fetch Failed:", e.message);
    }
}

testTTS();
