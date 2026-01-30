// @ts-ignore
import fetch from 'node-fetch';

export class SeedanceService {
    private apiKey: string;
    private baseUrl = 'https://api.seedance.com/v4/comic/generate';

    constructor() {
        this.apiKey = process.env.SEEDANCE_API_KEY || '';
        if (!this.apiKey) {
            console.warn('Seedance API Key is missing! Please set SEEDANCE_API_KEY environment variable.');
        }
    }

    /**
     * Generate a 4-panel comic based on story content using Seedance 4.0 API
     * @param storyContent Object containing text for panel1, panel2, panel3, panel4
     * @param style Comic style (default: "cartoon")
     * @param resolution Image resolution (default: "1080x1080")
     * @returns Array of 4 image URLs
     */
    async generateFourPanelComic(
        storyContent: { panel1: string; panel2: string; panel3: string; panel4: string },
        style: string = 'cartoon',
        resolution: string = '1080x1080'
    ): Promise<string[]> {
        console.log('[Seedance] Generating 4-panel comic...');

        const headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };

        const data = {
            comic_type: 'four_panel',
            content: storyContent,
            style: style,
            resolution: resolution,
            language: 'zh-CN'
        };

        try {
            // Using a timeout of 60 seconds as suggested
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const result: any = await response.json();
                // Assuming result structure matches the user provided example: { data: { comic_urls: [...] } }
                if (result.data && Array.isArray(result.data.comic_urls)) {
                    console.log('[Seedance] Successfully generated comic URLs.');
                    return result.data.comic_urls;
                } else {
                    console.error('[Seedance] Unexpected response format:', result);
                    throw new Error('Invalid response format from Seedance API');
                }
            } else {
                const errorText = await response.text();
                console.error(`[Seedance] API Error: ${response.status} - ${errorText}`);
                throw new Error(`Seedance API failed with status ${response.status}`);
            }
        } catch (error) {
            console.error('[Seedance] Request exception:', error);
            // Fallback to placeholders if API fails, to ensure the app doesn't crash
            // This allows testing the flow even without a valid key temporarily
            console.warn('[Seedance] Using fallback placeholder images due to error.');
            return [
                'https://placehold.co/1024x1024/png?text=Panel+1+Failed',
                'https://placehold.co/1024x1024/png?text=Panel+2+Failed',
                'https://placehold.co/1024x1024/png?text=Panel+3+Failed',
                'https://placehold.co/1024x1024/png?text=Panel+4+Failed'
            ];
        }
    }
}

export const seedanceService = new SeedanceService();
