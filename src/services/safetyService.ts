
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
];

export const safetyService = {
    /**
     * Validates a text prompt for safety.
     * Returns true if safe, false if unsafe.
     */
    async validatePrompt(prompt: string): Promise<boolean> {
        if (!API_KEY) {
            console.warn("Safety Check Skipped: No API Key");
            return true;
        }

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings: SAFETY_SETTINGS });
            // We ask the model to evaluate the safety explicitly as well, 
            // but the safety filters should trigger block exception if content is bad.

            const result = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: `Check if this text is safe for a children's book app. If it contains violence, hate speech, or adult content, reply 'UNSAFE'. Otherwise reply 'SAFE'. Text: "${prompt}"` }]
                    }
                ]
            });

            const response = result.response;
            // Check if blocked by safety filters
            if (response.promptFeedback?.blockReason) {
                console.warn("Blocked by Safety Filters:", response.promptFeedback.blockReason);
                return false;
            }

            const text = response.text().trim().toUpperCase();
            return text.includes("SAFE") && !text.includes("UNSAFE");

        } catch (error: any) {
            // If the API throws a "Safety" related error (often 400 or block error)
            if (error.message?.includes("SAFETY") || error.toString().includes("blocked")) {
                return false;
            }
            console.error("Safety Check Error:", error);
            // Fail safe or Fail closed? For child app, fail closed.
            return false;
        }
    },

    /**
     * Validates an image (base64 or url) for safety.
     */
    async validateImage(imageBase64: string): Promise<boolean> {
        if (!API_KEY) return true;

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", safetySettings: SAFETY_SETTINGS });

            // Strip data header if present
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

            const result = await model.generateContent([
                "Check if this image is safe for a children's app. Reply only SAFE or UNSAFE.",
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                    }
                }
            ]);

            const response = result.response;
            if (response.promptFeedback?.blockReason) return false;

            const text = response.text().trim().toUpperCase();
            return text.includes("SAFE") && !text.includes("UNSAFE");

        } catch (error: any) {
            if (error.message?.includes("SAFETY") || error.toString().includes("blocked")) {
                return false;
            }
            console.error("Image Safety Check Error:", error);
            return false;
        }
    }
};
