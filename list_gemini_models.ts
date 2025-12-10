import 'dotenv/config';
import fetch from 'node-fetch';

async function listModels(version: 'v1' | 'v1beta') {
    const key = 'AIzaSyCvy_90ga9nVN0316J1cwXoRbPHp7vkhqY'; // Backup Key
    if (!key) {
        console.error("No GOOGLE_API_KEY found in .env");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/${version}/models?key=${key}`;
    console.log(`\n--- Checking ${version} Models ---`);
    console.log(`URL: ${url.replace(key, 'HIDDEN')}`);

    try {
        const resp = await fetch(url);
        const data = await resp.json();

        if (data.error) {
            console.error(`Error ${version}:`, data.error.message);
            return;
        }

        if (data.models) {
            console.log(`Found ${data.models.length} models:`);
            data.models.forEach((m: any) => {
                if (m.name.includes('gemini')) {
                    console.log(`- ${m.name} (${m.supportedGenerationMethods?.join(', ')})`);
                }
            });
        } else {
            console.log("No models field in response:", data);
        }

    } catch (e) {
        console.error(`Fetch failed for ${version}:`, e);
    }
}

async function main() {
    await listModels('v1');
    await listModels('v1beta');
}

main();
