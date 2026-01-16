import express from 'express';
import { referralService } from '../services/referral.js';

const router = express.Router();

// Generate Codes (Admin/Dev)
router.post('/generate', async (req, res) => {
    try {
        const { value, quantity, userId } = req.body;

        // Basic validation
        if (!value || ![500, 1000, 2000].includes(Number(value))) {
            return res.status(400).json({ error: "Invalid value. Must be 500, 1000, or 2000." });
        }

        const codes = await referralService.generateCodes(Number(value), Number(quantity) || 1, userId || 'admin');
        res.json({ success: true, codes });
    } catch (error: any) {
        console.error("Generate Code Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Redeem Code (User)
router.post('/redeem', async (req, res) => {
    try {
        const { code, userId } = req.body;

        if (!code || !userId) {
            return res.status(400).json({ error: "Code and User ID required" });
        }

        const result = await referralService.redeemCode(code.trim().toUpperCase(), userId);

        if (result.success) {
            res.json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error: any) {
        console.error("Redeem Code Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check Code (Validation Only)
router.post('/check', async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ valid: false, message: "Code required" });

        const result = await referralService.checkCode(code.trim().toUpperCase());
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ valid: false, message: error.message });
    }
});

export default router;
