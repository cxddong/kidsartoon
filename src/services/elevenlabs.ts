// ElevenLabs TTS Service - Premium Kid Voices
import fetch from 'node-fetch';

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

// 🌟 Voice IDs (Community Library)
export const VOICE_IDS = {
    KIKI: "Nggzl2QAXh3OijoXD116",   // Updated (Magic Kat default)
    AIAI: "zrHiDhphv9ZnVXBqCLjf",   // British/Aussie girl (Storybook)
    TITI: "D38z5RcWu1voky8WS1ja",    // 6-8yo boy (Adventure)
    PATRICK: "ODq5zmih8GrVes37Dizd" // American boy (Alternative)
};

// Safe API Key getter
const getApiKey = (): string => {
    const key = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
    if (!key) {
        console.warn("[ElevenLabs] Missing API Key");
    }
    return key || "";
};

class ElevenLabsService {
    /**
     * Generate speech with real kid voice
     * @param text - Text to speak
     * @param voiceId - Voice ID (default: Gigi)
     * @returns Audio buffer
     */
    async speak(text: string, voiceId: string = VOICE_IDS.KIKI): Promise<Buffer> {
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error("ElevenLabs API Key missing");
        }

        // Determine voice name for logging
        const voiceName = Object.keys(VOICE_IDS).find(
            key => VOICE_IDS[key as keyof typeof VOICE_IDS] === voiceId
        ) || "Unknown";

        console.log(`[ElevenLabs] Generating with ${voiceName} voice...`);

        try {
            const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_turbo_v2_5", // Fastest model
                    voice_settings: {
                        stability: 0.5,       // Emotion richness
                        similarity_boost: 0.8, // Voice consistency
                        style: 0.0,           // Style exaggeration
                        use_speaker_boost: true
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("[ElevenLabs] API Error:", errData);
                throw new Error(`ElevenLabs Error: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            console.log(`[ElevenLabs] ✅ Audio generated (${arrayBuffer.byteLength} bytes)`);

            return Buffer.from(arrayBuffer);

        } catch (error: any) {
            console.error("[ElevenLabs] Failed:", error.message);
            throw error;
        }
    }

    /**
     * Get remaining character quota
     * Useful for preventing overages
     */
    async getCharacterQuota(): Promise<{ character_count: number; character_limit: number } | null> {
        const apiKey = getApiKey();
        if (!apiKey) return null;

        try {
            const response = await fetch("https://api.elevenlabs.io/v1/user", {
                headers: { "xi-api-key": apiKey }
            });

            if (response.ok) {
                const data: any = await response.json();
                return {
                    character_count: data.subscription?.character_count || 0,
                    character_limit: data.subscription?.character_limit || 0
                };
            }
        } catch (error) {
            console.warn("[ElevenLabs] Failed to fetch quota:", error);
        }

        return null;
    }
}

export const elevenLabsService = new ElevenLabsService();
