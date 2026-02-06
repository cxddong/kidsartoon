import { Router } from 'express';
import { adminStorageService } from '../services/adminStorage.js';
import { databaseService } from '../services/database.js';

export const artclassRouter = Router();

/**
 * POST /api/artclass/save
 * Save artwork created in Art Class (digital drawing or paper capture)
 */
artclassRouter.post('/save', async (req, res) => {
    try {
        const { userId, profileId, imageData, mode, prompt } = req.body;

        // Validation
        if (!userId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        if (!imageData || !imageData.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Valid image data required' });
        }

        if (!mode || (mode !== 'digital' && mode !== 'real')) {
            return res.status(400).json({ error: 'Mode must be "digital" or "real"' });
        }

        console.log(`[ArtClass] Saving ${mode} artwork for user ${userId}...`);

        // Convert base64 to buffer
        const base64Data = imageData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        // Determine art source
        const artSource = mode === 'digital' ? 'digital-drawing' : 'paper-capture';

        // Upload to Firebase Storage
        const folder = mode === 'digital' ? 'artclass/digital' : 'artclass/paper';
        const publicUrl = await adminStorageService.uploadFile(
            buffer,
            'image/jpeg',
            folder
        );

        console.log(`[ArtClass] Uploaded to storage: ${publicUrl}`);

        // Save to database
        const imageRecord = await databaseService.saveImageRecord(
            userId,
            publicUrl,
            'upload', // Type is 'upload' for user-created content
            prompt || `Art Class - ${mode} mode`,
            {
                source: 'art-class',
                mode: mode
            },
            profileId,
            artSource // NEW: Add artwork source
        );

        console.log(`[ArtClass] Saved image record: ${imageRecord.id}`);

        res.json({
            success: true,
            imageRecord: imageRecord
        });

    } catch (error: any) {
        console.error('[ArtClass] Save error:', error);
        res.status(500).json({
            error: 'Failed to save artwork',
            details: error.message
        });
    }
});

export default artclassRouter;
