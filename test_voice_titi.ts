
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testTiti() {
    console.log("Testing /api/media/image-to-voice with Titi...");

    const formData = new FormData();
    formData.append('userId', 'demo');
    formData.append('voice', 'titi');
    formData.append('voiceTier', 'premium');
    formData.append('voiceText', 'This is a test story for Titi. He should be a senior male voice from Minimax.');
    formData.append('lang', 'en');
    formData.append('imageUrl', 'https://placehold.co/100x100.png');

    try {
        const res = await fetch('http://localhost:3001/api/media/image-to-voice', {
            method: 'POST',
            body: formData
        });

        const data: any = await res.json();
        const result = {
            status: res.status,
            audioUrl: data.audioUrl,
            storyLength: data.story?.length,
            fullResponse: data
        };
        fs.writeFileSync('test_result_fixed.json', JSON.stringify(result, null, 2));
        console.log("Done! Check test_result_fixed.json");
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testTiti();
