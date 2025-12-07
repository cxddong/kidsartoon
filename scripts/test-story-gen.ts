import 'dotenv/config'; // Load env vars first!
import { doubaoService } from '../src/services/doubao';
import path from 'path';

console.log('CWD:', process.cwd());
console.log('API Key present:', !!process.env.Doubao_API_KEY);

async function testStoryGen() {
    console.log('Testing generateStoryJSON...');
    try {
        const prompt = "A brave little cat exploring space";
        const storyData = await doubaoService.generateStoryJSON(prompt);
        console.log('Success! Story Data:', JSON.stringify(storyData, null, 2));

        if (!storyData.scenes || storyData.scenes.length !== 4) {
            console.error('Validation Failed: Expected 4 scenes, got', storyData.scenes?.length);
        }
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testStoryGen();
