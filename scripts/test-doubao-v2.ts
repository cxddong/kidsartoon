import 'dotenv/config';
import { doubaoService } from '../src/services/doubao.js';

async function testDoubaoV2() {
    console.log('Testing Doubao V2 Features...');

    try {
        // Test 1: Text to Sequential
        console.log('\n1. Testing Text-to-Sequential...');
        const images1 = await doubaoService.generateSequentialImages(
            'A brave little toaster going to space',
            undefined,
            4
        );
        console.log('Success! Generated images:', images1);

        // Test 2: Image to Sequential
        console.log('\n2. Testing Image-to-Sequential...');
        const testImageUrl = 'https://via.placeholder.com/512.png';
        const images2 = await doubaoService.generateSequentialImages(
            'A cat exploring a candy kingdom',
            testImageUrl,
            4
        );
        console.log('Success! Generated images from reference:', images2);

    } catch (error: any) {
        console.error('Test Failed:', error);
        const fs = await import('fs');
        fs.writeFileSync('test_error.log', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    }
}

testDoubaoV2();
