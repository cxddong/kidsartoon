
// import { DatabaseService } from './src/services/database';
import { default as fetch } from 'node-fetch'; // We might need this if global fetch isn't there in ts-node context, but let's try global first.
// Actually, let's use the exact logic from media.ts

// Since we are in standalone script, we need to init firebase first?
// DatabaseService inits it.

// Mock setup if needed, but DatabaseService uses './firebase' which does admin.initializeApp

async function testVideoUpload() {
    const videoUrl = "https://ark-content-generation-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-1-5-pro/02176879923042000000000000000000000ffffac1824ca2b76ec.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260119%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260119T050807Z&X-Tos-Expires=86400&X-Tos-Signature=a43498eac361a8c57815994257d44566264fcf0821ff4f80c9e001fda6b42123&X-Tos-SignedHeaders=host";

    console.log("1. Fetching video from Volcengine...");
    try {
        // Try global fetch first (Node 18)
        let res;
        if (global.fetch) {
            res = await fetch(videoUrl);
        } else {
            console.log("Global fetch not found, importing node-fetch...");
            const nf = (await import('node-fetch')).default;
            res = await nf(videoUrl);
        }

        console.log(`Response Status: ${res.status}`);
        console.log(`Content-Type: ${res.headers.get('content-type')}`);
        console.log(`Content-Length: ${res.headers.get('content-length')}`);

        if (!res.ok) {
            console.error("Failed to fetch video!");
            return;
        }

        const ab = await res.arrayBuffer();
        const buf = Buffer.from(ab);
        console.log(`Downloaded ${buf.length} bytes.`);

        console.log("2. Saving to file 'debug_video.mp4' to verify content...");
        const fs = await import('fs');
        fs.writeFileSync('debug_video.mp4', buf);
        console.log("Saved local file. Please check if this plays.");

        // We can't easily test Firebase Upload without Admin creds here (which load from .env)
        // Ensure .env is loaded
        await import('dotenv/config');

        console.log("3. (Optional) Attempting Firebase Upload...");
        // This relies on DatabaseService being able to init with .env creds
        // We might crash here if Service Account json is missing or env vars not set for Admin SDK
        // But let's verify step 1 & 2 first.

    } catch (e) {
        console.error("Error:", e);
    }
}

testVideoUpload();
