import { Router } from 'express';
import { databaseService } from '../services/database.js';

export const router = Router();

// GET /api/images/public (Mock public feed)
router.get('/public', async (req, res) => {
    try {
        const type = req.query.type as string | undefined;
        // Map frontend types to DB types if needed, but assuming consistency for now
        // Frontend might send 'image', 'audio', 'animation'
        // DB stores 'generated' (image), 'story' (audio), 'animation' (video), 'comic'

        let dbType = type;
        if (type === 'image') dbType = 'generated';
        if (type === 'audio') dbType = 'story';
        if (type === 'video') dbType = 'animation';

        const images = await databaseService.getPublicImages(dbType);

        // If Firestore returns empty (due to permissions or no data), return mock data
        if (images.length === 0) {
            const mockImages = [
                { id: '1', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: false, prompt: 'Space Adventure' },
                { id: '2', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1577083288073-40892c0860a4?q=80&w=600', type: 'comic', createdAt: new Date().toISOString(), favorite: true, prompt: 'Funny Cat' },
                { id: '3', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600', type: 'generated', createdAt: new Date().toISOString(), favorite: false, prompt: 'Dragon Tale' },
                { id: '4', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1629812456605-4a044aa1d632?q=80&w=600', type: 'animation', createdAt: new Date().toISOString(), favorite: false, prompt: 'Under the Sea' },
                { id: '5', userId: 'mock', imageUrl: 'https://images.unsplash.com/photo-1615184697985-c9bde1b07da7?q=80&w=600', type: 'story', createdAt: new Date().toISOString(), favorite: true, prompt: 'Magical Forest' },
            ];

            // Filter by type if requested
            const filteredMock = dbType ? mockImages.filter(img => img.type === dbType) : mockImages;
            return res.json(filteredMock);
        }

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