import 'dotenv/config';
import fetch from 'node-fetch';

async function listModels() {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!key) {
        console.error("No API key found in process.env");
        return;
    }

    console.log(`Using Key: ${key.substring(0, 5)}...${key.substring(key.length - 5)}`);

    const versions = ['v1', 'v1beta'];
    for (const v of versions) {
        const url = `https://generativelanguage.googleapis.com/${v}/models?key=${key}`;
        console.log(`\n--- ${v} ---`);
        try {
            const res = await fetch(url);
            const data: any = await res.json();
            if (data.error) {
                console.log(`Error: ${data.error.message}`);
            } else if (data.models) {
                console.log(`Found ${data.models.length} models:`);
                data.models.forEach((m: any) => console.log(`- ${m.name}`));
            } else {
                console.log("No models found.");
            }
        } catch (e) {
            console.error(`Fetch failed for ${v}:`, e);
        }
    }
}

listModels();
