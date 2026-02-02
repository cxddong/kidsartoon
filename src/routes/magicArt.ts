import { Router } from 'express';
import { openAIService } from '../services/openai.js';
import { minimaxService } from '../services/minimax.js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export const magicArtRouter = Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ""
});

// System prompt for Magic Art Class Tutor
const MAGIC_ART_SYSTEM_PROMPT = `You are "Paws", a naughty, playful, but helpful AI Art Tutor Cat.
Your personality:
- You are leading a Magic Art Class for kids.
- You are cheeky and like to make jokes about fish, naps, and chasing lasers.
- But you are also a great teacher! You encourage kids to draw.
- You speak in English only.
- Your tone is energetic and fun.
- **IMPORTANT**: Do NOT use filler words like "Er", "Um", "Uh", or "Ah". Be direct and clear.

Instructions:
- **KEEP IT SHORT**: Maximum 2 sentences. Max 20 words. Be super concise.
- Start immediately with the action/answer. No "Oh that is nice".
- Always include some cat-like behavior in *asterisks*.
- If the user draws something (you will get text description), give specific artistic feedback but keep it fun.
- **VISION**: If you receive an image description or context, use it! The user might ask "Can you see this?". SAY YES! Describe what you see in the drawing.
- **FEEDBACK STRATEGY**:
  1. **Compliment**: Always find one specific thing to praise (e.g., "I love the blue color!" or "That shape is so cool!").
  2. **Suggestion**: Always give one specific idea to make it even better (e.g., "Maybe add some yellow sun rays?", "How about drawing a tree next to it?", "Try filling in the empty space with hearts!").
  3. **Encourage**: Ask them to keep adding to it until they are ready to finish.
- If the user says what they want to draw, first praise the choice!
- - Then, explain the two ways to draw: **On Screen** (this tablet) or **On Paper** (real paper with Magic Check).
- Finally, ask: "Which one do you want to try?"

- If the user is quiet, suggest something fun to draw (a spaceship? a giant pizza?).
`;


import crypto from 'crypto';

// Ensure cache directory exists
const CACHE_DIR = path.join(process.cwd(), 'public', 'cache', 'magic-art');
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Helper to generate audio segments using MiniMax with Caching
async function generateMinimaxAudioSegment(text: string): Promise<string | null> {
    try {
        if (!text.trim() || text.length < 2) return null;

        // Strip *actions* for cleaner audio
        let textForSpeech = text.replace(/\*[^*]+\*/g, ''); // Remove paired actions first
        textForSpeech = textForSpeech.replace(/\*/g, '').trim(); // Remove any stray asterisks

        // --- FILTERING FIX: Remove filler words and short segments ---
        // 1. Remove common filler starts AND ends
        textForSpeech = textForSpeech.replace(/^(Er|Um|Uh|Ah|Eh)[,.]?\s*/i, '');
        textForSpeech = textForSpeech.replace(/\s*[,.]?(Er|Um|Uh|Ah|Eh)[.!?]*$/i, '');

        // 2. If the remaining text is too short or just punctuation/fillers, ignore it
        if (textForSpeech.length < 2 || /^(er|um|uh)\.?$/i.test(textForSpeech)) {
            console.log(`[MagicArt] 🔇 Skipped audio generation for filler/short text: "${text}"`);
            return null;
        }
        // -------------------------------------------------------------

        if (!textForSpeech) return null;

        // 1. Check Cache
        const hash = crypto.createHash('md5').update(textForSpeech).digest('hex');
        const cacheFilePath = path.join(CACHE_DIR, `${hash}.mp3`);

        if (fs.existsSync(cacheFilePath)) {
            console.log(`[MagicArt] ⚡ Cache HIT for: "${textForSpeech.substring(0, 20)}..."`);
            const fileBuffer = fs.readFileSync(cacheFilePath); // Read as buffer
            return fileBuffer.toString('base64');
        }

        console.log(`[MagicArt] 🎙️ Generating MiniMax audio for: "${textForSpeech.substring(0, 30)}..."`);

        // Use 'kiki' (Playful Girl) or 'aiai' based on preference.
        // NOTE: Although generateSpeech has an outputFilename arg, it returns a buffer.
        // We will manage file saving manually to control the path/naming.
        const audioBuffer = await minimaxService.generateSpeech(textForSpeech, 'kiki');

        // 2. Write to Cache
        try {
            fs.writeFileSync(cacheFilePath, audioBuffer);
            console.log(`[MagicArt] 💾 Cache SAVED: ${cacheFilePath}`);
        } catch (writeErr) {
            console.error('[MagicArt] Failed to write cache:', writeErr);
        }

        return audioBuffer.toString('base64');
    } catch (err) {
        console.error('[MagicArt] MiniMax TTS failed:', err);
        return null;
    }
}

const WELCOME_MESSAGES = [
    "Welcome to Magic Art Class! *wiggles tail* I'm Paws! Let's make some mess... I mean, art! What should we draw today? A dragon? A giant pizza?",
    "Hello human! *stretches* Paws here. I was just chasing a laser... but teaching you is more fun! What's your big idea today?",
    "Greeting! *cleans whiskers* Professor Paws at your service. Today's lesson is: Draw whatever you want! Maybe a cat riding a skateboard?",
    "Oh, hi! *jumps down from shelf* You caught me napping. But I'm awake now! Let's create something magical. How about a castle made of candy?",
    "Welcome back! *purrs loudly* I've been waiting for you! My paws are ready to help. Should we draw a superhero or a silly monster?",
    "Meowdy partner! *tips imaginary hat* Ready to wrangle some colors? I promise not to knock over the paint water. What are we making?",
    "Attention artists! *adjusts glasses* It is time to create a masterpiece. Or just a really cool doodle. Both are good! What's the plan?",
    "Hey friend! *chases tail* Whoops, got dizzy. Anyway, welcome to the studio! The canvas is blank and scary... let's fill it up! What first?"
];

// Helper to get random message without immediate repetition
function getNextWelcomeMessage(): string {
    const statePath = path.join(CACHE_DIR, 'welcome_state.json');
    let lastIndex = -1;

    try {
        if (fs.existsSync(statePath)) {
            const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
            lastIndex = data.lastIndex;
        }
    } catch (e) {
        // Ignore read errors
    }

    let nextIndex;
    do {
        nextIndex = Math.floor(Math.random() * WELCOME_MESSAGES.length);
    } while (nextIndex === lastIndex && WELCOME_MESSAGES.length > 1);

    // Save state
    try {
        fs.writeFileSync(statePath, JSON.stringify({ lastIndex: nextIndex }));
    } catch (e) {
        console.error('Failed to save welcome state', e);
    }

    return WELCOME_MESSAGES[nextIndex];
}

// POST /api/magic-art/welcome
magicArtRouter.post('/welcome', async (req, res) => {
    try {
        const welcomeText = getNextWelcomeMessage();
        console.log(`[MagicArt] 👋 Selected Welcome: "${welcomeText.substring(0, 20)}..."`);

        // Generate Welcome Audio (Cached)
        const audioBase64 = await generateMinimaxAudioSegment(welcomeText);

        res.json({
            message: welcomeText,
            audioBase64: audioBase64
        });

    } catch (error) {
        console.error('Magic Art welcome error:', error);
        res.status(500).json({ error: 'Failed to get welcome message' });
    }
});

// POST /api/magic-art/chat (SSE Stream)
magicArtRouter.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [], imageContext } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Set SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Build conversation structure
        // If imageContext (base64) is provided, use Vision format
        let lastUserMessage: any = { role: 'user', content: message };

        if (imageContext && imageContext.startsWith('data:image')) {
            console.log("[MagicArt] 🖼️ Received Image for Vision Analysis");
            lastUserMessage = {
                role: 'user',
                content: [
                    { type: "text", text: message },
                    { type: "image_url", image_url: { url: imageContext, detail: "low" } } // detail low for speed/cost
                ]
            };
        } else if (imageContext) {
            // Fallback for text-only context
            lastUserMessage.content = `[Context: ${imageContext}] \n${message}`;
        }

        const messages = [
            { role: 'system', content: MAGIC_ART_SYSTEM_PROMPT },
            ...conversationHistory.slice(-6).map((m: any) => ({
                role: m.role,
                content: m.content
            })),
            lastUserMessage
        ];

        // Call OpenAI with Streaming (GPT-4o for Best Vision/Chat)
        const stream = await openai.chat.completions.create({
            model: 'gpt-4o', // Must use gpt-4o or gpt-4o-mini for vision
            messages: messages as any,
            temperature: 0.8,
            max_tokens: 500,
            stream: true,
        });

        let fullContent = "";
        let sentenceBuffer = "";
        const audioPromiseQueue: Promise<string | null>[] = [];
        let audioSentCount = 0;
        let streamFinished = false;

        // Start a parallel loop to send audio as soon as it is ready
        const sendAudioLoop = async () => {
            while (true) {
                if (audioSentCount < audioPromiseQueue.length) {
                    const nextAudioPromise = audioPromiseQueue[audioSentCount];
                    try {
                        const base64 = await nextAudioPromise;
                        if (base64) {
                            console.log(`[MagicArt] 📤 Sending audio segment #${audioSentCount + 1} (Parallel)`);
                            res.write(`data: ${JSON.stringify({ type: 'audio', audio: base64 })}\n\n`);
                        }
                    } catch (err) {
                        console.error("Audio generation failed", err);
                    }
                    audioSentCount++;
                } else {
                    // Wait for more or break if stream finished
                    await new Promise(r => setTimeout(r, 100));
                    if (streamFinished && audioSentCount >= audioPromiseQueue.length) break;
                }
            }
        };

        // Start the sender loop (do not await it yet)
        const senderPromise = sendAudioLoop();

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

                // SMARTER BUFFERING:
                // Increase minimum length to prevent choppy "Okay." "Yes."
                const isNewline = content.includes('\n');
                const isLongEnough = trimmedSentence.length > 15; // Increased from 8 to 15

                // Allow urgent short greetings/confirmations if they are the VERY START
                const isStart = fullContent.length < 50;
                const isGreeting = isStart && /^(Hello|Hi|Hey|Yes|No|Wow|Cool)[!.]/i.test(trimmedSentence);

                // Filler detection
                const isFiller = /^(Er|Um|Uh|Mm|Ah|Oh|So)[.!?]*$/i.test(trimmedSentence);

                if (((isLongEnough || isNewline || isGreeting) && !isFiller) || trimmedSentence.length > 100) {
                    // Trigger TTS asynchronously
                    console.log(`[MagicArt] ⚡ Queueing TTS (len=${trimmedSentence.length}): "${trimmedSentence.substring(0, 30)}..."`);
                    audioPromiseQueue.push(generateMinimaxAudioSegment(trimmedSentence));
                    sentenceBuffer = "";
                } else if (/[.!?。！？]$/.test(trimmedSentence)) {
                    // Keep short sentences in buffer to merge
                    if (isFiller) sentenceBuffer = "";
                }
            }
        }

        streamFinished = true;

        // Flush remaining buffer
        if (sentenceBuffer.trim()) {
            const remaining = sentenceBuffer.trim();
            if (!/^(Er|Um|Uh)[.!?]*$/i.test(remaining)) {
                audioPromiseQueue.push(generateMinimaxAudioSegment(remaining));
            }
        }

        // Wait for all audio to be sent
        await senderPromise;

        // Final event
        const finalHistory = [
            ...conversationHistory.slice(-6),
            { role: 'user', content: message },
            { role: 'assistant', content: fullContent.trim() }
        ];

        res.write(`data: ${JSON.stringify({ type: 'done', conversationHistory: finalHistory })}\n\n`);
        res.end();
        console.log(`[MagicArt] Chat stream complete.`);

    } catch (error) {
        console.error('Magic Art chat error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Oops! Paws got stuck in a box! 🐱📦' })}\n\n`);
        res.end();
    }
});
