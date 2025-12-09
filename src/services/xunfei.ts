import WebSocket from 'ws';
import crypto from 'crypto';
import { URL } from 'url';

export class XunfeiService {
    private appId: string;
    private apiSecret: string;
    private apiKey: string;
    private hostUrl = 'wss://cbm01.cn-huabei-1.xf-yun.com/v1/private/mcd9m97e6';

    constructor() {
        this.appId = process.env.XUNFEI_APP_ID || '';
        this.apiSecret = process.env.XUNFEI_API_SECRET || '';
        this.apiKey = process.env.XUNFEI_API_KEY || '';

        if (!this.appId || !this.apiSecret || !this.apiKey) {
            console.warn('Xunfei API credentials missing!');
        }
    }

    private getAuthUrl(): string {
        const url = new URL(this.hostUrl);
        const date = new Date().toUTCString();
        const host = url.host;
        const path = url.pathname;

        // Signature must match the request line path
        const builder = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

        const hmac = crypto.createHmac('sha256', this.apiSecret);
        const signature = hmac.update(builder).digest('base64');

        const authorizationOrigin = `api_key="${this.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
        const authorization = Buffer.from(authorizationOrigin).toString('base64');

        return `${this.hostUrl}?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
    }

    async generateSpeech(text: string, vcn: string = 'xiaoyan'): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const authUrl = this.getAuthUrl();
            const ws = new WebSocket(authUrl);
            const audioChunks: Buffer[] = [];

            ws.on('open', () => {
                console.log('[Xunfei] WebSocket Connected (Private Endpoint)');
                const frame = {
                    header: {
                        app_id: this.appId,
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
                                sample_rate: 16000, // Usually 16k or 24k for mp3
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
                            text: Buffer.from(text).toString('base64')
                        }
                    }
                };
                console.log('[Xunfei] Sending frame:', JSON.stringify(frame));
                ws.send(JSON.stringify(frame));
            });

            ws.on('message', (data, isBinary) => {
                const response = JSON.parse(data.toString());
                // console.log('[Xunfei] Received message:', JSON.stringify(response).substring(0, 100));

                if (response.code !== 0) {
                    console.error('Xunfei WS Error Code:', response.code);
                    console.error('Xunfei WS Error Message:', response.message);
                    ws.close();
                    reject(new Error(`Xunfei API Error: ${response.code} - ${response.message}`));
                    return;
                }

                if (response.data) {
                    const audio = Buffer.from(response.data.audio, 'base64');
                    // console.log(`[Xunfei] Received audio chunk: ${audio.length} bytes`);
                    audioChunks.push(audio);

                    if (response.data.status === 2) {
                        // Completed
                        ws.close();
                        resolve(Buffer.concat(audioChunks));
                    }
                }
            });

            ws.on('close', (code, reason) => {
                // console.log('Xunfei WS Closed:', code, reason.toString());
            });

            ws.on('error', (error) => {
                console.error('Xunfei WS Connection Error:', error);
                reject(error);
            });
        });
    }
}

export const xunfeiService = new XunfeiService();
