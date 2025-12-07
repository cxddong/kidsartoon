import 'dotenv/config';

const apiKey = process.env.Doubao_API_KEY;
const baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';

async function testVision() {
    console.log('Testing Doubao Vision API...');

    // Use a public image URL for testing
    const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg';

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'doubao-1.5-vision-pro-250328', // Updated model name
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: 'Describe this image.' },
                            { type: 'image_url', image_url: { url: imageUrl } }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const text = await response.text();
            console.error('Vision API Error:', response.status, text);
        } else {
            const data = await response.json();
            console.log('Success!');
            console.log('Description:', data.choices?.[0]?.message?.content);
        }
    } catch (error) {
        console.error('Request Failed:', error);
    }
}

testVision();
