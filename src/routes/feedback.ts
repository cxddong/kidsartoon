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

/**
 * POST /api/feedback/user-feedback
 * Body: { userId: string, rating: number, comment?: string }
 */
router.post('/user-feedback', async (req, res) => {
    try {
        const { userId, rating, comment } = req.body;

        if (!userId || !rating) {
            return res.status(400).json({ error: "Missing userId or rating" });
        }

        const id = await databaseService.saveUserFeedback(userId, rating, comment);
        res.json({ success: true, id });

    } catch (error: any) {
        console.error("User Feedback Route Error:", error);
        res.status(500).json({ error: "Failed to save user feedback", details: error.message });
    }
});
/**
 * GET /api/feedback/all
 * Returns all user feedback (Admin only in theory)
 */
router.get('/all', async (req, res) => {
    try {
        const feedback = await databaseService.getAllUserFeedback();
        res.json(feedback);
    } catch (error: any) {
        console.error("Get All Feedback Error:", error);
        res.status(500).json({ error: "Failed to fetch feedback", details: error.message });
    }
});
