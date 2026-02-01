import express from 'express';
import { databaseService } from '../services/database.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper to ensure dir exists
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Get User Profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await databaseService.getUserProfile(userId);
    res.json(profile || { points: 0, profileCompleted: false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load user profile' });
  }
});

// Update User Profile (e.g. at startup)
router.post('/:userId/profile', (req, res) => {
  try {
    const { userId } = req.params;
    const data = req.body; // Expects partial UserRecord

    const updated = databaseService.updateUserProfile(userId, data);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Import Legacy History to Child Profile
router.post('/:userId/profiles/:profileId/import', async (req, res) => {
  try {
    const { userId, profileId } = req.params;
    console.log(`[API] Importing history for user ${userId} to profile ${profileId}`);

    const count = await databaseService.transferLegacyHistory(userId, profileId);
    res.json({ success: true, count });
  } catch (error: any) {
    console.error('Import failed:', error);
    res.status(500).json({
      error: error.message || 'Failed to import history',
      details: error.toString()
    });
  }
});

// Upload Avatar
router.post('/:userId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const { userId } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `avatar-${userId}-${Date.now()}${ext}`;

    // Save to client/public/uploads/avatars for persistence
    const publicDir = path.join(process.cwd(), 'client', 'public');
    const uploadDir = path.join(publicDir, 'uploads', 'avatars');
    ensureDir(uploadDir);

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const photoUrl = `/uploads/avatars/${filename}`;

    // Update user profile
    databaseService.updateUserProfile(userId, { photoUrl });

    res.json({ photoUrl });
  } catch (error) {
    console.error('Avatar upload failed:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Get Points History
router.get('/:userId/points-history', (req, res) => {
  try {
    const { userId } = req.params;
    const history = databaseService.getPointsHistory(userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load points history' });
  }
});

export { router };
