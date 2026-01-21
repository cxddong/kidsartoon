

import express from 'express';
import { geminiService } from '../services/gemini.js';
import { openAIService } from '../services/openai.js'; // Keep for now, verifying file existence first
import { elevenLabsService, VOICE_IDS } from '../services/elevenlabs.js'; // Premium voices
import { databaseService } from '../services/database.js'; // Import database
import { optionalApiKeyAuth } from '../middleware/auth.js';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { adminStorageService } from '../services/adminStorage.js';

export const router = express.Router();

/**
 * POST /api/sparkle/chat
 * Input: { history: {...}, message: string, imageContext?: string, userId: string }
 * Output: { text: "...", tags: { ... }, isDone: boolean }
 */
router.post('/chat', optionalApiKeyAuth, async (req, res) => {
    try {
        console.log("➡️ Sparkle Chat Request Received:", JSON.stringify(req.body).substring(0, 200));
        const { history, message, image, userId, userProfile, hasUploadedImage } = req.body;

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

        // Use OpenAI for smarter analysis and JSON tags (Pass Image, User Profile, and Image Upload Status)
        const response = await openAIService.chatWithSparkle(finalHistory, image, userProfile, hasUploadedImage);
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


/**
 * POST /api/sparkle/speak-minimax
 * The "Mouth" of Hybrid Pipeline (With Caching)
 * Input: { text: string, voiceId?: string, userId: string }
 */
router.post('/speak-minimax', optionalApiKeyAuth, async (req, res) => {
    try {
        const { text, voiceId = 'female-shaonv', userId } = req.body;

        if (!text) return res.status(400).json({ error: 'Text required' });

        // Generate Cache Key (Text + Voice safe hash)
        // Simple hash: remove spaces, lowercase, take first 32 chars + length
        const cleanText = text.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 50);
        const cacheKey = `minimax_v2_${voiceId}_${cleanText}_${text.length}`;

        // 1. CHECK CACHE
        try {
            const cachedUrl = await databaseService.getCachedAudio(cacheKey);
            if (cachedUrl) {
                console.log(`[Sparkle Minimax] Cache HIT: ${cacheKey}`);

                let audioBuffer: Buffer;

                if (cachedUrl.startsWith('http')) {
                    // Cloud Storage URL -> Download
                    const response = await fetch(cachedUrl);
                    if (!response.ok) throw new Error(`Failed to fetch cached audio: ${response.statusText}`);
                    const arrayBuffer = await response.arrayBuffer();
                    audioBuffer = Buffer.from(arrayBuffer);
                } else {
                    // Local File -> Read
                    // cachedUrl is like '/uploads/...'
                    // We assume it is in 'client/public' 
                    const fs = await import('fs');
                    const path = await import('path');
                    const filePath = path.join(process.cwd(), 'client', 'public', cachedUrl);
                    if (fs.existsSync(filePath)) {
                        audioBuffer = fs.readFileSync(filePath);
                    } else {
                        // Cache invalid? File missing?
                        // Fall through to generate
                        console.warn(`[Sparkle Minimax] Cached file missing: ${filePath}`);
                        throw new Error("Cached file missing");
                    }
                }

                res.set('Content-Type', 'audio/mp3');
                return res.send(audioBuffer);
            }
        } catch (e) {
            console.warn("[Sparkle Minimax] Cache lookup/retrieval failed, regenerating...", e);
            // Fall through to generation
        }

        console.log(`[Sparkle Minimax] Request: voiceId="${voiceId}" -> CacheKey="${cacheKey}"`);
        console.log(`[Sparkle Minimax] Generating speech for: "${text.substring(0, 20)}..."`);

        // 2. GENERATE (MiniMax)
        const audioBuffer = await import('../services/minimax.js').then(m => m.minimaxService.generateSpeech(text, voiceId));

        // 3. CACHE (Async upload to not block excessively, but we need URL if we want to return URL next time)
        // For the *first* time, we return the BUFFER so the user gets it fast.
        // We upload in background.

        // Upload wrapper
        (async () => {
            try {
                if (userId) { // cache globally? or per user? Text is personalized usually.
                    // Actually, if text is "Welcome Master", it is specific. 
                    // But if text is "Hello", it's shared.
                    // We'll cache globally by text content.
                    const publicUrl = await adminStorageService.uploadFile(audioBuffer, 'audio/mp3', `tts/minimax/${cacheKey}.mp3`);
                    await databaseService.saveCachedAudio(cacheKey, publicUrl);
                    console.log(`[Sparkle Minimax] Cached entry created: ${cacheKey}`);
                }
            } catch (err) {
                console.error("Background caching failed", err);
            }
        })();

        res.set('Content-Type', 'audio/mp3');
        res.send(audioBuffer);

    } catch (error: any) {
        console.error('Sparkle Minimax Error:', error.message);
        res.status(500).json({ error: 'Minimax generation failed' });
    }
});

/**
 * POST /api/sparkle/speak-premium
 * Premium kid voice with caching (ElevenLabs)
 * Input: { text: string, voiceId?: string, userId: string, cacheKey?: string }
 * Output: { audioUrl: string } or Audio Buffer
 */
router.post('/speak-premium', optionalApiKeyAuth, async (req, res) => {
    try {
        const { text, voiceId = VOICE_IDS.KIKI, userId, cacheKey } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text required' });
        }

        // 1. CHECK CACHE: If we have this audio already, return URL (FREE)
        if (cacheKey && userId) {
            // Check if audio exists in database
            // cacheKey format: "tts_{userId}_{hash(text)}"
            const cachedUrl = await databaseService.getCachedAudio(cacheKey);
            if (cachedUrl) {
                console.log(`[Premium TTS] ✅ Cache HIT: ${cacheKey}`);
                return res.json({ audioUrl: cachedUrl, cached: true });
            }
        }

        // 2. DEDUCT POINTS (Premium costs: 50 base + 1 per 50 chars)
        const estimatedCost = 50 + Math.ceil(text.length / 50);
        const isPreview = userId?.startsWith('admin_') || cacheKey?.startsWith('preview_');

        if (userId && !isPreview) {
            const success = await databaseService.deductCredits(
                userId,
                estimatedCost,
                "Premium Voice (ElevenLabs)",
                "PREMIUM_TTS"
            );
            if (!success) {
                return res.status(402).json({
                    error: 'Insufficient Magic Points for Premium Voice',
                    code: 'INSUFFICIENT_CREDITS'
                });
            }
        }

        // 3. GENERATE AUDIO (PAID)
        console.log(`[Premium TTS] Calling ElevenLabs API...`);
        let audioBuffer: Buffer;

        try {
            audioBuffer = await elevenLabsService.speak(text, voiceId);
        } catch (elevenlabsError: any) {
            // Fallback to OpenAI TTS if ElevenLabs API key is missing
            if (elevenlabsError.message?.includes('API Key missing')) {
                console.warn(`[Premium TTS] ⚠️ ElevenLabs API Key missing, falling back to OpenAI TTS (nova)`);
                audioBuffer = await openAIService.generateSpeech(text);
            } else {
                throw elevenlabsError;
            }
        }

        // 4. UPLOAD TO FIREBASE STORAGE (for caching)
        let audioUrl: string | null = null;
        if (userId && cacheKey) {
            try {
                const storage = getStorage();
                const filename = `tts/${userId}/${cacheKey}.mp3`;
                const storageRef = ref(storage, filename);

                await uploadBytes(storageRef, audioBuffer);
                audioUrl = await getDownloadURL(storageRef);

                // Save to database for future cache lookup
                await databaseService.saveCachedAudio(cacheKey, audioUrl);

                console.log(`[Premium TTS] ✅ Cached to: ${audioUrl}`);
            } catch (uploadError) {
                console.warn("[Premium TTS] Cache upload failed, will return buffer:", uploadError);
            }
        }

        // 5. RETURN: Either URL (if cached) or Buffer (if not)
        if (audioUrl) {
            res.json({ audioUrl, cached: false });
        } else {
            res.set('Content-Type', 'audio/mp3');
            res.send(audioBuffer);
        }

    } catch (error) {
        console.error('Premium TTS Error:', error);

        // REFUND on failure
        if (req.body.userId) {
            const text = req.body.text || "";
            const estimatedCost = 50 + Math.ceil(text.length / 50);
            await databaseService.refundCredits(
                req.body.userId,
                estimatedCost,
                "Premium TTS Failed Refund"
            );
        }

        res.status(500).json({ error: 'Premium TTS failed' });
    }
});

export default router;
