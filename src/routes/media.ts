
import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { doubaoService } from '../services/doubao.js';
import { baiduService } from '../services/baidu.js';
import { geminiService } from '../services/gemini.js';
import { seedanceService } from '../services/seedance.js';
import { databaseService } from '../services/database.js';
import { pointsService, POINT_COSTS } from '../services/points.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

export const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// --- Likes ---
router.post('/like', async (req, res) => {
  try {
    const { userId, imageId } = req.body;
    if (!userId || !imageId) return res.status(400).json({ error: "Missing params" });
    const liked = await databaseService.toggleLike(userId, imageId);
    res.json({ liked });
  } catch (e) {
    res.status(500).json({ error: "Like failed" });
  }
});

router.get('/liked', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const images = await databaseService.getLikedImages(userId);
    res.json(images);
  } catch (e) {
    res.status(500).json({ error: "Fetch liked failed" });
  }
});

// Image-to-Voice: analyze image + user voice to keywords, return audio URL and story
router.post('/image-to-voice', upload.single('image'), async (req, res) => {
  const userId = req.body.userId;
  try {
    const userVoiceText = req.body.voiceText ?? '';

    const lang = (req.query.lang as string) || req.body.lang || 'en'; // Param > Body > Default
    const id = uuidv4();

    if (!userId) {
      return res.status(401).json({ error: 'User ID required for points deduction', errorCode: 'AUTH_REQUIRED' });
    }

    // 0. Check Plan
    let isVIP = false;
    if (userId && userId !== 'demo') {
      const userRecord = await databaseService.getUser(userId);
      const plan = userRecord?.plan as string;
      isVIP = plan === 'pro' || plan === 'yearly_pro' || plan === 'admin';
    }

    // 1. Deduct Points (FREE for Audio Story)
    console.log(`[Points] Audio Story Generation is FREE for ${userId}. VIP Mode: ${isVIP}`);

    let imageDescription = "A creative drawing by a child.";
    let savedImageUrl = "";

    // Helper to get buffer from file or URL
    let imageBuffer: Buffer | null = null;
    let mimeType = 'image/jpeg';

    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype;
    } else if (req.body.imageUrl) {
      try {
        console.log("Fetching image from URL:", req.body.imageUrl);
        // Dynamic import or global fetch
        const fetch = global.fetch;
        const resp = await fetch(req.body.imageUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          imageBuffer = Buffer.from(arrayBuffer);
          mimeType = resp.headers.get('content-type') || 'image/jpeg';
        } else {
          console.error("Failed to fetch imageUrl:", resp.status);
        }
      } catch (e) {
        console.error("Error fetching imageUrl:", e);
      }
    }

    if (imageBuffer) {
      try {
        const sharp = (await import('sharp')).default;
        const compressedBuffer = await sharp(imageBuffer)
          .resize(1024, 1024, { fit: 'inside' })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Save Image for Step 2 (Video)
        const fs = await import('fs');
        const path = await import('path');
        const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }
        const imgFilename = `story-image-${id}.jpg`;
        const imgOutputPath = path.join(outputDir, imgFilename);
        fs.writeFileSync(imgOutputPath, compressedBuffer);
        savedImageUrl = `/generated/${imgFilename}`;

        const base64Image = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
        console.log(`[Media] Vision Input Optimized: ${imageBuffer.length} -> ${compressedBuffer.length} bytes`);

        // Vision Step: Try Doubao First
        try {
          console.log("Analyzing image via Doubao Vision...");
          imageDescription = await doubaoService.analyzeImage(base64Image,
            "Describe everything in this image in extreme detail. Identify details, colors, characters, mood, setting, and actions.");

          if (!imageDescription || imageDescription.length < 20) {
            console.warn("Doubao Vision returned weak description:", imageDescription);
            throw new Error("Weak vision result");
          }
          console.log("Vision Analysis Success:", imageDescription.substring(0, 50) + "...");
        } catch (doubaoErr) {
          console.warn("Doubao Vision failed/weak, trying Gemini:", doubaoErr);
          try {
            imageDescription = await geminiService.analyzeImage(base64Image,
              "Describe everything in this image in extreme detail. Identify details, colors, characters, mood, setting, and actions.");
          } catch (geminiErr) {
            console.error("All Vision Failed. Using generic backup.");
            imageDescription = "A colorful creative drawing by a child, featuring interesting characters and a magical setting.";
          }
        }
      } catch (err) {
        console.error('Vision analysis failed completely:', err);
      }
    }


    // Log Start
    import('fs').then(fs => fs.appendFileSync('debug_gen.log', `[${new Date().toISOString()}]REQ: Lang = ${lang} Desc = ${imageDescription.substring(0, 30)} \n`));

    // Voice-Friendly Prompt (Strictly following user specs)
    let prompt = '';
    console.log(`[DEBUG] Constructing prompt for language: ${lang} `);
    console.log(`[DEBUG] Vision Description used: ${imageDescription.substring(0, 50)}...`);

    if (lang === 'zh') {
      prompt = `
${isVIP ? '# VIP Mode: MASTERPIECE EDITION\n- Tone: Theatrical, highly expressive.\n- Style: Award-winning children\'s book author.\n' : ''}
# Role Definition
You are a professional children's voice story creator.

# Core Goal
Create a rich, imaginative story based strictly on these visual details: ${imageDescription}
and user context: ${userVoiceText}.

# Strict Creation Rules
1. Image Alignment: The story MUST feature the specific characters, colors, and objects described above.
2. Voice Adaptation Rules(Core):
- Sentence length: Standard storytelling flow.
- Language style: Colloquial English, in line with 8 - year - old children.
- Story duration: Approximately 300 - 400 words(Minimum 300 words).
3. **Engagement**: USE EXAGGERATED HUMOR. Make it funny, surprising, and full of twists! Avoid boring linear narration.
4. Content Style: Warm, positive, child's perspective (e.g., "little cutie").

# Output Format
  - Output plain text only, no title, no notes.
- Continuous text(single paragraph).
- Length: Minimum 300 words.Make it detailed and engaging.
`;
    } else {
      prompt = `
${isVIP ? '# VIP Mode: MASTERPIECE EDITION\n- Tone: Theatrical, highly expressive.\n- Style: Award-winning children\'s book author.\n' : ''}
# Role Definition
You are a professional children's voice story creator.

# Core Goal
Create a rich, imaginative story based strictly on these visual details: ${imageDescription}
and user context: ${userVoiceText}.

# Strict Creation Rules
1. Image Alignment: The story MUST feature the specific characters, colors, and objects described above.
2. Voice Adaptation Rules(Core):
- Sentence length: Standard storytelling flow.
- Language style: Colloquial English, in line with 8 - year - old children.
- Story duration: Approximately 300 - 400 words(Minimum 300 words).
3. **Engagement**: USE EXAGGERATED HUMOR. Make it funny, surprising, and full of twists! Avoid boring linear narration.
4. Content Style: Warm, positive, child's perspective (e.g., "little cutie").

# Output Format
  - Output plain text only, no title, no notes.
- Continuous text(single paragraph).
- Length: Minimum 300 words.Make it detailed and engaging.
`;
    }

    // 1. Generate Story (Prioritizing Gemini 2.0)
    console.log("Generating Story Text via Gemini...");
    let story = "";

    try {
      // Use Gemini with Creative Director persona if possible, else standard text gen
      // Use Gemini with Creative Director persona if possible, else standard text gen
      if (lang === 'en') {
        // Try to use the high-quality generateCreativeContent which is cached
        // We'll simulate a 'Story' request type or just use generateText with the persona
        try {
          // We can't use generateCreativeContent directly for plain text yet without modifying schema,
          // so we use generateText which is optimized for plain storytelling.
          story = await geminiService.generateText(prompt, userId);
        } catch (e) {
          story = await geminiService.generateText(prompt, userId);
        }
      } else {
        story = await geminiService.generateText(prompt, userId);
      }

      console.log(`[Gemini] Generated Story Length: ${story.length} characters`);
      if (story.length < 50) throw new Error("Generated story too short");
    } catch (err: any) {
      console.error("Gemini Story Gen Failed:", err.message);

      // Fallback: Doubao
      try {
        console.log("Attempting Doubao Fallback...");
        story = await doubaoService.generateStory(prompt);
      } catch (doubaoErr: any) {
        console.error("Doubao Fallback Failed:", doubaoErr.message);

        // Log to file for agent visibility
        import('fs').then(fs => fs.appendFileSync('debug_gen.log', `[${new Date().toISOString()}] TEXT GEN ERROR: ${err.message} | Doubao: ${doubaoErr.message} \n`));

        // Fallback 2: "Soft" Failure Message
        if (lang === 'zh') {
          story = `I am sorry, I am having trouble writing a story for this picture right now. (Error: ${err.message || "Connection Timeout"}). Please try uploading the image again!`;
        } else {
          story = `I am sorry, I am having trouble writing a story for this picture right now. (Error: ${err.message || "Connection Timeout"}). Please try uploading the image again!`;
        }
      }
    }

    // 2. Generate Audio (Doubao TTS)
    // Audio generation follows...

    // 2. Generate Audio (Doubao TTS)
    let audioUrl = '';

    // ALLOW ALL USERS to generate audio for now (Fix for missing audio issue)
    // if (isFree) {
    //   console.log("Free User: Skipping Server TTS (Will use Client System TTS).");
    // } else {
    {
      console.log(`Generating Speech for lang: ${lang}...`);
      console.log(`Generating Speech for lang: ${lang}...`);

      try {
        let audioBuffer: Buffer;

        const userVoice = req.body.voice || 'female';
        let voiceName = 'en-US-Neural2-F'; // Default Female

        // 2. Generate Audio (Xunfei TTS Switch for Human-like Quality)
        console.log(`[TTS] Generating Audio via Xunfei (Lang: ${lang})...`);
        const { xunfeiTTS } = await import('../services/xunfei');
        const fs = await import('fs');
        const path = await import('path');

        const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

        const filename = `audio-${id}.mp3`;
        const outputPath = path.join(outputDir, filename);

        // Generate and Save (Returns path)
        try {
          // VIPs get slightly more dynamic speed if needed (e.g. 45 vs 40) or just better text
          await xunfeiTTS(story, outputPath, lang, isVIP ? { speed: 45, volume: 60 } : {});
          audioUrl = `/generated/${filename}`;
          console.log('[TTS] Xunfei Audio Generated:', audioUrl);
        } catch (ttsErr) {
          console.error('[TTS] Xunfei Failed, falling back to Browser TTS:', ttsErr);
          // audioUrl remains empty -> Frontend triggers "Read for Me (Browser)"
        }
      } catch (ttsError: any) {
        console.error('TTS Implementation Failed (Soft Fail):', ttsError);
        // Fallback: Proceed without server-side audio. Client will handle it.
        audioUrl = '';
        // Partial Refund logic if cost was > 0
        // await pointsService.refundPoints(userId, 'generate_speech', 'tts_failed');
      }
    }

    // ALWAYS SAVE (Even if audio failed, we have the story)
    const finalMediaUrl = audioUrl || `https://placehold.co/600x600/orange/white?text=${encodeURIComponent(userVoiceText.substring(0, 10) || 'Story')}`;
    const finalType = audioUrl ? 'story' : 'story'; // Could separate types if needed

    try {
      await databaseService.saveImageRecord(userId || 'anonymous', finalMediaUrl, finalType, userVoiceText, { story, audioUrl, isFallback: !audioUrl, originalImageUrl: savedImageUrl });
      if (userId) await databaseService.awardPoints(userId, 15, 'story');
    } catch (e) { console.error('DB Save error', e); }

    res.json({
      id,
      keywords: [userVoiceText, 'creative'],
      story,
      audioUrl,
      imageUrl: savedImageUrl,
      userId,
      createdAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(error);
    // Full Refund on Critical Fail
    try {
      if (userId && userId !== 'demo') {
        await pointsService.refundPoints(userId, 'generate_audio_story', 'critical_error');
      }
    } catch (refundErr) {
      console.error('Refund failed:', refundErr);
    }
    res.status(500).json({ error: 'Failed to generate audio story', details: error.message, stack: error.stack });
  }
});


// Image-to-Image: generate cartoon image from user's drawing
router.post('/image-to-image', upload.single('image'), async (req, res) => {
  const userId = req.body.userId;
  try {
    const userPrompt = req.body.prompt ?? '';

    const id = uuidv4();

    if (!userId) {
      return res.status(401).json({ error: 'User ID required', errorCode: 'AUTH_REQUIRED' });
    }

    // 1. Points
    const action = 'generate_image';
    const deduction = await pointsService.consumePoints(userId, action);
    if (!deduction.success) {
      if (deduction.error === 'NOT_ENOUGH_POINTS') {
        const { current, required } = await pointsService.hasEnoughPoints(userId, action);
        return res.status(200).json({
          success: false,
          errorCode: 'NOT_ENOUGH_POINTS',
          required,
          current
        });
      }
      return res.status(500).json({ error: 'Points transaction failed' });
    }
    // 1.5 Vision Analysis
    let imageDescription = "A drawing";
    let base64Image = '';
    let savedOriginalUrl = '';

    if (req.file) {
      base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Save Original for History
      try {
        const fs = await import('fs');
        const path = await import('path');
        const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

        const ext = req.file.mimetype.split('/')[1] || 'png';
        const filename = `cartoon-input-${id}.${ext}`;
        fs.writeFileSync(path.join(outputDir, filename), req.file.buffer);
        savedOriginalUrl = `/generated/${filename}`;
      } catch (e) {
        console.error("Failed to save original image for carton:", e);
      }
    }

    if (base64Image) {
      try {
        console.log("Analyzing image for Greeting Card...");
        imageDescription = await doubaoService.analyzeImage(base64Image,
          "Describe the main subject, composition, and colors of this image. If there are people or faces, describe them clearly.");
        console.log("Greeting Card Vision:", imageDescription.substring(0, 50));
      } catch (e) {
        console.warn("Vision analysis failed, skipping:", e);
      }
    }

    // Construct a more intelligent prompt using Doubao Pro 1.8 (Requested Update)
    let finalPrompt = '';
    try {
      console.log(`[Media] Optimizing prompt for children (Doubao Pro 1.8)...`);

      // Combine user input with vision data if available
      let combinedInput = userPrompt;
      if (imageDescription && imageDescription.length > 5) {
        combinedInput += `\n\nContext from Reference Image: ${imageDescription}`;
      }

      finalPrompt = await doubaoService.generateChildFriendlyPrompt(combinedInput);

      // Preserve "Identity" constraint if it was heavily implied by vision (e.g. "face")
      if (imageDescription.toLowerCase().includes('face') || imageDescription.toLowerCase().includes('person')) {
        finalPrompt += " (Keep the main character's features recognizable).";
      }

      console.log(`[Media] Optimized Prompt: ${finalPrompt}`);
    } catch (optErr) {
      console.warn("[Media] Prompt optimization failed, fallback to manual:", optErr);

      // Fallback
      let instructions = "Style: Cartoon/Illustration. Quality: High.";
      if (imageDescription.toLowerCase().includes('face') || imageDescription.toLowerCase().includes('person')) {
        instructions += " CRITICALLY IMPORTANT: Preserve the facial features and identity of the person in the reference image. Do not change the face significantly, just apply the artistic style.";
      }
      finalPrompt = `${instructions}
      Reference Image Context: ${imageDescription}.
      User Specific Request: ${userPrompt}.
      Output: A high-quality greeting card image blending the reference content with the requested style/theme.`;
    }

    let cartoonImageUrl;
    try {
      // Use actual Image-to-Image generation
      const base64Image = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : '';

      if (base64Image) {
        console.log('Generating cartoon using Doubao Img2Img...');
        // Use Doubao Service (prompt, image, size)
        cartoonImageUrl = await doubaoService.generateImageFromImage(finalPrompt, base64Image, '2K');
      } else {
        console.log('No image file, falling back to Doubao Text-to-Image...');
        cartoonImageUrl = await doubaoService.generateImage(finalPrompt, '2K');
      }
    } catch (genError) {
      console.error('Image generation failed, falling back to mock:', genError);
      import('fs').then(fs => {
        fs.appendFileSync('server_error.log', `${new Date().toISOString()} - Image Gen Error: ${genError}\n`);
      });
      // CRITICAL: Refund logic should be here if we consider fallback a failure?
      // Spec: "API failed -> Full Refund... Partial success -> Deduct".
      // Here, we have a fallback to placeholder.
      // If we show placeholder, user pays 15 pts? User won't like that.
      // I will refund.
      await pointsService.refundPoints(userId, 'generate_image', 'gen_failed');
      cartoonImageUrl = `https://placehold.co/1024x1024/FF6B6B/white?text=Cartoon+Generation+Failed`;
    }

    // Save to DB
    try {
      if (req.file) {
        // ...
      }
      if (cartoonImageUrl && !cartoonImageUrl.includes('placehold')) {
        // Fix: Upload to Firebase Storage for persistence
        try {
          console.log('[Media] Uploading cartoon to storage...');
          const imgRes = await fetch(cartoonImageUrl);
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            // Overwrite with permanent URL
            cartoonImageUrl = await databaseService.uploadFile(buffer, 'image/png', 'cartoons');
          }
        } catch (uploadErr) {
          console.error('[Media] Failed to upload cartoon to storage:', uploadErr);
        }

        await databaseService.saveImageRecord(
          userId || 'anonymous',
          cartoonImageUrl,
          'generated',
          finalPrompt,
          { originalImageUrl: savedOriginalUrl }
        );
      }
    } catch (e) { console.error('DB Save error', e); }

    res.json({
      id,
      prompt: userPrompt,
      cartoonImageUrl,
      userId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    await pointsService.refundPoints(userId, 'generate_image', 'crash');
    res.status(500).json({ error: 'Failed to generate cartoon image' });
  }
});

// Image-to-Video
// Async Video Generation: Step 1 - Start Task
// Async Video Generation: Step 1 - Start Task
// Async Video Generation: Step 1 - Start Task
router.post('/image-to-video/task', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('[Multer] Upload Error:', err);
      return res.status(500).json({ error: 'Image Upload Failed', details: err.message });
    }
    next();
  });
}, async (req, res) => {
  console.log('[API] /image-to-video/task hit (Baidu). Processing request...');
  let cost = 0; // Scope for error handling
  try {
    const userPrompt = req.body.prompt ?? '';
    const userId = req.body.userId;
    // const quality = req.body.quality === 'HD' ? 'HD' : 'SD'; // Ignored
    const durationParam = parseInt(req.body.duration || '5');
    // MuseSteamer supports 5 or 10. Default 5.
    const duration = (durationParam >= 8) ? 10 : 5;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required', errorCode: 'AUTH_REQUIRED' });
    }

    // 1. Calculate Cost
    cost = duration >= 8 ? 40 : 20; // 20 pts for SD, 40 for HD

    // 2. Consume Points
    const action = 'generate_video';
    const deduction = await pointsService.consumePoints(userId, action, cost);
    if (!deduction.success) {
      if (deduction.error === 'NOT_ENOUGH_POINTS') {
        const { current } = await pointsService.hasEnoughPoints(userId, action);
        return res.status(200).json({
          success: false,
          errorCode: 'NOT_ENOUGH_POINTS',
          required: cost,
          current
        });
      }
      return res.status(500).json({ error: 'Points transaction failed' });
    }

    let finalImageUrl = '';

    // Revert to Base64 logic (Bypass Storage)
    let originalImageUrl = '';

    if (req.file) {
      console.log(`[API] File received. Processing for Baidu (Base64)...`);
      try {
        const sharp = (await import('sharp')).default;
        const compressedBuffer = await sharp(req.file.buffer)
          .resize({ width: 1024, withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer();
        finalImageUrl = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;

        // Save for History
        const fs = await import('fs');
        const path = await import('path');
        const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }
        const filename = `anim-input-${Date.now()}.jpg`;
        fs.writeFileSync(path.join(outputDir, filename), compressedBuffer);
        originalImageUrl = `/generated/${filename}`;

      } catch (e) {
        console.error('Sharp error:', e);
        finalImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }
    } else if (req.body.imageUrl) {
      let imgUrl = req.body.imageUrl as string;
      originalImageUrl = imgUrl; // Capture for history

      if (imgUrl.startsWith('http')) {
        // If localhost, fetch and convert to base64, otherwise pass thru
        if (imgUrl.includes('localhost') || imgUrl.includes('127.0.0.1')) {
          try {
            const fetch = (await import('node-fetch')).default;
            const res = await fetch(imgUrl);
            if (res.ok) {
              const buf = await res.buffer();
              const mime = res.headers.get('content-type') || 'image/jpeg';
              finalImageUrl = `data:${mime};base64,${buf.toString('base64')}`;
            } else { finalImageUrl = imgUrl; }
          } catch (e) { finalImageUrl = imgUrl; }
        } else {
          finalImageUrl = imgUrl;
        }
      } else if (imgUrl.startsWith('data:')) {
        finalImageUrl = imgUrl;
      } else {
        // Local path
        try {
          const fs = await import('fs');
          const path = await import('path');
          let buf: Buffer | null = null;
          // Check various paths
          const paths = [
            path.join(process.cwd(), 'client', 'public', imgUrl),
            path.join(process.cwd(), imgUrl),
            path.join(process.cwd(), 'client', imgUrl)
          ];

          for (const p of paths) {
            if (fs.existsSync(p)) {
              buf = fs.readFileSync(p);
              break;
            }
          }

          if (buf) {
            // Assume jpeg for simplicity or detect ext
            finalImageUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
          }
        } catch (e) { console.error("Local handling failed", e); }
      }
    }

    // --- Analyze-then-Animate Pipeline ---
    console.log(`[API] Starting Analyze-then-Animate Pipeline...`);
    let actionPrompt = userPrompt;

    try {
      // Step 1: Vision Analysis (Doubao)
      // Note: Doubao Vision handles Data URIs in image_url usually.
      const description = await doubaoService.analyzeImage(
        finalImageUrl,
        "Describe the main character and the setting in this image briefly. Format: [Character Description], [Setting]."
      );
      console.log(`[Pipeline] Vision Description: ${description}`);

      // Step 2: Action Imagination (Doubao LLM)
      const systemInstruction = "You are an animation director. Generate a SHORT, DYNAMIC, ENGLISH action prompt (max 20 words) for a video based on the character. Focus on visible movement (e.g., jumping, waving, running, blinking). Output ONLY the prompt. CRITICAL: MAKE IT EXAGGERATED AND LIVELY (Disney Style Squash & Stretch).";
      const llmPrompt = `Character: ${description}.\nUser Context: ${userPrompt || "Create a fun, natural movement"}.\nAction Prompt:`;

      const generatedPrompt = await doubaoService.generateSimpleText(llmPrompt, systemInstruction);
      console.log(`[Pipeline] Generated Action Prompt: ${generatedPrompt}`);

      if (generatedPrompt && generatedPrompt.length > 2) {
        actionPrompt = generatedPrompt.replace(/^["']|["']$/g, '').trim();
      }
    } catch (pipelineError) {
      console.warn(`[Pipeline] Analysis failed, falling back to original prompt:`, pipelineError);
      actionPrompt = userPrompt || "High quality animation, cinematic moving, 4k";
    }

    console.log(`[API] Calling doubaoService.createSeedanceVideoTask (Model: 1.5, Res: 480p, Dur: 4s) with Prompt: "${actionPrompt}"...`);

    // Call Doubao Seedance 1.5 Service
    // Force lowest parameters: 4s, 480p
    const taskId = await doubaoService.createSeedanceVideoTask(finalImageUrl, actionPrompt, {
      duration: 4,
      resolution: '480p',
      cameraFixed: false
    });

    console.log(`[API] Doubao Seedance Task created: ${taskId}`);

    // Track task
    await databaseService.saveVideoTask(taskId, userId, cost, userPrompt, { originalImageUrl, engine: 'doubao-seedance-1.5' });

    // Return extended info (usedModel: doubao-seedance-1-5-pro-251215)
    res.json({ taskId, usedModel: 'doubao-seedance-1-5-pro-251215', status: 'PENDING' });

  } catch (error: any) {
    console.error('Video Task Start Error:', error);
    const uid = req.body.userId;
    // Refund
    if (uid && cost > 0) {
      await pointsService.grantPoints(uid, cost, 'refund_start_failed', 'Start failed');
    }
    res.status(500).json({ error: error.message });
  }
});

// Async Video Generation: Step 2 - Check Status (Baidu)
router.get('/image-to-video/status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    // Updated to use Doubao Polling
    const result = await doubaoService.getVideoTaskStatus(taskId);

    // Auto-Save to Gallery on Success
    if (result.status === 'SUCCEEDED' && result.videoUrl) {
      const localTask = await databaseService.getVideoTask(taskId);
      // Only save if status is PENDING to avoid duplicates
      if (localTask && localTask.status === 'PENDING') {
        console.log(`[API] Video ${taskId} succeeded. Saving to gallery...`);

        // Fix: Persist Video to Storage
        let permanentVideoUrl = result.videoUrl!;
        try {
          console.log(`[API] Uploading video ${taskId} to storage...`);
          const vidRes = await fetch(result.videoUrl!);
          if (vidRes.ok) {
            const ab = await vidRes.arrayBuffer();
            const buf = Buffer.from(ab);
            permanentVideoUrl = await databaseService.uploadFile(buf, 'video/mp4', 'animations');
          }
        } catch (err) {
          console.error('[API] Failed to upload video to storage:', err);
        }

        await databaseService.saveImageRecord(
          localTask.userId,
          permanentVideoUrl,
          'animation',
          localTask.prompt || "Animation",
          { taskId, cost: localTask.cost, model: 'musesteamer-2.0', originalImageUrl: localTask.meta?.originalImageUrl }
        );
        await databaseService.markTaskCompleted(taskId);

        // Fix: Return the PERMANENT URL to the frontend immediately
        // This solves the "Black Screen" issue if the Doubao URL is restricted/temporary
        result.videoUrl = permanentVideoUrl;
      }
    }

    // Async Refund Handling
    if (result.status === 'FAILED' || (result as any).error) {
      const localTask = await databaseService.getVideoTask(taskId);
      if (localTask && !localTask.refunded && localTask.status !== 'COMPLETED') {
        console.log(`[Points] Video Task ${taskId} failed. Refunding ${localTask.userId}...`);

        // Refund exact cost
        const refundAmount = localTask.cost || 30;
        await pointsService.grantPoints(localTask.userId, refundAmount, 'refund_video_fail', 'Async Generation Failed');

        await databaseService.markTaskRefunded(taskId);
      }
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy Route (Keep for backward compatibility)
router.post('/image-to-video', upload.single('image'), async (req, res) => {
  try {
    const userPrompt = req.body.prompt ?? '';
    const userId = req.body.userId;
    const id = uuidv4();

    if (!userId) {
      return res.status(401).json({ error: 'User ID required', errorCode: 'AUTH_REQUIRED' });
    }

    // const userRecord = await databaseService.getUser(userId);

    // 1. Points
    const action = 'generate_video';
    const deduction = await pointsService.consumePoints(userId, action);
    if (!deduction.success) {
      // ... standard error ...
      if (deduction.error === 'NOT_ENOUGH_POINTS') {
        const { current, required } = await pointsService.hasEnoughPoints(userId, action);
        return res.status(200).json({ success: false, errorCode: 'NOT_ENOUGH_POINTS', required, current });
      }
      return res.status(500).json({ error: 'Points transaction failed' });
    }

    let finalImageUrl = '';

    if (req.file) {
      try {
        const compressedBuffer = await sharp(req.file.buffer)
          .resize({ width: 720, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
        finalImageUrl = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
      } catch (sharpErr) {
        finalImageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      }
    }
    else if (req.body.imageUrl) {
      let imgUrl = req.body.imageUrl;
      // Fix: Convert local URL to Base64 for API
      if (imgUrl.startsWith('/')) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const localPath = path.join(process.cwd(), 'client', 'public', imgUrl);
          if (fs.existsSync(localPath)) {
            const bitmap = fs.readFileSync(localPath);
            const ext = path.extname(localPath).substring(1) || 'png';
            imgUrl = `data:image/${ext};base64,${bitmap.toString('base64')}`;
            console.log('[API Legacy] Converted local image to Base64 for API.');
          }
        } catch (e) { console.error("Failed to read local image:", e); }
      }
      finalImageUrl = imgUrl;
    }

    const videoUrl = await doubaoService.generateVideo(finalImageUrl, userPrompt);

    if (videoUrl) {
      try {
        // Pass originalImageUrl (local path or URL) to meta
        const originalImageUrl = req.body.imageUrl || '';
        databaseService.saveImageRecord(userId || 'anonymous', videoUrl, 'animation', userPrompt, { originalImageUrl, videoUrl });
        // if (userId) databaseService.awardPoints(userId, 20, 'animation'); // Deprecated by Cost System
      } catch (e) { }
    }

    res.json({ id, videoUrl });
  } catch (error: any) {
    console.error('Video Route Error:', error);
    const uid = req.body.userId;
    if (uid) await pointsService.refundPoints(uid, 'generate_video', 'gen_failed');

    res.status(500).json({ error: error.message || 'Failed to generate video' });
  }
});



// --- NEW PICTURE BOOK ENDPOINT (4-Part Arc + Audio) ---
router.post('/generate-picture-book', upload.single('cartoonImage'), async (req, res) => {
  try {
    const userPrompt = req.body.prompt ?? 'A magical adventure';
    const userId = req.body.userId;
    const id = uuidv4();

    if (!userId) {
      return res.status(401).json({ error: 'User ID required', errorCode: 'AUTH_REQUIRED' });
    }

    // 1. Points (Cost: Differentiate by mode)
    const mode = req.body.mode || 'picture_book';
    const cost = mode === 'picture_book' ? POINT_COSTS.PICTURE_BOOK_4 : POINT_COSTS.COMIC_STRIP;
    const action = 'generate_comic_book';

    const deduction = await pointsService.consumePoints(userId, action, cost);
    if (!deduction.success) {
      if (deduction.error === 'NOT_ENOUGH_POINTS') {
        const { current } = await pointsService.hasEnoughPoints(userId, action);
        return res.status(200).json({ success: false, errorCode: 'NOT_ENOUGH_POINTS', required: cost, current });
      }
      return res.status(500).json({ error: 'Points transaction failed' });
    }
    console.log(`[Points] Generation Mode: ${mode}. Deducted ${cost} points for ${userId}.`);
    console.log('--- Generate Story Book Request (4-Part Arc) ---');

    // 0. Handle Reference Image
    let cartoonImageBuffer: Buffer | null = null;
    let originalImageUrl = ''; // New: For Persistence
    // Ensure upload dir exists
    const uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    if (req.file) {
      cartoonImageBuffer = req.file.buffer;

      // Save Original
      const ext = req.file.mimetype.split('/')[1] || 'png';
      const filename = `input-arc-${id}.${ext}`;
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
      originalImageUrl = `/uploads/${filename}`;

    } else if (req.body.cartoonImageUrl) {
      try {
        const fetch = global.fetch;
        const resp = await fetch(req.body.cartoonImageUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          cartoonImageBuffer = Buffer.from(arrayBuffer);

          // Save Original
          const filename = `input-arc-${id}.png`;
          fs.writeFileSync(path.join(uploadDir, filename), cartoonImageBuffer);
          originalImageUrl = `/uploads/${filename}`;
        }
      } catch (e) { console.error("URL Fetch failed", e); }
    }

    // Convert Buffer to Base64
    let base64Reference = cartoonImageBuffer ? `data:image/jpeg;base64,${cartoonImageBuffer.toString('base64')}` : '';

    // 1. Generate Story (4-Part Arc)
    console.log('Generating structured story (Narrative Arc)...');
    let storyPages = [];
    try {
      if (mode === 'comic_strip') {
        console.log('[Media] Mode is comic_strip, summarizing story into 4 panels...');
        const panels = await doubaoService.summarizeStoryToComicPanels(userPrompt);
        storyPages = panels.map(p => ({
          page: p.panel,
          text: p.caption,
          visual_prompt: p.sceneDescription
        }));
      } else {
        // Enforce English (as per Master Prompt requirements)
        // Pass base64Reference to analyze context
        storyPages = await doubaoService.generateStoryJSON(userPrompt, base64Reference, 'en');
      }
      console.log(`[Story] Generated ${storyPages.length} pages.`);
    } catch (storyErr: any) {
      console.error('Story Generation Failed:', storyErr);
      // Fallback: If JSON fails, create a simple linear story manually
      console.log('Falling back to manual story structure...');
      storyPages = [
        { page: 1, text: "Once upon a time, there was a hero named Leo who wanted to explore the world.", visual_prompt: "A cute hero named Leo standing in a sunny garden, looking at the horizon, children's book style, vivid colors." },
        { page: 2, text: "Leo started his journey and found a mysterious glowing map.", visual_prompt: "Leo finding a glowing magical map on the grass, surprised expression, magical atmosphere." },
        { page: 3, text: "Suddenly, a friendly dragon appeared and offered to help!", visual_prompt: "A friendly round dragon appearing near Leo, sparkles, happy interaction, cute." },
        { page: 4, text: "They became best friends and went on many adventures together. The end.", visual_prompt: "Leo and the dragon hugging or flying together, sunset background, heartwarming conclusion." }
      ];
    }

    // 2. Generate Assets for each page
    const pages = [];
    let referenceImageForConsistency = base64Reference; // Start with user upload

    // We will execute in series to maintain consistency if we update the reference
    // OR parallel for speed if we stick to the initial reference.
    // Master Prompt suggests: "Get seed/ref from Page 1... use for 2,3,4".
    // Since we don't have easy seed access, we will use Page 1's OUTPUT as a weak reference for 2,3,4 if no user upload exists?
    // Actually, sticking to the User Upload (if exists) is best.
    // If no user upload, we use Page 1 as the generic style anchor? 
    // Let's try to simply use the prompts first, but if `referenceImageForConsistency` is set, pass it.

    // A. Generate Images (Serial for potential consistency, or parallel if no dynamic referencing)
    const imagePromises = storyPages.map(async (pageData, i) => {
      console.log(`Processing Page ${pageData.page}...`);
      let pageImageUrl = '';
      try {
        let fullVisualPrompt = `Children's book illustration, masterpiece, ${pageData.visual_prompt}. Style: warm, colorful, detailed.`;

        // Architecture C: Text-First - Request empty space/no-text from AI
        if (mode === 'comic_strip') {
          fullVisualPrompt += " IMPORTANT: Leave empty space at the bottom or top of each panel for text. DO NOT include any text, speech bubbles, or captions in the image.";
        }

        if (referenceImageForConsistency) {
          console.log(`   - Generating Image (Img2Img) for Page ${pageData.page}...`);
          pageImageUrl = await doubaoService.generateImageFromImage(fullVisualPrompt, referenceImageForConsistency, '2K');
        } else {
          console.log(`   - Generating Image (Txt2Img) for Page ${pageData.page}...`);
          pageImageUrl = await doubaoService.generateImage(fullVisualPrompt, '2K');
        }
      } catch (imgErr) {
        console.error(`   - Image Gen Failed for Page ${pageData.page}:`, imgErr);
        pageImageUrl = `https://placehold.co/1024x1024/orange/white?text=Page+${pageData.page}`;
      }
      return pageImageUrl;
    });

    const sceneImages = await Promise.all(imagePromises);

    // B. Generate Audio (Parallel Xunfei TTS)
    // We execute all TTS requests in parallel to speed up generation
    const { xunfeiTTS } = await import('../services/xunfei.js');
    const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
    if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

    console.log(`[Media] Generating Audio for ${storyPages.length} pages in PARALLEL...`);

    // Determine Pages to Process (up to 4)
    const pagesToProcess = storyPages.slice(0, 4); // Use storyPages directly

    const audioPromises = pagesToProcess.map(async (pageData: any, i: number) => {
      let pageAudioUrl = '';
      try {
        const filename = `audio-book-${id}-page${pageData.page}.mp3`; // Use pageData.page for filename
        const outputPath = path.join(outputDir, filename);
        console.log(`   - Starting TTS for Page ${pageData.page}...`);
        await xunfeiTTS(pageData.text, outputPath, 'en'); // Use pageData.text
        pageAudioUrl = `/generated/${filename}`;
      } catch (ttsErr) {
        console.error(`   - TTS Failed for Page ${pageData.page}:`, ttsErr);
      }
      return {
        pageNumber: pageData.page, // Use pageData.page
        imageUrl: sceneImages[i] || '', // From previous step
        narrativeText: pageData.text, // Use pageData.text
        audioUrl: pageAudioUrl
      };
    });

    const finalPages = await Promise.all(audioPromises);

    // Assign to pages array for DB
    // pages is currently empty, so we push
    pages.push(...finalPages);

    // 2.5 Generate 2x2 Grid Image (Stitching)
    let gridImageUrl = '';
    if (pages.length === 4) {
      try {
        console.log('Stitching pages into 2x2 Comic Grid...');
        const sharp = (await import('sharp')).default;
        const fetch = global.fetch;

        // Fetch buffers
        const buffers = await Promise.all(pages.map(async (p) => {
          if (p.imageUrl.startsWith('http')) {
            const r = await fetch(p.imageUrl);
            return Buffer.from(await r.arrayBuffer());
          } else {
            // Local file
            const localPath = path.join(process.cwd(), 'client', 'public', p.imageUrl);
            return fs.readFileSync(localPath);
          }
        }));

        // Resize all to 512x512 for a 1024x1024 grid (or 1024x1024 for 2048x2048)
        // Let's go for High Res 2048x2048 so each panel is 1024x1024
        const resizedBuffers = await Promise.all(buffers.map(b =>
          sharp(b).resize(1024, 1024).toBuffer()
        ));

        // Create Text Overlays (Architecture C: "Burn-in")
        const overlays = pages.slice(0, 4).map((p, i) => {
          const x = (i % 2) * 1024 + 50;
          const y = Math.floor(i / 2) * 1024 + 850; // Position near bottom
          return {
            input: {
              text: {
                text: `<span foreground="black" font_weight="bold" background="#ffffffcc">${p.narrativeText}</span>`,
                width: 924,
                height: 150,
                align: 'center' as any,
                font: 'sans-serif',
                rgba: true
              }
            } as any,
            top: y,
            left: x
          };
        });

        const composite = await sharp({
          create: {
            width: 2048,
            height: 2048,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        }).composite([
          { input: resizedBuffers[0], top: 0, left: 0 },
          { input: resizedBuffers[1], top: 0, left: 1024 },
          { input: resizedBuffers[2], top: 1024, left: 0 },
          { input: resizedBuffers[3], top: 1024, left: 1024 },
          ...overlays
        ]).jpeg({ quality: 90 }).toBuffer();

        const gridFilename = `comic-grid-${id}.jpg`;
        const gridPath = path.join(process.cwd(), 'client', 'public', 'generated', gridFilename);
        fs.writeFileSync(gridPath, composite);
        gridImageUrl = `/generated/${gridFilename}`;
        console.log('Grid Stitching Success:', gridImageUrl);

      } catch (stitchErr) {
        console.error('Grid Stitching Failed:', stitchErr);
      }
    }

    // 3. Save Record
    const bookData = {
      title: userPrompt,
      coverImage: gridImageUrl || pages[0]?.imageUrl || '',
      pages: pages,
      panels: pages.map((p, i) => ({
        panel: i + 1,
        caption: p.narrativeText || ''
      })),
      storyCaptions: pages.map(p => p.narrativeText || ''),
      gridImageUrl: gridImageUrl, // Store grid
      createdAt: Date.now()
    };

    // Save as "comic"
    await databaseService.saveImageRecord(userId, bookData.coverImage, 'comic', userPrompt, {
      title: userPrompt,
      isStoryBook: true,
      originalImageUrl: originalImageUrl,
      gridImageUrl: gridImageUrl,
      bookData: bookData,
      isTextBurnedIn: true // NEW: Frontend knows text is already in image
    });

    if (userId) await databaseService.awardPoints(userId, 50, 'story-book');

    res.json({
      id,
      isTextBurnedIn: true, // Let frontend know
      ...bookData
    });

  } catch (error: any) {
    console.error('Story Book Gen Error:', error);
    const uid = req.body.userId;
    if (uid) await pointsService.refundPoints(uid, 'generate_comic_book', 'gen_failed');
    res.status(500).json({ error: error.message || 'Failed to generate story book' });
  }
});


// Generate Picture Book (Sequential with Official Logic)
// Supports two modes: 'comic_strip' (single 4-grid image) and 'picture_book' (4 separate images)
router.post('/generate-picture-book', upload.single('cartoonImage'), async (req, res) => {
  try {
    const userPrompt = req.body.prompt ?? 'A fun story';
    const userId = req.body.userId;
    const mode = req.body.mode || 'picture_book'; // 'comic_strip' or 'picture_book'
    const audioStoryText = req.body.audioStoryText || ''; // Story text from audio generation
    const id = uuidv4();

    if (!userId) {
      return res.status(401).json({ error: 'User ID required', errorCode: 'AUTH_REQUIRED' });
    }

    const userRecord = await databaseService.getUser(userId);
    const plan = userRecord?.plan as string;
    const isVIP = plan === 'pro' || plan === 'yearly_pro' || plan === 'admin';

    // 1. Points (Cost: Differentiate by mode)
    const cost = mode === 'picture_book' ? POINT_COSTS.PICTURE_BOOK : POINT_COSTS.COMIC_STRIP;
    const action = 'generate_comic_book';

    const deduction = await pointsService.consumePoints(userId, action, cost);
    if (!deduction.success) {
      if (deduction.error === 'NOT_ENOUGH_POINTS') {
        const { current } = await pointsService.hasEnoughPoints(userId, action);
        return res.status(200).json({
          success: false,
          errorCode: 'NOT_ENOUGH_POINTS',
          required: cost,
          current
        });
      }
      return res.status(500).json({ error: 'Points transaction failed' });
    }
    console.log(`[Points] Generation Mode: ${mode}. Deducted ${cost} points for ${userId}.`);
    console.log(`--- Generate ${mode === 'comic_strip' ? 'Comic Strip' : 'Comic Book'} Request ---`);

    // 0. Handle Reference Image
    let cartoonImageBuffer: Buffer | null = null;
    let originalImageUrl = '';
    const uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    if (req.file) {
      cartoonImageBuffer = req.file.buffer;
      const ext = req.file.mimetype.split('/')[1] || 'png';
      const filename = `input-${id}.${ext}`;
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
      originalImageUrl = `/uploads/${filename}`;
    } else if (req.body.cartoonImageUrl) {
      try {
        const fetch = global.fetch;
        const resp = await fetch(req.body.cartoonImageUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          cartoonImageBuffer = Buffer.from(arrayBuffer);
          const filename = `input-${id}.png`;
          fs.writeFileSync(path.join(uploadDir, filename), cartoonImageBuffer);
          originalImageUrl = `/uploads/${filename}`;
        }
      } catch (e) { console.error("URL Fetch failed", e); }
    }

    // Convert Buffer to Base64
    let base64Reference = cartoonImageBuffer ? `data:image/jpeg;base64,${cartoonImageBuffer.toString('base64')}` : '';

    // MODE: COMIC_STRIP - Generate single 4-panel grid image
    if (mode === 'comic_strip') {
      try {
        // Step 1: Summarize audio story into 4 scene descriptions
        if (!audioStoryText) {
          return res.status(400).json({ error: 'Audio story text is required for comic strip mode' });
        }

        console.log('[Comic Strip] Summarizing audio story into 4 panels...');
        const panels = await doubaoService.summarizeStoryToComicPanels(audioStoryText);
        console.log('[Comic Strip] Summarized into 4 panels:', panels.map(p => p.caption.substring(0, 30)));

        // Step 2: Get visual style from request (or use default)
        // The visual style prompt is sent from frontend, or we use a default
        const stylePrompt = req.body.visualStylePrompt || 'children\'s book style, colorful, vibrant, detailed illustrations';

        // Step 3: Construct single image prompt for 4-panel comic strip
        const panelDescriptions = panels.map((p, i) =>
          `Panel ${i + 1}: ${p.sceneDescription}`
        ).join(' | ');

        const comicPrompt = `A 4-panel comic strip in a 2x2 grid layout showing: ${panelDescriptions}. Art style: ${stylePrompt}. Sequential art, consistent character design across all panels, clear panel borders, comic strip format, grid layout.`;

        console.log('[Comic Strip] Generating single 4-panel comic image...');
        let comicImageUrl: string;

        if (base64Reference) {
          comicImageUrl = await doubaoService.generateImageFromImage(comicPrompt, base64Reference, '4K');
        } else {
          comicImageUrl = await doubaoService.generateImage(comicPrompt, '4K');
        }

        // Step 4: Save result
        const bookData = {
          title: userPrompt,
          coverImage: comicImageUrl,
          gridImageUrl: comicImageUrl,
          pages: panels.map((p, i) => ({
            panel: p.panel,
            caption: p.caption,
            sceneDescription: p.sceneDescription
          })),
          mode: 'comic_strip',
          createdAt: Date.now()
        };

        await databaseService.saveImageRecord(userId, comicImageUrl, 'comic', userPrompt, {
          title: userPrompt,
          isComicStrip: true,
          originalImageUrl: originalImageUrl || '',
          gridImageUrl: comicImageUrl,
          panels: panels,
          bookData: bookData
        });

        return res.json({
          id,
          ...bookData,
          panels: panels // Return panels for UI overlay
        });

      } catch (error: any) {
        console.error('[Comic Strip] Error:', error);
        if (userId) await pointsService.refundPoints(userId, 'generate_comic_book', 'comic_strip_failed');
        return res.status(500).json({ error: error.message || 'Failed to generate comic strip' });
      }
    }

    // MODE: PICTURE_BOOK - Generate 4 separate images (existing logic)
    // 1. Generate Story (Optimized for Manga/Exaggerated Style)
    console.log('Generating structured story (Manga Style)...');
    let storyData: any;

    // Custom System Prompt construction for DoubaoService to force "Manga Style"
    // We'll bypass the simple 'generateStoryJSON' default if we want custom rules, 
    // OR we modify generateStoryJSON. For safety/speed, let's use generateStoryJSON but append strict instructions to the User Prompt.

    const mangaInstructions = `
    IMPORTANT:
    - Style: Japanese 4-koma manga style.
    - Content: Exaggerated humor, unexpected twists, highly expressive characters.
    - Avoid boring, flat narration. Make it punchy and fun!
    - Scene Descriptions must be visually dynamic (zooms, speed lines, exaggerated faces).
    ${isVIP ? '- VISUALS: Masterpiece Edition Aesthetic. Ornate details, Epic lighting, 8k resolution.' : ''}
    `;

    try {
      storyData = await doubaoService.generateStoryJSON(userPrompt + mangaInstructions, base64Reference, 'en');
    } catch (storyError) {
      (storyData as any) = {
        title: "My Manga",
        summary: userPrompt,
        scenes: ["Story Gen Failed", "Please Try Again", "Server Error", "Contact Support"],
        scenes_detail: [userPrompt, userPrompt, userPrompt, userPrompt]
      };
    }

    const scenes = storyData.scenes || [];
    const sceneDetails = storyData.scenes_detail || [];

    // 2. Generate 4 Panels (Optimized Visuals)
    console.log('Generating images (Manga Style)...');
    let sceneImages: string[] = [];

    try {
      const imagePromises = sceneDetails.map((detail: string, index: number) => {
        // Enforce Manga Style in image prompt
        const prompt = `Japanese Manga Style, colorful, exuberant. Panel ${index + 1} of 4. Action: ${detail}. High contrast, dynamic composition, expressive emotion.`;

        if (base64Reference) {
          // We use Img2Img but with high denoising (low strength of original) to allow new poses? 
          // Doubao API doesn't expose strength easily in this wrapper. 
          // Let's rely on the text prompt to drive the style change.
          return doubaoService.generateImageFromImage(prompt, base64Reference, '2K').catch(() => doubaoService.generateImage(prompt, '2K'));
        } else {
          return doubaoService.generateImage(prompt, '2K').catch(() => 'https://placehold.co/1024x1024/png?text=Gen+Failed');
        }
      });
      sceneImages = await Promise.all(imagePromises);
    } catch (err) {
      sceneImages = Array(4).fill('https://placehold.co/1024x1024/png?text=Generation+Failed');
    }

    // 3. Assemble "Irregular" Manga Layout
    console.log('Assembling Irregular Manga Comic...');
    let gridImageUrl = '';

    try {
      if (sceneImages.length >= 4) {
        const sharp = (await import('sharp')).default;

        // Fetch
        const imageBuffers = await Promise.all(sceneImages.slice(0, 4).map(async (url) => {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }));

        // Layout Config: "T-Layout with Bottom Wide"
        // Canvas: 1024 x 1300
        // P1: Top Left (Large Square-ish) -> 600x600 at 0,0
        // P2: Top Right (Vertical Strip) -> 414x600 at 610,0
        // P3: Mid Left (Small) -> 400x400 at 0, 610
        // P4: Mid Right (Large) -> 614x400 at 410, 610 ... Wait, gaps.

        // Let's do a strict irregular layout:
        // Row 1: P1 (600w x 500h), P2 (414w x 500h) [Gap 10]
        // Row 2: P3 (414w x 500h), P4 (600w x 500h) [Altered balance]
        // Text area specific to each.

        const composite = await sharp({
          create: {
            width: 1024,
            height: 1400, // Taller for text
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          }
        });

        // Resize logic helper
        const resize = (buf: Buffer, w: number, h: number) => sharp(buf).resize(w, h, { fit: 'cover' }).toBuffer();

        // Helper: Create Wrapping SVG Text
        const createSVGText = (text: string, width: number, height: number, fontSize: number = 20) => {
          // Robust word wrapping
          const words = (text || '').split(' ');
          let lines: string[] = [];
          let currentLine = words[0] || '';

          // Approx chars per line (conservative)
          const charLimit = Math.floor(width / (fontSize * 0.55)); // e.g. 600px / 11 = 54 chars

          for (let i = 1; i < words.length; i++) {
            if ((currentLine + " " + words[i]).length <= charLimit) {
              currentLine += " " + words[i];
            } else {
              lines.push(currentLine);
              currentLine = words[i];
            }
          }
          if (currentLine) lines.push(currentLine);

          // Force max 3 lines to avoid overflow
          if (lines.length > 3) {
            const keep = lines.slice(0, 2);
            keep.push(lines[2] + "...");
            lines = keep;
          }

          // Generate tspans
          // Starting Y position logic: Center is 50%.
          // If 1 line: y=50%
          // If 2 lines: y=50% - 0.6em (move up slightly)? 
          // Actually dominant-baseline="middle" handles single line well at 50%.
          // For multi-line, we need custom dy.

          let svgContent = '';
          if (lines.length <= 1) {
            svgContent = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${fontSize}" font-weight="bold" font-family="Arial, sans-serif" fill="#333">${lines[0] || ''}</text>`;
          } else {
            // Calculate start adjustment to center the block
            // 1em line height. 
            const startDy = -((lines.length - 1) * 0.6) + "em";
            const tspans = lines.map((line, i) => `<tspan x="50%" dy="${i === 0 ? startDy : '1.2em'}">${line}</tspan>`).join('');
            svgContent = `<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="${fontSize}" font-weight="bold" font-family="Arial, sans-serif" fill="#333">${tspans}</text>`;
          }

          return Buffer.from(`
            <svg width="${width}" height="${height}">
              <rect width="100%" height="100%" fill="rgba(255, 255, 255, 0.85)" rx="15" ry="15"/>
              ${svgContent}
            </svg>
          `);
        };

        const p1 = await resize(imageBuffers[0], 600, 500);
        const p1Text = createSVGText(scenes[0] || '', 600, 100);

        const p2 = await resize(imageBuffers[1], 414, 500);
        const p2Text = createSVGText(scenes[1] || '', 414, 100);

        const p3 = await resize(imageBuffers[2], 414, 500);
        const p3Text = createSVGText(scenes[2] || '', 414, 100);

        const p4 = await resize(imageBuffers[3], 600, 500);
        const p4Text = createSVGText(scenes[3] || '', 600, 100);

        const outputBuffer = await composite.composite([
          // Images
          { input: p1, top: 10, left: 10 },
          { input: p2, top: 10, left: 620 },
          { input: p3, top: 640, left: 10 }, // Moved down to accommodate text
          { input: p4, top: 640, left: 434 },

          // Text Below Images
          { input: p1Text, top: 520, left: 10 }, // 10 + 500 + 10 padding
          { input: p2Text, top: 520, left: 620 },
          { input: p3Text, top: 1150, left: 10 }, // 640 + 500 + 10
          { input: p4Text, top: 1150, left: 434 }
        ]).jpeg().toBuffer();

        const fs = await import('fs');
        const path = await import('path');
        const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }
        const filename = `comic-manga-${id}.jpg`;
        fs.writeFileSync(path.join(outputDir, filename), outputBuffer);
        gridImageUrl = `/generated/${filename}`;

      }
    } catch (e) {
      console.error("Manga assembly failed:", e);
    }

    const pages = sceneImages.map((imgUrl, i) => ({
      pageNumber: i + 1,
      imageUrl: imgUrl,
      text: scenes[i] || `Page ${i + 1}`
    }));

    // Save to DB
    // Save to DB
    const finalSavedUrl = gridImageUrl || sceneImages[0];
    if (finalSavedUrl) {
      console.log(`[Comic] Saving Picture Book record for user ${userId}`);
      await databaseService.saveImageRecord(
        userId,
        finalSavedUrl,
        'comic',
        userPrompt,
        {
          title: storyData.title,
          isGrid: !!gridImageUrl,
          isStoryBook: true, // Crucial for Viewer
          bookData: {
            title: storyData.title,
            coverImage: finalSavedUrl,
            pages: pages
          },
          pages: pages
        }
      );
    }

    res.json({
      id,
      title: storyData.title || "My Manga",
      summary: storyData.summary,
      pages,
      pageCount: pages.length,
      coverImageUrl: gridImageUrl || sceneImages[0],
      gridImageUrl,
      userId,
      createdAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Comic Generation Error:", error);
    res.status(500).json({ error: "Failed to generate comic" });
  }
});



// Get Public History (for random display)
router.get('/public', async (req, res) => {



  try {
    const images = await databaseService.getPublicImages();
    // Shuffle slightly or filtering can happen here
    const shuffled = images.sort(() => 0.5 - Math.random()).slice(0, 10);
    res.json(shuffled);
  } catch (error) {
    console.error('Failed to fetch public history:', error);
    res.json([]);
  }
});

// Get User History
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      console.warn('[API] /history Missing userId');
      return res.json([]);
    }

    console.log(`[API] /history Fetching for: '${userId}'`);
    const images = await databaseService.getUserImages(userId);
    console.log(`[API] /history Returning ${images.length} images for ${userId}`);
    res.json(images);
  } catch (error) {
    console.error('[API] /history Failed:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Toggle Favorite
router.post('/favorite', async (req, res) => {
  try {
    const { id, userId } = req.body;
    if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId' });

    const updated = await databaseService.toggleFavorite(id, userId);
    if (updated) {
      res.json(updated);
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Delete Image
router.delete('/image/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;
    if (!id || !userId) return res.status(400).json({ error: 'Missing id or userId' });

    const success = await databaseService.deleteImage(id, userId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Image not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Co-create
router.post('/cocreate', async (req, res) => {
  try {
    const { workIds, type, userId } = req.body;
    if (!workIds || !Array.isArray(workIds) || workIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 work IDs required' });
    }

    const id = uuidv4();
    let result;

    if (type === 'picture-book') {
      result = {
        id,
        type: 'picture-book',
        pages: Array.from({ length: 4 }, (_, i) => ({
          pageNumber: i + 1,
          imageUrl: `/mock/cocreate/${id}/page-${i + 1}.png`,
          text: `Co-created page ${i + 1}`
        }))
      };
    } else if (type === 'animation') {
      result = {
        id,
        type: 'animation',
        videoUrl: `/mock/cocreate/${id}/video.mp4`,
        durationSec: 50
      };
    } else {
      result = {
        id,
        type: 'audio-story',
        audioUrl: `/mock/cocreate/${id}/audio.mp3`,
        story: 'A co-created story from multiple artworks!'
      };
    }

    res.json({
      ...result,
      workIds,
      userId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to co-create content' });
  }
});

// --- MAGIC CREATIVE DIRECTOR ENDPOINTS (Gemini 3 Flash Brain) ---

// 1. Magic Comic (4-Panel)
router.post('/generate-magic-comic', upload.single('cartoonImage'), async (req, res) => {
  try {
    const userId = req.body.userId;
    const userPrompt = req.body.prompt || 'Funny story';
    const id = uuidv4();

    if (!userId) return res.status(401).json({ error: 'User ID required', errorCode: 'AUTH_REQUIRED' });

    // 1. Points (Cost: Comic Strip 10pts)
    const action = 'generate_comic_book';
    const cost = POINT_COSTS.COMIC_STRIP;
    const deduction = await pointsService.consumePoints(userId, action, cost);
    if (!deduction.success) {
      if (deduction.error === 'NOT_ENOUGH_POINTS') {
        const { current } = await pointsService.hasEnoughPoints(userId, action);
        return res.status(200).json({ success: false, errorCode: 'NOT_ENOUGH_POINTS', required: cost, current });
      }
      return res.status(500).json({ error: 'Points transaction failed' });
    }

    console.log(`[MagicComic] Starting Creative Director Flow for ${userId}...`);

    // 2. Handle Reference Image
    let base64Reference = '';
    let originalImageUrl = ''; // To return for persistence/display

    // Ensure upload dir exists
    const fs = await import('fs');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    if (req.file) {
      base64Reference = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

      // Save original file for persistence
      const ext = req.file.mimetype.split('/')[1] || 'png';
      const filename = `input-${id}.${ext}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);
      originalImageUrl = `/uploads/${filename}`;
    } else if (req.body.cartoonImageUrl) {
      // Fetch if URL provided
      try {
        const fetch = global.fetch;
        const resp = await fetch(req.body.cartoonImageUrl);
        if (resp.ok) {
          const arrayBuffer = await resp.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          base64Reference = `data:${resp.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString('base64')}`;

          // Save fetched file too
          const filename = `input-${id}.png`;
          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, buffer);
          originalImageUrl = `/uploads/${filename}`;
        }
      } catch (e) { console.error("URL Fetch failed", e); }
    }

    // 3. Creative Director: Generate Script
    let creativeContent;
    try {
      // Extract character traits from image (Mock or Vision) - we'll let Gemini Vision handle it if we pass image description
      // For now, pass base64Reference to Gemini Vision if desired, or simpler: 
      // We pass the userPrompt as "Theme".
      // Ideally we'd analyze image first. Let's do a quick analysis if we have image.
      let charDesc = "A cute character";
      if (base64Reference) {
        try {
          charDesc = await geminiService.analyzeImage(base64Reference, "Describe the main character's appearance (hair, eyes, clothes) for consistency.");
        } catch (e) { }
      }

      const userInput = {
        character_description: charDesc,
        theme: userPrompt
      };

      creativeContent = await geminiService.generateCreativeContent('Comic_4_Panel', userInput);
      console.log('[MagicComic] Creative Brief:', creativeContent.theme);

    } catch (brainErr) {
      console.error('[MagicComic] Brain Freeze (Gemini Failed), using Doubao fallback:', brainErr);
      // RELIABLE FALLBACK: Use Doubao to generate the 4-panel script if Gemini fails
      try {
        const panels = await doubaoService.summarizeStoryToComicPanels(userPrompt);
        creativeContent = {
          theme: userPrompt,
          character_lock: "The character from the image",
          content: panels.map((p: any) => ({
            image_prompt: p.sceneDescription,
            text_overlay: p.caption
          }))
        };
      } catch (fbErr) {
        console.error('[MagicComic] Doubao Story Fallback Failed:', fbErr);
        // Final last-resort content
        creativeContent = {
          theme: userPrompt,
          content: [
            { image_prompt: userPrompt, text_overlay: "Once upon a time..." },
            { image_prompt: userPrompt + " adventure", text_overlay: "Something happened..." },
            { image_prompt: userPrompt + " climax", text_overlay: "Then..." },
            { image_prompt: userPrompt + " ending", text_overlay: "The End." }
          ]
        };
      }
    }

    // 4. Execution: Generate Visuals (Parallel)
    const episodes = creativeContent.content || []; // New Schema: "content" array
    console.log(`[MagicComic] Generating ${episodes.length} panels via Doubao...`);

    const imagePromises = episodes.slice(0, 4).map((episode: any, i: number) => {
      // Inject style enforcement (Antigravity Visual Preset)
      // Architecture C: Text-First - Request empty space/no-text from AI
      const comicSuffix = ", (high quality comic art style, cell shaded, thick outlines, expressive, cinematic action shots, 4k, superhero vibrant palette). --no text, speech bubble, dialogue box, words, watermark, signature";
      const fullPrompt = `${episode.image_prompt}${comicSuffix}`;

      if (base64Reference) {
        // Vary reference influence? (Internal logic for SeaDream uses this as prompt context)
        console.log(`[MagicComic] Img2Img Panel ${i + 1}...`);
        return doubaoService.generateImageFromImage(fullPrompt, base64Reference, '2K')
          .catch((err) => {
            console.warn(`[MagicComic] Img2Img Fail for Panel ${i + 1}, trying T2I.`, err);
            return doubaoService.generateImage(fullPrompt, '2K');
          })
          .catch(() => `https://placehold.co/1024x1024/png?text=Panel+${i + 1}`);
      } else {
        return doubaoService.generateImage(fullPrompt, '2K').catch(() => `https://placehold.co/1024x1024/png?text=Panel+${i + 1}`);
      }
    });

    const panelImages = await Promise.all(imagePromises);

    // 5. Assemble Result
    // We return the separate images and the dialogue for the frontend "Comic Bubble" feature.
    // We also create a grid for the "Result" view.

    // ... (Reuse Sharp Grid Logic from previous implementation or skip grid if frontend handles layout)
    // Let's create a quick grid for social sharing compatibility
    let gridImageUrl = '';
    try {
      if (panelImages.length === 4) {
        const sharp = (await import('sharp')).default;

        // Fetch buffers
        const bufs = await Promise.all(panelImages.map(async url => {
          const r = await fetch(url);
          return Buffer.from(await r.arrayBuffer());
        }));

        const resized = await Promise.all(bufs.map(b => sharp(b).resize(512, 512).toBuffer()));

        // Create Text Overlays (Architecture C: "Burn-in")
        // Create Text Overlays (Architecture C: "Burn-in") - DISABLED FOR V2 SPEC (Frontend Overlay)
        // const overlays = episodes.slice(0, 4).map((e: any, i: number) => { ... });
        const overlays: any[] = [];

        const grid = await sharp({
          create: { width: 1024, height: 1024, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
        })
          .composite([
            { input: resized[0], top: 0, left: 0 },
            { input: resized[1], top: 0, left: 512 },
            { input: resized[2], top: 512, left: 0 },
            { input: resized[3], top: 512, left: 512 },
            ...overlays
          ])
          .jpeg({ quality: 90 })
          .toBuffer();

        const fs = await import('fs');
        const path = await import('path');
        const outDir = path.join(process.cwd(), 'client', 'public', 'generated');
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        const fname = `magic-comic-${id}.jpg`;
        fs.writeFileSync(path.join(outDir, fname), grid);
        gridImageUrl = `/generated/${fname}`;
      }
    } catch (gridErr) { console.error("Grid Assembly Failed:", gridErr); }

    // Save Record
    const finalUrl = gridImageUrl || panelImages[0];

    // Parse tags if sent (handle both stringified JSON or direct values)
    let characterTags = [];
    try {
      if (req.body.characters) {
        characterTags = JSON.parse(req.body.characters);
      }
    } catch (e) { characterTags = [req.body.characters]; }

    const tags = {
      storyType: req.body.storyType || 'Comic',
      visualStyle: req.body.visualStyle || 'Classic',
      characters: characterTags.length ? characterTags : ['Original']
    };

    await databaseService.saveImageRecord(
      userId, finalUrl, 'comic', userPrompt,
      {
        title: creativeContent.theme || userPrompt || "Untitled Comic",
        character_lock: creativeContent.character_lock || "Original",
        bookData: {
          pages: episodes.map((e: any, i: number) => ({
            imageUrl: panelImages[i],
            text: e.text_overlay
          })),
          storyCaptions: episodes.map((e: any) => e.text_overlay)
        },
        scenes: episodes.map((e: any, i: number) => ({
          imageUrl: panelImages[i],
          text: e.text_overlay,
          visual_prompt: e.image_prompt
        })),
        isMagicComic: true,
        isStoryBook: true, // Mark as storybook for History logic
        isTextBurnedIn: false, // NEW: Frontend knows text is already in image
        tags: tags,
        originalImageUrl: originalImageUrl
      }
    );

    res.json({
      id,
      title: creativeContent.theme,
      pages: episodes.map((e: any, i: number) => ({
        imageUrl: panelImages[i],
        text: e.text_overlay
      })),
      panels: episodes.map((e: any, i: number) => ({
        panel: i + 1,
        caption: e.text_overlay
      })),
      storyCaptions: episodes.map((e: any) => e.text_overlay),
      gridImageUrl: gridImageUrl || panelImages[0],
      isTextBurnedIn: false,
      tags: tags
    });

  } catch (error: any) {
    console.error('[MagicComic] Error:', error);
    const userId = req.body.userId;
    if (userId) await pointsService.refundPoints(userId, 'generate_comic_book', 'magic_failed');
    res.status(500).json({ error: error.message });
  }
});

// 2. Magic Picture Book (4-Page)
router.post('/generate-magic-book', upload.single('cartoonImage'), async (req, res) => {
  try {
    const theme = req.body.theme || 'Bedtime Story';
    const visualStyle = req.body.visualStyle || 'Classic';
    const pace = req.body.pace || 'Gentle';
    const characterRole = req.body.characterRole || 'Child';
    const pageCountRequested = parseInt(req.body.pageCount) || 4;
    const storyText = req.body.storyText || '';

    const userId = req.body.userId;
    const id = uuidv4();

    if (!userId) return res.status(401).json({ error: 'Auth Required', errorCode: 'AUTH_REQUIRED' });

    // 1. Points
    const action = 'generate_comic_book';
    const cost = pageCountRequested * 10; // 10 per page (4 pages = 40pts)
    const deduction = await pointsService.consumePoints(userId, action, cost);
    if (!deduction.success) {
      if (deduction.error === 'NOT_ENOUGH_POINTS') {
        const { current } = await pointsService.hasEnoughPoints(userId, action);
        return res.status(200).json({ success: false, errorCode: 'NOT_ENOUGH_POINTS', required: cost, current });
      }
      return res.status(500).json({ error: 'Points failed' });
    }
    console.log(`[MagicBook] Deducted ${cost} points for ${userId}. ${theme}`);

    // 2. Handle Reference Image
    let base64Reference = '';
    let originalImageUrl = '';

    const fs = await import('fs');
    const path = await import('path');
    const uploadDir = path.join(process.cwd(), 'client', 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    if (req.file) {
      base64Reference = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const ext = req.file.mimetype.split('/')[1] || 'png';
      const filename = `input-book-${id}.${ext}`;
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
      originalImageUrl = `/uploads/${filename}`;
    } else if (req.body.cartoonImageUrl) {
      try {
        const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default as any;
        const r = await fetchFn(req.body.cartoonImageUrl);
        if (r.ok) {
          const b = await r.arrayBuffer();
          const buffer = Buffer.from(b);
          base64Reference = `data:${r.headers.get('content-type') || 'image/jpeg'};base64,${buffer.toString('base64')}`;
          const filename = `input-book-${id}.png`;
          fs.writeFileSync(path.join(uploadDir, filename), buffer);
          originalImageUrl = `/uploads/${filename}`;
        }
      } catch (e) {
        console.error("[MagicBook] Reference image fetch failed", e);
      }
    }

    // --- STEP 0: Deep Vision Analysis ---
    let charDesc = characterRole;
    let extractedStyle = visualStyle;
    let keyObjects = "";

    if (base64Reference) {
      let visionResult = "";
      try {
        const analysisPrompt = `Identify and describe the main character, art style, AND any key objects or props in this image. 
        The protagonist's role is ${characterRole}. 
        Return ONLY valid JSON: { "char_desc": "detailed appearance", "art_style": "illustration style", "key_objects": "list important props like toys, hats, etc." }`;
        visionResult = await geminiService.analyzeImage(base64Reference, analysisPrompt);
        console.log(`[MagicBook-Deep] Vision Raw Response: ${visionResult.substring(0, 300)}`);

        let jsonStr = visionResult;
        const jsonMatch = visionResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        } else {
          jsonStr = visionResult.replace(/```json|```/g, '').trim();
        }

        const parsed = JSON.parse(jsonStr);
        charDesc = parsed.char_desc || charDesc;
        extractedStyle = parsed.art_style || extractedStyle;
        keyObjects = parsed.key_objects || "";
        console.log(`[MagicBook-Deep] Extracted Char: ${charDesc.substring(0, 40)}... | Props: ${keyObjects} | Style: ${extractedStyle}`);
      } catch (e) {
        console.error("[MagicBook-Deep] Vision JSON parsing failed. Result was:", visionResult);
        console.error(e);
      }
    }

    const userInput = {
      mandatory_protagonist_description: charDesc,
      key_objects_anchor: keyObjects,
      art_style_anchor: extractedStyle,
      theme,
      character_role: characterRole,
      visual_style: visualStyle,
      pace,
      page_count: pageCountRequested,
      story_concept: storyText
    };

    const requestType = pageCountRequested === 4 ? 'Picturebook_4_Page' : `Picturebook_${pageCountRequested}_Page`;
    let creativeContent: any;
    let episodes: any[] = [];
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        creativeContent = await geminiService.generateCreativeContent(requestType as any, userInput);
        episodes = creativeContent.content || [];

        if (episodes.length === pageCountRequested) {
          // Success: We got the right number of pages and it passed Gemini's internal validation
          break;
        } else {
          console.warn(`[MagicBook] Attempt ${retryCount + 1}: Expected ${pageCountRequested} pages but got ${episodes.length}.`);
        }
      } catch (err: any) {
        console.error(`[MagicBook] Attempt ${retryCount + 1} failed: ${err.message}`);
        if (retryCount === maxRetries) throw err; // Re-throw if all retries exhausted
      }
      retryCount++;
    }

    const pageCount = episodes.length;
    const finalTitle = creativeContent.title || creativeContent.theme || theme || 'My Magic Story';

    console.log(`[MagicBook] Story Generated: ${finalTitle} (${pageCount} pages)`);

    // 4. Sequential Image Generation (Consistency Enforcement)
    const seed = Math.floor(Math.random() * 1000000000);
    const pages: any[] = [];

    // PROMPT: "Picture Book Engine 2.0" requires sequential/consistent character.
    for (let i = 0; i < episodes.length; i++) {
      const episode = episodes[i];
      console.log(`[MagicBook-NEW] Drawing Page ${i + 1}/${episodes.length}...`);
      const charAnchor = creativeContent.character_lock || charDesc;

      const styleFuse = extractedStyle === visualStyle ? visualStyle : `${extractedStyle}, ${visualStyle}`;
      const actionDesc = episode.image_prompt || episode.visual_description || "interacting";

      // PROMPT SYNTHESIS: Prioritize User Text > Character > Theme > Style
      const userCustomDesc = userInput.story_concept ? `doing ${userInput.story_concept}` : "";
      const flowPrompt = `( Best Quality ), ${visualStyle} Style, ${charAnchor} ${userCustomDesc}, ${actionDesc}, ${theme} background, distinct features matching reference, 3d render`;

      try {
        let imgUrl = "";
        // Use Reference Image for ALL pages
        // Use Reference Image for ALL pages, but Fallback to T2I if api 400s
        if (base64Reference) {
          try {
            // Reverting to 0.6 due to API validation error with 0.75
            imgUrl = await doubaoService.generateImageFromImage(flowPrompt, base64Reference, '2K', seed, 0.6);
            if (!imgUrl) throw new Error("Doubao returned empty URL for Img2Img");
          } catch (imgErr) {
            console.warn(`[MagicBook] Img2Img failed for Page ${i + 1}, falling back to Text2Image. Reason:`, imgErr);
            imgUrl = await doubaoService.generateImage(flowPrompt, '2K', seed);
            if (!imgUrl) throw new Error("Doubao returned empty URL for Text2Image fallback");
          }
        } else {
          imgUrl = await doubaoService.generateImage(flowPrompt, '2K', seed);
        }

        let audioUrl = '';
        // CRITICAL FIX: Only generate audio if explicitly required. 
        // Picture Books currently DO NOT use audio, and generateSpeech causes crashes.
        const isAudioEnabled = false; // Force disable for Picture Book to prevent crash

        if (isAudioEnabled) {
          const buffer = await geminiService.generateSpeech(episode.text_overlay || `Page ${i + 1}`, 'en-US');
          const fname = `magic-book-${id}-p${i + 1}.mp3`;
          const outDir = path.join(process.cwd(), 'client', 'public', 'generated');
          const fsModule = await import('fs');
          if (!fsModule.existsSync(outDir)) fsModule.mkdirSync(outDir, { recursive: true });

          // Robust Audio Save
          try {
            fsModule.writeFileSync(path.join(outDir, fname), buffer);
            audioUrl = `/generated/${fname}`;
          } catch (fe) { console.error("Audio save failed", fe); }
        }

        pages.push({
          pageNumber: i + 1,
          imageUrl: imgUrl,
          narrativeText: episode.text_overlay,
          audioUrl: audioUrl
        });
      } catch (e) {
        console.error(`[MagicBook] Error generating page ${i + 1}:`, e);
        // Last resort fallback so we don't crash
        pages.push({
          pageNumber: i + 1,
          imageUrl: `https://placehold.co/1024x1024/png?text=Error+on+Page+${i + 1}`,
          narrativeText: episode.text_overlay,
          audioUrl: ''
        });
      }
    }

    const selectionTags = { theme, visualStyle, pace, characterRole };

    // 5. Save and Return
    const finalCharacterLock = creativeContent.character_lock || charDesc || characterRole;
    await databaseService.saveImageRecord(
      userId, pages[0].imageUrl, 'comic', theme,
      {
        title: finalTitle,
        character_lock: finalCharacterLock,
        isStoryBook: true,
        bookData: {
          title: finalTitle,
          coverImage: pages[0].imageUrl,
          pages: pages,
          pageCount,
          selectionTags
        },
        originalImageUrl: originalImageUrl || ''
      }
    );

    res.json({
      id,
      title: finalTitle,
      pages,
      coverImage: pages[0].imageUrl,
      pageCount,
      selectionTags,
      type: 'picture_book'
    });

  } catch (error: any) {
    console.error('Magic Book Gen Error:', error);
    const userId = req.body.userId;
    if (userId) {
      try {
        await pointsService.refundPoints(userId, 'generate_comic_book', `magic_failed: ${error.message}`);
      } catch (refundErr) {
        console.error('Refund Failed during error handling:', refundErr);
      }
    }
    res.status(500).json({
      error: error.message || 'Failed to create magic book',
      errorCode: 'GENERATION_FAILED'
    });
  }
});

// NEW: Standalone TTS Endpoint for "Expressive Voice" (Rate It)
router.post('/speak', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    // Use Gemini Speech (or Doubao if preferred/integrated inside geminiService)
    // 'en-US' is default in geminiService wrapper
    const buffer = await geminiService.generateSpeech(text, 'en-US');

    // Save file
    const id = uuidv4();
    const fs = await import('fs');
    const path = await import('path');
    const outDir = path.join(process.cwd(), 'client', 'public', 'generated');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const fname = `speech-${id}.mp3`;
    fs.writeFileSync(path.join(outDir, fname), buffer);

    res.json({ audioUrl: `/generated/${fname}`, success: true });
  } catch (error) {
    console.error('Speak Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

export default router;
