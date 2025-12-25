import express from 'express';
import { evaluateArtwork } from '../services/qwenService.js';

export const router = express.Router();

/**
 * POST /api/feedback/evaluate
 * Body: { imageUrl: string, prompt?: string }
 */
import { databaseService } from '../services/database.js';

/**
 * POST /api/feedback/evaluate
 * Body: { imageUrl: string, prompt?: string, imageId?: string }
 */
router.post('/evaluate', async (req, res) => {
    try {
        const { imageUrl, prompt, imageId } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: "Missing imageUrl" });
        }

        console.log(`[Feedback] Evaluating artwork... (Length: ${imageUrl.length})`);

        // Call Qwen Service
        const result = await evaluateArtwork(imageUrl, prompt);

        // Save to DB if imageId provided
        if (imageId) {
            await databaseService.saveFeedback(imageId, result.text);
        }

        res.json(result);

    } catch (error: any) {
        console.error("Feedback Route Error:", error);
        res.status(500).json({ error: "Failed to evaluate artwork", details: error.message });
    }
});
