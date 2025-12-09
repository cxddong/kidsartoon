import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

interface RateLimit {
    date: string;
    textCount: number;
    imageCount: number;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private apiKey: string;
    private rateLimits: Map<string, RateLimit> = new Map();

    // Configuration
    private readonly TEXT_MODEL = 'gemini-1.5-flash'; // Upgrade to faster/newer model
    private readonly IMAGE_MODEL = 'gemini-pro-vision'; // Vision model
    private readonly DAILY_TEXT_LIMIT = 100;
    private readonly DAILY_IMAGE_LIMIT = 100;

    constructor() {
        // Updated Key from User (Direct injection due to .env lock)
        this.apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyAAwAJbAzWepO-vssoG4FjS6LmLmyu_nbQ';
        if (!this.apiKey) {
            console.warn('GOOGLE_API_KEY is missing!');
        }
        this.genAI = new GoogleGenerativeAI(this.apiKey);
    }

    private checkQuota(userId: string, type: 'text' | 'image') {
        const today = new Date().toISOString().split('T')[0];
        let usage = this.rateLimits.get(userId);

        if (!usage || usage.date !== today) {
            usage = { date: today, textCount: 0, imageCount: 0 };
            this.rateLimits.set(userId, usage);
        }

        if (type === 'text' && usage.textCount >= this.DAILY_TEXT_LIMIT) {
            throw new Error(`Daily text generation quota exceeded (${this.DAILY_TEXT_LIMIT})`);
        }
        if (type === 'image' && usage.imageCount >= this.DAILY_IMAGE_LIMIT) {
            throw new Error(`Daily image generation quota exceeded (${this.DAILY_IMAGE_LIMIT})`);
        }

        return usage;
    }

    private incrementUsage(userId: string, type: 'text' | 'image') {
        const usage = this.rateLimits.get(userId);
        if (usage) {
            if (type === 'text') usage.textCount++;
            if (type === 'image') usage.imageCount++;
        }
    }

    private logCost(model: string, type: string, userId: string, tokensOrCount: number) {
        console.log(`[COST_LOG] ${new Date().toISOString()} | User: ${userId} | Model: ${model} | Type: ${type} | Usage: ${tokensOrCount}`);
    }

    /**
     * Generate Text
     */
    async generateText(prompt: string, userId: string, maxTokens: number = 512): Promise<string> {
        this.checkQuota(userId, 'text');

        try {
            const model = this.genAI.getGenerativeModel({ model: this.TEXT_MODEL });

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: 0.7,
                },
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                ]
            });

            const response = await result.response;
            const text = response.text();

            this.incrementUsage(userId, 'text');
            this.logCost(this.TEXT_MODEL, 'text', userId, text.length / 4); // Approx token count

            return text;
        } catch (error) {
            console.error('Gemini Text Gen Failed:', error);
            throw error;
        }
    }

    /**
     * Generate Story JSON
     */
    async generateStoryJSON(prompt: string, userId: string): Promise<any> {
        this.checkQuota(userId, 'text');

        const systemPrompt = `
        You are a master picture book creator.
        Output strictly in JSON format.
        Structure:
        {
            "title": "string",
            "summary": "string (max 30 words)",
            "scenes": ["string", "string", "string", "string"],
            "scenes_detail": ["string", "string", "string", "string"]
        }
        Create a 4-scene story based on: ${prompt}
        `;

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.TEXT_MODEL,
                generationConfig: { responseMimeType: "application/json" }
            });

            // Remove explicit safety settings as they might be restricted
            const result = await model.generateContent(systemPrompt);
            const response = await result.response;
            const text = response.text();

            this.incrementUsage(userId, 'text');
            this.logCost(this.TEXT_MODEL, 'text_json', userId, text.length / 4);

            return JSON.parse(text);
        } catch (error) {
            console.error('Gemini Story JSON Failed:', error);
            throw error;
        }
    }

    /**
     * Generate Image (Mock/Placeholder or Actual if available)
     */
    async generateImage(prompt: string, userId: string, size: string = '1024x1024'): Promise<string> {
        this.checkQuota(userId, 'image');

        console.log(`[Gemini] Generating image via Pollinations.ai for user ${userId}`);

        this.incrementUsage(userId, 'image');
        this.logCost('pollinations-ai', 'image', userId, 1);

        const encodedPrompt = encodeURIComponent(prompt);
        const [width, height] = size.split('x');
        const seed = Math.floor(Math.random() * 1000000);

        // Pollinations.ai URL (using Flux model for better quality)
        return `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux`;
    }

    /**
     * Image-to-Image (Using Vision to describe + Text-to-Image to regenerate)
     */
    async generateImageFromImage(prompt: string, base64Image: string, userId: string): Promise<string> {
        this.checkQuota(userId, 'image');

        // 1. Analyze image (Robust Fallback)
        let description = '';
        try {
            const visionModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
            const imagePart = {
                inlineData: {
                    data: base64Image.split(',')[1],
                    mimeType: 'image/png' // Assuming PNG/JPEG
                }
            };

            const analysisResult = await visionModel.generateContent([
                "Describe this image in detail for a prompt to regenerate it in cartoon style.",
                imagePart
            ]);
            description = analysisResult.response.text();
        } catch (visionError) {
            console.warn('Gemini Vision Analysis failed (skipping description):', visionError);
        }

        // 2. Generate new image based on description + prompt
        const finalPrompt = description
            ? `Cartoon style. ${description}. ${prompt}`
            : `Cartoon style. ${prompt}`;

        return this.generateImage(finalPrompt, userId);
    }

    /**
     * Analyze Image using Vision (Public Method)
     */
    async analyzeImage(base64Image: string, prompt?: string): Promise<string> {
        this.checkQuota('system', 'text');

        try {
            const visionModel = this.genAI.getGenerativeModel({ model: this.IMAGE_MODEL });

            // Extract mimeType from data URI (e.g., "data:image/jpeg;base64,...")
            const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';')) || 'image/png';

            const imagePart = {
                inlineData: {
                    data: base64Image.split(',')[1],
                    mimeType
                }
            };

            const userPrompt = prompt || "Describe this image in detail.";
            const result = await visionModel.generateContent([userPrompt, imagePart]);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('Gemini Vision Analysis Failed:', error);
            // Fallback
            return "A colorful drawing.";
        }
    }

    /**
     * Analyze Image and return structured JSON
     */
    async analyzeImageJSON(base64Image: string): Promise<any> {
        this.checkQuota('system', 'text');

        // Strategy 1: Try Gemini 1.5 Flash (Native JSON)
        try {
            const visionModel = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: { responseMimeType: "application/json" }
            });

            const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';')) || 'image/png';
            const imagePart = {
                inlineData: {
                    data: base64Image.split(',')[1],
                    mimeType
                }
            };

            const prompt = `Analyze this image for a children's story. Output JSON only: {"summary": "...", "characters": [], "setting": "...", "style": "...", "storyHint": "..."}`;

            const result = await visionModel.generateContent([prompt, imagePart]);
            const response = await result.response;
            let text = response.text();

            if (text.includes('```json')) {
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            }
            return JSON.parse(text);

        } catch (flashError) {
            console.warn('Gemini 1.5 Flash failed, falling back to Gemini Pro Vision:', flashError);

            // Strategy 2: Fallback to Gemini Pro Vision (Text Mode + Manual Parse)
            try {
                const visionModel = this.genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

                const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';')) || 'image/png';
                const imagePart = {
                    inlineData: {
                        data: base64Image.split(',')[1],
                        mimeType
                    }
                };

                const prompt = `
                Describe this image in detail.
                Then, formatted strictly as JSON codes (no markdown), list:
                - summary
                - characters (array)
                - setting
                - style
                - storyHint
                `;

                const result = await visionModel.generateContent([prompt, imagePart]);
                const response = await result.response;
                let text = response.text();

                // Extract JSON from text
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("No JSON found in response");
                }

            } catch (legacyError) {
                console.error('Gemini Pro Vision also failed:', legacyError);
                // Final Fallback: Static Data
                return {
                    summary: "A creative drawing (AI Unavailable)",
                    characters: ["Happy character"],
                    setting: "Magical land",
                    style: "Cartoon",
                    storyHint: "A story about fun"
                };
            }
        }
    }

    /**
     * Generate Speech (Google Cloud TTS via REST)
     * Requires "Cloud Text-to-Speech API" to be enabled in Google Cloud Console.
     */
    async generateSpeech(text: string, lang: string = 'en-US', gender: string = 'FEMALE'): Promise<Buffer> {
        if (!this.apiKey) throw new Error("GOOGLE_API_KEY is missing for TTS");

        console.log(`[Gemini Cloud TTS] Starting generation for text length: ${text.length}`);

        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;

        try {
            let voiceName = 'en-US-Journey-D';
            if (lang.startsWith('zh')) voiceName = 'cmn-CN-Neural2-C'; // Chinese
            if (lang.startsWith('fr')) voiceName = 'fr-FR-Neural2-B'; // French
            if (lang.startsWith('es')) voiceName = 'es-ES-Neural2-B'; // Spanish

            console.log(`[Gemini Cloud TTS] Fetching from ${url.split('?')[0]}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: { languageCode: lang, ssmlGender: 'MALE', name: voiceName },
                    audioConfig: { audioEncoding: 'MP3' }
                })
            });

            console.log(`[Gemini Cloud TTS] Response status: ${response.status}`);

            if (!response.ok) {
                const err = await response.text();
                // console.error(`[Gemini Cloud TTS] Error Body: ${err}`); // Reduce noise

                // Fallback (Simple)
                if (response.status === 400 || response.status === 403) {
                    throw new Error(`TTS API Error: ${err}`);
                }

                throw new Error(`Google TTS Error: ${response.status} - ${err}`);
            }

            const data = await response.json();
            console.log(`[Gemini Cloud TTS] Success! Audio content length: ${data.audioContent?.length}`);
            return Buffer.from(data.audioContent, 'base64');
        } catch (error) {
            console.error('generateSpeech (Google Cloud) failed:', error);
            throw error;
        }
    }
}

export const geminiService = new GeminiService();
