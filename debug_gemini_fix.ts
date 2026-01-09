
import 'dotenv/config';
import { geminiService } from './src/services/gemini';

console.log('Gemini Service Imported:', geminiService);

async function test() {
    console.log('Testing analyzeImageJSON...');
    try {
        // Tiny base64 gif
        const mockImage = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        const result = await geminiService.analyzeImageJSON(mockImage, "Test prompt");
        console.log('Result:', result);
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();
