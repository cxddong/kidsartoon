import { geminiService } from './gemini.js';

/**
 * Artwork Analysis Service - Expert Panel System
 *
 * This service provides professional art analysis through three AI expert personas:
 * - Dr. Aria (Child Psychologist)
 * - Prof. Chromis (Art & Color Therapist)
 * - Magic Kat (Education Guide)
 */

interface ColorDistribution {
    warm: number;
    cool: number;
    neutral: number;
}

interface ColorPsychology {
    distribution: ColorDistribution;
    dominantTone: 'warm' | 'cool' | 'balanced';
    interpretation: string;
    emotionalState: string;
}

interface DevelopmentalStage {
    stage: 'scribbling' | 'pre-schematic' | 'schematic' | 'dawning-realism' | 'pseudo-realism';
    ageRange: string;
    characteristics: string[];
    spatialConcepts: {
        hasGroundLine: boolean;
        hasOverlapping: boolean;
        has3DAttempt: boolean;
    };
}

interface NarrativeAnalysis {
    elementCount: number;
    detailLevel: 'minimal' | 'moderate' | 'rich';
    hasStory: boolean;
    narrativeElements: string[];
    observationScore: number;
}

interface GrowthRadarScores {
    imagination: number;
    colorSense: number;
    structuralLogic: number;
    lineControl: number;
    storytelling: number;
}

class ArtworkAnalysisService {
    /**
     * Prof. Chromis - Color Psychology Analysis
     */
    async analyzeColorPsychology(imageUrl: string): Promise<ColorPsychology> {
        try {
            const prompt = `You are **Prof. Chromis**, Senior Color Therapist on the KidsArtoon Scientific Committee.

**YOUR EXPERTISE:** Color theory, emotional psychology of color, artistic composition.

**MISSION:** Analyze this child's artwork from a professional color psychology perspective.

**ANALYSIS FRAMEWORK:**
1. Calculate precise color distribution:
   - Warm colors (red, orange, yellow) percentage
   - Cool colors (blue, green, purple) percentage
   - Neutral colors (black, white, gray, brown) percentage

2. Interpret the psychological meaning:
   - What does the color palette reveal about the child's current emotional state?
   - Is there color harmony or intentional contrast?
   - Compare to healthy color usage patterns for this age group

3. Provide professional insights using color theory terminology

**OUTPUT FORMAT (JSON):**
{
  "warm": <percentage 0-100>,
  "cool": <percentage 0-100>,
  "neutral": <percentage 0-100>,
  "dominantTone": "warm|cool|balanced",
  "interpretation": "<Professional color analysis in 1-2 sentences>",
  "emotionalState": "<Inferred emotional state based on color psychology>"
}

Be specific, scientific, and encouraging. Avoid generic praise.`;

            const response = await geminiService.analyzeImage(imageUrl, prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    distribution: {
                        warm: parsed.warm || 0,
                        cool: parsed.cool || 0,
                        neutral: parsed.neutral || 0
                    },
                    dominantTone: parsed.dominantTone || 'balanced',
                    interpretation: parsed.interpretation || 'Creative color usage',
                    emotionalState: parsed.emotionalState || 'Positive and energetic'
                };
            }

            return this.getFallbackColorAnalysis();
        } catch (error) {
            console.error('Color psychology analysis failed:', error);
            return this.getFallbackColorAnalysis();
        }
    }

    /**
     * Dr. Aria - Developmental Stage Detection
     */
    async detectDevelopmentalStage(imageUrl: string): Promise<DevelopmentalStage> {
        try {
            const prompt = `You are **Dr. Aria**, Chief Child Development Psychologist on the KidsArtoon Scientific Committee.

**YOUR EXPERTISE:** Developmental psychology, cognitive milestones, Viktor Lowenfeld's artistic development stages.

**MISSION:** Analyze this artwork to identify the child's current developmental stage and cognitive abilities.

**LOWENFELD'S STAGES REFERENCE:**
- **Scribbling (2-4 years):** Random marks, circular scribbles, emerging motor control
- **Pre-Schematic (4-7 years):** First representational attempts, "tadpole people", floating objects
- **Schematic (7-9 years):** Baseline/skyline appears, x-ray drawings, detailed schemas
- **Dawning Realism (9-12 years):** Perspective attempts, realistic proportions
- **Pseudo-Realism (12-14 years):** Critical awareness, sophisticated techniques

**ANALYSIS FRAMEWORK:**
1. Identify the developmental stage based on visual evidence
2. Assess spatial concepts:
   - Ground line presence (shows understanding of space)
   - Object overlapping (depth perception)
   - 3D representation attempts (cognitive leap)
3. Note specific characteristics that support your classification
4. Assess line control, confidence, and motor skill development

**OUTPUT FORMAT (JSON):**
{
  "stage": "<stage name in lowercase with hyphens>",
  "ageRange": "<typical age range>",
  "characteristics": ["<specific observed feature 1>", "<feature 2>", "<feature 3>"],
  "hasGroundLine": <boolean>,
  "hasOverlapping": <boolean>,
  "has3DAttempt": <boolean>
}

Use professional developmental psychology terminology. Be specific about THIS child's work.`;

            const response = await geminiService.analyzeImage(imageUrl, prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const characteristics = Array.isArray(parsed.characteristics)
                    ? parsed.characteristics
                    : (typeof parsed.characteristics === 'string' ? [parsed.characteristics] : []);

                return {
                    stage: parsed.stage || 'pre-schematic',
                    ageRange: parsed.ageRange || '4-7 years',
                    characteristics: characteristics,
                    spatialConcepts: {
                        hasGroundLine: !!parsed.hasGroundLine,
                        hasOverlapping: !!parsed.hasOverlapping,
                        has3DAttempt: !!parsed.has3DAttempt
                    }
                };
            }

            return this.getFallbackDevelopmentalStage();
        } catch (error) {
            console.error('Developmental stage detection failed:', error);
            return this.getFallbackDevelopmentalStage();
        }
    }

    /**
     * Magic Kat - Narrative & Detail Analysis
     */
    async analyzeNarrativeDepth(imageUrl: string): Promise<NarrativeAnalysis> {
        try {
            const prompt = `You are **Magic Kat**, Chief Education Guidance Officer on the KidsArtoon Scientific Committee.

**YOUR EXPERTISE:** Art education, storytelling development, creative observation training.

**MISSION:** Evaluate this child's narrative abilities and attention to detail from an educational perspective.

**ANALYSIS FRAMEWORK:**
1. **Element Counting:** Count distinct objects, characters, or features
2. **Detail Assessment:** 
   - Minimal: Basic shapes only, few defining features
   - Moderate: Some details (eyes, mouths, simple textures)
   - Rich: Abundant details (clothing patterns, backgrounds, accessories)
3. **Narrative Detection:**
   - Does the artwork tell a story?
   - Are there action elements or relationships between objects?
   - What narrative elements suggest creative thinking?
4. **Observation Score (0-100):**
   - How closely did the child observe real-world details?
   - Evidence of memory, imagination, or direct observation?

**OUTPUT FORMAT (JSON):**
{
  "elementCount": <number of distinct elements>,
  "detailLevel": "minimal|moderate|rich",
  "hasStory": <boolean>,
  "narrativeElements": ["<story element 1>", "<element 2>"],
  "observationScore": <0-100>
}

Focus on educational value. What does this reveal about the child's learning style?`;

            const response = await geminiService.analyzeImage(imageUrl, prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const narrativeElements = Array.isArray(parsed.narrativeElements)
                    ? parsed.narrativeElements
                    : (typeof parsed.narrativeElements === 'string' ? [parsed.narrativeElements] : []);

                return {
                    elementCount: Number(parsed.elementCount) || 0,
                    detailLevel: parsed.detailLevel || 'moderate',
                    hasStory: !!parsed.hasStory,
                    narrativeElements: narrativeElements,
                    observationScore: Number(parsed.observationScore) || 50
                };
            }

            return this.getFallbackNarrativeAnalysis();
        } catch (error) {
            console.error('Narrative analysis failed:', error);
            return this.getFallbackNarrativeAnalysis();
        }
    }

    /**
     * Calculate 5-dimension growth radar
     */
    async calculateGrowthRadar(imageUrl: string): Promise<GrowthRadarScores> {
        try {
            const [colorAnalysis, devStage, narrative] = await Promise.all([
                this.analyzeColorPsychology(imageUrl),
                this.detectDevelopmentalStage(imageUrl),
                this.analyzeNarrativeDepth(imageUrl)
            ]);

            const imagination = this.calculateImaginationScore(narrative, devStage);
            const colorSense = this.calculateColorSenseScore(colorAnalysis);
            const structuralLogic = this.calculateStructuralLogicScore(devStage);
            const lineControl = this.calculateLineControlScore(devStage);
            const storytelling = this.calculateStorytellingScore(narrative);

            return {
                imagination,
                colorSense,
                structuralLogic,
                lineControl,
                storytelling
            };
        } catch (error) {
            console.error('Growth radar calculation failed:', error);
            return {
                imagination: 70,
                colorSense: 65,
                structuralLogic: 60,
                lineControl: 55,
                storytelling: 60
            };
        }
    }

    /**
     * Match artwork style to famous artists
     */
    async matchToArtist(imageUrl: string): Promise<{ artist: string; similarity: number; reasoning: string }> {
        try {
            const prompt = `You are an art historian on the KidsArtoon Scientific Committee.

Compare this child's artwork style to famous artists (Matisse, Picasso, Van Gogh, Monet, Kandinsky, etc.).

Consider:
- Color usage
- Composition style
- Subject matter
- Technique

Return JSON:
{
  "artist": "<artist name>",
  "similarity": <0-100>,
  "reasoning": "<why this artist matches>"
}`;

            const response = await geminiService.analyzeImage(imageUrl, prompt);
            const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    artist: parsed.artist || 'Matisse',
                    similarity: parsed.similarity || 65,
                    reasoning: parsed.reasoning || 'Bold use of color and simple shapes'
                };
            }

            return { artist: 'Matisse', similarity: 65, reasoning: 'Creative and expressive style' };
        } catch (error) {
            console.error('Artist matching failed:', error);
            return { artist: 'Matisse', similarity: 65, reasoning: 'Creative and expressive style' };
        }
    }

    // Private helper methods
    private calculateImaginationScore(narrative: NarrativeAnalysis, devStage: DevelopmentalStage): number {
        let score = 50;
        score += narrative.elementCount * 3;
        score += narrative.hasStory ? 20 : 0;
        score += devStage.characteristics.length * 5;
        return Math.min(100, score);
    }

    private calculateColorSenseScore(colorAnalysis: ColorPsychology): number {
        let score = 60;
        if (colorAnalysis.dominantTone === 'balanced') score += 20;
        if (colorAnalysis.distribution.neutral < 50) score += 15;
        return Math.min(100, score);
    }

    private calculateStructuralLogicScore(devStage: DevelopmentalStage): number {
        let score = 40;
        if (devStage.spatialConcepts.hasGroundLine) score += 20;
        if (devStage.spatialConcepts.hasOverlapping) score += 20;
        if (devStage.spatialConcepts.has3DAttempt) score += 20;
        return Math.min(100, score);
    }

    private calculateLineControlScore(devStage: DevelopmentalStage): number {
        const stageScores: Record<string, number> = {
            'scribbling': 30,
            'pre-schematic': 50,
            'schematic': 70,
            'dawning-realism': 85,
            'pseudo-realism': 95
        };
        return stageScores[devStage.stage] || 50;
    }

    private calculateStorytellingScore(narrative: NarrativeAnalysis): number {
        let score = 40;
        score += narrative.hasStory ? 30 : 0;
        score += narrative.narrativeElements.length * 5;
        score += (narrative.observationScore / 100) * 30;
        return Math.min(100, score);
    }

    // Fallback methods
    private getFallbackColorAnalysis(): ColorPsychology {
        return {
            distribution: { warm: 40, cool: 35, neutral: 25 },
            dominantTone: 'balanced',
            interpretation: 'Creative and expressive color usage',
            emotionalState: 'Positive and energetic'
        };
    }

    private getFallbackDevelopmentalStage(): DevelopmentalStage {
        return {
            stage: 'pre-schematic',
            ageRange: '4-7 years',
            characteristics: ['First representational attempts', 'Growing confidence'],
            spatialConcepts: {
                hasGroundLine: false,
                hasOverlapping: false,
                has3DAttempt: false
            }
        };
    }

    private getFallbackNarrativeAnalysis(): NarrativeAnalysis {
        return {
            elementCount: 5,
            detailLevel: 'moderate',
            hasStory: false,
            narrativeElements: [],
            observationScore: 60
        };
    }
}

export const artworkAnalysisService = new ArtworkAnalysisService();
export type { ColorPsychology, DevelopmentalStage, NarrativeAnalysis, GrowthRadarScores };
