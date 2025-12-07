import 'dotenv/config';
import { doubaoService } from '../src/services/doubao.js';

async function testImageGen() {
    console.log('--- Testing Doubao Image Generation ---');
    const prompt = "A cute cartoon cat";

    try {
        console.log('Prompt:', prompt);
        const start = Date.now();
        const imageUrl = await doubaoService.generateImage(prompt);
        const duration = Date.now() - start;

        console.log(`Generation took ${duration}ms`);
        console.log('Image URL:', imageUrl);

        if (imageUrl && imageUrl.startsWith('http')) {
            console.log('SUCCESS: Image URL returned.');
            import('fs').then(fs => fs.writeFileSync('debug_image_success.log', `Success: ${imageUrl}\n`));
        } else {
            console.error('FAIL: Invalid Image URL');
        }
    } catch (error) {
        console.error('Test Failed:', error);
        import('fs').then(fs => fs.writeFileSync('debug_image_error.log', `Error: ${error}\n`));
    }
}

testImageGen();
