
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';

async function test() {
    // Dynamic import to ensure dotenv loads first
    const { dashscopeService } = await import('./src/services/dashscopeService');

    console.log("Starting Voice Cloning Verification (Format Support)...");

    // Create a dummy file with .webm extension (just to trigger logic, even if FFMPEG fails on content, we want to see it try)
    // Actually, let's copy the existing mp3 support file to a .webm path
    // If we have ffmpeg installed, it might actually succeed in converting mp3->wav even if named .webm
    // Or we rely on the fact that existing mp3 is valid audio.
    const sourcePath = path.resolve('test_output.mp3');
    const testWebMPath = path.resolve('test_input.webm');

    fs.copyFileSync(sourcePath, testWebMPath);

    const userId = "test_user_webm_" + Date.now();

    try {
        console.log(`Attempting to clone voice using file: ${testWebMPath}`);
        const voiceId = await dashscopeService.registerCustomVoice(testWebMPath, userId, "Test transcript for transcoding");
        console.log("SUCCESS: Voice ID received:", voiceId);
    } catch (error: any) {
        console.log("CAUGHT ERROR:");
        console.log(error.message);
        console.log(error);
    } finally {
        // Cleanup dummy webm
        if (fs.existsSync(testWebMPath)) fs.unlinkSync(testWebMPath);
        // Cleanup converted wav if it exists
        const wavPath = testWebMPath.replace('.webm', '.wav');
        if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
    }
}

test();
