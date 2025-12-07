import 'dotenv/config';

async function testRoute() {
    const port = process.env.PORT || 3000;
    const url = `http://127.0.0.1:${port}/api/ai/doubao/image`;

    console.log(`Testing POST to ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ...' // Optional
            },
            body: JSON.stringify({
                prompt: 'Test prompt',
                size: '2K'
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Response:', text);

    } catch (error) {
        console.error('Fetch failed:', error);
    }
}

testRoute();
