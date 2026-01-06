import 'dotenv/config';
import { geminiService } from './src/services/gemini.js';

async function verify() {
    console.log("Environment Keys:");
    console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");
    console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "EXISTS" : "MISSING");

    try {
        console.log("Verifying geminiService.generateText...");
        const result = await geminiService.generateText("Write a 5 word story.");
        console.log("Result:", result);
        if (result && result.length > 0) {
            console.log("✅ Gemini REST Service Fixed!");
        } else {
            console.log("❌ Service returned empty string.");
        }
    } catch (e) {
        console.error("❌ Verification failed:", e.message);
    }
}
verify();
