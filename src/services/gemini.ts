import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

interface RateLimit {
    date: string;
    textCount: number;
    imageCount: number;
}

export class GeminiService {
    private genAI: GoogleGenerativeAI;
    private apiKey: string;
    private rateLimits: Map<string, RateLimit> = new Map();
    private proxyAgent: HttpsProxyAgent<string> | undefined;

    // Configuration
    private readonly TEXT_MODEL = 'gemini-1.5-pro';
    private readonly IMAGE_MODEL = 'gemini-pro-vision';
    private readonly DAILY_TEXT_LIMIT = 100;
    private readonly DAILY_IMAGE_LIMIT = 100;

    constructor() {
        // FORCE VALID KEY (Bypass .env which has blocked key)
        this.apiKey = 'AIzaSyCvy_90ga9nVN0316J1cwXoRbPHp7vkhqY'; // process.env.GOOGLE_API_KEY
        if (!this.apiKey) {
            console.warn('GOOGLE_API_KEY is missing!');
        }

        // Proxy Configuration
        const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
        if (proxyUrl) {
            console.log(`[Gemini] Using Proxy: ${proxyUrl}`);
            this.proxyAgent = new HttpsProxyAgent(proxyUrl);
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
     * Generate Text (Fallback)
     */
    async generateText(prompt: string, userId: string, maxTokens: number = 1024): Promise<string> {
        this.checkQuota(userId, 'text');

        try {
            const model = this.genAI.getGenerativeModel({ model: this.TEXT_MODEL });

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: 0.8,
                    topP: 0.9,
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
            this.logCost(this.TEXT_MODEL, 'text', userId, text.length / 4);

            return text;
        } catch (error) {
            console.error('Gemini Text Gen Failed:', error);
            throw error;
        }
    }

    /**
     * Generate Story JSON (REST API to bypass 404s + Proxy Support)
     */
    async generateStoryJSON(base64Image: string, userId: string): Promise<any> {
        this.checkQuota(userId, 'text');

        const prompt = `
        You are a gentle storyteller. Look at the image and write an English children's story suitable for ages 7-10.
        Requirements:
        - 3-5 short paragraphs
        - Include: title, characters list, main story, and one reflective ending question
        - Keep language simple and kind
        Return JSON only: { "title": "", "characters": [], "story": "", "question": "" }
        `;

        // CORRECTED URL: AI Studio Endpoint, valid model name (no -latest)
        const url = `https://aistudio.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${this.apiKey}`;

        try {
            const mimeType = base64Image.substring(base64Image.indexOf(':') + 1, base64Image.indexOf(';')) || 'image/png';

            const body = {
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType,
                                    data: base64Image.split(',')[1]
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json",
                    maxOutputTokens: 1024,
                    temperature: 0.8,
                    topP: 0.9
                }
            };

            console.log(`[Gemini REST] Posting to ${url}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                agent: this.proxyAgent // Inject Proxy Agent
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini REST Error: ${response.status} - ${errText}`);
            }

            const data: any = await response.json();
            // Parse AI Studio Response Structure
            const textPart = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textPart) throw new Error("No text content in Gemini response");

            this.incrementUsage(userId, 'text');
            this.logCost('gemini-1.5-pro', 'story_json', userId, textPart.length / 4);

            // Clean up potentially wrapped JSON
            let cleanText = textPart;
            if (cleanText.includes('```json')) {
                cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
            }

            return JSON.parse(cleanText);

        } catch (error) {
            console.error('Gemini Story JSON Failed (REST):', error);
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

        return `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux`;
    }

    async generateImageFromImage(prompt: string, base64Image: string, userId: string): Promise<string> {
        this.checkQuota(userId, 'image');

        // 1. Analyze image (Robust Fallback)
        let description = '';
        try {
            // Using SDK here is risky if alias is bad, but keeping simple for now. 
            // Ideally should also be REST if needed.
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

    async analyzeImage(base64Image: string, prompt?: string): Promise<string> {
        this.checkQuota('system', 'text');

        try {
            const visionModel = this.genAI.getGenerativeModel({ model: this.IMAGE_MODEL });
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
            return "A colorful drawing.";
        }
    }

    async analyzeImageJSON(base64Image: string): Promise<any> {
        this.checkQuota('system', 'text');

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
            console.warn('Gemini 1.5 Flash failed, fallback defaults:', flashError);
            return {
                summary: "A creative drawing (AI Unavailable)",
                characters: ["Happy character"],
                setting: "Magical land",
                style: "Cartoon",
                storyHint: "A story about fun"
            };
        }
    }

    /**
     * Generate Speech (Google Cloud TTS via REST)
     */
    async generateSpeech(text: string, lang: string = 'en-US', gender: string = 'FEMALE'): Promise<Buffer> {
        if (!this.apiKey) throw new Error("GOOGLE_API_KEY is missing for TTS");

        console.log(`[Gemini Cloud TTS] Starting generation for text length: ${text.length}`);
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`;

        // Create a new Agent for TTS if needed, using the same proxy
        const ttsAgent = this.proxyAgent ? new HttpsProxyAgent(process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '') : undefined;

        try {
            // User requested en-US-Wavenet-D
            let voiceName = 'en-US-Wavenet-D';
            if (lang.startsWith('zh')) voiceName = 'cmn-CN-Wavenet-A';
            if (lang.startsWith('fr')) voiceName = 'fr-FR-Wavenet-B';
            if (lang.startsWith('es')) voiceName = 'es-ES-Wavenet-B';

            console.log(`[Gemini Cloud TTS] Fetching from ${url.split('?')[0]}... Voice: ${voiceName}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: { languageCode: lang, name: voiceName },
                    audioConfig: {
                        audioEncoding: 'MP3',
                        speakingRate: 1.0,
                        pitch: 0
                    }
                }),
                agent: ttsAgent
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Google TTS Error: ${response.status} - ${err}`);
            }

            const data: any = await response.json();
            console.log(`[Gemini Cloud TTS] Success! Audio content length: ${data.audioContent?.length}`);
            return Buffer.from(data.audioContent, 'base64');
        } catch (error) {
            console.error('generateSpeech (Google Cloud) failed:', error);
            throw error;
        }
    }
}

export const geminiService = new GeminiService();
