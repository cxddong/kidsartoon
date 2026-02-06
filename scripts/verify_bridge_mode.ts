
import fetch from 'node-fetch';
import fs from 'fs';

const API_URL = 'http://localhost:3001/api/voice-lab/preview';

async function testBridgeMode() {
    console.log("🚀 Testing Base64 Bridge Mode...");

    const payload = {
        text: "This is a test of the Base64 Bridge Mode. We are verifying that the audio is uploaded to storage and a URL is returned.",
        voiceId: "aiden", // Using standard voice to test generic flow first
        userId: "test-bridge-user"
    };

    try {
        console.log(`Testing endpoint: ${API_URL}`);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log(`Response Status: ${response.status}`);
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);

        if (contentType?.includes('application/json')) {
            const data = await response.json();
            console.log("✅ Received JSON Response:", data);

            if (data.audioUrl) {
                console.log(`\n🎉 SUCCESS! Audio URL returned: ${data.audioUrl}`);
                console.log("Verifying accessibility of the URL...");

                // If it's a local URL (starts with /), prepend localhost
                let checkUrl = data.audioUrl;
                if (checkUrl.startsWith('/')) {
                    checkUrl = `http://localhost:3001${checkUrl}`;
                }

                // Re-add the fetch call
                const audioRes = await fetch(checkUrl); // Use GET to download body
                if (audioRes.ok) {
                    console.log("✅ Audio file is accessible (200 OK)");

                    const buffer = await audioRes.buffer();
                    console.log(`Downloaded ${buffer.length} bytes.`);
                    console.log("Header Bytes (Hex):", buffer.subarray(0, 20).toString('hex'));

                    // Simple MP3 check (ID3 or Sync Word 0xFFE/0xFFF)
                    const hex = buffer.subarray(0, 4).toString('hex');
                    if (hex.startsWith('ff') || hex.startsWith('494433')) {
                        console.log("✅ Header looks like MP3 (Sync Word or ID3)");
                    } else {
                        console.warn("⚠️ Header does NOT look like standard MP3!");
                        console.warn("⚠️ Suspicious content detected. Attempting to decode as text...");

                        let text = "";
                        const hex = buffer.subarray(0, 4).toString('hex');
                        if (hex.startsWith('feff')) {
                            console.log("-> Detected UTF-16LE BOM");
                            text = buffer.toString('utf16le');
                        } else {
                            console.log("-> Assuming UTF-8");
                            text = buffer.toString('utf8');
                        }
                        console.log("📄 FILE CONTENT START:\n" + text.substring(0, 500) + "\n📄 END CONTENT SAMPLE");
                    }
                } else {
                    console.error("❌ Audio file NOT accessible:", audioRes.status);
                }

            } else {
                console.error("❌ JSON received but 'audioUrl' is missing!");
            }
        } else {
            console.error("❌ Expected JSON response, got:", contentType);
            // If we got binary, maybe print length
            const buff = await response.buffer();
            console.log(`Received binary data length: ${buff.length}`);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

testBridgeMode();
