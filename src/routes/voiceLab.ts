import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dashscopeService } from '../services/dashscopeService.js';
import { minimaxService } from '../services/minimax.js';
import { admin, adminDb } from '../services/firebaseAdmin.js';
import { resolveVoiceId } from '../services/qwenVoiceConfig.js';
import { requireAuth } from '../middleware/auth.js';
import { pricingController } from '../controllers/pricingController.js';

const voiceLabRouter = express.Router();

const logDir = path.join(process.cwd(), 'logs');
const debugLog = (filename: string, text: string) => {
    try {
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        fs.appendFileSync(path.join(logDir, filename), text);
    } catch (e) { }
};



// Ensure uploads dir
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
        console.error("Failed to create uploads dir", e);
    }
}

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.wav';
        cb(null, `voice_${Date.now()}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        // accept commonly used audio formats
        cb(null, true);
    }
});

/**
 * GET /api/voice-lab/voices
 * Returns list of custom voices for the user
 */
voiceLabRouter.get('/voices', requireAuth, async (req: any, res) => {
    try {
        const userId = (req.query.userId as string) || req.user?.uid;

        if (!userId) {
            return res.status(401).json({ error: 'User ID is required' });
        }

        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) return res.json({ voices: [] });

        const data = userDoc.data();
        const voices = data?.customVoices || [];
        const myVoiceConfig = data?.myVoiceConfig || null;

        // Backward compatibility: check for old single 'customVoice'
        if (voices.length === 0 && data?.customVoice && data?.customVoice?.status === 'active') {
            voices.push({
                id: data.customVoice.voiceId,
                name: "My Voice",
                voiceId: data.customVoice.voiceId,
                createdAt: data.customVoice.createdAt
            });
        }

        res.json({ voices, myVoiceConfig });
    } catch (error: any) {
        console.error('[VoiceLab] GET /voices error:', error);
        res.status(500).json({ error: 'Failed to fetch voices' });
    }
});

/**
 * POST /api/voice-lab/preview
 * Generates a short preview audio for a voice
 * Body: { text: string, voiceId: string, customVoiceId?: string }
 */
voiceLabRouter.post('/preview', async (req, res) => {
    try {
        const { text, voiceId, customVoiceId, userId } = req.body;
        const previewText = text || "Hello! This is my new magical voice.";

        let resolvedCustomId = customVoiceId;

        // 1b. Lookup "My Voice" from DB if needed
        let pitch = 0;
        let speed = 1.0;

        if ((voiceId === 'my_voice' || voiceId === 'my voice' || voiceId === 'custom_lab') && userId && userId !== 'demo' && userId !== 'guest') {
            try {
                const userDoc = await adminDb.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    // V2.0: Check for matching config
                    if (userData?.myVoiceConfig?.isReady) {
                        resolvedCustomId = userData.myVoiceConfig.archetypeId;
                        pitch = userData.myVoiceConfig.pitch || 0;
                        speed = userData.myVoiceConfig.speed || 1.0;
                        console.log(`[VoiceLab] Resolved 'my_voice' for user ${userId} to ${resolvedCustomId} (p=${pitch}, s=${speed})`);
                    }
                    // Legacy fallback
                    else if (userData?.customVoice?.voiceId && userData?.customVoice?.status === 'active') {
                        resolvedCustomId = userData.customVoice.voiceId;
                        console.log(`[VoiceLab] Resolved 'my_voice' (Legacy) for user ${userId} to ${resolvedCustomId}`);
                    }
                }
            } catch (dbErr) {
                console.warn("[VoiceLab] Failed to lookup custom voice:", dbErr);
            }
        }

        // Resolve target ID (Custom or Standard)
        let rawTargetId = resolvedCustomId || voiceId;

        // Enhance resolution using Qwen Config (handles 'my_voice' -> default fallback)
        const targetVoiceId = resolveVoiceId(rawTargetId);

        // DEBUG: Log resolution to file (Absolute Path)
        try {
            debugLog('voice_debug.log', `[${new Date().toISOString()}] Raw: '${rawTargetId}' | Resolved: '${targetVoiceId}' | IsCustom: ${targetVoiceId.startsWith('v')}\n`);
        } catch (e) { }

        console.log(`[VoiceLab] DEBUG: RawID='${rawTargetId}' -> ResolvedID='${targetVoiceId}'`);
        console.log(`[VoiceLab] DEBUG: isQwenCustom check: StartsWithV=${targetVoiceId.startsWith('v')} | IncludesVoice=${targetVoiceId.includes('voice_')}`);

        console.log(`[VoiceLab] Generating preview for: ${targetVoiceId} (Raw: ${rawTargetId})`);

        // --- CACHING LOGIC ---
        // Create hash from text + voiceId to use as filename
        const crypto = await import('crypto');
        const hash = crypto.createHash('md5').update(`${targetVoiceId}-${previewText}-v2`).digest('hex'); // Bumped cache version
        const cacheDir = path.join(process.cwd(), 'client', 'public', 'assets', 'generated_previews');
        const fileName = `preview_${hash}.mp3`;
        const filePath = path.join(cacheDir, fileName);

        // Ensure cache directory exists
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }

        // Check if cached file exists
        // Check if cached file exists
        if (fs.existsSync(filePath)) {
            console.log(`[VoiceLab] Serving cached preview (Bridge Mode): ${fileName}`);

            // BRIDGE MODE CACHE HIT: Upload cached file to Storage and return URL
            const cachedBuffer = fs.readFileSync(filePath);
            const { adminStorageService } = await import('../services/adminStorage.js');
            const publicUrl = await adminStorageService.uploadFile(cachedBuffer, 'audio/mp3', 'voice_previews');

            res.json({
                success: true,
                audioUrl: publicUrl,
                cached: true
            });
            return;
        }

        // Generate Audio (If not cached)
        console.log(`[VoiceLab] Generating new preview for ${targetVoiceId}...`);

        let audioBuffer: Buffer;

        // Detect Provider based on ID patterns
        // Qwen Custom: Starts with 'v' (v123abc...)
        // Qwen Standard: aiden, ryan, mochi, cherry, serena, eric
        // MiniMax Custom: custom_...
        const qwenStandardList = ['aiden', 'ryan', 'mochi', 'cherry', 'serena', 'eric'];
        const isQwenStandard = qwenStandardList.includes(targetVoiceId.toLowerCase());

        // Fix: Exclude 'custom_' (MiniMax) from Qwen detection, even if long
        const isMiniMaxCustom = targetVoiceId.startsWith('custom_');
        const isQwenCustom = !isMiniMaxCustom && (targetVoiceId.startsWith('v') || targetVoiceId.includes('qwen-tts') || targetVoiceId.length > 25);

        if (isQwenStandard || isQwenCustom) {
            console.log(`[VoiceLab] Using Qwen TTS (CosyVoice) for preview...`);
            console.log(`[VoiceLab] Voice ID for API: ${targetVoiceId}`);

            try {
                // Attempt 1: High Quality (CosyVoice V3 Plus)
                audioBuffer = await dashscopeService.generateSpeech({
                    text: previewText,
                    voice: targetVoiceId, // Use FULL voice ID
                    format: 'mp3',
                    // model defaults to 'cosyvoice-v3-plus' via implementation in service
                });
            } catch (err: any) {
                console.error(`[VoiceLab] Qwen TTS (Plus) Failed for ${targetVoiceId}. Error: ${err.message}. Retrying with Flash...`);

                try {
                    // Attempt 2: Flash (CosyVoice V3 Flash) - Faster/Cheaper but still custom
                    audioBuffer = await dashscopeService.generateSpeech({
                        text: previewText,
                        voice: targetVoiceId, // Use FULL voice ID
                        format: 'mp3',
                        model: 'cosyvoice-v3-flash'
                    } as any);
                    console.log(`[VoiceLab] Flash fallback successful for ${targetVoiceId}`);
                } catch (flashErr: any) {
                    console.error(`[VoiceLab] Qwen TTS (Flash) Failed for ${targetVoiceId}. Error: ${flashErr.message}. Falling back to Aiden...`);

                    // Attempt 3: Aiden (Safety Net)
                    audioBuffer = await dashscopeService.generateSpeech({
                        text: previewText,
                        voice: 'aiden',
                        format: 'mp3'
                    });
                }
            }
        } else {
            console.log(`[VoiceLab] Using MiniMax TTS (Legacy) for ${targetVoiceId} (p=${pitch}, s=${speed})...`);
            try {
                audioBuffer = await minimaxService.generateSpeech(previewText, targetVoiceId, pitch, speed);
            } catch (err: any) {
                console.error(`[VoiceLab] MiniMax TTS Failed for ${targetVoiceId}. Falling back to Qwen (Aiden)...`);

                // DEBUG: Write error to file (Absolute Path)
                debugLog('voice_error.log', `[${new Date().toISOString()}] Provider: QWEN | Voice: ${targetVoiceId} | Error: ${err.message}\n`);

                // Fallback to Qwen Aiden if legacy MiniMax fails (e.g. invalid ID)
                audioBuffer = await dashscopeService.generateSpeech({
                    text: previewText,
                    voice: 'aiden',
                    format: 'mp3'
                });
            }
        }

        // Save to cache
        try {
            fs.writeFileSync(filePath, audioBuffer);
            console.log(`[VoiceLab] Cached preview saved: ${fileName}`);
        } catch (cacheErr) {
            console.error("[VoiceLab] Failed to cache file:", cacheErr);
        }

        // FABRICATED BRIDGE MODE: Upload to Firebase Storage
        const { adminStorageService } = await import('../services/adminStorage.js');
        const publicUrl = await adminStorageService.uploadFile(audioBuffer, 'audio/mp3', 'voice_previews');

        console.log(`[VoiceLab] Bridge Mode: Uploaded preview to ${publicUrl}`);

        res.json({
            success: true,
            audioUrl: publicUrl,
            cached: false
        });

    } catch (error: any) {
        const errorLog = `[VoiceLab] Preview Error: ${error.message}\nStack: ${error.stack}\n`;
        console.error(errorLog);
        res.status(500).json({
            error: 'Preview generation failed: ' + error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

/**
 * POST /api/voice-lab/clone
 * V2.0: AI Matching Phase
 * Automatically matches user audio to one of 10 archetypes.
 */
voiceLabRouter.post('/clone', upload.single('audio'), async (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        const userId = req.body.userId || 'anonymous';
        const transcript = req.body.transcript || '';

        console.log(`[VoiceLab] V2.0 Matching Phase for User ${userId}...`);

        // 1. AI Analysis & Matching (Brain)
        const { openAIService } = await import('../services/openai.js');
        const archetypes = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/voiceArchetypes.json'), 'utf-8'));

        const prompt = `
Analyze this transcript: "${transcript}"
Based on the text and the 10 available voice archetypes, select the MOST appropriate one for the user.
Archetypes: ${JSON.stringify(archetypes)}

Rules:
1. Select one archetypeId.
2. Provide a pitch offset (-5 to 5) to fine-tune the voice.
3. Provide a speed multiplier (0.8 to 1.2).
4. Return JSON only.
`;

        const systemPrompt = "You are an expert audio engineer. Map user text/intent to the best matching voice archetype and provide fine-tuning parameters.";

        const matchingResult = await openAIService.generateJSON(prompt, systemPrompt);
        console.log(`[VoiceLab] Matching Result:`, matchingResult);

        const myVoiceConfig = {
            archetypeId: matchingResult.archetypeId || 'female-shaonv',
            pitch: matchingResult.pitch || 0,
            speed: matchingResult.speed || 1.0,
            isReady: true,
            updatedAt: new Date().toISOString()
        };

        // 2. Persist to User Profile
        if (userId !== 'anonymous' && userId !== 'demo') {
            await adminDb.collection('users').doc(userId).update({
                myVoiceConfig: myVoiceConfig
            });
            console.log(`[VoiceLab] Saved myVoiceConfig for user ${userId}`);
        }

        // Cleanup
        if (req.file.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }

        res.json({
            success: true,
            isReady: true,
            config: myVoiceConfig,
            message: 'Voice matched and saved successfully!'
        });

    } catch (error: any) {
        console.error('[VoiceLab] Matching Error:', error);
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

/**
 * DELETE /api/voice-lab/voices/:voiceId
 * Deletes a custom voice
 */
voiceLabRouter.delete('/voices/:voiceId', requireAuth, async (req: any, res) => {
    try {
        const { voiceId } = req.params;
        const userId = (req.query.userId as string) || req.user?.uid;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log(`[VoiceLab] Deleting voice ${voiceId} for user ${userId}`);

        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const customVoices = userData?.customVoices || [];

        // Find the voice to remove
        const voiceToRemove = customVoices.find((v: any) => v.id === voiceId || v.voiceId === voiceId);

        if (!voiceToRemove) {
            return res.status(404).json({ error: 'Voice not found' });
        }

        // Update Firestore
        await userRef.update({
            customVoices: admin.firestore.FieldValue.arrayRemove(voiceToRemove)
        });

        // Also check if it was the legacy 'customVoice' field
        if (userData?.customVoice?.id === voiceId || userData?.customVoice?.voiceId === voiceId) {
            await userRef.update({
                customVoice: admin.firestore.FieldValue.delete()
            });
        }

        res.json({ success: true, message: 'Voice deleted successfully' });
    } catch (error: any) {
        console.error('[VoiceLab] Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete voice' });
    }
});

export default voiceLabRouter;
