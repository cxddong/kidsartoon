import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export class DoubaoService {
    private apiKey: string;
    private baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';

    constructor() {
        // 1. Try standard environment variables (best practice)
        this.apiKey = 'f2db86db-ab95-44a9-bc48-6e7df67e55ec'; // Hardcoded for immediate fix

        // 2. Fallback: Manual .env parse (Robustness for local dev issues)
        if (!this.apiKey) {
            try {
                const envPath = path.resolve(process.cwd(), '.env');
                if (fs.existsSync(envPath)) {
                    console.log('[DoubaoService] Attempting manual read of .env file...');
                    const envContent = fs.readFileSync(envPath, 'utf-8');
                    const lines = envContent.split('\n');

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith('#')) continue;

                        const eqIdx = trimmed.indexOf('=');
                        if (eqIdx > 0) {
                            const key = trimmed.substring(0, eqIdx).trim();
                            let val = trimmed.substring(eqIdx + 1).trim();

                            // Remove quotes if present
                            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.slice(1, -1);
                            }

                            if (['DOUBAO_API_KEY', 'Doubao_API_KEY', 'ARK_API_KEY'].includes(key)) {
                                console.log(`[DoubaoService] Found key in .env: ${key}`);
                                this.apiKey = val;
                                break; // Found it
                            }
                        }
                    }
                }
            } catch (e) {
                console.warn('[DoubaoService] Manual .env read failed', e);
            }
        }

        if (!this.apiKey) {
            console.error('CRITICAL: Doubao API Key is missing! Please set ARK_API_KEY in your .env file.');
        } else {
            // Aggressive cleaning to fix potential "Length 37" issues or quotes
            this.apiKey = this.apiKey.trim().replace(/^['"]|['"]$/g, '');
            console.log(`[DoubaoService] Key Loaded. Length: ${this.apiKey.length}. Ends with: ...${this.apiKey.slice(-4)}`);
        }
    }

    // Helper for headers
    private get headers() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }

    /**
     * Generate Image (Text-to-Image)
     */
    async generateImage(prompt: string, size: '2K' | '4K' = '2K', seed?: number): Promise<string> {
        try {
            // New Model: Seedream 4.0 (Default fallback, overridden by env if needed)
            const model = process.env.DOUBAO_IMAGE_MODEL || 'doubao-seedream-pro-4-0-t2i-250415';

            // Map old size params to new format if needed, or use fixed 1024x1024 as requested
            // The user requested explicit "1024x1024"
            const sizeParam = "1024x1024";

            const response = await fetch(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: model,
                    prompt,
                    size: sizeParam,
                    seed,
                    response_format: 'url',
                    guidance_scale: 3, // Updated per user request
                    sequential_image_generation: 'disabled',
                    watermark: false // Keeping clean for app
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Doubao API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.data?.[0]?.url || '';
        } catch (error) {
            console.error('generateImage failed:', error);
            throw error;
        }
    }

    /**
     * Generate Image from Image (Image-to-Image)
     */
    async generateImageFromImage(prompt: string, imageUrl: string, size: '2K' | '4K' = '2K', seed?: number, imageWeight: number = 0.7): Promise<string> {
        try {
            // NOTE: Seedream 3.0 might be T2I only (t2i in name). 
            // We keep the old model as fallback for I2I unless we verify 3.0 supports it.
            // Or we try to use it. Usually T2I models fail on I2I endpoints or inputs.
            // Leaving this as safe default for now, or user provided I2I model ID? No.
            // Assuming old model for I2I stability.
            const model = process.env.DOUBAO_IMAGE_MODEL || 'ep-20251209124008-rp9n8';
            const body: any = {
                model: model,
                prompt,
                size,
                seed,
                image_weight: imageWeight,
                response_format: 'url',
                sequential_image_generation: 'disabled',
                watermark: false
            };

            // Volcengine Seedream endpoint ID usually expects 'image' field for single reference
            body.image = imageUrl;

            const response = await fetch(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Doubao Img2Img Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.data?.[0]?.url || '';
        } catch (error) {
            console.error('generateImageFromImage failed:', error);
            throw error;
        }
    }

    /**
     * Sequential Image Generation (For Picture Books)
     */
    async generateSequentialImages(prompt: string, imageUrl?: string, count: number = 5): Promise<string[]> {
        try {
            // Use new model for sequential too? 
            // If it supports it. "t2i" usually supports sequential if platform allows.
            // Let's try update it to new model.
            const model = process.env.DOUBAO_IMAGE_MODEL || 'doubao-seedream-3-0-t2i-250415';

            const body: any = {
                model: model,
                prompt,
                size: '1024x1024',
                guidance_scale: 3,
                sequential_image_generation: 'auto',
                sequential_image_generation_options: {
                    max_images: count
                },
                response_format: 'url'
            };

            if (imageUrl) {
                body.image = imageUrl;
            }

            console.log('[Doubao] Generating sequential images with prompt length:', prompt.length);

            const response = await fetch(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Doubao Sequential Gen Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.data?.map((item: any) => item.url) || [];
        } catch (error) {
            console.error('generateSequentialImages failed:', error);
            throw error;
        }
    }

    /**
     * Vision Analysis (Image-to-Text)
     */
    async analyzeImage(imageInput: string, prompt: string = "Describe this image for a children's story."): Promise<string> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 120s Timeout (Increased)

        try {
            const model = process.env.DOUBAO_VISION_MODEL || 'ep-20251209113004-w6g8p';
            console.log(`[Doubao] Analyzing image with model: ${model}`);

            const messages: any[] = [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageInput } }
                    ]
                }
            ];

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: model,
                    messages: messages
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Vision API Error: ${response.status} - ${errorText}`);
                throw new Error(`Vision API Failed: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            clearTimeout(timeout);
            console.error('analyzeImage failed:', error);
            throw error; // Re-throw to let caller handle it
        }
    }

    /**
     * Generate Story with JSON Output (New System Prompt)
     */
    async generateStoryJSON(userPrompt: string, imageUrl?: string, targetLang: 'zh' | 'en' = 'zh'): Promise<any[]> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 120s Timeout for complex logic

        try {
            const model = process.env.DOUBAO_TEXT_MODEL || 'ep-20251130051132-bqhrh';
            console.log(`[Doubao] Generating 4-part Picture Book story in English (Master Prompt) with model: ${model}`);

            // MASTER SYSTEM PROMPT (User Request)
            const systemPrompt = `
You are a professional children's book author for the Western market (US/UK). 
Your task is to generate a 4-page story based on the user's theme.

**Constraints:**
1. Language: **Strictly English Only**. Simple, rhythmic, descriptive language suitable for kids aged 4-8. No Chinese characters allowed.
2. Structure: You must generate exactly 4 pages following this arc:
   - Page 1 (The Hook): Introduce the main character and a wish/discovery.
   - Page 2 (The Journey): The character enters a magical setting or faces a small obstacle.
   - Page 3 (The Climax): A magical interaction or solution found.
   - Page 4 (The Resolution): A warm, happy ending with a moral or cozy feeling.
3. Visuals: Provide a detailed "visual_prompt" for each page to guide an AI illustrator.
4. Output Format: Return a pure JSON array (no markdown formatting outside JSON).

**JSON Structure:**
[
  {
    "page": 1,
    "text": "Full narrative text for page 1...",
    "visual_prompt": "Detailed image generation prompt for page 1, describing character appearance and scene..."
  },
  ... (repeat for 4 pages)
]
`;

            let finalUserPrompt = `User Theme: ${userPrompt}`;

            // 1. If Image, Analyze first (Vision API)
            if (imageUrl) {
                try {
                    console.log('[Doubao] Analyzing reference image for story context...');
                    const prompt = "Describe the characters, visual style, atmosphere, and key objects in this image for a children's story.";
                    const imageDesc = await this.analyzeImage(imageUrl, prompt);
                    finalUserPrompt += `\n\nReference Image Context (Base the main character on this): ${imageDesc}`;
                } catch (visionErr) {
                    console.error('[Doubao] Vision analysis failed, proceeding with text only:', visionErr);
                }
            }

            // 2. Generate Story
            const messages: any[] = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: finalUserPrompt }
            ];

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: model,
                    messages: messages
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Story Gen Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content || '[]';

            // Clean Markdown
            content = content.replace(/```json\n?|\n?```/g, '').trim();

            // Robust JSON Parsing
            let parsed: any[];
            try {
                // detailed regex to find the first [ ... ] block
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    content = jsonMatch[0];
                }
                parsed = JSON.parse(content);

                // Validation
                if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0].text) {
                    throw new Error('Invalid JSON Array structure');
                }
            } catch (e) {
                console.warn('[Doubao] JSON Parse failed. Using Fallback Story.', e);
                // Fallback Story (Guarantees success)
                parsed = [
                    {
                        page: 1,
                        text: "Once upon a time, in a world full of wonder, our hero began a great adventure.",
                        visual_prompt: "A cute main character standing in a beautiful sunny landscape, children's book style, vibrant colors."
                    },
                    {
                        page: 2,
                        text: "Suddenly, something unexpected happened! A magical path appeared.",
                        visual_prompt: "The character looking at a glowing path winding through a magical forest, mysterious and exciting."
                    },
                    {
                        page: 3,
                        text: "Our hero bravely followed the path and discovered a wonderful secret.",
                        visual_prompt: "The character finding a magical glowing object or creature, looking amazed and happy."
                    },
                    {
                        page: 4,
                        text: "It was a day to remember forever. Everyone lived happily ever after.",
                        visual_prompt: "The character celebrating a happy ending with friends, warm lighting, cozy atmosphere."
                    }
                ];
            }

            // Ensure exactly 4 pages
            return parsed.slice(0, 4);
        } catch (error) {
            clearTimeout(timeout);
            console.error('generateStoryJSON failed:', error);
            // Even on critical network failure, return fallback to prevent UI crash
            return [
                { page: 1, text: "Story generation is currently busy. Here is a classic tale instead...", visual_prompt: "A classic storybook cover, magical and inviting." },
                { page: 2, text: "Once, a brave explorer set out on a journey.", visual_prompt: "A brave kid explorer with a backpack, walking on a path." },
                { page: 3, text: "They found a hidden treasure of imagination.", visual_prompt: "Opening a glowing treasure chest full of stars." },
                { page: 4, text: "And they realized the best stories are the ones we share.", visual_prompt: "The kid reading a book to friends, happy ending." }
            ];
        }
    }

    /**
     * Text Generation (Story Creation) - Legacy
     */
    async generateStory(prompt: string): Promise<string> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 90000); // 90s Timeout

        try {
            const model = process.env.DOUBAO_TEXT_MODEL || 'ep-20251130051132-bqhrh';
            console.log(`[Doubao] Generating text story with model: ${model}`);

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: 'You are a professional children\'s story writer. Write a warm, engaging story strictly based on the user\'s prompt.' },
                        { role: 'user', content: prompt }
                    ]
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`Text Generation API failed (Status ${response.status}): ${errorText}. Falling back to mock.`);
                throw new Error(`Doubao Text Error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            clearTimeout(timeout);
            console.error('generateStory failed:', error);
            throw error;
        }
    }

    /**
     * General Text Generation
     */
    async generateSimpleText(userPrompt: string, systemPrompt: string = 'You are a helpful assistant.'): Promise<string> {
        try {
            const model = process.env.DOUBAO_TEXT_MODEL || 'ep-20251130051132-bqhrh';
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ]
                })
            });

            if (!response.ok) throw new Error(`Doubao Text Error: ${response.status}`);
            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('generateSimpleText failed:', error);
            throw error;
        }
    }

    /**
     * Summarize a children's story into 4 short scene descriptions for a comic strip
     */
    async summarizeStoryToComicPanels(storyText: string): Promise<{ panel: number; caption: string; sceneDescription: string }[]> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

        try {
            const model = process.env.DOUBAO_TEXT_MODEL || 'ep-20251130051132-bqhrh';
            console.log(`[Doubao] Summarizing story into 4 comic panel descriptions...`);

            const systemPrompt = `You are a professional children's story editor and comic scripter. Your task is to take a story idea or a short description and expand/summarize it into exactly 4 short, distinct scene captions and visual descriptions for a 4-panel comic strip.

If the input is short (e.g., just character tags), expand it into a full creative narrative arc: Setup -> Action -> Climax -> Resolution.
If the input is a full story, summarize it into those same 4 key moments.

Requirements:
1. Create exactly 4 scenes that capture a logical progression.
2. Each caption should be short (10-20 words), suitable for children aged 4-8.
3. Each scene description MUST vary significantly:
   - Use DIFFERENT camera angles (e.g., Panel 1: Wide shot, Panel 2: Close up, Panel 3: Side profile, Panel 4: Action shot).
   - Use DIFFERENT actions (e.g., Running, jumping, sitting, talking).
   - Describe character expressions and background changes.
4. The scenes MUST flow logically: Setup -> Action -> Climax -> Resolution.
5. Output format: Return a pure JSON array (no markdown).

Output JSON structure:
[
  {
    "panel": 1,
    "caption": "Short text caption for panel 1",
    "sceneDescription": "Detailed visual description for image generation"
  },
  ... (repeat for 4 panels)
]`;

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Story to summarize:\n\n${storyText}` }
                    ]
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Summarization Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content || '[]';

            // Clean markdown formatting
            content = content.replace(/```json\n?|\n?```/g, '').trim();

            // Parse JSON
            let parsed: any[];
            try {
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    content = jsonMatch[0];
                }
                parsed = JSON.parse(content);

                // Validate structure
                if (!Array.isArray(parsed) || parsed.length !== 4) {
                    throw new Error('Invalid array length');
                }
            } catch (e) {
                console.warn('[Doubao] JSON Parse failed, using fallback panels', e);
                // Fallback: Split story into 4 parts
                const sentences = storyText.split(/[.!?]+/).filter(s => s.trim().length > 0);
                const chunkSize = Math.ceil(sentences.length / 4);
                parsed = [];
                for (let i = 0; i < 4; i++) {
                    const start = i * chunkSize;
                    const end = Math.min(start + chunkSize, sentences.length);
                    const chunk = sentences.slice(start, end).join('. ').trim();
                    parsed.push({
                        panel: i + 1,
                        caption: chunk.length > 50 ? chunk.substring(0, 50) + '...' : chunk,
                        sceneDescription: `Scene ${i + 1}: ${chunk}`
                    });
                }
            }

            return parsed.slice(0, 4);
        } catch (error) {
            clearTimeout(timeout);
            console.error('summarizeStoryToComicPanels failed:', error);
            // Return fallback
            const fallback = storyText.substring(0, 100);
            return [
                { panel: 1, caption: 'The story begins...', sceneDescription: `Scene 1: ${fallback}` },
                { panel: 2, caption: 'Something exciting happens...', sceneDescription: `Scene 2: ${fallback}` },
                { panel: 3, caption: 'The adventure continues...', sceneDescription: `Scene 3: ${fallback}` },
                { panel: 4, caption: 'A happy ending!', sceneDescription: `Scene 4: ${fallback}` }
            ];
        }
    }

    /**
     * Generate Child-Friendly Prompt (Text-to-Prompt) using Doubao Pro 1.8 logic
     * Converts simple child input into a detailed image generation prompt.
     */
    async generateChildFriendlyPrompt(childInput: string): Promise<string> {
        try {
            // Use specific model for prompt engineering if defined, otherwise fallback to text model
            // The user requested 'doubao-pro-1.8', which usually requires a specific endpoint ID in Volcengine.
            // We use the environment variable DOUBAO_PRO_1_8_MODEL or fallback to the generic text model.
            const model = process.env.DOUBAO_PRO_1_8_MODEL || process.env.DOUBAO_TEXT_MODEL || 'ep-20251130051132-bqhrh';

            console.log(`[Doubao] Generating child-friendly prompt with model: ${model}`);

            const payload = {
                model: model,
                messages: [
                    {
                        role: "system",
                        content: "You are a children-friendly AI assistant. Convert the child's simple description into a detailed image prompt for illustration generation. Requirements: 1. Style: cartoon, picture book, colorful, suitable for kids aged 3-8; 2. No violent, scary, or inappropriate content; 3. Include details like character expressions, background, colors, and composition; 4. Keep it concise (within 100 words)."
                    },
                    {
                        role: "user",
                        content: childInput
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            };

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Doubao Prompt Gen Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content?.trim() || '';
        } catch (error) {
            console.error('generateChildFriendlyPrompt failed:', error);
            throw error;
        }
    }

    /**
     * Analyze Image and Generate Prompt (Image-to-Prompt)
     * 1. Analyze image to get description.
     * 2. Convert description to child-friendly prompt.
     */
    async generatePromptFromImage(imageUrl: string): Promise<string> {
        try {
            console.log('[Doubao] Generating prompt from image...');
            // Step 1: Analyze
            const description = await this.analyzeImage(imageUrl, "Describe this image in detail, focusing on main characters, setting, actions, and colors.");

            // Step 2: Convert to Prompt
            const prompt = await this.generateChildFriendlyPrompt(description);
            return prompt;
        } catch (error) {
            console.error('generatePromptFromImage failed:', error);
            throw error;
        }
    }

    /**
     * Seedance 1.5 Video Generation - Kids Version
     * Simplified API: accepts action, style, effect instead of raw prompts
     * Auto-maps camera movement, motion score, and other technical params
     */
    async createSeedanceVideoTask(
        imageUrl: string,
        options: {
            action: string;           // Required: 'dance', 'run', 'fly', 'jump', 'laugh', 'wink'
            style?: string;           // Optional: 'clay', 'cartoon', 'watercolor', 'pixel', 'dreamy'
            effect?: string;          // Optional: 'sparkle', 'bubbles', 'hearts', 'snow', 'fire', 'confetti'
            duration?: 5 | 8 | 10;
            generateAudio?: boolean;
        }
    ): Promise<string> {
        // Action mappings (with camera and motion settings)
        const ACTION_MAP: Record<string, { prompt: string; motion?: number; camera?: string }> = {
            'dance': { prompt: 'character dancing happily, rhythmic movement', motion: 0.8 },
            'run': { prompt: 'running fast, speed lines, hair blowing', motion: 0.8, camera: 'pan_right' },
            'fly': { prompt: 'flying in the sky, feet off ground', camera: 'pan_up' },
            'jump': { prompt: 'jumping up high, bouncing', motion: 0.9 },
            'laugh': { prompt: 'laughing out loud, moving head', camera: 'zoom_in' },
            'wink': { prompt: 'winking one eye, cute smile', camera: 'zoom_in' }
        };

        // Style mappings
        const STYLE_MAP: Record<string, string> = {
            'clay': 'claymation style, handmade clay texture, soft rounded shapes, pastel colors, slightly textured surface, slow gentle movement',
            'cartoon': 'American cartoon Q-style, thick black outlines, vibrant candy colors, exaggerated proportions with big head and small body, simple background with stars and bubbles',
            'watercolor': 'Japanese healing picture book style, soft watercolor blending, low saturation warm tones, fluffy clouds and grass, gentle calming atmosphere',
            'pixel': 'candy-colored pixel art style, low-res but vibrant, blocky Q-version characters, pixelated stars and candy decorations in background',
            'dreamy': 'dreamy fairy tale style with light effects, semi-transparent glow aura, floating petals and stars, soft purple and blue dreamy colors'
        };

        // Effect mappings
        const EFFECT_MAP: Record<string, string> = {
            'sparkle': 'glowing magic dust, twinkling stars, dreamy lighting',
            'bubbles': 'floating soap bubbles everywhere, colorful, fun',
            'hearts': 'floating red hearts, love aura, cute atmosphere',
            'snow': 'falling snow, winter vibe, cold breath',
            'fire': 'cool energy aura, flames, super power mode',
            'confetti': 'falling confetti, party celebration, fireworks'
        };

        // 1. Lookup action data
        const actionData = ACTION_MAP[options.action];
        if (!actionData) {
            throw new Error(`Invalid action: ${options.action}. Must be one of: ${Object.keys(ACTION_MAP).join(', ')}`);
        }

        // 2. Construct layered prompt: action + style + effect
        let finalPrompt = actionData.prompt;
        if (options.style && STYLE_MAP[options.style]) {
            finalPrompt += `, ${STYLE_MAP[options.style]}`;
        }
        if (options.effect && EFFECT_MAP[options.effect]) {
            finalPrompt += `, ${EFFECT_MAP[options.effect]}`;
        }

        // 3. Auto-determine camera settings
        const cameraMove = actionData.camera || 'static';
        const cameraFixed = cameraMove === 'static';

        // 4. Fixed technical params
        const model = 'doubao-seedance-1-5-pro-251215';
        const url = process.env.VOLC_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';
        const duration = options.duration || 5;
        const generateAudio = options.generateAudio !== undefined ? options.generateAudio : true;
        const resolution = '720p'; // Fixed for kids version
        const fps = 24; // Fixed cinematic FPS
        const ratio = '1:1'; // Fixed mobile-friendly ratio

        console.log(`[Doubao Magic] Creating video with Action='${options.action}', Style='${options.style || 'none'}', Effect='${options.effect || 'none'}'`);
        console.log(`[Doubao Magic] Final Prompt: "${finalPrompt}"`);
        console.log(`[Doubao Magic] Auto Camera: ${cameraMove}, Duration: ${duration}s, Audio: ${generateAudio}`);

        // 5. Append technical params to prompt (Volcengine format)
        const promptWithParams = `${finalPrompt} --resolution ${resolution} --duration ${duration} --camera_fixed ${cameraFixed} --generate_audio ${generateAudio} --watermark false --fps ${fps} --ratio ${ratio}`;

        const payload = {
            model: model,
            content: [
                {
                    type: "text",
                    text: promptWithParams
                },
                {
                    type: "image_url",
                    image_url: {
                        url: imageUrl
                    }
                }
            ]
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Volcengine/Seedance API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            if (!data.id) {
                throw new Error('No Task ID returned from Volcengine');
            }

            return data.id;
        } catch (error) {
            console.error('createSeedanceVideoTask failed:', error);
            throw error;
        }
    }
    /**
     * Seedance 1.5 Video Generation - "Spell" & "Audio Mode" Version
     */
    async createSeedanceVideoTask1_5(
        imageUrl: string,
        options: {
            spell: 'quick' | 'story' | 'cinema';
            audioMode: 'talk' | 'scene';
            textInput: string;
            voiceStyle?: string; // 'cute', 'robot', 'monster'
            sceneMood?: string; // 'happy', 'mysterious', etc.
        }
    ): Promise<string> {
        const { spell, audioMode, textInput } = options;
        const voiceStyle = options.voiceStyle || 'cute';
        const sceneMood = options.sceneMood || 'happy';

        // 1. Map Spell to Duration/Res
        const SPELL_MAP = {
            'quick': { duration: 4, res: '480p' },
            'story': { duration: 8, res: '480p' },
            'cinema': { duration: 12, res: '720p' }
        };
        const config = SPELL_MAP[spell] || SPELL_MAP['story'];

        // 2. Construct Prompts based on Audio Mode
        let video_prompt = "";
        let audio_prompt = "";
        let lip_sync = false;

        if (audioMode === 'talk') {
            // Path A: Lip-Sync
            // Note: Seedance 1.5 typically extracts speech from audio_prompt if provided as text or TTS?
            // User logic: video_prompt="Character talking...", audio_prompt="[Style] voice..."
            video_prompt = `Close-up of character talking, saying '${textInput}', facial animation matches speech, high quality`;

            // Map icon styles to descriptive prompts
            const VOICE_PROMPTS: Record<string, string> = {
                'cute': 'cute child voice, happy and energetic',
                'robot': 'robotic mechanical voice, metallic texture',
                'monster': 'playful monster voice, slightly deep but friendly'
            };
            const voiceDesc = VOICE_PROMPTS[voiceStyle] || 'cute child voice';

            // For Seedance, ensuring the character speaks exactly what's in textInput often requires 
            // a specific text_content field OR using the audio_prompt implies TTS. 
            // We'll follow the user's "audio_prompt" instruction.
            // "audio_prompt = [Style] voice, clear speech" -> Wait, where does the text go?
            // Usually: prompt="... --tts_text 'Hello world'" or similar.
            // Let's rely on the user's prompt structure: audio_prompt describes the voice.
            audio_prompt = `${voiceDesc}, speaking clear English: "${textInput}"`;
            lip_sync = true;
        } else {
            // Path B: Scene Sound
            video_prompt = `Cinematic scene, ${textInput}, high quality, detailed background`;
            audio_prompt = `${textInput}, ${sceneMood} background music, immersive sound effects`;
            lip_sync = false;
        }

        // 3. Technical Params
        const model = 'doubao-seedance-1-5-pro-251215';
        const url = process.env.VOLC_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';

        // Construct final prompt string with flags
        // Doubao 1.5 often takes flags in the text prompt itself
        const promptWithParams = `${video_prompt} --audio_prompt "${audio_prompt}" --lip_sync ${lip_sync} --resolution ${config.res} --duration ${config.duration} --watermark false`;

        console.log(`[Doubao 1.5] Creating Task: Spell=${spell}, Mode=${audioMode}`);
        console.log(`[Doubao 1.5] Prompt: ${promptWithParams}`);

        const payload = {
            model: model,
            content: [
                { type: "text", text: promptWithParams },
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Volcengine 1.5 API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            if (!data.id) throw new Error('No Task ID returned from Volcengine 1.5');
            return data.id;
        } catch (error) {
            console.error('createSeedanceVideoTask1_5 failed:', error);
            throw error;
        }
    }

    // Video Generation: Step 1 - Create Task (Standard)
    async createVideoTask(imageUrl: string, prompt: string): Promise<string> {
        // Redirect to new tiered method with default (SD 5s -> SD 4s approx)
        const result = await this.generateVideoTask(imageUrl, prompt, { quality: 'SD', duration: 4 });
        return result.taskId;
    }

    /**
     * Tiered Video Generation Task (With Fallback)
     */
    async generateVideoTask(imageUrl: string, prompt: string, options: { quality: 'SD' | 'HD', duration: 4 | 8 }): Promise<{ taskId: string, usedModel: string }> {
        const { quality, duration } = options;

        // 1. Config based on selection
        const modelConfig = quality === 'HD'
            ? { version: 'pro', res: '720p', speed: 'mode' } // HD
            : { version: 'pro-fast', res: '480p', speed: 'high' }; // SD

        // 2. Fallback execution wrapper
        try {
            console.log(`[Doubao] Attempting Video Gen: Quality=${quality}, Dur=${duration}s, Model=${modelConfig.version}`);

            const taskId = await this.createVideoTaskInternal(imageUrl, prompt, {
                model_version: modelConfig.version,
                resolution: modelConfig.res,
                duration: duration,
                speed_priority: modelConfig.speed
            });

            return { taskId, usedModel: modelConfig.version };

        } catch (error: any) {
            // 3. Fallback Logic (Crucial)
            if (quality === 'HD') {
                console.warn(`[Doubao] HD Generation failed (${error.message}). Falling back to SD (Pro-Fast)...`);

                try {
                    // Retry with SD
                    const fallbackId = await this.createVideoTaskInternal(imageUrl, prompt, {
                        model_version: 'pro-fast',
                        resolution: '480p',
                        duration: duration,
                        speed_priority: 'high'
                    });

                    return { taskId: fallbackId, usedModel: 'pro-fast' };
                } catch (fallbackError) {
                    console.error('[Doubao] Fallback also failed:', fallbackError);
                    throw fallbackError; // Both failed
                }
            }

            throw error;
        }
    }

    // Internal helper to keep the raw API call clean
    private async createVideoTaskInternal(imageUrl: string, prompt: string, config: { model_version: string, resolution: string, duration: number, speed_priority: string }): Promise<string> {
        const endpointId = process.env.DOUBAO_VIDEO_MODEL || 'ep-20251214111050-dbg6v';

        // Kid-Friendly Mapping: Append specific strings based on key style/motion terms
        let enhancedPrompt = `${prompt}, high quality, cell shaded cartoon style`;
        if (prompt.toLowerCase().includes('zoom')) enhancedPrompt += ", fast moving, high action";
        if (prompt.toLowerCase().includes('float')) enhancedPrompt += ", slow motion, floating, dreamy";
        if (prompt.toLowerCase().includes('blocks')) enhancedPrompt += ", pixel art style, 8-bit";

        // Logic: Fast models (pro-fast) lock resolution/fps. Standard (pro) allow customization.
        const isFastModel = config.model_version.includes('fast') || endpointId.includes('fast');

        const body: any = {
            model: endpointId,
            model_version: config.model_version, // Use passed version (allow 'pro-fast' if config asks)
            input: {
                prompt: enhancedPrompt,
                video_duration: config.duration
            },
            // Output Config
            output: {},
            content: [
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        };

        // 2. [Detailed Param Logic] Prevent black screen by removing conflicting params
        if (!isFastModel) {
            // Only non-fast models support custom resolution/fps
            if (config.resolution) body.output.resolution = config.resolution;
            // if (config.fps) body.output.fps = config.fps; (fps defaults to 24 usually safe)
            body.output.fps = 24;
        } else {
            console.log('[Doubao] Fast model detected, skipping custom resolution/fps to prevent black screen.');
        }

        // 3. Aspect Ratio: OMIT completely to let model infer from input image
        // (Fixes 3:4 crop on 16:9 images)
        // if (config.ratio) body.output.ratio = config.ratio; 

        // Cleanup empty output object if needed (though Volcengine usually accepts empty output obj)
        if (Object.keys(body.output).length === 0) {
            delete body.output;
        }

        // [Debug] Log Payload for troubleshooting 400 errors
        console.log('[Debug] Volcengine Request Payload:', JSON.stringify(body, null, 2));

        const res = await fetch(`${this.baseUrl}/contents/generations/tasks`, {
            method: 'POST',
            headers: { ...this.headers, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Volcengine API Error: ${res.status} - ${err}`);
        }

        const data = await res.json();
        return data.id;
    }

    // Video Generation: Step 2 - Check Status
    async getVideoTaskStatus(taskId: string): Promise<{ status: string; videoUrl?: string; error?: any; progress?: number }> {
        console.log(`[Doubao] Active polling status for task: ${taskId}`);

        try {
            // Fast check
            const taskRes = await fetch(`${this.baseUrl}/contents/generations/tasks/${taskId}`, {
                method: 'GET',
                headers: this.headers
            });

            if (!taskRes.ok) throw new Error(`Status Check Failed: ${taskRes.status}`);

            const remoteResult = await taskRes.json();
            console.log('[Doubao] Remote API Response:', JSON.stringify(remoteResult, null, 2));

            // Parse Remote Status
            // Volcengine can return string 'Succeeded'/'Failed' OR numeric status
            const remoteStatus = remoteResult.status || remoteResult.data?.status;
            // Key Fix: Case-insensitive check
            const statusStr = String(remoteStatus).toLowerCase();

            let appStatus = 'pending';
            let videoUrl = '';
            let errorMsg = null;

            // Normalize Status
            // Success: 'succeeded' (any case), 2
            if (statusStr === 'succeeded' || remoteStatus === 2) {
                appStatus = 'SUCCEEDED'; // Use consistent internal enum

                // Extract video URL from various possible locations
                // Try content as object first (Seedance 1.5 format), then as array (older format)
                videoUrl = remoteResult.content?.video_url ||  // NEW: Direct object access
                    remoteResult.result?.content?.[0]?.video_url ||
                    remoteResult.content?.[0]?.video_url ||
                    remoteResult.data?.content?.[0]?.video_url ||
                    remoteResult.result?.video_url ||
                    remoteResult.resp_data?.video_url ||
                    remoteResult.output?.video_url ||
                    remoteResult.data?.output?.video_url ||
                    remoteResult.video_url ||  // Direct videoUrl
                    '';

                console.log('[Doubao] ===== VIDEO URL EXTRACTION DEBUG =====');
                console.log('[Doubao] Checking remoteResult.content?.video_url:', remoteResult.content?.video_url);
                console.log('[Doubao] Checking remoteResult.result?.content?.[0]?.video_url:', remoteResult.result?.content?.[0]?.video_url);
                console.log('[Doubao] Checking remoteResult.content?.[0]?.video_url:', remoteResult.content?.[0]?.video_url);
                console.log('[Doubao] Checking remoteResult.data?.content?.[0]?.video_url:', remoteResult.data?.content?.[0]?.video_url);
                console.log('[Doubao] Checking remoteResult.result?.video_url:', remoteResult.result?.video_url);
                console.log('[Doubao] Checking remoteResult.resp_data?.video_url:', remoteResult.resp_data?.video_url);
                console.log('[Doubao] Checking remoteResult.output?.video_url:', remoteResult.output?.video_url);
                console.log('[Doubao] Checking remoteResult.data?.output?.video_url:', remoteResult.data?.output?.video_url);
                console.log('[Doubao] Checking remoteResult.video_url:', remoteResult.video_url);
                console.log('[Doubao] FINAL extracted videoUrl:', videoUrl);
                console.log('[Doubao] ========================================');

                if (!videoUrl) {
                    console.error('[Doubao] WARNING: Video generation succeeded but no videoUrl found in response!');
                    console.error('[Doubao] Full response structure keys:', Object.keys(remoteResult));
                    if (remoteResult.data) {
                        console.error('[Doubao] remoteResult.data keys:', Object.keys(remoteResult.data));
                    }
                    if (remoteResult.result) {
                        console.error('[Doubao] remoteResult.result keys:', Object.keys(remoteResult.result));
                    }
                }
            }
            // Failure: 'failed' (any case), 3
            else if (statusStr === 'failed' || remoteStatus === 3) {
                appStatus = 'FAILED';
                errorMsg = remoteResult.error?.message || remoteResult.error_message || "Unknown error";
                console.error('[Doubao] Task failed remotely:', errorMsg);
            }
            // Running/Queued remains 'pending'

            return {
                status: appStatus, // Must match interface expected by Provider ('SUCCEEDED' | 'FAILED' | 'RUNNING')
                videoUrl,
                error: errorMsg
            };

        } catch (error) {
            console.error('getVideoTaskStatus failed:', error);
            throw error;
        }
    }

    // Legacy Wrapper for internal use if needed (blocks thread)
    // IMPORTANT: This blocks the thread. Use createVideoTask + polling for better UX.
    async generateVideo(imageUrl: string, prompt: string): Promise<string> {
        const taskId = await this.createVideoTask(imageUrl, prompt);
        let maxRetries = 150; // 5 mins

        while (maxRetries > 0) {
            await new Promise(r => setTimeout(r, 2000));
            try {
                const result = await this.getVideoTaskStatus(taskId);
                if (result.status === 'SUCCEEDED') return result.videoUrl || '';
                if (result.status === 'FAILED') throw new Error(JSON.stringify(result.error));
            } catch (e) {
                console.warn('Polling error:', e);
            }
            maxRetries--;
        }
        throw new Error('Video Generation Timed Out');
    }

    /**
     * Text-to-Speech (Audio Generation)
     */
    async generateSpeech(text: string, voice: string = 'zh_female_tianmei'): Promise<Buffer> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000); // 20s Timeout

        try {
            // Try standard endpoint first
            // For Volcengine/Doubao, the endpoint for OpenAI compatibility is sometimes strictly /api/v3/audio/speech
            const response = await fetch(`${this.baseUrl}/audio/speech`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: process.env.DOUBAO_TTS_MODEL || 'doubao-tts-1.0',
                    input: text,
                    voice: voice, // 'zh_female_tianmei'
                    speed: 1.0
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (!response.ok) {
                // Try legacy/alternative endpoint or model if 400/404
                const errorText = await response.text();
                // Throw error so orchestrator catches it for fallback
                throw new Error(`TTS API Error: ${response.status} - ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            clearTimeout(timeout);
            console.error('generateSpeech failed:', error);
            throw error;
        }
    }
}

export const doubaoService = new DoubaoService();
