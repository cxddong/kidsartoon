
import { geminiService } from './src/services/gemini';
import { doubaoService } from './src/services/doubao';
import dotenv from 'dotenv';
dotenv.config();

async function testMagicComic() {
    console.log("--- Testing Magic Comic Generation Logic ---");

    const userId = "test-user-debug";
    const userPrompt = "A funny cat goes to space";

    // 1. Test Gemini Creative Director
    console.log("[1] Testing Gemini Creative Content...");
    let creativeContent;
    try {
        const userInput = {
            character_description: "A cute orange tabby cat",
            theme: userPrompt
        };
        creativeContent = await geminiService.generateCreativeContent('Comic_4_Panel', userInput);
        console.log("Gemini Success:", JSON.stringify(creativeContent, null, 2));
    } catch (e: any) {
        console.error("Gemini Failed:", e.message);
        console.log("Attempting Doubao Fallback...");
        try {
            const panels = await doubaoService.summarizeStoryToComicPanels(userPrompt);
            creativeContent = {
                theme: userPrompt,
                character_lock: "The character from the image",
                content: panels.map(p => ({
                    image_prompt: p.sceneDescription,
                    text_overlay: p.caption
                }))
            };
            console.log("Doubao Fallback Success:", creativeContent);
        } catch (dbErr: any) {
            console.error("Doubao Fallback Failed:", dbErr.message);
            return;
        }
    }

    if (!creativeContent || !creativeContent.content) {
        console.error("No content generated!");
        return;
    }

    // 2. Test Image Generation (Doubao)
    console.log("[2] Testing Image Generation for Panel 1...");
    const episode = creativeContent.content[0];
    const fullPrompt = `${episode.image_prompt || episode.visual_description}, (comic style)`;

    try {
        // Test Text-to-Image first (simpler)
        console.log("Generating T2I...");
        const imgUrl = await doubaoService.generateImage(fullPrompt, '2K', 12345);
        console.log("Image URL:", imgUrl);
    } catch (e: any) {
        console.error("Image Gen Failed:", e.message);
        console.error("Full Error:", e);
    }
}

testMagicComic();
