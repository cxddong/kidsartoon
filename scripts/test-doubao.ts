import 'dotenv/config';
import { doubaoService } from '../src/services/doubao.js';

async function test() {
    console.log('Testing Doubao Service...');

    try {
        // Test 1: Text Generation (Simplest)
        console.log('\n1. Testing Text Generation...');
        const story = await doubaoService.generateStory('Tell me a very short joke.');
        console.log('Success! Story:', story);
    } catch (e) {
        console.error('Text Generation Failed:', e);
    }

    try {
        // Test 2: Image Generation
        console.log('\n2. Testing Image Generation...');
        const imgUrl = await doubaoService.generateImage('A cute cat', '2K');
        console.log('Success! Image URL:', imgUrl);
    } catch (e) {
        console.error('Image Generation Failed:', e);
    }

    try {
        // Test 3: Vision Analysis
        console.log('\n3. Testing Vision Analysis...');
        // Use a public placeholder image
        const imageUrl = 'https://placehold.co/600x400/png';
        const description = await doubaoService.analyzeImage(imageUrl, 'Describe this image');
        console.log('Success! Description:', description);
    } catch (e) {
        console.error('Vision Analysis Failed:', e);
    }
}

test();
