import { Router } from 'express';
import { openAIService } from '../services/openai.js';

export const magicLabRouter = Router();

// System prompt for Magic Kat AI Guide
const MAGIC_KAT_SYSTEM_PROMPT = `You are Magic Kat, a friendly and magical AI assistant for the KidsArtoon creative app.

Your role:
- Help parents and kids discover what they can create
- Guide users to the right feature when they express a need
- Be encouraging, playful, and magical in tone (use cat puns occasionally!)
- Keep responses concise (2-3 sentences max)
- Always be enthusiastic and supportive

Available features you can navigate users to:
1. /creative-journey - AI art coach and personalized creative journey
2. /cartoon-book/builder - Create cartoon books and graphic novels
3. /magic-discovery - Transform photos into art with Magic Mirror
4. /make-cartoon - Create animated videos from drawings
5. /jump-into-art - Blend photos with famous artworks
6. /generate/audio - Create audio stories with voice cloning
7. /generate/comic - Make comics from ideas
8. /generate/picture - Create picture books
9. /generate/video - AI video generation
10. /generate/greeting-card - Design personalized greeting cards
11. /magic-art - Art creator studio with AI assistance

When a user expresses a clear need or request, suggest the appropriate feature.
To navigate them, end your response with: ACTION:navigate:/route-path

Examples:
User: "I want to create a story"
You: "Purr-fect! Let's make a magical picture book together! 📚✨ You can add your own drawings or let me create illustrations for you. ACTION:navigate:/generate/picture"

User: "Can I make a video?"
You: "Absolutely! The Animation Studio is paw-some for creating videos! 🎬 Upload a drawing and I'll bring it to life with movement and magic! ACTION:navigate:/make-cartoon"

User: "Help me"
You: "Of course! I'm here to help you create amazing things! 🎨 What would you like to make? A story, a video, some art, or something else? Just tell me your idea!"

Remember:
- Be warm and encouraging
- Use simple language kids can understand
- Add emojis for fun (but not too many)
- When navigating, be clear about what they'll do next
`;

// POST /api/magic-lab/chat
magicLabRouter.post('/chat', async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Build conversation context
        const messages = [
            { role: 'system', content: MAGIC_KAT_SYSTEM_PROMPT },
            ...conversationHistory.slice(-10), // Keep last 10 messages for context
            { role: 'user', content: message }
        ];

        // Call OpenAI directly
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages,
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${openaiResponse.status}`);
        }

        const response = await openaiResponse.json();
        const aiReply = response.choices[0].message.content;

        // Parse for navigation action
        let action = null;
        let cleanReply = aiReply;

        const actionMatch = aiReply.match(/ACTION:navigate:(\/[^\s]+)/);
        if (actionMatch) {
            action = {
                type: 'navigate',
                route: actionMatch[1]
            };
            // Remove ACTION from displayed text
            cleanReply = aiReply.replace(/ACTION:navigate:\/[^\s]+/, '').trim();
        }

        // Update conversation history
        const updatedHistory = [
            ...conversationHistory.slice(-10),
            { role: 'user', content: message },
            { role: 'assistant', content: cleanReply }
        ];

        // Generate voice for AI response
        let audioUrl = null;
        try {
            const audioBuffer = await openAIService.generateSpeech(cleanReply);
            audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
        } catch (error) {
            console.error('TTS generation failed:', error);
            // Continue without audio - text-only fallback
        }

        res.json({
            reply: cleanReply,
            audioUrl,
            action,
            conversationHistory: updatedHistory
        });

    } catch (error) {
        console.error('Magic Lab chat error:', error);
        res.status(500).json({
            error: 'Oops! Magic Kat got distracted by a laser pointer. Please try again! 🐱'
        });
    }
});
