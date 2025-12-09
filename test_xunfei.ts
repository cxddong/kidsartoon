import WebSocket from 'ws';
import crypto from 'crypto';
import { URL } from 'url';

// Credentials
const APPID = "8fe5ee9f";
const API_SECRET = "MThlNjRlMmE2NDhjNTIwOWI2MmRjNzMx";
const API_KEY = "3cf8fcaf5315350a6d30b06ae332744a";

const HOST_URL = 'wss://cbm01.cn-huabei-1.xf-yun.com/v1/private/mcd9m97e6';

function getAuthUrl() {
    const url = new URL(HOST_URL);
    const date = new Date().toUTCString();
    const host = url.host;
    const path = url.pathname;

    const builder = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;
    const hmac = crypto.createHmac('sha256', API_SECRET);
    const signature = hmac.update(builder).digest('base64');

    const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');

    return `${HOST_URL}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
}

const authUrl = getAuthUrl();
console.log('Connecting to:', authUrl);

const ws = new WebSocket(authUrl);

ws.on('open', () => {
    console.log('WebSocket Open');
    const frame = {
        header: {
            app_id: APPID,
            status: 2
        },
        parameter: {
            tts: {
                vcn: "x6_dongmanshaonv_pro",
                speed: 50,
                volume: 50,
                pitch: 50,
                bgs: 0,
                reg: 0,
                rdn: 0,
                rhy: 0,
                audio: {
                    encoding: "lame",
                    sample_rate: 16000,
                    channels: 1,
                    bit_depth: 16,
                    frame_size: 0
                }
            }
        },
        payload: {
            text: {
                encoding: "utf8",
                compress: "raw",
                format: "plain",
                status: 2,
                seq: 0,
                text: Buffer.from("你好，这是一次私有云端点测试。").toString('base64')
            }
        }
    };
    console.log('Sending Frame:', JSON.stringify(frame));
    ws.send(JSON.stringify(frame));
});

ws.on('message', (data) => {
    const response = JSON.parse(data.toString());
    console.log('Received Message Code:', response.code);
    console.log('Received Message Msg:', response.message);

    if (response.code !== 0) {
        console.error('Error Details:', JSON.stringify(response));
        ws.close();
    } else {
        if (response.data) {
            console.log('Received Audio Chunk size:', response.data.audio ? response.data.audio.length : 0);
            if (response.data.status === 2) {
                console.log('Generation Complete');
                ws.close();
            }
        }
    }
});

ws.on('error', (err) => {
    console.error('WebSocket Error:', err);
});

ws.on('close', (code, reason) => {
    console.log('WebSocket Closed:', code, reason.toString());
});
