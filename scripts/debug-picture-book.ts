import 'dotenv/config';
import { doubaoService } from '../src/services/doubao.js';

async function debugPictureBook() {
    console.log('--- Debugging Picture Book Flow ---');
    const prompt = 'A happy dog playing in the park';
    const mockCartoonUrl = 'https://via.placeholder.com/1024.png'; // A valid URL

    try {
        console.log('\n1. Testing Sequential Gen (with Image)...');
        // This might fail if Doubao can't download the image
        const images = await doubaoService.generateSequentialImages(
            prompt,
            mockCartoonUrl,
            4
        );
        console.log('Success (Image)!', images);
    } catch (error: any) {
        console.error('Expected Failure (Image Download):', error.message);

        try {
            console.log('\n2. Testing Fallback (Text Only)...');
            const imagesFallback = await doubaoService.generateSequentialImages(
                prompt,
                undefined,
                4
            );
            console.log('Success (Fallback)!', imagesFallback);
        } catch (fallbackError: any) {
            console.error('CRITICAL: Fallback Failed:', fallbackError.message);
        }
    }
}

debugPictureBook();
