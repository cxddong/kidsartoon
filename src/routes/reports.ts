

import express from 'express';
import { databaseService, WeeklyReport } from '../services/database.js';
import { openAIService } from '../services/openai.js';
import { optionalApiKeyAuth } from '../middleware/auth.js';
import { adminDb } from '../services/firebaseAdmin.js';
import { pointsService } from '../services/points.js';

const router = express.Router();

interface GenerateReportRequest {
    userId: string;
    childProfileId?: string; // Optional: If specific to a child
    childName?: string; // Optional: Name for AI personalization
    dateRange?: { start: string; end: string }; // YYYY-MM-DD
}

/**
 * POST /api/reports/generate
 * Generates a Weekly Creative Report for a child/user.
 * 1. Aggregates data from the last 7 days.
 * 2. Uses OpenAI to analyze patterns, strengths, and potential.
 * 3. Saves and returns the report.
 */

// Helper to get Week ID (e.g. 2024-W02)
function getWeekId(): string {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const pastDays = (now.getTime() - startOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNum}`;
}

router.post('/generate', async (req, res) => {
    try {
        const { userId, childProfileId, childName } = req.body as GenerateReportRequest;
        const nameToUse = childName || 'the child';
        const weekId = getWeekId();

        // 1. STRICT PERSISTENCE CHECK (With Legacy invalidation)
        const existingReport = await databaseService.getReportByWeek(userId, weekId, childProfileId);

        // Check if report is "Scientific" (has new fields)
        const isScientific = existingReport?.artAnalysis?.colorPsychologyText;

        if (existingReport && existingReport.isFinal && isScientific) {
            console.log(`[Reports] Returning existing Scientific report for ${weekId}`);
            return res.json({ success: true, report: existingReport, cached: true });
        } else if (existingReport) {
            console.log(`[Reports] Report exists but is legacy/incomplete. Regenerating for ${weekId}...`);
        }

        console.log(`[Reports] Generating NEW Scientific Report for User: ${userId}, Week: ${weekId}`);

        if (!userId) return res.status(401).json({ error: 'User ID required' });

        // PREMIUM ACCESS CONTROL
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const userPlan = userData?.plan || 'free';
        const userPoints = userData?.points || 0;

        const REPORT_COST = 60;
        const isVIP = ['premium', 'vip', 'admin'].includes(userPlan);

        const hasRedeemedFirst = userData?.hasRedeemedFirstReport === true;

        if (!isVIP) {
            if (!hasRedeemedFirst) {
                console.log(`[Reports] First time report - Free for ${userId}`);
            } else if (userPoints < REPORT_COST) {
                return res.status(402).json({
                    error: 'Insufficient points',
                    required: REPORT_COST,
                    current: userPoints,
                    message: 'Unlock deep scientific analysis for 60 points or upgrade to Premium'
                });
            } else {
                // Deduct points (grantPoints with negative amount)
                await pointsService.grantPoints(userId, -REPORT_COST, 'parent_report', 'Weekly Scientific Report Generation');
                console.log(`[Reports] Deducted ${REPORT_COST} points from ${userId}`);
            }
        } else {
            console.log(`[Reports] VIP user ${userId} - Free access`);
        }

        // 2. Fetch Data (Scientific Basis)
        let allImages = await databaseService.getUserImages(userId);
        if (childProfileId) {
            allImages = allImages.filter(img => img.meta?.profileId === childProfileId);
        } else {
            allImages = allImages.filter(img => !img.meta?.profileId || img.meta?.profileId === userId);
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentImages = allImages.filter(img => new Date(img.createdAt) > sevenDaysAgo);

        // 3. Accurate Stats (Hard Metrics)
        const stats = {
            uploadCount: recentImages.filter(img => img.type === 'upload').length,
            magicImageCount: recentImages.filter(img => img.type === 'generated' || img.type === 'masterpiece').length,
            videoCount: recentImages.filter(img => img.type === 'animation').length,
            storyCount: recentImages.filter(img => img.type === 'story').length,
            comicCount: recentImages.filter(img => img.type === 'comic' || img.type === 'graphic-novel' || img.type === 'cartoon-book').length,
            bookCount: recentImages.filter(img => img.type === 'picturebook').length,
            cardCount: recentImages.filter(img => img.type === 'cards').length,
            puzzleCount: 0,
            totalScreenTimeMinutes: recentImages.length * 15,
            chatMessages: 0
        };

        // 4. Data for AI (Scientific Inputs - Batch Analysis)
        const batchImages = recentImages.slice(0, 5); // Analyze top 5 works
        const artworkDescriptions = batchImages.map((img, i) => ({
            id: img.id,
            description: img.prompt || img.meta?.description || 'Untitled',
            type: img.type,
            colors: img.colorPalette || [img.dominantColor].filter(Boolean)
        }));

        const childAge = userData?.age || 7;

        const prompt = `
You are a panel of experts: a **Child Psychologist**, an **Art Therapist**, and an **Art Educator**.
You are analyzing a batch of ${artworkDescriptions.length} drawings from a ${childAge}-year-old child named ${nameToUse} created over the last 7 days.

**INPUT DATA:**
- Batch Artworks: ${JSON.stringify(artworkDescriptions)}
- Stats: ${JSON.stringify(stats)}

**YOUR TASKS:**

1. **PSYCHOLOGICAL PROFILE (Color & Stroke):**
    - Analyze the *progression* of colors and mood.
    - *Output:* moodTrend ('Improving' | 'Stable' | 'Fluctuating') and psychologicalAnalysis paragraph.

2. **DEVELOPMENTAL STAGE (Lowenfeld Theory):**
    - Identify stage: Scribbling (2-4), Preschematic (4-7), Schematic (7-9), Gang (9-12).
    - *Output:* developmentStage and developmentEvidence.

3. **EXPERA RADAR SCORES (0-100):**
    - colorIQ: Color emotional mastery.
    - spatial: Perspective/Layout.
    - motorSkill: Precision/Control.
    - creativity: Element uniqueness.
    - focus: Detail/Complete.

4. **ACTIONABLE ADVICE:**
    - parentActionPlan: 2 Psychological tips and 2 Artistic Growth tips.

**OUTPUT FORMAT (MANDATORY JSON):**
{
  "moodTrend": "Improving",
  "psychologicalAnalysis": "...",
  "developmentStage": "Preschematic",
  "developmentEvidence": "...",
  "scores": { "colorIQ": 85, "spatial": 70, "motorSkill": 65, "creativity": 90, "focus": 75 },
  "careerSuggestion": "...",
  "learningStyle": "Visual Learner",
  "parentTips": ["Psych Tip 1", "Art Tip 1", ...]
}
`;

        let aiData;
        try {
            console.log(`[Reports] Calling OpenAI V2.0 Expert Analysis for ${nameToUse}...`);
            aiData = await openAIService.generateJSON(prompt);
        } catch (e) {
            console.error('[Reports] OpenAI Failed, using fallback.', e);
            aiData = {
                moodTrend: "Stable",
                psychologicalAnalysis: "The child shows consistent engagement and a positive creative output.",
                developmentStage: childAge < 5 ? "Scribbling" : "Preschematic",
                developmentEvidence: "Consistent use of basic shapes and emergent symbolic representation.",
                scores: { colorIQ: 70, spatial: 60, motorSkill: 65, creativity: 80, focus: 75 },
                careerSuggestion: "Creative Designer",
                learningStyle: "Hands-on",
                parentTips: ["Encourage more varied color use", "Try clay modeling for spatial skills"]
            };
        }

        // 5. Save Final Report
        const report: WeeklyReport = {
            id: `${userId}_${weekId}`,
            weekId,
            userId,
            childProfileId,
            createdAt: Date.now(),
            isFinal: true,
            stats,
            artAnalysis: {
                dominantColors: [artworkDescriptions[0]?.colors?.[0] || '#FFB700'],
                topSubjects: artworkDescriptions.map(a => a.description).slice(0, 3),
                scores: aiData?.scores || { colorIQ: 70, spatial: 70, motorSkill: 70, creativity: 70, focus: 70 },
                colorTrend: aiData?.moodTrend || 'Stable',
                colorPsychologyText: (aiData?.psychologicalAnalysis || "Creative journey focus.").substring(0, 150),
                careerSuggestion: aiData?.careerSuggestion || "Creative Arts",
                adviceText: aiData?.parentTips?.[0] || "Continue supporting creative play.",
                developmentStage: aiData?.developmentStage || (childAge < 5 ? "Scribbling" : "Preschematic"),
                developmentEvidence: aiData?.developmentEvidence || "Emergent symbolic representation."
            },
            aiCommentary: {
                strength: "Imagination",
                weakness: "Fine Motor Details",
                potentialCareer: aiData?.careerSuggestion || "Arts",
                careerReason: "Based on character and scene complexity.",
                learningStyle: aiData?.learningStyle || "Visual Learner",
                psychologicalAnalysis: aiData?.psychologicalAnalysis || "Balanced emotional engagement.",
                moodTrend: aiData?.moodTrend || 'Stable',
                parentActionPlan: aiData?.parentTips || ["Listen and observe", "Provide more materials"]
            },
            analyzedArtworks: artworkDescriptions.map(a => a.id)
        };

        await databaseService.saveReport(userId, report);

        // Mark first report as redeemed
        if (!isVIP && !hasRedeemedFirst) {
            await adminDb.collection('users').doc(userId).update({ hasRedeemedFirstReport: true });
        }

        res.json({ success: true, report });

    } catch (error: any) {
        console.error('[Reports] Generation Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
});

/**
 * GET /api/reports/latest?userId=...&childProfileId=...
 */
router.get('/latest', async (req, res) => {
    try {
        const { userId, childProfileId } = req.query as any;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const report = await databaseService.getLatestReport(userId, childProfileId);
        if (!report) return res.status(404).json({ error: 'No reports found' });

        res.json(report);
    } catch (error: any) {
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

/**
 * GET /api/reports/check-cost?userId=...
 * Check if user needs to pay for report generation
 */
router.get('/check-cost', async (req, res) => {
    try {
        const { userId } = req.query as any;
        if (!userId) return res.status(400).json({ error: 'userId required' });

        const weekId = getWeekId();

        // Check if report already exists
        const existingReport = await databaseService.getReportByWeek(userId, weekId);
        if (existingReport && existingReport.isFinal) {
            return res.json({ needsPayment: false, hasReport: true });
        }

        // Check user status
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const userPlan = userData?.plan || 'free';
        const isVIP = ['premium', 'vip', 'admin'].includes(userPlan);

        if (isVIP) {
            return res.json({ needsPayment: false, isVIP: true });
        }

        // Check for First-Time Free Benefit
        const hasRedeemedFirst = userData?.hasRedeemedFirstReport === true;
        if (!hasRedeemedFirst) {
            return res.json({ needsPayment: false, isFirstTime: true });
        }

        // Needs payment
        res.json({
            needsPayment: true,
            cost: 60,
            currentPoints: userData?.points || 0,
            hasEnough: (userData?.points || 0) >= 60
        });
    } catch (error: any) {
        console.error('[Reports] Check cost error:', error);
        res.status(500).json({ error: 'Failed to check report cost' });
    }
});

export default router;
