
import { geminiService } from './src/services/gemini';
import { doubaoService } from './src/services/doubao';
import dotenv from 'dotenv';
dotenv.config();

async function testMagicBook() {
    console.log("--- Testing Magic Book Generation Logic ---");

    const userPrompt = "A brave dog explores the moon";
    const pageCount = 4;

    // 1. Creative Director (Simulate)
    console.log("[1] Generating Story Script...");
    let episodes = [];
    try {
        const panels = await doubaoService.summarizeStoryToComicPanels(userPrompt); // Using comic summarizer for test
        episodes = panels.map(p => ({
            image_prompt: p.sceneDescription,
            text_overlay: p.caption
        }));
    } catch (e) {
        console.error("Story Gen Failed");
        return;
    }

    console.log(`Generated ${episodes.length} episodes.`);

    // 2. Image Gen Loop (Simulate media.ts logic)
    const pages = [];
    for (let i = 0; i < pageCount; i++) {
        const episode = episodes[i] || { image_prompt: userPrompt, text_overlay: "..." };
        console.log(`\n--- Page ${i + 1} ---`);

        let imgUrl = "";
        const flowPrompt = episode.image_prompt + ", storybook style";

        try {
            // Simulate T2I only for now to test basic connectivity
            console.log("Generating Image...");
            imgUrl = await doubaoService.generateImage(flowPrompt, '2K');
            console.log("Success URL:", imgUrl);
        } catch (e: any) {
            console.error("Image Gen Failed:", e.message);
            imgUrl = "ERROR_URL";
        }

        pages.push({
            page: i + 1,
            imageUrl: imgUrl
        });
    }

    console.log("\nFinal Pages Result:", JSON.stringify(pages, null, 2));
}

testMagicBook();
