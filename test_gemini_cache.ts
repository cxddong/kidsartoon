import 'dotenv/config';
import { geminiService } from './src/services/gemini.js';

async function testCaching() {
    console.log('--- Starting Gemini Caching Test ---');
    try {
        const userInput = {
            description: "A young boy discovering a glowing dragon egg in his backyard.",
            artStyle: "Pixar style animation"
        };

        console.log('\n[1] Testing Creative Content Generation (First call - should create cache)...');
        const result1 = await geminiService.generateCreativeContent('Comic_4_Panel', userInput);
        console.log('Result 1 (Theme):', result1.theme);

        console.log('\n[2] Testing Creative Content Generation (Second call - should reuse cache)...');
        const result2 = await geminiService.generateCreativeContent('Picturebook_4_Page', userInput);
        console.log('Result 2 (Theme):', result2.theme);

        console.log('\n--- Test Completed Successfully ---');
    } catch (error) {
        console.error('\n--- Test Failed ---');
        console.error(error);
    }
}

testCaching();
