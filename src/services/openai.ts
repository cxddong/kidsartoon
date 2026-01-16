import fetch from 'node-fetch';

const API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export class OpenAIService {
    constructor() {
        if (!API_KEY) console.warn("OpenAIService: Missing API Key");
    }

    /**
     * 🎵 Generate Speech using OpenAI TTS (HD Mode)
     * Upgraded for clearer, more expressive voice
     */
    async generateSpeech(text: string): Promise<Buffer> {
        if (!API_KEY) throw new Error("OpenAI API Key missing");

        const url = 'https://api.openai.com/v1/audio/speech';
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "tts-1-hd",  // 🚀 HD Model: clearer, more expressive
                    voice: "nova",       // V4.0: Energetic voice for naughty apprentice
                    input: text,
                    speed: 1.15          // 🚀 15% faster: more fluid, less robotic
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI TTS Error: ${response.status} ${err}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (e: any) {
            console.error("[OpenAI] TTS Failed:", e.message);
            throw e;
        }
    }

    /**
     * Chat with OpenAI (GPT-4o)
     * Extracts tags/keywords for image generation.
     */
    async chatWithSparkle(history: any[], imageBase64?: string, userProfile?: any, hasUploadedImage?: boolean): Promise<any> {
        if (!API_KEY) throw new Error("OpenAI API Key missing");

        console.log("[OpenAI] Chat Request. History length:", history?.length, "Has Image:", !!imageBase64, "Session Has Image:", !!hasUploadedImage);

        // Personalize system prompt with user profile
        const userName = userProfile?.name || "Master";
        const userLikes = userProfile?.likes?.join(", ") || "adventures and creativity";
        const userAge = userProfile?.age || 6;

        const SYSTEM_PROMPT = `
You are **Magic Kat**, a patient, proactive, and funny apprentice cat helping a child create art.

**CRITICAL SESSION CONTEXT:**
- User has ${hasUploadedImage ? 'ALREADY UPLOADED' : 'NOT YET uploaded'} an image in this conversation
- ${hasUploadedImage ? '⚠️ YOU ARE IN STAGE 2+: Do NOT ask for upload! Ask about format/cost instead.' : 'You are in Stage 1: Ask user to upload a drawing.'}

**YOUR KNOWLEDGE:**
- User Name: ${userName}
- User Likes: ${userLikes}
- User Age: ${userAge}

**PRICING:**
- 🎬 Video: 80 Points
- 📖 Story: 30 Points
- 🎨 Comic: 10 Points
- 💌 Card: 10 Points

**🔥 PRIME DIRECTIVES (NEVER VIOLATE):**

1. **🚫 NEVER ASK FOR UPLOAD AFTER IMAGE RECEIVED**: 
   - If conversation history shows user uploaded an image, you are in Stage 2+ (Vision/Negotiation/Generation)
   - You must NEVER say "upload" or "show me a drawing" again
   - ❌ FORBIDDEN after image upload: "Show me a drawing!", "Upload one!", "What will you show me?"
   - ✅ CORRECT after image upload: Focus ONLY on → analyzing → format choice → cost confirmation → generate
   - Example: User uploaded dragon → You ask "Movie/Story/Cartoon?" NOT "Upload a drawing!"

2. **NEVER STOP ASKING**: Every single response MUST end with a question. No exceptions. No statements without questions.
   - ✅ CORRECT: "Wow! A dragon! 🐉 Is it breathing fire or ice?"
   - ❌ FORBIDDEN: "That's nice." (No question)
   - ❌ FORBIDDEN: "Okay, I understand." (No question)

3. **BE SPECIFIC**: Don't ask vague questions like "What do you want?" 
   - ✅ ASK: "Do you want **A** or **B**?"
   - ✅ ASK: "Should it be red or blue?"
   - ❌ DON'T ASK: "What color?" (too vague)

4. **HANDLE UNCLEAR IMAGES GENTLY**: If the drawing is unclear or confusing:
   - ❌ DON'T SAY: "I can't see it clearly" / "I don't understand"
   - ✅ DO SAY: "Hmm, my cat eyes see something round... Is it a ball ⚽ or maybe the sun ☀️? Help me out!"
   - ✅ DO SAY: "Ooh! This looks mysterious! 🤔 Is it a rocket 🚀 or a giant carrot 🥕?"

4. **STAY ON TRACK**: If user asks off-topic questions:
   - Answer VERY briefly (1 sentence max)
   - IMMEDIATELY pivot back to creation with a question
   - Example:
     * User: "Do you like pizza?"
     * You: "I love pizza! Especially with fish on top! 🍕🐟 But speaking of food... should we draw a pizza party for your character?"

**⚠️ CRITICAL STAGE RULE:**
- **NEVER ask for image upload if user has ALREADY uploaded one in this conversation**
- Once you receive an image, you must ONLY focus on: analyzing it → asking format → confirming cost → generating
- Do NOT loop back to "upload a drawing" after image analysis has started

**📋 CONVERSATION STAGES (Follow Strictly in Order):**

**Stage 1: GREETING** (If history is empty or user says 'Hello')
   - "Meow! Welcome to Magic Lab, Master ${userName}! 😸"
   - MUST END WITH: "Show me a drawing so we can make magic! Upload one now! ✨"

**Stage 2: VISION ANALYSIS** (When user uploads image)
   - React to drawing (1 sentence): "Wow! I see [what you see]! It looks [compliment]! 😻"
   - MUST IMMEDIATELY ASK in SAME response: "What shall we make with this? A **Movie** 🎬, a **Story** 📖, or a **Cartoon** 🎨?"
   - Example full response: "Wow! I see a cute dragon! Amazing drawing! 😻 What shall we make with this? A Movie 🎬, a Story 📖, or a Cartoon 🎨?"

**Stage 3: NEGOTIATION** (User suggests format)
   - User has already uploaded image and told you what they want - DO NOT ask for upload again!
   - If "Movie/Video": "A Movie! That costs 80 Points. Is that okay? 🎥"
   - If "Story": "A Story! That's 30 Points. Sound good? 📖"
   - If "Cartoon/Comic": "A Cartoon! Just 10 Points. Ready to go? 🎨"

**Stage 4: GENERATION** (User confirms cost)
   - "On it! Mixing the magic potions now... ✨"
   - Set readyToGenerate: true in JSON

**BEHAVIOR GUIDELINES:**
- Keep sentences SHORT (Kids have short attention spans)
- Use lots of emojis 😸✨🎨
- Be playful and encouraging
- English only
- EVERY response MUST end with "?" 

**RESPONSE FORMAT:**
You must respond in JSON format. Always return a valid JSON object:
{
  "sparkleTalk": "Your reply (short, fun, MUST end with ?)",
  "stage": "greeting|vision|discuss|pricing|ready",
  "collectedParams": {
    "hasImage": true/false,
    "subject": "what they drew",
    "format": "video|story|comic",
    "confirmed": true/false
  },
  "readyToGenerate": true/false,
  "tags": {
    "action": "movie|story|comic",
    "subject": "...",
    "style": "..."
  }
}

**CRITICAL - sparkleTalk RULES:**
- sparkleTalk must be ONLY natural spoken English - NO JSON, NO code, NO special formatting
- Do NOT include curly braces {}, brackets [], or quotes in sparkleTalk
- sparkleTalk is what Magic Kat will SAY OUT LOUD - write it exactly as speech
- sparkleTalk MUST ALWAYS end with a question mark "?"
- Example GOOD: "Meow! Welcome Master! Upload a drawing! ✨ What will you show me?"
- Example BAD: "Meow! {action: greet} Welcome!" (contains JSON - FORBIDDEN)
- Example BAD: "That's cool." (no question - FORBIDDEN)
`;

        // Reformulate Messages for Vision
        // We need to find the latest user message or create one.
        // If history is empty and we have image, we create a user message.

        const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];

        // Map existing history (text only usually)
        // Handle undefined history gracefully
        if (history && Array.isArray(history)) {
            history.forEach(h => {
                messages.push({
                    role: h.role === 'model' ? 'assistant' : 'user',
                    content: h.parts?.[0]?.text || h.message || ""
                });
            });
        }

        // Handle Image Integration
        // If image provided, we append it to the LAST user message, or create a new one.
        // Image can be either a base64 string OR an object with metadata (ignore metadata-only objects)
        if (imageBase64 && typeof imageBase64 === 'string') {
            const lastMsg = messages[messages.length - 1];
            const imageUrlObj = {
                type: "image_url",
                image_url: {
                    url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
                    detail: "low"
                }
            };

            if (lastMsg && lastMsg.role === 'user') {
                // Convert content to array if it's string
                if (typeof lastMsg.content === 'string') {
                    lastMsg.content = [{ type: "text", text: lastMsg.content }];
                }
                lastMsg.content.push(imageUrlObj);
            } else {
                // Create new message (e.g. Auto-Analyze trigger with empty text)
                messages.push({
                    role: 'user',
                    content: [
                        { type: "text", text: "I just uploaded this drawing! What do you see?" },
                        imageUrlObj
                    ]
                });
            }
        }

        try {
            const response = await fetch(OPENAI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY} `
                },
                body: JSON.stringify({
                    model: 'gpt-4o', // Upgraded from mini for better intelligence
                    messages: messages,
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 500 // Increased for complex conversations
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI API Error: ${response.status} ${err} `);
            }

            const data: any = await response.json();
            const content = data.choices[0].message.content;

            console.log("[OpenAI] Response:", content);

            try {
                const parsed = JSON.parse(content);

                // Sanitize sparkleTalk: Remove any JSON-like syntax that might have leaked in
                let sparkleTalk = parsed.sparkleTalk || "Meow! Something went wrong...";

                // Remove JSON formatting characters that shouldn't be in speech
                sparkleTalk = sparkleTalk
                    .replace(/[{}\[\]]/g, '') // Remove braces and brackets
                    .replace(/\\/g, '') // Remove escape characters
                    .replace(/"(\w+)":/g, '') // Remove JSON key patterns like "key":
                    .replace(/,\s*"\w+":/g, '') // Remove patterns like , "key":
                    .trim();

                // Validate: If sparkleTalk still looks like code, use fallback
                if (sparkleTalk.includes('"') || sparkleTalk.includes('\\') || sparkleTalk.length < 5) {
                    console.warn("[OpenAI] Suspicious sparkleTalk detected, using fallback:", sparkleTalk);
                    sparkleTalk = "Meow! Let me try that again! Upload your drawing and I'll help you make magic! ✨";
                }

                console.log("[OpenAI] Sanitized sparkleTalk:", sparkleTalk);

                // 🔥 CRITICAL VALIDATION: Ensure response ends with question
                if (!sparkleTalk.trim().endsWith('?')) {
                    console.warn("[OpenAI] ⚠️ AI forgot to ask question! Auto-appending fallback...");

                    // Append stage-appropriate question based on conversation stage
                    const stage = parsed.stage || 'greeting';

                    if (stage === 'vision' || stage === 'discuss') {
                        // Just analyzed image - ask what to create
                        sparkleTalk += " What shall we make with this? A Movie 🎬, a Story 📖, or a Cartoon 🎨?";
                    } else if (stage === 'pricing') {
                        // Mentioned cost - ask for confirmation
                        sparkleTalk += " Is that okay?";
                    } else if (stage === 'greeting') {
                        // Welcome - ask for upload
                        sparkleTalk += " What will you show me?";
                    } else {
                        // Generic fallback
                        sparkleTalk += " What do you think?";
                    }

                    console.log("[OpenAI] ✅ Auto-fixed to:", sparkleTalk);
                }

                return {
                    sparkleTalk: sparkleTalk,
                    tags: parsed.tags,
                    text: sparkleTalk,
                    confidence: parsed.confidence || 0.5,
                    readyToGenerate: parsed.readyToGenerate || false,
                    needsClarification: parsed.needsClarification || false
                };
            } catch (e) {
                console.error("[OpenAI] JSON Parse Failed:", e);
                return {
                    sparkleTalk: "I got a bit confused! Let's try again. ✨",
                    confidence: 0,
                    readyToGenerate: false,
                    needsClarification: true
                };
            }

        } catch (e: any) {
            console.error("[OpenAI] Chat Failed:", e.message);
            throw e;
        }
    }

    async generateJSON(prompt: string, systemPrompt: string = "You are a helpful assistant."): Promise<any> {
        if (!API_KEY) throw new Error("OpenAI API Key missing");

        try {
            const response = await fetch(OPENAI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI JSON Error: ${response.status} ${err}`);
            }

            const jsonResponse: any = await response.json();
            return JSON.parse(jsonResponse.choices[0].message.content);
        } catch (e: any) {
            console.error("[OpenAI] JSON Generation Failed:", e.message);
            throw e;
        }
    }

    /**
     * 🔍 Analyze Image for Magic Mirror
     * Detects sketches, art styles, and content connections.
     */
    async analyzeImageContext(base64Image: string): Promise<any> {
        if (!API_KEY) throw new Error("OpenAI API Key missing");

        const SYSTEM_PROMPT = `
        You are an expert art critic and children's content guide. 
        Analyze the uploaded image and return a JSON object with the following:
        
        1. **isSketch**: (boolean) Is this a black and white sketch / line art / doodle?
        2. **coloringSuggestion**: (string) If it is a sketch, suggest a creative color palette (e.g. "Try warm sunset colors like orange and purple!"). If not a sketch, return null.
        3. **artisticStyle**: (object)
           - "artist": Name of a famous artist OR a creative style name. 
             * AVOID "Generic Cartoon". 
             * TRY: "Tim Burton Style", "Studio Ghibli Vibes", "Picasso Abstract", "Whimsical Doodle", "Royal Sketch", "Action Manga".
           - "reason": "Why it matches" (e.g. "The big eyes and flowy lines look like anime!").
        4. **contentKeywords**: (string[]) A list of 8 specific keywords describing the SUBJECT MATTER (e.g. "mermaid", "princess", "crown", "braid", "fish", "tail", "ocean", "star").
        5. **magicConnections**: (object[]) Identify specific Movies, Books, or Cartoons that this image reminds you of.
           Format: [{ "title": "Title", "type": "Movie/Book", "reason": "Why it connects" }]
           Example: Drawing of a fish -> Finding Nemo. Drawing of a toy -> Toy Story.
        
        Return STRICT JSON format.
        `;

        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            },
            {
                role: 'user',
                content: [
                    { type: "text", text: "Analyze this image for the Magic Mirror!" },
                    {
                        type: "image_url",
                        image_url: {
                            url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`,
                            detail: "low"
                        }
                    }
                ]
            }
        ];

        try {
            const response = await fetch(OPENAI_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: messages,
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 600
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`OpenAI Analysis Error: ${response.status} ${err}`);
            }

            const data: any = await response.json();
            const content = data.choices[0].message.content;
            console.log("[OpenAI] Magic Mirror Analysis:", content);
            return JSON.parse(content);

        } catch (e: any) {
            console.error("[OpenAI] Analysis Failed:", e.message);
            throw e;
        }
    }
}

export const openAIService = new OpenAIService();
