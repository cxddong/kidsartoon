// src/services/worldBuilder.ts

import { geminiService } from './gemini.js';
import { doubaoService } from './doubao.js';
import { databaseService } from './database.js';
import { openAIService } from './openai.js';
import { safetyService } from './safetyService.js';

// Story Vibe Templates
export const STORY_VIBES = {
    adventure: {
        id: 'adventure',
        name: 'Adventure',
        emoji: '🌋',
        description: 'Hero vs Villain',
        slots: ['hero', 'villain', 'scene']
    },
    funny: {
        id: 'funny',
        name: 'Funny',
        emoji: '🤪',
        description: 'Pranks & Mishaps',
        slots: ['trickster', 'victim', 'scene']
    },
    fairytale: {
        id: 'fairytale',
        name: 'Fairy Tale',
        emoji: '🧚',
        description: 'Magic & Wonder',
        slots: ['protagonist', 'magical', 'scene']
    },
    school: {
        id: 'school',
        name: 'School Life',
        emoji: '🏫',
        description: 'Friends & Teachers',
        slots: ['student', 'friend', 'scene']
    }
};

interface Asset {
    id: string;
    imageUrl: string;
    description: string;
}

interface CartoonBookAssets {
    slot1?: Asset;  // Hero/Trickster/Protagonist/Student
    slot2?: Asset;  // Villain/Victim/Magical/Friend
    slot3?: Asset;  // Scene/Place
    slot4?: Asset;  // Extra (Pet/Object/Accessory)
}

interface CartoonBookOptions {
    vibe?: 'adventure' | 'funny' | 'fairytale' | 'school';       // NEW
    assets: CartoonBookAssets;
    totalPages: 4 | 8 | 12;                                      // UPDATED: removed 6, added 12
    layout?: 'standard' | 'dynamic';                             // NEW
    plotHint?: string;
    style?: string;
}

export class WorldBuilderService {
    private tasks: Record<string, any> = {};

    /**
     * Main entry point: Generate a complete cartoon book
     */
    async createCartoonBook(
        userId: string,
        options: CartoonBookOptions
    ): Promise<string> {
        const { assets, totalPages, plotHint, style, vibe, layout } = options;

        console.log(`[WorldBuilder] Starting cartoon book generation for user ${userId}`);
        console.log(`[WorldBuilder] Pages: ${totalPages}, Assets:`, Object.keys(assets));

        try {
            // 1. Generate Master Plot Outline
            console.log('[WorldBuilder] Step 1: Generating plot outline...');
            const plotOutline = await this.generatePlotOutline(assets, totalPages, plotHint, vibe);
            console.log('[WorldBuilder] Plot outline generated:', plotOutline);

            // 2. Create task record for tracking
            const taskId = `cb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await databaseService.saveCartoonBookTask({
                id: taskId,
                userId,
                type: 'cartoon_book',
                totalPages,
                assets,
                plotOutline,
                status: 'PENDING',
                pagesCompleted: 0,
                pages: [],
                cost: this.calculateCost(totalPages),
                createdAt: new Date(),
                vibe, // Save vibe
                layout, // Save layout
                plotHint // Save plot hint
            });

            console.log(`[WorldBuilder] Task created: ${taskId}`);

            // 3. Generate pages asynchronously (don't await - runs in background)
            this.generatePagesAsync(taskId, plotOutline, assets, vibe, style, layout, plotHint, userId).catch(err => {
                console.error(`[WorldBuilder] Async generation failed for ${taskId}:`, err);
            });

            return taskId;

        } catch (error) {
            console.error('[WorldBuilder] Error creating cartoon book:', error);
            throw error;
        }
    }

    /**
     * NEW: Analyze uploaded asset images with AI vision
     */
    private async analyzeAssets(assets: CartoonBookAssets): Promise<string> {
        let assetContext = '';

        try {
            // Analyze slot1 (main character)
            if (assets.slot1?.imageUrl) {
                console.log('[WorldBuilder] Analyzing asset slot1...');
                const analysis = await geminiService.analyzeImage(
                    assets.slot1.imageUrl,
                    'Describe this drawing in detail. Focus on: character appearance, colors, style, mood, and any unique features. Be specific and visual.'
                );
                assetContext += `Main Character (from uploaded drawing): ${analysis}. `;
            }

            // Analyze slot2 (second character/villain)
            if (assets.slot2?.imageUrl) {
                console.log('[WorldBuilder] Analyzing asset slot2...');
                const analysis = await geminiService.analyzeImage(
                    assets.slot2.imageUrl,
                    'Describe this drawing in detail. Focus on: character or object appearance, colors, and role it could play in a story.'
                );
                assetContext += `Second Character/Element (from uploaded drawing): ${analysis}. `;
            }

            // Analyze slot3 (setting/place)
            if (assets.slot3?.imageUrl) {
                console.log('[WorldBuilder] Analyzing asset slot3...');
                const analysis = await geminiService.analyzeImage(
                    assets.slot3.imageUrl,
                    'Describe this setting/place drawing. Focus on: environment, atmosphere, time of day, and mood.'
                );
                assetContext += `Setting (from uploaded drawing): ${analysis}. `;
            }

            // Analyze slot4 (extra element/pet/object)
            if (assets.slot4?.imageUrl) {
                console.log('[WorldBuilder] Analyzing asset slot4...');
                const analysis = await geminiService.analyzeImage(
                    assets.slot4.imageUrl,
                    'Describe this extra element/object/pet drawing. Focus on: what it is, special features, and how it could enhance the story.'
                );
                assetContext += `Extra Element (from uploaded drawing): ${analysis}. `;
            }
        } catch (error) {
            console.error('[WorldBuilder] Asset analysis failed:', error);
            // Fallback to text descriptions if vision analysis fails
            if (assets.slot1) assetContext += `Character: ${assets.slot1.description}. `;
            if (assets.slot2) assetContext += `Element: ${assets.slot2.description}. `;
            if (assets.slot3) assetContext += `Setting: ${assets.slot3.description}. `;
            if (assets.slot4) assetContext += `Extra: ${assets.slot4.description}. `;
        }

        return assetContext || 'A creative children\'s story with imaginative characters.';
    }

    /**
    * Step 1: Generate overall story outline using AI (vibe-based)
    * NOW with vision analysis of uploaded assets!
    */
    private async generatePlotOutline(
        assets: CartoonBookAssets,
        totalPages: number,
        plotHint?: string,
        vibe?: string
    ): Promise<string[]> {
        // NEW: Analyze uploaded assets with vision AI
        const assetAnalysis = await this.analyzeAssets(assets);
        console.log('[WorldBuilder] Asset analysis complete:', assetAnalysis.substring(0, 100) + '...');

        // Vibe-specific templates
        const vibeTemplates: Record<string, string> = {
            adventure: `Create an exciting ${totalPages}-chapter adventure story where a brave hero battles a dangerous villain to save their world.`,
            funny: `Create a hilarious ${totalPages}-chapter comedy where pranks, mishaps, and silly situations lead to unexpected fun.`,
            fairytale: `Create a magical ${totalPages}-chapter fairy tale full of wonder, enchantment, and happily-ever-after moments.`,
            school: `Create a heartwarming ${totalPages}-chapter school story about friendship, learning, and growing up together.`
        };

        const vibePrefix = vibe && vibeTemplates[vibe] ? vibeTemplates[vibe] : `Create a ${totalPages}-chapter story.`;
        // Vibe-specific examples (expanded to 12 to support longer stories)
        const vibeExamples: Record<string, string[]> = {
            school: [
                "The protagonist arrives at school on a sunny morning.",
                "In science class, they discover a mysterious glowing liquid.",
                "They share the secret with their best friend at lunch.",
                "The teacher announces a surprise field trip plan.",
                "They explore the library and find a hidden door.",
                "A rival student tries to discover their secret.",
                "They work together to solve a difficult math puzzle.",
                "The school project wins first prize at the assembly.",
                "They celebrate with a pizza party in the classroom.",
                "A new mystery appears in the school garden.",
                "The friends promise to stay teammates forever.",
                "The last bell rings on a perfect school day."
            ],
            funny: [
                "A goofy prank goes hilariously wrong.",
                "The main character accidentally wears two different shoes.",
                "A pet parrot starts repeating embarrassing secrets.",
                "A giant cake delivery leads to a messy situation.",
                "They try to walk the dog but the dog walks them.",
                "An umbrella opens at exactly the wrong time.",
                "A magic wand turns a sandwich into a dancing hat.",
                "The robot vacuum cleaner thinks it's a race car.",
                "A slip on a banana peel leads to a world record.",
                "The principal joins in the silly dance contest.",
                "A misunderstanding leads to a parade for a cat.",
                "Everyone laughs as the day ends in a pillow fight."
            ],
            adventure: [
                "The hero finds an ancient map in the attic.",
                "They cross the Whispering Forest to reach the mountains.",
                "A mechanical dragon guards the hidden cave entrance.",
                "They solve the riddle of the Stone Guardians.",
                "An underground river takes them to a lost city.",
                "The villain tries to capture the Golden Key.",
                "A brave rescue mission saves the mountain village.",
                "They climb the Crystal Peak to find the treasure.",
                "A storm tests the hero's courage and skill.",
                "They find the secret power of the ancient artifact.",
                "The villain is defeated in a final showdown.",
                "The hero returns home as a celebrated legend."
            ],
            fairytale: [
                "Once upon a time in a kingdom of floating islands.",
                "A magical fairy gives the protagonist a special gift.",
                "They travel to the Moon Palace to save the stars.",
                "A talking squirrel helps them find the mirror of truth.",
                "The Glass Mountain revealed its hidden staircase.",
                "They attend the ball in a carriage made of clouds.",
                "A spell turns the palace garden into a forest of candy.",
                "The dragon turns out to be a misunderstood poet.",
                "A wish comes true at the fountain of silver water.",
                "The kingdom celebrates the return of the lost prince.",
                "The magic book opens its final glowing chapter.",
                "And they all lived happily ever after."
            ]
        };
        const vibeExample = vibe && vibeExamples[vibe] ? vibeExamples[vibe].slice(0, totalPages) : vibeExamples.adventure.slice(0, totalPages);

        // MANDATORY vibe and plotHint enforcement
        const systemPrompt = `⚠️ MANDATORY: Create a ${(vibe || 'adventure').toUpperCase()} story. This is NON-NEGOTIABLE.
${vibe === 'school' ? 'REQUIRED: Story happens at SCHOOL (classroom/playground). NO magical forests, NO fairy tales!' : ''}${vibe === 'funny' ? 'REQUIRED: COMEDY with jokes and laughter. NO serious adventures!' : ''}${vibe === 'adventure' ? 'REQUIRED: ADVENTURE with quests and exploration!' : ''}${vibe === 'fairytale' ? 'REQUIRED: FAIRYTALE with magic and "happily ever after"!' : ''}

${plotHint ? `CRITICAL USER DIRECTION: ${plotHint}\n(MANDATORY: You MUST strictly follow this plot direction. Integrate it into the theme while keeping the requested vibe.)` : ''}

TARGET AUDIENCE: Children (6-10 years old). 
LANGUAGE: rigorous simplicity. Use short sentences. Avoid complex words.
STRUCTURE: 
1. Chapter 1 MUST be an INTRODUCTION. Clearly state WHO the main character is and WHERE they are. Do not start in the middle of action.
2. The story must flow logically: Introduction -> inciting Incident -> Adventure -> Conclusion.
3. CLEAR VISUALS: Each chapter must describe scenes that are easy to draw.

CHARACTERS: ${assetAnalysis}
OUTPUT FORMAT: Wrap your JSON array with START_JSON and END_JSON tags.
ACHIEVEMENT: Each string MUST be a mini-chapter with 3-4 DESCRIPTIVE sentences.
EXACT EXAMPLE for ${(vibe || 'adventure').toUpperCase()}:
START_JSON
${JSON.stringify(vibeExample.map(e => e + " They encounter a challenge and resolve it with a conversation."))}
END_JSON
STRICT RULES:
1. Use START_JSON and END_JSON tags.
2. Each chapter description MUST have 3-4 sentences to provide enough material for 4-6 panels.
3. Include characters from analysis.
4. Exactly ${totalPages} strings.
GENERATE:`;

        const userPrompt = `${totalPages}-chapter ${vibe || 'adventure'} story. ${plotHint ? `STORY DIRECTION: ${plotHint}. ` : ''}MUST be ${vibe} themed!`;

        try {
            const result = await openAIService.generateJSON(userPrompt, systemPrompt);
            console.log('[WorldBuilder] OpenAI Script Result:', result);

            // Expecting something like { "outline": ["chapter1", "chapter2", ...] }
            const outline = result.outline || result.chapters || result;

            if (Array.isArray(outline)) {
                if (outline.length === totalPages) {
                    return outline.map((item: any) =>
                        typeof item === 'string' ? item : (item.content || item.story || JSON.stringify(item))
                    );
                }
                console.warn(`[WorldBuilder] OpenAI outline length mismatch: got ${outline.length}, expected ${totalPages}`);
            }
        } catch (error) {
            console.error('[WorldBuilder] OpenAI script generation failed, using fallback:', error);
        }

        // Fallback: Generate basic outline
        return this.generateFallbackOutline(totalPages, vibe);
    }

    /**
     * NEW: Generate complete coherent story (all panels at once)
     */
    private async generateFullStoryPanels(
        assetAnalysis: string,
        outline: string[],
        totalPanels: number,
        panelsPerPage: number,
        vibe?: string,
        plotHint?: string
    ): Promise<any[]> {
        const systemPrompt = `You are a professional children's graphic novel author.
STORY OUTLINE (${outline.length} Chapters):
${outline.map((ch, i) => `Chapter ${i + 1}: ${ch}`).join('\n')}

${plotHint ? `CRITICAL USER DIRECTION (MANDATORY): ${plotHint}` : ''}

MANDATORY REQUIREMENTS:
1. Return EXACTLY ${totalPanels} panels.
2. Continuity: Use this description for the main character in EVERY panel: "${assetAnalysis}".
3. Dialogue: Write SIMPLE, PUNCHY dialogue suitable for a 6-year-old. Short sentences!
4. VISUALS: Panel 1 of Chapter 1 MUST be an ESTABLISHING SHOT introducing the character and location effectively.
5. Every single panel MUST have unique dialogue and a unique visual scene description. NO REPETITION.
6. Each panel continues the story logically from the previous one. matches the image description.
7. Choose "bubblePosition" (top, bottom, top-left, top-right, bottom-left, bottom-right).
8. Output JSON with a "panels" array.`;

        const userPrompt = `Generate a structured script for a ${vibe || 'adventure'} graphic novel in ${totalPanels} panels. 
CRITICAL: ENSURE VISUAL CONTINUITY using the character description. Avoid repetitive text.`;

        try {
            const result = await openAIService.generateJSON(userPrompt, systemPrompt);
            const panels = result.panels || result;

            if (Array.isArray(panels)) {
                console.log(`[WorldBuilder] OpenAI generated ${panels.length} panels`);

                // Ensure correct structure and padding
                const validatedPanels = panels.map((p, i) => ({
                    panel: p.panel || i + 1,
                    dialogue: p.dialogue || "The story continues...",
                    sceneDescription: p.sceneDescription || "A transition scene",
                    emotion: p.emotion || "interested",
                    bubbleType: p.bubbleType || "speech",
                    bubblePosition: p.bubblePosition || "top"
                }));

                while (validatedPanels.length < totalPanels) {
                    validatedPanels.push({
                        panel: validatedPanels.length + 1,
                        dialogue: "...",
                        sceneDescription: "Connecting scene",
                        emotion: "neutral",
                        bubbleType: "speech",
                        bubblePosition: "top"
                    });
                }

                return validatedPanels.slice(0, totalPanels);
            }
        } catch (error) {
            console.error('[WorldBuilder] OpenAI full story generation failed:', error);
        }

        // Fallback
        return this.generateFallbackPanels(totalPanels, panelsPerPage, outline, assetAnalysis, vibe);
    }

    private generateFallbackPanels(totalPanels: number, panelsPerPage: number, outline: string[], assetAnalysis: string, vibe?: string): any[] {
        const panels: any[] = [];

        const charMatch = assetAnalysis.match(/Main Character[^:]*:\s*([^.]+)/i);
        const character = charMatch ? charMatch[1].substring(0, 40) : "the hero";

        // Unique bridging phrases to avoid repetition
        const variations = [
            "Wait, what's that?",
            "Let's move forward!",
            "I have a good feeling about this.",
            "Quickly, this way!",
            "This is just the beginning.",
            "The journey continues...",
            "Something feels different here.",
            "Let's check it out!",
            "Amazing discovery!",
            "We must be careful.",
            "I've never seen anything like this!",
            "Keep going, we're almost there!"
        ];

        console.log(`[WorldBuilder] Using improved fallback panels (Variety logic enabled)`);

        for (let i = 0; i < outline.length; i++) {
            const chapterText = outline[i];
            const sentences = chapterText.split(/[.!?]/).filter(s => s.trim().length > 3);

            for (let j = 0; j < panelsPerPage; j++) {
                const panelNumber = (i * panelsPerPage) + j + 1;
                let dialogue = "";

                // Logic: 
                // 1. First panel of chapter = chapter summary
                // 2. Other panels = unique sentences from summary (if available)
                // 3. Fallback to unique bridging phrases + small variation

                if (j === 0) {
                    dialogue = sentences[0] || chapterText;
                } else if (j < sentences.length) {
                    dialogue = sentences[j];
                } else {
                    // Out of sentences, use unique bridging phrase
                    const vIdx = (i * panelsPerPage + j) % variations.length;
                    dialogue = variations[vIdx];
                }

                panels.push({
                    panel: panelNumber,
                    dialogue: dialogue.trim(),
                    caption: dialogue.trim(),
                    sceneDescription: `${character} in ${vibe || 'a story'} scene: ${dialogue.substring(0, 100)}`,
                    emotion: ['excited', 'curious', 'brave', 'joyful', 'determined', 'amazed'][j % 6],
                    bubbleType: j === 0 ? 'narration' : 'speech',
                    bubblePosition: ['top', 'bottom', 'middle-left', 'middle-right', 'top-right', 'bottom-left'][j % 6]
                });
            }
        }

        return panels.slice(0, totalPanels);
    }

    /**
     * Step 2: Generate pages with COHERENT story (NEW APPROACH)
     */
    private async generatePagesAsync(
        taskId: string,
        plotOutline: string[],
        assets: CartoonBookAssets,
        vibe?: string,
        style?: string,
        layout?: 'standard' | 'dynamic',
        plotHint?: string,
        userId?: string // Pass userId
    ) {
        console.log('[WorldBuilder] Starting NEW coherent story generation...');

        try {
            // 0. Safety Check
            const safetyChecks = [];
            if (plotHint) safetyChecks.push(safetyService.validatePrompt(plotHint));
            if (assets.slot1?.imageUrl) safetyChecks.push(safetyService.validateImage(assets.slot1.imageUrl));
            if (assets.slot2?.imageUrl) safetyChecks.push(safetyService.validateImage(assets.slot2.imageUrl));
            if (assets.slot3?.imageUrl) safetyChecks.push(safetyService.validateImage(assets.slot3.imageUrl));

            const safetyResults = await Promise.all(safetyChecks);
            if (safetyResults.some(res => res === false)) {
                console.warn('[WorldBuilder] Safety Check Failed');
                // Persist the failure state so frontend can show "Refusal"
                this.tasks[taskId] = {
                    ...this.tasks[taskId],
                    status: 'FAILED',
                    error: "Oops, this magic is a bit too dark. Let's try a brighter spell!",
                    cost: 0
                };
                return;
            }

            // 1. Get asset analysis
            const assetAnalysis = await this.analyzeAssets(assets);
            console.log('[WorldBuilder] Asset analysis ready for full story');

            // PROGRESS UPDATE: Analysis complete
            await databaseService.updateCartoonBookTask(taskId, {
                status: 'GENERATING',
                statusMessage: 'Character analysis complete! Designing your hero...',
                progress: 10
            });

            // 2. Generate COMPLETE coherent story (all panels at once)
            const panelsPerPage = (layout as string) === 'dynamic' ? 6 : 4;
            const totalPanels = plotOutline.length * panelsPerPage;
            console.log(`[WorldBuilder] Layout: ${layout}, Panels per page: ${panelsPerPage}, Total: ${totalPanels} `);

            const allPanels = await this.generateFullStoryPanels(
                assetAnalysis,
                plotOutline,
                totalPanels,
                panelsPerPage,
                vibe,
                plotHint
            );

            console.log(`[WorldBuilder] ✅ Got ${allPanels.length} panels, proceeding with image generation`);

            // PROGRESS UPDATE: Script complete
            await databaseService.updateCartoonBookTask(taskId, {
                status: 'GENERATING',
                statusMessage: 'Script written! Now drawing the first page...',
                progress: 25
            });

            // 3. Generate images for each page (4 panels at a time)
            const pages = [];

            for (let pageIndex = 0; pageIndex < plotOutline.length; pageIndex++) {
                const pageNumber = pageIndex + 1;

                console.log(`[WorldBuilder] Generating page ${pageNumber}/${plotOutline.length}...`);

                // Update progress
                await databaseService.updateCartoonBookTask(taskId, {
                    status: 'GENERATING',
                    currentPage: pageNumber,
                    statusMessage: `Drawing page ${pageNumber} of ${plotOutline.length}...`,
                    progress: 25 + Math.floor((pageIndex / plotOutline.length) * 75)
                });

                // Build image prompt from page panels
                const panelsPerPage = (layout as string) === 'dynamic' ? 6 : 4;
                const startIdx = pageIndex * panelsPerPage;
                const pagePanels = allPanels.slice(startIdx, startIdx + panelsPerPage);

                const panelDescriptions = pagePanels
                    .map((p, i) => `Panel ${i + 1}: ${p.sceneDescription || p.caption}`)
                    .join(' | ');

                const gridLayout = panelsPerPage === 4 ? '2x2 grid' :
                    panelsPerPage === 6 ? '2x3 grid' : '2x4 grid';

                const stylePrompt = style === 'movie_magic' ? '3D Pixar style, vibrant, character-focused' :
                    style === 'comic_book' ? 'Comic book style, bold lines, dynamic' :
                        style === 'watercolor' ? 'Watercolor painting style, soft colors' :
                            '3D animation style';

                const imagePrompt = `A ${panelsPerPage}-panel comic strip (${gridLayout} layout).
Style: ${stylePrompt}, high quality, consistent character design.
EVERY PANEL MUST BE VISUALLY DIFFERENT. Show different angles, actions, and perspectives.

CHARACTER:
${assetAnalysis}

PANELS TO DRAW: ${panelDescriptions}

CRITICAL: Character appearance must match the description exactly.
--no text bubbles, --no words inside panels`;

                // Generate image using asset as reference
                let imageUrl = '';
                try {
                    console.log(`[WorldBuilder] Generating page ${pageNumber} (${panelsPerPage} panels) with text-to-image...`);
                    const tempImageUrl = await doubaoService.generateImage(imagePrompt, '2K');
                    console.log(`[WorldBuilder] ✅ Page ${pageNumber} image generated, uploading to storage...`);

                    // CRITICAL FIX: Upload to permanent storage
                    try {
                        const imgRes = await fetch(tempImageUrl);
                        if (imgRes.ok) {
                            const arrayBuffer = await imgRes.arrayBuffer();
                            const buffer = Buffer.from(arrayBuffer);
                            imageUrl = await databaseService.uploadFile(buffer, 'image/png', 'cartoon-books');
                            console.log(`[WorldBuilder] ✅ Page ${pageNumber} uploaded to permanent storage`);
                        } else {
                            console.warn(`[WorldBuilder] Failed to fetch image for upload, using temp URL`);
                            imageUrl = tempImageUrl;
                        }
                    } catch (uploadErr) {
                        console.error(`[WorldBuilder] Upload failed, using temp URL:`, uploadErr);
                        imageUrl = tempImageUrl;
                    }
                } catch (error) {
                    console.error(`[WorldBuilder] Page ${pageNumber} image error:`, error);
                    imageUrl = await doubaoService.generateImage(imagePrompt, '2K');
                }

                // Save page with normalized panel numbers (1-4 for each page)
                const pageData = {
                    pageNumber,
                    imageUrl,
                    chapterText: plotOutline[pageIndex],
                    panels: pagePanels.map((p, idx) => ({
                        panel: idx + 1,  // Normalize to 1-4 for this page
                        caption: p.dialogue || p.caption,
                        sceneDescription: p.sceneDescription,
                        emotion: p.emotion || 'happy',
                        bubbleType: p.bubbleType || 'speech',
                        bubblePosition: p.bubblePosition || 'top'
                    }))
                };

                pages.push(pageData);

                // Save progress
                await databaseService.updateCartoonBookTask(taskId, {
                    pagesCompleted: pageNumber,
                    pages: pages
                });

                console.log(`[WorldBuilder] Page ${pageNumber} completed and saved`);
            }

            // Save to History (Cartoon Book)
            const coverImage = pages[0]?.imageUrl || '';
            if (coverImage && userId) {
                await databaseService.saveImageRecord(
                    userId,
                    coverImage,
                    'cartoon-book', // STRICT TYPE
                    `Cartoon Book: ${vibe || 'Adventure'}`,
                    {
                        cartoonBook: {
                            taskId,
                            pages,
                            plotOutline,
                            vibe,
                            settings: { layout, plotHint },
                            createdAt: Date.now()
                        }
                    }
                );
            }

            // Mark as completed
            await databaseService.updateCartoonBookTask(taskId, {
                status: 'COMPLETED',
                pagesCompleted: plotOutline.length,
                progress: 100,
                statusMessage: 'Story completed! Preparing your masterpiece...'
            });

            console.log(`[WorldBuilder] Cartoon book ${taskId} completed with coherent story!`);

        } catch (error) {
            console.error('[WorldBuilder] Coherent story generation failed:', error);

            // Mark as failed
            await databaseService.updateCartoonBookTask(taskId, {
                status: 'FAILED',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    /**
     * Step 3: Generate a single comic page (4 panels)
     * Returns both the image URL and panel dialogue data
     */
    private async generateComicPage(
        chapterPrompt: string,
        assets: CartoonBookAssets,
        pageNumber: number,
        style?: string
    ): Promise<{ imageUrl: string; panels: any[] }> {
        // Build character context with asset image URLs for reference
        let characterContext = '';
        let referenceImageUrl = '';  // Use first available asset as img2img reference

        if (assets.slot1) {
            characterContext += `Main character (from uploaded drawing): ${assets.slot1.description}. `;
            referenceImageUrl = assets.slot1.imageUrl;
        }
        if (assets.slot2) {
            characterContext += `Second character (from uploaded drawing): ${assets.slot2.description}. `;
            if (!referenceImageUrl) referenceImageUrl = assets.slot2.imageUrl;
        }
        if (assets.slot3) {
            characterContext += `Setting (from uploaded drawing): ${assets.slot3.description}. `;
            if (!referenceImageUrl) referenceImageUrl = assets.slot3.imageUrl;
        }

        const comicPrompt = `${characterContext}\n\nPage ${pageNumber}: ${chapterPrompt}\n\nCreate a 4-panel comic strip showing this scene. Each panel should advance the story.`;

        console.log(`[WorldBuilder] Generating comic for: "${chapterPrompt.substring(0, 50)}..."`);

        try {
            // Add timeout wrapper to prevent hanging
            const timeoutMs = 60000; // 60 seconds timeout

            const comicImageUrl = await Promise.race([
                (async () => {
                    console.log(`[WorldBuilder] Calling summarizeStoryToComicPanels...`);
                    const panels = await doubaoService.summarizeStoryToComicPanels(comicPrompt);

                    console.log(`[WorldBuilder] Generating image from ${panels.length} panels...`);

                    // Map style IDs to detailed prompts
                    const stylePrompts: Record<string, string> = {
                        'movie_magic': '3D Pixar Animation Style, high detail, vibrant, character-focused',
                        'toy_kingdom': 'Toy Kingdom style, plastic textures, miniature world',
                        'clay_world': 'Clay stop-motion, Aardman style, soft shadows',
                        'paper_craft': 'Paper Craft, cut paper layers, origami, textured',
                        'pixel_land': 'Pixel art, Minecraft style, blocky, 8-bit',
                        'doodle_magic': 'Chalkboard drawing, glowing chalk lines',
                        'watercolor': 'Watercolor painting, soft brushstrokes',
                        'comic_book': 'Classic comic book style, bold lines, halftone'
                    };
                    const stylePrompt = stylePrompts[style || ''] || style || 'vibrant comic book style';

                    // Extract scene descriptions WITHOUT dialogue
                    const sceneDescriptions = panels.map((p, i) => `Panel ${i + 1}: ${p.sceneDescription}`).join('; ');

                    // Build prompt emphasizing uploaded asset consistency
                    const fullPrompt = `${stylePrompt}. ${characterContext}\n\n4-panel comic strip: ${sceneDescriptions}.\n\nCRITICAL: Match uploaded drawing style. NO text bubbles. Clear panel borders.`;

                    let imageUrl: string;

                    // Try img2img with reference image for character consistency
                    if (referenceImageUrl) {
                        console.log(`[WorldBuilder] Using asset as reference: ${referenceImageUrl.substring(0, 40)}...`);
                        try {
                            imageUrl = await doubaoService.generateImageFromImage(
                                fullPrompt,
                                referenceImageUrl,
                                '2K'  // Just the size parameter
                            );
                        } catch (refError) {
                            console.warn(`[WorldBuilder] Img2img failed, using text-only:`, refError);
                            imageUrl = await doubaoService.generateImage(fullPrompt, '2K');
                        }
                    } else {
                        imageUrl = await doubaoService.generateImage(fullPrompt, '2K');
                    }

                    return { imageUrl, panels };  // Return both image and panel data
                })(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Comic generation timeout after ${timeoutMs}ms`)), timeoutMs)
                )
            ]);

            console.log(`[WorldBuilder] Page ${pageNumber} image generated successfully`);
            return comicImageUrl;

        } catch (error) {
            console.error(`[WorldBuilder] Error generating comic page ${pageNumber}:`, error);

            // Return a fallback placeholder instead of crashing
            console.log(`[WorldBuilder] Using fallback placeholder for page ${pageNumber}`);

            // Generate a simple text-based placeholder with style
            const stylePrompt = style || 'colorful children\'s book style';
            const fallbackPrompt = `${stylePrompt}. Simple storybook illustration: ${chapterPrompt}. ${characterContext} Child-friendly art.`;

            try {
                const fallbackImage = await doubaoService.generateImage(fallbackPrompt, '2K');
                // Generate generic panel dialogues for fallback
                const fallbackPanels = [
                    { panel: 1, caption: "The story begins...", sceneDescription: chapterPrompt, emotion: "curious", bubbleType: "narration", bubblePosition: "bottom" },
                    { panel: 2, caption: "Something interesting happens!", sceneDescription: chapterPrompt, emotion: "excited", bubbleType: "narration", bubblePosition: "bottom" },
                    { panel: 3, caption: "The adventure continues...", sceneDescription: chapterPrompt, emotion: "determined", bubbleType: "narration", bubblePosition: "bottom" },
                    { panel: 4, caption: "A wonderful ending!", sceneDescription: chapterPrompt, emotion: "happy", bubbleType: "narration", bubblePosition: "bottom" }
                ];
                return { imageUrl: fallbackImage, panels: fallbackPanels };
            } catch (fallbackError) {
                console.error(`[WorldBuilder] Fallback also failed:`, fallbackError);
                throw new Error(`Failed to generate page ${pageNumber}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    /**
     * Fallback outline generator with vibe support
     */
    private generateFallbackOutline(pages: number, vibe?: string): string[] {
        const templates: Record<string, Record<number, string[]>> = {
            adventure: {
                4: [
                    "Our hero discovers a mysterious ancient artifact hidden in the attic. It glows with a strange blue light that seems to point towards the Whispering Woods. They decide to pack their bag and begin an unexpected journey.",
                    "The journey takes them through a forest filled with magical creatures and singing trees. They meet a friendly companion who knows the secrets of the path ahead. Together, they face their first trial by solving a riddle of the Stone Guardians.",
                    "Deep inside the mountains, they find a hidden temple guarded by a mechanical puzzle box. It takes all their cleverness and teamwork to unlock the entrance. Inside, they discover that their true strength comes from within.",
                    "Victory is celebrated as they return home with stories of their grand adventure. The artifact is safely placed in a museum for all to see. Our hero looks at the map, ready for whatever mystery comes next!"
                ],
                8: [
                    "A mysterious map appears in the village square, floating in a bubble of light. Everyone is amazed, but only our hero is brave enough to touch it. The map reveals a path to the fabled City of Gold.",
                    "The journey begins at dawn as our hero crosses the Great River. They meet a curious fish who offers to guide them through the rapids. It's the start of a friendship that will last a lifetime.",
                    "They enter a desert where the sands shift and dance to the wind. A sandstorm reveals a hidden palace that hasn't been seen for centuries. They find a place to rest and prepare for the heat.",
                    "Inside the palace, they encounter a wise old owl who knows everything about the world. The owl gives them a compass that doesn't point north, but points to what they need most. It's a gift they will cherish.",
                    "They climb the highest peaks of the Frosty Mountains where the air is thin and crisp. A friendly yeti helps them find a secret pass through the ice. They learn that kindness is the most powerful magic of all.",
                    "A dark canyon stands in their way, filled with shadows and strange noises. They use the owl's compass to find the path of light through the darkness. Their courage shines brighter than the stars.",
                    "Finally, they reach the gates of the City of Gold, which shine in the setting sun. The gates are locked, but their new friends help them find the key. It's a moment of pure joy and wonder.",
                    "The treasure they find isn't gold or jewels, but the knowledge of the ancient world. They return home as legends, ready to share their stories with everyone. A new dawn breaks over the village, full of promise."
                ],
                12: [
                    "Everything starts with a mysterious discovery in the village library. An old book falls from a shelf, revealing a secret door. Inside, they find a glowing orb that speaks in a gentle voice.",
                    "The orb tells them of a world in need of a hero to bring back the missing stars. They accept the quest and step into a portal of swirling light. It's the most exciting thing that's ever happened.",
                    "They arrive in the Land of Floating Islands, where the ground is made of clouds. They meet a pilot bird who offers to fly them to the first star-shrine. The view from above is absolutely breathtaking.",
                    "At the first shrine, they solve a puzzle made of light and shadow. They recover the Star of Hope, which begins to glow in their hand. The first piece of the puzzle is found!",
                    "They travel to the Underwater Kingdom, where bubbles act as elevators. A dolphin prince helps them navigate the coral maze. They find the Star of Courage hidden inside a giant pearl.",
                    "In the Forest of Echoes, birds repeat their every word with a musical twist. They have to sing a song of friendship to open the path forward. Their voices blend perfectly in harmony.",
                    "They find the Star of Harmony guarded by a sleeping dragon who loves lullabies. They sing the dragon to sleep and gently take the star from its pedestal. Success tastes like sweet honey.",
                    "The journey continues to the Clockwork Desert, where time behaves strangely. They fix a giant gear that has been stuck for a hundred years. The Star of Time is their reward for their hard work.",
                    "They cross the Rainbow Bridge, which only appears after a summer rain. Each step plays a different note of a beautiful melody. The Star of Joy is found at the very end of the bridge.",
                    "The villain tries to take the stars, but our hero uses the power of friendship to stop them. They show the villain that sharing is better than taking. Even the villain's heart begins to soften.",
                    "All the stars are returned to the sky, and the world is filled with light again. A grand festival is held in the hero's honor. Everyone is happy and safe once more.",
                    "The hero returns to the library, but the secret door is now a cozy Reading Nook. They realize that every day can be an adventure if you have a good book. They smile, knowing they've truly found their place."
                ]
            },
            funny: {
                4: [
                    "A goofy prank goes hilariously wrong when the glue turns out to be bubblegum. Everyone starts sticking to things like they're made of magnets. The main character tries to walk but ends up bouncing like a ball!",
                    "They decide to enter a contest where the goal is to wear as many hats as possible. By the time they reach a hundred, they look like a wobbling tower of fabric. Everyone is laughing as they try to keep their balance.",
                    "A pet parrot starts repeating everyone's embarrassing secrets in front of the whole town. Max admits he still sleeps with a teddy bear named Mr. Fluffernutter. The audience erupts into cheers and laughter!",
                    "The day ends with a giant pillow fight that turns the village square into a snowstorm of feathers. Everyone is smiling and laughing, even the mayor! It's the funniest day anyone can remember.",
                ],
                8: [
                    "It's the day of the Big Joke Festival, and everyone is trying to be the funniest. Our hero decides to wear their clothes backward and pretend to be walking in reverse. It's a simple trick, but it gets everyone giggling.",
                    "They try to bake a giant cake, but they accidentally use 'Rising Dust' instead of flour. The cake begins to float away towards the clouds! They have to chase it with a giant butterfly net.",
                    "A goat eats the town's official music scores and starts singing opera instead. The mayor is confused, but the crowd loves the goat's high notes. It's a musical disaster that's actually quite beautiful.",
                    "They try to walk the dog, but the dog finds a pair of rocket boots in the trash. Suddenly, the dog is walking them through the sky! They look down and wave at all the surprised people below.",
                    "A magic wand turns a sandwich into a pair of dancing socks. The socks start performing a tango on the kitchen table. Our hero tries to catch them but they're just too fast and light on their feet.",
                    "They join a race where the only rule is you must ride a very slow animal. Our hero chooses a turtle named Speedy who takes a nap halfway through. They decide to join the turtle for a quick rest.",
                    "The robot vacuum cleaner thinks it's a champion race car and starts doing laps around the house. It's chasing a dust bunny that's actually a real bunny. The chaos is loud, messy, and absolutely hilarious.",
                    "The festival ends with a giant slippery slide covered in soap and bubbles. Everyone slides down together, making the biggest splash in the history of the town. Laughter is the best way to end a silly day!"
                ],
                12: [
                    "A silly day begins with a prank that involves giant rubber chickens and a lot of confetti. Everyone is surprised and laughing as the chickens start to squeak in rhythm. It's the best start to a festival ever.",
                    "The main character decides to build a robot that only makes jokes. The robot is very good at puns, but its voice sounds like a squeaky hinge. Soon the whole town is groaning and laughing at the same time.",
                    "They try to walk the dog, but the dog finds a pair of rocket boots in the trash. Suddenly, the dog is walking them through the sky! They look down and wave at all the surprised people below.",
                    "A giant cake delivery leads to a messy situation when the delivery truck hits a speed bump. Confetti and frosting are everywhere! The town looks like it's been decorated by a giant birthday monster.",
                    "They enter a contest to see who can make the funniest face. Our hero uses tape and some silly putty to create a masterpiece of goofiness. Even the judges can't stop chuckling.",
                    "The pet parrot starts repeating everyone's secrets, but it adds a funny sound effect at the end of every sentence. It's embarrassing but also incredibly entertaining for the audience.",
                    "They try to plant a garden of vegetables, but they accidentally use 'Magic Giggling Seeds'. Now the carrots are playing tricks on the bunnies! Every time someone tries to pick a carrot, it disappears.",
                    "A giant slippery slide is built in the middle of the school hallway. The principal is the first one to go down, and they have the biggest smile on their face. It's a school day like no other.",
                    "The robot vacuum cleaner thinks it's a world-class chef and starts trying to flip pancakes. The kitchen is a mess of batter and laughter. Our hero decides to join in and make a giant pancake tower.",
                    "A misunderstanding leads to a parade for a very confused cat named Barnaby. Barnaby is wearing a small crown and looking very dignified despite the chaos. The town has never been so festive.",
                    "Everyone joins in a giant game of freeze-dance in the park. The music is loud and silly, and everyone's poses are absolutely ridiculous. It's a moment of pure, unadulterated joy.",
                    "The day ends with a fireworks display where the fireworks are actually giant colorful bubbles. They pop with a sound like a tiny bell. Everyone goes home with a smile and a funny story to tell."
                ]
            },
            fairytale: {
                4: [
                    "Once upon a time, a magical fairy gives our protagonist a pair of silver wings. They are told that These wings can carry them to the Land of Dreams. With a flutter and a sparkle, they take to the sky.",
                    "They travel to the Moon Palace, which is made entirely of glowing starlight. They meet the Weaver of Dreams who is busy spinning clouds into blankets. They help the weaver finish a blanket of soft blue velvet.",
                    "A talking squirrel helps them find the Mirror of Truth hidden in a cave of crystals. The mirror shows them that their heart is full of kindness and bravery. They realize they've always had what they needed.",
                    "And they all lived happily ever after in a kingdom where the sun never sets. The silver wings are kept in a special glass box to remind them of their journey. Magic is everywhere if you know where to look."
                ],
                8: [
                    "Once upon a time in a kingdom of floating islands, a young dreamer finds a golden feather. An old wizard tells them the feather belongs to the Phoenix of Peace. The dreamer sets off to find the bird and restore the land.",
                    "They travel through the Forest of Whispers where trees tell stories of the ancient world. A friendly fox guides them through the mist to a hidden bridge. Every step they take leaves a trail of glowing flowers.",
                    "They reach the Glass Mountain, which is so smooth it's like a giant mirror. They have to use the golden feather to tickle the mountain until it opens a secret path. The mountain's laughter sounds like tinkling bells.",
                    "Inside the mountain, they find a lake of liquid silver that shows the future. They see a vision of their friends waiting for them with open arms. It gives them the courage to continue their difficult quest.",
                    "They attend a ball in a carriage made of clouds, pulled by four white unicorns. The stars themselves descend to dance with the guests on the marble floor. It's a night of pure enchantment and wonder.",
                    "A spell turns the palace garden into a forest of candy, where the river is made of chocolate. They have to find the Phoenix before the sun goes down and the magic fades. They share some candy with a group of hungry bunnies.",
                    "The Phoenix is found, but it's trapped in a cage of shadows by a misunderstanding. The dreamer uses the power of a single kind word to break the cage. The bird rises into the air, its wings glowing like the sun.",
                    "The kingdom is saved, and the dreamer is crowned the Guardian of Magic. They use their power to make sure everyone's dreams come true. And they all lived happily ever after in a world full of light."
                ],
                12: [
                    "Once upon a time, a star falls from the sky and lands in a quiet garden. A young child finds it and realizes the star is actually a lost spirit from the heavens. They decide to help the spirit return home.",
                    "The journey begins at the edge of the world, where the ocean meets the sky. They meet a whale with wings made of seafoam who offers to carry them to the clouds. The sound of the whale's song is like a beautiful lullaby.",
                    "They arrive at the Palace of Clouds, where the floor is soft like pillows. The Cloud King gives them a lantern made of moonlight to guide them through the darkness. It's a gift of hope and light.",
                    "In the Forest of Echoes, birds repeat their every word with a musical twist. They have to sing a song of friendship to open the path forward. Their voices blend perfectly in harmony.",
                    "They reach the Silver Fountain, where the water flows upward toward the stars. They have to drink the water to gain the power to fly. The water tastes like sweet summer rain.",
                    "The dark spirits of the night try to stop them, but the child used the lantern's light to keep them away. Their courage is stronger than any shadow. They feel a sense of peace and bravery.",
                    "They find the entrance to the Starry Kingdom, guarded by a giant owl with golden eyes. The owl asks them a riddle about the meaning of love. They answer with a smile and a kind word.",
                    "The star spirit is finally reunited with its family in the night sky. The heavens celebrate with a display of falling stars and glowing lights. It's a moment of pure magic and wonder.",
                    "The child is given a small star-shaped pendant to remember their journey. The pendant glows whenever they are feeling brave or kind. It's a reminder that magic is always with them.",
                    "They return to their garden, but the flowers are now glowing with starlight. They realize that even the most ordinary place can be magical if you have an open heart. They smile at the night sky.",
                    "The whole town hears of their adventure and comes to see the glowing garden. They share the magic with everyone, bringing hope and joy to the village. The world is a little brighter now.",
                    "And they all lived happily ever after in a world where magic and reality are one. The child becomes a storyteller, sharing the wonders of the stars with generations to come. The star pendant glows brightly forever."
                ]
            },
            school: {
                4: [
                    "The protagonist arrives at school on a sunny morning with a brand new backpack. They find a mysterious glowing liquid in their locker that smells like strawberries. Is it a science experiment or something more?",
                    "In science class, they discover that the liquid can make school supplies float! They spend the afternoon making pens and pencils dance in the air. Their best friend thinks it's the coolest thing ever.",
                    "They share the secret with their best friend during lunch in the cafeteria. They decide to use the liquid to help their teacher with a difficult school project. The project is a huge success and everyone is impressed.",
                    "The school day ends with a celebration in the classroom with a pizza party. They realize that school is full of surprises if you're willing to look for them. They can't wait to see what happens tomorrow!"
                ],
                8: [
                    "First day nerves turn into excitement as our hero walks into the new classroom. The teacher is wearing a tie that looks like a galaxy of stars. They find their seat and meet a friendly student sitting next to them.",
                    "They make a new best friend during recess when they both try to save a ladybug. They spend the afternoon sharing stories about their summer adventures. It's the start of a great friendship.",
                    "The class begins a big group project about the history of the town. Our hero is chosen to lead the team and research the old clock tower. They find an old key hidden in the library's basement.",
                    "Ideas clash during the first team meeting as everyone wants to do something different. They learn that listening is just as important as talking when working together. They find a way to combine everyone's ideas.",
                    "They work on a group project in the library and discover a secret passage behind a bookshelf. It leads to a hidden room filled with old school trophies and dusty maps. They feel like real detectives.",
                    "A rival student tries to discover their secret passage, but they keep it hidden with cleverness. They use the hidden room as their team's secret headquarters for the project. It's the perfect place to work.",
                    "The school project wins first prize at the big assembly in the gym. The whole school cheers as they walk up to accept their trophy. Their hard work and teamwork have really paid off.",
                    "The friends promise to stay teammates forever, no matter what challenges come their way. They realize that school is about more than just books—it's about the people you meet. A perfect end to a great week."
                ],
                12: [
                    "The school year begins with a surprise announcement from the principal. A talent show is being held, and the winner gets a special trophy. Everyone is excited to showcase their unique skills.",
                    "Our hero deciding to perform a magic show with their new best friend. They spend every recess practicing their tricks and making their costumes. Their teamwork is better than ever.",
                    "In science class, they discover a mysterious glowing liquid that can turn paper into beautiful origami birds. The birds fly around the classroom, delighting everyone. They decide to include them in their act.",
                    "A misunderstanding between friends leads to a brief moment of sadness. They talk it out and realize that honesty is the best policy. Their friendship becomes even stronger than before.",
                    "The day of the talent show arrives, and the gym is filled with excited students and parents. Our hero feels a few butterflies, but their friend gives them a encouraging high-five. They're ready!",
                    "Their performance is a huge success, with floating origami birds and a disappearing lunchbox. The audience erupts into thunderous applause. They feel like they're on top of the world.",
                    "They win the talent show and are presented with the Star Trophy by the principal. It's a proud moment for them and their families. Their hard work has finally paid off.",
                    "A new student arrives at school, and our hero is the first one to say hello. They remember how it felt to be new and want to make the new student feel welcome. A new friendship begins.",
                    "They organize a school-wide project to build a community garden in the playground. Everyone joins in to plant flowers and vegetables. The school looks more beautiful than ever before.",
                    "The garden project is a success, and they harvest their first crop of giant strawberries. They share them with the whole school during a special picnic lunch. Success tastes like summer.",
                    "A hidden room is found in the school basement, filled with old books and historical artifacts. They spend their afternoons exploring and learning about the town's history. It's an adventure every day.",
                    "The school year ends with a big celebration and a promise to stay best friends forever. They realize that school is a place of endless possibilities and wonderful memories. They can't wait for next year!"
                ]
            }
        };

        // Try to get vibe-specific template
        const vibeTemplate = (vibe && (templates as any)[vibe]?.[pages]) as string[] | undefined;
        if (vibeTemplate && vibeTemplate.length === pages) return vibeTemplate;

        // Default adventure fallback
        if (pages === 4) {
            return [
                "Our hero begins an unexpected adventure.",
                "They meet friends and face exciting challenges.",
                "Together they discover their true strength.",
                "A happy ending celebrates their journey!"
            ];
        }

        // Generic fallback for other page counts or missing templates
        console.log(`[WorldBuilder] Generating generic fallback for ${pages} pages`);
        return Array(pages).fill(0).map((_, i) => {
            const genericPlots = [
                "Everything starts with a mysterious discovery.",
                "The friends find a clue that leads deeper into the mystery.",
                "An unexpected challenge tests their teamwork.",
                "They find a clever way to overcome the obstacle.",
                "The secret is revealed in a surprising way.",
                "A new friend joins to help them at the last moment.",
                "The mission is almost failed, but they persevere.",
                "Success is achieved through heart and courage.",
                "They celebrate their victory together.",
                "Looking back at how much they've learned.",
                "A final promise is made for the next adventure.",
                "The sun sets on a grand and memorable day."
            ];
            return genericPlots[i % genericPlots.length];
        });
    }

    /**
     * Calculate cost based on page count (updated pricing)
     */
    private calculateCost(totalPages: number): number {
        const costs: Record<number, number> = {
            4: 100,   // Short story
            8: 180,   // Epic tale
            12: 250   // Masterpiece
        };
        return costs[totalPages] || 100;
    }
}

export const worldBuilderService = new WorldBuilderService();
