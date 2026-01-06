import { GoogleGenerativeAI, Part } from '@google/generative-ai';

// Use environment variable or fallback to the known working key for TTS
const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || 'AIzaSyCvy_90ga9nVN0316J1cwXoRbPHp7vkhqY';
const TTS_URL = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${API_KEY}`;

export class GeminiService {
    private genAI: GoogleGenerativeAI;

    constructor() {
        this.genAI = new GoogleGenerativeAI(API_KEY);
        console.log("GeminiService: Initialized with GoogleGenerativeAI SDK");
    }

    /**
     * Generate Speech using Google Cloud TTS
     */
    async generateSpeech(text: string, lang: string = 'en-US'): Promise<Buffer> {
        // Voice Selection
        // Sparkle should sound friendly. 'en-US-Standard-B' (Male) or 'en-US-Standard-C' (Female)?
        // 'en-US-Journey-F' is generic/friendly. 'en-US-Wavenet-D' is standard male.
        // Let's use 'en-US-Journey-F' or 'en-US-Studio-O' if available, else Wavenet-F (Female).
        const voiceName = 'en-US-Journey-F'; // Friendly female-ish 

        console.log(`[Gemini] Generating Speech: "${text.substring(0, 30)}..." (${lang})`);

        try {
            const response = await fetch(TTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: { languageCode: lang, name: voiceName }, // Simple config, fallback logic handled by API usually
                    audioConfig: { audioEncoding: 'MP3', speakingRate: 1.1, pitch: 1.0 }
                })
            });

            if (!response.ok) {
                const err = await response.text();
                // 400 means invalid voice? Fallback to standard.
                if (response.status === 400) {
                    console.warn("[Gemini] Voice not found, retrying with standard voice.");
                    return this.generateSpeechFallback(text, lang);
                }
                throw new Error(`TTS API Error: ${response.status} ${err}`);
            }

            const data: any = await response.json();
            if (!data.audioContent) throw new Error("No audio content received");

            return Buffer.from(data.audioContent, 'base64');
        } catch (e: any) {
            console.error("[Gemini] TTS Failed:", e.message);
            // Return empty buffer to prevent crash, but log error
            throw e;
        }
    }

    async generateSpeechFallback(text: string, lang: string): Promise<Buffer> {
        const response = await fetch(TTS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text },
                voice: { languageCode: lang, name: 'en-US-Standard-A' },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });
        const data: any = await response.json();
        return Buffer.from(data.audioContent, 'base64');
    }

    /**
     * Chat with Sparkle (Gemini)
     */
    async chatWithSparkle(history: any[], imageContext?: any): Promise<any> {
        console.log("[Gemini] SDK Chat Request.");

        const model = this.genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `You are Sparkle, a magical, friendly, and enthusiastic AI companion for children in a creative art app called "Magic Lab".
Your goal is to encourage creativity, praise their artwork, and help them turn their drawings into stories or animations.
Keep your responses short (under 2-3 sentences), simple, and energetic. Use emojis! ✨🎨
If the user uploads a drawing (imageContext provided), ask them specifically about what is in the drawing.
Current Context: ${JSON.stringify(imageContext || {})}
`
        });

        const contents = history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.parts?.[0]?.text || h.message || "" }]
        }));

        try {
            const chatSession = model.startChat({
                history: contents,
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.7
                }
            });

            const lastMessage = contents.pop();
            const result = await chatSession.sendMessage(lastMessage?.parts[0].text || "");
            const response = await result.response;
            const replyText = response.text();

            return {
                sparkleTalk: replyText,
                tags: {},
                text: replyText
            };
        } catch (e: any) {
            console.error("[Gemini] Chat Failed:", e.message);
            return { sparkleTalk: "Oops! My magic wand hiccuped. Can you say that again? ✨", text: "Error" };
        }
    }


    // --- Stubs for other methods to prevent crashes, but ideally should implement ---

    async generateStoryJSON(base64Image: string, userId: string): Promise<any> {
        console.warn("[Gemini] generateStoryJSON not fully implemented in REST mode yet.");
        return {
            title: "The Magic Drawing",
            story: "Once upon a time, a magical drawing came to life! (Service Restoration in progress)",
            characters: ["Sparkle"],
            question: "What happens next?"
        };
    }

    async extractVisualAnchors(base64Image: string) {
        return { character_description: "A cute magical character", art_style: "cartoon" };
    }

    async generateCreativeContent(type: 'Picturebook_4_Page' | 'Picturebook_N_Page', input: { theme: string, character_description: string, page_count: number }): Promise<any> {
        console.log("[Gemini] Generating Creative Content:", type, input);

        const pageCount = input.page_count || 4;

        // ENHANCED prompt for ENGAGING, DYNAMIC picture books
        const prompt = `You are an award-winning children's picture book author and illustrator. Create a ${pageCount}-page picture book story that is EXCITING, ENGAGING, and VISUALLY DYNAMIC.

Theme: ${input.theme}
Main Character: ${input.character_description}

CRITICAL REQUIREMENTS FOR ENGAGING STORIES:

1. NARRATIVE TEXT (text_overlay):
   - Write 3-5 sentences per page (NOT 1-2!)
   - Use vivid, descriptive language that creates mental images
   - Include character emotions, thoughts, and sensory details
   - Show character growth and change throughout the story
   - Create suspense, wonder, and emotional connection
   - Use varied sentence structure and pacing

2. IMAGE PROMPTS (image_prompt) - THIS IS CRITICAL FOR VISUAL VARIETY:
   Each image_prompt MUST include ALL of these elements:
   
   a) CHARACTER ACTION & POSE (be specific!):
      - BAD: "character standing"
      - GOOD: "character leaping through the air with arms outstretched, mid-jump, dynamic motion"
      - Vary poses: running, jumping, reaching, sitting, lying down, dancing, climbing, flying, falling, etc.
   
   b) FACIAL EXPRESSION & EMOTION:
      - BAD: "happy face"
      - GOOD: "wide eyes filled with wonder, mouth open in amazement, eyebrows raised"
      - Show: joy, fear, determination, curiosity, sadness, excitement, surprise
   
   c) CAMERA ANGLE (change this for EVERY page):
      - Use: close-up on face, wide establishing shot, from above looking down, from below looking up, over-the-shoulder view, side profile, bird's eye view
   
   d) ENVIRONMENT & ATMOSPHERE:
      - Detailed background: forest with dappled sunlight, stormy sky with lightning, cozy bedroom at night, underwater cave with glowing fish
      - Weather and lighting: golden hour sunset, misty morning, starlit night, harsh midday sun
   
   e) DYNAMIC ELEMENTS:
      - Motion blur, wind blowing leaves/hair, dust particles in light, splashing water, falling petals

EXAMPLE OF A GOOD IMAGE PROMPT:
"Wide shot from slightly below, character mid-leap over a sparkling stream with arms spread wide and cape flowing behind them, face showing pure joy with wide grin and sparkling eyes, surrounded by rainbow-colored butterflies swirling in the golden afternoon light, forest in soft focus background with sun rays streaming through trees, magical sparkles trailing from their movement"

RETURN ONLY this JSON structure (no markdown):
{
  "title": "Compelling Story Title That Hints at Adventure",
  "content": [
    {
      "page": 1,
      "text_overlay": "Opening that hooks the reader with sensory details and emotion. The character's world is described vividly. Something interesting is about to happen. We feel their personality through their actions and thoughts.",
      "image_prompt": "Camera angle, character in specific dynamic pose with detailed expression, detailed environment with atmosphere and lighting, motion and energy described",
      "visual_description": "Brief summary for reader"
    }
  ]
}

STORY STRUCTURE (${pageCount} pages):
- Page 1: Establish character and their ordinary world with rich detail
- Page 2: Inciting incident - something changes, character shows reaction
- Page 3+: Rising action - challenges, discoveries, character grows
- Final: Climax and satisfying resolution with emotional payoff

MAKE IT MAGICAL, EMOTIONAL, and VISUALLY SPECTACULAR! Each page should look COMPLETELY DIFFERENT from the others.

Now write the complete ${pageCount}-page story:`;

        try {
            console.log("[Gemini] Sending prompt to API...");
            const rawText = await this.generateText(prompt);
            console.log("[Gemini] Raw response received, length:", rawText.length);
            console.log("[Gemini] First 200 chars:", rawText.substring(0, 200));

            // Aggressive cleaning - remove ALL markdown artifacts
            let cleanText = rawText
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .replace(/^[^{]*({)/, '$1') // Remove everything before first {
                .replace(/(})[^}]*$/, '$1') // Remove everything after last }
                .trim();

            console.log("[Gemini] Cleaned text, length:", cleanText.length);
            console.log("[Gemini] Cleaned first 200 chars:", cleanText.substring(0, 200));

            const json = JSON.parse(cleanText);
            console.log("[Gemini] JSON parsed successfully!");
            console.log("[Gemini] Story title:", json.title);
            console.log("[Gemini] Pages count:", json.content?.length);

            // Validation with detailed logging
            if (!json.content || !Array.isArray(json.content)) {
                console.warn("[Gemini] JSON missing valid 'content' array!");
                console.warn("[Gemini] Actual structure:", Object.keys(json));
                throw new Error("Invalid story structure: missing content array");
            }

            if (json.content.length === 0) {
                console.warn("[Gemini] Content array is empty!");
                throw new Error("Story has no pages");
            }

            // Ensure we have exactly the requested number of pages
            while (json.content.length < pageCount) {
                console.warn(`[Gemini] Padding story from ${json.content.length} to ${pageCount} pages`);
                json.content.push({
                    page: json.content.length + 1,
                    text_overlay: "And the adventure continues...",
                    image_prompt: "A magical continuation of the story",
                    visual_description: "The story unfolds further"
                });
            }

            // Trim to exact count
            json.content = json.content.slice(0, pageCount);

            console.log("[Gemini] Story generation successful!");
            return json;

        } catch (e: any) {
            console.error("[Gemini] Content Gen FAILED:", e.message);
            console.error("[Gemini] Full error:", e);

            // Fallback with DYNAMIC, ENGAGING story content for ANY page count
            console.warn("[Gemini] Using fallback story structure");

            // Base story pages (opening, adventure start, challenge, conclusion)
            const basePages = [
                {
                    page: 1,
                    text_overlay: `In a world filled with wonder and magic, there lived ${input.character_description}. Every morning, they would wake up to the sound of birds singing and the warm glow of sunshine streaming through the window. Today felt different somehow - there was magic in the air, and adventure was calling.`,
                    image_prompt: `Wide establishing shot, ${input.character_description} standing at a window with arms outstretched toward the morning light, face turned upward with eyes closed in peaceful contentment, gentle smile, warm golden sunlight streaming in creating beautiful rim lighting, cozy room with ${input.theme} decorations visible, dust particles floating in the light beams, soft focus background`,
                    visual_description: "Character greeting the morning"
                },
                {
                    page: 2,
                    text_overlay: `Suddenly, something caught their eye - a shimmer of light, a whisper of possibility! Their heart raced with excitement as they realized this was the beginning of something extraordinary. Without hesitation, they rushed forward, ready to discover what wonders awaited.`,
                    image_prompt: `Dynamic mid-shot from low angle looking up, ${input.character_description} running forward with one leg extended mid-stride, arms pumping, hair and clothing flowing with motion blur, face showing pure excitement with wide sparkling eyes and open mouth, magical sparkles swirling around them, ${input.theme} environment rushing past in background blur, sense of movement and energy`,
                    visual_description: "Character discovering the adventure"
                }
            ];

            // Middle pages for extended stories (8 or 12 pages)
            const middlePageTemplates = [
                {
                    text_overlay: `The path ahead was mysterious and unknown. ${input.character_description} encountered strange and wonderful things - talking creatures, magical objects, and hidden secrets. Each discovery made their eyes grow wider with amazement.`,
                    image_prompt: `Medium shot from eye level, ${input.character_description} examining a glowing magical object with curious expression, one hand reaching out tentatively, surrounded by ethereal lights and mysterious ${input.theme} elements, soft ambient glow, sense of wonder and discovery`,
                    visual_description: "Discovering magical elements"
                },
                {
                    text_overlay: `They met new friends along the way - kind souls who offered help and wisdom. Together, they shared stories and laughter. ${input.character_description} realized that adventures are always better when shared with friends.`,
                    image_prompt: `Wide shot showing ${input.character_description} sitting in a circle with friendly creatures, all laughing and talking, warm camp fire or magical glow in center, ${input.theme} landscape in background, feeling of companionship and warmth`,
                    visual_description: "Making friends"
                },
                {
                    text_overlay: `But not everything was easy. Dark clouds gathered, and obstacles appeared. ${input.character_description} felt small and uncertain. Yet deep inside, a tiny spark of courage began to glow brighter.`,
                    image_prompt: `Dramatic low angle shot, ${input.character_description} standing small against a large imposing obstacle or challenge, stormy ${input.theme} atmosphere, determined posture despite fear showing in body language, lighting contrast between dark challenge and small hopeful glow around character`,
                    visual_description: "Facing fear"
                },
                {
                    text_overlay: `The journey wasn't easy. There were moments of doubt, challenges that seemed impossible to overcome. But ${input.character_description} learned something important - true courage means being afraid but moving forward anyway. With determination burning in their heart, they pressed on, growing stronger with each step.`,
                    image_prompt: `Dramatic close-up shot from the side, ${input.character_description} climbing upward with one hand reaching desperately for the next hold, muscles tensed, face showing fierce determination with furrowed brow and clenched jaw, sweat glistening, dramatic lighting from above casting strong shadows, ${input.theme} obstacles visible below and around, composition showing struggle and perseverance`,
                    visual_description: "Overcoming obstacles"
                },
                {
                    text_overlay: `Then came the breakthrough! A moment of insight, a clever solution, or perhaps help from an unexpected place. ${input.character_description} felt hope surge through them like lightning.`,
                    image_prompt: `Dynamic shot from dramatic angle, ${input.character_description} having an aha moment with face lit up in realization, hands raised in excitement, magical energy or light bursting around them, ${input.theme} environment reacting to the breakthrough, sense of triumph and revelation`,
                    visual_description: "The breakthrough moment"
                },
                {
                    text_overlay: `With newfound confidence and wisdom, ${input.character_description} tackled the challenge head-on. Skills learned, friends made, and courage found all came together in this crucial moment.`,
                    image_prompt: `Action shot from dynamic angle, ${input.character_description} in heroic pose using all their abilities, surrounded by supportive friends or magical effects, ${input.theme} elements swirling dramatically, lighting emphasizing the pivotal moment, composition showing confidence and power`,
                    visual_description: "Using everything learned"
                },
                {
                    text_overlay: `The challenge began to crumble. Victory was near! ${input.character_description} could see the light at the end of the journey, and it filled them with joy and pride.`,
                    image_prompt: `Uplifting wide shot, ${input.character_description} pushing through final obstacle, seeing light breaking through, exhausted but triumphant expression, ${input.theme} environment transforming from dark to bright, sense of imminent victory`,
                    visual_description: "Approaching victory"
                },
                {
                    text_overlay: `As the dust settled, ${input.character_description} stood amazed at how far they had come. The scared little one from the beginning was now brave and strong. Growth sometimes happens when we least expect it.`,
                    image_prompt: `Reflective medium shot, ${input.character_description} looking back at the path they traveled, mature and confident posture, ${input.theme} landscape showing the journey behind them, golden light of achievement, sense of growth and reflection`,
                    visual_description: "Reflecting on growth"
                },
                {
                    text_overlay: `The greatest surprise was realizing that the real treasure wasn't what they found - it was who they became. ${input.character_description} had discovered something precious: their own inner strength.`,
                    image_prompt: `Intimate close-up, ${input.character_description} with gentle smile of self-realization, holding hand over heart, soft warm glow around them, ${input.theme} elements softly bokeh in background, peaceful and profound emotional moment`,
                    visual_description: "Inner revelation"
                }
            ];

            // Conclusion page
            const conclusionPage = {
                page: pageCount,
                text_overlay: `And then, in that perfect moment of triumph, everything changed. Success bloomed like a flower opening to the sun, beautiful and inevitable. ${input.character_description} had done it! Joy filled their entire being as they realized that the magic had been inside them all along. The adventure would continue, but now they knew - they could handle anything.`,
                image_prompt: `Cinematic wide shot from slightly above, ${input.character_description} standing atop a hill with arms raised victoriously toward the sky, head thrown back in jubilant laughter, cape or clothing billowing dramatically in the wind, surrounded by swirling magical lights and particles, ${input.theme} landscape stretching out below in beautiful vista, golden hour lighting creating warm glow, birds or butterflies circling overhead, sense of achievement and joy radiating from the scene`,
                visual_description: "Triumphant conclusion"
            };

            // Build the story based on pageCount
            const dynamicPages = [...basePages];

            // Add middle pages if needed
            const middlePagesNeeded = pageCount - 3; // -2 for opening, -1 for conclusion
            if (middlePagesNeeded > 0) {
                for (let i = 0; i < middlePagesNeeded; i++) {
                    const template = middlePageTemplates[i % middlePageTemplates.length];
                    dynamicPages.push({
                        page: basePages.length + i + 1,
                        ...template
                    });
                }
            }

            // Add conclusion
            dynamicPages.push(conclusionPage);

            return {
                title: `The ${input.theme} Adventure`,
                content: dynamicPages
            };
        }
    }

    async analyzeImage(base64Image: string, prompt: string = "Describe this image.") {
        console.log(`[Gemini] Vision Analysis...`);
        // Strip data:image/...;base64, prefix if present
        const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const imagePart: Part = {
                inlineData: {
                    data: cleanBase64,
                    mimeType: "image/jpeg",
                },
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            return response.text();
        } catch (e: any) {
            console.error("[Gemini] analyzeImage failed:", e.message);
            throw e;
        }
    }

    async generateImage(prompt: string, userId: string) {
        // Stub for DALL-E or similar if needed, but we use Doubao mostly
        return "https://via.placeholder.com/300?text=Magic+Image";
    }

    async generateImageFromImage(prompt: string, base64: string, userId: string) {
        // Stub - Doubao Service handles this in production usually
        return "https://via.placeholder.com/300?text=Magic+Transform";
    }
    async generateText(prompt: string, userId?: string): Promise<string> {
        console.log(`[Gemini] Generating Text...`);
        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (e: any) {
            console.error("[Gemini] generateText failed:", e.message);
            throw e;
        }
    }

    async analyzeImageJSON(base64Image: string, prompt: string): Promise<any> {
        const text = await this.analyzeImage(base64Image, prompt + " Output strict JSON.");
        try {
            // Clean markdown json codes
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.warn("Failed to parse JSON from vision:", text);
            return { raw: text };
        }
    }

    /**
     * Analyze artwork and match with famous masterpiece
     */
    async analyzeAndMatchMasterpiece(imageBase64: string, masterpieces: any[]): Promise<any> {
        console.log('[Gemini] Analyzing artwork for masterpiece match...');

        // Create simplified list for AI
        const artListText = masterpieces.map(m =>
            `ID: ${m.id} | Artist: ${m.artist} | Title: ${m.title} | Keywords: ${m.tags.join(", ")}`
        ).join("\n");

        const prompt = `You are Magic Kat, an art historian for kids (age 5-10).

TASK:
1. Carefully analyze this child's drawing: observe the colors, shapes, composition, and subject matter
2. Find the ONE artwork from the list below that shares the most similarities
3. Explain the connection in a way that excites and encourages the child
4. Give one simple, actionable tip to help them explore this style further

AVAILABLE ARTWORKS:
${artListText}

CRITICAL RULES:
- You MUST choose one artwork ID from the list above
- Be specific about what matches (colors, shapes, style, subject)
- Use enthusiastic, encouraging language
- Keep it simple for children

OUTPUT (JSON only, no markdown):
{
  "matchId": "exact_id_from_list",
  "analysis": "Wow! Your drawing has amazing blue swirls just like Van Gogh's Starry Night!",
  "suggestion": "Try using short, curvy brush strokes to make your next painting even more magical!",
  "commonFeatures": ["blue colors", "swirly lines", "nighttime feeling"]
}`;

        try {
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const cleanBase64 = imageBase64.split(',')[1];

            const imagePart: Part = {
                inlineData: {
                    data: cleanBase64,
                    mimeType: "image/jpeg",
                },
            };

            const sdkResult = await model.generateContent([prompt, imagePart]);
            const response = await sdkResult.response;
            const resultText = response.text();

            console.log('[Gemini] SDK Raw response:', resultText.substring(0, 200));

            // Parse JSON from response (remove markdown code blocks if present)
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }

            const parsedResult = JSON.parse(jsonMatch[0]);

            // Validate that matchId exists in our list
            const isValidMatch = masterpieces.some(m => m.id === parsedResult.matchId);
            if (!isValidMatch) {
                console.warn(`[Gemini] Invalid matchId: ${parsedResult.matchId}, using fallback`);
                parsedResult.matchId = masterpieces[0].id; // Default to first artwork
            }

            console.log(`[Gemini] Matched to: ${parsedResult.matchId}`);
            return parsedResult;

        } catch (error: any) {
            console.error('[Gemini] Masterpiece matching failed:', error);
            throw new Error(`Failed to analyze artwork: ${error.message}`);
        }
    }
}

export const geminiService = new GeminiService();

