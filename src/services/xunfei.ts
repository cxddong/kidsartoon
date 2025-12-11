import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Xunfei Configuration (From User)
const XUNFEI_CONFIG = {
    appId: 'ga85af02',
    apiKey: 'fc83e65202c91a3962e91e4dd9371a25',
    apiSecret: '50d4411a19f6082e3a2aeab99136de7b',
    // Using 'x_xiaoyang_story' for better storytelling (machine sound fix)
    voiceName: 'x_xiaoyang_story',
    // requesting mp3 for direct playback in browser
    aue: 'lame',
    sfl: 1,
    hostUrl: 'wss://tts-api-sg.xf-yun.com/v2/tts'
};

/**
 * Generate Auth URL with HMAC-SHA256 Signature
 */
function generateAuthUrl(): string {
    const { apiKey, apiSecret, hostUrl } = XUNFEI_CONFIG;
    const urlObj = new URL(hostUrl);
    const host = urlObj.host;
    const date = new Date().toUTCString();

    // Signature Origin format: "host: $host\ndate: $date\n$request-line"
    const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${urlObj.pathname} HTTP/1.1`;

    // HMAC-SHA256
    const signatureSha = crypto.createHmac('sha256', apiSecret)
        .update(signatureOrigin)
        .digest('base64');

    // Authorization Header
    const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');

    // Construct Final URL
    const params = new URLSearchParams({
        authorization,
        date,
        host
    });

    return `${hostUrl}?${params.toString()}`;
}

/**
 * Perform TTS via Xunfei WebSocket
 * @param text Text to synthesize
 * @param outputPath Optional output path (must end in .mp3 for mp3 format)
 */
// Update signature to accept lang
export async function xunfeiTTS(text: string, outputPath: string = path.join(__dirname, '../audio', `${uuidv4()}.mp3`), lang: string = 'en'): Promise<string> {
    return new Promise((resolve, reject) => {
        const authUrl = generateAuthUrl();
        const ws = new WebSocket(authUrl);
        const audioData: Buffer[] = [];

        // Select voice based on lang
        const voiceName = lang === 'en' ? 'x_Catherine' : 'x_xiaoyang_story';

        // Ensure directory exists
        const audioDir = path.dirname(outputPath);
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }

        ws.on('open', () => {
            console.log(`[XunfeiTTS] Connected to ${XUNFEI_CONFIG.hostUrl} (Voice: ${voiceName})`);

            // Build Request Frame
            const frame = {
                common: {
                    app_id: XUNFEI_CONFIG.appId
                },
                business: {
                    aue: XUNFEI_CONFIG.aue,
                    sfl: XUNFEI_CONFIG.sfl, // 1 for streaming mp3
                    vcn: voiceName, // Dynamic voice selection
                    speed: 40, // Slower speed for storytelling

                    volume: 50,
                    pitch: 45, // Slightly lower pitch for warmth
                    tte: 'UTF8' // Text encoding
                },
                data: {
                    status: 2, // Fixed for text transmission
                    text: Buffer.from(text).toString('base64')
                }
            };

            ws.send(JSON.stringify(frame));
        });

        ws.on('message', (data: WebSocket.Data) => {
            try {
                // The doc says server returns TextMessage (JSON string)
                const response = JSON.parse(data.toString());

                if (response.code !== 0) {
                    console.error(`[XunfeiTTS] Server Error: code=${response.code}, message=${response.message}`);
                    ws.close();
                    reject(new Error(`Xunfei TTS Error: ${response.message}`));
                    return;
                }

                if (response.data) {
                    // response.data.audio is base64 string
                    if (response.data.audio) {
                        const buffer = Buffer.from(response.data.audio, 'base64');
                        audioData.push(buffer);
                    }

                    // status 2 means end of synthesis
                    if (response.data.status === 2) {
                        console.log('[XunfeiTTS] Synthesis Complete');
                        ws.close(); // Close initiates the 'close' event
                    }
                }
            } catch (err) {
                console.error('[XunfeiTTS] Message Parsing Failed:', err);
                ws.close();
                reject(err);
            }
        });

        ws.on('close', () => {
            console.log('[XunfeiTTS] Connection Closed');
            if (audioData.length > 0) {
                const finalBuffer = Buffer.concat(audioData);
                fs.writeFileSync(outputPath, finalBuffer);
                resolve(outputPath);
            } else {
                // Determine if it was an error close or just empty (likely rejected already if error)
                // If we have no data but promise pending, assume failure if not handled
                // But we can check if file exists or just reject if empty
                if (audioData.length === 0) {
                    // Sometimes close happens before message if auth fails
                    // Usually rejected in message handler or open
                }
            }
        });

        ws.on('error', (err) => {
            console.error('[XunfeiTTS] WebSocket Error:', err);
            reject(err);
        });

        // Safety timeout
        setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
                console.warn('[XunfeiTTS] Timeout - Closing Connection');
                ws.close();
                if (audioData.length > 0) {
                    const finalBuffer = Buffer.concat(audioData);
                    fs.writeFileSync(outputPath, finalBuffer);
                    resolve(outputPath);
                } else {
                    reject(new Error("Timeout without audio data"));
                }
            }
        }, 15000); // 15s timeout
    });
}