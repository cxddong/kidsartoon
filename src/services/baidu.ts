import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

export class BaiduService {
    private apiKey: string;
    private secretKey: string;
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor() {
        this.apiKey = process.env.BAIDU_TTS_API_KEY || '';
        this.secretKey = process.env.BAIDU_TTS_SECRET_KEY || '';

        if (!this.apiKey || !this.secretKey) {
            console.warn('Baidu TTS credentials missing (BAIDU_TTS_API_KEY, BAIDU_TTS_SECRET_KEY). Audio generation may fail.');
        }
    }

    private async getAccessToken(): Promise<string | null> {
        // Return cached token if valid
        if (this.accessToken && Date.now() < this.tokenExpiresAt) {
            return this.accessToken;
        }

        try {
            const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`;
            const response = await fetch(url);
            const data: any = await response.json();

            if (data.access_token) {
                this.accessToken = data.access_token;
                // Expires in seconds, usually 30 days. safe buffer: subtract 1 hour
                this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 3600000;
                return this.accessToken;
            } else {
                console.error('Failed to get Baidu Token:', data);
                return null;
            }
        } catch (error) {
            console.error('Baidu Token Error:', error);
            return null;
        }
    }

    async generateSpeech(text: string, lang: 'en' | 'zh' = 'en'): Promise<Buffer | null> {
        const token = await this.getAccessToken();
        if (!token) return null;

        // Params per user guide
        // per: 5 (Children Female), spd: 5, pit: 6, vol: 7, aue: 3 (mp3)
        const params = new URLSearchParams({
            tex: text,
            tok: token,
            cuid: uuidv4(), // Unique user ID
            ctp: '1',
            lan: lang,
            per: '5',
            spd: '5',
            pit: '6',
            vol: '7',
            aue: '3'
        });

        try {
            const response = await fetch('https://tsn.baidu.com/text2audio', {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.headers.get('content-type')?.includes('audio') || response.headers.get('content-type')?.includes('mpeg')) {
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            } else {
                const errorText = await response.text();
                console.error('Baidu TTS Failed:', errorText);
                return null;
            }
        } catch (error) {
            console.error('Baidu TTS Exception:', error);
            return null;
        }
    }
}

export const baiduService = new BaiduService();
