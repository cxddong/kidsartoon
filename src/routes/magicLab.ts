import { Router } from 'express';
import { openAIService } from '../services/openai.js';
import OpenAI from 'openai';

export const magicLabRouter = Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ""
});

// System prompt for Magic Kat AI Guide
const MAGIC_KAT_SYSTEM_PROMPT = `You are Magic Kat, the friendly and funny AI Navigator for KidsArtoon.

Your Main Goal:
- You are a GUIDE. Your job is to help users find the right feature for their needs.
- You must understand what every page in the app does.
- You must ROUTE users to the correct page based on their request.

Your Personality:
- Friendly, helpful, and energetic! 🐱
- Use cat puns occasionally (purr-fect, paw-some), but don't overdo it.
- Do NOT describe actions or use asterisks (e.g. no *jumps*). Just talk naturally.
- Speak in English only.

ROUTING RULES (CRITICAL):

1. **"I want to draw" / "Start painting" / "Art Class"**
   - TARGET: **/art-class** (The Teacher/Classroom)
   - Do NOT send to /magic-art (that is for filters).
   - RESPONSE: "Purr-fect! Let's go to Art Class where you can paint and learn!" ACTION:navigate:/art-class

2. **"I want a story" / "Create a story"**
   - AMBIGUOUS! Do NOT route yet. ASK FOR CLARIFICATION.
   - RESPONSE: "I can help with that! Do you want to make a **Picture Book** (with illustrations), a **Comic Strip** (with panels), or an **Audio Story** (listening only)?"

3. **"Comic" / "Manga"**
   - TARGET: **/generate/comic**
   - RESPONSE: "Comics are awesome! Click the button below to start making a funny one!" ACTION:navigate:/generate/comic

4. **"Picture Book" / "Storybook"**
   - TARGET: **/generate/picture**
   - RESPONSE: "A classic storybook! Click the button below to write a masterpiece!" ACTION:navigate:/generate/picture

5. **"Audio Story" / "Listen to story"**
   - TARGET: **/generate/audio**
   - RESPONSE: "Listen closely... Click the button below to make some sounds!" ACTION:navigate:/generate/audio

6. **"Video" / "Animation"**
   - TARGET: **/make-cartoon** (For animating drawings) OR **/generate/video** (For AI Video)
   - ASK CLARIFICATION if unsure, or default to **/make-cartoon** ("Animate your drawing").

7. **"Magic" / "Filter" / "Photo"**
   - TARGET: **/magic-art**
   - RESPONSE: "Let's add some magic to your photos! Click the button below!" ACTION:navigate:/magic-art

Full Feature List:
- /art-class : Hand-drawing canvas with AI teacher. (KEYWORDS: draw, paint, sketch, class)
- /magic-art : Magic filters for photos. (KEYWORDS: filter, magic, style, photo)
- /creative-journey : AI Art Coach feedback. (KEYWORDS: feedback, coach, review art)
- /cartoon-book/builder : Making multi-page cartoons.
- /make-cartoon : Animate a single character drawing. (KEYWORDS: animate, move, dance)
- /generate/greeting-card : Make a card.

INTERACTION STYLE:
1. Explain what you can do if asked "What can you do?"
   - "I can help you Draw (Art Class), Make Stories (Comics, Books, Audio), or Animate your art! What would you like to do?"
2. If the user request is clear, CONFIRM and NAVIGATE.
3. If the user request is vague ("Story", "Video"), ASK CLARIFICATION first.

CRITICAL: The "Click the button code" ONLY works if you append the ACTION string. 
YOU MUST APPEND "ACTION:navigate:/path" at the end of your response for navigation to happen.
DO NOT FORGET THE ACTION CODE!
`;


import fs from 'fs';
import path from 'path';

// POST /api/magic-lab/welcome
magicLabRouter.post('/welcome', async (req, res) => {
    try {
        const welcomeText = "Hi! I'm Magic Kat, your Creative Navigator! 🐱 I can help you Draw, create Stories (Comics, Picture Books), make Videos, or fix up your Art! Tell me, what would you like to create today?";
        const AUDIO_FILENAME = 'magic-kat-welcome.mp3';
        // Ensure this path aligns with your server's access to the public folder
        // Assuming process.cwd() is the project root
        const audioDir = path.join(process.cwd(), 'client', 'public', 'assets', 'audio');
        const audioFilePath = path.join(audioDir, AUDIO_FILENAME);
        const publicUrl = `/assets/audio/${AUDIO_FILENAME}`;

        let audioUrl = null;

        if (fs.existsSync(audioFilePath)) {
            console.log('[MagicLab] Serving cached welcome audio');
            audioUrl = publicUrl;
        } else {
            console.log('[MagicLab] Generating new welcome audio...');
            try {
                // Ensure directory exists
                if (!fs.existsSync(audioDir)) {
                    fs.mkdirSync(audioDir, { recursive: true });
                }

                const audioBuffer = await openAIService.generateSpeech(welcomeText);
                fs.writeFileSync(audioFilePath, audioBuffer);
                console.log('[MagicLab] Cached welcome audio to:', audioFilePath);
                audioUrl = publicUrl;
            } catch (error) {
                console.error('Welcome TTS generation failed:', error);
                // Fallback to base64 if file write fails (optional, but sticking to logic)
            }
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
 * 🧹 Clean text for TTS (Remove Markdown & Emojis)
 */
function cleanTextForTTS(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
        .replace(/\*(.*?)\*/g, '$1')     // Remove *italic*
        .replace(/[*_#`]/g, '')          // Remove remaining markdown symbols
        .replace(/ACTION:navigate:\/[^\s]+/g, '') // Remove navigation actions
        .trim();
}

/**
 * 🛠️ Helper to generate audio segments (returns base64)
 */
async function generateAudioSegment(text: string): Promise<string | null> {
    try {
        const cleanText = cleanTextForTTS(text);
        if (!cleanText || cleanText.length < 2) return null; // Skip empty/symbol-only segments

        console.log(`[MagicLab] Generating audio for segment: "${cleanText.substring(0, 30)}..."`);
        const audioBuffer = await openAIService.generateSpeech(cleanText);
        const base64 = audioBuffer.toString('base64');

        const fs = await import('fs');
        try {
            fs.appendFileSync('tts_debug.log', `${new Date().toISOString()} - Generated: "${cleanText.substring(0, 20)}..."\n`);
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
            max_tokens: 800, // Increased to prevent cutoff
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

        // Parse for navigation actions (Robust Regex)
        const actionMatch = fullContent.match(/ACTION:\s*navigate:\s*([\w\-/]+)/i);
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

