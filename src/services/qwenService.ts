import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const QWEN_API_KEY = process.env.DASHSCOPE_API_KEY || 'sk-3ffda25bdbbe40ffb0f6deb0344c1d0d';
const QWEN_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export interface EvaluationResult {
    text: string;
}

// Helper to ensure image is accessible by API (convert local to base64)
const prepareImageForApi = async (imageUrl: string): Promise<string> => {
    // 1. If already Base64, return
    if (imageUrl.startsWith('data:')) return imageUrl;

    // 2. If it's a remote URL (not localhost), generally safe to pass, BUT standard OpenAI API supports URLs. 
    // DashScope supports URLs. If it's localhost, we must convert.
    if (imageUrl.startsWith('http')) {
        if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
            // It's localhost, try to fetch it and convert to base64
            try {
                const resp = await fetch(imageUrl);
                // Ensure response is ok
                if (!resp.ok) {
                    console.warn(`Local fetch failed: ${resp.status}`);
                    return imageUrl;
                }
                const buffer = await resp.arrayBuffer();
                const contentType = resp.headers.get('content-type') || 'image/png';
                const base64 = Buffer.from(buffer).toString('base64');
                return `data:${contentType};base64,${base64}`;
            } catch (e) {
                console.error("Failed to fetch localhost image:", e);
                return imageUrl; // Fallback
            }
        }
        return imageUrl;
    }

    // 3. If relative path (e.g. /generated/foo.png), resolve from file system
    if (imageUrl.startsWith('/')) {
        // Try to find in client/public
        const relativePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        const potentialPaths = [
            path.join(process.cwd(), 'client', 'public', relativePath),
            path.join(process.cwd(), 'public', relativePath)
        ];

        for (const p of potentialPaths) {
            if (fs.existsSync(p)) {
                console.log(`[Qwen] Found local image: ${p}`);
                const ext = path.extname(p).substring(1);
                const base64 = fs.readFileSync(p).toString('base64');
                return `data:image/${ext || 'png'};base64,${base64}`;
            }
        }
        console.warn(`[Qwen] Could not find local image: ${imageUrl}`);
    }

    return imageUrl;
};

export const evaluateArtwork = async (imageUrl: string, promptText: string = "Please evaluate this drawing from a child's perspective. Be encouraging, praise the creativity, and mention 1-2 specific details you like. Also provide 1 suggestion for improvement and 1 fun idea for a sequel or next scene. Keep it brief and fun."): Promise<EvaluationResult> => {
    if (!QWEN_API_KEY) {
        throw new Error("Missing QWEN_API_KEY");
    }

    // Determine model. qwen-vl-plus is best for images.
    const model = "qwen-vl-plus";

    // Prepare image (Base64 if local)
    const finalImageUrl = await prepareImageForApi(imageUrl);

    const payload = {
        model: model,
        messages: [
            {
                role: "system",
                content: "You are a friendly, enthusiastic art critic for a kids' art app. You love everything kids draw."
            },
            {
                role: "user",
                content: [
                    { type: "text", text: promptText },
                    {
                        type: "image_url",
                        image_url: {
                            url: finalImageUrl
                        }
                    }
                ]
            }
        ]
    };

    try {
        const response = await fetch(QWEN_BASE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${QWEN_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Qwen API Error:", errorText);
            throw new Error(`Qwen API Failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: any = await response.json();
        const content = data.choices?.[0]?.message?.content || "Wow, wonderful art! (AI couldn't reply properly)";
        return { text: content };

    } catch (error) {
        console.error("evaluateArtwork Exception:", error);
        throw error;
    }
};
