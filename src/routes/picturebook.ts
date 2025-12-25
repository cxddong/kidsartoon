import { Router } from 'express';
import { geminiService } from '../services/gemini.js';
import { doubaoService } from '../services/doubao.js';
import { pointsService, POINT_COSTS } from '../services/points.js';
import { databaseService } from '../services/database.js';

export const router = Router();

// V2 Picture Book Engine
// Character Visual Descriptions (IP-Safe)
const characterPrompts: Record<string, string> = {
    // UI: Robo Kid
    char_roblox: "cute blocky character with rounded edges, glossy plastic texture, 3d game avatar style, friendly face",
    // UI: Cube Steve
    char_minecraft: "voxel art style character, made of pixelated blocks, 8-bit 3d aesthetic, cube-shaped head",
    // UI: Battle Hero
    char_fortnite: "stylized 3d cartoon hero, vibrant colors, slightly exaggerated proportions, battle royale game aesthetic, cool gear",
    // UI: Pocket Pet
    char_pokemon: "cute anime-style fantasy creature, bright colors, cel-shaded 3d render, monster collecting game aesthetic",
    // UI: Blue Alien
    char_stitch: "cute small blue alien creature, fluffy fur texture, large ears, big black eyes, mischievous expression, 3d animation movie style",
    // UI: Cloud Puppy
    char_cinnamoroll: "cute white puppy with long floppy ears, floating like a cloud, soft pastel aesthetic, kawaii mascot style",
    // UI: Brick Man
    char_lego: "character made of glossy yellow plastic construction bricks, toy aesthetic, cylindrical head with studs on top, c-shaped hands"
};

router.post('/create', async (req, res) => {
    try {
        const { userId, imageUrl, theme, pageCount = 4, character } = req.body;

        if (!userId || !imageUrl || !theme) {
            return res.status(400).json({ error: 'Missing required fields: userId, imageUrl, theme' });
        }

        console.log(`[PictureBookV2] Starting for ${userId}. Theme: ${theme}, Pages: ${pageCount}`);

        // 1. Calculate and Deduct Points
        let cost = POINT_COSTS.PICTURE_BOOK_4;
        if (pageCount === 8) cost = POINT_COSTS.PICTURE_BOOK_8;
        if (pageCount === 12) cost = POINT_COSTS.PICTURE_BOOK_12;

        const deduction = await pointsService.consumePoints(userId, `picture_book_${pageCount}`, cost);
        if (!deduction.success) {
            return res.status(200).json({ success: false, error: 'Not enough points', required: cost });
        }

        // 2. Step 0: Vision Anchoring
        console.log('[PictureBookV2] Step 0: Vision Anchoring...');
        const anchors = await geminiService.extractVisualAnchors(imageUrl);
        console.log('[PictureBookV2] Anchors:', anchors);

        // 3. Step B: Story Generation (With Validation)
        console.log('[PictureBookV2] Step 1: Story Generation...');
        const storyInput = {
            theme: theme,
            character_description: anchors.character_description,
            page_count: pageCount
        };

        // We reuse the 'Picturebook_4_Page' type but rely on the input to drive N pages
        // Or we map type based on count.
        const reqType = pageCount === 4 ? 'Picturebook_4_Page' : 'Picturebook_N_Page';

        // Note: 'Picturebook_N_Page' might need to be supported in 'generateCreativeContent' prompt handling
        // For now, let's assume 'Picturebook_4_Page' logic is flexible enough if we update the prompt, 
        // OR we just use 'Picturebook_4_Page' and slice/expand. 
        // Actually, let's just use 'Picturebook_4_Page' for 4 pages, and force N for others.
        // I will rely on the generic 'Detailed Story' logic if I pass 'Picturebook_N_Page'.

        let story;
        try {
            story = await geminiService.generateCreativeContent(reqType as any, storyInput);
        } catch (e: any) {
            // Refund if story fails
            await pointsService.refundPoints(userId, `picture_book_${pageCount}`, 'story_generation_failed');
            throw e;
        }

        // Limit distinct pages to requested count
        const pagesToRender = story.content.slice(0, pageCount);

        // 4. Step C: Sequential Image Generation
        console.log('[PictureBookV2] Step 2: Sequential Image Gen...');
        const sharedSeed = Math.floor(Math.random() * 1000000);
        const renderedPages = [];

        for (let i = 0; i < pagesToRender.length; i++) {
            const page = pagesToRender[i];
            console.log(`[PictureBookV2] Rendering Page ${i + 1}/${pagesToRender.length}...`);

            // Construct Prompt: Style + Char + Action
            // Force "No Text" to avoid artifacts
            const charDesc = character ? (characterPrompts[character] || "") : "";
            const basePrompt = `${anchors.art_style}. ${anchors.character_description}`;

            // Inject specific character style if selected
            const characterInjection = charDesc ? `, featuring a ${charDesc}` : "";

            const finalPrompt = `${basePrompt}${characterInjection}. ${page.image_prompt} --no text, speech bubbles`;

            // Use Image-to-Image with the ORIGINAL reference to lock character
            // We use a relatively high image weight to keep resemblance (0.6-0.7)
            const generatedUrl = await doubaoService.generateImageFromImage(
                finalPrompt,
                imageUrl,
                '2K',
                sharedSeed,
                0.6
            );

            // Perist to Firebase Storage (Fix broken profile images)
            console.log(`[PictureBookV2] Uploading Page ${i + 1} to Storage...`);
            let permanentUrl = generatedUrl;
            try {
                const imgRes = await fetch(generatedUrl);
                if (imgRes.ok) {
                    const arrayBuffer = await imgRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    permanentUrl = await databaseService.uploadFile(buffer, 'image/png', 'stories');
                }
            } catch (uploadErr) {
                console.error('[PictureBookV2] Failed to upload to storage, using temp URL:', uploadErr);
            }

            renderedPages.push({
                ...page,
                imageUrl: permanentUrl
            });
        }

        // 5. Save to Database
        // We save as an ImageRecord type 'story' (or a new type if we wanted, but 'story' fits)
        // The 'imageUrl' of the record will be the FIRST page's image (cover)
        // The full pages are in 'meta'
        const coverImage = renderedPages[0].imageUrl;

        await databaseService.saveImageRecord(
            userId,
            coverImage,
            'story',
            theme,
            {
                pages: renderedPages,
                anchors,
                pageCount,
                version: 'v2'
            }
        );

        res.json({ success: true, story: renderedPages });

    } catch (error: any) {
        console.error('[PictureBookV2] Failed:', error);
        res.status(500).json({ error: error.message || 'Unknown Error' });
    }
});
