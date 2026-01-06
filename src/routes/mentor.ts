import { Router } from 'express';
import { magicMentorService } from '../services/mentor';
import { MentorStepRequest } from '../types/mentor';

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
        const { databaseService } = require('../services/database');
        const series = await databaseService.getUserActiveSeries(userId);
        res.json({ success: true, series });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
