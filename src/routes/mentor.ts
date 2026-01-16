import { Router } from 'express';
import { databaseService } from '../services/database.js';
import { magicMentorService } from '../services/mentor.js';
import { geminiService } from '../services/gemini.js';
import { MentorStepRequest } from '../types/mentor.js';

const router = Router();
import multer from 'multer';

// Configure Multer for memory storage (same as masterpiece.ts)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/mentor/step
 * Main endpoint to process a drawing step in a creative journey
 */
router.post('/step', upload.single('image'), async (req, res) => {
    try {
        const { userId, step, seriesId } = req.body;

        if (!userId || !step) {
            return res.status(400).json({ success: false, message: 'Missing required fields: userId, step' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Missing image file' });
        }

        const result = await magicMentorService.processStep({
            userId,
            step: parseInt(step),
            seriesId: seriesId === 'undefined' ? undefined : seriesId, // Handle FormData string 'undefined'
            imageFile: req.file // Pass the file object
        });

        res.json(result);
    } catch (error: any) {
        console.error('[Mentor Route] Error processing step:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to process creative step' });
    }
});

/**
 * GET /api/mentor/active/:userId
 * Check if user has an active creative series to resume
 */
router.get('/active/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // databaseService imported at top
        const series = await databaseService.getUserActiveSeries(userId);
        res.json({ success: true, series });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/mentor/history/:userId
 * Get all creative series for a user
 */
router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const history = await databaseService.getUserCreativeHistory(userId);
        res.json({ success: true, history });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/mentor/analyze-improvement
 * Masterpiece Match V2: Compare two images (V1 vs V2) and analyze improvement
 */
router.post('/analyze-improvement', async (req, res) => {
    try {
        const { originalImageBase64, newImageBase64, previousAdvice } = req.body;

        if (!originalImageBase64 || !newImageBase64) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: originalImageBase64, newImageBase64'
            });
        }

        console.log('[Mentor Route] Analyzing improvement between V1 and V2...');

        const improvementReport = await geminiService.analyzeImprovement(
            originalImageBase64,
            newImageBase64,
            previousAdvice || "Try to improve your artwork"
        );

        res.json({
            success: true,
            ...improvementReport
        });
    } catch (error: any) {
        console.error('[Mentor Route] Error analyzing improvement:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to analyze improvement'
        });
    }
});

export default router;
