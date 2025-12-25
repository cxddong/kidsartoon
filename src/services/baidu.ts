import fetch from 'node-fetch';

const API_KEY = 'bce-v3/ALTAK-cENkdBaUXJezbTlUbJEzr/f662c1fc6ce8ddac7087b3ad8276667b8e39d630';
const BASE_URL = 'https://qianfan.baidubce.com/video/generations';

interface BaiduVideoTaskResponse {
    id: string;
    task_id: string;
    error_code?: string;
    error_msg?: string;
}

interface BaiduStatusResponse {
    id: string;
    task_id: string;
    created: string;
    model: string;
    status: 'Pending' | 'Processing' | 'Succeeded' | 'Failed'; // Verify case
    result?: {
        video: {
            url: string;
            cover_url?: string;
            width?: number;
            height?: number;
            duration?: number;
        }
    };
    error_code?: string;
    error_msg?: string;
}

export class BaiduService {
    private apiKey: string;

    constructor() {
        this.apiKey = API_KEY;
    }

    /**
     * Generate Video (MuseSteamer 2.0)
     */
    async generateVideo(imageUrl: string, prompt: string, options: { duration?: 5 | 10 } = {}): Promise<{ taskId: string }> {
        const duration = options.duration || 5;

        // Ensure prompt exists for audio model, or fallback
        const textPrompt = prompt || "Animate this scene naturally.";

        const payload = {
            model: "musesteamer-2.0-turbo-i2v-audio",
            content: [
                {
                    type: "text",
                    text: textPrompt
                },
                {
                    type: "image_url",
                    image_url: {
                        url: imageUrl
                    }
                }
            ],
            duration: duration
        };

        console.log('[Baidu] Start Task:', JSON.stringify(payload));

        const res = await fetch(BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('[Baidu] Error starting task:', errText);
            throw new Error(`Baidu API Error: ${res.statusText} - ${errText}`);
        }

        const data = await res.json() as BaiduVideoTaskResponse;

        if (data.error_code) {
            throw new Error(`Baidu Error: ${data.error_msg}`);
        }

        return { taskId: data.task_id };
    }

    /**
     * Check Task Status
     */
    async checkTaskStatus(taskId: string): Promise<{ status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING', videoUrl?: string, error?: string }> {
        // Check status via GET with query param ?task_id=...
        const url = `${BASE_URL}?task_id=${taskId}`;

        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!res.ok) {
                // If 404, maybe invalid ID. If 200 but error body, handle below.
                const txt = await res.text();
                // Baidu returns error json even on 200 sometimes? Or 400.
                console.error('[Baidu] Check Status Error:', txt);
                return { status: 'FAILED', error: txt };
            }

            const data = await res.json() as any;
            console.log('[Baidu] Status Response:', JSON.stringify(data));

            if (data.error_code) {
                return { status: 'FAILED', error: data.error_msg };
            }

            // Map Baidu Status
            const s = (data.status || data.task_status || '').toUpperCase();

            if (s === 'SUCCEEDED' || s === 'SUCCESS') {
                // Baidu MuseSteamer uses 'content' not 'result'
                const resObj = data.result || data.content || {};
                // Try multiple paths (video.url, video_url, url)
                const videoUrl = resObj.video?.url || resObj.video_url || resObj.url || '';

                if (!videoUrl) console.warn('[Baidu] Video URL missing in result:', resObj);

                return {
                    status: 'SUCCEEDED',
                    videoUrl
                };
            } else if (s === 'FAILED' || s === 'FAIL') {
                return { status: 'FAILED', error: data.error_msg || 'Unknown failure' };
            } else {
                return { status: 'PROCESSING' };
            }

        } catch (e: any) {
            console.error('[Baidu] Network Error:', e);
            return { status: 'PROCESSING' }; // Retry on net error
        }
    }
}

export const baiduService = new BaiduService();
