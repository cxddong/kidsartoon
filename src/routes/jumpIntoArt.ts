import express from 'express';
import { adminDb as db } from '../services/firebaseAdmin.js';
import { doubaoService } from '../services/doubao.js';

const router = express.Router();

/**
 * Helper: Fetch image as base64 for AI analysis
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
    try {
        const response = await fetch(imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        console.error('[JumpIntoArt] Failed to fetch image:', error);
        throw error;
    }
}

// POST /api/jump-into-art/generate
router.post('/generate', async (req, res) => {
    try {
        const { photoUrl, artUrl, mode, userId } = req.body;

        if (!photoUrl || !artUrl || !mode) {
            return res.status(400).json({
                success: false,
                error: 'Missing required parameters: photoUrl, artUrl, mode'
            });
        }

        console.log(`[JumpIntoArt] 🎨 Generating for user ${userId} in Mode ${mode}`);
        console.log(`[JumpIntoArt] Photo URL: ${photoUrl}`);
        console.log(`[JumpIntoArt] Art URL: ${artUrl}`);

        let resultImageUrl = '';
        let analysisPrompt = '';
        let generationPrompt = '';

        if (mode === 'A') {
            // MODE A: Jump Into Drawing (User becomes cartoon)
            console.log('[JumpIntoArt] Mode A: Jump Into Drawing');

            // STEP 1: Precise Feature Extraction
            // Extract person features from photo
            console.log('[JumpIntoArt] Step 1: Extracting person features from photo...');
            const photoBase64 = await fetchImageAsBase64(photoUrl);
            const personFeatures = await doubaoService.analyzeImage(
                photoBase64,
                "Describe the person's visual features in detail. Focus on: hair style and color, face shape, distinctive clothing (e.g., pink swimsuit), expression. Reply with comma-separated keywords only, no background. Example: 'toddler girl, black short hair with bangs, round face, pink swimsuit, smiling'"
            );
            console.log('[JumpIntoArt] Person features:', personFeatures);

            // Extract art character features from artwork
            console.log('[JumpIntoArt] Step 2: Extracting art character features...');
            const artBase64 = await fetchImageAsBase64(artUrl);
            const artCharacterFeatures = await doubaoService.analyzeImage(
                artBase64,
                "Describe the character's visual features in detail. Focus on: character type (e.g., doll girl), hair color and style (e.g., pink twin-tail, blue bow), clothing details (e.g., polka dot dress), eye shape (e.g., large round eyes). Reply with comma-separated keywords only, no background. Example: 'cartoon doll girl, pink twin-tail hair, blue bow, large round eyes, pink polka dot dress'"
            );
            console.log('[JumpIntoArt] Art character features:', artCharacterFeatures);

            // Extract art style
            console.log('[JumpIntoArt] Step 3: Extracting art style...');
            const artStyle = await doubaoService.analyzeImage(
                artBase64,
                "What is the art style of this drawing? Reply with one or two words only. Examples: 'crayon drawing', 'watercolor', 'pencil sketch', 'cute cartoon'"
            );
            console.log('[JumpIntoArt] Art style:', artStyle);

            // STEP 2: Construct Feature-Locked Prompt
            const prompt = `A cartoon illustration showing TWO distinct characters together in a whimsical scene. 
Art style: ${artStyle}.

Character 1 (The Real Person as Cartoon): Based on reference image A. A cartoon version of the person with ${personFeatures}. This character's face and features MUST strictly resemble the person in reference image A, but drawn in ${artStyle} style.

Character 2 (The Art Character): Based on reference image B. The character with ${artCharacterFeatures}. This character MUST look exactly like the character in reference image B.

Both characters are standing side-by-side, interacting happily. Same ${artStyle} art style for both. Colorful, cheerful atmosphere. 4K resolution.`;

            console.log('[JumpIntoArt] Final prompt:', prompt);

            // STEP 3: Generate with feature-locked prompt
            // Using text-to-image since our detailed feature extraction already captured key characteristics
            resultImageUrl = await doubaoService.generateImage(prompt, '4K');

        } else if (mode === 'B') {
            // MODE B: Bring Art to Life (Artwork becomes realistic)
            console.log('[JumpIntoArt] Mode B: Bring Art to Life');

            // STEP 1: Precise Feature Extraction
            // Extract art character features
            console.log('[JumpIntoArt] Step 1: Extracting art character features...');
            const artBase64 = await fetchImageAsBase64(artUrl);
            const artCharacterFeatures = await doubaoService.analyzeImage(
                artBase64,
                "Describe the character's visual features in detail. Focus on: character type, hair color and style, clothing details, accessories, eye shape. Reply with comma-separated keywords only. Example: 'cartoon doll girl, pink twin-tail hair, blue bow, large round eyes, pink polka dot dress'"
            );
            console.log('[JumpIntoArt] Art character features:', artCharacterFeatures);

            // Extract person features from photo
            console.log('[JumpIntoArt] Step 2: Extracting person features...');
            const photoBase64 = await fetchImageAsBase64(photoUrl);
            const personFeatures = await doubaoService.analyzeImage(
                photoBase64,
                "Describe the person's visual features. Focus on: hair style and color, age group, clothing. Reply with comma-separated keywords only. Example: 'toddler girl, black short hair with bangs, pink swimsuit'"
            );
            console.log('[JumpIntoArt] Person features:', personFeatures);

            // Extract photo environment/style
            console.log('[JumpIntoArt] Step 3: Extracting photo style...');
            const photoStyle = await doubaoService.analyzeImage(
                photoBase64,
                "Describe the photo's lighting and atmosphere. Reply with a short phrase. Examples: 'bright indoor lighting', 'warm outdoor sunlight', 'soft natural light'"
            );
            console.log('[JumpIntoArt] Photo style:', photoStyle);

            // STEP 2: Construct Feature-Locked Prompt
            const prompt = `A photorealistic photograph of TWO distinct subjects standing together in a real indoor pool environment.

Subject 1 (The Real Person): Based on reference image A. The real person with ${personFeatures}. This person's face MUST strictly resemble the person in reference image A.

Subject 2 (The Art Character Brought to Life): Based on reference image B. A realistic, physical version of the character with ${artCharacterFeatures}. It should look like a real-life mascot or large doll standing next to the person, but with realistic textures and lighting.

They are standing side-by-side on the pool deck. ${photoStyle}. Realistic lighting, detailed textures, high quality photography. 4K resolution.`;

            console.log('[JumpIntoArt] Final prompt:', prompt);

            // STEP 3: Generate with feature-locked prompt
            // Using text-to-image since our detailed feature extraction already captured key characteristics
            resultImageUrl = await doubaoService.generateImage(prompt, '4K');

        } else {
            throw new Error(`Invalid mode: ${mode}. Expected 'A' or 'B'.`);
        }

        console.log(`[JumpIntoArt] ✨ Generation successful! Result URL: ${resultImageUrl}`);

        // Save metadata to Firestore (Private)
        if (userId) {
            const recordData = {
                mode,
                photoUrl,
                artUrl,
                resultImageUrl,
                targetSize: '4K',
                createdAt: new Date().toISOString(),
                isPrivate: true
            };

            await db.collection('users').doc(userId).collection('jump_into_art').add(recordData);
            console.log('[JumpIntoArt] Saved record to Firestore');
        }

        res.json({
            success: true,
            results: {
                snapshot: resultImageUrl,
                mode,
                size: '4K'
            }
        });

    } catch (error: any) {
        console.error('[JumpIntoArt] ❌ Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Image generation failed'
        });
    }
});

export default router;
