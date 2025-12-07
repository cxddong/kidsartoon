import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { doubaoService } from '../services/doubao.js';
import { geminiService } from '../services/gemini.js';
import { seedanceService } from '../services/seedance.js';
import { databaseService } from '../services/database.js';

export const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Image-to-Voice: analyze image + user voice to keywords, return audio URL and story
router.post('/image-to-voice', upload.single('image'), async (req, res) => {
  try {
    const userVoiceText = req.body.voiceText ?? '';
    const userId = req.body.userId;
    const lang = req.body.lang || 'en'; // 'en' or 'zh'
    const id = uuidv4();

    let imageDescription = "A creative drawing by a child.";
    if (req.file) {
      try {
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        // Vision Step
        imageDescription = await doubaoService.analyzeImage(base64Image,
          "Describe the characters, visual style, atmosphere, and key objects in this image for a children's story.");
      } catch (err) {
        console.error('Vision analysis failed:', err);
      }
    }

    // Voice-Friendly Prompt (Strictly following user specs)
    let prompt = '';

    if (lang === 'zh') {
      prompt = `
# Role Definition
You are a professional children's voice story creator.

# Core Goal
Create a rich, imaginative story (Simplified Chinese) based strictly on these visual details: ${imageDescription}
and user context: ${userVoiceText}.

# Strict Creation Rules
1. Image Alignment: The story MUST feature the specific characters, colors, and objects described above. Do not write a generic story.
2. Voice Adaptation Rules (Core):
- Sentence length: Short, rhythmic sentences.
- Language style: Warm, lively Chinese for 8-year-old children.
- Story duration: Approximately 500 Chinese characters (rich detail).
3. Content Style: Warm, positive, child's perspective.

# Output Format
- Output plain text only, no title, no notes.
- Continuous text (single paragraph).
`;
    } else {
      prompt = `
# Role Definition
You are a professional children's voice story creator.

# Core Goal
Create a rich, imaginative story based strictly on these visual details: ${imageDescription}
and user context: ${userVoiceText}.

# Strict Creation Rules
1. Image Alignment: The story MUST feature the specific characters, colors, and objects described above. Do not write a generic story.
2. Voice Adaptation Rules (Core):
- Sentence length: Standard storytelling flow.
- Language style: Colloquial English, in line with 8-year-old children.
- Story duration: Approximately 500 words (rich detail).
3. Content Style: Warm, positive, child's perspective (e.g., "little cutie").

# Output Format
- Output plain text only, no title, no notes.
- Continuous text (single paragraph).
`;
    }

    // 1. Generate Story
    const story = await doubaoService.generateStory(prompt);

    // 2. Generate Audio (Doubao TTS)
    let audioUrl = '';
    console.log(`Generating Speech (Doubao TTS) for lang: ${lang}...`);

    try {
      let audioBuffer: Buffer;

      if (lang === 'zh') {
        // Chinese: Use Doubao
        audioBuffer = await doubaoService.generateSpeech(story, 'alloy');
      } else {
        // English: Use Google AI (Gemini/TTS) as requested
        // Using 'en-US' by default for Google
        console.log("Using Google TTS for English...");
        audioBuffer = await geminiService.generateSpeech(story, 'en-US');
      }

      if (audioBuffer) {
        const fs = await import('fs');
        const path = await import('path');
        const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

        const filename = `audio-${id}.mp3`;
        const outputPath = path.join(outputDir, filename);
        fs.writeFileSync(outputPath, audioBuffer);

        audioUrl = `/generated/${filename}`;
      } else {
        throw new Error("TTS returned empty audio.");
      }
    } catch (ttsError: any) {
      console.error('TTS Implementation Failed (Soft Fail):', ttsError);
      // Fallback: Proceed without server-side audio. Client will handle it.
      audioUrl = '';
    }

    if (audioUrl) {
      try {
        await databaseService.saveImageRecord(userId || 'anonymous', audioUrl, 'story', userVoiceText, { story });
        if (userId) await databaseService.awardPoints(userId, 15, 'story');
      } catch (e) { }
    }

    res.json({
      id,
      keywords: [userVoiceText, 'creative'],
      story,
      audioUrl,
      userId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate audio story' });
  }
});


// Image-to-Image: generate cartoon image from user's drawing
router.post('/image-to-image', upload.single('image'), async (req, res) => {
  try {
    const userPrompt = req.body.prompt ?? '';
    const userId = req.body.userId;
    const id = uuidv4();

    let imageDescription = '';
    const finalPrompt = `Cartoon style children's book illustration, cute, colorful, high quality. 
    Visual content: ${imageDescription}. 
    User request: ${userPrompt}.`;

    let cartoonImageUrl;
    try {
      // Use actual Image-to-Image generation
      const base64Image = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : '';

      if (base64Image) {
        console.log('Generating cartoon using Gemini Vision + Gen...');
        cartoonImageUrl = await geminiService.generateImageFromImage(finalPrompt, base64Image, userId || 'anonymous');
      } else {
        console.log('No image file, falling back to Gemini Text-to-Image...');
        cartoonImageUrl = await geminiService.generateImage(finalPrompt, userId || 'anonymous');
      }
    } catch (genError) {
      console.error('Image generation failed, falling back to mock:', genError);
      import('fs').then(fs => {
        fs.appendFileSync('server_error.log', `${new Date().toISOString()} - Image Gen Error: ${genError}\n`);
      });
      cartoonImageUrl = `https://placehold.co/1024x1024/FF6B6B/white?text=Cartoon+Generation+Failed`;
    }

    // Save to DB
    try {
      if (req.file) {
        // We don't have the uploaded file URL (it's memory), so we skip saving "upload" type here for now unless we upload it somewhere.
        // But for generated, we save cartoonImageUrl.
      }
      if (cartoonImageUrl && !cartoonImageUrl.includes('placehold')) {
        await databaseService.saveImageRecord(
          userId || 'anonymous',
          cartoonImageUrl,
          'generated',
          finalPrompt
        );
        if (userId) await databaseService.awardPoints(userId, 8, 'generate');
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
    res.status(500).json({ error: 'Failed to generate cartoon image' });
  }
});

// Image-to-Video
router.post('/image-to-video', upload.single('image'), async (req, res) => {
  try {
    const userPrompt = req.body.prompt ?? '';
    const userId = req.body.userId;
    const id = uuidv4();

    const videoUrl = await doubaoService.generateVideo('mock-url', userPrompt);

    // Save Video Record (using default image type for now or extended)
    // The requirement said "image output", but video cover frame is image.
    // For now we just skip video URL saving or save as special type if DB supports it.
    // DB type supports 'animation'.
    if (videoUrl) {
      try {
        databaseService.saveImageRecord(userId || 'anonymous', videoUrl, 'animation', userPrompt);
        if (userId) databaseService.awardPoints(userId, 20, 'animation');
      } catch (e) { }
    }

    res.json({
      id,
      prompt: userPrompt,
      videoUrl,
      durationSec: 45,
      userId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate animation video' });
  }
});

// Generate Picture Book (Sequential with Official Logic)
router.post('/generate-picture-book', upload.single('cartoonImage'), async (req, res) => {
  try {
    const userPrompt = req.body.prompt ?? 'A fun story';
    const userId = req.body.userId || 'anonymous';
    const id = uuidv4();

    console.log('--- Generate Comic Book Request (Seedance Official Workflow) ---');
    console.log('User Prompt:', userPrompt);

    // 0. Handle Reference Image (for Vision and Consistency)
    let base64Reference = '';
    if (req.file) {
      base64Reference = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      console.log('Received Reference Image for Generation.');
    }

    // 1. Generate Story (Seed 1.6 Official Logic)
    console.log('Generating structured story (Vision)...');
    let storyData;
    try {
      storyData = await doubaoService.generateStoryJSON(userPrompt, base64Reference);
    } catch (storyError) {
      console.error('Story generation failed, using fallback:', storyError);
      storyData = {
        title: "My Story",
        summary: "A story about " + userPrompt,
        scenes: ["Story Gen Failed", "Please Try Again", "Server Error", "Contact Support"],
        scenes_detail: [userPrompt, userPrompt, userPrompt, userPrompt]
      };
    }

    const scenes = storyData.scenes || [];
    const sceneDetails = storyData.scenes_detail || [];

    // 2. Generate 4 Panels (Seedance 4.0 Logic)
    console.log('Generating images (Parallel, Img2Img if avail)...');
    let sceneImages: string[] = [];

    try {
      const imagePromises = sceneDetails.map((detail: string, index: number) => {
        // Seedance 4.0 Prompt Engineering
        const prompt = `Children's picture book illustration (Age 8-12), cartoon style. Panel ${index + 1} of 4. Scene: ${detail}. Layout: Vertical 9:16. Style: Children Friendly Cartoon. Quality: High Resolution, Mobile App Adapted.`;

        if (base64Reference) {
          // Use Img2Img for consistency with user upload
          return doubaoService.generateImageFromImage(prompt, base64Reference, '2K').catch(err => {
            console.error(`Panel ${index + 1} Img2Img failed:`, err);
            return 'https://placehold.co/1024x1024/png?text=Gen+Failed';
          });
        } else {
          return doubaoService.generateImage(prompt, '2K').catch(err => {
            console.error(`Panel ${index + 1} T2I failed:`, err);
            return 'https://placehold.co/1024x1024/png?text=Gen+Failed';
          });
        }
      });
      sceneImages = await Promise.all(imagePromises);
    } catch (err) {
      console.error('Failed to generate comic images:', err);
      sceneImages = Array(4).fill('https://placehold.co/1024x1024/png?text=Generation+Failed');
    }

    // 3. Assemble Vertical Strip with Text (Official Requirement)
    console.log('Assembling Vertical Comic with Text Overlay...');
    let gridImageUrl = '';
    let coverUrl = sceneImages[0];

    try {
      if (sceneImages.length >= 4) {
        const sharp = (await import('sharp')).default;

        // Fetch images
        const imageBuffers = await Promise.all(sceneImages.slice(0, 4).map(async (url) => {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }));

        // Resize to uniform square for grid slots
        const resizedBuffers = await Promise.all(imageBuffers.map(buf =>
          sharp(buf).resize(512, 512).toBuffer() // Make square first
        ));

        // Create Text Overlay (SVG)
        const createTextOverlay = (text: string, width: number, height: number, yOffset: number) => {
          // Basic wrapping
          const words = text.split(' ');
          let lines = [];
          let currentLine = words[0];
          for (let i = 1; i < words.length; i++) {
            if ((currentLine + " " + words[i]).length < 30) {
              currentLine += " " + words[i];
            } else {
              lines.push(currentLine);
              currentLine = words[i];
            }
          }
          lines.push(currentLine);

          // SVG Content
          const tspans = lines.map((line, i) =>
            `<tspan x="50%" dy="${i === 0 ? 0 : '1.2em'}">${line}</tspan>`
          ).join('');

          return `<svg width="${width}" height="${height}">
             <style>
               .text { fill: #333; font-family: sans-serif; font-size: 20px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
               .bg { fill: rgba(255, 255, 255, 0.9); }
             </style>
             <rect x="20" y="${yOffset}" width="${width - 40}" height="${lines.length * 24 + 30}" rx="10" class="bg" />
             <text x="50%" y="${yOffset + (lines.length * 24 + 30) / 2}" class="text">${tspans}</text>
           </svg>`;
        };

        // Panel 1 & 2 (Row 1), Panel 3 & 4 (Row 2) - BUT arranged vertically for "Mobile App"
        // Let's create a single vertical strip: 1024 wide, 4 * 1024 high? No, that's too big.
        // Let's do 750x1334 simulation.
        // Two panels stacked? Or 2x2 grid but taller?
        // User asked for "Single 4-panel comic". A 2x2 grid is standard 4-panel.
        // Let's make it a 2x2 grid but add TEXT underneath each panel.

        // Canvas size: 1024 wide x 1300 high (taller for text)
        const composite = await sharp({
          create: {
            width: 1024,
            height: 1300,
            channels: 4,
            background: { r: 255, g: 240, b: 245, alpha: 1 } // Light pinkish for warm feel
          }
        });

        // Top Left
        const p1 = resizedBuffers[0];
        const p1Text = Buffer.from(createTextOverlay(scenes[0] || "", 512, 140, 0));

        // Top Right
        const p2 = resizedBuffers[1];
        const p2Text = Buffer.from(createTextOverlay(scenes[1] || "", 512, 140, 0));

        // Bottom Left
        const p3 = resizedBuffers[2];
        const p3Text = Buffer.from(createTextOverlay(scenes[2] || "", 512, 140, 0));

        // Bottom Right
        const p4 = resizedBuffers[3];
        const p4Text = Buffer.from(createTextOverlay(scenes[3] || "", 512, 140, 0));

        // Layout: Images at (0,0), (512,0), (0,650), (512,650)
        // Text overlays inside or below? Let's put text ON the bottom of each image area.

        // Actually, let's composite text onto the resized buffers directly first? No, easier to compose all at once.

        const outputBuffer = await composite.composite([
          // Images
          { input: p1, top: 0, left: 0 },
          { input: p2, top: 0, left: 512 },
          { input: p3, top: 650, left: 0 },
          { input: p4, top: 650, left: 512 },

          // Text boxes (floating at bottom of each panel)
          { input: p1Text, top: 400, left: 0 },
          { input: p2Text, top: 400, left: 512 },
          { input: p3Text, top: 1050, left: 0 },
          { input: p4Text, top: 1050, left: 512 },

          // Divider Cross
          { input: Buffer.from('<svg width="1024" height="1300"><rect x="510" y="0" width="4" height="1300" fill="white" /><rect x="0" y="648" width="1024" height="4" fill="white" /></svg>'), top: 0, left: 0 }
        ]).jpeg().toBuffer();

        // Save
        const fs = await import('fs');
        const path = await import('path');
        const outputDir = path.join(process.cwd(), 'client', 'public', 'generated');
        if (!fs.existsSync(outputDir)) { fs.mkdirSync(outputDir, { recursive: true }); }

        const filename = `comic-official-${id}.jpg`;
        const outputPath = path.join(outputDir, filename);
        fs.writeFileSync(outputPath, outputBuffer);

        gridImageUrl = `/generated/${filename}`;
        coverUrl = gridImageUrl;
        console.log('Official Comic Generated:', gridImageUrl);

      }
    } catch (gridError) {
      console.error('Grid generation failed:', gridError);
    }

    const pages = sceneImages.map((imgUrl, i) => ({
      pageNumber: i + 1,
      imageUrl: imgUrl,
      text: scenes[i] || `Page ${i + 1}`
    }));

    // Save to DB (mock for now as per prev files)
    if (gridImageUrl) {
      try {
        databaseService.saveImageRecord(
          userId, gridImageUrl, 'comic', userPrompt,
          { title: storyData.title, isGrid: true }
        );
      } catch (e) { }
    }

    res.json({
      id,
      title: storyData.title || "My Story",
      summary: storyData.summary,
      pages,
      pageCount: pages.length,
      coverImageUrl: coverUrl,
      gridImageUrl,
      userId,
      createdAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('CRITICAL GENERATION ERROR:', error);
    const fallbackId = uuidv4();
    res.json({
      id: fallbackId,
      title: "Error Generating Story",
      summary: "Please try again.",
      pages: [],
      pageCount: 0,
      coverImageUrl: "https://placehold.co/1024x1024/png?text=Error",
      gridImageUrl: null,
      userId: req.body.userId,
      createdAt: new Date().toISOString()
    });
  }
});



// Get User History
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.json([]); // Return empty if no user (or handle as 400)
    }

    const images = await databaseService.getUserImages(userId);
    res.json(images);
  } catch (error) {
    console.error('Failed to fetch history:', error);
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
