
import fs from 'fs';

async function run() {
    console.log("Reproducing parser logic...");

    let sseTextBuffer = '';
    const audioChunks: Buffer[] = [];

    // Simulations of chunks from the log
    const chunks = [
        // Chunk 1: Error packet
        'id:1\nevent:error\n:HTTP_STATUS/400\ndata:{"code":"InvalidParameter","message":"url error"}\n\n',
        // Chunk 2: Result packet start
        'id:1\nevent:result\n:HTTP_STATUS/200\ndata:{"output":{"audio":{"data":"SGVsbG8gV29ybGQ="', // "Hello World" in base64
        // Chunk 3: Result packet end
        '}}}\n\n'
    ];

    console.log(`Processing ${chunks.length} chunks...`);

    for (const chunkStr of chunks) {
        console.log(`\n--- Incoming Chunk (${chunkStr.length} chars) ---`);
        sseTextBuffer += chunkStr;

        const lines = sseTextBuffer.split('\n');
        sseTextBuffer = lines.pop() || '';

        console.log(`Lines to process: ${lines.length}. Buffer remnant: "${sseTextBuffer.replace(/\n/g, '\\n')}"`);

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
                const jsonStr = trimmed.substring(5).trim();
                console.log(`Found JSON Candidate: ${jsonStr.substring(0, 50)}...`);

                try {
                    const obj = JSON.parse(jsonStr);
                    console.log("JSON Parsed Success.");

                    if (obj.code) console.log("Is Error Packet:", obj.code);

                    const audioData = obj.output?.audio?.data || obj.output?.audio_bin;
                    if (audioData) {
                        console.log("SUCCESS: Found Audio Data!", audioData.length);
                        const bin = Buffer.from(audioData, 'base64');
                        audioChunks.push(bin);
                    } else {
                        console.log("No audio field found.");
                        if (obj.output) console.log("Output keys:", Object.keys(obj.output));
                    }

                } catch (e: any) {
                    console.error("JSON Parse Error:", e.message);
                }
            }
        }
    }

    console.log(`\nFinal Audio Chunks: ${audioChunks.length}`);
}

run();
