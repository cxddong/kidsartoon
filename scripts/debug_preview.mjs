

const BASE_URL = 'http://localhost:3001/api/voice-lab/preview';

async function runTest(name, payload) {
    console.log(`\n--- Test: ${name} ---`);
    try {
        const response = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.log(`❌ FAILED: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log("Response Body:", text);
        } else {
            console.log(`✅ SUCCESS: ${response.status}`);
            const buff = await response.arrayBuffer();
            console.log(`Received Audio: ${buff.byteLength} bytes`);
        }
    } catch (e) {
        console.error(`❌ NETWORK ERROR:`, e.message);
    }
}

async function main() {
    // Test 1: Fallback (my_voice, no custom)
    await runTest("Fallback Logic (my_voice -> Aiden)", {
        text: "Hello fallback",
        voiceId: "my_voice",
        userId: "test_user_" + Date.now()
    });

    // Test 2: Explicit Standard
    await runTest("Explicit Aiden", {
        text: "Hello standard",
        voiceId: "aiden",
        userId: "demo"
    });

    // Test 3: Invalid Custom pattern (should fallback to MiniMax and maybe fail there? Or Qwen?)
    // "v123" starts with 'v', so it goes to Qwen. Qwen should fail if ID invalid.
    await runTest("Invalid Qwen ID", {
        text: "Hello invalid",
        voiceId: "v_invalid_id_testing",
        userId: "demo"
    });
}

main();
