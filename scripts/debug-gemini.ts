import 'dotenv/config';
import { geminiService } from '../src/services/gemini';

async function debugGemini() {
    console.log('--- Debugging Gemini Service ---');
    const userId = 'debug-user';
    const prompt = 'A brave little cat exploring space';

    try {
        console.log('1. Testing generateStoryJSON...');
        const story = await geminiService.generateStoryJSON(prompt, userId);
        console.log('Story Result:', JSON.stringify(story, null, 2));

        if (!story.scenes || story.scenes.length !== 4) {
            console.error('ERROR: Story scenes missing or incorrect length');
        }
    } catch (error) {
        console.error('generateStoryJSON Failed:', error);
    }

    try {
        console.log('\n2. Testing generateImage (Text only)...');
        const imageUrl = await geminiService.generateImage('Test prompt', userId);
        console.log('Image Result:', imageUrl);
    } catch (error) {
        console.error('generateImage Failed:', error);
    }
    try {
        console.log('\n3. Testing generateImageFromImage (Mock Base64)...');
        // Tiny 1x1 transparent pixel base64
        const mockBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        const imageUrl = await geminiService.generateImageFromImage('Test prompt with image', mockBase64, userId);
        console.log('Img2Img Result:', imageUrl);
    } catch (error) {
        console.error('generateImageFromImage Failed:', error);
    }
}

debugGemini();
