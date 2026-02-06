import fetch from 'node-fetch';

async function testEnrollmentAndSynthesis() {
    const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
    if (!apiKey) throw new Error("Missing API key");

    console.log("Testing enrollment and synthesis flow...\n");

    // Step 1: Create a test enrollment
    const enrollPayload = {
        model: "qwen-voice-enrollment",
        input: {
            action: "create",
            target_model: "qwen3-tts-vc-realtime-2026-01-15",
            preferred_name: "testvoice123",
            audio: { data: "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEA..." }, // Tiny valid WAV
            text: "Hello test",
            language: "en"
        }
    };

    console.log("1. Testing Enrollment API...");
    const enrollRes = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(enrollPayload)
    });

    const enrollData = await enrollRes.json() as any;
    console.log("Enrollment Response Status:", enrollRes.status);
    console.log("Enrollment Response:", JSON.stringify(enrollData, null, 2));

    if (!enrollRes.ok) {
        console.error("Enrollment failed!");
        return;
    }

    const voiceId = enrollData.output?.voice || enrollData.output?.voice_id;
    console.log("\n2. Extracted Voice ID:", voiceId);

    if (!voiceId) {
        console.error("No voice ID in response!");
        return;
    }

    // Step 2: Wait for propagation
    console.log("\n3. Waiting 2s for propagation...");
    await new Promise(r => setTimeout(r, 2000));

    // Step 3: Test synthesis with the EXACT voice ID
    console.log("\n4. Testing Synthesis with voice ID:", voiceId);
    const synthPayload = {
        model: "cosyvoice-v3-plus",
        input: { text: "Test synthesis" },
        parameters: {
            voice: voiceId,
            format: "mp3"
        }
    };

    const synthRes = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/speech-synthesis', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify(synthPayload)
    });

    console.log("Synthesis Response Status:", synthRes.status);
    console.log("Synthesis Headers:", synthRes.headers.get('content-type'));

    let sseBuffer = '';
    for await (const chunk of synthRes.body as any) {
        const text = chunk.toString();
        sseBuffer += text;

        if (text.includes('error') || text.includes('InvalidParameter')) {
            console.log("\n5. ERROR FOUND IN STREAM:");
            console.log(text);
        }

        if (text.includes('audio')) {
            console.log("\n5. SUCCESS: Audio data found in stream!");
            break;
        }
    }

    console.log("\nDone.");
}

testEnrollmentAndSynthesis().catch(console.error);
