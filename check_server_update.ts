import fetch from 'node-fetch';

async function run() {
    console.log("Checking if server has updated code...");
    try {
        // We can't easily check POST /clone without a file, but we can check GET /voices formatting or just headers
        // actually, let's just trigger a preview failure and see if it logs to the NEW log file
        const response = await fetch('http://localhost:3001/api/voice-lab/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: "Test Log",
                voiceId: "FORCE_ERROR_TEST_LOGGING",
                userId: "debug_user"
            })
        });

        console.log("Response Status:", response.status);

        // Now check if log file exists
        const fs = require('fs');
        if (fs.existsSync('d:/KAT/KAT/logs/voice_error.log')) {
            const stats = fs.statSync('d:/KAT/KAT/logs/voice_error.log');
            console.log("Log File Last Modified:", stats.mtime.toISOString());
            const content = fs.readFileSync('d:/KAT/KAT/logs/voice_error.log', 'utf8');
            console.log("Log Content Tail:", content.slice(-200));
        } else {
            console.log("Log file NOT found.");
        }

    } catch (e: any) {
        console.error("Server check failed error:", e.message, e.code);
    }
}

run();
