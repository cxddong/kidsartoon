import { Router } from 'express';
import * as bcrypt from 'bcrypt';
import { adminDb } from '../services/firebaseAdmin.js';

const router = Router();

// POST /api/parent-code/set
// Set or update parent code
router.post('/set', async (req, res) => {
    const { userId, code } = req.body;

    if (!userId || !code) {
        return res.status(400).json({ success: false, error: 'userId and code required' });
    }

    // Validate code format (4 digits)
    if (!/^\d{4}$/.test(code)) {
        return res.status(400).json({ success: false, error: 'Code must be 4 digits' });
    }

    try {
        // Hash the code
        const hashedCode = await bcrypt.hash(code, 10);

        // Store in user document
        await adminDb.collection('users').doc(userId).update({
            parentCode: hashedCode,
            parentCodeSet: true
        });

        res.json({ success: true, codeSet: true });
    } catch (error: any) {
        console.error('[ParentCode] Set error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/parent-code/validate
// Validate parent code
router.post('/validate', async (req, res) => {
    const { userId, code } = req.body;

    if (!userId || !code) {
        return res.status(400).json({ valid: false, error: 'userId and code required' });
    }

    try {
        const userDoc = await adminDb.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ valid: false, error: 'User not found' });
        }

        const userData = userDoc.data();
        const storedHash = userData?.parentCode;

        if (!storedHash) {
            return res.json({ valid: false, error: 'No parent code set' });
        }

        // Compare with bcrypt
        const isValid = await bcrypt.compare(code, storedHash);
        res.json({ valid: isValid });
    } catch (error: any) {
        console.error('[ParentCode] Validate error:', error);
        res.status(500).json({ valid: false, error: error.message });
    }
});

// GET /api/parent-code/check-status
// Check if user has parent code set
router.get('/check-status', async (req, res) => {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ hasCode: false, error: 'userId required' });
    }

    try {
        const userDoc = await adminDb.collection('users').doc(userId as string).get();

        if (!userDoc.exists) {
            return res.json({ hasCode: false });
        }

        const userData = userDoc.data();
        const hasCode = !!userData?.parentCodeSet;

        res.json({ hasCode });
    } catch (error: any) {
        console.error('[ParentCode] Check status error:', error);
        res.status(500).json({ hasCode: false, error: error.message });
    }
});

// POST /api/parent-code/remove
// Remove parent code (requires current code verification)
router.post('/remove', async (req, res) => {
    const { userId, currentCode } = req.body;

    if (!userId || !currentCode) {
        return res.status(400).json({ success: false, error: 'userId and currentCode required' });
    }

    try {
        const userDoc = await adminDb.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const userData = userDoc.data();
        const storedHash = userData?.parentCode;

        if (!storedHash) {
            return res.json({ success: false, error: 'No parent code set' });
        }

        // Verify current code
        const isValid = await bcrypt.compare(currentCode, storedHash);
        if (!isValid) {
            return res.json({ success: false, error: 'Invalid current code' });
        }

        // Remove parent code
        await adminDb.collection('users').doc(userId).update({
            parentCode: null,
            parentCodeSet: false
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[ParentCode] Remove error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
