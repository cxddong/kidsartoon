
import dotenv from 'dotenv';
dotenv.config();

// import { dashscopeService } from './src/services/dashscopeService';
import path from 'path';

async function test() {
    // Dynamic import to ensure dotenv loads first
    const { dashscopeService } = await import('./src/services/dashscopeService');

    console.log("Starting Voice Cloning Verification...");
    const audioPath = path.resolve('uploads', 'voice_1770086883582.wav');
    const userId = "test_user_fix_" + Date.now();

    try {
        console.log(`Attempting to clone voice using file: ${audioPath}`);
        const transcript = "hello children welcome to my story time today i will tell you a magic tale about a little rabbit named bunny.";
        const voiceId = await dashscopeService.registerCustomVoice(audioPath, userId, transcript);
        console.log("SUCCESS: Voice ID received:", voiceId);
    } catch (error: any) {
        console.log("CAUGHT ERROR:");
        console.log(error.message);

        if (error.message.includes("DashScope SDK not initialized")) {
            console.error("FAIL: SDK Error returned.");
            process.exit(1);
        } else if (error.message.includes("Invalid URL")) {
            console.error("FAIL: Invalid URL error persists.");
            process.exit(1);
        } else if (error.message.includes("Voice Cloning Failed")) {
            console.log("PARTIAL SUCCESS/FAIL: API reached but failed with:", error.message);
        } else {
            console.log("UNKNOWN ERROR:", error);
        }
    }
}

test();
