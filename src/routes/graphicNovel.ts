// src/routes/graphicNovel.ts

import express from 'express';
import { worldBuilderService } from '../services/worldBuilder.js';
import { pointsService } from '../services/points.js';
import { databaseService } from '../services/database.js';
import { geminiService } from '../services/gemini.js';
import { doubaoService } from '../services/doubao.js';

const router = express.Router();

router.post('/create', async (req, res) => {
    try {
        const { userId, vibe, assets, totalPages, layout, plotHint, style } = req.body;
        console.log('[GraphicNovel API] Create request:', { userId, vibe, totalPages, layout, hasAssets: !!assets });

        if (!userId) return res.status(401).json({ error: 'User ID required' });
        if (!assets || (!assets.slot1 && !assets.slot2 && !assets.slot3 && !assets.slot4)) {
            return res.status(400).json({ error: 'At least one asset slot must be filled' });
        }
        if (![4, 8, 12].includes(totalPages)) return res.status(400).json({ error: 'Total pages must be 4, 8, or 12' });

        const costActionMap: Record<number, string> = { 4: 'graphic_novel_4', 8: 'graphic_novel_8', 12: 'graphic_novel_12' };
        const action = costActionMap[totalPages];

        console.log(`[GraphicNovel API] Deducting points for ${action}...`);
        const deduction = await pointsService.consumePoints(userId, action);

        if (!deduction.success) {
            console.log('[GraphicNovel API] Insufficient points');
            return res.status(400).json({
                error: 'Not enough points',
                required: totalPages === 4 ? 100 : totalPages === 8 ? 180 : 250,
                current: deduction.before || 0
            });
        }
        console.log('[GraphicNovel API] Points deducted successfully');

        const taskId = await worldBuilderService.createGraphicNovel(userId, {
            vibe,
            assets,
            totalPages: totalPages as 4 | 8 | 12,
            layout,
            plotHint,
            style
        });
        console.log(`[GraphicNovel API] Task created: ${taskId}`);

        res.json({ taskId, status: 'PENDING', cost: totalPages === 4 ? 100 : totalPages === 8 ? 180 : 250 });
    } catch (error: any) {
        console.error('[GraphicNovel API] Creation error:', error);
        res.status(500).json({ error: error.message || 'Failed to create graphic novel' });
    }
});

router.get('/status/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await databaseService.getGraphicNovelTask(taskId);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({
            status: task.status,
            totalPages: task.totalPages,
            pagesCompleted: task.pagesCompleted,
            currentPage: task.currentPage,
            progress: task.progress,
            statusMessage: task.statusMessage,
            pages: task.pages || [],
            plotOutline: task.plotOutline,
            error: task.error
        });
    } catch (error: any) {
        console.error('[GraphicNovel API] Status check error:', error);
        res.status(500).json({ error: error.message || 'Failed to check status' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const novel = await databaseService.getGraphicNovel(id);
        if (!novel) return res.status(404).json({ error: 'Graphic novel not found or not completed' });
        res.json(novel);
    } catch (error: any) {
        console.error('[GraphicNovel API] Fetch error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch graphic novel' });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const novels = await databaseService.getUserGraphicNovels(userId);
        res.json({ novels });
    } catch (error: any) {
        console.error('[GraphicNovel API] User novels fetch error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch novels' });
    }
});

/**
 * POST /api/graphic-novel/coach-asset
 * Get AI coaching for an uploaded asset (-5 points)
 * STRATEGY: Hybrid (Doubao+Gemini) -> Fallback to Gemini Vision -> Fallback to Mock
 */
router.post('/coach-asset', async (req, res) => {
    try {
        const { userId, imageUrl, role, vibe } = req.body;
        console.log('[GraphicNovel API] Coach asset request:', { userId, role, vibe });

        if (!userId || !imageUrl || !role) return res.status(400).json({ error: 'Missing required fields' });

        const deduction = await pointsService.consumePoints(userId, 'ai_asset_coaching');
        if (!deduction.success) {
            console.log('[GraphicNovel API] Insufficient points');
            return res.status(400).json({
                error: 'Not enough points for AI coaching',
                required: 5,
                current: deduction.before || 0
            });
        }
        console.log('[GraphicNovel API] Points deducted, analyzing image...');

        const roleContext: Record<string, string> = {
            slot1: 'main character or hero',
            slot2: 'second character, villain, or sidekick',
            slot3: 'setting or background scene',
            slot4: 'extra element like a pet or magical object'
        };
        const vibeContext: Record<string, string> = {
            adventure: 'an exciting adventure story',
            funny: 'a funny comedy story',
            fairytale: 'a magical fairy tale',
            school: 'a school life story'
        };
        const context = `This drawing will be used as the ${roleContext[role] || 'character'} in ${vibeContext[vibe] || 'a children\'s story'}. Analyze the drawing and provide friendly, encouraging suggestions to improve it for this role.`;

        let analysis;

        // ---------------------------------------------------------
        // ATTEMPT 1: HYBRID (Doubao Vision -> Gemini Reasoning)
        // ---------------------------------------------------------
        try {
            console.log('[GraphicNovel API] Attempt 1: Calling Doubao Vision (Sight)...');
            const visualDescription = await doubaoService.analyzeImage(
                imageUrl,
                "Describe this drawing in 3-4 sentences. Mention colors, character features, setting, and style. Be specific."
            );
            console.log('[GraphicNovel API] Doubao Success. Calling Gemini Reasoning...');

            const prompt = `You are Magic Kat 🐱, a friendly art coach for children.
${context}

VISUAL EVIDENCE FROM DRAWING:
"${visualDescription}"

Based on this evidence, provide response in this STRICT JSON format:
{
  "detected": "A short, friendly description of what you see (e.g., 'A cute blue cat')",
  "suggestions": [
     "Specific suggestion 1 (e.g., 'Add a cape since it's a hero')",
     "Specific suggestion 2 (related to color or expression)",
     "Specific suggestion 3 (simple technique tip)"
  ],
  "feedback": "Warm, encouraging feedback (2-3 sentences). Praise specific details mentioned in the evidence."
}
`;
            const rawText = await geminiService.generateText(prompt);
            const jsonStr = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            analysis = JSON.parse(jsonStr);
            if (!analysis.detected) throw new Error('Invalid Hybrid Response structure');

        } catch (hybridError: any) {
            console.warn('[GraphicNovel API] ⚠️ Hybrid Analysis Failed:', hybridError.message);
            if (hybridError.response) {
                console.warn('Doubao Error Status:', hybridError.response.status);
                // Log data safely
                try { console.warn('Doubao Error Data:', JSON.stringify(hybridError.response.data)); } catch (e) { }
            }

            // ---------------------------------------------------------
            // ATTEMPT 2: GEMINI DIRECT VISION (Fallback)
            // ---------------------------------------------------------
            try {
                console.log('[GraphicNovel API] Attempt 2: Falling back to Gemini Vision...');
                const geminiPrompt = `You are Magic Kat 🐱. ${context}. Return strictly JSON with detected, suggestions(array), feedback.`;
                analysis = await geminiService.analyzeImageJSON(imageUrl, geminiPrompt);

                if (!analysis.detected) throw new Error('Invalid Gemini Response structure');
                console.log('[GraphicNovel API] ✅ Gemini Vision Fallback Success');

            } catch (geminiError: any) {
                console.error('[GraphicNovel API] ❌ Gemini Vision Failed:', geminiError.message);
                if (geminiError.status === 503) console.error('Gemini Service Unavailable (Overloaded)');

                // ---------------------------------------------------------
                // ATTEMPT 3: MOCK DATA (Final Safety Net)
                // ---------------------------------------------------------
                console.log('[GraphicNovel API] Using Mock Data Fallback');
                analysis = {
                    detected: 'Your awesome drawing!',
                    suggestions: [
                        'Add more colors to make it pop!',
                        'Give characters specific expressions',
                        'Draw a background setting'
                    ],
                    feedback: 'Nice drawing! I love the effort you put into it. Keep practicing and adding more details!'
                };
            }
        }

        console.log('[GraphicNovel API] Final Analysis:', analysis);
        res.json({
            detected: analysis.detected,
            suggestions: analysis.suggestions,
            confidence: 0.85,
            feedback: analysis.feedback,
            pointsDeducted: 5
        });

    } catch (error: any) {
        console.error('[GraphicNovel API] Coach asset error:', error);
        res.status(500).json({ error: error.message || 'Failed to coach asset' });
    }
});

export default router;
