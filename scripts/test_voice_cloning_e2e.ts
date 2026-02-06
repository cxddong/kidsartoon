import 'dotenv/config';
import { dashscopeService } from '../src/services/dashscopeService';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom Logger
function log(msg: string, data?: any) {
    const time = new Date().toISOString();
    const line = `[${time}] ${msg} ${data ? JSON.stringify(data) : ''}\n`;
    console.log(msg, data || '');
    fs.appendFileSync(path.resolve(__dirname, '../e2e_test_log.txt'), line);
}

async function testE2E() {
    // Clear log
    fs.writeFileSync(path.resolve(__dirname, '../e2e_test_log.txt'), '');

    log("🚀 Starting End-to-End Voice Cloning Test (Local -> OSS -> DashScope)");

    // 1. Prepare Source File
    const sourceFile = path.resolve(__dirname, '../client/public/assets/audio_demos/kiki_preview.mp3');
    if (!fs.existsSync(sourceFile)) {
        log("❌ Source file not found:", sourceFile);
        return;
    }
    log("📂 Source Audio:", sourceFile);

    // 2. Enroll Voice
    log("\n--- Step 1: Enrolling Voice ---");
    const userId = "test_user_" + Date.now();
    let voiceId: string;

    try {
        log("Calling dashscopeService.registerCustomVoice...");
        // This should: Transcode -> Upload to OSS -> Call DashScope
        voiceId = await dashscopeService.registerCustomVoice(sourceFile, userId, "This is a test transcript", "en");
        log("✅ Voice Enrolled Successfully!");
        log("🆔 Voice ID:", voiceId);
    } catch (e: any) {
        log("❌ Enrollment Failed:", e.message);
        if (e.response) {
            try {
                const text = await e.response.text();
                log("Response:", text);
            } catch (err) { }
        }
        return;
    }

    // 3. Generate Speech (Verify usability)
    log("\n--- Step 2: Generating Speech (Synthesis) ---");
    try {
        const text = "Hello! I am your new custom voice, cloned via Alibaba Cloud OSS. This is a successful test.";
        log(`Synthesizing: "${text}"`);

        // Try CosyVoice V1 explicitly, as V3 might be acting up
        const modelsToTry = ['cosyvoice-v1', 'qwen3-tts-flash'];

        for (const modelName of modelsToTry) {
            try {
                log(`Attempting synthesis with model: ${modelName}`);
                const audioBuffer = await dashscopeService.generateSpeech({
                    text: text,
                    voice: voiceId,
                    format: 'mp3',
                    model: modelName // Explicit override
                });

                const outputPath = path.resolve(__dirname, `../test_output_${modelName}.mp3`);
                fs.writeFileSync(outputPath, audioBuffer);
                log(`✅ Speech Generated Successfully with ${modelName}!`);
                log("💾 Output saved to:", outputPath);

                // Check size
                const stats = fs.statSync(outputPath);
                log(`📊 Output Size: ${stats.size} bytes`);
                if (stats.size > 1000) break; // Success
            } catch (err: any) {
                log(`⚠️ Failed with ${modelName}:`, err.message);
            }
        }

    } catch (e: any) {
        log("❌ Synthesis Failed:", e.message);
    }
}

testE2E();
