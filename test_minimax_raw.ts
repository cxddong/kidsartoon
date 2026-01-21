
import axios from 'axios';
import 'dotenv/config';

async function testMinimaxRaw() {
    const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimaxi.chat/v1/t2a_v2';
    const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
    const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;

    console.log("Testing Minimax Raw...");
    console.log("URL:", MINIMAX_API_URL);
    console.log("Group ID:", MINIMAX_GROUP_ID);
    console.log("API Key exists:", !!MINIMAX_API_KEY);

    const payload = {
        model: "speech-01-turbo",
        text: "Hello, this is a raw test of the Minimax API.",
        stream: false,
        voice_setting: {
            voice_id: "English_Deep-VoicedGentleman",
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

    try {
        const response = await axios.post(`${MINIMAX_API_URL}?GroupId=${MINIMAX_GROUP_ID}`, payload, {
            headers: {
                'Authorization': `Bearer ${MINIMAX_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("Response Keys:", Object.keys(response.data));
        if (response.data.base_resp) {
            console.log("Base Resp:", JSON.stringify(response.data.base_resp, null, 2));
        } else {
            console.log("No base_resp found!");
        }
        // console.log("Response Data:", JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        console.error("Request Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

testMinimaxRaw();
