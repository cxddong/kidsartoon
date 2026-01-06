import { adminDb } from './firebaseAdmin.js';
import { pointsService } from './points.js';

export const SUBSCRIPTION_PLANS = {
    basic: {
        id: 'basic',
        points: 1000,
        planType: 'basic',
        name: 'Basic Monthly',
        price: 9.99
    },
    pro: {
        id: 'pro',
        points: 2200,
        planType: 'pro',
        name: 'Pro Monthly',
        price: 19.99
    },
    yearly_pro: {
        id: 'yearly_pro',
        points: 12000,
        planType: 'pro',
        name: 'Yearly Pro',
        price: 99.00
    }
};

export class SubscriptionService {

    /**
     * Subscribe user to a plan (Mock Payment Success)
     */
    async subscribeUser(userId: string, planId: string, platform: 'web' | 'ios' | 'android' = 'web') {
        // TOP-UP LOGIC (One-time purchase)
        if (planId.startsWith('topup_')) {
            const points = parseInt(planId.split('_')[1]);
            if (isNaN(points) || points <= 0) throw new Error("Invalid TopUp ID: " + planId);

            console.log(`[Subscription] Top-Up ${userId}: +${points} pts`);
            await pointsService.grantPoints(userId, points, 'topup_purchase', 'Top-Up Pack');
            // Do NOT update subscription status/plan for top-ups
            return { success: true, topUp: points };
        }

        const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
        if (!plan) throw new Error("Invalid Plan ID: " + planId);

        console.log(`[Subscription] Subscribing ${userId} to ${planId}...`);

        // 1. Grant Points
        const grantResult = await pointsService.grantPoints(userId, plan.points, 'subscription_grant', `Subscribed to ${plan.name}`);
        if (!grantResult.success) throw new Error("Failed to grant points");

        // 2. Update User Profile
        const userRef = adminDb.collection('users').doc(userId);

        try {
            await userRef.update({
                isSubscribed: true,
                plan: plan.planType, // 'basic' or 'pro'
                subscriptionPlatform: platform,
                currentPlanId: planId,
                subscriptionDate: new Date().toISOString()
            });
        } catch (error) {
            console.error('[Subscription] Failed to update user profile:', error);
            // If user doesn't exist, we might want to set it? But grantPoints checks existence.
            throw error;
        }

        console.log(`[Subscription] Success: ${userId} is now ${plan.planType}`);
        return { success: true, plan };
    }
}

export const subscriptionService = new SubscriptionService();
