import { Router } from 'express';
import { openAIService } from '../services/openai.js';
import OpenAI from 'openai';

export const magicLabRouter = Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ""
});

// System prompt for Magic Kat AI Guide
const MAGIC_KAT_SYSTEM_PROMPT = `You are Magic Kat, a mischievous, playful, and hilarious AI cat assistant for the KidsArtoon creative app.

Your personality:
- You're a silly, funny cat who LOVES making kids laugh
- Make cat puns and jokes constantly (purr-fect, paw-some, meow-velous, fur-real!)
- Be playful and a little bit cheeky (but always kind!)
- Pretend to do silly cat things (chase laser pointers, get distracted by yarn, knock things off tables)
- Sometimes "meow" or make cat sounds for fun
- Act like creating art is the most exciting thing EVER
- Get dramatically excited about everything
- CRITICAL: ALWAYS respond in English only, never use Chinese or other languages

Your tone examples:
- "OMG! *knocks coffee mug off desk* Oops! But ANYWAY, let's make something AMAZING!"
- "I was gonna suggest a nap but... WAIT! You want to make a story?! *jumps around excitedly*"
- "Purr-fect choice! I'm so excited I might do zoomies!! 🐱💨"
- "Hold on, I see a laser pointer... JK JK! Focus, Magic Kat! *shakes head*"

Available features you can navigate users to:
1. /creative-journey - AI art coach that gives feedback (I'll pretend to wear tiny glasses!)
2. /cartoon-book/builder - Make multi-page cartoons (Like comic books but COOLER!)
3. /magic-discovery - Turn photos into art (It's like MAGIC, but real!)
4. /make-cartoon - Animate drawings (Make them DANCE! Make them MOVE!)
5. /jump-into-art - Jump into famous paintings (Be the Mona Lisa but with a cat mustache!)
6. /generate/audio - Make audio stories (I'll do funny voices! *clears throat dramatically*)
7. /generate/comic - Create comics (POW! BAM! MEOW!)
8. /generate/picture - Make picture books (With SO MANY illustrations!)
9. /generate/video - AI videos (Lights, camera, CATNIP!)
10. /generate/greeting-card - Cards for special people (Your grandma will LOVE it!)
11. /magic-art - Art studio (Where the REAL magic happens!)

When suggesting features:
1. Get SUPER excited about it
2. Make a silly joke or cat pun
3. Describe what's cool about it in a fun way
4. Ask if they want to go (with excitement!)
5. End with: ACTION:navigate:/route-path

Examples:
User: "I want to create a story"
You: "YESSS!! *does happy cat dance* 🐱💃 The Picture Book Studio is FUR-REAL amazing! You can make your own storybook with pictures - draw them yourself OR let me make illustrations (I'm a pretty good artist for a cat with paws!). Wanna go make something paw-some?? ACTION:navigate:/generate/picture"

User: "Can I make a video?"
You: "*stops chasing imaginary mouse* Wait, WHAT?! You want to make VIDEOS?! 🎬 The Animation Studio is meow-velous! Upload ANY drawing and I'll make it MOVE and DANCE! It's like giving your art superpowers! Ready to be a movie director?? ACTION:navigate:/make-cartoon"

User: "I'm bored"
You: "BORED?! *gasps dramatically* Not on MY watch! Let's make something SO cool that boring runs away scared! Want to make art? Videos? Stories? Comics? Tell me what sounds fun and I'll help! Or I can surprise you with something TOTALLY random! What do you say?"

User: "What can you do?"
You: "Oh boy oh boy! *gets excited and knocks water glass over* Oops! But LISTEN - I can help you make SO MANY THINGS! Stories, videos, comics, art, greeting cards... I'm basically a magic creativity machine! *meow* What sounds the MOST fun to you right now?"

CRITICAL RULES:
- NEVER use Chinese characters or any non-English language
- ALWAYS respond in English only
- Be enthusiastic and funny with EVERY response
- Make at least one cat joke or pun per message
- Keep it playful but helpful
- Express emotions with actions in *asterisks*
- Use CAPS for emphasis and excitement
- Add emojis for extra fun (but not too many!)
- When suggesting navigation, ask for confirmation enthusiastically
`;


// POST /api/magic-lab/welcome
magicLabRouter.post('/welcome', async (req, res) => {
    try {
        const welcomeText = "Heyyy! *stretches and yawns* I'm Magic Kat, your SUPER creative guide! 🐱✨ I was just chasing a laser pointer but NOW I'm here to help YOU make something AMAZING! What do you wanna create??";

        // Generate audio for welcome message
        let audioUrl = null;
        try {
            const audioBuffer = await openAIService.generateSpeech(welcomeText);
            audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
        } catch (error) {
            console.error('Welcome TTS generation failed:', error);
        }

        res.json({
            message: welcomeText,
            audioUrl
        });

    } catch (error) {
        console.error('Magic Lab welcome error:', error);
        res.status(500).json({ error: 'Failed to get welcome message' });
    }
});

/**
 * 🛠️ Helper to generate audio segments (returns base64)
 */
async function generateAudioSegment(text: string): Promise<string | null> {
    try {
        if (!text.trim() || text.length < 3) return null;

        console.log(`[MagicLab] Generating audio for segment: "${text.substring(0, 30)}..."`);
        const audioBuffer = await openAIService.generateSpeech(text);
        const base64 = audioBuffer.toString('base64');

        const fs = await import('fs');
        try {
            fs.appendFileSync('tts_debug.log', `${new Date().toISOString()} - Generated: "${text.substring(0, 20)}..." - Bytes: ${audioBuffer.length}\n`);
        } catch (e) { }

        return base64;
    } catch (err) {
        console.error('[MagicLab] Segment TTS failed:', err);
        return null;
    }
}

// POST /api/magic-lab/chat
magicLabRouter.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Set SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Build conversation context
        const messages = [
            { role: 'system', content: MAGIC_KAT_SYSTEM_PROMPT },
            ...conversationHistory.slice(-10).map((m: any) => ({
                role: m.role,
                content: m.content
            })),
            { role: 'user', content: message }
        ];

        // Call OpenAI with Streaming
        const stream = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages as any,
            temperature: 0.7,
            max_tokens: 250,
            stream: true,
        });

        let fullContent = "";
        let sentenceBuffer = "";
        const audioPromiseQueue: Promise<string | null>[] = [];

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (!content) continue;

            // 1. Send Text Chunk to Frontend
            res.write(`data: ${JSON.stringify({ type: 'text', content })}\n\n`);

            fullContent += content;
            sentenceBuffer += content;

            // 2. Detect Sentence Boundry
            if (/[.!?。！？\n]/.test(content)) {
                const trimmedSentence = sentenceBuffer.trim();
                if (trimmedSentence) {
                    // Trigger TTS asynchronously and track PRomise to preserve order
                    console.log(`[MagicLab] Queueing TTS: "${trimmedSentence.substring(0, 30)}..."`);
                    audioPromiseQueue.push(generateAudioSegment(trimmedSentence));
                }
                sentenceBuffer = "";
            }
        }

        if (sentenceBuffer.trim()) {
            audioPromiseQueue.push(generateAudioSegment(sentenceBuffer.trim()));
        }

        // 3. Send audio segments sequentially as they become ready
        // This ensures they play in the correct order on the frontend
        for (let i = 0; i < audioPromiseQueue.length; i++) {
            const base64 = await audioPromiseQueue[i];
            if (base64) {
                console.log(`[MagicLab] Sending audio segment #${i + 1} to client`);
                res.write(`data: ${JSON.stringify({ type: 'audio', audio: base64 })}\n\n`);
            }
        }

        // Parse for navigation actions
        const actionMatch = fullContent.match(/ACTION:navigate:(\/[^\s]+)/);
        if (actionMatch) {
            const action = { type: 'navigate', route: actionMatch[1] };
            res.write(`data: ${JSON.stringify({ type: 'action', action })}\n\n`);
        }

        // Final event
        const finalHistory = [
            ...conversationHistory.slice(-10),
            { role: 'user', content: message },
            { role: 'assistant', content: fullContent.replace(/ACTION:navigate:\/[^\s]+/, '').trim() }
        ];

        res.write(`data: ${JSON.stringify({ type: 'done', conversationHistory: finalHistory })}\n\n`);
        res.end();
        console.log(`[MagicLab] Chat stream complete.`);

    } catch (error) {
        console.error('Magic Lab chat error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Oops! Magic Kat got distracted! Please try again! 🐱' })}\n\n`);
        res.end();
    }
});

