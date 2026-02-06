import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimaxi.chat/v1/t2a_v2';
const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;

const voices = [
    { key: 'TEST_Kiki_Shaonv', id: 'female-shaonv' },
    { key: 'TEST_Titi_MaleQN2', id: 'male-qn-2' },
    { key: 'TEST_Aiai_Yujie', id: 'female-yujie' },
    { key: 'TEST_Bro_MaleQN1', id: 'male-qn-1' },
    { key: 'TEST_Invalid_Playful', id: 'English_PlayfulGirl' }
];

async function test() {
    console.log("Testing MiniMax IDs...");

    for (const v of voices) {
        try {
            console.log(`Generating for ${v.key} (${v.id})...`);
            const payload = {
                model: "speech-01-turbo",
                text: "Hello, this is a voice test to check for timbre differences.",
                stream: false,
                voice_setting: {
                    voice_id: v.id,
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

            const res = await axios.post(`${MINIMAX_API_URL}?GroupId=${MINIMAX_GROUP_ID}`, payload, {
                headers: {
                    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.data.data && res.data.data.audio) {
                const buf = Buffer.from(res.data.data.audio, 'hex');
                fs.writeFileSync(`${v.key}.mp3`, buf);
                console.log(` -> SUCCESS: ${buf.length} bytes`);
            } else {
                console.log(` -> FAILED: No audio data`);
            }

        } catch (e: any) {
            console.log(` -> ERROR: ${e.message}`);
            if (e.response) console.log(e.response.data);
        }
    }
}

test();
