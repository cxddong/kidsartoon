import express from 'express';
import { adminDb as db } from '../services/firebaseAdmin.js';

const router = express.Router();

// POST /api/profile/add-artwork
// Save generated artwork to user's public profile
router.post('/add-artwork', async (req, res) => {
    try {
        const { userId, imageUrl, contentType, mode, isPrivate, metadata } = req.body;

        if (!userId || !imageUrl || !contentType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, imageUrl, contentType'
            });
        }

        console.log(`[Profile] Saving artwork for user ${userId}, type: ${contentType}`);

        // Save to user's public artwork collection
        const artworkData = {
            userId,
            imageUrl,
            contentType,
            mode: mode || null,
            isPrivate: isPrivate ?? false,
            metadata: metadata || {},
            createdAt: new Date().toISOString(),
            likes: 0,
            views: 0
        };

        const docRef = await db.collection('users')
            .doc(userId)
            .collection('artworks')
            .add(artworkData);

        console.log(`[Profile] ✅ Artwork saved with ID: ${docRef.id}`);

        res.json({
            success: true,
            artworkId: docRef.id,
            message: 'Artwork saved to your studio!'
        });

    } catch (error: any) {
        console.error('[Profile] ❌ Error saving artwork:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to save artwork'
        });
    }
});

export default router;
