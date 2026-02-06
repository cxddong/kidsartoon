
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const DEMO_OUTPUT_DIR = path.resolve(__dirname, '../../client/public/assets/audio_demos');

// Ensure output directory exists
if (!fs.existsSync(DEMO_OUTPUT_DIR)) {
    fs.mkdirSync(DEMO_OUTPUT_DIR, { recursive: true });
}

// Voice Mappings (Inlined)
const VOICE_MAP: Record<string, string> = {
    'kiki': 'English_PlayfulGirl',       // Kiki: Playful & Energetic
    'aiai': 'English_Soft-spokenGirl',   // Aiai: Sweet & Caring
    'titi': 'English_CaptivatingStoryteller', // Titi: Gentle & Calm (Male)
};

const VOICES_TO_GENERATE = [
    {
        id: 'kiki',
        text: 'Meow! I am Kiki, your art class friend!',
        filename: 'kiki_preview.mp3'
    },
    {
        id: 'aiai',
        text: 'Hi cutie! I am Aiai, ready to help!',
        filename: 'aiai_preview.mp3'
    },
    {
        id: 'titi',
        text: 'Hello, I am Titi. Let us tell a story.',
        filename: 'titi_preview.mp3'
    }
];

class MinimaxService {
    async generateSpeech(text: string, voiceKey: string): Promise<Buffer> {
        const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimaxi.chat/v1/t2a_v2';
        const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
        const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';

        try {
            const voiceId = VOICE_MAP[voiceKey] || 'English_PlayfulGirl';
            console.log(`[Minimax] Generating speech for voice: ${voiceKey} -> ${voiceId}`);

            if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
                throw new Error("Missing Minimax API Key or Group ID en environment variables");
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
                },
                responseType: 'arraybuffer' // Important for binary data
            });

            if (response.status === 200 && response.data) {
                // Check if it's JSON (error) or Buffer (success - sometimes MiniMax returns JSON in arraybuffer)
                try {
                    const jsonStr = response.data.toString('utf8');
                    const json = JSON.parse(jsonStr);
                    if (json.base_resp && json.base_resp.status_code !== 0) {
                        throw new Error(`MiniMax API Error: ${json.base_resp.status_msg}`);
                    }
                    // If it has data.audio object (Legacy V1/V2 wrapping)
                    if (json.data && json.data.audio) {
                        return Buffer.from(json.data.audio, 'hex');
                    }
                } catch (e) {
                    // Not JSON, assume it is audio binary if content-type matches or just return it
                }

                // If the response is directly binary (or we handled the JSON case above)
                // Note: minimax T2A v2 usually returns JSON with hex audio.
                // Let's re-verify the V2 response format.
                // The service code I saw earlier handled JSON. let's assume that logic.

                // Re-implementing exact logic from service file:
                const responseJson = JSON.parse(response.data.toString());
                if (responseJson.base_resp && responseJson.base_resp.status_code === 0 && responseJson.data && responseJson.data.audio) {
                    return Buffer.from(responseJson.data.audio, 'hex');
                } else {
                    throw new Error(`MiniMax Response: ${JSON.stringify(responseJson)}`);
                }
            }
            throw new Error(`Minimax HTTP Error: ${response.status}`);

        } catch (error: any) {
            console.error('[Minimax] Generation failed:', error.message);
            throw error;
        }
    }
}

const minimaxService = new MinimaxService();

async function generateDemos() {
    console.log('🚀 Starting Voice Demo Generation (Standalone)...');

    for (const voice of VOICES_TO_GENERATE) {
        try {
            console.log(`\n🎙️ Generating demo for ${voice.id}...`);
            const audioBuffer = await minimaxService.generateSpeech(voice.text, voice.id);

            const outputPath = path.join(DEMO_OUTPUT_DIR, voice.filename);
            fs.writeFileSync(outputPath, audioBuffer);

            console.log(`✅ Saved to: ${voice.filename}`);
        } catch (error: any) {
            console.error(`❌ Failed to generate ${voice.id}:`, error.message);
        }
    }

    console.log('\n✨ All done!');
}

generateDemos();
