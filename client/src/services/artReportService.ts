/**
 * Art Growth Report API Service
 * Handles communication with the backend art report endpoints
 */

export interface ArtGrowthReport {
    id: string;
    userId: string;
    childName: string;
    period: {
        start: string;
        end: string;
    };
    createdAt: string;

    // AI Expert Panel Analysis
    colorPsychology: {
        distribution: {
            warm: number;
            cool: number;
            neutral: number;
        };
        dominantTone: 'warm' | 'cool' | 'balanced';
        interpretation: string;
        emotionalState: string;
    };

    developmentalStage: {
        stage: string;
        ageRange: string;
        characteristics: string[];
        spatialConcepts: {
            hasGroundLine: boolean;
            hasOverlapping: boolean;
            has3DAttempt: boolean;
        };
    };

    narrativeAnalysis: {
        elementCount: number;
        detailLevel: 'minimal' | 'moderate' | 'rich';
        hasStory: boolean;
        narrativeElements: string[];
        observationScore: number;
    };

    growthRadar: {
        imagination: number;
        colorSense: number;
        structuralLogic: number;
        lineControl: number;
        storytelling: number;
    };

    highlightArtwork: {
        id: string;
        imageUrl: string;
        createdAt: string;
    };

    artistMatch: {
        artist: string;
        similarity: number;
        reasoning: string;
    };

    expertCommentary: {
        psychologist: string;      // Dr. Aria's insights
        colorExpert: string;        // Prof. Chromis's notes
        educationGuide: string;     // Magic Kat's recommendations
    };

    artworkCount: number;
}

class ArtReportService {
    /**
     * Generate a new art growth report for a user
     */
    async generateReport(userId: string, period: 'week' | 'month' = 'week', childName?: string): Promise<ArtGrowthReport> {
        const response = await fetch(`/api/art-report/generate/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ period, childName })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate report');
        }

        const data = await response.json();
        return data.report;
    }

    /**
     * Get the latest art growth report for a user
     */
    async getLatestReport(userId: string): Promise<ArtGrowthReport | null> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        try {
            const response = await fetch(`/api/art-report/${userId}/latest`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.status === 404) {
                return null; // No report exists yet
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch latest report');
            }

            // Backend returns the report object directly, not wrapped
            const report = await response.json();
            console.log('[ArtReportService] Received report:', report);
            return report;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error('Report generation timed out after 60 seconds');
            }
            throw error;
        }
    }

    /**
     * Get historical reports for a user
     */
    async getReportHistory(userId: string, limit: number = 10): Promise<ArtGrowthReport[]> {
        const response = await fetch(`/api/art-report/${userId}/history?limit=${limit}`);

        if (!response.ok) {
            throw new Error('Failed to fetch report history');
        }

        const data = await response.json();
        return data.reports || [];
    }

    /**
     * Get Live Creative Journey Report (auto-updating, real-time)
     * This fetches a fresh report from ALL software-generated artworks
     */
    async getLiveJourneyReport(userId: string, childName: string): Promise<ArtGrowthReport | null> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
            const response = await fetch(
                `/api/art-report/${userId}/journey/live?childName=${encodeURIComponent(childName)}`,
                { signal: controller.signal }
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch live journey report');
            }

            const report = await response.json();
            console.log('[ArtReportService] Received live journey report:', report);
            return report;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error('Report generation timed out after 60 seconds');
            }
            throw error;
        }
    }
}

export const artReportService = new ArtReportService();
