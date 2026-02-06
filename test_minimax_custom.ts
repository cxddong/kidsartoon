
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;
const MINIMAX_API_URL = 'https://api.minimax.io/v1/t2a_v2'; // Correct URL

// User's Voice ID from logs
const TARGET_VOICE_ID = 'custom_lLcqrs6ZfnZLqaWzSt88nfcdkcv2_1770143466383';
const TEST_TEXT = "Hello! This is a test of the custom voice system. Do I sound like you?";

async function testGen() {
    console.log("Testing MiniMax Generation...");
    console.log("URL:", MINIMAX_API_URL);
    console.log("Group ID:", MINIMAX_GROUP_ID);
    console.log("Voice ID:", TARGET_VOICE_ID);

    if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
        console.error("Missing Env Vars!");
        return;
    }

    try {
        const payload = {
            model: "speech-01-turbo",
            text: TEST_TEXT,
            stream: false,
            voice_setting: {
                voice_id: TARGET_VOICE_ID,
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

        console.log("Sending payload...");
        const response = await axios.post(`${MINIMAX_API_URL}?GroupId=${MINIMAX_GROUP_ID}`, payload, {
            headers: {
                'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Response Status:", response.status);
        if (response.data && response.data.base_resp) {
            console.log("Base Resp:", JSON.stringify(response.data.base_resp));
            if (response.data.base_resp.status_code !== 0) {
                console.error("API ERROR:", response.data.base_resp.status_msg);
            } else {
                console.log("SUCCESS! Audio generated.");
            }
        } else {
            console.log("Unknown Response Structure:", JSON.stringify(response.data).substring(0, 200));
        }

    } catch (error: any) {
        console.error("AXIOS ERROR:", error.message);
        if (error.response) {
            console.error("DATA:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testGen();
