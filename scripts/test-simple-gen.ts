import 'dotenv/config';
import { doubaoService } from '../src/services/doubao.js';

async function testSimpleGen() {
    console.log('--- Testing Doubao API ---');
    console.log('API Key:', process.env.Doubao_API_KEY ? 'Present' : 'Missing');

    try {
        // 1. Test Simple Text-to-Image
        console.log('\n1. Testing Text-to-Image (generateImage)...');
        const imgUrl = await doubaoService.generateImage('A cute cartoon cat');
        console.log('Success! Image URL:', imgUrl);

        // 2. Test Sequential Generation (Text only)
        console.log('\n2. Testing Sequential Gen (Text only)...');
        const seqImages = await doubaoService.generateSequentialImages('A dog chasing a ball', undefined, 4);
        console.log('Success! Sequential Images:', seqImages);

    } catch (error: any) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Response:', await error.response.text());
        }
    }
}

testSimpleGen();
