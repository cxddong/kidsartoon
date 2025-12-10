import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from '../services/gemini.js';
import { databaseService } from '../services/database.js';
import { doubaoService } from '../services/doubao.js';
import { xunfeiTTS } from '../services/xunfei.js';

export const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// 1. Analyze Image
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

// 2. Generate Story
router.post('/generate-story', async (req, res) => {
    try {
        const { analysis, lang = 'en', userId } = req.body;
        res.json({ story: "Please use orchestrator endpoint" });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Story to Audio
router.post('/story-to-audio', async (req, res) => {
    res.json({ audioUrl: null });
});


// 4. Orchestrator (Image -> Audio Story)
router.post('/create-story-from-image', upload.single('image'), async (req, res) => {
    try {
        const userId = req.body.userId || 'anonymous';
        const lang = (req.query.lang as string) || req.body.lang || 'en';

        console.log(`[StoryOrchestrator] Starting flow. Lang: ${lang}`);

        let base64Image = '';
        if (req.file) {
            base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        } else {
            return res.status(400).json({ error: "No image file provided" });
        }

        // --- UNIFIED PIPELINE (Doubao for All Languages) ---
        // Gemini is blocked, so we use Doubao for English too.

        console.log(`[StoryOrchestrator] Starting Unified Pipeline (Lang: ${lang})`);

        // 1. Image Interpretation (Doubao Vision)
        console.log('[StoryOrchestrator] Interpreting image...');
        const visionPrompt = lang === 'en'
            ? "Describe the characters, visual style, atmosphere, and key objects in this image for a children's story."
            : "请详细描述这张图片中的画面内容，包括场景、人物、动作和氛围。";

        const imageDescription = await doubaoService.analyzeImage(base64Image, visionPrompt);
        console.log('[StoryOrchestrator] Interpretation:', imageDescription.substring(0, 50) + '...');

        // 2. Story Generation (Doubao Text)
        console.log('[StoryOrchestrator] Generating story...');

        // Define Prompt based on language
        let userPromptText = '';
        if (lang === 'zh') {
            userPromptText = `
            【任务】你是专业的儿童绘本作家。请根据【参考图片解读】创作一个温馨、有趣的中文睡前故事。
            【参考图片解读】：${imageDescription}
            【写作要求】：
            1. 必须深刻结合上述图片内容。
            2. 语言生动活泼，适合6-10岁儿童阅读。
            3. 篇幅约300字。
            4. 必须有一个温馨的结尾。
            5. 直接输出故事内容，不要标题。
            `;
        } else {
            // English Prompt
            userPromptText = `
            [Task] You are a professional children's story writer. Create a warm, engaging bedtime story based on the [Image Context].
            [Image Context]: ${imageDescription}
            [Requirements]:
            1. Strictly base the story on the image details.
            2. Lively language, suitable for 6-10 year olds.
            3. Length: Approx 200-300 words.
            4. Warm ending.
            5. Output story text only, no titles.
            `;
        }

        // Use Doubao to generate raw story text (not JSON) for the audio pipeline
        // (Note: The user's original request implies generating a *Story* (Text) for audio, 
        //  but the JSON logic in DoubaoService was for 4-panel comics. 
        //  Here we need simple text for the "Audio Story" feature specifically.)

        const story = await doubaoService.generateStory(userPromptText);
        console.log(`[StoryOrchestrator] Story generated (${story.length} chars)`);

        // 3. Save to DB (Perform BEFORE Audio to guarantee history logic)
        console.log('[StoryOrchestrator] Saving preliminary record...');
        try {
            const summary = imageDescription ? imageDescription.substring(0, 100) : "Story generated from image";
            const initialUrl = "https://placehold.co/600x400?text=Generating+Audio...";

            // Format for DB (Analysis structure)
            const analysisObj = { summary: imageDescription, story };

            await databaseService.saveImageRecord(userId, initialUrl, 'story', summary, { story, analysis: analysisObj });
            if (userId !== 'anonymous') await databaseService.awardPoints(userId, 15, 'story');
            console.log('[StoryOrchestrator] DB Save Success');
        } catch (dbErr) { console.error('DB Save Failed:', dbErr); }

        // 4. Audio Generation (Select Engine)
        console.log('[StoryOrchestrator] Generating audio...');
        let audioUrl = null;
        try {
            let audioPath: string;
            const id = uuidv4();
            const fs = await import('fs');
            const path = await import('path');
            const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
            if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

            // New Xunfei implementation uses WAV by default (raw)
            const filename = `audio-story-${lang}-${id}.wav`;
            const outputPath = path.join(outputDir, filename);

            if (lang === 'zh') {
                console.log('[TTS] Using Xunfei (ZH)');
                // Pass text and outputPath
                audioPath = await xunfeiTTS(story, outputPath);
            } else {
                console.log('[TTS] Using Xunfei (EN)');
                audioPath = await xunfeiTTS(story, outputPath);
            }

            audioUrl = `/generated/${filename}`;
            console.log('[StoryOrchestrator] Audio generated successfully:', audioUrl);

        } catch (ttsErr: any) {
            console.error('TTS Generation FAILURE (Returning Story Only):', ttsErr);
            // Non-blocking failure: return story without audio
            audioUrl = null;
        }

        return res.json({
            analysis: { summary: imageDescription },
            story,
            audioUrl
        });

    } catch (error: any) {
        console.error('Orchestrator Failed:', error);
        res.status(500).json({ error: error.message });
    }
});
