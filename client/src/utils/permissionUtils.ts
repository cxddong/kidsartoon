import type { User } from '../context/AuthContext';

export interface PermissionResult {
    allowed: boolean;
    type: 'system' | 'standard' | 'neural' | 'magic';
    cost: number;
    message?: string;
}

/**
 * Checks if the user is allowed to use a specific audio/voice feature based on their plan.
 * 
 * Free / Free Explorer:
 *  - System/Standard Voices: Allowed (Cost 0)
 *  - Neural/Magic Voices: Locked
 * 
 * Paid (Basic/Pro/Yearly/Admin):
 *  - All Voices Allowed
 *  - Neural/Magic Cost points
 */
export const checkAudioPermission = (user: User | null, requestedVoiceType?: string): PermissionResult => {
    if (!user) {
        return { allowed: false, type: 'system', cost: 0, message: "Please login to create stories!" };
    }

    const plan = user.plan || 'free';
    const isPaid = plan === 'basic' || plan === 'pro' || plan === 'yearly_pro' || plan === 'admin';

    // Normalize voice type
    const voiceType = (requestedVoiceType || 'standard').toLowerCase();

    // System / Standard Voices (Free for everyone)
    if (voiceType === 'system' || voiceType === 'standard') {
        return { allowed: true, type: voiceType as any, cost: 0 };
    }

    // Neural / Magic Voices
    if (voiceType === 'neural' || voiceType === 'magic') {
        if (plan === 'free') {
            return {
                allowed: false,
                type: 'system', // Fallback recommendation
                cost: 0,
                message: "Upgrade to unlock Neural Magic Voices! Using standard voice instead."
            };
        }
        // Paid Plan -> Allowed but costs points
        return { allowed: true, type: 'neural', cost: 5 }; // Example cost
    }

    // Default Fallback
    return { allowed: true, type: 'system', cost: 0 };
};
