import { v4 as uuidv4 } from 'uuid';

export class DoubaoService {
    private apiKey: string;
    private baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';

    constructor() {
        this.apiKey = process.env.Doubao_API_KEY || '';
        if (!this.apiKey) {
            console.warn('Doubao API Key is missing!');
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
    async generateImage(prompt: string, size: '2K' | '4K' = '2K'): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: 'doubao-seedream-4-0-250828',
                    prompt,
                    size,
                    response_format: 'url'
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
    async generateImageFromImage(prompt: string, imageUrl: string, size: '2K' | '4K' = '2K'): Promise<string> {
        try {
            const response = await fetch(`${this.baseUrl}/images/generations`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: 'doubao-seedream-4-0-250828',
                    prompt,
                    image: imageUrl, // URL or Base64
                    size,
                    response_format: 'url'
                })
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
    /**
     * Sequential Image Generation (Group Picture Ability)
     */
    async generateSequentialImages(prompt: string, imageUrl?: string, count: number = 5): Promise<string[]> {
        try {
            const body: any = {
                model: process.env.DOUBAO_IMAGE_MODEL || 'doubao-seedream-4-0-250828',
                prompt,
                size: '2K', // Default for Seedream
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
        try {
            const model = process.env.DOUBAO_VISION_MODEL || 'ep-20241201-xxxxx';
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

            // If it's a base64 string without prefix, ensure it's formatted correct or if the model expects just the url.
            // Volcengine usually expects standard URL or data URI. 'imageInput' comes as Data URI from frontend.

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: model,
                    messages: messages
                })
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
            throw error; // Re-throw to let caller handle it
        }
    }

    /**
     * Generate Story with JSON Output (New System Prompt)
     */
    async generateStoryJSON(userPrompt: string, imageUrl?: string): Promise<any> {
        const systemPrompt = `
Role: A warm story creator for 8-year-old children
Rules:
1. Create a 4-panel story strictly based on the core elements (characters/scenes/objects/atmosphere) of the reference image;
2. 4-panel logic: panel1 = beginning, panel2 = development, panel3 = turning point, panel4 = warm ending;
3. Each panel's text is 20-30 words, easy for children to understand, no complex vocabulary;
4. Output format: Only return JSON of "scenes" (array of strings) and "scenes_detail" (array of strings for illustration), no extra content.
`;

        try {
            const model = process.env.DOUBAO_TEXT_MODEL || 'ep-20241201-xxxxx';
            console.log(`[Doubao] Generating story with model: ${model}`);

            let finalUserPrompt = userPrompt;

            // 1. If Image, Analyze first (Vision API)
            if (imageUrl) {
                try {
                    console.log('[Doubao] Analyzing reference image for story context...');
                    const imageDesc = await this.analyzeImage(imageUrl, "Describe the characters, visual style, atmosphere, and key objects in this image for a children's story.");
                    finalUserPrompt = `${userPrompt}\n\nReference Image Context: ${imageDesc}`;
                    console.log('[Doubao] Image analysis complete. Context added.');
                } catch (visionErr) {
                    console.error('[Doubao] Vision analysis failed, proceeding with text only:', visionErr);
                    // Fallback: Proceed without valid image context
                }
            }

            // 2. Generate Story (Text API)
            // Note: We use the TEXT model here, so we do NOT send the image_url again.
            // This prevents "Invalid parameter" errors if the text model is not multimodal.
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
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn('Story JSON Generation failed:', errorText);
                throw new Error(`Story Gen Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            let content = data.choices?.[0]?.message?.content || '{}';

            // Strip markdown code fences if present
            content = content.replace(/```json\n?|\n?```/g, '').trim();

            // Try to parse JSON
            try {
                const parsed = JSON.parse(content);
                // Validate structure
                if (!Array.isArray(parsed.scenes) || !Array.isArray(parsed.scenes_detail)) {
                    // Try to fix common issues or just throw
                    throw new Error('Invalid structure');
                }
                return parsed;
            } catch (e) {
                console.error('Failed to parse Story JSON or Invalid Structure. Raw content:', content);
                // Fallback structure
                return {
                    title: 'My Story',
                    summary: 'A generated story.',
                    scenes: ['Scene 1', 'Scene 2', 'Scene 3', 'Scene 4'],
                    scenes_detail: ['Cute cartoon scene', 'Cute cartoon scene', 'Cute cartoon scene', 'Cute cartoon scene']
                };
            }
        } catch (error) {
            console.error('generateStoryJSON failed:', error);
            throw error;
        }
    }

    /**
     * Text Generation (Story Creation) - Legacy
     */
    /**
     * Text Generation (Story Creation) - Legacy
     */
    async generateStory(prompt: string): Promise<string> {
        try {
            const model = process.env.DOUBAO_TEXT_MODEL || 'ep-20241201-xxxxx';
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
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.warn(`Text Generation API failed (Status ${response.status}): ${errorText}. Falling back to mock.`);
                throw new Error(`Doubao Text Error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || '';
        } catch (error) {
            console.error('generateStory failed:', error);
            throw error;
        }
    }

    // Mock Video Generation
    async generateVideo(imageUrl: string, prompt: string): Promise<string> {
        return `https://placehold.co/video?text=Video+Generating...`;
    }

    /**
     * Text-to-Speech (Audio Generation)
     */
    async generateSpeech(text: string, voice: string = 'zh_female_tianmei'): Promise<Buffer> {
        try {
            // Try standard endpoint first
            // For Volcengine/Doubao, the endpoint for OpenAI compatibility is sometimes strictly /api/v3/audio/speech
            const response = await fetch(`${this.baseUrl}/audio/speech`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    model: 'doubao-tts-1.0',
                    input: text,
                    voice: voice, // 'zh_female_tianmei'
                    speed: 1.0
                })
            });

            if (!response.ok) {
                // Try legacy/alternative endpoint or model if 400/404
                const errorText = await response.text();
                // Throw error so orchestrator catches it for fallback
                throw new Error(`TTS API Error: ${response.status} - ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.error('generateSpeech failed:', error);
            throw error;
        }
    }
}

export const doubaoService = new DoubaoService();
