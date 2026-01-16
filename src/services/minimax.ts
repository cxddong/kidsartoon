

import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Use environment variables for security
const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimaxi.chat/v1/t2a_v2';
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';



// Voice Mappings
// Voice Mappings
const VOICE_MAP: Record<string, string> = {
    'kiki': 'English_PlayfulGirl',
    'aiai': 'English_Soft-spokenGirl',
    'titi': 'English_CaptivatingStoryteller',
    'female-shaonv': 'female-shaonv', // Explicit mapping for new request
    'male-qn': 'male-qn',
    // Fallbacks or others can be added here
};

export class MinimaxService {

    /**
     * Generate speech using Minimax T2A V2
     */
    async generateSpeech(text: string, voiceKey: string, outputFilename: string = 'output.mp3'): Promise<Buffer> {
        try {
            const voiceId = VOICE_MAP[voiceKey] || 'English_PlayfulGirl'; // Default fallback
            console.log(`[Minimax] Generating speech for voice: ${voiceKey} -> ${voiceId}`);

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
                },
                responseType: 'arraybuffer' // Critical for binary data
            });

            if (response.status === 200 && response.data) {
                // Minimax V2 usually returns JSON with hex data if stream=false? 
                // Wait, checking documentation... T2A V2 usually returns 'data' field in JSON if no stream.
                // Let's inspect content-type.

                // Inspecting standard Minimax response structure for non-stream:
                // { "base_resp": {...}, "data": { "audio": "hex_string...", "status": 2, "extra_info": ... } }

                // We need to parse the response as JSON first, since axios 'arraybuffer' gives us the raw body bytes.
                const responseString = Buffer.from(response.data).toString('utf-8');
                console.log('[Minimax] Raw Response:', responseString.substring(0, 500)); // Debug log

                try {
                    const json = JSON.parse(responseString);
                    if (json.base_resp && json.base_resp.status_code === 0 && json.data && json.data.audio) {
                        // Convert Hex string to Buffer
                        const audioHex = json.data.audio;
                        return Buffer.from(audioHex, 'hex');
                    } else {
                        throw new Error(`Minimax API Error: ${JSON.stringify(json.base_resp)}`);
                    }
                } catch (parseErr) {
                    // If not JSON, maybe it's direct binary? Unlikely for V2 but possible.
                    // Assuming standard V2 JSON + Hex behavior.
                    console.error('[Minimax] Failed to parse response:', parseErr);
                    throw new Error('Minimax response parsing failed');
                }
            } else {
                throw new Error(`Minimax HTTP Error: ${response.status}`);
            }

        } catch (error: any) {
            console.error('[Minimax] Generation failed:', error.message);
            if (error.response) {
                console.error('[Minimax] Response data:', error.response.data.toString());
            }
            throw error;
        }
    }
}

export const minimaxService = new MinimaxService();
