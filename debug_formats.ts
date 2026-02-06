import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import dotenv from 'dotenv';

dotenv.config();

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);

const API_KEY = process.env.DASHSCOPE_API_KEY;

async function debugFormats() {
    if (!API_KEY) return;

    const inputWav = path.resolve('uploads', 'voice_1770110613127.wav');
    const tempMp3 = path.resolve('temp_test.mp3');

    console.log("Converting to MP3...");
    await new Promise((resolve, reject) => {
        ffmpeg(inputWav).toFormat('mp3').on('end', resolve).on('error', reject).save(tempMp3);
    });

    const wavBase64 = fs.readFileSync(inputWav).toString('base64');
    const mp3Base64 = fs.readFileSync(tempMp3).toString('base64');

    const variations = [
        { name: "WAV (audio/wav)", uri: `data:audio/wav;base64,${wavBase64}` },
        { name: "MP3 (audio/mpeg)", uri: `data:audio/mpeg;base64,${mp3Base64}` },
        { name: "MP3 (audio/mp3)", uri: `data:audio/mp3;base64,${mp3Base64}` }
    ];

    const results = [];
    for (const v of variations) {
        console.log(`Trying format: ${v.name}`);
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "qwen-voice-enrollment",
                input: {
                    action: "create",
                    target_model: "qwen3-tts-vc-realtime-2026-01-15",
                    preferred_name: "vf" + Math.random().toString(36).substring(2, 6),
                    audio: { data: v.uri },
                    text: "你好，测试录音",
                    language: "zh"
                }
            })
        });

        const data = await response.json() as any;
        console.log(`Result:`, JSON.stringify(data));
        results.push({ name: v.name, status: response.status, data });
    }

    fs.writeFileSync('debug_formats_results.json', JSON.stringify(results, null, 2));
    if (fs.existsSync(tempMp3)) fs.unlinkSync(tempMp3);
}

debugFormats();
