import 'dotenv/config';

const apiKey = process.env.Doubao_API_KEY;
const baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';

async function testDoubao() {
    console.log('Testing Doubao API...');
    console.log('API Key:', apiKey ? 'Present' : 'Missing');

    if (!apiKey) {
        console.error('No API Key found in .env');
        return;
    }

    try {
        console.log('Sending request to Doubao...');
        const response = await fetch(`${baseUrl}/images/generations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'doubao-seedream-4-0-250828',
                prompt: 'A cute cartoon cat',
                size: '2K',
                response_format: 'url'
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('API Error:', response.status, text);
        } else {
            const data = await response.json();
            console.log('Success!');
            console.log('Image URL:', data.data?.[0]?.url);
        }
    } catch (error) {
        console.error('Request Failed:', error);
    }
}

testDoubao();
