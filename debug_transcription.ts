import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debugTranscription() {
    if (!API_KEY) return;

    const testFile = path.resolve('uploads', 'voice_1770086883582.wav');
    const audioBuffer = fs.readFileSync(testFile);
    const base64 = audioBuffer.toString('base64');
    const dataUri = `data:audio/wav;base64,${base64}`;

    console.log("Transcribing audio to see what's actually in it...");
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "qwen-audio-turbo",
            input: {
                messages: [
                    {
                        role: "user",
                        content: [
                            { audio: dataUri },
                            { text: "请帮我转写这段音频的文字内容。" }
                        ]
                    }
                ]
            }
        })
    });

    const data = await response.json() as any;
    console.log("Transcription result:", JSON.stringify(data, null, 2));
    fs.writeFileSync('debug_transcription_results.json', JSON.stringify(data, null, 2));
}

debugTranscription();
