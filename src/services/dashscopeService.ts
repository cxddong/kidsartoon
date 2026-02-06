import { QWEN_OFFICIAL_VOICES } from './qwenVoiceConfig';
import fetch from 'node-fetch';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import * as nodeCrypto from 'crypto';
import NodeFormData from 'form-data';
import { ossService } from './ossService';

// Configure ffmpeg
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/api/v1';

interface TtsRequest {
    text: string;
    voice: string;
    format?: 'mp3' | 'wav';
    volume?: number;
    rate?: number;
    pitch?: number;
    model?: string;
}

export const dashscopeService = {
    /**
     * Call Qwen3 TTS via qwen3-tts-flash
     */
    async generateSpeech(params: TtsRequest): Promise<Buffer> {
        const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
        if (!apiKey) throw new Error("Missing DashScope API Key");

        const url = `${DASHSCOPE_BASE_URL}/services/aigc/multimodal-generation/generation`;

        // We've verified qwen3-tts-flash works for both official and custom enrolled voices.
        // UPDATE: For 'v' prefix voices (new CosyVoice enrollment), we MUST use the matching realtime model
        // otherwise it may return empty data or fail.
        // Update: Allow explicit model override
        let model = params.model || "qwen3-tts-flash";

        // Detect Custom Voice for logging and optional delay
        const isCustomVoice = params.voice?.includes("qwen-tts-vc") || params.voice?.startsWith("v") || (params.voice?.length ?? 0) > 20;

        // if (isCustomVoice && !params.model) {
        //     // Revert: cosyvoice-v3-plus synthesis is failing (URL error). qwen3-tts-flash works.
        //     // model = "cosyvoice-v3-plus";
        // }

        // Propagation buffer for newly enrolled voices
        if (isCustomVoice) {
            console.log(`[DashScope] Custom voice synthesis, adding 1s propagation buffer...`);
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log(`[DashScope] Synthesis | Model: ${model} | Voice: ${params.voice}`);

        const paramsObj: any = {
            voice: params.voice,
            format: params.format || "mp3"
        };

        // Qwen models support these, but CosyVoice V3 might fail with them or ignore them.
        // Safer to only include them for non-CosyVoice or if explicitly tested.
        // For now, exclude for cosyvoice-v3 to avoid 400/Empty Stream errors.
        if (!model.includes('cosyvoice')) {
            paramsObj.volume = params.volume === undefined ? 50 : (params.volume <= 1 ? Math.round(params.volume * 50) : params.volume);
            paramsObj.speech_rate = params.rate || 1.0;
            paramsObj.pitch = params.pitch || 1.0;
        }

        const payload = {
            model: model,
            input: { text: params.text },
            parameters: paramsObj
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'X-DashScope-SSE': 'enable'
            },
            body: JSON.stringify(payload)
        });

        // DEBUG: Log Headers
        console.log(`[DashScope] Response Status: ${response.status}`);
        console.log(`[DashScope] Content-Type: ${response.headers.get('content-type')}`);
        console.log(`[DashScope] X-DashScope-Request-Id: ${response.headers.get('x-dashscope-request-id')}`);

        if (!response.ok) {
            const err = await response.text();
            console.error("[DashScope] API Error:", response.status, err);
            throw new Error(`DashScope TTS Failed (${response.status}): ${err}`);
        }

        let audioChunks: Buffer[] = [];
        let falloutUrl: string | null = null;
        let totalReceived = 0;
        let sseTextBuffer = '';

        return new Promise((resolve, reject) => {
            if (!response.body) return reject(new Error("Response body is null"));

            response.body.on('data', (chunk: Buffer) => {
                const text = chunk.toString();
                // DEBUG: Log every chunk to prove we are receiving data
                try {
                    if (!fs.existsSync('d:/KAT/KAT/logs')) fs.mkdirSync('d:/KAT/KAT/logs');
                    fs.appendFileSync('d:/KAT/KAT/logs/raw_stream_debug.log', `[${new Date().toISOString()}] Chunk (${chunk.length}b): ${text}\n`);
                } catch (e) { }

                try {
                    // qwen3-tts-flash sends audio embedded in JSON SSE blocks
                    sseTextBuffer += chunk.toString('utf8');
                    const lines = sseTextBuffer.split('\n');
                    sseTextBuffer = lines.pop() || ''; // Keep partial line

                    for (const line of lines) {
                        const trimmed = line.trim();
                        // Relaxed check: Look for data: anywhere (though strict SSE puts it at start)
                        // This handles potential BOM or weird prefixes
                        const dataIndex = trimmed.indexOf('data:');

                        if (dataIndex >= 0) {
                            const jsonStr = trimmed.substring(dataIndex + 5).trim();
                            if (!jsonStr || jsonStr === '[DONE]') continue;

                            try {
                                const obj = JSON.parse(jsonStr);

                                // Check for failures reported in JSON
                                if (obj.code && obj.message) {
                                    console.warn(`[DashScope] Stream Warning: ${obj.code} ${obj.message}`);
                                    // Don't abort, later chunks might have audio
                                }

                                if (obj.output?.task_status === 'FAILED' || obj.output?.status === 'FAILED') {
                                    const msg = obj.output?.message || obj.error?.message || "Task failed";
                                    console.error(`[DashScope] Task Failed Signal: ${msg}`);
                                }

                                // Extract Base64 Audio
                                // V3 returns output.audio.data, while some other models return output.audio_bin

                                // DEBUG: Log the full output structure
                                try {
                                    fs.appendFileSync('d:/KAT/KAT/logs/json_structure.log', `[${new Date().toISOString()}] OUTPUT KEYS: ${Object.keys(obj.output || {}).join(', ')}\n`);
                                    if (obj.output?.audio) {
                                        fs.appendFileSync('d:/KAT/KAT/logs/json_structure.log', `[${new Date().toISOString()}] AUDIO KEYS: ${Object.keys(obj.output.audio).join(', ')}\n`);
                                    }
                                } catch (e) { }

                                let audioData = obj.output?.audio?.data || obj.output?.audio_bin;
                                if (audioData) {
                                    // Plan B Hardening: Ensure no "data:audio/..." prefix exists
                                    // User Request: const cleanBase64 = rawBase64.replace(/^data:audio\/\w+;base64,/, "");
                                    audioData = audioData.replace(/^data:audio\/\w+;base64,/, "").replace(/^data:application\/\w+;base64,/, "");
                                    if (audioData.startsWith('data:')) {
                                        audioData = audioData.split(',')[1];
                                    }
                                    const bin = Buffer.from(audioData, 'base64');
                                    audioChunks.push(bin);

                                    totalReceived += bin.length;
                                }

                                // Fallback to URL if binary not sent
                                if (obj.output?.audio_url || obj.output?.audio?.url) {
                                    falloutUrl = obj.output.audio_url || obj.output.audio?.url;
                                }
                            } catch (e: any) {
                                // If parsing fails, it might be that the line was split mid-JSON. 
                                // But with split('\n'), this shouldn't happen for valid SSE.
                                // Log strictly to file to avoid console noise if it's just a blip
                                try {
                                    if (!fs.existsSync('d:/KAT/KAT/logs')) fs.mkdirSync('d:/KAT/KAT/logs');
                                    fs.appendFileSync('d:/KAT/KAT/logs/parse_errors.log', `[${new Date().toISOString()}] Parse Error: ${e.message}. Line: ${trimmed.substring(0, 50)}...\n`);
                                } catch (err) { }
                            }
                        }
                    }
                } catch (err) {
                    console.error("[DashScope] SSE parse error:", err);
                }
            });

            response.body.on('end', async () => {
                // DEBUG: Mark end
                try {
                    const fs = require('fs');
                    fs.appendFileSync('d:/KAT/KAT/logs/sse_debug.log', '\n[STREAM END]\n');
                } catch (e) { }

                if (audioChunks.length > 0) {
                    console.log(`[DashScope] Synthesis complete. Collected ${totalReceived} bytes.`);
                    return resolve(Buffer.concat(audioChunks));
                }

                if (falloutUrl) {
                    console.log(`[DashScope] Downloading from fallback URL: ${falloutUrl}`);
                    try {
                        const audioRes = await fetch(falloutUrl);
                        if (audioRes.ok) return resolve(Buffer.from(await audioRes.arrayBuffer()));
                    } catch (e: any) {
                        return reject(new Error(`Download Error: ${e.message}`));
                    }
                }

                // DEBUG: Log Raw Stream content on failure
                if (audioChunks.length === 0 && !falloutUrl) {
                    console.error("[DashScope] STREAM FAILED. Dumping partial stream content...");
                    try {
                        const logPath = 'd:/KAT/KAT/logs/stream_dump.log';
                        if (!fs.existsSync('d:/KAT/KAT/logs')) fs.mkdirSync('d:/KAT/KAT/logs');
                        fs.appendFileSync(logPath, `\n\n[${new Date().toISOString()}] FAILURE DUMP (Model: ${model}):\n${sseTextBuffer}\n`);
                        // Also log entire buffer if we kept it? We didn't keep raw buffer. 
                    } catch (e) { }

                    reject(new Error("No audio data recovered from stream."));
                    return;
                }

                reject(new Error("No audio data recovered from stream."));
            });

            response.body.on('error', (err) => reject(err));
        });
    },

    async convertAudioToWav(inputPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const random = nodeCrypto.randomBytes(4).toString('hex');
            const outputPath = path.join(path.dirname(inputPath), `temp_enroll_${random}.wav`);
            ffmpeg(inputPath)
                .toFormat('wav')
                .audioFrequency(48000)
                .audioChannels(1)
                .on('end', () => resolve(outputPath))
                .on('error', (err) => reject(err))
                .save(outputPath);
        });
    },

    /**
     * Convert audio to MP3 (more compact for base64 transmission)
     */
    async convertAudioToMp3(inputPath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const random = nodeCrypto.randomBytes(4).toString('hex');
            const outputPath = path.join(path.dirname(inputPath), `temp_enroll_${random}.mp3`);
            ffmpeg(inputPath)
                .toFormat('mp3')
                .audioBitrate('64k') // 64k is plenty for voice enrollment
                .on('end', () => resolve(outputPath))
                .on('error', (err) => reject(err))
                .save(outputPath);
        });
    },

    /**
     * Internal helper to upload audio to DashScope File API
     */
    async uploadFileToDashScope(filePath: string): Promise<string> {
        const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
        if (!apiKey) throw new Error("Missing DashScope API Key");

        console.log(`[DashScope] Uploading enrollment file: ${path.basename(filePath)}`);
        // Use the Node-compatible FormData from 'form-data' package explicitly
        const form = new NodeFormData();
        form.append('file', fs.createReadStream(filePath));

        const url = 'https://dashscope.aliyuncs.com/api/v1/files?purpose=custom_voice';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                ...form.getHeaders()
            },
            body: form as any
        });

        const data = await response.json() as any;
        if (!response.ok) {
            throw new Error(`DashScope File Upload Failed (${response.status}): ${JSON.stringify(data)}`);
        }

        const fileId = data.data?.uploaded_files?.[0]?.file_id || data.id || data.file_id;
        if (!fileId) {
            throw new Error("File ID missing in upload response");
        }

        console.log(`[DashScope] File upload success. FileID: ${fileId}`);
        return fileId;
    },

    async registerCustomVoice(audioFilePath: string, userId: string, transcript?: string, language?: string): Promise<string> {
        const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
        if (!apiKey) throw new Error("Missing DashScope API Key");

        console.log(`[DashScope] Starting registration for user ${userId} with file ${path.basename(audioFilePath)}. Explicit Lang: ${language}`);

        // Transcode to WAV (48k mono) which is the most reliable for enrollment
        let finalFilePath = audioFilePath;
        let isTempFile = false;
        try {
            console.log(`[DashScope] Transcoding to enrollment-compatible format...`);
            finalFilePath = await this.convertAudioToWav(audioFilePath);
            isTempFile = true;
        } catch (e: any) {
            console.warn(`[DashScope] Transcoding failed, using original: ${e.message}`);
        }

        // Upload to Alibaba Cloud OSS to get a public HTTPS URL
        // DashScope enrollment API requires http/https URLs, not dashscope:// URLs
        console.log(`[DashScope] Uploading audio to OSS for public URL...`);
        const audioBuffer = fs.readFileSync(finalFilePath);
        const ossPath = `voice-enrollment/${path.basename(finalFilePath)}`;
        const publicUrl = await ossService.uploadFile(audioBuffer, ossPath);

        // OSS returns fully qualified URL, but check just in case
        let enrollmentUrl = publicUrl;
        console.log(`[DashScope] Public URL obtained: ${enrollmentUrl}`);

        const hash = nodeCrypto.createHash('md5').update(userId).digest('hex').substring(0, 6);
        const random = Math.random().toString(36).substring(2, 6);
        const preferredName = `v${hash}${random}`.toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 10); // Max 10 chars per API requirement

        // Detect language logic:
        // 1. Explicit param
        // 2. Transcript detection
        // 3. Default to 'zh' (legacy behavior)
        let lang = language;
        if (!lang) {
            const isEnglish = transcript && /[a-zA-Z]/.test(transcript);
            lang = isEnglish ? "en" : "zh";
        }

        // Ensure accurate default text if transcript is missing
        const isEn = lang === 'en';

        const url = `${DASHSCOPE_BASE_URL}/services/audio/tts/customization`;
        const maxRetries = 2;
        let attempt = 0;

        try {
            while (attempt < maxRetries) {
                attempt++;
                try {
                    console.log(`[DashScope] Enrollment attempt ${attempt}/${maxRetries} (Lang: ${lang})`);

                    const payload = {
                        model: "voice-enrollment",
                        input: {
                            action: "create_voice",
                            target_model: "cosyvoice-v3-plus",
                            prefix: preferredName,
                            url: enrollmentUrl,  // Public HTTPS URL required
                            language_hints: [lang]
                        }
                    };

                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload),
                        timeout: 60000
                    });

                    const data = await response.json() as any;

                    // DEBUG: Log full enrollment response
                    console.log(`[DashScope] Enrollment Response Status: ${response.status}`);
                    console.log(`[DashScope] Enrollment Response Body:`, JSON.stringify(data, null, 2));

                    if (!response.ok) {
                        // DEBUG: Log to file
                        try {
                            const logPath = 'd:/KAT/KAT/logs/enroll_error.log';
                            const logMsg = `[${new Date().toISOString()}] Enrollment Failed: Status=${response.status}, Body=${JSON.stringify(data)}\n`;
                            if (!fs.existsSync('d:/KAT/KAT/logs')) fs.mkdirSync('d:/KAT/KAT/logs');
                            fs.appendFileSync(logPath, logMsg);
                        } catch (e) { }

                        throw new Error(`Enrollment Failed (${response.status}): ${JSON.stringify(data)}`);
                    }

                    const vid = data.output?.voice_id || data.output?.voice;
                    if (!vid) throw new Error("Voice ID missing in response");

                    console.log(`[DashScope] ✅ Voice ID Returned: "${vid}"`);
                    console.log(`[DashScope] Voice ${vid} registered. Waiting 10s for propagation...`);
                    await new Promise(r => setTimeout(r, 10000));

                    return vid;
                } catch (error: any) {
                    const isRetryable = error.code === 'ECONNRESET' || error.type === 'request-timeout' || error.message?.includes('ECONNRESET');
                    if (isRetryable && attempt < maxRetries) {
                        const delay = attempt * 5000;
                        console.warn(`[DashScope] Retryable error (${error.code || error.message}), retrying in ${delay}ms...`);
                        await new Promise(r => setTimeout(r, delay));
                        continue;
                    }
                    throw error;
                }
            }
            throw new Error("Voice enrollment failed after all retries.");
        } finally {
            if (isTempFile && fs.existsSync(finalFilePath)) {
                try { fs.unlinkSync(finalFilePath); } catch (e) { }
            }
        }
    }
};
