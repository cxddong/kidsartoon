import fetch from 'node-fetch';

// Use environment variable or fallback to the known working key for TTS
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyCvy_90ga9nVN0316J1cwXoRbPHp7vkhqY';
const TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

export class GeminiService {
    constructor() {
        console.log("GeminiService: Initialized with REST APIs (Safe Mode)");
    }

    /**
     * Generate Speech using Google Cloud TTS
     */
    async generateSpeech(text: string, lang: string = 'en-US'): Promise<Buffer> {
        // Voice Selection
        // Sparkle should sound friendly. 'en-US-Standard-B' (Male) or 'en-US-Standard-C' (Female)?
        // 'en-US-Journey-F' is generic/friendly. 'en-US-Wavenet-D' is standard male.
        // Let's use 'en-US-Journey-F' or 'en-US-Studio-O' if available, else Wavenet-F (Female).
        const voiceName = 'en-US-Journey-F'; // Friendly female-ish 

        console.log(`[Gemini] Generating Speech: "${text.substring(0, 30)}..." (${lang})`);

        try {
            const response = await fetch(TTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: { languageCode: lang, name: voiceName }, // Simple config, fallback logic handled by API usually
                    audioConfig: { audioEncoding: 'MP3', speakingRate: 1.1, pitch: 1.0 }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                // 400 means invalid voice? Fallback to standard.
                if (response.status === 400) {
                    console.warn("[Gemini] Voice not found, retrying with standard voice.");
                    return this.generateSpeechFallback(text, lang);
                }
                throw new Error(`TTS API Error: ${response.status} ${err}`);
            }

            const data: any = await response.json();
            if (!data.audioContent) throw new Error("No audio content received");

            return Buffer.from(data.audioContent, 'base64');
        } catch (e: any) {
            console.error("[Gemini] TTS Failed:", e.message);
            // Return empty buffer to prevent crash, but log error
            throw e;
        }
    }

    async generateSpeechFallback(text: string, lang: string): Promise<Buffer> {
        const response = await fetch(TTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text },
                voice: { languageCode: lang, name: 'en-US-Standard-A' },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });
        const data: any = await response.json();
        return Buffer.from(data.audioContent, 'base64');
    }

    /**
     * Chat with Sparkle (Gemini)
     */
    async chatWithSparkle(history: any[], imageContext?: any): Promise<any> {
        console.log("[Gemini] Chat Request. History length:", history?.length);

        let systemInstruction = `You are Sparkle, a magical, friendly, and enthusiastic AI companion for children in a creative art app called "Magic Lab".
Your goal is to encourage creativity, praise their artwork, and help them turn their drawings into stories or animations.
Keep your responses short (under 2-3 sentences), simple, and energetic. Use emojis! ✨🎨
If the user uploads a drawing (imageContext provided), ask them specifically about what is in the drawing.
Current Context: ${JSON.stringify(imageContext || {})}
`;

        // Transform History to Gemini Format (contents: [{ parts: [{ text: ... }] }])
        // Simplified mapping:
        const contents = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.parts?.[0]?.text || h.message || "" }]
        }));

        // Add System Prompt as first 'user' or 'system' content?
        // Gemini API supports system_instruction parameter.

        const payload = {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: contents,
            generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.7
            }
        };

        try {
            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`Gemini Chat API Error: ${response.status} ${err}`);
            }

            const data: any = await response.json();
            const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sparkle is thinking... ✨";

            // Extract tags if any (Simple heuristic or separate call - for now simple)
            // Sparkle logic usually expects: { text, tags?, sparkleTalk }

            return {
                sparkleTalk: replyText,
                tags: {}, // TODO: Implement tag extraction if needed
                text: replyText
            };

        } catch (e: any) {
            console.error("[Gemini] Chat Failed:", e.message);
            return { sparkleTalk: "Oops! My magic wand hiccuped. Can you say that again? ✨", text: "Error" };
        }
    }


    // --- Stubs for other methods to prevent crashes, but ideally should implement ---

    async generateStoryJSON(base64Image: string, userId: string): Promise<any> {
        console.warn("[Gemini] generateStoryJSON not fully implemented in REST mode yet.");
        return {
            title: "The Magic Drawing",
            story: "Once upon a time, a magical drawing came to life! (Service Restoration in progress)",
            characters: ["Sparkle"],
            question: "What happens next?"
        };
    }

    async extractVisualAnchors(base64Image: string) {
        return { character_description: "A cute magical character", art_style: "cartoon" };
    }

    async generateCreativeContent(type: any, input: any): Promise<any> {
        return {};
    }

    async analyzeImage(base64Image: string, prompt?: string) {
        return "An amazing drawing full of magic!";
    }

    async generateImage(prompt: string, userId: string) {
        return "https://via.placeholder.com/300?text=Magic+Image";
    }

    async generateImageFromImage(prompt: string, base64: string, userId: string) {
        return "https://via.placeholder.com/300?text=Magic+Transform";
    }
    async generateText(prompt: string, userId?: string): Promise<string> {
        console.log(`[Gemini] Generating Text...`);
        try {
            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
                })
            });
            if (!response.ok) throw new Error(`Gemini Text Gen Error: ${response.status}`);
            const data: any = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } catch (e: any) {
            console.error("[Gemini] generateText failed:", e.message);
            throw e;
        }
    }

    async analyzeImageJSON(base64Image: string, prompt: string): Promise<any> {
        const text = await this.analyzeImage(base64Image, prompt + " Output strict JSON.");
        try {
            // Clean markdown json codes
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.warn("Failed to parse JSON from vision:", text);
            return { raw: text };
        }
    }
}

export const geminiService = new GeminiService();
