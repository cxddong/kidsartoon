/**
 * Audio Phrase Cache Configuration
 * 
 * Defines all frequently used phrases that should be pregenerated to MP3 files
 * to avoid repeated MiniMax API calls and reduce costs.
 */

export interface CachedPhrase {
    id: string;
    text: string;
    voiceId: 'kiki' | 'aiai' | 'titi';
}

export const CACHED_PHRASES: Record<string, CachedPhrase> = {
    // ========== Art Class Greetings ==========
    'art-class-welcome': {
        id: 'art-class-welcome',
        text: "Meow! Welcome to Art Class! I'm Kat, and I'll be your teacher today. What should we draw?",
        voiceId: 'kiki'
    },
    'art-class-mode-select': {
        id: 'art-class-mode-select',
        text: "Where do you want to draw? Screen or Paper?",
        voiceId: 'kiki'
    },

    // ========== Selection Responses ==========
    'art-class-great-choice-cat': {
        id: 'art-class-great-choice-cat',
        text: "A Cat! Great choice! Let's do it!",
        voiceId: 'kiki'
    },
    'art-class-show-examples': {
        id: 'art-class-show-examples',
        text: "Here are some ideas!",
        voiceId: 'kiki'
    },
    'art-class-lets-draw-cat': {
        id: 'art-class-lets-draw-cat',
        text: "Let's draw a kitty!",
        voiceId: 'kiki'
    },
    'art-class-build-castle': {
        id: 'art-class-build-castle',
        text: "Let's build a castle!",
        voiceId: 'kiki'
    },

    // ========== Mode Selection Responses ==========
    'art-class-on-screen': {
        id: 'art-class-on-screen',
        text: "On Screen it is!",
        voiceId: 'kiki'
    },
    'art-class-real-paper': {
        id: 'art-class-real-paper',
        text: "Real paper! I'll watch!",
        voiceId: 'kiki'
    },

    // ========== Art Step Instructions ==========
    'art-step-1-head': {
        id: 'art-step-1-head',
        text: "Meow! Ready to draw? Let's start with a big circle for my head!",
        voiceId: 'kiki'
    },
    'art-step-2-ears': {
        id: 'art-step-2-ears',
        text: "Great job! Now add two triangles on top for my ears.",
        voiceId: 'kiki'
    },
    'art-step-3-face': {
        id: 'art-step-3-face',
        text: "I need to see and smell! Draw two dot eyes and a nose.",
        voiceId: 'kiki'
    },
    'art-step-4-whiskers': {
        id: 'art-step-4-whiskers',
        text: "Don't forget my whiskers! Three on each side.",
        voiceId: 'kiki'
    },
    'art-step-5-color': {
        id: 'art-step-5-color',
        text: "I look pale! Can you color me Orange or Black?",
        voiceId: 'kiki'
    },

    // ========== Common Encouragement ==========
    'encourage-great-job': {
        id: 'encourage-great-job',
        text: "Great job!",
        voiceId: 'kiki'
    },
    'encourage-awesome': {
        id: 'encourage-awesome',
        text: "Awesome!",
        voiceId: 'kiki'
    },
    'encourage-perfect': {
        id: 'encourage-perfect',
        text: "Perfect!",
        voiceId: 'kiki'
    },
    'encourage-keep-going': {
        id: 'encourage-keep-going',
        text: "Keep going! You're doing amazing!",
        voiceId: 'kiki'
    }
};

/**
 * Helper: Find phrase by text content (for backward compatibility)
 */
export function findPhraseByText(text: string): CachedPhrase | null {
    const normalized = text.trim().toLowerCase();

    for (const phrase of Object.values(CACHED_PHRASES)) {
        if (phrase.text.toLowerCase() === normalized) {
            return phrase;
        }
    }

    return null;
}

/**
 * Helper: Get all phrases as array
 */
export function getAllPhrases(): CachedPhrase[] {
    return Object.values(CACHED_PHRASES);
}

/**
 * Helper: Check if text has a cached version
 */
export function isCached(text: string): boolean {
    return findPhraseByText(text) !== null;
}
