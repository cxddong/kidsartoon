
import fetch from 'node-fetch';
import fs from 'fs';

async function testPreview() {
    const voiceId = "cosyvoice-v3-plus-vc803abpbn-4a9bca30835242168b5b2467bd18eff1"; // From E2E Log
    const url = "http://localhost:3001/api/voice-lab/preview";

    console.log(`[Debug] Requesting preview for voice: ${voiceId}`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: "Hello! This is a debug test for audio playback.",
                voiceId: voiceId,
                userId: "demo"
            })
        });

        console.log(`[Debug] Response Status: ${res.status}`);
        console.log(`[Debug] Content-Type: ${res.headers.get('content-type')}`);
        console.log(`[Debug] Content-Length: ${res.headers.get('content-length')}`);

        if (!res.ok) {
            const text = await res.text();
            console.error(`[Error] Response Body: ${text}`);
            return;
        }

        const buffer = await res.buffer();
        console.log(`[Debug] Received Buffer Size: ${buffer.length} bytes`);

        // Check first few bytes for ID3 or sync word (MP3) or RIFF (WAV)
        const header = buffer.slice(0, 10).toString('hex');
        console.log(`[Debug] File Header (Hex): ${header}`);
        console.log(`[Debug] File Header (Text): ${buffer.slice(0, 10).toString('utf8')}`); // Might be garbage if binary

        // Save for inspection
        fs.writeFileSync('debug_preview_output.mp3', buffer);
        console.log(`[Debug] Saved to debug_preview_output.mp3`);

    } catch (e: any) {
        console.error("Fetch failed:", e);
    }
}

testPreview();
