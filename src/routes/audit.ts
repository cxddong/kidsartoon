
import { Router } from 'express';
import { auditService } from '../services/auditService.js';
import { databaseService } from '../services/database.js';

export const auditRouter = Router();

// 1. Analyze Portfolio (POST)
auditRouter.post('/analyze', async (req, res) => {
    try {
        const { userId, imageIds, childName } = req.body;

        if (!userId || !imageIds || !Array.isArray(imageIds)) {
            return res.status(400).json({ error: 'Missing userId or imageIds array' });
        }

        const report = await auditService.analyzePortfolio(userId, imageIds, childName);
        res.json({ success: true, report });

    } catch (error: any) {
        console.error('[AuditRouter] Analysis failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Get Single Report (GET)
auditRouter.get('/report/:id', async (req, res) => {
    try {
        const report = await databaseService.getPortfolioReport(req.params.id);
        if (!report) return res.status(404).json({ error: 'Report not found' });
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 3. List Reports for user (GET)
auditRouter.get('/list/:userId', async (req, res) => {
    try {
        const reports = await databaseService.getUserPortfolioReports(req.params.userId);
        res.json(reports);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

// 4. Real Upload for Audit (POST)
auditRouter.post('/upload', upload.array('images', 50), async (req, res) => {
    try {
        const { userId } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!userId || !files || files.length === 0) {
            return res.status(400).json({ error: 'Missing userId or images' });
        }

        const imageIds: string[] = [];

        // Upload each file and save to database
        for (const file of files) {
            const imageUrl = await databaseService.uploadFile(file.buffer, file.mimetype, `portfolio/${userId}`);
            const imageRecord = await databaseService.saveImageRecord(
                userId,
                imageUrl,
                'upload',
                '', // prompt
                { source: 'portfolio_scanner' }
            );
            imageIds.push(imageRecord.id);
        }

        res.json({ success: true, imageIds });
    } catch (error: any) {
        console.error('[AuditRouter] Upload failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// 5. List user images (GET)
auditRouter.get('/user-images/:userId', async (req, res) => {
    try {
        const images = await databaseService.getUserImages(req.params.userId);
        res.json(images);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 6. Mock Upload for Demo (DEPRECATED but kept for fallback)
auditRouter.post('/mock-upload', async (req, res) => {
    // ... (rest of mock-upload)
});
