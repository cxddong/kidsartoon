import { doubaoService } from './src/services/doubao.js';

async function test() {
    console.log("Starting Simple Test...");
    try {
        const story = await doubaoService.generateStory("Hi");
        console.log("SUCCESS! Story:", story.substring(0, 50));
    } catch (e: any) {
        console.log("FAILURE:", e.message);
    }
}

test();
