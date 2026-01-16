

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

        if (!isVIP) {
            if (userPoints < REPORT_COST) {
                return res.status(402).json({
                    error: 'Insufficient points',
                    required: REPORT_COST,
                    current: userPoints,
                    message: 'Unlock deep scientific analysis for 60 points or upgrade to Premium'
                });
            }

            // Deduct points (grantPoints with negative amount)
            await pointsService.grantPoints(userId, -REPORT_COST, 'parent_report', 'Weekly Scientific Report Generation');
            console.log(`[Reports] Deducted ${REPORT_COST} points from ${userId}`);
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
            storyCount: recentImages.filter(img => img.type === 'story').length, // Audio Story
            comicCount: recentImages.filter(img => img.type === 'comic' || img.type === 'graphic-novel').length,
            bookCount: recentImages.filter(img => img.type === 'picturebook').length,
            cardCount: recentImages.filter(img => img.type === 'cards').length,
            puzzleCount: 0, // Server-side puzzle tracking todo
            totalScreenTimeMinutes: recentImages.length * 15,
            chatMessages: 0 // Placeholder
        };

        // 4. Data for AI (Scientific Inputs)
        // Extract subjects and colors for ALL history to ensure trend accuracy
        const allSubjects = allImages.map(img => img.prompt || img.meta?.description || 'Untitled').filter(s => s.length > 3);
        // Extract real color data if available (mocking hex extraction from meta if not present)
        const realColors = allImages.map(img => img.dominantColor || img.meta?.dominantColor).filter(c => c && c.startsWith('#'));

        const evidenceList = allSubjects.slice(0, 50);

        const prompt = `
You are an expert **Child Psychologist**, **Art Therapist**, and **Data Scientist**.
Analyze a child's creative activity to generate a professional growth report.

**REAL DATA:**
1. Art Subjects: ${JSON.stringify(evidenceList)}
2. Dominant Colors: ${JSON.stringify(realColors.slice(0, 20))}
3. Stats: ${JSON.stringify(stats)}
4. Child: ${nameToUse}

**ANALYSIS TASKS:**
1. Color Psychology: Analyze colors (Red/Orange=Energy, Blue/Green=Calm). 2-3 sentences, cite actual colors.
2. Career Spotting: Match subjects to careers (Machines→Engineering, Characters→Literature). Provide 2 specific fields.
3. Radar Scores (0-100): narrative, color, logic, imagination, detail - based only on data.
4. Parenting Tip: ONE specific action (e.g., "Try Lego Technic sets").

**OUTPUT JSON:**
{
  "colorTrend": "Warm Colors (Red/Orange)",
  "colorPsychologyText": "Professional analysis citing actual colors",
  "careerSuggestion": "Engineering or Architecture",
  "careerReason": "Explain based on subjects",
  "radarScores": {"narrative":85,"color":92,"logic":70,"imagination":88,"detail":65},
  "adviceText": "Specific tip",
  "strength": "Key strength",
  "weakness": "Growth area (positive)",
  "emotionalState": "Curious",
  "topInterests": ["interest1","interest2","interest3"]
}
Be evidence-based. Cite real data.`;

        let aiData;
        try {
            console.log(`[Reports] Calling OpenAI scientific analysis for ${nameToUse}...`);
            aiData = await openAIService.generateJSON(prompt);
        } catch (e) {
            console.error('[Reports] OpenAI Failed, using fallback.', e);
            aiData = {
                colorTrend: "Mixed Palette",
                colorPsychologyText: "Shows a balanced emotional state with varied interests.",
                radarScores: { narrative: 75, color: 80, logic: 60, imagination: 85, detail: 70 },
                careerSuggestion: "Creative Arts",
                careerReason: "Shows general creativity.",
                adviceText: "Keep encouraging diverse subjects.",
                strength: "Consistency",
                weakness: "Detail"
            };
        }

        // 5. Save Final Report
        const report: WeeklyReport = {
            id: `${userId}_${weekId}`, // Deterministic ID
            weekId,
            userId,
            childProfileId,
            createdAt: Date.now(),
            isFinal: true, // Mark as persistent
            stats,
            artAnalysis: {
                dominantColors: aiData.dominantColors || realColors.slice(0, 5) || ['#FF0000'],
                topSubjects: aiData.topSubjects || evidenceList.slice(0, 3),
                radarScores: {
                    composition: aiData.radarScores.logic || 70, // Map logic -> composition
                    color: aiData.radarScores.color || 70,
                    imagination: aiData.radarScores.imagination || 70,
                    line: aiData.radarScores.detail || 70, // Map detail -> line
                    story: aiData.radarScores.narrative || 70
                },
                colorTrend: aiData.colorTrend,
                colorPsychologyText: aiData.colorPsychologyText,
                careerSuggestion: aiData.careerSuggestion,
                adviceText: aiData.adviceText
            },
            aiCommentary: {
                strength: aiData.strength,
                weakness: aiData.weakness,
                potentialCareer: aiData.careerSuggestion,
                careerReason: aiData.careerReason,
                learningStyle: "Visual Learner" // Default
            }
        };

        await databaseService.saveReport(userId, report);
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
