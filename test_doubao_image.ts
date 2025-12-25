import { doubaoService } from './src/services/doubao.js';

async function testImage() {
    console.log("=== Testing Doubao Image Generation ===");
    try {
        console.log("Sending request...");
        const url = await doubaoService.generateImage("A cute cat");
        console.log("SUCCESS! Image URL:", url);
    } catch (e: any) {
        console.error("FAILURE:", e.message);
        if (e.message.includes('401')) {
            console.log("Analysis: 401 Unauthorized often means the API Key is invalid OR the specific MODEL ID is not authorized for this key.");
        }
    }
}

testImage();
