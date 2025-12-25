
import { doubaoService } from './src/services/doubao.js';
import dotenv from 'dotenv';
dotenv.config();

async function testPrompt() {
    console.log("=== Testing Doubao Prompt Generation ===");

    const input = "Red dinosaur playing on a slide in space"; // From user snippet
    console.log(`Input: "${input}"`);

    try {
        console.log("Calling generateChildFriendlyPrompt...");
        const result = await doubaoService.generateChildFriendlyPrompt(input);
        console.log("\nGenerated Prompt:");
        console.log(result);

        if (result && result.length > 10) {
            console.log("\nSUCCESS: Prompt generated successfully.");
        } else {
            console.error("\nFAILURE: Empty or short response.");
        }

    } catch (e: any) {
        console.error("\nERROR:", e.message);
        if (e.message.includes('401')) {
            console.log("Hint: Key validation failed.");
        }
    }
}

testPrompt();
