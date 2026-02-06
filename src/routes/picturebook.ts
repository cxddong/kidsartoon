import { Router } from 'express';
import { geminiService } from '../services/gemini.js';
import { doubaoService } from '../services/doubao.js';
import { pointsService, POINT_COSTS } from '../services/points.js';
import { databaseService } from '../services/database.js';
import { safetyService } from '../services/safetyService.js';

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
        try {
            const { userId, imageUrl, theme, pageCount = 4, character, vibe, illustrationStyle, storyText, profileName, profileGender } = req.body;

            if (!userId || !imageUrl || !theme) {
                return res.status(400).json({ error: 'Missing required fields: userId, imageUrl, theme' });
            }

            console.log(`[PictureBookV2] Starting for ${userId}. Theme: ${theme}, Vibe: ${vibe}, Style: ${illustrationStyle}, Pages: ${pageCount}`);

            // --- 0. Safety Check ---
            // Combine all user text for safety validation
            const combinedInput = `${theme} ${storyText || ''}`;

            // A. Keyword Check (Failsafe for extreme violence)
            const FORBIDDEN_WORDS = ['kill', 'killing', 'murder', 'blood', 'die', 'death', 'suicide', 'torture'];
            const hasForbiddenWord = FORBIDDEN_WORDS.some(word => combinedInput.toLowerCase().includes(word));

            if (hasForbiddenWord) {
                console.warn(`[PictureBookV2] Safety Keyword Triggered: ${combinedInput}`);
                return res.status(400).json({
                    error: "Oops, that sounds a bit too scary! Let's tell a safer story.",
                    isSafetyRefusal: true
                });
            }

            // B. AI Safety Check
            const isPromptSafe = await safetyService.validatePrompt(combinedInput);
            const isImageSafe = await safetyService.validateImage(imageUrl);

            if (!isPromptSafe || !isImageSafe) {
                console.warn(`[PictureBookV2] Safety Check Failed. Prompt: ${isPromptSafe}, Image: ${isImageSafe}`);
                return res.status(400).json({
                    error: "Oops, this magic is a bit too dark. Let's try a brighter spell!",
                    isSafetyRefusal: true
                });
            }

            // --- New V2 Logic: Vibe & Style Prompts ---
            const VIBE_PROMPTS: Record<string, string> = {
                vibe_bedtime: "Tone: Soothing, gentle, slow, whispering. Plot: No scary conflicts. Focus on relaxation, dreams, and saying goodnight. Ending is very calm.",
                vibe_funny: "Tone: Silly, humorous, playful. Plot: Include jokes, clumsy mistakes, funny sounds, and unexpected twists. Make the child laugh aloud.",
                vibe_adventure: "Tone: Exciting, energetic, fast-paced. Plot: A journey, overcoming small obstacles, bravery, discovery. A clear Hero's Journey structure.",
                vibe_mystery: "Tone: Curious, mysterious (but not scary), inquisitive. Plot: Someone lost something? A strange footprint? Follow clues to find the answer.",
                vibe_heartwarm: "Tone: Emotional, sweet, caring. Plot: Focus on friendship, sharing, helping others, and gratitude. A big hug at the end."
            };

            const STYLE_PROMPTS: Record<string, string> = {
                style_3d: "high quality 3d render, soft lighting, pixar style, cgsociety, cute shape, vibrant friendly colors, smooth texture, unreal engine 5, magical atmosphere --no grotesque",
                style_watercolor: "beautiful watercolor illustration, soft pastel colors, liquid texture, dreamy storybook art, beatrix potter style, delicate strokes, artistic, whimsical",
                style_paper: "layered paper cut art, depth of field, origami style, craft aesthetic, soft shadows, handmade texture, 3d paper diorama",
                style_clay: "cute plasticine model, claymation style, aardman animation style, handmade look, soft rounded edges, stop motion aesthetic, macro photography",
                style_doodle: "child's crayon drawing style, colorful markers, white paper background, naive art, cute scribbles, simple lines, imagination",
                style_real: "cinematic macro photography, cute plush toy texture, highly detailed fur, soft studio lighting, 8k resolution, photorealistic cute character"
            };

            const selectedVibePrompt = VIBE_PROMPTS[vibe] || VIBE_PROMPTS['vibe_adventure'];
            const selectedStylePrompt = STYLE_PROMPTS[illustrationStyle] || ""; // Will append to visual prompt

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
            let anchors;
            try {
                anchors = await geminiService.extractVisualAnchors(imageUrl);
                console.log('[PictureBookV2] Anchors:', anchors);
            } catch (err: any) {
                console.error('[PictureBookV2] Vision Anchor Failed:', err);
                // Fallback anchors
                anchors = { character_description: "A cute character", art_style: "cartoon" };
            }

            // Gender-based name injection
            const shouldUseProfileName = (
                profileName &&
                profileGender &&
                anchors.character_gender &&
                profileGender.toLowerCase() === anchors.character_gender.toLowerCase()
            );

            const characterName = shouldUseProfileName ? profileName : undefined;
            console.log(`[PictureBookV2] Gender Match: ${shouldUseProfileName}, Using Name: ${characterName || 'AI-generated'}`);

            let narrativeInstruction = theme;
            if (storyText) {
                narrativeInstruction = `Core Idea: "${storyText}". Theme: ${theme}`;
            }

            // Inject character name if gender matches
            if (characterName) {
                narrativeInstruction = `${narrativeInstruction}. The main character's name is ${characterName}.`;
            }

            const enhancedTheme = `${narrativeInstruction}. ${selectedVibePrompt}`;

            const storyInput = {
                theme: enhancedTheme,
                character_description: anchors.character_description,
                page_count: pageCount
            };

            // We reuse the 'Picturebook_4_Page' type but rely on the input to drive N pages
            // Or we map type based on count.
            const reqType = pageCount === 4 ? 'Picturebook_4_Page' : 'Picturebook_N_Page';

            let story;
            try {
                story = await geminiService.generateCreativeContent(reqType as any, storyInput);
            } catch (e: any) {
                console.error('[PictureBookV2] Story Gen Failed:', e);
                // Refund if story fails
                await pointsService.refundPoints(userId, `picture_book_${pageCount}`, 'story_generation_failed');
                throw new Error(`Failed to generate story script: ${e.message}`);
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

                // Override or Augment Art Style
                // If user selected a specific style, use it. Otherwise fall back to anchor style.
                const artStyle = selectedStylePrompt || anchors.art_style;
                const basePrompt = `${artStyle}. ${anchors.character_description}`;

                // Inject specific character style if selected
                const characterInjection = charDesc ? `, featuring a ${charDesc}` : "";

                const finalPrompt = `${basePrompt}${characterInjection}. ${page.image_prompt} --no text, speech bubbles`;

                // Use Image-to-Image with the ORIGINAL reference to lock character
                // We use a relatively high image weight to keep resemblance (0.6-0.7)
                let generatedUrl = '';
                const safeSeed = (sharedSeed !== undefined && !isNaN(sharedSeed)) ? Math.floor(Math.max(0, sharedSeed)) : undefined;

                try {
                    generatedUrl = await doubaoService.generateImageFromImage(
                        finalPrompt,
                        imageUrl,
                        '4K',
                        safeSeed,
                        0.6
                    );
                } catch (imgErr: any) {
                    console.error(`[PictureBookV2] Image Gen Failed for Page ${i + 1}:`, imgErr);
                    throw new Error(`Failed to generate illustration for page ${i + 1}: ${imgErr.message}`);
                }

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
                'picturebook',
                theme,
                {
                    pageCount,
                    version: 'v2',
                    originalImageUrl: imageUrl, // Persist original upload
                    pages: renderedPages // CRITICAL: Include pages for profile viewer
                },
                req.body.profileId // Pass profileId
            );

            res.json({
                success: true,
                story: renderedPages,
                // Return metadata for UI display
                metadata: {
                    theme,
                    storyText,
                    style: illustrationStyle,
                    vibe
                }
            });

        } catch (error: any) { // This is the catch for the inner try block
            console.error('[PictureBookV2] Failed:', error);
            // Ensure error message is passed to client
            res.status(500).json({ error: error.message || 'Unknown Error' });
        }
    } catch (err) { // This is the catch for the outer try block
        // Double safety for catch-block errors
        console.error('[PictureBookV2] Critical Error:', err);
        res.status(500).json({ error: 'Critical server error' });
    }
});
