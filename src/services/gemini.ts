import OpenAI from "openai";
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Model Selection Strategy
type TaskType = 'chat' | 'vision' | 'script' | 'analysis' | 'tts';

const MODEL_ROUTER_OPENAI: Record<TaskType, string> = {
    chat: 'gpt-4o-mini',      // Default: Low cost for casual conversation
    vision: 'gpt-4o',         // Advanced: High quality for image analysis
    script: 'gpt-4o',         // Advanced: Structured generation (or gpt-5.2)
    analysis: 'gpt-4o-mini',  // Cost reduction for general analysis
    tts: 'tts-1-hd'           // High quality voice
};

const MODEL_ROUTER_GEMINI: Record<TaskType, string> = {
    chat: 'gemini-1.5-flash',
    vision: 'gemini-1.5-flash',
    script: 'gemini-1.5-pro',
    analysis: 'gemini-1.5-pro',
    tts: 'gemini-1.5-flash' // Not used for TTS directly, but as fallback for logic
};

// API Key Selectors
const getOpenAIApiKey = () => process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || "";
const getGoogleApiKey = () => process.env.GOOGLE_API_KEY || process.env.VITE_GOOGLE_API_KEY || "";

// Instances
let openaiInstance: OpenAI | null = null;
let googleGenAIInstance: GoogleGenerativeAI | null = null;

const getOpenAI = () => {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) return null;
    if (!openaiInstance) {
        openaiInstance = new OpenAI({ apiKey, dangerouslyAllowBrowser: false });
    }
    return openaiInstance;
};

const getGoogleGenAI = () => {
    const apiKey = getGoogleApiKey();
    if (!apiKey) return null;
    if (!googleGenAIInstance) {
        googleGenAIInstance = new GoogleGenerativeAI(apiKey);
    }
    return googleGenAIInstance;
};

/**
 * GeminiService - Powered by OpenAI with Google Gemini Fallback
 * Provides a unified interface for AI tasks with high reliability.
 */
export class GeminiService {

    constructor() {
        const hasOpenAI = !!getOpenAIApiKey();
        const hasGoogle = !!getGoogleApiKey();
        console.log(`✅ [GeminiService] Initialized. Status: OpenAI=${hasOpenAI ? 'OK' : 'MISSING'}, Google=${hasGoogle ? 'OK' : 'MISSING'}`);
        if (!hasOpenAI && !hasGoogle) {
            console.error("❌ [GeminiService] CRITICAL: Both OpenAI and Google API keys are missing. Please check .env");
        }
    }

    /**
     * Generate text with cross-provider fallback
     */
    async generateText(prompt: string, userId?: string, taskType: TaskType = 'script', modelTier: 'standard' | 'premium' = 'standard'): Promise<string> {
        // 1. Try OpenAI
        try {
            const openai = getOpenAI();
            if (openai) {
                let model = MODEL_ROUTER_OPENAI[taskType];

                // Model Tier Override
                if (taskType === 'script') {
                    if (modelTier === 'premium') {
                        model = 'gpt-4o'; // Premium (GPT-5.2 in UI)
                    } else {
                        model = 'gpt-4o-mini'; // Standard
                    }
                }

                console.log(`[GeminiService->OpenAI] Generating Text with ${model} (Tier: ${modelTier})...`);
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [
                        { role: "system", content: "You are a creative AI assistant for children's art and storytelling." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                });
                return response.choices[0].message.content || "";
            }
        } catch (openaiErr: any) {
            console.warn("[GeminiService] OpenAI generateText failed, falling back to Gemini:", openaiErr.message);
        }

        // 2. Try Google Gemini
        try {
            const genAI = getGoogleGenAI();
            if (genAI) {
                const modelName = MODEL_ROUTER_GEMINI[taskType];
                console.log(`[GeminiService->Gemini] Generating Text with ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text();
            }
        } catch (geminiErr: any) {
            console.error("❌ [GeminiService] All generateText providers failed:", geminiErr.message);
            throw new Error("No AI providers available for text generation");
        }

        throw new Error("Missing AI API Keys (OpenAI/Google)");
    }

    /**
     * Analyze image with cross-provider fallback
     */
    async analyzeImage(base64Image: string, prompt: string = "Describe this image in detail."): Promise<string> {
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        // 1. Try OpenAI Vision
        try {
            const openai = getOpenAI();
            if (openai) {
                const modelName = MODEL_ROUTER_OPENAI.vision;
                console.log(`[GeminiService->OpenAI] Analyzing Image with ${modelName}...`);
                const response = await openai.chat.completions.create({
                    model: modelName,
                    messages: [
                        {
                            role: "user",
                            content: [
                                { type: "text", text: prompt },
                                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanBase64}`, detail: "high" } },
                            ],
                        },
                    ],
                    max_tokens: 1000,
                    temperature: 0.7,
                });
                return response.choices[0].message.content || "";
            }
        } catch (openaiErr: any) {
            console.warn("[GeminiService] OpenAI analyzeImage failed, falling back to Gemini:", openaiErr.message);
        }

        // 2. Try Google Gemini Vision
        try {
            const genAI = getGoogleGenAI();
            if (genAI) {
                console.log("[GeminiService->Gemini] Analyzing Image with Gemini 1.5 Flash...");
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent([
                    prompt,
                    { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
                ]);
                const response = await result.response;
                return response.text();
            }
        } catch (geminiErr: any) {
            console.error("❌ [GeminiService] All analyzeImage providers failed:", geminiErr.message);
            // Friendly fallback object for children's UI
            return JSON.stringify({
                detected: "A creative drawing",
                suggestions: ["Try adding more colors!", "Draw a background setting!"],
                feedback: "I can't see clearly right now, but keep creating! Your art is wonderful!"
            });
        }

        return "I'm sorry, I'm having a little trouble seeing right now. Keep up the great work!";
    }

    /**
     * Analyze image and return JSON
     */
    async analyzeImageJSON(base64Image: string, prompt: string): Promise<any> {
        const text = await this.analyzeImage(base64Image, prompt + " Output strict JSON only.");
        try {
            // Clean markdown json codes
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            // Extract JSON if wrapped in text
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            return JSON.parse(jsonStr);
        } catch (e) {
            console.warn("[GeminiService] Failed to parse JSON from vision:", text.substring(0, 200));
            return { raw: text };
        }
    }

    /**
     * Analyze improvement between two images (V1 and V2)
     * Used for Masterpiece Match V2 - Iterative Improvement Tracking
     */
    async analyzeImprovement(
        originalBase64: string,
        newBase64: string,
        previousAdvice: string
    ): Promise<{
        improvement_score: number;
        feedback: string;
        next_suggestion: string;
        is_perfect: boolean;
        improvements_detected: string[];
    }> {
        const systemPrompt = `You are **Magic Kat**, an encouraging Art Coach for children (ages 5-10).

**CONTEXT:**
- Image 1: The student's first draft
- Image 2: The student's new drawing after receiving coaching
- Your Previous Advice: "${previousAdvice}"

**YOUR TASK:**
1. **COMPARE:** Carefully examine both images side-by-side
2. **CHECK:** Did they follow your advice? What specific changes did they make?
3. **CELEBRATE:** What improved? (colors, details, composition, technique, etc.)
4. **ENCOURAGE:** Give specific, positive, child-friendly feedback
5. **GUIDE:** Suggest one simple next step to keep improving

**SCORING GUIDELINES:**
- 90-100: Amazing improvement! Followed advice perfectly!
- 75-89: Great progress! Significant improvements visible
- 50-74: Good effort! Some improvements, keep going!
- 30-49: Nice try! Keep practicing, you're learning!
- 0-29: Every artist takes time! Don't give up!

**OUTPUT FORMAT:**
Return ONLY valid JSON with this exact structure:
{
  "improvement_score": 85,
  "feedback": "Wow! You added the bright yellow sun just like I suggested! It really makes your drawing pop!",
  "improvements_detected": ["Added yellow sun", "Used brighter colors"],
  "next_suggestion": "Try adding some fluffy white clouds!",
  "is_perfect": false
}`;

        const cleanOriginal = originalBase64.replace(/^data:image\/\w+;base64,/, "");
        const cleanNew = newBase64.replace(/^data:image\/\w+;base64,/, "");

        // 1. Try OpenAI
        try {
            const openai = getOpenAI();
            if (openai) {
                const modelName = MODEL_ROUTER_OPENAI.vision;
                console.log(`[GeminiService->OpenAI] Analyzing Improvement with ${modelName}...`);
                const response = await openai.chat.completions.create({
                    model: modelName,
                    messages: [
                        { role: "system", content: systemPrompt },
                        {
                            role: "user",
                            content: [
                                { type: "text", text: "Compare these two drawings and tell me how the second one improved!" },
                                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanOriginal}`, detail: "high" } },
                                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cleanNew}`, detail: "high" } }
                            ]
                        }
                    ],
                    response_format: { type: "json_object" },
                    max_tokens: 600,
                    temperature: 0.7
                });
                const result = JSON.parse(response.choices[0].message.content || "{}");
                return this.validateImprovementResult(result);
            }
        } catch (e: any) {
            console.warn("[GeminiService] OpenAI analyzeImprovement failed, falling back to Gemini:", e.message);
        }

        // 2. Try Google Gemini
        try {
            const genAI = getGoogleGenAI();
            if (genAI) {
                console.log("[GeminiService->Gemini] Analyzing Improvement...");
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent([
                    systemPrompt + "\nOutput JSON.",
                    { inlineData: { data: cleanOriginal, mimeType: "image/jpeg" } },
                    { inlineData: { data: cleanNew, mimeType: "image/jpeg" } }
                ]);
                const response = await result.response;
                const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                return this.validateImprovementResult(JSON.parse(text));
            }
        } catch (e: any) {
            console.error("❌ [GeminiService] analyzeImprovement all providers failed:", e.message);
        }

        return {
            improvement_score: 70,
            feedback: "You're making progress! Keep up the great work! Your new drawing shows you're practicing hard!",
            improvements_detected: ["You added more details", "Your effort shows"],
            next_suggestion: "Keep practicing and have fun with your art!",
            is_perfect: false
        };
    }

    private validateImprovementResult(result: any) {
        return {
            improvement_score: result.improvement_score || 50,
            feedback: result.feedback || "Great job working on your art! Keep practicing!",
            next_suggestion: result.next_suggestion || "Keep drawing and have fun!",
            is_perfect: result.is_perfect || false,
            improvements_detected: Array.isArray(result.improvements_detected)
                ? result.improvements_detected
                : ["You added new details!"]
        };
    }

    /**
     * Chat with Sparkle/Magic Kat
     */
    async chatWithSparkle(history: any[], imageContext?: any): Promise<any> {
        const systemInstruction = `You are Sparkle, a magical, friendly, and enthusiastic AI companion for children in a creative art app called "Magic Lab".
Your goal is to encourage creativity, praise their artwork, and help them turn their drawings into stories or animations.
Keep your responses short (under 2-3 sentences), simple, and energetic. Use emojis! ✨🎨
Current Context: ${JSON.stringify(imageContext || {})}`;

        // 1. Try OpenAI
        try {
            const openai = getOpenAI();
            if (openai) {
                const modelName = MODEL_ROUTER_OPENAI.chat;
                console.log(`[GeminiService->OpenAI] Chat Request with ${modelName}...`);
                const messages: any[] = [{ role: "system", content: systemInstruction }];
                history.forEach(h => {
                    messages.push({
                        role: h.role === 'user' ? 'user' : 'assistant',
                        content: h.parts?.[0]?.text || h.message || ""
                    });
                });

                const response = await openai.chat.completions.create({
                    model: modelName,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 150
                });
                const replyText = response.choices[0].message.content || "";
                return { sparkleTalk: replyText, tags: {}, text: replyText };
            }
        } catch (e: any) {
            console.warn("[GeminiService] OpenAI chat failed, falling back to Gemini:", e.message);
        }

        // 2. Try Google Gemini
        try {
            const genAI = getGoogleGenAI();
            if (genAI) {
                console.log("[GeminiService->Gemini] Chat Request");
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction });
                const chat = model.startChat({
                    history: history.map(h => ({
                        role: h.role === 'user' ? 'user' : 'model',
                        parts: h.parts || [{ text: h.message || "" }]
                    }))
                });
                const result = await chat.sendMessage("Continue the conversation.");
                const replyText = result.response.text();
                return { sparkleTalk: replyText, tags: {}, text: replyText };
            }
        } catch (e: any) {
            console.error("❌ [GeminiService] chat all providers failed:", e.message);
        }

        return {
            sparkleTalk: "Oops! My magic wand hiccuped. Can you say that again? ✨",
            text: "Error"
        };
    }

    /**
     * Generate speech using OpenAI TTS or Fallback
     */
    async generateSpeech(text: string, lang: string = 'en-US'): Promise<Buffer> {
        // 1. Try OpenAI TTS (High Quality)
        try {
            const openai = getOpenAI();
            if (openai) {
                const modelName = MODEL_ROUTER_OPENAI.tts;
                console.log(`[GeminiService->OpenAI] Generating Speech with ${modelName}: "${text.substring(0, 30)}..."`);
                const response = await openai.audio.speech.create({
                    model: modelName,
                    voice: "nova",
                    input: text,
                    speed: 1.0
                });
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }
        } catch (e: any) {
            console.warn("[GeminiService] OpenAI TTS failed, trying fallback:", e.message);
        }

        // 2. Fallback: Google Translate TTS (Free but lower quality)
        try {
            // @ts-ignore
            const googleTTS = await import('google-tts-api');
            const url = googleTTS.getAudioUrl(text, {
                lang: lang.split('-')[0], // 'en-US' -> 'en'
                slow: false,
                host: 'https://translate.google.com',
            });
            const resp = await fetch(url);
            if (resp.ok) {
                const arrayBuffer = await resp.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }
        } catch (e: any) {
            console.error("❌ [GeminiService] All TTS providers failed:", e.message);
        }

        throw new Error("Speech generation failed");
    }

    /**
     * Generate creative content (Picture books, etc)
     */
    async generateCreativeContent(type: 'Picturebook_4_Page' | 'Picturebook_N_Page', input: { theme: string, character_description: string, page_count: number }): Promise<any> {
        console.log("[GeminiService->OpenAI] Generating Creative Content:", type, input);

        const pageCount = input.page_count || 4;

        const prompt = `You are an award-winning children's picture book author and illustrator. Create a ${pageCount}-page picture book story that is EXCITING, ENGAGING, and VISUALLY DYNAMIC.

Theme: ${input.theme}
Main Character: ${input.character_description}

CRITICAL REQUIREMENTS:

1. NARRATIVE TEXT (text_overlay):
   - Write 3-5 sentences per page
   - Use vivid, descriptive language
   - Include character emotions and sensory details
   - Show character growth throughout the story

2. IMAGE PROMPTS (image_prompt):
   Each must include:
   - Specific character action and pose
   - Facial expression and emotion
   - Camera angle (vary for each page)
   - Detailed environment and atmosphere
   - Dynamic elements (motion, lighting)

RETURN ONLY this JSON structure (no markdown):
{
  "title": "Story Title",
  "content": [
    {
      "page": 1,
      "text_overlay": "Engaging narrative text (3-5 sentences)",
      "image_prompt": "Detailed visual description with camera angle, character pose, environment",
      "visual_description": "Brief summary"
    }
  ]
}

Create exactly ${pageCount} pages with a complete story arc.`;

        try {
            const rawText = await this.generateText(prompt);
            console.log("[GeminiService] Raw response length:", rawText.length);

            // Clean response
            let cleanText = rawText
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .replace(/^[^{]*({)/, '$1')
                .replace(/(})[^}]*$/, '$1')
                .trim();

            const json = JSON.parse(cleanText);

            // Validation
            if (!json.content || !Array.isArray(json.content)) {
                throw new Error("Invalid story structure: missing content array");
            }

            // Ensure correct page count
            while (json.content.length < pageCount) {
                json.content.push({
                    page: json.content.length + 1,
                    text_overlay: "And the adventure continues...",
                    image_prompt: "A magical continuation of the story",
                    visual_description: "The story unfolds further"
                });
            }

            json.content = json.content.slice(0, pageCount);

            console.log("[GeminiService] Story generation successful!");
            return json;

        } catch (e: any) {
            console.error("[GeminiService] Content Gen FAILED:", e.message);

            // Return fallback structure
            return {
                title: `The ${input.theme} Adventure`,
                content: Array.from({ length: pageCount }, (_, i) => ({
                    page: i + 1,
                    text_overlay: `Page ${i + 1} of the magical story featuring ${input.character_description}.`,
                    image_prompt: `${input.character_description} in a ${input.theme} adventure, page ${i + 1}`,
                    visual_description: `Story page ${i + 1}`
                }))
            };
        }
    }

    /**
     * Extract visual anchors from image
     */
    async extractVisualAnchors(base64Image: string) {
        const prompt = `Analyze this drawing and extract:
1. Character Description: Detailed physical description
2. Art Style: The artistic style (cartoon, realistic, watercolor, etc.)

Return JSON:
{
  "character_description": "detailed description",
  "art_style": "style name"
}`;

        try {
            const result = await this.analyzeImageJSON(base64Image, prompt);
            return {
                character_description: result.character_description || "A creative character",
                art_style: result.art_style || "cartoon"
            };
        } catch (e) {
            return {
                character_description: "A creative magical character",
                art_style: "cartoon"
            };
        }
    }

    /**
     * Analyze artwork and match with masterpiece
     */
    async analyzeAndMatchMasterpiece(imageBase64: string, masterpieces: any[]): Promise<any> {
        console.log('[GeminiService->OpenAI] Analyzing artwork for masterpiece match...');

        const artListText = masterpieces.map(m =>
            `ID: ${m.id} | Artist: ${m.artist} | Title: ${m.title} | Keywords: ${m.tags.join(", ")}`
        ).join("\n");

        const prompt = `You are Magic Kat, an art historian for kids (age 5-10).

TASK:
1. Carefully analyze this child's drawing
2. Find the ONE artwork from the list below that shares the most similarities
3. Explain the connection in an exciting way
4. Give one simple tip

AVAILABLE ARTWORKS:
${artListText}

OUTPUT (JSON only):
{
  "matchId": "exact_id_from_list",
  "analysis": "Wow! Your drawing has...",
  "suggestion": "Try using...",
  "commonFeatures": ["feature1", "feature2", "feature3"]
}`;

        try {
            const cleanBase64 = imageBase64.split(',')[1] || imageBase64;
            const result = await this.analyzeImageJSON(cleanBase64, prompt);

            // Validate matchId
            const isValidMatch = masterpieces.some(m => m.id === result.matchId);
            if (!isValidMatch) {
                console.warn(`[GeminiService] Invalid matchId: ${result.matchId}, using fallback`);
                result.matchId = masterpieces[0]?.id || 'fallback';
            }

            return result;
        } catch (error: any) {
            console.error('[GeminiService] Masterpiece matching failed:', error);
            throw new Error(`Failed to analyze artwork: ${error.message}`);
        }
    }

    /**
     * Generate story JSON (legacy method)
     */
    async generateStoryJSON(base64Image: string, userId: string): Promise<any> {
        const prompt = `Based on this image, create a short children's story.

Return JSON:
{
  "title": "story title",
  "story": "the story text",
  "characters": ["character1", "character2"],
  "question": "a question to ask the child"
}`;

        try {
            return await this.analyzeImageJSON(base64Image, prompt);
        } catch (e) {
            return {
                title: "The Magic Drawing",
                story: "Once upon a time, a magical drawing came to life!",
                characters: ["Hero"],
                question: "What happens next?"
            };
        }
    }

    /**
     * Generate image (stub - delegates to Doubao service in production)
     */
    async generateImage(prompt: string, userId: string) {
        return "https://via.placeholder.com/300?text=Magic+Image";
    }

    /**
     * Generate image from image (stub)
     */
    async generateImageFromImage(prompt: string, base64: string, userId: string) {
        return "https://via.placeholder.com/300?text=Magic+Transform";
    }
}

export const geminiService = new GeminiService();
