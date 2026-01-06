/**
 * interface for a "Deep Art Coach" session (Iteration-based)
 */
export interface CreativeSeries {
    id: string;          // Firestore document ID
    userId: string;
    title: string;       // e.g. "The Brave Cat"
    status: 'active' | 'completed';
    currentStep: number; // Iteration count (0-N)

    // Core Coaching Context
    context: {
        originalGoal?: string;    // What the child started with
        currentVisualDiagnosis?: string; // AI's latest assessment
        lastAdvice?: string;      // The mission the client is working on
        artStyle?: string;        // Identified master style
    };

    // Array of iterations (V1, V2, V3...)
    chapters: Chapter[]; // Keeping name 'chapters' for DB compatibility, but acting as iterations

    createdAt: number;
    updatedAt: number;
}

/**
 * interface for a single iteration within a session
 */
export interface Chapter {
    step: number;        // Iteration index (1, 2, 3...)
    userImageUrl: string; // URL of user's uploaded drawing for this iteration

    // Coaching Intelligence
    coachingFeedback: {
        visualDiagnosis: string; // "Line art, shaky but expressive"
        masterConnection: {
            artist: string;
            reason: string;
        };
        advice: {
            compliment: string;
            gapAnalysis: string; // "Feels quiet without friends"
            actionableTask: string; // "Draw a Giant Sun!"
            techniqueTip: string;  // "Use Zig-Zag lines"
        };
        improvement?: string; // Analysis of how this V(n) is better than V(n-1)
    };

    // NEW: Integrated Masterpiece Matches (Top 3)
    masterpieceMatches?: {
        rank: number;
        matchId: string;
        artist: string;
        title: string;
        imagePath: string;
        analysis: string;
        suggestion: string;
        commonFeatures: string[];
        biography?: string;
    }[];

    // Compatibility field (if needed for old UI code during transition)
    aiFeedback?: {
        praise: string;
        artMatch: string;
        storySegment: string;
    };
    audioUrl?: string; // TTS audio URL
}

export interface MentorStepRequest {
    seriesId?: string;
    userId: string;
    image: string;       // Base64
    step: number;        // Iteration index
    action?: 'iteration' | 'new_chapter'; // New: modifying same art or moving to new part
}

export interface MentorStepResponse {
    success: boolean;
    series: CreativeSeries;
    isComplete: boolean;
    audioBase64?: string; // TTS audio base64 for immediate playback
}
