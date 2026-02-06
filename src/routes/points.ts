import { Router } from 'express';
import { pointsService, POINTS_COSTS } from '../services/points.js';

export const router = Router();

// GET /api/points/balance
router.get('/balance', async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const points = await pointsService.getBalance(userId);
    res.json({ success: true, points });
});

// POST /api/points/consume
// Strictly according to spec
router.post('/consume', async (req, res) => {
    const { userId, action } = req.body;
    if (!userId || !action) return res.status(400).json({ error: 'userId and action required' });

    const requiredPoints = POINTS_COSTS[action];
    if (!requiredPoints) return res.status(400).json({ error: 'Invalid action' });

    const result = await pointsService.consumePoints(userId, action);

    if (result.success) {
        res.json({
            success: true,
            beforePoints: result.before,
            afterPoints: result.after
        });
    } else if (result.error === 'NOT_ENOUGH_POINTS') {
        const current = await pointsService.getBalance(userId);
        res.status(200).json({ // Returning 200 as per spec example JSON? Or 402? Spec example implies JSON body response.
            success: false,
            errorCode: "NOT_ENOUGH_POINTS",
            required: requiredPoints,
            current: current
        });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
});

// POST /api/points/deduct
// Flexible deduction endpoint (accepts custom amount)
router.post('/deduct', async (req, res) => {
    const { userId, amount, reason } = req.body;
    if (!userId || !amount) return res.status(400).json({ success: false, error: 'userId and amount required' });

    try {
        // Use consumePoints with costOverride
        const result = await pointsService.consumePoints(userId, reason || 'custom_deduction', amount);

        if (result.success) {
            res.json({
                success: true,
                newBalance: result.after,
                deducted: amount,
                before: result.before,
                after: result.after
            });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error: any) {
        console.error('[Points] Deduct error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/points/refund
router.post('/refund', async (req, res) => {
    const { userId, action, reason } = req.body;
    if (!userId || !action) return res.status(400).json({ error: 'Missing params' });

    const result = await pointsService.refundPoints(userId, action, reason || 'manual_refund');
    res.json(result);
});

// POST /api/points/redeem
router.post('/redeem', async (req, res) => {
    const { userId, code } = req.body;
    if (!userId || !code) return res.status(400).json({ error: 'Missing code' });

    const result = await pointsService.redeemCode(userId, code);
    if (result.success) {
        res.json({ success: true, pointsAdded: result.pointsAdded });
    } else {
        res.status(200).json({ success: false, error: result.error }); // Return 200 for logic errors (flow control)
    }
});

// GET /api/points/logs
router.get('/logs', async (req, res) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const logs = await pointsService.getLogs(userId);
    res.json({ logs });
});

// GET /api/points/costs - Helper for frontend to know costs
router.get('/costs', (req, res) => {
    res.json(POINTS_COSTS);
});
