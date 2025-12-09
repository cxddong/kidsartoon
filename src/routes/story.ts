import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from '../services/gemini.js';
import { databaseService } from '../services/database.js';

export const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Analyze Image (Visual -> Structured Data)
router.post('/analyze-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        const analysis = await geminiService.analyzeImageJSON(base64Image);

        res.json({ analysis });
    } catch (error: any) {
        console.error('Analysis failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Generate Story (Structured Data -> Story Text)
router.post('/generate-story', async (req, res) => {
    try {
        const { analysis, lang = 'en', userId } = req.body;

        // Construct detailed prompt based on analysis
        let prompt = '';
        const details = `
        Characters: ${analysis.characters.join(', ')}
        Setting: ${analysis.setting}
        Action: ${analysis.summary}
        Hint: ${analysis.storyHint}
        `;

        if (lang === 'zh') {
            prompt = `
            Role: Professional children's story writer.
            Task: Write a warm, engaging story (in Simplified Chinese) based on these details:
            ${details}
            Requirements:
            - Age group: 6-10 years old.
            - Length: Approx 300 words.
            - Tone: Happy, magical, positive.
            - Output: Plain text story only. No title.
            `;
        } else if (lang === 'fr') {
            prompt = `
            Role: Professional French children's story writer.
            Task: Write a warm, engaging story (in French) based on these details:
            ${details}
            Requirements:
            - Age group: 6-10 years old.
            - Length: Approx 200 words.
            - Tone: Happy, magical, positive.
            - Output: Plain text story only. No title.
            `;
        } else if (lang === 'es') {
            prompt = `
            Role: Professional Spanish children's story writer.
            Task: Write a warm, engaging story (in Spanish) based on these details:
            ${details}
            Requirements:
            - Age group: 6-10 years old.
            - Length: Approx 200 words.
            - Tone: Happy, magical, positive.
            - Output: Plain text story only. No title.
            `;
        } else {
            prompt = `
            Role: Professional children's story writer.
            Task: Write a warm, engaging story (in English) based on these details:
            ${details}
            Requirements:
            - Age group: 6-10 years old.
            - Length: Approx 300 words.
            - Tone: Happy, magical, positive.
            - Output: Plain text story only. No title.
            `;
        }

        const story = await geminiService.generateText(prompt, userId || 'anonymous');
        res.json({ story });

    } catch (error: any) {
        console.error('Story Gen failed:', error);
        res.status(500).json({ error: error.message });
    }
});

// 3. Story to Audio (Text -> MP3)
router.post('/story-to-audio', async (req, res) => {
    try {
        const { story, lang = 'en' } = req.body;

        // Map lang to Google TTS codes
        let voiceLang = 'en-US';
        if (lang === 'zh') voiceLang = 'zh-CN';
        if (lang === 'fr') voiceLang = 'fr-FR';
        if (lang === 'es') voiceLang = 'es-ES';

        const audioBuffer = await geminiService.generateSpeech(story, voiceLang);

        // Save file
        const id = uuidv4();
        const fs = await import('fs');
        const path = await import('path');
        const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

        const filename = `audio-story-${id}.mp3`;
        const outputPath = path.join(outputDir, filename);
        fs.writeFileSync(outputPath, audioBuffer);

        res.json({ audioUrl: `/generated/${filename}` });

    } catch (error: any) {
        console.error('TTS failed:', error);
        // Soft fail - return null audio
        res.json({ audioUrl: null, error: error.message });
    }
});


// 4. Orchestrator (Image -> Audio Story)
router.post('/create-story-from-image', upload.single('image'), async (req, res) => {
    try {
        const userId = req.body.userId || 'anonymous';
        const lang = (req.query.lang as string) || req.body.lang || 'en';

        console.log(`[StoryOrchestrator] Starting flow. Lang: ${lang}`);

        // Step 1: Analyze
        let base64Image = '';
        if (req.file) {
            base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        } else {
            return res.status(400).json({ error: "No image file provided" });
        }

        console.log('[StoryOrchestrator] Analysing image...'); // Debug log
        const analysis = await geminiService.analyzeImageJSON(base64Image);
        console.log('[StoryOrchestrator] Analysis:', JSON.stringify(analysis));

        // Step 2: Generate Story
        console.log('[StoryOrchestrator] Generating story...');
        // Reuse logic from generate-story but internal
        // (Copy-paste logic for robustness to avoid internal http calls overhead/complexity)

        let prompt = '';
        const details = `
        Characters: ${analysis.characters?.join(', ') || 'Unknown'}
        Setting: ${analysis.setting || 'Unknown'}
        Action: ${analysis.summary || 'Unknown'}
        Hint: ${analysis.storyHint || 'A fun story'}
        `;

        if (lang === 'zh') {
            prompt = `Write a 500-character children's story (Chinese) based on: ${details}. Warm, happy tone.`;
        } else if (lang === 'fr') {
            prompt = `Write a 200-word children's story (French) based on: ${details}. Warm, happy tone.`;
        } else if (lang === 'es') {
            prompt = `Write a 200-word children's story (Spanish) based on: ${details}. Warm, happy tone.`;
        } else {
            prompt = `Write a 300-word children's story (English) based on: ${details}. Warm, happy tone.`;
        }

        const story = await geminiService.generateText(prompt, userId);
        console.log(`[StoryOrchestrator] Story generated (${story.length} chars)`);

        // Step 3: Audio
        console.log('[StoryOrchestrator] Generating audio...');
        let audioUrl = null;
        try {
            let voiceLang = 'en-US';
            if (lang === 'zh') voiceLang = 'zh-CN';
            if (lang === 'fr') voiceLang = 'fr-FR';
            if (lang === 'es') voiceLang = 'es-ES';

            const audioBuffer = await geminiService.generateSpeech(story, voiceLang);

            const id = uuidv4();
            const fs = await import('fs');
            const path = await import('path');
            const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
            if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

            const filename = `audio-story-v2-${id}.mp3`;
            const outputPath = path.join(outputDir, filename);
            fs.writeFileSync(outputPath, audioBuffer);
            audioUrl = `/generated/${filename}`;
        } catch (ttsErr) {
            console.error('Orchestrator TTS failed:', ttsErr);
        }

        // Save DB
        try {
            // Using placeholder for visual if needed, but we have audioUrl
            const recordUrl = audioUrl || "https://placehold.co/600x400?text=Story+Audio+Failed";
            await databaseService.saveImageRecord(userId, recordUrl, 'story', analysis.summary, { story, analysis });
            if (userId !== 'anonymous') await databaseService.awardPoints(userId, 15, 'story');
        } catch (dbErr) { console.error('DB Save Failed', dbErr); }


        res.json({
            analysis,
            story,
            audioUrl
        });

    } catch (error: any) {
        console.error('Orchestrator Failed:', error);
        res.status(500).json({ error: error.message });
    }
});
