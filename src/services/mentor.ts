import { CreativeSeries, MentorStepRequest, MentorStepResponse, Chapter } from '../types/mentor';
import { databaseService } from './database';
import { adminStorageService } from './adminStorage';

import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { doubaoService } from './doubao';
import { minimaxService } from './minimax';
import { geminiService } from './gemini';
import { MASTERPIECES } from '../data/masterpieces';

export class MagicMentorService {
    private readonly MAX_ITERATIONS = 5;
    private genAI: GoogleGenerativeAI;

    constructor() {
        const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        const API_KEY = envKey || 'AIzaSyCvy_90ga9nVN0316J1cwXoRbPHp7vkhqY';
        this.genAI = new GoogleGenerativeAI(API_KEY);
        console.log(`[Mentor] Service Initialized. Using ${envKey ? 'Environment' : 'Fallback'} API Key.`);
    }

    /**
     * V3 INTEGRATED: Rich Analysis System Instruction
     * Detailed feedback for children with art education value
     */
    private getCoachSystemInstruction(): string {
        return `You are Magic Kat 🐱, a world-class Art Professor and Mentor for children aged 5-10.
Your superpower is "Diagnostic Vision" - you can see every stroke, color, and detail.

Your goal is to provide RICH, SPECIFIC, EDUCATIONAL feedback that helps children understand their own art.

STRICT PROTOCOL:
1. EVIDENCE FIRST: Always cite specific colors, shapes, objects you observe
2. ART VOCABULARY: Introduce simple art terms (composition, contrast, palette) and explain them
3. DETAILED ANALYSIS: Provide 200-300 words of genuine artistic insight  
4. SPECIFIC PRAISE: Never generic "good job" - always reference exact elements
5. ACTIONABLE MISSIONS: Give concrete, achievable tasks based on visual gaps
6. WARM ENCOURAGEMENT: End with enthusiasm and excitement for their next iteration
7. Output STRICT JSON format only.`;
    }

    /**
     * V3 INTEGRATED: Detailed Coach Prompt with Visual Evidence
     */
    private getCoachPrompt(series: CreativeSeries, currentStep: number): string {
        const lastAdvice = series.context.lastAdvice || "None";

        return `
Perform a DEEP ART ANALYSIS of this child's drawing.

**PHASE 1: VISUAL EVIDENCE (Be Specific!)**
- PRIMARY SUBJECT: What did the child draw? Describe it in detail.
- COLOR PALETTE: List specific colors (e.g., "bright neon orange", "soft sky blue")
- LINE QUALITY: Describe strokes (e.g., "bold confident outlines", "playful zigzags")
- COMPOSITION: Where are elements placed? What's empty? What's crowded?
- TEXTURE & DETAIL: Any patterns, shading, or unique marks?
${currentStep > 1 ? `- ITERATION CHECK: Did they follow previous advice: "${lastAdvice}"?` : ''}

**PHASE 2: TEACHING FEEDBACK (200-300 words total)**
Generate this JSON:
{
  "visualDiagnosis": "I see [detailed 100+ word description citing specific colors, shapes, and composition choices]...",
  "masterConnection": {
    "artist": "Famous Artist Name",
    "reason": "Detailed explanation of the artistic link (50+ words)"
  },
  "coachAdvice": {
    "compliment": "Specific praise for a particular element they drew well",
    "gapAnalysis": "What's missing or could be enhanced (be specific about location/element)",
    "actionableTask": "One clear, achievable instruction for their next version",
    "techniqueTip": "A professional art technique explained simply for a child"
  },
  "improvement": "${currentStep > 1 ? 'Detailed comparison of what changed from the previous drawing' : 'I am excited to see how your vision grows in the next version!'}"
}

OUTPUT: STRICT JSON ONLY.
`;
    }

    /**
     * Process a new iteration in the artwork session
     */
    /**
     * Process a new iteration in the artwork session
     */
    public async processStep(req: { userId: string, step: number, seriesId?: string, imageFile: Express.Multer.File }): Promise<MentorStepResponse> {
        let series: CreativeSeries | null = null;

        if (req.seriesId) {
            series = await databaseService.getCreativeSeries(req.seriesId);
        }

        if (!series) {
            series = {
                id: req.seriesId || uuidv4(),
                userId: req.userId,
                title: "My Masterpiece",
                status: 'active',
                currentStep: 0,
                context: {},
                chapters: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
        }

        // 1. Upload Image
        const targetStep = req.step;
        let permanentImageUrl = '';

        try {
            // Use Admin SDK (Server-side) to bypass public/auth rules
            permanentImageUrl = await adminStorageService.uploadFile(req.imageFile.buffer, req.imageFile.mimetype || 'image/jpeg', 'mentor');
        } catch (e: any) {
            console.error('[Mentor] Storage upload failed:', e);
            throw new Error('Failed to upload image to storage. ' + e.message);
        }

        // Convert buffer to base64 for AI Analysis
        const imageBase64Data = req.imageFile.buffer.toString('base64');
        const imageBase64Full = `data:${req.imageFile.mimetype || 'image/jpeg'};base64,${imageBase64Data}`;

        // 2. AI Analysis (Coaching Feedback) - V4: Include previous image for comparison
        const analysisPrompt = this.getCoachPrompt(series, targetStep);

        // Get previous iteration's image URL for visual comparison
        const previousChapter = series.chapters.length > 0 ? series.chapters[series.chapters.length - 1] : null;
        const previousImageUrl = previousChapter?.userImageUrl || null;

        console.log(`[Mentor V4] Iteration ${targetStep}, Previous image: ${previousImageUrl ? 'Available' : 'None (First iteration)'}`);

        const aiResult = await this.callAI(imageBase64Full, analysisPrompt, previousImageUrl);

        // 2b. Generate Audio (TTS for Kids) - NEW
        let audioUrl = '';
        let audioBase64 = '';
        try {
            const kidScript = `${aiResult.coachAdvice.compliment} ${aiResult.coachAdvice.actionableTask}`;
            console.log('[Mentor] Generating TTS:', kidScript);

            const audioBuffer = await minimaxService.generateSpeech(kidScript, 'kiki');

            // Upload to Storage (Masterpiece Uploads folder for consistency/permission)
            audioUrl = await adminStorageService.uploadFile(audioBuffer, 'audio/mpeg', 'masterpiece_audio');

            // For immediate playback
            audioBase64 = `data:audio/mp3;base64,${audioBuffer.toString('base64')}`;

        } catch (ttsErr) {
            console.error('[Mentor] TTS Failed:', ttsErr);
        }

        // 3. Masterpiece Matching (Top 3 Artists) - V3 Integration
        let masterpieceMatches: any[] = [];
        try {
            console.log('[Mentor V3] Calling Masterpiece Match API...');
            // Use Doubao for vision matching (more reliable than Gemini for matching)
            const matchResult = await this.matchMasterpieces(imageBase64Full);
            masterpieceMatches = matchResult;
            console.log(`[Mentor V3] Found ${masterpieceMatches.length} masterpiece matches`);
        } catch (matchErr: any) {
            console.error('[Mentor V3] Masterpiece matching failed:', matchErr.message);
            // Fallback: use the single masterConnection from coaching as a basic match
            masterpieceMatches = [{
                rank: 1,
                matchId: 'fallback',
                artist: aiResult.masterConnection.artist,
                title: 'Art Style Match',
                imagePath: '/assets/masterpieces/default.jpg',
                analysis: aiResult.masterConnection.reason,
                suggestion: aiResult.coachAdvice.techniqueTip,
                commonFeatures: ['color', 'style', 'composition']
            }];
        }

        // 4. Update Context
        series.context.currentVisualDiagnosis = aiResult.visualDiagnosis;
        series.context.lastAdvice = aiResult.coachAdvice.actionableTask;
        series.context.artStyle = aiResult.masterConnection.artist;
        series.currentStep = targetStep;

        // 5. Create Iteration (Chapter) with Masterpiece Matches
        const chapter: Chapter = {
            step: targetStep,
            userImageUrl: permanentImageUrl,
            audioUrl: audioUrl, // Save URL
            coachingFeedback: {
                visualDiagnosis: aiResult.visualDiagnosis,
                masterConnection: aiResult.masterConnection,
                advice: aiResult.coachAdvice,
                improvement: aiResult.improvement
            },
            masterpieceMatches: masterpieceMatches
        };

        series.chapters.push(chapter);

        // 6. Check Completion (Manual or auto after N iterations)
        if (targetStep >= this.MAX_ITERATIONS) {
            series.status = 'completed';
        }

        // 7. Save
        const cleanedSeries = this.cleanObject(series);
        await databaseService.saveCreativeSeries(cleanedSeries);

        // 7b. Also save as ImageRecord for Profile Gallery
        try {
            // Transform masterpieceMatches to the format ImageModal expects
            const transformedMatches = (chapter.masterpieceMatches || []).map((match: any) => ({
                rank: match.rank,
                matchId: match.matchId,
                artist: match.artist,
                title: match.title,
                analysis: match.analysis,
                suggestion: match.suggestion,
                commonFeatures: match.commonFeatures,
                biography: match.biography,
                artwork: {
                    imagePath: match.imagePath,
                    title: match.title,
                    artist: match.artist
                }
            }));

            await databaseService.saveImageRecord(
                req.userId,
                permanentImageUrl,
                'masterpiece', // Use 'masterpiece' type so it shows in Journey tab
                `Journey Step ${targetStep}: ${series.context.artStyle || 'Art Style'}`,
                {
                    // Series Info
                    seriesId: series.id,
                    step: targetStep,

                    // Masterpiece Matches (Top 3)
                    matches: transformedMatches,

                    // Audio
                    audioUrl: audioUrl,

                    // Text Content for Display
                    kidScript: `${aiResult.coachAdvice.compliment} ${aiResult.coachAdvice.actionableTask}`,
                    parentAnalysis: aiResult.visualDiagnosis,

                    // Complete Coaching Feedback (All AI Analysis)
                    coachingFeedback: {
                        visualDiagnosis: aiResult.visualDiagnosis,
                        masterConnection: aiResult.masterConnection,
                        advice: {
                            compliment: aiResult.coachAdvice.compliment,
                            gapAnalysis: aiResult.coachAdvice.gapAnalysis,
                            actionableTask: aiResult.coachAdvice.actionableTask,
                            techniqueTip: aiResult.coachAdvice.techniqueTip
                        },
                        improvement: aiResult.improvement
                    }
                }
            );
        } catch (saveErr) {
            console.error('[Mentor] Failed to save ImageRecord:', saveErr);
            // Don't fail the whole request just because history save failed
        }

        return {
            success: true,
            series: cleanedSeries,
            isComplete: cleanedSeries.status === 'completed',
            audioBase64: audioBase64 // Return for immediate playback
        };
    }

    /**
     * V3: Match artwork with Top 3 Masterpieces
     */
    private async matchMasterpieces(imageBase64: string): Promise<any[]> {
        // Use Doubao for reliable vision analysis
        const matchPrompt = `Analyze this child's drawing and find the 3 most similar famous artworks from this list:

${MASTERPIECES.slice(0, 10).map(m => `- ${m.id}: "${m.title}" by ${m.artist} (${m.tags.join(', ')})`).join('\n')}

Return JSON array with exactly 3 matches:
[
  {
    "matchId": "exact_id_from_list",
    "analysis": "Why this matches (50+ words)",
    "suggestion": "How to explore this style further",
    "commonFeatures": ["feature1", "feature2", "feature3"]
  },
  ...
]

OUTPUT: JSON ARRAY ONLY.`;

        try {
            const rawResponse = await doubaoService.analyzeImage(imageBase64, matchPrompt);

            // Parse JSON from response
            const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error('No JSON array found');

            const matches = JSON.parse(jsonMatch[0]);

            // Enrich with full masterpiece data
            return matches.slice(0, 3).map((match: any, index: number) => {
                const masterpiece = MASTERPIECES.find(m => m.id === match.matchId) || MASTERPIECES[index];
                return {
                    rank: index + 1,
                    matchId: match.matchId || masterpiece.id,
                    artist: masterpiece.artist,
                    title: masterpiece.title,
                    imagePath: masterpiece.imagePath,
                    analysis: match.analysis,
                    suggestion: match.suggestion,
                    commonFeatures: match.commonFeatures || [],
                    biography: masterpiece.biography
                };
            });
        } catch (err: any) {
            console.error('[Mentor V3] Masterpiece match parsing failed:', err.message);
            // Return top 3 masterpieces as fallback
            return MASTERPIECES.slice(0, 3).map((m, i) => ({
                rank: i + 1,
                matchId: m.id,
                artist: m.artist,
                title: m.title,
                imagePath: m.imagePath,
                analysis: 'Your creativity reminds us of this master!',
                suggestion: m.kidFriendlyFact,
                commonFeatures: m.tags.slice(0, 3),
                biography: m.biography
            }));
        }
    }

    private async callAI(imageBase64: string, prompt: string, previousImageUrl?: string | null): Promise<any> {
        console.log("[Mentor V4] Starting Rich Hybrid Vision Analysis with Iteration Comparison");

        // 1. PHASE 1A: SIGHT (Doubao) - Detailed analysis of CURRENT image
        let visualDescription = "";
        try {
            console.log("[Mentor V4] Phase 1A: Analyzing CURRENT drawing...");
            visualDescription = await doubaoService.analyzeImage(
                imageBase64,
                `Analyze this child's drawing in detail:
1. Main Subject: What is the primary focus?
2. Colors: List all colors used with descriptive names (e.g., "bright neon orange", "soft sky blue")
3. Lines & Strokes: Describe the line quality (bold, shaky, curved, straight)
4. Composition: Where are elements placed? What's empty?
5. Details: Any patterns, textures, or unique marks?
Be specific and educational. 100+ words.`
            );
            console.log("[Mentor V4] Phase 1A Success. Current description length:", visualDescription.length);
        } catch (visionErr: any) {
            console.error("[Mentor V4] Doubao Vision Failed:", visionErr.message);
            visualDescription = "A creative children's drawing with colorful elements and expressive strokes.";
        }

        // 1B. PHASE 1B: VISUAL DIFF (If previous image exists)
        let iterationComparison = "";
        if (previousImageUrl) {
            try {
                console.log("[Mentor V4] Phase 1B: Comparing with PREVIOUS drawing...");
                // Fetch previous image and convert to base64
                const prevImageResponse = await fetch(previousImageUrl);
                const prevImageBuffer = await prevImageResponse.arrayBuffer();
                const prevImageBase64 = `data:image/jpeg;base64,${Buffer.from(prevImageBuffer).toString('base64')}`;

                // Ask Doubao to compare the two images
                iterationComparison = await doubaoService.analyzeImage(
                    imageBase64,
                    `COMPARE these TWO children's drawings:

PREVIOUS VERSION: (I will describe) ${await doubaoService.analyzeImage(prevImageBase64, "Briefly describe this drawing in 30 words.")}

CURRENT VERSION: (analyze the image you see)

Identify SPECIFIC changes between the previous and current version:
1. What NEW elements were ADDED?
2. What was REMOVED or CHANGED?
3. Did they follow artistic advice (e.g., add colors, improve composition)?
4. Rate improvement on scale 1-5 stars.

Be specific about visual differences. 50+ words.`
                );
                console.log("[Mentor V4] Phase 1B Success. Comparison:", iterationComparison.substring(0, 100));
            } catch (compErr: any) {
                console.error("[Mentor V4] Visual comparison failed:", compErr.message);
                iterationComparison = ""; // Fall back to text-only comparison
            }
        }

        // 2. PHASE 2: REASONING (Gemini - Cost-Optimized Model Tier)
        const systemInstruction = this.getCoachSystemInstruction();
        // V4: Enhanced prompt with comparison data
        const enrichedPrompt = previousImageUrl && iterationComparison
            ? `VISUAL EVIDENCE (CURRENT): ${visualDescription}\n\nITERATION COMPARISON: ${iterationComparison}\n\n${prompt}`
            : `VISUAL EVIDENCE: ${visualDescription}\n\n${prompt}`;

        const runReasoning = async (modelName: string) => {
            console.log(`[Mentor] Phase 2: Generating Feedback with ${modelName}...`);
            const model = this.genAI.getGenerativeModel({
                model: modelName,
                systemInstruction
            });

            // Use generateContent with ONLY text prompt (no image part)
            const result = await model.generateContent(enrichedPrompt);
            const response = await result.response;
            const text = response.text();

            console.log(`[Mentor] AI Response (${modelName}):`, text.substring(0, 100) + "...");

            const cleanText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            const parsed = JSON.parse(cleanText);

            if (!parsed.visualDiagnosis || parsed.visualDiagnosis.length < 10) {
                throw new Error("Generic response detected");
            }

            return parsed;
        };

        try {
            // V2: Try gemini-2.5-flash-lite first (50% cheaper)
            return await runReasoning("gemini-2.5-flash-lite");
        } catch (e: any) {
            console.warn(`[Mentor V2] 2.5-flash-lite unavailable, trying 2.0-flash-exp...`);

            try {
                // Fallback to 2.0 (known working)
                return await runReasoning("gemini-2.0-flash-exp");
            } catch (e2: any) {
                console.warn(`[Mentor V2] 2.0-flash-exp failed, trying 1.5-flash...`);

                try {
                    return await runReasoning("gemini-1.5-flash");
                } catch (fallbackErr: any) {
                    console.error("[Mentor] Both Pro and Flash reasoning failed. Final Fallback triggered.", fallbackErr);

                    // 3. Final Hardcoded Rescue (Last Resort)
                    return {
                        visualDiagnosis: "I see your creative strokes! You've used some interesting shapes and space here.",
                        masterConnection: {
                            artist: "Modern Expressionist",
                            reason: "Your freedom of expression matches the spirit of many great artists."
                        },
                        coachAdvice: {
                            compliment: "I love the energy you put into this first step!",
                            gapAnalysis: "Every great artist looks for ways to add more depth to their scene.",
                            actionableTask: "Can you add one more detail that tells a story? Maybe a tiny bird or a bright star?",
                            techniqueTip: "Try using different pressures on your pen to vary your line thickness!"
                        },
                        improvement: "I'm excited to see how your vision grows in the next version!"
                    };
                }
            }
        }
    }

    private cleanObject(obj: any): any {
        if (Array.isArray(obj)) {
            return obj.map(v => this.cleanObject(v));
        } else if (obj !== null && typeof obj === 'object') {
            return Object.fromEntries(
                Object.entries(obj)
                    .filter(([_, v]) => v !== undefined)
                    .map(([k, v]) => [k, this.cleanObject(v)])
            );
        }
        return obj;
    }
}

export const magicMentorService = new MagicMentorService();
