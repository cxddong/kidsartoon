import 'dotenv/config';
import { doubaoService } from '../src/services/doubao.js';

async function testStoryGen() {
    console.log('--- Testing Doubao Story JSON Generation ---');
    const prompt = "A brave little cat exploring space";

    try {
        console.log('Prompt:', prompt);
        const start = Date.now();
        const result = await doubaoService.generateStoryJSON(prompt);
        const duration = Date.now() - start;

        console.log(`Generation took ${duration}ms`);
        console.log('Result:', JSON.stringify(result, null, 2));

        if (!result.scenes || result.scenes.length === 0) {
            console.error('FAIL: No scenes returned!');
        } else {
            console.log('SUCCESS: Scenes returned.');
            import('fs').then(fs => fs.writeFileSync('debug_success.log', `Success: ${new Date().toISOString()}\n`));
        }

        if (!result.summary) {
            console.error('FAIL: No summary returned!');
        }
    } catch (error) {
        console.error('Test Failed:', error);
        import('fs').then(fs => fs.writeFileSync('debug_error.log', `Error: ${error}\n`));
    }
}

testStoryGen();
