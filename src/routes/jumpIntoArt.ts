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

        if (mode === 'A') {
            // MODE A: Jump Into Drawing (User becomes cartoon with artwork style)
            console.log('[JumpIntoArt] Mode A: Jump Into Drawing - Style Transfer');

            // STEP 1: Deep Style Analysis of Artwork
            console.log('[JumpIntoArt] 🎨 Step 1/3: Analyzing artwork style in detail...');
            const artBase64 = await fetchImageAsBase64(artUrl);
            const artStyleAnalysis = await doubaoService.analyzeImage(
                artBase64,
                `You are a professional art analyst. Analyze this artwork's EXACT visual style for AI recreation. Describe:

1. ART MEDIUM: What medium was used? (crayon, watercolor, colored pencil, marker, digital art, oil painting, etc.)
2. LINE STYLE: Line characteristics (thick black outlines / thin delicate lines / no outlines / rough sketchy / smooth clean)
3. COLOR PALETTE: Specific colors used (list main colors), saturation level (vibrant/muted/pastel), brightness (bright/dark/balanced)
4. SHADING TECHNIQUE: How is depth shown? (flat colors / gradient shading / cross-hatching / textured / soft blending)
5. TEXTURE: Surface appearance (smooth / rough / grainy / paper texture visible / digital clean)
6. OVERALL AESTHETIC: Art style category (cute cartoon / realistic sketch / anime / chibi / storybook illustration / abstract)

Format as detailed technical description for exact art style recreation.

Example: "Crayon drawing on paper, thick black outlines around all shapes, vibrant primary colors (red, yellow, blue, green), flat coloring with slight crayon texture visible, no gradient shading, rough energetic strokes, cute childlike cartoon aesthetic"`
            );
            console.log('[JumpIntoArt] ✅ Art style analyzed:', artStyleAnalysis);

            // STEP 2: Extract art character features
            console.log('[JumpIntoArt] 👤 Step 2/3: Extracting art character features...');
            const artCharacterFeatures = await doubaoService.analyzeImage(
                artBase64,
                "Describe the character's appearance: character type, hair color and style, clothing, accessories, expression. Reply with comma-separated keywords."
            );
            console.log('[JumpIntoArt] ✅ Art character extracted:', artCharacterFeatures);

            // STEP 3: Extract user's basic features (for content, not exact face)
            console.log('[JumpIntoArt] 📸 Step 3/3: Extracting user features...');
            const photoBase64 = await fetchImageAsBase64(photoUrl);
            const personFeatures = await doubaoService.analyzeImage(
                photoBase64,
                "Describe this person's basic appearance: age group, gender, hair color and style, clothing. Reply with comma-separated keywords only."
            );
            console.log('[JumpIntoArt] ✅ User features extracted:', personFeatures);

            // Generate with style-focused prompt
            const prompt = `Create a ${artStyleAnalysis} illustration showing TWO characters:

Character 1: A cartoon version of a person (${personFeatures}). Draw this person in the EXACT art style described above. Match the line style, color palette, shading technique, and overall aesthetic perfectly. The character should look like it was drawn by the same artist using the same medium.

Character 2: ${artCharacterFeatures}. Keep this character's original appearance.

Both characters standing together, side-by-side, in the same unified art style. Cheerful scene. 4K resolution.

CRITICAL: Both characters must be rendered in the IDENTICAL art style - same line work, same coloring technique, same medium appearance.`;

            console.log('[JumpIntoArt] 🚀 Generating with style-matched prompt...');
            resultImageUrl = await doubaoService.generateImage(prompt, '4K');

        } else if (mode === 'B') {
            // MODE B: Bring Art to Life (Realistic transformation)
            console.log('[JumpIntoArt] Mode B: Bring Art to Life');

            // STEP 1: Analyze art character for realistic transformation
            console.log('[JumpIntoArt] 🎨 Step 1/3: Analyzing art character...');
            const artBase64 = await fetchImageAsBase64(artUrl);
            const artCharacterDescription = await doubaoService.analyzeImage(
                artBase64,
                "Describe this character in detail for realistic transformation: character type (girl/boy/animal/object), hair color and style, clothing and accessories, distinctive features, colors. Be detailed. Reply with comma-separated descriptive phrases."
            );
            console.log('[JumpIntoArt] ✅ Art character:', artCharacterDescription);

            // STEP 2: Analyze user's appearance
            console.log('[JumpIntoArt] 📸 Step 2/3: Analyzing your appearance...');
            const photoBase64 = await fetchImageAsBase64(photoUrl);
            const personDescription = await doubaoService.analyzeImage(
                photoBase64,
                "Describe this person's appearance: age group, gender, hair color and style, face shape, skin tone, clothing, expression. Be specific. Reply with comma-separated descriptive phrases."
            );
            console.log('[JumpIntoArt] ✅ Person appearance:', personDescription);

            // STEP 3: Analyze environment
            console.log('[JumpIntoArt] 🌅 Step 3/3: Analyzing photo environment...');
            const photoEnvironment = await doubaoService.analyzeImage(
                photoBase64,
                "Describe the photo's setting and lighting: location (indoor/outdoor), background, lighting (bright/natural/soft). Reply with short phrase."
            );
            console.log('[JumpIntoArt] ✅ Environment:', photoEnvironment);

            // Generate realistic scene
            const prompt = `A photorealistic photograph of TWO subjects standing together:

Subject 1: A real person matching this description: ${personDescription}. Natural realistic appearance.

Subject 2: A life-size realistic version of this character: ${artCharacterDescription}. Transform the cartoon/drawing into a real physical being - like a realistic costume character, mascot, or living doll with actual fabric textures and materials.

Setting: ${photoEnvironment}. Both standing side-by-side. Natural poses, realistic lighting, professional photography. 4K resolution, highly detailed.`;

            console.log('[JumpIntoArt] 🚀 Generating realistic composition...');
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
