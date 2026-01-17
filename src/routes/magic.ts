import { Router } from 'express';
import { openAIService } from '../services/openai.js';
import { contentService } from '../services/contentService';
import { pointsService } from '../services/points';
import { databaseService } from '../services/database';
import { doubaoService } from '../services/doubao';


export const magicRouter = Router();

magicRouter.post('/analyze', async (req, res) => {
    try {
        const { imageBase64, userId } = req.body;

        if (!imageBase64) return res.status(400).json({ error: 'Image required' });

        // 1. Analyze with OpenAI
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
            richContent: contentMatches
        });

    } catch (error: any) {
        console.error('Magic Mirror Error:', error);
        res.status(500).json({ error: error.message });
    }
});

magicRouter.post('/colorize', async (req, res) => {
    const { userId, imageBase64, suggestion } = req.body;
    const COST = 50;

    if (!userId || !imageBase64) return res.status(400).json({ error: 'Missing requirements' });

    try {
        // 1. Transaction: Consume Points first
        const pointResult = await pointsService.consumePoints(userId, 'colorize_sketch', COST);
        if (!pointResult.success) {
            return res.status(403).json({ error: 'Not enough points! Need 50 pts.' });
        }

        // 2. Upload to Storage (Doubao needs URL)
        const buffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        const storageUrl = await databaseService.uploadFile(buffer, 'image/png', `magic-sketches/${userId}/${Date.now()}.png`);

        // 3. Generate with Doubao (Image-to-Image)
        // Prompt Engineering: Emphasize coloring while keeping structure
        const prompt = `Colorize this children's sketch. ${suggestion || 'Make it vibrant and magical'}. 
        CRITICAL: Maintain the exact lines and shapes of the original drawing. 
        Just fill it with high-quality, professional colors. 
        Style: Disney/Pixar concept art, warm lighting, 8k resolution.`;

        // 0.6 strength means "keep 60% of original structure", good for coloring
        // Note: Using 0.6 image_weight to balance structure vs color
        const coloredImageUrl = await doubaoService.generateImageFromImage(prompt, storageUrl, '2K', undefined, 0.6);

        // Save to History (Magic Art)
        await databaseService.saveImageRecord(
            userId,
            coloredImageUrl,
            'generated', // Magic Art
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
        await pointsService.refundPoints(userId, 'colorize_sketch', 'Generation Failed');

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
