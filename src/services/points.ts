import { adminDb } from './firebaseAdmin.js';
import { v4 as uuidv4 } from 'uuid';

// --- Configuration Tables (V2 Spec) ---
export const POINT_COSTS = {
    COMIC_STRIP: 150,        // 4-Panel Comic (Updated to 150)
    PICTURE_BOOK_4: 30,      // Picture Book (4 Pages)
    PICTURE_BOOK_8: 50,      // Picture Book (8 Pages)
    PICTURE_BOOK_12: 70,     // Picture Book (12 Pages)
    VIDEO_GENERATION: 60,    // Video Generation (Max logic?) - Actually dynamic
    PREMIUM_VOICE_ADDITIONAL: 50, // Additional cost for ElevenLabs voices
    CREATIVE_JOURNEY_VIDEO: 20   // Magic Mentor Finale Video
};

export const POINTS_COSTS: Record<string, number> = {
    'analyze_image': 0, // Free included in other services
    'generate_story': 0, // Free included in other services
    'generate_image': 40, // Single Image (SeaDream 4.0)
    'generate_comic': POINT_COSTS.COMIC_STRIP,
    'generate_speech': 0, // Included
    'generate_video': POINT_COSTS.VIDEO_GENERATION,
    'picture_book_4': POINT_COSTS.PICTURE_BOOK_4,
    'picture_book_8': POINT_COSTS.PICTURE_BOOK_8,
    'picture_book_12': POINT_COSTS.PICTURE_BOOK_12,
    'premium_voice_extra': POINT_COSTS.PREMIUM_VOICE_ADDITIONAL,

    // Graphic Novel - Creator's Studio
    'ai_asset_coaching': 5,    // Optional AI review per asset
    'graphic_novel_4': 100,   // 4 pages, short story
    'graphic_novel_8': 180,   // 8 pages, epic tale  
    'graphic_novel_12': 250,  // 12 pages, masterpiece
    'cartoon_book_4': 100,
    'cartoon_book_8': 180,
    'cartoon_book_12': 250,

    // Legacy mapping support
    'generate_audio_story': 25, // Standard story with OpenAI TTS
    'generate_audio_story_premium': 25 + POINT_COSTS.PREMIUM_VOICE_ADDITIONAL, // Story with ElevenLabs
    'generate_comic_book': POINT_COSTS.PICTURE_BOOK_4,
    'magic_mentor_video': POINT_COSTS.CREATIVE_JOURNEY_VIDEO,
    'magic_mirror_scan': 25,
    'magic_mirror_colorize': 25, // Standardized cost for colorization
    'magic_mentor_step': 25,      // Point cost for each step in Art Coach
    'masterpiece_match': 25,
    'generate_video_5s': 50,
    'generate_3d_model': 80,
    'generate_3d_model_basic': 50,
    'generate_3d_model_pro': 40
};

export interface PointLog {
    logId: string;
    userId: string;
    action: string;
    pointsChange: number;
    beforePoints: number;
    afterPoints: number;
    createdAt: string;
    reason?: string;
}

export class PointsService {

    constructor() {
        console.log('[PointsService] Initialized (Admin SDK)');
    }

    /**
     * Get user current points
     */
    async getBalance(userId: string): Promise<number> {
        if (!userId) return 0;
        try {
            const userRef = adminDb.collection('users').doc(userId);
            const userSnap = await userRef.get();

            // 1. New User / Guest Initialization (100 Gems)
            if (!userSnap.exists) {
                console.log(`[Points] New Guest Detected: ${userId}. Initializing with 100 Gems.`);
                // Create user doc
                await userRef.set({
                    points: 100,
                    createdAt: new Date().toISOString(),
                    lastDailyCheckIn: new Date().toISOString()
                });

                // Log Gift
                try {
                    await adminDb.collection('points_logs').doc(uuidv4()).set({
                        logId: uuidv4(),
                        userId,
                        action: 'welcome_gift',
                        pointsChange: 100,
                        beforePoints: 0,
                        afterPoints: 100,
                        reason: 'Awakening Gift (Guest Init)',
                        createdAt: new Date().toISOString()
                    });
                } catch (logErr) { console.error('Log failed', logErr); }

                return 100;
            }

            // 2. Existing User Logic
            const data = userSnap.data();
            let points = data?.points;

            if (points === undefined) {
                // Fix missing points field for existing users
                points = 100;
                await userRef.update({ points: 100 });
            }

            // 3. Daily Check-in (+10 Gems)
            const lastCheckIn = data?.lastDailyCheckIn;
            const now = new Date();
            const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

            let lastDate = '';
            if (lastCheckIn) {
                // Handle Firestore Timestamp or string
                const d = (lastCheckIn && typeof lastCheckIn.toDate === 'function') ? lastCheckIn.toDate() : new Date(lastCheckIn);
                // Check if valid date
                if (!isNaN(d.getTime())) {
                    lastDate = d.toISOString().split('T')[0];
                }
            }

            // Grant +10 if new day
            if (lastDate !== today) {
                console.log(`[Points] Daily Check-in for ${userId}: +10 Gems`);
                // Use grantPoints to handle logging and update
                await this.grantPoints(userId, 10, 'daily_checkin', 'Daily Login Bonus');

                // Update timestamp
                await userRef.update({ lastDailyCheckIn: now.toISOString() });
                points += 10;
            }

            return points || 0;
        } catch (error) {
            console.error('[Points] Get Balance/Init Error:', error);
            return 0;
        }
    }

    /**
     * Check if user has enough points (Non-transactional check)
     */
    async hasEnoughPoints(userId: string, action: string): Promise<{ enough: boolean, current: number, required: number }> {
        if (!userId) return { enough: false, current: 0, required: 0 };

        const cost = POINTS_COSTS[action] || 0;
        const current = await this.getBalance(userId);

        // Admin Bypass Logic (matches consumePoints)
        try {
            const userSnap = await adminDb.collection('users').doc(userId).get();
            if (userSnap.exists) {
                const userData = userSnap.data() || {};
                const isAdmin = (userData.plan === 'admin' || (userData.email || '').includes('cxddong') || (userData.points || 0) >= 10000);
                if (isAdmin) return { enough: true, current, required: cost };
            }
        } catch (e) {
            console.warn('[Points] Admin check failed in hasEnoughPoints, falling back to standard check');
        }

        return {
            enough: current >= cost,
            current,
            required: cost
        };
    }

    /**
     * Consume points Transactionally
     * Returns success/fail and new balance
     */
    async consumePoints(userId: string, action: string, costOverride?: number): Promise<{ success: boolean, before?: number, after?: number, error?: string }> {
        const cost = typeof costOverride === 'number' ? costOverride : POINTS_COSTS[action];
        if (cost === undefined) {
            console.error(`[Points] Unknown action: ${action}`);
            return { success: false, error: 'INVALID_ACTION' };
        }

        try {
            const result = await adminDb.runTransaction(async (transaction) => {
                // TEST/DEMO ACCOUNT BYPASS - DO THIS BEFORE DB FETCH TO ALLOW NON-EXISTENT USERS
                if (userId === 'demo' || userId.includes('test') || userId.includes('debug')) {
                    console.log(`[Points] TEST ACCOUNT BYPASS: User ${userId}. Skipping deduction.`);
                    return { success: true, before: 1000, after: 1000 };
                }

                const userRef = adminDb.collection('users').doc(userId);
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists) {
                    throw "USER_NOT_FOUND";
                }

                const userData = userDoc.data() || {};
                const currentPoints = userData.points || 0;
                const userEmail = userData.email || '';
                const userPlan = userData.plan || 'free';

                // ADMIN BYPASS: Users with 'admin' plan, 10000+ points OR admin emails are admins
                const isAdmin = userPlan === 'admin' || userEmail.includes('cxddong') || currentPoints >= 10000;

                if (isAdmin) {
                    console.log(`[Points] ADMIN BYPASS: User ${userId} (${userEmail}) - Plan: ${userPlan}, Points: ${currentPoints}. Skipping deduction.`);
                    return { success: true, before: currentPoints, after: currentPoints };
                }

                // --- POST-ADMIN CHECKS ---
                if (cost === undefined) {
                    console.error(`[Points] Unknown action: ${action}`);
                    throw "INVALID_ACTION";
                }

                const totalSpent = userData.totalSpentPoints || 0;

                if (currentPoints < cost) {
                    throw "NOT_ENOUGH_POINTS";
                }

                const newPoints = currentPoints - cost;
                const newTotalSpent = totalSpent + cost;

                // 1. Update User
                transaction.update(userRef, {
                    points: newPoints,
                    totalSpentPoints: newTotalSpent
                });

                // 2. Create Log
                const logRef = adminDb.collection('points_logs').doc();
                transaction.set(logRef, {
                    logId: uuidv4(),
                    userId,
                    action,
                    pointsChange: -cost,
                    beforePoints: currentPoints,
                    afterPoints: newPoints,
                    createdAt: new Date().toISOString()
                });

                return { success: true, before: currentPoints, after: newPoints };
            });

            if (result.success && result.before !== result.after) {
                console.log(`[Points] Consumed ${cost} for ${action}. User: ${userId}.`);
            }
            return result;

        } catch (e) {
            if (e === "NOT_ENOUGH_POINTS" || (e as any)?.message?.includes('NOT_ENOUGH_POINTS')) {
                return { success: false, error: 'NOT_ENOUGH_POINTS' };
            }
            console.error('[Points] Transaction Failed:', e);
            return { success: false, error: 'TRANSACTION_FAILED' };
        }
    }

    /**
     * Refund points (e.g. Generation Failed)
     */
    async refundPoints(userId: string, action: string, reason: string): Promise<{ success: boolean, newBalance?: number }> {
        const amount = POINTS_COSTS[action];
        if (!amount) return { success: false };

        try {
            await adminDb.runTransaction(async (transaction) => {
                const userRef = adminDb.collection('users').doc(userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw "USER_NOT_FOUND";

                const current = userDoc.data()?.points || 0;
                const newPoints = current + amount;

                transaction.update(userRef, { points: newPoints });

                const logRef = adminDb.collection('points_logs').doc();
                transaction.set(logRef, {
                    logId: uuidv4(),
                    userId,
                    action: `refund_${action}`,
                    pointsChange: amount,
                    beforePoints: current,
                    afterPoints: newPoints,
                    reason,
                    createdAt: new Date().toISOString()
                });
            });
            console.log(`[Points] Refunded ${amount} for ${action}. User: ${userId}.`);
            return { success: true };
        } catch (e) {
            console.error('[Points] Refund Failed:', e);
            return { success: false };
        }
    }

    /**
     * Grant points (Subscription / Top-up)
     */
    async grantPoints(userId: string, amount: number, action: string, reason?: string): Promise<{ success: boolean }> {
        if (amount <= 0) return { success: false };
        try {
            await adminDb.runTransaction(async (transaction) => {
                const userRef = adminDb.collection('users').doc(userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw "USER_NOT_FOUND";

                const current = userDoc.data()?.points || 0;
                const newPoints = current + amount;

                transaction.update(userRef, { points: newPoints });

                const logRef = adminDb.collection('points_logs').doc();
                transaction.set(logRef, {
                    logId: uuidv4(),
                    userId,
                    action: action,
                    pointsChange: amount,
                    beforePoints: current,
                    afterPoints: newPoints,
                    reason: reason || '',
                    createdAt: new Date().toISOString()
                });
            });
            console.log(`[Points] Granted ${amount} for ${action}. User: ${userId}.`);
            return { success: true };
        } catch (e) {
            console.error('[Points] Grant Failed:', e);
            return { success: false };
        }
    }

    /**
     * Redeem Promotion Code
     */
    async redeemCode(userId: string, code: string): Promise<{ success: boolean, pointsAdded?: number, error?: string }> {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) return { success: false, error: 'INVALID_CODE' };

        try {
            return await adminDb.runTransaction(async (transaction) => {
                // 1. Get Code
                const codeRef = adminDb.collection('promotion_codes').doc(cleanCode);
                const codeDoc = await transaction.get(codeRef);

                if (!codeDoc.exists) {
                    throw "INVALID_CODE"; // Code doesn't exist
                }

                const codeData = codeDoc.data();
                if (!codeData || !codeData.active) throw "INVALID_CODE"; // Inactive

                // Check Expiry
                if (codeData.expiresAt && new Date(codeData.expiresAt) < new Date()) {
                    throw "CODE_EXPIRED";
                }

                // Check Global Usage Limit
                if (codeData.maxUses && codeData.currentUses >= codeData.maxUses) {
                    throw "CODE_FULLY_REDEEMED";
                }

                // Check User Redemption (Prevent double dip)
                const redeemedBy = codeData.redeemedBy || [];
                if (redeemedBy.includes(userId)) {
                    throw "ALREADY_REDEEMED";
                }

                // 2. Get User
                const userRef = adminDb.collection('users').doc(userId);
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw "USER_NOT_FOUND";

                const currentPoints = userDoc.data()?.points || 0;
                const pointsToAdd = codeData.points || 0;
                const newPoints = currentPoints + pointsToAdd;

                // 3. Updates
                // Update Code Usage
                transaction.update(codeRef, {
                    currentUses: (codeData.currentUses || 0) + 1,
                    redeemedBy: [...redeemedBy, userId]
                });

                // Update User Points
                transaction.update(userRef, {
                    points: newPoints
                });

                // Log Transaction
                const logRef = adminDb.collection('points_logs').doc();
                transaction.set(logRef, {
                    logId: uuidv4(),
                    userId,
                    action: 'redeem_code',
                    pointsChange: pointsToAdd,
                    beforePoints: currentPoints,
                    afterPoints: newPoints,
                    reason: `Code: ${cleanCode}`,
                    createdAt: new Date().toISOString()
                });

                return { success: true, pointsAdded: pointsToAdd };
            });

        } catch (e: any) {
            console.error('[Points] Redeem Error:', e);
            // Return specific errors
            if (typeof e === 'string') return { success: false, error: e };
            return { success: false, error: 'REDEEM_FAILED' };
        }
    }

    /**
     * Get Logs
     */
    async getLogs(userId: string, limitCount = 20): Promise<PointLog[]> {
        try {
            const snap = await adminDb.collection('points_logs')
                .where('userId', '==', userId)
                // .orderBy('createdAt', 'desc') // Requires index
                .limit(limitCount)
                .get();

            const logs = snap.docs.map(d => d.data() as PointLog);
            return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (e) {
            console.error('[Points] Get Logs Failed:', e);
            return [];
        }
    }
}

export const pointsService = new PointsService();
