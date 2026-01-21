

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Environment variables are read at runtime inside the method for safety



// Voice Mappings
// Voice Mappings
const VOICE_MAP: Record<string, string> = {
    'kiki': 'English_PlayfulGirl',
    'aiai': 'English_Soft-spokenGirl',
    'titi': 'English_Deep-VoicedGentleman', // Verified Senior Male Voice
    'female-shaonv': 'female-shaonv',
    'male-qn-2': 'English_Deep-VoicedGentleman', // Fallback
    // Fallbacks or others can be added here
};

export class MinimaxService {

    /**
     * Generate speech using Minimax T2A V2
     */
    async generateSpeech(text: string, voiceKey: string, outputFilename: string = 'output.mp3'): Promise<Buffer> {
        // Late binding for environment variables to ensure they are loaded
        const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimaxi.chat/v1/t2a_v2';
        const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
        const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';

        try {
            const voiceId = VOICE_MAP[voiceKey] || 'English_PlayfulGirl'; // Default fallback
            console.log(`[Minimax] Generating speech for voice: ${voiceKey} -> ${voiceId}`);

            if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
                throw new Error("Missing Minimax API Key or Group ID in environment variables");
            }

            const payload = {
                model: "speech-01-turbo",
                text: text,
                stream: false,
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

            const response = await axios.post(`${MINIMAX_API_URL}?GroupId=${MINIMAX_GROUP_ID}`, payload, {
                headers: {
                    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200 && response.data) {
                const json = response.data;
                // console.log('[Minimax] Response keys:', Object.keys(json)); // Debug

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
                try {
                    const errorData = Buffer.isBuffer(error.response.data)
                        ? error.response.data.toString('utf8')
                        : JSON.stringify(error.response.data);
                    console.error('[Minimax] Response data:', errorData);
                } catch (e) {
                    console.error('[Minimax] Could not read response data');
                }
            }
            throw error;
        }
    }
}

export const minimaxService = new MinimaxService();
