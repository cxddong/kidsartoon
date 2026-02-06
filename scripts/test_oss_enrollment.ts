import 'dotenv/config'; // Load env vars before other imports
import { ossService } from '../src/services/ossService';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars (legacy method removed)
// dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testOssUpload() {
    console.log("Testing OSS Upload...");

    // Check Env
    if (!process.env.OSS_ACCESS_KEY_ID || !process.env.OSS_BUCKET) {
        console.error("❌ Missing OSS Environment Variables! Check .env");
        console.error("Parsed Env:", {
            REGION: process.env.OSS_REGION,
            ACCESS_KEY: process.env.OSS_ACCESS_KEY_ID ? '***' : 'MISSING',
            BUCKET: process.env.OSS_BUCKET
        });
        return;
    }

    // Use a known existing file or create a dummy one
    const testFile = path.resolve(__dirname, '../success_qwen3-tts-flash.mp3');
    let buffer: Buffer;

    if (fs.existsSync(testFile)) {
        console.log(`Using existing file: ${testFile}`);
        buffer = fs.readFileSync(testFile);
    } else {
        console.log("Creating dummy test file...");
        buffer = Buffer.from("Hello OSS World");
    }

    const filename = `test-upload-${Date.now()}.mp3`;
    const destination = `voice-enrollment-test/${filename}`;

    try {
        console.log(`Uploading to ${destination}...`);
        const url = await ossService.uploadFile(buffer, destination);
        console.log("✅ Upload Success!");
        console.log("Public URL:", url);
    } catch (e: any) {
        console.error("❌ Upload Failed:", e);
    }
}

testOssUpload();
