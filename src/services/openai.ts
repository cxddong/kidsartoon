import fetch from 'node-fetch';

const API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIService {
    constructor() {
        if (!API_KEY) console.warn("OpenAIService: Missing API Key");
    }

    /**
     * Chat with OpenAI (GPT-4o)
     * Extracts tags/keywords for image generation.
     */
    async generateSpeech(text: string): Promise<Buffer> {
        if (!API_KEY) throw new Error("OpenAI API Key missing");

        const url = 'https://api.openai.com/v1/audio/speech';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "tts-1",
                    voice: "nova", // 🥇 Energetic female
                    input: text,
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI TTS Error: ${response.status} ${err}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (e: any) {
            console.error("[OpenAI] TTS Failed:", e.message);
            throw e;
        }
    }

    /**
     * Chat with OpenAI (GPT-4o)
     * Extracts tags/keywords for image generation.
     */
    async chatWithSparkle(history: any[], imageBase64?: string): Promise<any> {
        if (!API_KEY) throw new Error("OpenAI API Key missing");

        console.log("[OpenAI] Chat Request. History length:", history?.length, "Has Image:", !!imageBase64);

        const SYSTEM_PROMPT = `
You are Sparkle, the AI host of "Magic Cinema".
YOUR GOAL: Help the child animate their drawing based on WHAT YOU SEE.

CRITICAL RULES:
1. **LOOK FIRST:** Always analyze the user's uploaded image first.
2. **BE SPECIFIC:** Don't just say "cool drawing". Say "Wow, that's a cute [DOG/CAR/TREE]!" based on the image.
3. **FALLBACK:** If the image is messy or unclear, DO NOT guess wildly. Instead, ask: "This looks interesting! Can you tell me what you drew?"
4. **NO ROBOT TALK:** Be enthusiastic and encouraging. Use simple English.
5. **ALWAYS OUTPUT JSON**.

CONVERSATION FLOW:
- **Scenario A (Clear Image):** - User uploads a cat.
  - You: "I see a fluffy cat! Do you want it to jump, meow, or run?"
  
- **Scenario B (Unclear/Abstract Image):**
  - User uploads scribbles.
  - You: "Ooh, colorful! Is this a magic monster or a fast car? Tell me about it!"

- **Scenario C (Action Confirmation):**
  - User says: "It's a monster."
  - You: "A monster! Should it roar or dance?"
  - User says: "Dance."
  - You: "Dancing monster coming up!" (Then output action tag)

Output JSON Schema:
{
  "sparkleTalk": "Your spoken reply.",
  "tags": {
    "action": "...",
    "subject": "...",
    "style": "..."
  }
}
`;

        // Reformulate Messages for Vision
        // We need to find the latest user message or create one.
        // If history is empty and we have image, we create a user message.

        const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];

        // Map existing history (text only usually)
        history.forEach(h => {
            messages.push({
                role: h.role === 'model' ? 'assistant' : 'user',
                content: h.parts?.[0]?.text || h.message || ""
            });
        });

        // Handle Image Integation
        // If image provided, we append it to the LAST user message, or create a new one.
        if (imageBase64) {
            const lastMsg = messages[messages.length - 1];
            const imageUrlObj = {
                type: "image_url",
                image_url: {
                    url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                    detail: "low"
                }
            };

            if (lastMsg && lastMsg.role === 'user') {
                // Convert content to array if it's string
                if (typeof lastMsg.content === 'string') {
                    lastMsg.content = [{ type: "text", text: lastMsg.content }];
                }
                lastMsg.content.push(imageUrlObj);
            } else {
                // Create new message (e.g. Auto-Analyze trigger with empty text)
                messages.push({
                    role: 'user',
                    content: [
                        { type: "text", text: "I just uploaded this drawing! What do you see?" },
                        imageUrlObj
                    ]
                });
            }
        }

        try {
            const response = await fetch(OPENAI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // 🚀 Use Mini for Speed/Cost as requested
                    messages: messages,
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI API Error: ${response.status} ${err}`);
            }

            const data: any = await response.json();
            const content = data.choices[0].message.content;

            console.log("[OpenAI] Response:", content);

            try {
                const parsed = JSON.parse(content);
                return {
                    sparkleTalk: parsed.sparkleTalk,
                    tags: parsed.tags,
                    text: parsed.sparkleTalk
                };
            } catch (e) {
                console.error("[OpenAI] JSON Parse Failed:", e);
                return { sparkleTalk: "I got a bit confused! Let's try again. ✨" };
            }

        } catch (e: any) {
            console.error("[OpenAI] Chat Failed:", e.message);
            throw e;
        }
    }
}

export const openAIService = new OpenAIService();
