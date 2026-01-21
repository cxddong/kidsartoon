
import axios from 'axios';
import 'dotenv/config';

async function fetchVoices() {
    const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID;
    const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;

    console.log("Fetching Minimax Voices...");

    try {
        const response = await axios.get(`https://api.minimaxi.chat/v1/t2a_v2/voices?GroupId=${MINIMAX_GROUP_ID}`, {
            headers: {
                'Authorization': `Bearer ${MINIMAX_API_KEY}`
            }
        });

        console.log("Response Status:", response.status);
        if (response.data && response.data.voices) {
            console.log("Available Voices:");
            response.data.voices.forEach((v: any) => {
                console.log(`- ID: ${v.voice_id}, Name: ${v.name}, Gender: ${v.gender}, Desc: ${v.desc}`);
            });
        } else {
            console.log("No voices found in response:", JSON.stringify(response.data, null, 2));
        }
    } catch (error: any) {
        console.error("Fetch Failed!");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error:", error.message);
        }
    }
}

fetchVoices();
