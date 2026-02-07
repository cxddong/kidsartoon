import { Router } from 'express';
import { artworkAnalysisService } from '../services/artworkAnalysisService.js';
import { adminDb } from '../services/firebaseAdmin.js';

const router = Router();

/**
 * Generate a new art growth report for a user
 * POST /api/art-report/generate/:userId
 */
router.post('/generate/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { period = 'week', childName: providedChildName } = req.body; // 'week' or 'month'

        // Get user's artwork from past week/month
        const now = new Date();
        const startDate = new Date();
        if (period === 'week') {
            startDate.setDate(now.getDate() - 7);
        } else {
            startDate.setMonth(now.getMonth() - 1);
        }

        // Fetch artworks
        const artworksSnapshot = await adminDb.collection('images')
            .where('userId', '==', userId)
            .where('createdAt', '>=', startDate.toISOString())
            //.orderBy('createdAt', 'desc') // Removed to avoid index requirement
            .get();

        const artworks = artworksSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        if (artworks.length === 0) {
            return res.status(400).json({ error: 'No artworks found in this period' });
        }

        // Get user info
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        // Use provided name, or fallback to User's name, or generic
        const childName = providedChildName || userData?.displayName || userData?.name || 'Your child';

        // Analyze most recent artwork for highlight
        const highlightArtwork = artworks[0];
        const [colorAnalysis, devStage, narrative, radarScores, artistMatch] = await Promise.all([
            artworkAnalysisService.analyzeColorPsychology(highlightArtwork.imageUrl),
            artworkAnalysisService.detectDevelopmentalStage(highlightArtwork.imageUrl),
            artworkAnalysisService.analyzeNarrativeDepth(highlightArtwork.imageUrl),
            artworkAnalysisService.calculateGrowthRadar(highlightArtwork.imageUrl),
            artworkAnalysisService.matchToArtist(highlightArtwork.imageUrl)
        ]);

        // Generate expert commentary
        const expertCommentary = {
            psychologist: `Based on ${artworks.length} artworks analyzed, your child is demonstrating ${devStage.characteristics.join(', ').toLowerCase()}. ${devStage.spatialConcepts.hasGroundLine ? 'The presence of ground lines indicates growing spatial awareness.' : 'Their artistic expression shows confidence and creativity.'} This aligns with the ${devStage.stage} stage (${devStage.ageRange}).`,

            colorExpert: `${colorAnalysis.interpretation} The color palette shows ${colorAnalysis.distribution.warm}% warm colors, ${colorAnalysis.distribution.cool}% cool colors, and ${colorAnalysis.distribution.neutral}% neutral tones. ${colorAnalysis.emotionalState} is evident in the cheerful choices made throughout the artwork.`,

            educationGuide: `Your child shows ${narrative.detailLevel} attention to detail with ${narrative.elementCount} distinct elements per artwork. ${narrative.hasStory ? 'Strong storytelling abilities are developing through visual narrative!' : 'This is a great foundation for developing narrative skills.'} Observation score: ${narrative.observationScore}/100.`
        };

        // Build report matching frontend interface
        const report = {
            id: '', // Will be filled after save
            userId,
            childName,
            period: {
                start: startDate.toISOString(),
                end: now.toISOString()
            },
            createdAt: now.toISOString(),

            // AI Expert Panel Analysis
            colorPsychology: {
                distribution: colorAnalysis.distribution,
                dominantTone: colorAnalysis.dominantTone,
                interpretation: colorAnalysis.interpretation,
                emotionalState: colorAnalysis.emotionalState
            },

            developmentalStage: {
                stage: devStage.stage,
                ageRange: devStage.ageRange,
                characteristics: devStage.characteristics,
                spatialConcepts: devStage.spatialConcepts
            },

            narrativeAnalysis: {
                elementCount: narrative.elementCount,
                detailLevel: narrative.detailLevel,
                hasStory: narrative.hasStory,
                narrativeElements: narrative.narrativeElements,
                observationScore: narrative.observationScore
            },

            growthRadar: {
                imagination: radarScores.imagination,
                colorSense: radarScores.colorSense,
                structuralLogic: radarScores.structuralLogic,
                lineControl: radarScores.lineControl,
                storytelling: radarScores.storytelling
            },

            highlightArtwork: {
                id: highlightArtwork.id,
                imageUrl: highlightArtwork.imageUrl,
                createdAt: highlightArtwork.createdAt
            },

            artistMatch: {
                artist: artistMatch.artist,
                similarity: artistMatch.similarity,
                reasoning: artistMatch.reasoning
            },

            expertCommentary,

            artworkCount: artworks.length
        };

        // Save report to Firestore
        const reportRef = await adminDb.collection('artGrowthReports').add(report);
        report.id = reportRef.id;

        res.json({
            success: true,
            reportId: reportRef.id,
            report
        });

    } catch (error: any) {
        console.error('[Art Report] Generation failed:', error);
        res.status(500).json({
            error: 'Failed to generate art report',
            details: error.message
        });
    }
});

/**
 * Get latest art growth report for a user
 * GET /api/art-report/:userId/latest
 */
router.get('/:userId/latest', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(`[Art Report] Fetching latest report for user: ${userId}`);

        // Try to get existing report first (without orderBy to avoid index issues)
        const reportsSnapshot = await adminDb.collection('artGrowthReports')
            .where('userId', '==', userId)
            .limit(10)
            .get();

        console.log(`[Art Report] Found ${reportsSnapshot.size} existing reports`);

        if (!reportsSnapshot.empty) {
            // Sort in memory by createdAt
            const reports = reportsSnapshot.docs
                .map((doc: any) => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .sort((a: any, b: any) => {
                    const dateA = new Date(a.createdAt || a.period?.end || 0);
                    const dateB = new Date(b.createdAt || b.period?.end || 0);
                    return dateB.getTime() - dateA.getTime();
                });

            return res.json(reports[0]);
        }

        // No existing report - generate one automatically
        console.log(`[Art Report] No reports found, generating new one...`);

        // Get user's artwork from past week
        const now = new Date();
        const startDate = new Date();
        startDate.setDate(now.getDate() - 7);

        const artworksSnapshot = await adminDb.collection('images')
            .where('userId', '==', userId)
            .limit(20)
            .get();

        console.log(`[Art Report] Found ${artworksSnapshot.size} artworks for analysis`);

        if (artworksSnapshot.empty) {
            return res.status(404).json({
                error: 'No artworks found',
                message: 'Please upload some artworks first to generate a report'
            });
        }

        const artworks = artworksSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        })) as any[];

        // Get user info
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const childName = userData?.displayName || userData?.name || 'Your child';

        // Analyze most recent artwork
        const highlightArtwork = artworks[0];

        console.log(`[Art Report] Analyzing artwork: ${highlightArtwork.id}`);

        const [colorAnalysis, devStage, narrative, radarScores, artistMatch] = await Promise.all([
            artworkAnalysisService.analyzeColorPsychology(highlightArtwork.imageUrl),
            artworkAnalysisService.detectDevelopmentalStage(highlightArtwork.imageUrl),
            artworkAnalysisService.analyzeNarrativeDepth(highlightArtwork.imageUrl),
            artworkAnalysisService.calculateGrowthRadar(highlightArtwork.imageUrl),
            artworkAnalysisService.matchToArtist(highlightArtwork.imageUrl)
        ]);

        console.log(`[Art Report] Analysis complete, generating commentary...`);

        // Generate expert commentary
        const expertCommentary = {
            psychologist: `Based on ${artworks.length} artworks analyzed, your child is demonstrating ${devStage.characteristics.join(', ').toLowerCase()}. ${devStage.spatialConcepts.hasGroundLine ? 'The presence of ground lines indicates growing spatial awareness.' : 'Their artistic expression shows confidence and creativity.'} This aligns with the ${devStage.stage} stage (${devStage.ageRange}).`,

            colorExpert: `${colorAnalysis.interpretation} The color palette shows ${colorAnalysis.distribution.warm}% warm colors, ${colorAnalysis.distribution.cool}% cool colors, and ${colorAnalysis.distribution.neutral}% neutral tones. ${colorAnalysis.emotionalState} is evident in the cheerful choices made throughout the artwork.`,

            educationGuide: `Your child shows ${narrative.detailLevel} attention to detail with ${narrative.elementCount} distinct elements per artwork. ${narrative.hasStory ? 'Strong storytelling abilities are developing through visual narrative!' : 'This is a great foundation for developing narrative skills.'} Observation score: ${narrative.observationScore}/100.`
        };

        // Build report
        const report = {
            id: '',
            userId,
            childName,
            period: {
                start: startDate.toISOString(),
                end: now.toISOString()
            },
            createdAt: now.toISOString(),

            colorPsychology: {
                distribution: colorAnalysis.distribution,
                dominantTone: colorAnalysis.dominantTone,
                interpretation: colorAnalysis.interpretation,
                emotionalState: colorAnalysis.emotionalState
            },

            developmentalStage: {
                stage: devStage.stage,
                ageRange: devStage.ageRange,
                characteristics: devStage.characteristics,
                spatialConcepts: devStage.spatialConcepts
            },

            narrativeAnalysis: {
                elementCount: narrative.elementCount,
                detailLevel: narrative.detailLevel,
                hasStory: narrative.hasStory,
                narrativeElements: narrative.narrativeElements,
                observationScore: narrative.observationScore
            },

            growthRadar: {
                imagination: radarScores.imagination,
                colorSense: radarScores.colorSense,
                structuralLogic: radarScores.structuralLogic,
                lineControl: radarScores.lineControl,
                storytelling: radarScores.storytelling
            },

            highlightArtwork: {
                id: highlightArtwork.id,
                imageUrl: highlightArtwork.imageUrl,
                createdAt: highlightArtwork.createdAt || now.toISOString()
            },

            artistMatch: {
                artist: artistMatch.artist,
                similarity: artistMatch.similarity,
                reasoning: artistMatch.reasoning
            },

            expertCommentary,

            artworkCount: artworks.length
        };

        // Save to Firestore
        const reportRef = await adminDb.collection('artGrowthReports').add(report);
        report.id = reportRef.id;

        console.log(`[Art Report] Report generated successfully: ${reportRef.id}`);

        res.json(report);

    } catch (error: any) {
        console.error('[Art Report] Fetch latest failed:', error);
        console.error('[Art Report] Error stack:', error.stack);
        res.status(500).json({
            error: 'Failed to fetch report',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * Get report history for a user
 * GET /api/art-report/:userId/history?limit=10
 */
router.get('/:userId/history', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit as string) || 10;

        const reportsSnapshot = await adminDb.collection('artGrowthReports')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        const reports = reportsSnapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(reports);

    } catch (error: any) {
        console.error('[Art Report] Fetch history failed:', error);
        res.status(500).json({ error: 'Failed to fetch report history' });
    }
});

// Get Live Creative Journey Report (Real-time, auto-updating)
// This endpoint ALWAYS generates a fresh report from ALL software-created artworks
// Excludes portfolio analysis images (isAnalysisOnly: true)
router.get('/:userId/journey/live', async (req, res) => {
    try {
        const { userId } = req.params;
        const childName = req.query.childName as string || 'Your child';

        console.log(`[Art Report] Generating live journey for: ${userId}, childName: ${childName}`);

        // Fetch ALL software-generated artworks (NOT portfolio/analysis images)
        const artworksSnapshot = await adminDb.collection('images')
            .where('userId', '==', userId)
            //.orderBy('createdAt', 'desc') // Removed to avoid index requirement
            .limit(100) // Increase limit to ensure we get recent ones (fetch more, filter later)
            .get();

        console.log(`[Art Report Debug] Raw DB fetch returned ${artworksSnapshot.size} items`);

        if (!artworksSnapshot.empty) {
            const newest = artworksSnapshot.docs[0].data();
            console.log(`[Art Report Debug] Newest item in DB: ID=${artworksSnapshot.docs[0].id} Created=${newest.createdAt} Type=${newest.type}`);
        }

        // ONLY analyze user-uploaded original images, exclude ALL generated content
        const allArtworks = artworksSnapshot.docs
            .map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            }))
            .filter((img: any) => {
                const isAnalysis = img.meta?.isAnalysisOnly;

                // Allow more creative types! 
                // We want to analyze: Uploads (incl. Art Class), Generated Art, Comics, Masterpieces
                // We exclude: Stories (usually audio/text), Animations (video)
                const validTypes = ['upload', 'generated', 'masterpiece', 'comic', 'pixel-art', 'drawing'];
                const isCorrectType = validTypes.includes(img.type);

                // Relaxed image check - if it's an upload, assume it's an image unless it's clearly a video
                const imageUrl = img.imageUrl || '';

                // Explicitly exclude non-image formats
                const isVideoOrAudio = /\.(mp4|webm|mov|avi|mp3|wav|m4a)($|\?)/i.test(imageUrl);
                const hasUrl = !!imageUrl;

                const keep = !isAnalysis && isCorrectType && hasUrl && !isVideoOrAudio;

                if (!keep && Math.random() < 0.05) { // Sample logs
                    console.log(`[Filter Debug] Rejected: ${img.id} | Type: ${img.type} | Analysis: ${isAnalysis} | URL: ${imageUrl.slice(-20)}`);
                }

                return keep;
            });

        console.log(`[Art Report] Found ${allArtworks.length} creative artworks (filtered ${artworksSnapshot.size - allArtworks.length} items)`);

        if (allArtworks.length === 0) {
            return res.json({
                message: 'No uploaded artworks found',
                childName,
                artworkCount: 0
            });
        }

        // Sort by date
        // Helper to safe parse dates (Handle Firestore Timestamp or String)
        const getDate = (dateVal: any): Date => {
            if (!dateVal) return new Date(0);

            let d: Date;
            if (dateVal?.toDate && typeof dateVal.toDate === 'function') {
                d = dateVal.toDate(); // Firestore Timestamp
            } else if (dateVal?.seconds) {
                d = new Date(dateVal.seconds * 1000); // Raw Timestamp object
            } else {
                d = new Date(dateVal); // String or Date
            }

            // Safety check for Invalid Date
            if (isNaN(d.getTime())) {
                return new Date(0);
            }
            return d;
        };

        // Sort by date using safe parser
        const artworks = allArtworks.sort((a: any, b: any) => {
            const dateA = getDate(a.createdAt);
            const dateB = getDate(b.createdAt);
            return dateB.getTime() - dateA.getTime();
        });

        // Calculate period (first to latest artwork)
        // Convert to ISO strings for frontend safety
        const periodStartRaw = artworks[artworks.length - 1]?.createdAt;
        const periodEndRaw = artworks[0]?.createdAt;

        const periodStart = getDate(periodStartRaw).toISOString();
        const periodEnd = getDate(periodEndRaw).toISOString();

        // Analyze most recent artwork
        const highlightArtwork = artworks[0];

        console.log(`[Art Report] Analyzing latest artwork: ${highlightArtwork.id}`);

        const [colorAnalysis, devStage, narrative, radarScores, artistMatch] = await Promise.all([
            artworkAnalysisService.analyzeColorPsychology(highlightArtwork.imageUrl),
            artworkAnalysisService.detectDevelopmentalStage(highlightArtwork.imageUrl),
            artworkAnalysisService.analyzeNarrativeDepth(highlightArtwork.imageUrl),
            artworkAnalysisService.calculateGrowthRadar(highlightArtwork.imageUrl),
            artworkAnalysisService.matchToArtist(highlightArtwork.imageUrl)
        ]);

        // Generate expert commentary
        const expertCommentary = {
            psychologist: `Based on ${artworks.length} artworks analyzed, ${childName} is demonstrating ${devStage.characteristics.join(', ').toLowerCase()}. ${devStage.spatialConcepts.hasGroundLine ? 'The presence of ground lines indicates growing spatial awareness.' : 'Their artistic expression shows confidence and creativity.'} This aligns with the ${devStage.stage} stage (${devStage.ageRange}).`,

            colorExpert: `${colorAnalysis.interpretation} The color palette shows ${colorAnalysis.distribution.warm}% warm colors, ${colorAnalysis.distribution.cool}% cool colors, and ${colorAnalysis.distribution.neutral}% neutral tones. ${colorAnalysis.emotionalState} is evident in the cheerful choices made throughout the artwork.`,

            educationGuide: `${childName} shows ${narrative.detailLevel} attention to detail with ${narrative.elementCount} distinct elements per artwork. ${narrative.hasStory ? 'Strong storytelling abilities are developing through visual narrative!' : 'This is a great foundation for developing narrative skills.'} Observation score: ${narrative.observationScore}/100.`
        };

        // Build live journey report
        const report = {
            type: 'live_journey',
            userId,
            childName,
            period: {
                start: periodStart,
                end: periodEnd
            },
            lastUpdated: new Date().toISOString(),
            artworkCount: artworks.length,

            colorPsychology: {
                distribution: colorAnalysis.distribution,
                dominantTone: colorAnalysis.dominantTone,
                interpretation: colorAnalysis.interpretation,
                emotionalState: colorAnalysis.emotionalState
            },

            developmentalStage: {
                stage: devStage.stage,
                ageRange: devStage.ageRange,
                characteristics: devStage.characteristics,
                spatialConcepts: devStage.spatialConcepts
            },

            narrativeAnalysis: {
                elementCount: narrative.elementCount,
                detailLevel: narrative.detailLevel,
                hasStory: narrative.hasStory,
                narrativeElements: narrative.narrativeElements,
                observationScore: narrative.observationScore
            },

            growthRadar: {
                imagination: radarScores.imagination,
                colorSense: radarScores.colorSense,
                structuralLogic: radarScores.structuralLogic,
                lineControl: radarScores.lineControl,
                storytelling: radarScores.storytelling
            },

            highlightArtwork: {
                id: highlightArtwork.id,
                imageUrl: highlightArtwork.imageUrl,
                createdAt: highlightArtwork.createdAt
            },

            artistMatch: {
                artist: artistMatch.artist,
                similarity: artistMatch.similarity,
                reasoning: artistMatch.reasoning
            },

            expertCommentary
        };

        console.log(`[Art Report] Live journey report generated for ${childName} with ${artworks.length} artworks`);
        res.json(report);

    } catch (error: any) {
        console.error('[Art Report] Live journey generation failed:', error);
        res.status(500).json({
            error: 'Failed to generate live journey report',
            details: error.message,
            stack: error.stack // Exposed for debugging
        });
    }
});

export default router;
