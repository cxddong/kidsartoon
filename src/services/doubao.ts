import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export class DoubaoService {
    private apiKey: string;
    private baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';

    constructor() {
        // 1. Try standard environment variables (best practice)
        this.apiKey = process.env.DOUBAO_API_KEY || process.env.Doubao_API_KEY || process.env.ARK_API_KEY || '';

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

    /**
     * Normalize image input to clean base64 string or original URL
     */
    private normalizeBase64(imageInput: string): string {
        if (!imageInput) return '';
        if (imageInput.includes('base64,')) {
            return imageInput.split('base64,')[1];
        }

        // Handle local paths by reading from public directory
        if (imageInput.startsWith('/')) {
            try {
                const publicDir = path.join(process.cwd(), 'client', 'public');
                const filePath = path.join(publicDir, imageInput);
                if (fs.existsSync(filePath)) {
                    console.log(`[DoubaoService] Loading local image from: ${filePath}`);
                    const buffer = fs.readFileSync(filePath);
                    return buffer.toString('base64');
                }
            } catch (e) {
                console.warn(`[DoubaoService] Failed to read local image ${imageInput}:`, e);
            }
        }

        return imageInput;
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
    async generateImage(prompt: string, size: '2K' | '4K' = '2K', seed?: number, watermark: boolean = true): Promise<string> {
        try {
            const model = process.env.DOUBAO_IMAGE_MODEL || 'doubao-seedream-pro-4-0-t2i-250415';

            const payload = {
                model,
                prompt,
                size: size === '4K' ? '2048x2048' : '1024x1024',
                seed: seed || Math.floor(Math.random() * 1000000),
                watermark
            };

            const response = await this.fetchWithRetry(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Doubao Image Error: ${response.status} - ${errorText}`);
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
    async generateImageFromImage(prompt: string, imageUrl: string, size: '2K' | '4K' = '2K', seed?: number, imageWeight: number = 0.7, watermark: boolean = true): Promise<string> {
        try {
            const model = process.env.DOUBAO_IMAGE_MODEL || 'doubao-seedream-pro-4-0-t2i-250415';
            const safeSeed = (seed !== undefined && !isNaN(seed)) ? Math.floor(Math.max(0, seed)) : undefined;

            const body: any = {
                model: model,
                prompt,
                size: size === '4K' ? "4096x4096" : "2048x2048",
                seed: safeSeed,
                image_weight: imageWeight,
                response_format: 'url',
                sequential_image_generation: 'disabled',
                watermark: watermark
            };

            let finalImage = imageUrl;
            if (imageUrl.startsWith('data:')) {
                finalImage = imageUrl;
            } else if (imageUrl.startsWith('http')) {
                finalImage = imageUrl;
            } else {
                finalImage = `data:image/jpeg;base64,${this.normalizeBase64(imageUrl)}`;
            }

            body.image = finalImage;

            const response = await this.fetchWithRetry(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Doubao Img2Img Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const url = data.data?.[0]?.url;
            if (!url) {
                throw new Error(`Doubao I2I returned empty URL. Response: ${JSON.stringify(data)}`);
            }
            return url;
        } catch (error) {
            console.error('generateImageFromImage failed:', error);
            throw error;
        }
    }

    /**
     * Sequential Image Generation (For Picture Books)
     */
    async generateSequentialImages(prompt: string, imageUrl?: string, count: number = 5, watermark: boolean = true): Promise<string[]> {
        try {
            const model = process.env.DOUBAO_IMAGE_MODEL || 'doubao-seedream-3-0-t2i-250415';

            const body: any = {
                model: model,
                prompt,
                size: '1024x1024',
                guidance_scale: 3,
                sequential_image_generation: 'auto',
                sequential_image_generation_options: {
                    max_images: count,
                    watermark: watermark
                },
                response_format: 'url'
            };

            if (imageUrl) {
                body.image = imageUrl.startsWith('http') || imageUrl.startsWith('data:')
                    ? imageUrl
                    : `data:image/jpeg;base64,${this.normalizeBase64(imageUrl)}`;
            }

            const response = await this.fetchWithRetry(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Sequential API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return (data.data || []).map((img: any) => img.url).filter(Boolean);
        } catch (error) {
            console.error('generateSequentialImages failed:', error);
            throw error;
        }
    }

    /**
     * Vision Analysis (Image-to-Text)
     */
    async analyzeImage(imageInput: string, prompt: string = "Describe this image for a children's story."): Promise<string> {
        try {
            const model = process.env.DOUBAO_VISION_MODEL || 'doubao-vision-pro-32k-250115';
            console.log(`[Doubao] Analyzing image with model: ${model}`);

            // Clean base64 prefix if present
            const cleanImage = this.normalizeBase64(imageInput);
            const imageUrl = cleanImage.startsWith('http') ? cleanImage : `data:image/jpeg;base64,${cleanImage}`;

            const messages = [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageUrl } }
                    ]
                }
            ];

            const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model,
                    messages
                }),
                timeout: 120000 // 120s Timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Vision API Error: ${response.status} - ${errorText}`);
                throw new Error(`Vision API Failed: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('analyzeImage failed:', error);
            throw error;
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

            const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model,
                    messages
                }),
                timeout: 120000 // 120s Timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Story API Error: ${response.status} - ${errorText}`);
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
        try {
            const model = process.env.DOUBAO_TEXT_MODEL || 'ep-20251130051132-bqhrh';
            console.log(`[Doubao] Generating text story with model: ${model}`);

            const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: 'You are a professional children\'s story writer. Write a warm, engaging story strictly based on the user\'s prompt.' },
                        { role: 'user', content: prompt }
                    ]
                }),
                timeout: 90000 // 90s Timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`Text Generation API failed (Status ${response.status}): ${errorText}`);
                throw new Error(`Doubao Text Error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
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
            const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
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
     * Now includes emotion, bubble type, and positioning for enhanced UI rendering
     */
    async summarizeStoryToComicPanels(storyText: string): Promise<{
        panel: number;
        caption: string;
        sceneDescription: string;
        emotion?: string;
        bubbleType?: string;
        bubblePosition?: string;
    }[]> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

        try {
            const model = process.env.DOUBAO_TEXT_MODEL || 'ep-20251130051132-bqhrh';
            console.log(`[Doubao] Creating engaging 4-panel comic story with emotional depth...`);

            const systemPrompt = `You are a master children's story writer specializing in 4-panel comic strips. Create an engaging, emotionally rich story for children aged 4-8.

**Your Mission:**
Transform the user's input into a complete 4-panel comic story with:
- Vivid, specific dialogue (not generic phrases)
- Clear emotional progression
- Engaging character actions
- A satisfying narrative arc

**Story Structure (CRITICAL):**
Panel 1 (SETUP): Introduce character with a goal or discovery. Emotion: happy/excited/curious
Panel 2 (CONFLICT): Challenge or obstacle appears. Emotion: surprised/worried/determined  
Panel 3 (CLIMAX): Character takes action or finds solution. Emotion: excited/brave/hopeful
Panel 4 (RESOLUTION): Happy ending with lesson or friendship. Emotion: joyful/satisfied/proud

**Dialogue Requirements:**
- Use direct quotes from characters (e.g., "Wow! What a beautiful day!")
- Make each line specific to the story, not generic
- Keep it 8-15 words per panel
- Use exclamation points and questions to show emotion
- Match the dialogue to the character's emotion

**Visual Variety (CRITICAL):**
- Panel 1: Wide establishing shot
- Panel 2: Medium shot showing reaction
- Panel 3: Close-up on action/emotion
- Panel 4: Wide shot showing resolution

**Bubble Positioning:**
Automatically choose where speech bubbles should appear:
- "top" - character looking up or speaking upward
- "bottom" - default, character grounded
- "middle-left" - character on right side
- "middle-right" - character on left side

**Output Format:** Pure JSON array (no markdown formatting)

[
  {
    "panel": 1,
    "dialogue": "Character's exact spoken words or thought",
    "sceneDescription": "Detailed visual scene for image generation",
    "emotion": "happy/excited/curious/surprised/worried/determined/brave/hopeful/joyful/satisfied/proud",
    "bubbleType": "speech/thought/narration",
    "bubblePosition": "top/bottom/middle-left/middle-right"
  },
  ... (4 panels total)
]

**Example Quality:**
BAD: "Once upon a time..." / "Something happened!"
GOOD: "Look! A magic door appeared in my garden!" / "Oh no! It's locked and I don't have a key!"

Make every word count. Make every emotion clear. Make kids FEEL the story!`;

            const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `Story to create:\n\n${storyText}` }
                    ]
                }),
                timeout: 120000 // 120s timeout
            });

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

                // Validate structure and normalize fields
                if (!Array.isArray(parsed) || parsed.length !== 4) {
                    throw new Error('Invalid array length');
                }

                // Normalize: support both "dialogue" (new) and "caption" (old) fields
                parsed = parsed.map((panel, i) => ({
                    panel: i + 1,
                    caption: panel.dialogue || panel.caption || '',
                    sceneDescription: panel.sceneDescription || '',
                    emotion: panel.emotion || 'happy',
                    bubbleType: panel.bubbleType || 'speech',
                    bubblePosition: panel.bubblePosition || 'top'
                }));
            } catch (e) {
                console.warn('[Doubao] JSON Parse failed, generating creative fallback story', e);

                // Enhanced fallback: Create themed story based on input keywords
                const theme = storyText.substring(0, 50).toLowerCase();
                const isMagic = theme.includes('magic') || theme.includes('wizard');
                const isFriendship = theme.includes('friend') || theme.includes('together');
                const isAdventure = theme.includes('adventure') || theme.includes('explore');

                if (isMagic) {
                    parsed = [
                        { panel: 1, caption: "Look! Something magical is glowing!", sceneDescription: "Wide shot: Child discovering glowing magical object in enchanted forest", emotion: "excited", bubbleType: "speech", bubblePosition: "bottom" },
                        { panel: 2, caption: "Oh no! The magic is fading!", sceneDescription: "Medium shot: Child reaching toward fading glow, concerned", emotion: "worried", bubbleType: "speech", bubblePosition: "middle-right" },
                        { panel: 3, caption: "My wish can save it!", sceneDescription: "Close-up: Child making wish gesture, sparkles surrounding", emotion: "hopeful", bubbleType: "thought", bubblePosition: "top" },
                        { panel: 4, caption: "The magic is back, stronger than ever!", sceneDescription: "Wide shot: Magical energy fills scene, rainbow colors", emotion: "joyful", bubbleType: "speech", bubblePosition: "bottom" }
                    ];
                } else if (isFriendship) {
                    parsed = [
                        { panel: 1, caption: "Hi! Want to play together?", sceneDescription: "Wide shot: Two characters meeting in playground", emotion: "happy", bubbleType: "speech", bubblePosition: "middle-left" },
                        { panel: 2, caption: "We both want the same toy!", sceneDescription: "Medium shot: Both looking at toy, confused", emotion: "surprised", bubbleType: "speech", bubblePosition: "top" },
                        { panel: 3, caption: "Let's share and play together!", sceneDescription: "Close-up: Characters holding toy together, smiling", emotion: "determined", bubbleType: "speech", bubblePosition: "middle-right" },
                        { panel: 4, caption: "Best friends forever!", sceneDescription: "Wide shot: Playing happily, high-five, sunny", emotion: "joyful", bubbleType: "speech", bubblePosition: "bottom" }
                    ];
                } else if (isAdventure) {
                    parsed = [
                        { panel: 1, caption: "I found a treasure map!", sceneDescription: "Wide shot: Character holding old map, excited", emotion: "excited", bubbleType: "speech", bubblePosition: "bottom" },
                        { panel: 2, caption: "This path looks tricky...", sceneDescription: "Medium shot: Looking at obstacles, thinking", emotion: "curious", bubbleType: "thought", bubblePosition: "top" },
                        { panel: 3, caption: "I can do this! Let's go!", sceneDescription: "Action shot: Bravely stepping forward", emotion: "brave", bubbleType: "speech", bubblePosition: "middle-left" },
                        { panel: 4, caption: "The real treasure was friendship!", sceneDescription: "Wide shot: Celebrating with friends, warm sunset", emotion: "satisfied", bubbleType: "speech", bubblePosition: "bottom" }
                    ];
                } else {
                    parsed = [
                        { panel: 1, caption: "What a beautiful day!", sceneDescription: "Wide shot: Character waking to sunny morning", emotion: "happy", bubbleType: "speech", bubblePosition: "bottom" },
                        { panel: 2, caption: "What's that strange sound?", sceneDescription: "Medium shot: Pausing and listening curiously", emotion: "curious", bubbleType: "thought", bubblePosition: "top" },
                        { panel: 3, caption: "I'll check it out!", sceneDescription: "Close-up: Running with determination", emotion: "determined", bubbleType: "speech", bubblePosition: "middle-right" },
                        { panel: 4, caption: "A friendly surprise! How wonderful!", sceneDescription: "Wide shot: Discovering something delightful", emotion: "joyful", bubbleType: "speech", bubblePosition: "bottom" }
                    ];
                }
            }

            return parsed.slice(0, 4);
        } catch (error) {
            clearTimeout(timeout);
            console.error('summarizeStoryToComicPanels failed:', error);
            // Creative fallback on total failure
            return [
                { panel: 1, caption: "Today feels special!", sceneDescription: "Cheerful character in bright setting", emotion: "excited", bubbleType: "speech", bubblePosition: "bottom" },
                { panel: 2, caption: "What's happening over there?", sceneDescription: "Character noticing something interesting", emotion: "curious", bubbleType: "speech", bubblePosition: "middle-left" },
                { panel: 3, caption: "This is amazing!", sceneDescription: "Character rushing forward with excitement", emotion: "excited", bubbleType: "speech", bubblePosition: "top" },
                { panel: 4, caption: "Best day ever!", sceneDescription: "Character celebrating with joy", emotion: "joyful", bubbleType: "speech", bubblePosition: "bottom" }
            ];
        }
    }

    /**
     * Generate Child-Friendly Prompt (Text-to-Prompt) using Doubao Pro 1.8 logic
     * Converts simple child input into a detailed image generation prompt.
     */
    async generateChildFriendlyPrompt(childInput: string): Promise<string> {
        try {
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

            const response = await this.fetchWithRetry(`${this.baseUrl}/chat/completions`, {
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
            extraPrompt?: string; // New: Additional user requirements
            watermark?: boolean;
        }
    ): Promise<string> {
        const { action, style, effect, duration, generateAudio, extraPrompt, watermark = true } = options;
        // Action mappings (with camera and motion settings)
        const ACTION_MAP: Record<string, { prompt: string; motion?: number; camera?: string }> = {
            'dance': { prompt: 'character dancing happily, rhythmic movement', motion: 0.8 },
            'run': { prompt: 'running fast, speed lines, hair blowing', motion: 0.8, camera: 'pan_right' },
            'fly': { prompt: 'flying in the sky, feet off ground', camera: 'pan_up' },
            'swim': { prompt: 'swimming in water, flowing movement, bubbles', motion: 0.7 },
            'jump': { prompt: 'jumping up high, bouncing', motion: 0.9 },
            'silly': { prompt: 'doing a silly dance, funny face, wiggling', motion: 0.8 },
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
        const actionData = ACTION_MAP[action];
        if (!actionData) {
            throw new Error(`Invalid action: ${action}. Must be one of: ${Object.keys(ACTION_MAP).join(', ')}`);
        }

        // 2. Construct layered prompt: action + style + effect
        let finalPrompt = actionData.prompt;
        if (style && STYLE_MAP[style]) {
            finalPrompt += `, ${STYLE_MAP[style]}`;
        }
        if (effect && EFFECT_MAP[effect]) {
            const effectDesc = EFFECT_MAP[effect];
            finalPrompt += `, ${effectDesc}`;
        }

        // Add extra user requirements if provided
        if (extraPrompt) {
            finalPrompt += `, ${extraPrompt}`;
        }

        // FIX: Enforce "Medium shot" to prevent zooming and add "Loud audio" request
        finalPrompt += `, medium shot, static camera, keep entire character visible`;
        if (generateAudio) {
            finalPrompt += `, loud clear sound, audible effects`;
        }

        // 3. Auto-determine camera settings
        const cameraMove = actionData.camera || 'static';
        const cameraFixed = cameraMove === 'static';

        // 4. Fixed technical params
        const model = 'doubao-seedance-1-5-pro-251215';
        const url = process.env.VOLC_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';
        const duration_val = duration || 5;
        const generateAudio_val = generateAudio !== undefined ? generateAudio : true;
        const resolution = '720p'; // Fixed for kids version
        const fps = 24; // Fixed cinematic FPS
        const ratio = '1:1'; // Fixed mobile-friendly ratio

        console.log(`[Doubao Magic] Creating video with Action='${action}', Style='${style || 'none'}', Effect='${effect || 'none'}'`);
        console.log(`[Doubao Magic] Final Prompt: "${finalPrompt}"`);
        console.log(`[Doubao Magic] Duration: ${duration_val}s, Audio: ${generateAudio_val}`);

        // 5. Append technical params to prompt (only use confirmed Seedance 1.5 parameters)
        // Confirmed params: resolution, duration, generate_audio, watermark
        // Removed unconfirmed: camera_fixed, fps, ratio (let model auto-detect from input image)
        const promptWithParams = `${finalPrompt} --resolution ${resolution} --duration ${duration_val} --generate_audio ${generateAudio_val} --watermark ${watermark}`;

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
                        url: this.normalizeBase64(imageUrl).startsWith('http')
                            ? this.normalizeBase64(imageUrl)
                            : `data:image/jpeg;base64,${this.normalizeBase64(imageUrl)}`
                    }
                }
            ]
        };

        try {
            const response = await this.fetchWithRetry(url, {
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
     * Seedance 1.5 Video Generation - Correct API Implementation
     * Key: use generate_audio=true and put dialogue in double quotes in the prompt
     */
    async createSeedanceVideoTask1_5(
        imageUrl: string,
        options: {
            spell: 'quick' | 'story' | 'cinema';
            audioMode: 'talk' | 'scene';
            textInput: string;
            voiceStyle?: string; // For prompt enhancement only, not API param
            sceneMood?: string;  // For prompt enhancement only
            videoPrompt?: string; // New: Additional scene/action description
            watermark?: boolean;
        }
    ): Promise<string> {
        const { spell, audioMode, textInput, videoPrompt, watermark = true } = options;
        const voiceStyle = options.voiceStyle || 'cute';
        const sceneMood = options.sceneMood || 'happy';

        // 1. Map Spell to Duration/Res
        const SPELL_MAP = {
            'quick': { duration: 4, res: '480p' },
            'story': { duration: 8, res: '480p' },
            'cinema': { duration: 12, res: '720p' }
        };
        const config = SPELL_MAP[spell] || SPELL_MAP['story'];

        // 2. Construct Prompt with dialogue in double quotes for auto lip-sync
        let video_prompt = "";
        let generate_audio = true; // Always generate audio for Seedance 1.5 Pro

        if (audioMode === 'talk' && textInput.trim()) {
            // Talk Mode: Character speaks the text
            // Enhanced voice hint mapping
            const cleanVoice = voiceStyle.toLowerCase();
            const speechMap: Record<string, string> = {
                'cute': 'cute child voice, high pitch, happy tone, speaking loudly and clearly',
                'girl': 'cute little girl voice, high pitch, feminine tone, speaking sweetly',
                'boy': 'energetic little boy voice, happy tone, speaking loudly',
                'woman': 'gentle female voice, soft and clear, lady speaking',
                'man': 'deep male voice, clear and strong, man speaking',
                'robot': 'robotic voice, mechanical tone, steady rhythm, loud clear audio',
                'monster': 'deep monster voice, growling tone, low pitch, booming loud voice'
            };
            const voiceHint = speechMap[cleanVoice] || 'natural voice, speaking clearly';

            // Escape quotes to prevent prompt breakage
            const safeText = textInput.replace(/"/g, '\\"');
            // FIX: Changed "Close-up" to "Medium shot" and added "do not zoom" to keep subject in frame per user request
            video_prompt = `Medium shot of character talking with ${voiceHint}, saying "${safeText}", natural facial expressions, correct lip-sync to the dialogue, keep entire character visible, static camera`;

            // Add extra scene/action description if provided
            if (videoPrompt) {
                video_prompt += `, ${videoPrompt}`;
            }
        } else if (audioMode === 'scene') {
            // Scene Mode: Background ambience, no speech
            const moodHint = sceneMood === 'mysterious' ? 'mysterious atmosphere, eerie ambient sounds' :
                sceneMood === 'action' ? 'action-packed, dramatic music' :
                    'happy cheerful atmosphere, pleasant background music';
            video_prompt = `Cinematic scene, ${textInput}, ${moodHint}, immersive environment`;
            if (videoPrompt) video_prompt += `, ${videoPrompt}`;

        } else {
            // Default: just video with ambient sound
            video_prompt = textInput || 'Character in a cheerful scene, natural movement';
            if (videoPrompt) video_prompt += `, ${videoPrompt}`;
        }

        // 3. Technical Params - Use CORRECT Seedance 1.5 format
        const model = 'doubao-seedance-1-5-pro-251215';
        const url = process.env.VOLC_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks';

        // Correct parameter format: --generate_audio true (NOT --audio_prompt or --lip_sync)
        const promptWithParams = `${video_prompt} --resolution ${config.res} --duration ${config.duration} --generate_audio ${generate_audio} --watermark ${watermark}`;

        console.log(`[Doubao 1.5] Creating Task: Spell=${spell}, Mode=${audioMode}`);
        console.log(`[Doubao 1.5] Prompt: ${promptWithParams}`);

        const payload = {
            model: model,
            content: [
                { type: "text", text: promptWithParams },
                {
                    type: "image_url",
                    image_url: {
                        url: this.normalizeBase64(imageUrl).startsWith('http')
                            ? this.normalizeBase64(imageUrl)
                            : `data:image/jpeg;base64,${this.normalizeBase64(imageUrl)}`
                    }
                }
            ]
        };

        try {
            const response = await this.fetchWithRetry(url, {
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
                {
                    type: "image_url",
                    image_url: {
                        url: this.normalizeBase64(imageUrl).startsWith('http')
                            ? this.normalizeBase64(imageUrl)
                            : `data:image/jpeg;base64,${this.normalizeBase64(imageUrl)}`
                    }
                }
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

        const res = await this.fetchWithRetry(`${this.baseUrl}/contents/generations/tasks`, {
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
            const taskRes = await this.fetchWithRetry(`${this.baseUrl}/contents/generations/tasks/${taskId}`, {
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
        try {
            const response = await this.fetchWithRetry(`${this.baseUrl}/audio/speech`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: process.env.DOUBAO_TTS_MODEL || 'doubao-tts-1.0',
                    input: text,
                    voice: voice,
                    speed: 1.0
                }),
                timeout: 20000 // 20s Timeout
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`TTS API Error: ${response.status} - ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error('generateSpeech failed:', error);
            throw error;
        }
    }

    /**
     * Create 3D Generation Task (Magic Toy Maker)
     * Model: doubao-seed3d-1-0-250928
     */
    async create3DGenerationTask(imageUrl: string, prompt: string = '--subdivisionlevel medium --fileformat glb'): Promise<string> {
        try {
            console.log('[Doubao] Creating 3D Generation Task...');
            const model = process.env.DOUBAO_3D_MODEL || 'doubao-seed3d-1-0-250928';

            const cleanImage = this.normalizeBase64(imageUrl);
            // Default to data URI if it looks like raw base64 or has data prefix
            const finalImageUrl = cleanImage.startsWith('http') ? cleanImage : (cleanImage.startsWith('data:') ? cleanImage : `data:image/jpeg;base64,${cleanImage}`);

            const payload = {
                model: model,
                content: [
                    {
                        type: "text",
                        text: prompt
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: finalImageUrl
                        }
                    }
                ]
            };

            const response = await this.fetchWithRetry(`${this.baseUrl}/contents/generations/tasks`, {
                method: 'POST',
                headers: {
                    ...this.headers,
                    'X-Cb-Antigravity-Ref': 'magic-toy-maker'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Doubao 3D Task Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const taskId = data.id || data?.data?.id;
            if (!taskId) {
                throw new Error(`Doubao 3D returned no Task ID. Resp: ${JSON.stringify(data)}`);
            }

            console.log(`[Doubao] 3D Task Created: ${taskId}`);
            return taskId;

        } catch (error) {
            console.error('create3DGenerationTask failed:', error);
            throw error;
        }
    }

    /**
     * Get 3D Task Status
     */
    async get3DTaskStatus(taskId: string): Promise<{ status: string; modelUrl?: string; error?: any; progress?: number; raw?: any }> {
        try {
            const url = `${this.baseUrl}/contents/generations/tasks/${taskId}`;
            const response = await this.fetchWithRetry(url, {
                method: 'GET',
                headers: {
                    ...this.headers
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Doubao 3D Status Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            // Normalize Status (Doubao SEED3D uses similar codes to Seedance)
            const remoteStatus = data.status || data?.data?.status;
            const statusStr = String(remoteStatus).toLowerCase();

            let appStatus = 'PENDING';
            let modelUrl = '';
            let errorMsg = null;

            if (statusStr === 'succeeded' || remoteStatus === 2) {
                appStatus = 'SUCCEEDED';
                // Extract Model URL (usually in content[0].file_url)
                const content = data.content?.[0] || data.data?.content?.[0] || data.result?.content?.[0];
                modelUrl = content?.file_url || content?.url || content?.image_url || '';

                if (!modelUrl && data.content?.video_url) {
                    // Sometimes returns a preview video if requested, but SEED3D usually returns file
                    modelUrl = data.content.video_url;
                }
            } else if (statusStr === 'failed' || remoteStatus === 3) {
                appStatus = 'FAILED';
                errorMsg = data.error?.message || data.error_message || "Generation failed";
            }

            return {
                status: appStatus,
                modelUrl,
                error: errorMsg,
                progress: data.progress || data.data?.progress || 0,
                raw: data
            };

        } catch (error) {
            console.error('get3DTaskStatus failed:', error);
            throw error;
        }
    }

    /**
     * Robust fetch wrapper with timeout and retry logic
     */
    private async fetchWithRetry(url: string, options: any = {}, retries = 3, backoff = 1000): Promise<Response> {
        const timeout = options.timeout || 30000; // Default 30s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);

            const isTimeout = error.name === 'AbortError' || error.code === 'UND_ERR_CONNECT_TIMEOUT';
            const isRetryable = isTimeout || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.status >= 500;

            if (retries > 0 && isRetryable) {
                console.warn(`[DoubaoService] Fetch failed (${error.code || error.name}). Retrying in ${backoff}ms... (${retries} attempts left)`);
                await new Promise(res => setTimeout(res, backoff));
                return this.fetchWithRetry(url, options, retries - 1, backoff * 2);
            }
            throw error;
        }
    }
}

export const doubaoService = new DoubaoService();
