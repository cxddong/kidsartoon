import 'dotenv/config';
import { geminiService } from './src/services/gemini.js';
import fs from 'fs';

async function test() {
    let log = "Testing Comic Generation Story Quality...\n";
    console.log("Testing Comic Generation Story Quality...");

    // Validate API Key
    const key = process.env.GOOGLE_API_KEY;
    log += `API Key present: ${!!key}\n`;
    if (key) log += `Key starts with: ${key.substring(0, 8)}...\n`;

    try {
        const result = await geminiService.generateCreativeContent('Comic_4_Panel', {
            character_description: "A small astronaut with a blue helmet",
            theme: "First mission to the moon"
        });
        log += "=== THEME ===\n";
        log += result.theme + "\n";
        log += "=== CONTENT ===\n";
        result.content.forEach((c: any, i: number) => {
            log += `Panel ${i + 1}: ${c.text_overlay}\n`;
        });
    } catch (e: any) {
        log += "!!! ERROR !!!\n";
        log += e.message + "\n";
        log += e.stack + "\n";
        if (e.response) {
            try {
                const text = await e.response.text();
                log += "Response Text: " + text + "\n";
            } catch (err) { }
        }
    }

    fs.writeFileSync('verify_result.txt', log, 'utf8');
    console.log("Done. Results saved to verify_result.txt");
}

test();
