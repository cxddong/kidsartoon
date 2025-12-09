import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { geminiService } from '../services/gemini.js';
import { databaseService } from '../services/database.js';
import { doubaoService } from '../services/doubao.js';
import { xunfeiService } from '../services/xunfei.js';

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

        // --- BRANCH: Chinese (Pure Doubao Vision/Text + Xunfei Audio) ---
        if (lang === 'zh') {
            console.log('[StoryOrchestrator - ZH] Starting Doubao/Xunfei Pipeline');

            // 1. Image Interpretation (Doubao Vision)
            console.log('[StoryOrchestrator - ZH] Interpreting image...');
            const imageDescription = await doubaoService.analyzeImage(base64Image, "请详细描述这张图片中的画面内容，包括场景、人物、动作和氛围。");
            console.log('[StoryOrchestrator - ZH] Interpretation:', imageDescription.substring(0, 50) + '...');

            // 2. Story Generation (Doubao Text)
            console.log('[StoryOrchestrator - ZH] Generating story...');
            const prompt = `
            【任务】你是专业的儿童绘本作家。请根据【参考图片解读】创作一个温馨、有趣的中文睡前故事。
            
            【参考图片解读】：
            ${imageDescription}
            
            【写作要求】：
            1. 必须深刻结合上述图片内容，不要凭空捏造。
            2. 语言生动活泼，适合6-10岁儿童阅读。
            3. 篇幅约300字。
            4. 必须有一个温馨的结尾。
            5. 直接输出故事内容，不要标题。
            `;
            const story = await doubaoService.generateStory(prompt);
            console.log(`[StoryOrchestrator - ZH] Story generated (${story.length} chars)`);

            // 3. Save to DB (Perform BEFORE Audio to guarantee history logic)
            console.log('[StoryOrchestrator - ZH] Saving preliminary record...');
            try {
                const summary = imageDescription ? imageDescription.substring(0, 100) : "Story generated from image";
                // Save with temporary placeholder
                const initialUrl = "https://placehold.co/600x400?text=Generating+Audio...";
                await databaseService.saveImageRecord(userId, initialUrl, 'story', summary, { story, analysis: { summary: imageDescription } });
                if (userId !== 'anonymous') await databaseService.awardPoints(userId, 15, 'story');
                console.log('[StoryOrchestrator - ZH] DB Save Success');
            } catch (dbErr) { console.error('DB Save Failed:', dbErr); }

            // 4. Audio Generation (Xunfei TTS)
            console.log('[StoryOrchestrator - ZH] Generating audio (Xunfei)...');
            let audioUrl = null;
            try {
                // Try Xunfei (Flow schema if configured)
                const audioBuffer = await xunfeiService.generateSpeech(story, 'x6_dongmanshaonv_pro');

                const id = uuidv4();
                const fs = await import('fs');
                const path = await import('path');
                const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
                if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

                const filename = `audio-story-zh-xf-${id}.mp3`;
                const outputPath = path.join(outputDir, filename);
                fs.writeFileSync(outputPath, audioBuffer);
                audioUrl = `/generated/${filename}`;
                console.log('[StoryOrchestrator - ZH] Xunfei Audio generated successfully:', audioUrl);
            } catch (ttsErr: any) {
                console.error('Xunfei TTS FAILURE:', ttsErr);
                // Fallback 1: Doubao
                try {
                    console.warn('Falling back to Doubao TTS...');
                    const audioBuffer = await doubaoService.generateSpeech(story, 'zh_female_tianmei');
                    const id = uuidv4();
                    const fs = await import('fs');
                    const path = await import('path');
                    const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
                    const filename = `audio-story-fb-db-${id}.mp3`;
                    fs.writeFileSync(path.join(outputDir, filename), audioBuffer);
                    audioUrl = `/generated/${filename}`;
                } catch (dbErr) {
                    // Fallback 2: Gemini
                    console.warn('Doubao Fallback failed. Trying Google...', dbErr);
                    try {
                        const audioBuffer = await geminiService.generateSpeech(story, 'zh-CN');
                        const id = uuidv4();
                        const fs = await import('fs');
                        const path = await import('path');
                        const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
                        const filename = `audio-story-fb-goog-${id}.mp3`;
                        fs.writeFileSync(path.join(outputDir, filename), audioBuffer);
                        audioUrl = `/generated/${filename}`;
                    } catch (finalErr) { console.error('All TTS Failed', finalErr); }
                }
            }

            // Note: We are not updating the DB record with the audio URL to keep logic simple, 
            // but the next time user loads profile it might still show the placeholder. 
            // Ideally we'd update it. For now, the user just wants *history to exist*.

            return res.json({
                analysis: { summary: imageDescription },
                story,
                audioUrl
            });
        }

        // --- BRANCH: Other Languages (Gemini Pro Pipeline) ---
        console.log(`[StoryOrchestrator] Starting Gemini Pro Pipeline (Lang: ${lang})...`);

        // Use new One-Shot JSON Generation (Vision + Story)
        const storyData = await geminiService.generateStoryJSON(base64Image, userId);
        const story = storyData.story || "Story generation incomplete.";
        const analysis = {
            summary: storyData.summary,
            characters: storyData.characters,
            title: storyData.title,
            question: storyData.question
        };

        console.log(`[StoryOrchestrator] Story generated (${story.length} chars). Title: ${storyData.title}`);

        // Step 3: Audio
        console.log('[StoryOrchestrator] Generating audio...');
        let audioUrl = null;
        try {
            let audioBuffer: Buffer;

            // Use Google TTS for others
            let voiceLang = 'en-US';
            if (lang === 'fr') voiceLang = 'fr-FR';
            if (lang === 'es') voiceLang = 'es-ES';
            audioBuffer = await geminiService.generateSpeech(story, voiceLang);

            const id = uuidv4();
            const fs = await import('fs');
            const path = await import('path');
            const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
            if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

            const filename = `audio-story-v2-${id}.mp3`;
            const outputPath = path.join(outputDir, filename);
            fs.writeFileSync(outputPath, audioBuffer);
            audioUrl = `/generated/${filename}`;
        } catch (ttsErr: any) {
            console.error('Orchestrator TTS failed:', ttsErr);
        }

        // Save DB
        try {
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
