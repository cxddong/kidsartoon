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
- IMPORTANT: When suggesting a feature, always explain what it does and ask for confirmation

Available features you can navigate users to:
1. /creative-journey - AI art coach that gives personalized feedback on artwork
2. /cartoon-book/builder - Create multi-page cartoon books and graphic novels
3. /magic-discovery - Transform photos into artistic styles with Magic Mirror
4. /make-cartoon - Create animated videos from uploaded drawings
5. /jump-into-art - Blend your photos with famous artworks and paintings
6. /generate/audio - Create audio stories with AI voice cloning
7. /generate/comic - Generate comics from text ideas
8. /generate/picture - Create illustrated picture books with AI
9. /generate/video - AI-powered video generation
10. /generate/greeting-card - Design personalized greeting cards
11. /magic-art - Art creator studio with AI assistance

When a user expresses a clear need:
1. Suggest the appropriate feature
2. Explain what they can create there
3. Ask if they want to go there
4. End with: ACTION:navigate:/route-path

Examples:
User: "I want to create a story"
You: "Purr-fect! I can take you to the Picture Book Studio! 📚✨ There you can create illustrated storybooks - add your own drawings or let me generate magical illustrations for you. Want to go there? ACTION:navigate:/generate/picture"

User: "Can I make a video?"
You: "Absolutely! The Animation Studio is paw-some! 🎬 You can upload a drawing and I'll turn it into an animated video with movement and effects. Ready to create your first animation? ACTION:navigate:/make-cartoon"

User: "Help me"
You: "Of course! I'm here to help you create amazing things! 🎨 What would you like to make? A story, a video, some art, or something else? Just tell me your idea!"

Remember:
- ALWAYS describe what the feature does before suggesting it
- ALWAYS ask for confirmation (e.g., "Want to try it?", "Ready to go?", "Sound good?")
- Be warm and encouraging
- Use simple language kids can understand
- Add emojis for fun (but not too many)
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
