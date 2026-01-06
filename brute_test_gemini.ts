import 'dotenv/config';
import fetch from 'node-fetch';

async function testAll() {
    const key = process.env.GOOGLE_API_KEY;
    const versions = ['v1', 'v1beta'];

    for (const v of versions) {
        console.log(`\n--- Testing ${v} ---`);
        const listUrl = `https://generativelanguage.googleapis.com/${v}/models?key=${key}`;
        const lres = await fetch(listUrl);
        const ldata: any = await lres.json();
        const models = ldata.models || [];

        for (const m of models) {
            if (!m.supportedGenerationMethods.includes('generateContent')) continue;

            console.log(`Testing ${m.name}...`);
            const genUrl = `https://generativelanguage.googleapis.com/${v}/${m.name}:generateContent?key=${key}`;
            try {
                const res = await fetch(genUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Say hi." }] }]
                    })
                });
                const data: any = await res.json();
                if (data.error) {
                    console.log(`  ❌ ${data.error.code}: ${data.error.message.substring(0, 50)}`);
                } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    console.log(`  ✅ Success! URL: ${genUrl}`);
                    process.exit(0);
                } else {
                    console.log(`  ❓ Strange response: ${JSON.stringify(data).substring(0, 50)}`);
                }
            } catch (e) {
                console.log(`  ❌ Fetch error`);
            }
        }
    }
}
testAll();
