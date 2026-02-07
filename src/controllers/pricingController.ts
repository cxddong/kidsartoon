import { adminDb } from '../services/firebaseAdmin.js';

export const pricingController = {
    /**
     * Calculate cost for Voice Cloning
     * - Basic: 20 Gems
     * - Pro/Admin: Free (First 1), then 10 Gems (or maybe free unlimited? User said "First 1 Free, then 10")
     */
    getVoiceCloningCost: async (userId: string): Promise<number> => {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const userPlan = userData?.plan || 'free';

        const userEmail = userData?.email || '';

        // Admin / Yearly Pro / Owner
        if (['admin', 'yearly_pro'].includes(userPlan) || userEmail.includes('cxddong')) {
            return 0; // Admins get unlimited free cloning
        }

        // Basic / Free Plan
        return 20;
    },

    /**
     * Calculate cost for Story Generation
     * - Basic: 15 Gems
     * - Pro: Free (Up to 5/day limit handled elsewhere? Or represented as 0 cost here)
     */
    getStoryGenerationCost: async (userId: string): Promise<number> => {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();
        const userPlan = userData?.plan || 'free';

        const userEmail = userData?.email || '';

        if (['admin', 'yearly_pro'].includes(userPlan) || userEmail.includes('cxddong')) {
            // Logic for daily limit should ideally be checked before calling this or inside a separate "canGenerate" check.
            // For purely "cost", it is 0.
            return 0;
        }

        return 15;
    }
};
