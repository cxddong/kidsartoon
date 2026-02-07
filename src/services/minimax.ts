

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

// Environment variables are read at runtime inside the method for safety



// Voice Mappings
// Voice Mappings
// Voice Archetypes (Global Specs 2026)
export const VOICE_ARCHETYPES = {
    "arch_01": { "id": "female-shaonv", "label": "Sweet Fairy" },
    "arch_02": { "id": "female-yujie", "label": "Soft Petal" },
    "arch_03": { "id": "male-qn-qingse", "label": "Little Hero" },
    "arch_04": { "id": "male-qn-shaonian", "label": "Calm Sea" },
    "arch_05": { "id": "presenter_female", "label": "Golden Mom" },
    "arch_06": { "id": "female-baoma", "label": "Warm Earth" },
    "arch_07": { "id": "male-qn-kaixuan", "label": "Brave Dad" },
    "arch_08": { "id": "male-qn-huoli", "label": "Sunny Day" },
    "arch_09": { "id": "male-laonian", "label": "Silver Wisdom" },
    "arch_10": { "id": "presenter_male", "label": "Story Narrator" }
};

// Voice Mappings
const VOICE_MAP: Record<string, string> = {
    // Legacy support
    'kiki': 'female-shaonv',       // Sweet Fairy
    'aiai': 'female-baoma',        // Warm Earth
    'titi': 'male-qn-qingse',      // Little Hero

    // Direct checks
    'female-shaonv': 'female-shaonv',
    'female-yujie': 'female-yujie',
    'male-qn-qingse': 'male-qn-qingse',
    'male-qn-shaonian': 'male-qn-shaonian',
    'presenter_female': 'presenter_female',
    'female-baoma': 'female-baoma',
    'male-qn-kaixuan': 'male-qn-kaixuan',
    'male-qn-huoli': 'male-qn-huoli',
    'male-laonian': 'male-laonian',
    'presenter_male': 'presenter_male',

    // Archetype access
    'arch_01': 'female-shaonv',
    'arch_02': 'female-yujie',
    'arch_03': 'male-qn-qingse',
    'arch_04': 'male-qn-shaonian',
    'arch_05': 'presenter_female',
    'arch_06': 'female-baoma',
    'arch_07': 'male-qn-kaixuan',
    'arch_08': 'male-qn-huoli',
    'arch_09': 'male-laonian',
    'arch_10': 'presenter_male'
};

export class MinimaxService {

    /**
     * Upload a file to MiniMax for voice cloning or prompt audio
     * purpose: 'voice_clone' | 'prompt_audio'
     */
    async uploadFile(filePath: string, purpose: 'voice_clone' | 'prompt_audio'): Promise<string> {
        const MINIMAX_API_URL = 'https://api.minimax.io/v1/files/upload';
        const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

        try {
            if (!MINIMAX_API_KEY) throw new Error("Missing Minimax API Key");

            const formData = new FormData();
            formData.append('purpose', purpose);
            const fileStream = fs.createReadStream(filePath);
            formData.append('file', fileStream);

            console.log(`[Minimax] Uploading file for ${purpose}: ${filePath}`);

            const response = await (axios as any).post(MINIMAX_API_URL, formData, {
                headers: {
                    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                    ...formData.getHeaders()
                }
            });

            if (response.data && response.data.file && response.data.file.file_id) {
                return response.data.file.file_id;
            } else {
                console.error("[Minimax] Unexpected Upload Response:", JSON.stringify(response.data));
                throw new Error("Invalid response from MiniMax Upload API");
            }

        } catch (error: any) {
            console.error('[Minimax] Upload failed:', error.message);
            if (error.response) {
                console.error('[Minimax] Response data:', JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    /**
     * Create a voice clone using MiniMax API
     */
    async createVoiceClone(fileId: string, voiceId: string): Promise<any> {
        const MINIMAX_API_URL = 'https://api.minimax.io/v1/voice_clone';
        const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';

        try {
            if (!MINIMAX_API_KEY) throw new Error("Missing Minimax API Key");

            console.log(`[Minimax] Creating voice clone for ID: ${voiceId} using File: ${fileId}`);

            const payload = {
                file_id: fileId,
                voice_id: voiceId,
                // Optional: We can add a prompt audio here if we had one "prompt_audio": <file_id>
                // For now, simple cloning
            };

            const response = await (axios as any).post(MINIMAX_API_URL, payload, {
                headers: {
                    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.data;

        } catch (error: any) {
            console.error('[Minimax] Voice Clone failed:', error.message);
            if (error.response) {
                console.error('[Minimax] Response data:', JSON.stringify(error.response.data));
            }
            throw error;
        }
    }

    /**
     * Generate speech using Minimax T2A V2
     */
    async generateSpeech(text: string, voiceKey: string, pitch: number = 0, speed: number = 1.0): Promise<Buffer> {
        // Late binding for environment variables to ensure they are loaded
        const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimax.io/v1/t2a_v2';
        const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
        const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';

        try {
            const voiceId = VOICE_MAP[voiceKey] || voiceKey || 'English_PlayfulGirl'; // Fallback to key or default
            console.log(`[Minimax] Generating speech for voice: ${voiceKey} -> ${voiceId} (Pitch: ${pitch}, Speed: ${speed})`);
            console.log(`[Minimax] Text length: ${text.length} characters`);

            if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
                console.error("[Minimax] Missing credentials - API_KEY:", !!MINIMAX_API_KEY, "GROUP_ID:", !!MINIMAX_GROUP_ID);
                throw new Error("Missing Minimax API Key or Group ID in environment variables");
            }

            const payload = {
                model: "speech-01-turbo",
                text: text,
                stream: false,
                voice_setting: {
                    voice_id: voiceId,
                    speed: speed,
                    vol: 1.0,
                    pitch: pitch
                },
                audio_setting: {
                    sample_rate: 32000,
                    bitrate: 128000,
                    format: "mp3",
                    channel: 1
                }
            };

            const response = await (axios as any).post(`${MINIMAX_API_URL}?GroupId=${MINIMAX_GROUP_ID}`, payload, {
                headers: {
                    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data) {
                const json = response.data;

                if (json.base_resp && json.base_resp.status_code === 0 && json.data && json.data.audio) {
                    // Convert Hex string to Buffer
                    const audioHex = json.data.audio;
                    return Buffer.from(audioHex, 'hex');
                } else {
                    const statusMsg = json.base_resp ? json.base_resp.status_msg : 'Unknown error';
                    throw new Error(`Minimax API Error: ${statusMsg} (Code: ${json.base_resp?.status_code})`);
                }
            } else {
                throw new Error(`Minimax HTTP Error: ${response.status}`);
            }

        } catch (error: any) {
            console.error('[Minimax] Generation failed:', error.message);
            if (error.response) {
                console.error('[Minimax] Response status:', error.response.status);
                console.error('[Minimax] CRITICAL ERROR DATA:', JSON.stringify(error.response.data, null, 2));
            }
            throw error;
        }
    }

    /**
     * Generate speech using Minimax T2A V2 with Streaming
     */
    async generateSpeechStream(text: string, voiceKey: string): Promise<any> {
        const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimax.io/v1/t2a_v2';
        const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
        const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';

        try {
            const voiceId = VOICE_MAP[voiceKey] || 'English_PlayfulGirl';
            console.log(`[Minimax-Stream] Generating speech for voice: ${voiceKey} -> ${voiceId}`);

            if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
                throw new Error("Missing Minimax API Key or Group ID");
            }

            const payload = {
                model: "speech-01-turbo",
                text: text,
                stream: true,
                voice_setting: {
                    voice_id: voiceId,
                    speed: 1.0,
                    vol: 1.0,
                    pitch: 0
                },
                audio_setting: {
                    sample_rate: 32000,
                    bitrate: 128000,
                    format: "mp3",
                    channel: 1
                }
            };

            const response = await (axios as any).post(`${MINIMAX_API_URL}?GroupId=${MINIMAX_GROUP_ID}`, payload, {
                headers: {
                    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            });

            return response.data;
        } catch (error: any) {
            console.error('[Minimax-Stream] Error:', error.message);
            throw error;
        }
    }
}

export const minimaxService = new MinimaxService();
