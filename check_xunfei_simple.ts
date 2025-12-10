import WebSocket from 'ws';
import crypto from 'crypto';
import { URL } from 'url';

const APP_ID = 'ga85af02';
const API_SECRET = '50d4411a19f6082e3a2aeab99136de7b';
const API_KEY = 'fc83e65202c91a3962e91e4dd9371a25';
// ASR Endpoint
const HOST_URL = 'wss://iat-api.xfyun.cn/v2/iat';

function getAuthUrl() {
    const url = new URL(HOST_URL);
    const date = new Date().toUTCString();
    const host = url.host;
    const path = url.pathname;

    // Signature
    const builder = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const hmac = crypto.createHmac('sha256', API_SECRET);
    const signature = hmac.update(builder).digest('base64');

    const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');

    return `${HOST_URL}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
}

async function testASR() {
    console.log(`Testing Xunfei ASR Connection (${HOST_URL})...`);
    const url = getAuthUrl();

    const ws = new WebSocket(url);

    ws.on('open', () => {
        console.log("WebSocket Open! (Keys are valid for ASR)");
        // Send a dummy ASR frame just to see
        const frame = {
            common: { app_id: APP_ID },
            business: {
                language: "zh_cn",
                domain: "iat",
                accent: "mandarin",
                vad_eos: 3000,
                dwa: "wpgs"
            },
            data: {
                status: 0,
                format: "audio/L16;rate=16000",
                encoding: "raw",
                audio: Buffer.from("").toString('base64')
            }
        };
        ws.send(JSON.stringify(frame));
        setTimeout(() => ws.close(), 1000);
    });

    ws.on('message', (data) => {
        const resp = JSON.parse(data.toString());
        console.log("Response:", resp);
    });

    ws.on('error', (err) => {
        console.error("WebSocket Error:", err);
    });

    ws.on('close', (code, msg) => console.log("Closed", code, msg.toString()));
}

testASR();
