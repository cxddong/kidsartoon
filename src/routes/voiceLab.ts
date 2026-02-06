import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dashscopeService } from '../services/dashscopeService';
import { minimaxService } from '../services/minimax';
import { admin, adminDb } from '../services/firebaseAdmin';
import { resolveVoiceId } from '../services/qwenVoiceConfig';
import { requireAuth } from '../middleware/auth';
import { pricingController } from '../controllers/pricingController';

const voiceLabRouter = express.Router();



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

        // Backward compatibility: check for old single 'customVoice'
        if (voices.length === 0 && data?.customVoice && data?.customVoice?.status === 'active') {
            voices.push({
                id: data.customVoice.voiceId, // Use voiceId as ID
                name: "My Voice",
                voiceId: data.customVoice.voiceId,
                createdAt: data.customVoice.createdAt
            });
        }

        res.json({ voices });
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
        if ((voiceId === 'my_voice' || voiceId === 'my voice') && !resolvedCustomId && userId && userId !== 'demo' && userId !== 'guest') {
            try {
                const userDoc = await adminDb.collection('users').doc(userId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData?.customVoice?.voiceId && userData?.customVoice?.status === 'active') {
                        resolvedCustomId = userData.customVoice.voiceId;
                        console.log(`[VoiceLab] Resolved 'my_voice' for user ${userId} to ${resolvedCustomId}`);
                    } else {
                        console.warn(`[VoiceLab] User ${userId} requested 'my_voice' but has no active custom voice.`);
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
            const fs = require('fs');
            const logPath = 'd:/KAT/KAT/logs/voice_debug.log';
            const logMsg = `[${new Date().toISOString()}] Raw: '${rawTargetId}' | Resolved: '${targetVoiceId}' | IsCustom: ${targetVoiceId.startsWith('v')}\n`;
            fs.appendFileSync(logPath, logMsg);
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
        if (fs.existsSync(filePath)) {
            console.log(`[VoiceLab] Serving cached preview: ${fileName}`);
            // Stream the file
            const stat = fs.statSync(filePath);
            res.writeHead(200, {
                'Content-Type': 'audio/mp3',
                'Content-Length': stat.size
            });
            const readStream = fs.createReadStream(filePath);
            readStream.pipe(res);
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
            console.log(`[VoiceLab] Using MiniMax TTS (Legacy)...`);
            try {
                audioBuffer = await minimaxService.generateSpeech(previewText, targetVoiceId);
            } catch (err: any) {
                console.error(`[VoiceLab] MiniMax TTS Failed for ${targetVoiceId}. Falling back to Qwen (Aiden)...`);

                // DEBUG: Write error to file (Absolute Path)
                // DEBUG: Write error to file (Absolute Path)
                try {
                    const logPath = 'd:/KAT/KAT/logs/voice_error.log';
                    const logMsg = `[${new Date().toISOString()}] Provider: QWEN | Voice: ${targetVoiceId} | Error: ${err.message}\n`;
                    if (!fs.existsSync('d:/KAT/KAT/logs')) fs.mkdirSync('d:/KAT/KAT/logs');
                    fs.appendFileSync(logPath, logMsg);
                } catch (e) { console.error("Log failed", e); }

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

        res.set({
            'Content-Type': 'audio/mp3',
            'Content-Length': audioBuffer.length
        });
        res.send(audioBuffer);

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
 * Registers a new custom voice
 * Uses Multer to handle file upload
 */
voiceLabRouter.post('/clone', upload.single('audio'), async (req: any, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        const userId = req.body.userId || 'anonymous'; // Passed in FormData
        const transcript = req.body.transcript || '';
        const voiceName = req.body.voiceName || 'My Voice';
        const provider = req.body.provider || 'minimax'; // 'minimax' | 'qwen'

        // DEBUG: File Log
        try {
            if (!fs.existsSync('d:/KAT/KAT/logs')) fs.mkdirSync('d:/KAT/KAT/logs');
            fs.appendFileSync('d:/KAT/KAT/logs/clone_debug.log', `[${new Date().toISOString()}] Clone Request: User=${userId}, Name=${voiceName}, Provider=${provider}\n`);
            if (req.file) {
                fs.appendFileSync('d:/KAT/KAT/logs/clone_debug.log', `[${new Date().toISOString()}] File: ${req.file.path}, Size=${req.file.size}\n`);
            } else {
                fs.appendFileSync('d:/KAT/KAT/logs/clone_debug.log', `[${new Date().toISOString()}] NO FILE UPLOADED\n`);
            }
        } catch (e) { }

        console.log(`[VoiceLab] Cloning voice '${voiceName}' for User ${userId}... Provider: ${provider}`);
        console.log(`[VoiceLab] File: ${req.file.path} (${req.file.size} bytes)`);

        // 0. Check Balance using Pricing Controller
        let cost = 0;
        let isAdmin = false;

        if (userId !== 'anonymous' && userId !== 'demo') {
            const userRef = adminDb.collection('users').doc(userId);
            const userDoc = await userRef.get();
            const userData = userDoc.data();
            const currentGems = userData?.gems || 0;
            const userPlan = userData?.plan || 'free';
            const userEmail = userData?.email || '';

            // Calculate Dynamic Cost
            cost = await pricingController.getVoiceCloningCost(userId);

            console.log(`[VoiceLab] Pricing Check - User: ${userId}, Plan: ${userPlan}, Gems: ${currentGems}, Cost: ${cost}`);

            // Admin Override
            isAdmin = ['admin', 'yearly_pro'].includes(userPlan) || userEmail.includes('cxddong');

            if (isAdmin) cost = 0; // Force zero cost for admins to bypass transaction checks

            // If cost is 0, we treat it as "free/admin" logic in valid check
            if (!isAdmin && cost > 0 && currentGems < cost) {
                console.warn(`[VoiceLab] Cloning denied. Insufficient gems.`);
                // Cleanup file
                try { fs.unlinkSync(req.file.path); } catch (e) { }
                return res.status(403).json({ error: `Insufficient Gems. Cost: ${cost}, Balance: ${currentGems}` });
            }
        }

        let voiceId = '';

        if (provider === 'qwen') {
            // --- QWEN FLOW ---
            console.log(`[VoiceLab] Using Qwen Provider...`);
            try {
                // Call DashScope Service
                // Note: Qwen enrollment handles conversion internally if needed, but accepts WAV best.
                // We pass the raw uploaded file path.
                const vid = await dashscopeService.registerCustomVoice(req.file.path, userId, transcript, 'en');
                voiceId = vid;
                console.log(`[VoiceLab] Qwen Enrollment Success! User-facing VoiceID: ${voiceId}`);

            } catch (e: any) {
                console.error("[VoiceLab] Qwen Enrollment Failed:", e);
                // Cleanup
                if (req.file.path && fs.existsSync(req.file.path)) {
                    try { fs.unlinkSync(req.file.path); } catch (cleanupErr) { }
                }
                return res.status(500).json({ error: 'Qwen Enrollment failed: ' + e.message });
            }

        } else {
            // --- MINIMAX FLOW (Legacy) ---
            // 1. Convert WebM to MP3 (MiniMax requires mp3/wav/m4a)
            console.log(`[VoiceLab] Transcoding ${req.file.path} to MP3 for MiniMax...`);
            let uploadFilePath = req.file.path;
            let isTempFile = false;

            try {
                uploadFilePath = await dashscopeService.convertAudioToMp3(req.file.path);
                isTempFile = true;
                console.log(`[VoiceLab] Transcoded to: ${uploadFilePath}`);
            } catch (e) {
                console.error("Transcoding failed, trying original file:", e);
            }

            // 2. Call MiniMax Service
            console.log(`[VoiceLab] Uploading to MiniMax...`);
            let fileId;
            try {
                fileId = await minimaxService.uploadFile(uploadFilePath, 'voice_clone');
            } catch (e: any) {
                if (isTempFile && fs.existsSync(uploadFilePath)) fs.unlinkSync(uploadFilePath);
                throw e;
            } finally {
                // Clean up temp mp3 if we created one
                if (isTempFile && fs.existsSync(uploadFilePath)) {
                    fs.unlinkSync(uploadFilePath);
                }
            }

            console.log(`[VoiceLab] File Uploaded. ID: ${fileId}`);

            // Generate a random voice ID or let MiniMax handle it? 
            const newVoiceId = `custom_${userId}_${Date.now()}`;

            console.log(`[VoiceLab] Cloning with ID: ${newVoiceId}...`);
            await minimaxService.createVoiceClone(fileId, newVoiceId);

            voiceId = newVoiceId;
        }

        console.log(`[VoiceLab] Final Success! New Voice ID: ${voiceId} (Provider: ${provider})`);

        // 2. Persist to Firebase (if real user)
        if (userId !== 'anonymous') {
            try {
                const userRef = adminDb.collection('users').doc(userId);

                // Transaction to deduct gems and add voice
                await adminDb.runTransaction(async (t) => {
                    const doc = await t.get(userRef);
                    const data = doc.data();
                    const currentGems = data?.gems || 0;

                    // Recalculate cost inside transaction for safety
                    const newBalance = currentGems - cost;

                    // Double check balance inside transaction
                    if (newBalance < 0) {
                        throw new Error("Insufficient funds during transaction");
                    }

                    const newVoice = {
                        id: voiceId,
                        name: voiceName,
                        voiceId: voiceId,
                        provider: provider, // Save provider info
                        createdAt: new Date().toISOString(),
                        status: 'active'
                    };

                    t.update(userRef, {
                        gems: newBalance,
                        customVoices: admin.firestore.FieldValue.arrayUnion(newVoice),
                        // Keep legacy field updated with LATEST voice for backward compat
                        customVoice: newVoice
                    });
                });

            } catch (e: any) {
                console.error("DB Update failed:", e);
                if (e.message === "Insufficient funds during transaction") {
                    return res.status(403).json({ error: 'Insufficient Gems.' });
                }
            }
        }

        // Cleanup uploaded original file
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }

        // Return valid voice object for frontend optimistic update
        const newVoiceObj = {
            id: voiceId,
            name: voiceName,
            voiceId: voiceId,
            provider: provider,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        res.json({ success: true, voiceId, provider, voice: newVoiceObj, message: 'Voice cloned successfully!' });

    } catch (error: any) {
        console.error('[VoiceLab] Error:', error);

        // Cleanup file if it still exists
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
