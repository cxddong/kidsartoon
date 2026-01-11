
import { Router } from 'express';
import { doubaoService } from '../services/doubao.js';
import { databaseService } from '../services/database.js';
import { pointsService } from '../services/points.js';

export const router = Router();

// Endpoint A: Create Task
import { VideoFactory } from '../services/video/VideoFactory.js';

// ... (imports)

// Endpoint A: Create Task
import sharp from 'sharp';

// ... (imports)

// Endpoint A: Create Task
router.post('/create', async (req, res) => {
    try {
        let { imageUrl, prompt, camera_fixed, userId } = req.body;

        if (!imageUrl || !prompt) {
            return res.status(400).json({ error: 'Missing imageUrl or prompt' });
        }

        // Optimize Image (Resize to prevent 400 Payload Too Large)
        try {
            // Check if it's base64
            if (imageUrl.startsWith('data:image')) {
                const base64Data = imageUrl.split(';base64,').pop();
                const imgBuffer = Buffer.from(base64Data, 'base64');

                const resizedBuffer = await sharp(imgBuffer)
                    .resize(800, 800, { fit: 'inside' }) // 800px is enough for video reference
                    .flatten({ background: '#ffffff' }) // Fix Transparency Black Screen: Convert PNG alpha to white
                    .jpeg({ quality: 80 })
                    .toBuffer();

                imageUrl = `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
                console.log(`[VideoAPI] Resized image. Orig: ${imgBuffer.length}, New: ${resizedBuffer.length}`);
            }
        } catch (imgErr) {
            console.warn('[VideoAPI] Image resize failed, using original', imgErr);
        }

        console.log(`[VideoAPI] Creating task. Fixed=${camera_fixed}`);

        // Optional: Deduct points (e.g. 20 points)
        if (userId) {
            const action = 'generate_video';
            const cost = 80; // Fixed Spec Cost
            const deduction = await pointsService.consumePoints(userId, action, cost);
            if (!deduction.success) {
                return res.status(200).json({ success: false, error: 'Not enough points', required: cost });
            }
        }

        // Call Service via Factory
        const provider = VideoFactory.getProvider();
        const result = await provider.createTask({
            imageUrl,
            prompt,
            cameraFixed: camera_fixed,
            userId
        });

        // Save Task to DB (to track costs/refunds if needed)
        // Note: provider might change, but we store the ID it gave us
        if (userId) {
            await databaseService.saveVideoTask(result.taskId, userId, 80, prompt, { originalImageUrl: imageUrl, provider: result.provider });
        }

        res.json({ id: result.taskId });

    } catch (error: any) {
        console.error('[VideoAPI] Create Failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint B: Check Status
router.get('/status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        // Call Service via Factory
        // Ideally we'd know WHICH provider created this task, but for now we assume global config
        const provider = VideoFactory.getProvider();
        const result = await provider.getTaskStatus(taskId);

        if (result.status === 'SUCCEEDED' && result.videoUrl) {
            // Mark completed in DB
            await databaseService.markTaskCompleted(taskId);

            // CRITICAL FIX: Upload video to permanent storage
            const localTask = await databaseService.getVideoTask(taskId);
            if (localTask && localTask.userId) {
                try {
                    console.log('[VideoAPI] Uploading completed video to permanent storage...');
                    const videoRes = await fetch(result.videoUrl);
                    if (videoRes.ok) {
                        const arrayBuffer = await videoRes.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        const { adminStorageService } = await import('../services/adminStorage.js');
                        const permanentUrl = await adminStorageService.uploadFile(buffer, 'video/mp4', 'videos');
                        result.videoUrl = permanentUrl;

                        // Save to user's history
                        await databaseService.saveImageRecord(
                            localTask.userId,
                            permanentUrl,
                            'animation',
                            localTask.prompt || 'Video',
                            {
                                originalImageUrl: localTask.meta?.originalImageUrl,
                                videoUrl: permanentUrl,
                                taskId
                            }
                        );
                        console.log('[VideoAPI] Video saved to user history:', permanentUrl);
                    }
                } catch (uploadErr) {
                    console.error('[VideoAPI] Failed to upload video to storage:', uploadErr);
                    // Continue with original URL - will expire but at least returns a result
                }
            }
        } else if (result.status === 'FAILED') {
            // Refund if failed
            const localTask = await databaseService.getVideoTask(taskId);
            if (localTask && !localTask.refunded) {
                await pointsService.refundPoints(localTask.userId, 'generate_video', 'failed');
                await databaseService.markTaskRefunded(taskId);
            }
        }

        res.json(result);
    } catch (error: any) {
        console.error('[VideoAPI] Status Check Failed:', error);
        res.status(500).json({ error: error.message });
    }
});
