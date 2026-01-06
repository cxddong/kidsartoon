import { Router } from 'express';
import multer from 'multer';
import { doubaoService } from '../services/doubao.js';
import { pointsService } from '../services/points.js';
import { minimaxService } from '../services/minimax.js';
import { databaseService } from '../services/database.js';
import { MASTERPIECES } from '../data/masterpieces.js';

export const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * POST /api/masterpiece/match
 * Analyze child's artwork and match with famous masterpiece
 */
router.post('/match', upload.single('image'), async (req, res) => {
    try {
        const userId = req.body.userId || 'anonymous';

        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }

        console.log(`[Masterpiece] Match request from user: ${userId}`);

        // Consume points (5 points for masterpiece matching)
        const pointsResult = await pointsService.consumePoints(userId, 'masterpiece_match', 5);
        if (!pointsResult.success) {
            return res.status(402).json({
                error: 'Not enough points',
                required: 5,
                current: pointsResult.before || 0
            });
        }

        try {
            // 1. Upload User Image to Storage (for persistent history)
            const userImageStorageUrl = await databaseService.uploadFile(
                req.file.buffer,
                req.file.mimetype,
                'masterpiece_uploads'
            );

            // Convert buffer to base64 for AI Analysis
            const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

            // Use Doubao Vision to analyze and match TOP 3 masterpieces
            const combinedPrompt = `You are Magic Kat, an expert Art Mentor for kids.

STEP 1: Carefully observe this artwork.
STEP 2: Match with the TOP 3 BEST MATCHES from this list (ranked by similarity):
${MASTERPIECES.map((m, idx) => `${idx + 1}. ID: ${m.id} (Artist: ${m.artist})`).join('\n')}

YOUR TASK:
1. MATCH: Connect the user's drawing to a Masterpiece.
2. ANALYZE (For Parents): Write a detailed, educational paragraph explaining the artistic connection (Color Theory, Composition, Brushwork).
3. SCRIPT (For Kids): Write a *SHORT, FUN* script to be spoken aloud.
    - Length: 50 - 80 words MAX.
    - Tone: Excited, Naughty (Magic Kat persona), Encouraging.
    - Content: Compliment the drawing -> Mention the Artist -> Suggest ONE fun thing to add next.

OUTPUT FORMAT (JSON only):
{
  "matches": [
    {
      "matchId": "id_from_list",
      "rank": 1,
      "analysis_for_parents": "Detailed educational analysis...",
      "audio_script_for_kids": "Meow! 😻 Master! Your drawing is so bright! It looks like a magical city made of blocks, just like Paul Klee! But look... the sky is empty. Can you draw a Smiling Sun to keep the castle warm? Let's do it!",
      "suggestion": "Draw a Smiling Sun",
      "commonFeatures": ["feature1", "feature2"]
    },
    { "matchId": "id_rank_2", "rank": 2, "analysis_for_parents": "...", "audio_script_for_kids": "...", "suggestion": "...", "commonFeatures": [] },
    { "matchId": "id_rank_3", "rank": 3, "analysis_for_parents": "...", "audio_script_for_kids": "...", "suggestion": "...", "commonFeatures": [] }
  ]
}`;

            const response = await doubaoService.analyzeImage(base64Image, combinedPrompt);
            console.log('[Masterpiece] AI Response received');

            // Parse JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Invalid AI response format');

            const matchResult = JSON.parse(jsonMatch[0]);

            // Ensure we have matches array
            if (!matchResult.matches || !Array.isArray(matchResult.matches)) {
                throw new Error('AI did not return matches array');
            }

            // --- TTS Generation for Top Match ---
            let kidAudioStorageUrl = null;
            let kidAudioBase64 = null; // For immediate playback if needed

            try {
                const topScript = matchResult.matches[0]?.audio_script_for_kids;
                if (topScript) {
                    console.log('[Masterpiece] Generating TTS for script:', topScript.substring(0, 30) + '...');
                    const audioBuffer = await minimaxService.generateSpeech(topScript, 'kiki');

                    // Upload Audio to Storage
                    kidAudioStorageUrl = await databaseService.uploadFile(audioBuffer, 'audio/mpeg', 'masterpiece_audio');
                    kidAudioBase64 = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;
                }
            } catch (ttsErr) {
                console.error('[Masterpiece] TTS Gen failed, continuing without audio:', ttsErr);
            }

            // Map matches to full artwork data
            const top3Matches = matchResult.matches.slice(0, 3).map((match: any) => {
                const matchedArtwork = MASTERPIECES.find(m => m.id === match.matchId) || MASTERPIECES[0];
                return {
                    ...match,
                    analysis: match.analysis_for_parents, // Backwards compat
                    artwork: matchedArtwork
                };
            });

            // Save to Database History
            if (userId !== 'anonymous') {
                await databaseService.saveImageRecord(
                    userId,
                    userImageStorageUrl,
                    'masterpiece',
                    `Inspired by ${top3Matches[0].artwork.artist}`,
                    {
                        matches: top3Matches,
                        audioUrl: kidAudioStorageUrl,
                        kidScript: matchResult.matches[0]?.audio_script_for_kids,
                        parentAnalysis: matchResult.matches[0]?.analysis_for_parents,
                        suggestion: matchResult.matches[0]?.suggestion
                    }
                );
            }

            res.json({
                success: true,
                matches: top3Matches,
                topAudioUrl: kidAudioBase64, // Return base64 for immediate playback to avoid latency
                savedUrl: userImageStorageUrl
            });


        } catch (analysisError: any) {
            console.error('[Masterpiece] Analysis failed:', analysisError);

            // Refund points on failure
            await pointsService.refundPoints(userId, 'masterpiece_match', 'analysis_failed');

            res.status(500).json({
                error: 'Failed to analyze artwork',
                details: analysisError.message
            });
        }

    } catch (error: any) {
        console.error('[Masterpiece] Endpoint error:', error);
        res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
});

/**
 * GET /api/masterpiece/list
 * Get all available masterpieces for preview
 */
router.get('/list', (req, res) => {
    res.json({
        success: true,
        masterpieces: MASTERPIECES
    });
});

export default router;
