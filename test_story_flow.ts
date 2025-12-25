
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

// Usage: npx tsx test_story_flow.ts

async function testStoryFlow() {
    console.log("=== Testing Story Generation Flow ===");

    // 1. Create a dummy image file (or use an existing one if available)
    // We'll create a small red dot image
    const imagePath = path.resolve('test_image.jpg');
    const imageBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
    fs.writeFileSync(imagePath, imageBuffer);
    console.log("Created dummy image:", imagePath);

    try {
        const formData = new FormData();
        formData.append('userId', 'test-user');
        formData.append('lang', 'en'); // Test English first
        formData.append('image', fs.createReadStream(imagePath));
        formData.append('prompt', 'STORY_STYLE: fairy_tale\nVISUAL_STYLE: disney\nCONTENT_TAGS: Dragon');

        console.log("Sending request to /api/create-story-from-image...");
        const res = await fetch('http://localhost:3000/api/create-story-from-image?lang=en', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error(`FAILED: ID ${res.status}`);
            console.error("Error Body:", errText);
        } else {
            const data = await res.json();
            console.log("SUCCESS!");
            console.log("Story:", JSON.stringify(data.story).substring(0, 50) + "...");
            console.log("Audio URL:", data.audioUrl);
        }
    } catch (e) {
        console.error("EXCEPTION:", e);
    } finally {
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
}

testStoryFlow();
