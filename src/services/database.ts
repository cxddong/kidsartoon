import { adminDb, adminStorage, admin } from './firebaseAdmin.js'; // Use centralized admin
import { v4 as uuidv4 } from 'uuid';
import { CreativeSeries } from '../types/mentor';

export interface ImageRecord {
    id: string; // Firestore ID usually, but we keep our UUID for compatibility
    userId: string;
    imageUrl: string;
    type: 'upload' | 'generated' | 'comic' | 'story' | 'animation' | 'picturebook' | 'masterpiece' | 'cards';
    createdAt: string;
    prompt?: string;
    meta?: any;
    favorite?: boolean;
}

export interface UserRecord {
    uid: string;
    name: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Neutral';
    photoUrl?: string;
    points: number; // Experience points (Legacy)
    credits: number; // Magic Lab Credits (New)
    createdAt: string;
    profileCompleted: boolean;
    password?: string;
    email?: string;
    isSubscribed?: boolean;
    plan?: 'basic' | 'pro';
    subscriptionPlatform?: string;
    subscriptionId?: string;
    subscriptionDate?: string;
}

export interface PointsHistoryRecord {
    id: string;
    userId: string;
    delta: number;
    reason: string;
    createdAt: string;
}

// Transaction Types
export type TransactionType =
    | 'MAGIC_LAB_CHAT'
    | 'IMAGE_TRANSFORM'
    | 'PREMIUM_TTS'      // NEW: ElevenLabs voice
    | 'REFUND'
    | 'SIGNUP_BONUS'
    | 'RECHARGE';

export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number; // Negative for deduction, Positive for refund/add
    type: TransactionType;
    reason: string;
    createdAt: string;
    meta?: any;
}

export interface DailyCheckIn {
    userId: string;
    lastCheckInDate: string; // YYYY-MM-DD
    currentStreak: number;
    updatedAt: string;
}

export class DatabaseService {

    constructor() {
        console.log('[DatabaseService] Initialized with Firebase Admin SDK');
    }

    // --- Storage ---
    public async uploadFile(buffer: Buffer, mimeType: string, folder: string = 'uploads'): Promise<string> {
        try {
            const ext = mimeType.split('/')[1] || 'bin';
            const filename = `${folder}/${uuidv4()}.${ext}`;
            const bucket = adminStorage.bucket();
            const file = bucket.file(filename);

            await file.save(buffer, {
                metadata: { contentType: mimeType },
                public: true // Make file public for legacy compatibility
            });

            // Return public URL (assumes default bucket)
            return `https://storage.googleapis.com/${bucket.name}/${filename}`;
        } catch (e) {
            console.error("Upload failed", e);
            throw e;
        }
    }

    // --- Video Tasks (Cost Tracking) ---
    public async saveVideoTask(taskId: string, userId: string, cost: number, prompt: string = '', meta: any = {}) {
        try {
            await adminDb.collection('video_tasks').doc(taskId).set({
                taskId,
                userId,
                cost,
                prompt,
                meta,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                refunded: false
            });
        } catch (e) { console.error('saveVideoTask failed', e); }
    }

    public async getVideoTask(taskId: string) {
        try {
            const snap = await adminDb.collection('video_tasks').doc(taskId).get();
            return snap.exists ? snap.data() : null;
        } catch (e) { return null; }
    }

    public async markTaskRefunded(taskId: string) {
        try {
            await adminDb.collection('video_tasks').doc(taskId).update({
                status: 'REFUNDED',
                refunded: true
            });
        } catch (e) { console.error('markTaskRefunded failed', e); }
    }

    public async markTaskCompleted(taskId: string) {
        try {
            await adminDb.collection('video_tasks').doc(taskId).update({
                status: 'COMPLETED'
            });
        } catch (e) { console.error('markTaskCompleted failed', e); }
    }

    // --- Images ---
    public async saveImageRecord(
        userId: string,
        imageUrl: string,
        type: 'upload' | 'generated' | 'comic' | 'story' | 'animation' | 'picturebook' | 'masterpiece' | 'cards',
        prompt?: string,
        meta?: any
    ): Promise<ImageRecord> {
        const id = uuidv4();
        const newRecord: ImageRecord = {
            id,
            userId,
            imageUrl,
            type,
            createdAt: new Date().toISOString(),
            prompt,
            meta: meta || {},
            favorite: false
        };

        try {
            await adminDb.collection('images').doc(id).set(newRecord);
            console.log(`[Database] Saved image record: ${id} (User: ${userId}, Type: ${type})`);
        } catch (e) {
            console.error('[Database] Failed to save image:', e);
            throw e;
        }
        return newRecord;
    }

    public async getUserImages(userId: string): Promise<ImageRecord[]> {
        try {
            const snapshot = await adminDb.collection('images')
                .where("userId", "==", userId)
                .get();

            const results = snapshot.docs.map(d => {
                const data = d.data() as ImageRecord;
                return {
                    ...data,
                    id: data.id || d.id
                };
            });
            // Sort in memory (descending by createdAt)
            return results.sort((a, b) => {
                const timeA = new Date(a.createdAt || 0).getTime();
                const timeB = new Date(b.createdAt || 0).getTime();
                return timeB - timeA;
            });
        } catch (e) {
            console.error('[Database] Failed to get user images:', e);
            return [];
        }
    }

    public async getUser(userId: string): Promise<UserRecord | null> {
        try {
            const snap = await adminDb.collection('users').doc(userId).get();
            if (snap.exists) {
                const data = snap.data() as UserRecord;
                if (data.credits === undefined) {
                    data.credits = 0;
                }
                return data;
            }
            return null;
        } catch (e) {
            console.error('[Database] getUser failed', e);
            return null;
        }
    }

    public async toggleFavorite(id: string, userId: string): Promise<ImageRecord | null> {
        try {
            const snapshot = await adminDb.collection('images')
                .where("id", "==", id)
                .where("userId", "==", userId)
                .get();

            if (snapshot.empty) return null;

            const docRef = snapshot.docs[0].ref;
            const data = snapshot.docs[0].data() as ImageRecord;
            const newVal = !data.favorite;

            await docRef.update({ favorite: newVal });

            return { ...data, favorite: newVal };
        } catch (e) {
            console.error('[Database] Toggle fav failed:', e);
            return null;
        }
    }

    public async deleteImage(id: string, userId: string): Promise<boolean> {
        try {
            const snapshot = await adminDb.collection('images')
                .where("id", "==", id)
                .where("userId", "==", userId)
                .get();

            if (snapshot.empty) return false;

            await snapshot.docs[0].ref.delete();
            return true;
        } catch (e) {
            console.error('[Database] Delete failed:', e);
            return false;
        }
    }

    // --- Likes System ---
    public async toggleLike(userId: string, imageId: string): Promise<boolean> {
        try {
            const snapshot = await adminDb.collection('likes')
                .where("userId", "==", userId)
                .where("imageId", "==", imageId)
                .get();

            if (!snapshot.empty) {
                await snapshot.docs[0].ref.delete();
                return false;
            } else {
                await adminDb.collection('likes').add({
                    userId,
                    imageId,
                    createdAt: new Date().toISOString()
                });
                return true;
            }
        } catch (e) {
            console.error('[Database] Toggle like failed:', e);
            return false;
        }
    }

    public async getLikedImageIds(userId: string): Promise<string[]> {
        try {
            const snapshot = await adminDb.collection('likes').where("userId", "==", userId).get();
            return snapshot.docs.map(d => d.data().imageId);
        } catch (e) {
            return [];
        }
    }

    public async getLikedImages(userId: string): Promise<ImageRecord[]> {
        try {
            const imageIds = await this.getLikedImageIds(userId);
            if (imageIds.length === 0) return [];

            const images: ImageRecord[] = [];
            for (const id of imageIds) {
                const snap = await adminDb.collection('images').where("id", "==", id).get();
                if (!snap.empty) images.push(snap.docs[0].data() as ImageRecord);
            }
            return images;
        } catch (e) {
            console.error('[Database] Get Liked Images failed:', e);
            return [];
        }
    }

    public async saveFeedback(id: string, feedback: string): Promise<boolean> {
        try {
            const snapshot = await adminDb.collection('images').where("id", "==", id).get();

            if (snapshot.empty) {
                console.warn(`[Database] Image with id ${id} not found for feedback.`);
                return false;
            }

            const docRef = snapshot.docs[0].ref;
            const data = snapshot.docs[0].data() as ImageRecord;
            const meta = data.meta || {};
            meta.feedback = feedback;

            await docRef.update({ meta });
            console.log(`[Database] Feedback saved for ${id}`);
            return true;
        } catch (e) {
            console.error('[Database] Save feedback failed:', e);
            return false;
        }
    }

    public async getPublicImages(type?: string): Promise<ImageRecord[]> {
        try {
            let ref: any = adminDb.collection('images');
            if (type) {
                ref = ref.where("type", "==", type).orderBy("createdAt", "desc").limit(50);
            } else {
                ref = ref.orderBy("createdAt", "desc").limit(50);
            }
            const snapshot = await ref.get();
            return snapshot.docs.map((d: any) => d.data() as ImageRecord);
        } catch (e) {
            console.error('[Database] Public images failed:', e);
            return [];
        }
    }

    // --- Users ---
    public async getUserProfile(uid: string): Promise<UserRecord | null> {
        try {
            const snap = await adminDb.collection('users').doc(uid).get();
            if (snap.exists) {
                const data = snap.data() as UserRecord;
                if (data.credits === undefined) {
                    data.credits = 0;
                }
                return data;
            }
            return null;
        } catch (e) {
            console.error('[Database] Get user failed:', e);
            return null;
        }
    }

    public async updateUserProfile(uid: string, data: Partial<UserRecord>): Promise<UserRecord> {
        try {
            const userRef = adminDb.collection('users').doc(uid);
            const snap = await userRef.get();

            if (snap.exists) {
                await userRef.update(data);
                return { ...snap.data(), ...data } as UserRecord;
            } else {
                // ** NEW USER CREATION LOGIC **
                const newUser: UserRecord = {
                    uid,
                    name: data.name || 'New Artist',
                    points: data.points || 0,
                    credits: 50, // ** FREE 50 CREDITS FOR NEW USERS **
                    createdAt: new Date().toISOString(),
                    profileCompleted: data.profileCompleted || false,
                    email: data.email,
                    ...data
                } as UserRecord;

                await userRef.set(newUser);

                // Log the signup bonus
                await this.logCreditTransaction(uid, 50, 'SIGNUP_BONUS', 'Welcome Gift');

                return newUser;
            }
        } catch (e) {
            console.error('[Database] Update user failed:', e);
            throw e;
        }
    }

    public async getUserByEmail(email: string): Promise<UserRecord | null> {
        try {
            const snapshot = await adminDb.collection('users').where("email", "==", email).get();
            if (snapshot.empty) return null;
            return snapshot.docs[0].data() as UserRecord;
        } catch (e) { return null; }
    }

    public async createUser(data: Partial<UserRecord> & { email: string; uid: string }): Promise<UserRecord> {
        return this.updateUserProfile(data.uid, data);
    }

    // --- Points (XP) ---
    public async awardPoints(userId: string, amount: number, reason: string): Promise<number> {
        try {
            const user = await this.getUserProfile(userId);
            let currentPoints = user ? user.points : 0;
            const newPoints = currentPoints + amount;

            await this.updateUserProfile(userId, { points: newPoints });

            await adminDb.collection('points_history').add({
                id: uuidv4(),
                userId,
                delta: amount,
                reason,
                createdAt: new Date().toISOString()
            });

            console.log(`[Points] Awarded ${amount} to ${userId} for ${reason}. Total: ${newPoints}`);
            return newPoints;
        } catch (e) {
            console.error('[Database] Award points failed:', e);
            return 0;
        }
    }

    public async getPointsHistory(userId: string): Promise<PointsHistoryRecord[]> {
        try {
            const snapshot = await adminDb.collection('points_history')
                .where("userId", "==", userId)
                .orderBy("createdAt", "desc")
                .get();
            return snapshot.docs.map(d => d.data() as PointsHistoryRecord);
        } catch (e) { return []; }
    }

    // --- MAGIC CREDITS SYSTEM ---

    public async logCreditTransaction(
        userId: string,
        amount: number,
        type: CreditTransaction['type'],
        reason: string
    ) {
        try {
            await adminDb.collection('credit_transactions').add({
                userId,
                amount,
                type,
                reason,
                createdAt: new Date().toISOString()
            });
        } catch (e) { console.error('Log credit failed', e); }
    }

    public async deductCredits(userId: string, amount: number, reason: string, type: CreditTransaction['type']): Promise<boolean> {
        const userRef = adminDb.collection('users').doc(userId);

        try {
            return await adminDb.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw "User does not exist!";

                const userData = userDoc.data() as UserRecord;
                const currentCredits = userData.credits || 0;

                if (currentCredits < amount) {
                    return false; // Insufficient funds
                }

                const newBalance = currentCredits - amount;
                transaction.update(userRef, { credits: newBalance });

                return true;
            });
        } catch (e) {
            console.error("Deduct credits failed", e);
            return false;
        }
    }

    public async refundCredits(userId: string, amount: number, reason: string): Promise<void> {
        try {
            const userRef = adminDb.collection('users').doc(userId);
            await userRef.update({
                credits: admin.firestore.FieldValue.increment(amount)
            });
            await this.logCreditTransaction(userId, amount, 'REFUND', reason);
        } catch (e) {
            console.error("Refund failed", e);
        }
    }

    // --- TTS Cache Management ---
    public async getCachedAudio(cacheKey: string): Promise<string | null> {
        try {
            const snap = await adminDb.collection('tts_cache').doc(cacheKey).get();
            if (snap.exists) {
                const data = snap.data();
                return data?.audioUrl || null;
            }
            return null;
        } catch (e) {
            console.warn('[Database] getCachedAudio failed:', e);
            return null;
        }
    }

    public async saveCachedAudio(cacheKey: string, audioUrl: string): Promise<void> {
        try {
            await adminDb.collection('tts_cache').doc(cacheKey).set({
                cacheKey,
                audioUrl,
                createdAt: new Date().toISOString()
            });
        } catch (e) {
            console.error('[Database] saveCachedAudio failed:', e);
        }
    }

    // --- Magic Mentor (Creative Series) ---
    public async getCreativeSeries(seriesId: string): Promise<CreativeSeries | null> {
        try {
            const snap = await adminDb.collection('creative_series').doc(seriesId).get();
            return snap.exists ? snap.data() as CreativeSeries : null;
        } catch (e) {
            console.error('[Database] getCreativeSeries failed:', e);
            return null;
        }
    }

    public async saveCreativeSeries(series: CreativeSeries): Promise<void> {
        try {
            await adminDb.collection('creative_series').doc(series.id).set({
                ...series,
                updatedAt: Date.now()
            });
            console.log(`[Database] Saved creative series: ${series.id} (User: ${series.userId}, Step: ${series.currentStep})`);
        } catch (e) {
            console.error('[Database] saveCreativeSeries failed:', e);
            throw e;
        }
    }

    public async getUserActiveSeries(userId: string): Promise<CreativeSeries | null> {
        try {
            const snapshot = await adminDb.collection('creative_series')
                .where('userId', '==', userId)
                .where('status', '==', 'active')
                .limit(1)
                .get();

            if (snapshot.empty) return null;
            return snapshot.docs[0].data() as CreativeSeries;
        } catch (e) {
            console.error('[Database] getUserActiveSeries failed:', e);
            return null;
        }
    }

    // --- Daily Treasure Hunt Check-in ---
    public async getCheckInStatus(userId: string): Promise<{ streak: number, lastCheckInDate: string | null, canCheckIn: boolean, nextReward: number, dayCycle: number }> {
        try {
            const checkInRef = adminDb.collection('daily_checkins').doc(userId);
            const snap = await checkInRef.get();

            if (!snap.exists) {
                return { streak: 0, lastCheckInDate: null, canCheckIn: true, nextReward: 2, dayCycle: 1 };
            }

            const data = snap.data()!;
            const lastDate = data.lastCheckInDate; // YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];

            let streak = data.currentStreak || 0;
            const canCheckIn = lastDate !== today;

            if (lastDate && lastDate !== today) {
                const last = new Date(lastDate);
                const current = new Date(today);
                const diffTime = Math.abs(current.getTime() - last.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 1) {
                    streak = 0;
                }
            }

            const dayCycle = (streak) % 7 + 1;
            const rewardsMap: Record<number, number> = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 5, 6: 5, 7: 10 };
            const nextReward = rewardsMap[dayCycle] || 2;

            return { streak, lastCheckInDate: lastDate, canCheckIn, nextReward, dayCycle };

        } catch (e) {
            console.error('[Database] getCheckInStatus failed:', e);
            throw e;
        }
    }

    public async performCheckIn(userId: string, isVip: boolean): Promise<{ success: boolean, points: number, dayCycle: number, newStreak: number, message?: string }> {
        const today = new Date().toISOString().split('T')[0];
        const checkInRef = adminDb.collection('daily_checkins').doc(userId);
        const userRef = adminDb.collection('users').doc(userId);

        try {
            return await adminDb.runTransaction(async (transaction) => {
                const checkInDoc = await transaction.get(checkInRef);
                let streak = 0;

                if (checkInDoc.exists) {
                    const data = checkInDoc.data()!;
                    if (data.lastCheckInDate === today) {
                        return { success: false, points: 0, dayCycle: 0, newStreak: data.currentStreak, message: "Already checked in today" };
                    }

                    const lastDate = new Date(data.lastCheckInDate);
                    const currentDate = new Date(today);
                    const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        streak = data.currentStreak + 1;
                    } else {
                        streak = 1;
                    }
                } else {
                    streak = 1;
                }

                const dayCycle = (streak - 1) % 7 + 1;
                const rewardsMap: Record<number, number> = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 5, 6: 5, 7: 10 };
                let basePoints = rewardsMap[dayCycle] || 2;

                if (isVip) {
                    basePoints *= 2;
                }

                transaction.set(checkInRef, {
                    userId,
                    lastCheckInDate: today,
                    currentStreak: streak,
                    updatedAt: new Date().toISOString()
                }, { merge: true });

                transaction.update(userRef, {
                    credits: admin.firestore.FieldValue.increment(basePoints)
                });

                return { success: true, points: basePoints, dayCycle, newStreak: streak };
            });
        } catch (e) {
            console.error('[Database] performCheckIn failed:', e);
            throw e;
        }
    }

    // --- USAGE TRACKING ---
    async getUserDailyUsage(userId: string, type: string): Promise<number> {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Using history or images collection. Based on getUserImages, it seems we use 'images' collection.
            // But legacy code might have used subcollection. Let's aim for 'images' collection query.
            const snapshot = await adminDb.collection('images')
                .where('userId', '==', userId)
                .where('type', '==', type)
                .where('createdAt', '>=', today.toISOString())
                .get();

            return snapshot.size;
        } catch (error) {
            console.error("[DB] Failed to get daily usage:", error);
            return 0;
        }
    }

    async findCachedGenerations(userId: string, imageHash: string): Promise<any | null> {
        try {
            // Check main images collection first, assuming 'meta.imageHash' is what we want
            const snapshot = await adminDb.collection('images')
                .where('userId', '==', userId)
                .where('meta.imageHash', '==', imageHash)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

            if (!snapshot.empty) {
                return snapshot.docs[0].data();
            }
            return null;
        } catch (error) {
            console.error("[DB] Cache lookup failed:", error);
            return null;
        }
    }

    // --- GRAPHIC NOVEL MANAGEMENT ---

    async saveGraphicNovelTask(task: any): Promise<void> {
        try {
            await adminDb.collection('graphic_novel_tasks').doc(task.id).set(task);
            console.log(`[Database] Saved graphic novel task: ${task.id}`);
        } catch (e) {
            console.error('[Database] saveGraphicNovelTask failed:', e);
            throw e;
        }
    }

    async updateGraphicNovelTask(taskId: string, updates: any): Promise<void> {
        try {
            await adminDb.collection('graphic_novel_tasks').doc(taskId).update(updates);
        } catch (e) {
            console.error('[Database] updateGraphicNovelTask failed:', e);
            throw e;
        }
    }

    async getGraphicNovelTask(taskId: string): Promise<any | null> {
        try {
            const snap = await adminDb.collection('graphic_novel_tasks').doc(taskId).get();
            return snap.exists ? snap.data() : null;
        } catch (e) {
            console.error('[Database] getGraphicNovelTask failed:', e);
            return null;
        }
    }

    async getGraphicNovel(id: string): Promise<any | null> {
        try {
            const snap = await adminDb.collection('graphic_novel_tasks').doc(id).get();
            if (snap.exists) {
                const data = snap.data();
                // Only return completed novels
                if (data?.status === 'COMPLETED') {
                    return data;
                }
            }
            return null;
        } catch (e) {
            console.error('[Database] getGraphicNovel failed:', e);
            return null;
        }
    }

    async getUserGraphicNovels(userId: string): Promise<any[]> {
        try {
            const snapshot = await adminDb.collection('graphic_novel_tasks')
                .where('userId', '==', userId)
                .where('status', '==', 'COMPLETED')
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(d => d.data());
        } catch (e) {
            console.error('[Database] getUserGraphicNovels failed:', e);
            return [];
        }
    }
}

export const databaseService = new DatabaseService();
