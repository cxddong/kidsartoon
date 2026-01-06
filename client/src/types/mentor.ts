/**
 * interface for a "Deep Art Coach" session (Iteration-based)
 */
export interface CreativeSeries {
    id: string;
    userId: string;
    title: string;
    status: 'active' | 'completed';
    currentStep: number;
    artStyle?: string;
    context: {
        originalGoal?: string;
        currentVisualDiagnosis?: string;
        lastAdvice?: string;
        artStyle?: string;
    };
    chapters: Chapter[];
    createdAt: number;
    updatedAt: number;
}

/**
 * interface for a single iteration within a session
 */
export interface Chapter {
    step: number;
    userImageUrl: string;

    coachingFeedback: {
        visualDiagnosis: string;
        masterConnection: {
            artist: string;
            reason: string;
        };
        advice: {
            compliment: string;
            gapAnalysis: string;
            actionableTask: string;
            techniqueTip: string;
        };
        improvement?: string;
    };

    // Backward compatibility during transition
    aiFeedback?: {
        praise: string;
        artMatch: string;
        storySegment: string;
    };
    magicScore?: {
        stars: number;
        title: string;
        comment: string;
    };
}

export interface MentorStepRequest {
    userId: string;
    image: string; // Base64
    step: number;
    seriesId?: string;
    action?: 'iteration' | 'new_chapter';
}

export interface MentorStepResponse {
    success: boolean;
    series: CreativeSeries;
    isComplete: boolean;
    message?: string;
}
