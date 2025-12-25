import fetch from 'node-fetch';

const API_KEY = 'AIzaSyAp0VLb84S3yRK8J5Exh41_RX3eAxWb31A'; // Final Key

async function testGen() {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`;
    console.log(`Testing Gemini v1 (gemini-1.5-flash) with Key: ${API_KEY.substring(0, 10)}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': API_KEY
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Write a 10 word story." }] }]
            })
        });

        if (!response.ok) {
            console.error(`Status: ${response.status}`);
            console.error(await response.text());
            return;
        }

        const data: any = await response.json();
        console.log("Success!");
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testGen();
