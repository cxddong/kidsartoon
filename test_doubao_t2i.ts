import { DoubaoService } from './src/services/doubao.js';

async function testT2I() {
    const doubao = new DoubaoService();
    console.log("=== Testing Doubao Text-to-Image ===");
    try {
        const url = await doubao.generateImage("A cute cat in a garden, children's book style", '2K', 42);
        console.log("SUCCESS! Image URL:", url);
    } catch (e: any) {
        console.error("FAILURE:", e.message);
    }
}

testT2I();
