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

        // Return valid images (or empty array)
        res.json(images);

        res.json(images);
    } catch (error) {
        console.error("Public Images Error:", error);
        res.status(500).json({ error: 'Failed to load public images' });
    }
});

// GET /api/images/proxy?url=...
router.get('/proxy', async (req, res) => {
    try {
        const imageUrl = req.query.url as string;
        if (!imageUrl) {
            return res.status(400).json({ error: 'url query parameter is required' });
        }

        console.log(`[Proxy] Fetching: ${imageUrl}`);

        const response = await fetch(imageUrl);
        if (!response.ok) {
            console.error(`[Proxy] Failed to fetch image: ${response.status} ${response.statusText}`);
            return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        // Add aggressive caching for proxied images
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        // Convert Response to Buffer for sending
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));

    } catch (error) {
        console.error("[Proxy] Error:", error);
        res.status(500).json({ error: 'Internal proxy error' });
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

        console.log(`[API] DELETE Request for image ${id} from user ${userId}`);

        if (!userId) {
            console.warn('[API] DELETE failed: Missing userId');
            return res.status(400).json({ error: 'userId required' });
        }

        const success = await databaseService.deleteImage(id, userId as string);
        console.log(`[API] DELETE Success: ${success}`);

        if (success) {
            res.json({ success: true });
        } else {
            console.warn(`[API] DELETE failed: Image not found or ownership mismatch. ID: ${id}, User: ${userId}`);
            res.status(404).json({ error: 'Image not found' });
        }
    } catch (error) {
        console.error("Delete Image Error:", error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});