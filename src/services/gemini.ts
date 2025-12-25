// DUMMY SERVICE TO DEBUG "ILLEGAL CONSTRUCTOR" ERROR
// This file has NO dependencies (no OpenAI, no Node-fetch, no Buffer)
// If the app loads with this, we know the previous file was causing the crash via accidental import.

export class GeminiService {
    constructor() {
        console.log("DEBUG: Dummy GeminiService initialized");
    }

    async chatWithSparkle(userMessage: any, history: any[] = []): Promise<any> {
        return { sparkleTalk: "Debug Mode: Chat Disabled", status: "DEBUG", tags: {} };
    }

    async generateSpeech(text: string): Promise<any> {
        // Return simple array buffer to avoid Node "Buffer"
        return new Uint8Array(0);
    }

    async generateStoryJSON(base64Image: string, userId: string): Promise<any> {
        return { title: "Debug Story", characters: [], story: "Debug mode.", question: "?" };
    }

    async extractVisualAnchors(base64Image: string) {
        return { character_description: "Debug", art_style: "Debug" };
    }

    async generateCreativeContent(type: any, input: any) {
        return {};
    }

    async analyzeImage(base64Image: string, prompt?: string) {
        return "Debug Image Description";
    }

    async generateImage(prompt: string, userId: string) {
        return "https://via.placeholder.com/150";
    }

    async generateImageFromImage(prompt: string, base64: string, userId: string) {
        return "https://via.placeholder.com/150";
    }
}

// Export Singleton
export const geminiService = new GeminiService();
