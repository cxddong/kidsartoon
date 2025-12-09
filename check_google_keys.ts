import { GoogleGenerativeAI } from '@google/generative-ai';
import fetch from 'node-fetch';

// The key currently in use
const API_KEY = "AIzaSyCvy_90ga9nVN0316J1cwXoRbPHp7vkhqY";

async function testGemini() {
    console.log('--- Testing Gemini 1.5 Pro ---');
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log('Gemini Status: OK ✅');
        console.log('Response:', response.text().substring(0, 50) + '...');
    } catch (error: any) {
        console.error('Gemini Status: FAILED ❌');
        console.error('Error:', error.message);
    }
}

async function testTTS() {
    console.log('\n--- Testing Google Cloud TTS ---');
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text: "Hello" },
                voice: { languageCode: "en-US", name: "en-US-Wavenet-D" },
                audioConfig: { audioEncoding: "MP3" }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`${response.status} - ${err}`);
        }
        console.log('TTS Status: OK ✅');
    } catch (error: any) {
        console.error('TTS Status: FAILED ❌');
        console.error('Error:', error.message);
    }
}

async function run() {
    await testGemini();
    await testTTS();
}

run();
