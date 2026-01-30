import { Router } from 'express';
import { openAIService } from '../services/openai.js';
import { contentService } from '../services/contentService.js';
import { pointsService } from '../services/points.js';
import { databaseService } from '../services/database.js';
import { doubaoService } from '../services/doubao.js';
import { adminStorageService } from '../services/adminStorage.js';


export const magicRouter = Router();

magicRouter.post('/analyze', async (req, res) => {
    try {
        const { imageBase64, userId } = req.body;
        const COST = 25;

        if (!imageBase64) return res.status(400).json({ error: 'Image required' });

        // 1. Transaction: Consume Points first
        if (userId && userId !== 'demo') {
            const pointResult = await pointsService.consumePoints(userId, 'magic_mirror_scan', COST);
            if (!pointResult.success) {
                return res.status(403).json({ error: 'Not enough magic points! Need 25 pts.' });
            }
        }

        // 2. Analyze with OpenAI
        const analysis = await openAIService.analyzeImageContext(imageBase64);

        // 2. Find Rich Content Matches
        const contentMatches = await contentService.findMatchingContent(analysis.contentKeywords || []);

        // 3. Generate a "Magic Story Scroll" for the child
        const storyPrompt = `Write a 2-3 sentence magical story for a child about this drawing: ${analysis.contentKeywords?.join(', ')}. 
        Return a JSON object: { "story": "Your beautiful story text here..." }
        Keep it whimsical and encouraging! End with a wish.`;
        const storyResult = await openAIService.generateJSON(storyPrompt, "You are a mystical magic mirror storyteller.");
        const magicStory = storyResult.story || "A magical aura surrounds this drawing...";

        // 4. Combine Results
        res.json({
            ...analysis,
            magicStory,
            richContent: contentMatches,
            pointsBalance: userId && userId !== 'demo' ? (await databaseService.getUserProfile(userId))?.points : undefined
        });

    } catch (error: any) {
        console.error('Magic Mirror Error:', error);
        res.status(500).json({ error: error.message });
    }
});

magicRouter.post('/colorize', async (req, res) => {
    const { userId, imageBase64, suggestion } = req.body;
    const COST = 25; // Standardized to 25

    if (!userId || !imageBase64) return res.status(400).json({ error: 'Missing requirements' });

    try {
        // 1. Transaction: Consume Points first using new action
        const pointResult = await pointsService.consumePoints(userId, 'magic_mirror_colorize', COST);
        if (!pointResult.success) {
            return res.status(403).json({ error: 'Not enough magic points! Need 25 pts.' });
        }

        // 2. Upload to Storage (Doubao needs URL)
        const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const storageUrl = await adminStorageService.uploadFile(buffer, 'image/png', `magic-sketches/${userId}`);

        // 3. Generate with Doubao (Image-to-Image)
        const prompt = `Colorize this children's sketch. ${suggestion || 'Make it vibrant and magical'}. 
        CRITICAL: Maintain the exact lines and shapes of the original drawing. 
        Just fill it with high-quality, professional colors. 
        Style: Disney/Pixar concept art, warm lighting, 8k resolution.`;

        // 0.6 strength means "keep 60% of original structure", good for coloring
        const coloredImageUrl = await doubaoService.generateImageFromImage(prompt, storageUrl, '2K', undefined, 0.6);

        // Save to History (Generated Art)
        await databaseService.saveImageRecord(
            userId,
            coloredImageUrl,
            'generated',
            prompt
        );

        res.json({
            success: true,
            imageUrl: coloredImageUrl,
            pointsBalance: pointResult.after
        });

    } catch (error: any) {
        console.error("Magic Colorize Failed:", error);

        // Auto-Refund on failure
        await pointsService.refundPoints(userId, 'magic_mirror_colorize', 'Generation Failed');

        res.status(500).json({ error: error.message || "Magic spell failed!" });
    }
});

magicRouter.post('/speak', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text required' });

        const audioBuffer = await openAIService.generateSpeech(text);
        res.set('Content-Type', 'audio/mpeg');
        res.send(audioBuffer);
    } catch (error: any) {
        console.error('Magic Speak Error:', error);
        res.status(500).json({ error: error.message });
    }
});
