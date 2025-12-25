import { db } from './firebaseConfig.js';
import { doc, updateDoc } from 'firebase/firestore';
import { pointsService } from './points.js';

export const SUBSCRIPTION_PLANS = {
    basic: {
        id: 'basic',
        points: 1200,
        planType: 'basic',
        name: 'Basic Monthly',
        price: 9.99
    },
    pro: {
        id: 'pro',
        points: 2800,
        planType: 'pro',
        name: 'Pro Monthly',
        price: 19.99
    },
    yearly_pro: {
        id: 'yearly_pro',
        points: 14000,
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
        const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
        if (!plan) throw new Error("Invalid Plan ID: " + planId);

        console.log(`[Subscription] Subscribing ${userId} to ${planId}...`);

        // 1. Grant Points
        const grantResult = await pointsService.grantPoints(userId, plan.points, 'subscription_grant', `Subscribed to ${plan.name}`);
        if (!grantResult.success) throw new Error("Failed to grant points");

        // 2. Update User Profile
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            isSubscribed: true,
            plan: plan.planType, // 'basic' or 'pro'
            subscriptionPlatform: platform,
            currentPlanId: planId,
            subscriptionDate: new Date().toISOString()
        });

        console.log(`[Subscription] Success: ${userId} is now ${plan.planType}`);
        return { success: true, plan };
    }
}

export const subscriptionService = new SubscriptionService();
