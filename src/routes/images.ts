import { Router } from 'express';
import { databaseService } from '../services/database.js';

export const router = Router();

// GET /api/images/public (Mock public feed)
router.get('/public', async (req, res) => {
    try {
        const images = await databaseService.getPublicImages();
        res.json(images);
    } catch (error) {
        console.error("Public Images Error:", error);
        res.status(500).json({ error: 'Failed to load public images' });
    }
});

// GET /api/images/:userId
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const images = await databaseService.getUserImages(userId);
        res.json(images);
    } catch (error) {
        console.error("User Images Error:", error);
        res.status(500).json({ error: 'Failed to load user images' });
    }
});

// POST /api/images/:id/toggle-favorite
router.post('/:id/toggle-favorite', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const updated = await databaseService.toggleFavorite(id, userId);
        if (updated) {
            res.json(updated);
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error("Toggle Favorite Error:", error);
        res.status(500).json({ error: 'Failed to toggle favorite' });
    }
});

// DELETE /api/images/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.query; // Pass userId as query param for delete security check
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const success = await databaseService.deleteImage(id, userId as string);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error("Delete Image Error:", error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});