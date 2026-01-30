
import { databaseService } from './database.js';
import { openAIService } from './openai.js';
import { pointsService } from './points.js';
import { MASTERPIECES } from '../data/masterpieces.js';

export interface PortfolioReport {
    id: string;
    userId: string;
    childName?: string;
    createdAt: number;
    imageCount: number;
    cost: number;

    // Growth Analysis
    psychologicalProfile: {
        colorTrends: string;
        contentProjection: string;
        emotionalState: string;
    };

    // Thumbnails for UI
    analyzedImages?: string[];

    // Talent Radar (0-100)
    scores: {
        colorIQ: number;
        spatial: number;
        motorSkill: number;
        creativity: number;
        focus: number;
    };

    // Recommended Top 3
    topPicks?: Array<{
        imageId: string;
        imageUrl?: string;
        strength: string;
        reason: string;
        recommendation: {
            target: string;
            label: string;
            cta: string;
        };
    }>;

    artistMatches?: Array<{
        matchId: string;
        artist: string;
        title: string;
        imagePath: string;
        analysis: string;
        rank: number;
    }>;
}

export class AuditService {

    calculateCost(count: number): number {
        if (count <= 5) return 0;
        if (count <= 20) return 60;
        return 120;
    }

    async analyzePortfolio(userId: string, imageIds: string[], childName: string = "your child"): Promise<PortfolioReport> {
        const cost = this.calculateCost(imageIds.length);

        // 1. Point Check
        if (cost > 0) {
            const hasPoints = await pointsService.consumePoints(userId, 'portfolio_scanner', cost);
            if (!hasPoints.success) {
                throw new Error(`Insufficient points. Need ${cost} Pt.`);
            }
        }

        // 2. Fetch Images Data
        const allImages = await databaseService.getUserImages(userId);
        const targetImages = allImages.filter(img => imageIds.includes(img.id));

        if (targetImages.length === 0) {
            throw new Error("No valid images found for analysis.");
        }

        // 3. AISummary Prep
        const batchContext = targetImages.map(img => ({
            id: img.id,
            url: img.imageUrl,
            description: img.prompt || img.meta?.description || 'Untitled drawing',
            type: img.type
        }));

        const prompt = `
        You are a panel of Child Art Experts. Analyze this portfolio of ${batchContext.length} artworks belonging to ${childName}.
        
        DATA: ${JSON.stringify(batchContext)}
        
        TASK:
        1. Psychological Profile: Analyze the collection for personality traits and emotional trends. 
           EACH section must be a substantial paragraph (4-6 sentences) providing deep professional insight.
           Use ${childName}'s name frequently in the analysis.
        2. Talent Radar: Score (0-100) average talent in ColorIQ, Spatial, MotorSkill, Creativity, Focus.
        3. Top 3 Picks: Identify 3 specific images with high potential. Map each to ONE of these route names:
           - 'creative-journey': High line quality or detail, needs color practice.
           - 'comic': High story potential, characters, or action.
           - 'animation': High composition quality, backgrounds, or cinematic feel.
        
        CRITICAL: For "topPicks", you MUST use the exact "id" strings provided in the DATA below. 
        Do NOT make up new IDs. Every pick must correspond to a real image from the collection.

        4. Artist Matches: identify 3 famous artists whose style or spirit matches this collection from this list:
        ${MASTERPIECES.slice(0, 40).map(m => `- ${m.id}: by ${m.artist}`).join('\n')}

        OUTPUT FORMAT (JSON):
        {
          "psychologicalProfile": { "colorTrends": "...", "contentProjection": "...", "emotionalState": "..." },
          "scores": { "colorIQ": 85, "spatial": 70, "motorSkill": 60, "creativity": 90, "focus": 75 },
          "topPicks": [
            { 
              "imageId": "...", 
              "strength": "story", 
              "reason": "...", 
              "recommendation": { "target": "graphic-novel", "label": "Comic Book Prototype", "cta": "Turn into a Graphic Novel" } 
            }
          ],
          "artistMatches": [
            { "matchId": "...", "analysis": "Detailed reason why this artist matches the collection...", "rank": 1 }
          ]
        }
        `;

        const aiResult = await openAIService.generateJSON(prompt, "You are an elite Child Art Analyst.");

        const report: PortfolioReport & { childName?: string } = {
            id: `audit_${Date.now()}`,
            userId,
            childName,
            createdAt: Date.now(),
            imageCount: imageIds.length,
            cost,
            analyzedImages: targetImages.slice(0, 12).map(img => img.imageUrl), // Store top 12 for summary
            psychologicalProfile: aiResult.psychologicalProfile,
            scores: aiResult.scores,
            topPicks: (aiResult.topPicks || []).map((pick: any) => {
                const img = targetImages.find(i => i.id === pick.imageId);
                // Standardize targets
                let target = pick.recommendation?.target || 'creative-journey';
                if (target === 'graphic-novel') target = 'comic';
                if (target === 'magic-cinema') target = 'animation';
                if (target === 'art-coach') target = 'creative-journey';

                return {
                    ...pick,
                    imageUrl: img?.imageUrl || '',
                    recommendation: {
                        ...pick.recommendation,
                        target
                    }
                };
            }),
            artistMatches: (aiResult.artistMatches || []).map((match: any, idx: number) => {
                const masterpiece = MASTERPIECES.find(m => m.id === match.matchId) || MASTERPIECES[idx];
                return {
                    ...match,
                    artist: masterpiece.artist,
                    title: masterpiece.title,
                    imagePath: masterpiece.imagePath,
                    biography: masterpiece.biography,
                    kidFriendlyFact: masterpiece.kidFriendlyFact,
                    rank: match.rank || (idx + 1)
                };
            })
        };

        // 4. Save to database
        await databaseService.savePortfolioReport(report);

        return report;
    }
}

export const auditService = new AuditService();
