
import express from 'express';
import { databaseService } from '../services/database.js';

const router = express.Router();

// GET /api/checkin/status?userId=...
router.get('/status', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const status = await databaseService.getCheckInStatus(userId as string);
        res.json(status);
    } catch (error) {
        console.error("Check-in Status Error:", error);
        res.status(500).json({ error: 'Failed to get status' });
    }
});

// POST /api/checkin/claim
router.post('/claim', async (req, res) => {
    try {
        const { userId, isVip } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const result = await databaseService.performCheckIn(userId, !!isVip);
        if (!result.success) {
            return res.status(400).json(result);
        }
        res.json(result);
    } catch (error) {
        console.error("Check-in Claim Error:", error);
        res.status(500).json({ error: 'Failed to claim check-in' });
    }
});

export { router };
