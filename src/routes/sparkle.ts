
import express from 'express';
import { geminiService } from '../services/gemini.js';
import { openAIService } from '../services/openai.js'; // Import OpenAI
import { databaseService } from '../services/database.js'; // Import database
import { optionalApiKeyAuth } from '../middleware/auth.js';

export const router = express.Router();

/**
 * POST /api/sparkle/chat
 * Input: { history: {...}, message: string, imageContext?: string, userId: string }
 * Output: { text: "...", tags: { ... }, isDone: boolean }
 */
router.post('/chat', optionalApiKeyAuth, async (req, res) => {
    try {
        console.log("➡️ Sparkle Chat Request Received:", JSON.stringify(req.body).substring(0, 200));
        const { history, message, image, userId } = req.body;

        let finalHistory = history;

        // CHECK CREDITS (Cost: 1)
        if (userId) {
            const success = await databaseService.deductCredits(userId, 1, "Magic Lab Chat", "MAGIC_LAB_CHAT");
            if (!success) {
                return res.status(402).json({
                    error: 'Insufficient Magic Energy! Please recharge.',
                    code: 'INSUFFICIENT_CREDITS'
                });
            }
        } else {
            console.warn("Sparkle Chat: No userId provided for credit check.");
        }

        // If frontend sends simple 'message' (single turn), wrap it in history format
        if (!finalHistory && message) {
            finalHistory = [
                { role: 'user', parts: [{ text: message }] }
            ];
        }

        // Use OpenAI for smarter analysis and JSON tags (Pass Image if available)
        const response = await openAIService.chatWithSparkle(finalHistory, image);
        // Fallback or validation? OpenAIService guarantees JSON struct or error.

        // Log transaction if successful
        // Deduct was already done transactionally. 

        res.json(response);
    } catch (error) {
        console.error('Sparkle Chat Error:', error);

        // REFUND on Crash
        if (req.body.userId) {
            await databaseService.refundCredits(req.body.userId, 1, "System Error Refund");
        }
        res.status(500).json({ error: 'Failed to chat with Sparkle' });
    }
});

/**
 * POST /api/sparkle/transform
 * Input: { image: string (base64 or url), tags: any, userId: string }
 * Output: { imageUrl: string }
 */
router.post('/transform', optionalApiKeyAuth, async (req, res) => {
    try {
        const { image, tags, userId } = req.body;

        // CHECK CREDITS (Cost: 10)
        // Note: Frontend might have already deducted optimistically.
        // If we want double safety, we deduct here too.
        // Frontend "Deducts optimistically" implies it updates UI. 
        // Real deduction must happen on backend.
        // Frontend logic should depend on success or handle sync.
        // I will perform REAL deduction here. Frontend logic matches.

        if (userId) {
            const success = await databaseService.deductCredits(userId, 10, "Magic Transform", "IMAGE_TRANSFORM");
            if (!success) {
                return res.status(402).json({
                    error: 'Insufficient Magic Energy! Please recharge.',
                    code: 'INSUFFICIENT_CREDITS'
                });
            }
        }

        // 1. Generate Prompt using Sparkle Cache (Gemini)
        // ... (Prompt generation logic kept same)
        const imageGenPrompt = `3d render, pixar style, cute, high quality, ${tags?.subject || 'character'}, ${tags?.style || 'cartoon'}, ${tags?.color || 'vibrant colors'}`;

        // 2. Call Image Generation (Placeholder -> Real Service needed)
        // We will enable Doubao/Real integration later or keep using mock for this demo?
        // User didn't strictly ask to fix generation, just billing logic.
        // "Refund Handling: If the API returns an error ... automatically refund"

        // Simulating 50% chance of failure if needed, or just success.
        // Let's assume Success for now.

        // TODO: Replace with real Doubao call
        const mockImageUrl = "https://storage.googleapis.com/kidsartoon-assets/sparkle-magic-result-placeholder.png";

        // Mock delay
        await new Promise(r => setTimeout(r, 2000));

        res.json({
            imageUrl: mockImageUrl,
            mock: true
        });

    } catch (error) {
        console.error('Sparkle Transform Error:', error);

        // REFUND
        if (req.body.userId) {
            await databaseService.refundCredits(req.body.userId, 10, "Transform Failed Refund");
        }

        res.status(500).json({ error: 'Transformation failed' });
    }
});

/**
 * POST /api/sparkle/speak
 * Input: { text: string, lang?: string }
 * Output: Audio Buffer (audio/mp3)
 */
router.post('/speak', optionalApiKeyAuth, async (req, res) => {
    try {
        const { text, lang } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text required' });
        }

        // Use OpenAI TTS (Nova Voice)
        // Only text needed, voice is fixed to 'nova'
        const audioBuffer = await openAIService.generateSpeech(text);

        res.set('Content-Type', 'audio/mp3');
        res.send(audioBuffer);

    } catch (error) {
        console.error('Sparkle TTS Error:', error);
        res.status(500).json({ error: 'TTS failed' });
    }
});

export default router;
