// src/services/worldBuilder.ts

import { geminiService } from './gemini.js';
import { doubaoService } from './doubao.js';
import { databaseService } from './database.js';

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

interface GraphicNovelAssets {
    slot1?: Asset;  // Hero/Trickster/Protagonist/Student
    slot2?: Asset;  // Villain/Victim/Magical/Friend
    slot3?: Asset;  // Scene/Place
}

interface GraphicNovelOptions {
    vibe?: 'adventure' | 'funny' | 'fairytale' | 'school';       // NEW
    assets: GraphicNovelAssets;
    totalPages: 4 | 8 | 12;                                      // UPDATED: removed 6, added 12
    layout?: 'standard' | 'dynamic';                             // NEW
    plotHint?: string;
    style?: string;
}

export class WorldBuilderService {
    /**
     * Main entry point: Generate a complete graphic novel
     */
    async createGraphicNovel(
        userId: string,
        options: GraphicNovelOptions
    ): Promise<string> {
        const { assets, totalPages, plotHint, style, vibe, layout } = options;

        console.log(`[WorldBuilder] Starting graphic novel generation for user ${userId}`);
        console.log(`[WorldBuilder] Pages: ${totalPages}, Assets:`, Object.keys(assets));

        try {
            // 1. Generate Master Plot Outline
            console.log('[WorldBuilder] Step 1: Generating plot outline...');
            const plotOutline = await this.generatePlotOutline(assets, totalPages, plotHint, vibe);
            console.log('[WorldBuilder] Plot outline generated:', plotOutline);

            // 2. Create task record for tracking
            const taskId = `gn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await databaseService.saveGraphicNovelTask({
                id: taskId,
                userId,
                type: 'graphic_novel',
                totalPages,
                assets,
                plotOutline,
                status: 'PENDING',
                pagesCompleted: 0,
                pages: [],
                cost: this.calculateCost(totalPages),
                createdAt: new Date(),
                vibe, // Save vibe
                layout // Save layout
            });

            console.log(`[WorldBuilder] Task created: ${taskId}`);

            // 3. Generate pages asynchronously (don't await - runs in background)
            this.generatePagesAsync(taskId, plotOutline, assets, style, layout).catch(err => {
                console.error(`[WorldBuilder] Async generation failed for ${taskId}:`, err);
            });

            return taskId;

        } catch (error) {
            console.error('[WorldBuilder] Error creating graphic novel:', error);
            throw error;
        }
    }

    /**
   * Step 1: Generate overall story outline using AI (vibe-based)
   */
    private async generatePlotOutline(
        assets: GraphicNovelAssets,
        totalPages: number,
        plotHint?: string,
        vibe?: string
    ): Promise<string[]> {
        // Vibe-specific templates
        const vibeTemplates: Record<string, string> = {
            adventure: `Create an exciting ${totalPages}-chapter adventure story where a brave hero battles a dangerous villain to save their world.`,
            funny: `Create a hilarious ${totalPages}-chapter comedy where pranks, mishaps, and silly situations lead to unexpected fun.`,
            fairytale: `Create a magical ${totalPages}-chapter fairy tale full of wonder, enchantment, and happily-ever-after moments.`,
            school: `Create a heartwarming ${totalPages}-chapter school story about friendship, learning, and growing up together.`
        };

        const vibePrefix = vibe && vibeTemplates[vibe] ? vibeTemplates[vibe] : `Create a ${totalPages}-chapter story.`;

        const systemPrompt = `You are a children's storytelling expert. ${vibePrefix}

Structure: ${totalPages === 4 ? '起承转合 (Introduction, Development, Twist, Conclusion)' : totalPages === 8 ? '8-act hero journey' : '12-act epic adventure'}

Characters:
${assets.slot1 ? `- Character 1: ${assets.slot1.description}` : ''}
${assets.slot2 ? `- Character 2: ${assets.slot2.description}` : ''}
${assets.slot3 ? `- Setting: ${assets.slot3.description}` : ''}

Requirements:
1. Each chapter should be 1-2 sentences describing the key events
2. Ensure logical progression and character development
3. Suitable for ages 5-10
4. Exciting but age-appropriate
5. Return EXACTLY ${totalPages} chapters in JSON array format

Output format: ["Chapter 1 description", "Chapter 2 description", ...]`;

        const userPrompt = plotHint
            ? `Story direction: ${plotHint}\n\nGenerate the ${totalPages}-chapter outline.`
            : `Generate an exciting ${totalPages}-chapter adventure story.`;

        try {
            const response = await geminiService.generateText(userPrompt, systemPrompt);

            // Parse JSON response
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);

            if (jsonMatch) {
                const outline = JSON.parse(jsonMatch[0]);
                if (Array.isArray(outline) && outline.length === totalPages) {
                    return outline;
                }
            }

            console.warn('[WorldBuilder] Failed to parse AI outline, using fallback');

        } catch (error) {
            console.error('[WorldBuilder] Error generating plot outline:', error);
        }

        // Fallback: Generate basic outline
        return this.generateFallbackOutline(totalPages);
    }

    /**
     * Step 2: Generate each page as a comic strip
     */
    private async generatePagesAsync(
        taskId: string,
        plotOutline: string[],
        assets: GraphicNovelAssets,
        style?: string,
        layout?: 'standard' | 'dynamic'  // Added layout parameter
    ) {
        const pages = [];
        let lastSuccessfulPage = 0;

        for (let i = 0; i < plotOutline.length; i++) {
            try {
                console.log(`[WorldBuilder] Generating page ${i + 1}/${plotOutline.length}...`);

                // Update task progress
                await databaseService.updateGraphicNovelTask(taskId, {
                    status: 'GENERATING',
                    currentPage: i + 1
                });

                // Generate 4-panel comic for this page
                const pageImage = await this.generateComicPage(
                    plotOutline[i],
                    assets,
                    i + 1,
                    style
                );

                pages.push({
                    pageNumber: i + 1,
                    imageUrl: pageImage,
                    chapterText: plotOutline[i]
                });

                lastSuccessfulPage = i + 1;

                // Save progress after each successful page
                await databaseService.updateGraphicNovelTask(taskId, {
                    pages,
                    pagesCompleted: lastSuccessfulPage
                });

                console.log(`[WorldBuilder] Page ${i + 1} completed and saved`);

            } catch (err) {
                console.error(`[WorldBuilder] Failed to generate page ${i + 1}:`, err);

                // If at least 1 page succeeded, mark as partial success
                if (lastSuccessfulPage > 0) {
                    console.log(`[WorldBuilder] Marking as PARTIAL_SUCCESS with ${lastSuccessfulPage}/${plotOutline.length} pages`);
                    await databaseService.updateGraphicNovelTask(taskId, {
                        status: 'PARTIAL_SUCCESS',
                        error: `Completed ${lastSuccessfulPage}/${plotOutline.length} pages. Error on page ${i + 1}: ${err instanceof Error ? err.message : String(err)}`
                    });
                    return; // Exit gracefully
                }

                // If no pages succeeded, mark as complete failure
                console.error(`[WorldBuilder] Complete failure - no pages generated`);
                await databaseService.updateGraphicNovelTask(taskId, {
                    status: 'FAILED',
                    error: err instanceof Error ? err.message : String(err)
                });
                return; // Exit
            }
        }

        // Mark task as complete
        await databaseService.updateGraphicNovelTask(taskId, {
            status: 'COMPLETED',
            pagesCompleted: plotOutline.length,
            completedAt: new Date()
        });

        console.log(`[WorldBuilder] Graphic novel ${taskId} completed!`);
    }

    /**
     * Step 3: Generate a single comic page (4 panels)
     */
    private async generateComicPage(
        chapterPrompt: string,
        assets: GraphicNovelAssets,
        pageNumber: number,
        style?: string
    ): Promise<string> {
        // Build character context
        let characterContext = '';
        if (assets.slot1) {
            characterContext += `Main character: ${assets.slot1.description}. `;
        }
        if (assets.slot2) {
            characterContext += `Second character: ${assets.slot2.description}. `;
        }
        if (assets.slot3) {
            characterContext += `Setting: ${assets.slot3.description}. `;
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

                    // Get style prompt from the style parameter
                    const stylePrompt = style || 'vibrant comic book style';

                    // Build enhanced prompt with style, character context, and panel descriptions
                    const fullPrompt = `${stylePrompt}. ${characterContext}\n\n4-panel comic strip layout: ${panels.map((p, i) => `Panel ${i + 1}: ${p.sceneDescription}`).join('; ')}.\n\nCRITICAL: Use the described characters and setting consistently across all panels. Comic book style, vibrant colors, clear panel borders.`;

                    const imageUrl = await doubaoService.generateImage(
                        fullPrompt,
                        '2K'
                    );

                    return imageUrl;
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
                return await doubaoService.generateImage(fallbackPrompt, '2K');
            } catch (fallbackError) {
                console.error(`[WorldBuilder] Fallback also failed:`, fallbackError);
                throw new Error(`Failed to generate page ${pageNumber}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    /**
     * Fallback outline generator
     */
    private generateFallbackOutline(pages: number): string[] {
        const templates: Record<number, string[]> = {
            4: [
                "The hero discovers a mysterious challenge in their world.",
                "A powerful villain threatens everything the hero loves.",
                "The hero faces the villain in an epic confrontation.",
                "Good triumphs and peace is restored to the world."
            ],
            6: [
                "The hero lives peacefully in their world.",
                "Strange events signal danger approaching.",
                "The villain reveals their evil plan.",
                "The hero prepares and gathers courage.",
                "An intense battle unfolds between good and evil.",
                "The hero emerges victorious and celebrates."
            ],
            8: [
                "Introduction to the hero's ordinary life.",
                "The call to adventure arrives unexpectedly.",
                "The villain's dark presence is felt.",
                "The hero begins their journey.",
                "Obstacles and challenges test the hero.",
                "The final confrontation approaches.",
                "The climactic battle determines the fate of all.",
                "A new era of peace begins."
            ]
        };

        return templates[pages] || templates[4];
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
