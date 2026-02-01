import { adminDb, adminStorage, admin } from './firebaseAdmin.js'; // Use centralized admin
import { v4 as uuidv4 } from 'uuid';
import { CreativeSeries } from '../types/mentor';

export interface ImageRecord {
    id: string; // Firestore ID usually, but we keep our UUID for compatibility
    userId: string;
    imageUrl: string;
    type: 'upload' | 'generated' | 'comic' | 'story' | 'animation' | 'picturebook' | 'masterpiece' | 'cards' | 'graphic-novel' | 'cartoon-book';
    createdAt: string;
    prompt?: string;
    meta?: any;
    favorite?: boolean;
    colorPalette?: string[]; // Hex codes
    dominantColor?: string;
}


export interface UserRecord {
    uid: string;
    name: string;
    age?: number;
    gender?: 'Male' | 'Female' | 'Neutral';
    photoUrl?: string;
    language?: string;     // Added for parent customization
    interests?: string[];  // Added for parent customization
    points: number; // Experience points (Legacy)
    credits: number; // Magic Lab Credits (New)
    createdAt: string;
    profileCompleted: boolean;
    password?: string;
    email?: string;
    isSubscribed?: boolean;
    plan?: 'basic' | 'pro' | 'yearly' | 'explorer'; // Updated for new tiers
    subscriptionPlatform?: string;
    subscriptionId?: string;
    subscriptionDate?: string;
    profiles?: ChildProfile[];
    currentProfileId?: string;
    parentPin?: string; // Hashed or simple 4-digit PIN for Parent Dashboard
}

export interface ChildProfile {
    id: string;
    name: string;
    avatar: string;
    age?: number;
    theme?: string;
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



export interface WeeklyReport {
    id?: string;
    weekId: string; // e.g. "2024-W10"
    userId: string;
    childProfileId?: string;
    createdAt: number;
    stats: {
        uploadCount: number;
        videoCount: number;
        storyCount?: number;
        comicCount?: number;
        magicImageCount?: number;
        bookCount?: number;
        cardCount?: number;
        puzzleCount?: number;
        totalScreenTimeMinutes: number;
        chatMessages?: number;
    };
    artAnalysis: {
        dominantColors: string[];
        topSubjects: string[];
        // NEW V2.0 Professional Radar
        scores: {
            colorIQ: number;      // Color Perception
            spatial: number;      // Composition/Perspective
            motorSkill: number;   // Line control
            creativity: number;   // Imagination
            focus: number;        // Detail/Completion
        };
        // Legacy Support (Optional)
        radarScores?: {
            composition: number;
            color: number;
            imagination: number;
            line: number;
            story: number;
        };
        colorTrend: string;
        colorPsychologyText: string;
        careerSuggestion: string;
        adviceText: string;
        developmentStage: string;      // Lowenfeld Stage (e.g. Preschematic)
        developmentEvidence: string;   // Why this stage?
    };
    aiCommentary: {
        strength: string;
        weakness: string;
        potentialCareer: string;
        careerReason: string;
        learningStyle: string;
        psychologicalAnalysis: string; // Deep psychiatric insight
        moodTrend: 'Improving' | 'Stable' | 'Fluctuating';
        parentActionPlan: string[];    // Array of tips
    };
    analyzedArtworks?: string[]; // IDs of 5 core works
    isFinal?: boolean;
}

export interface UserFeedback {
    id: string;
    userId: string;
    rating: number; // 1-5
    comment?: string;
    createdAt: string;
    meta?: any;
}

export interface PortfolioReport {
    id: string;
    userId: string;
    childName?: string;
    createdAt: number;
    imageCount: number;
    cost: number;
    analyzedImages?: string[];
    psychologicalProfile: {
        colorTrends: string;
        contentProjection: string;
        emotionalState: string;
    };
    scores: {
        colorIQ: number;
        spatial: number;
        motorSkill: number;
        creativity: number;
        focus: number;
    };
    topPicks: Array<{
        imageId: string;
        imageUrl: string;
        strength: string;
        reason: string;
        recommendation: {
            target: string;
            label: string;
            cta: string;
        };
    }>;
}

export class DatabaseService {

    constructor() {
        console.log('[DatabaseService] Initialized with Firebase Admin SDK');
    }

    // --- Reports ---
    public async saveReport(userId: string, report: WeeklyReport): Promise<string> {
        // Use ID if provided, else auto-gen
        const reportId = report.id || adminDb.collection('reports').doc().id;
        await adminDb.collection('reports').doc(reportId).set({ ...report, id: reportId });
        return reportId;
    }

    public async getReportByWeek(userId: string, weekId: string, childProfileId?: string): Promise<WeeklyReport | null> {
        let query = adminDb.collection('reports')
            .where('userId', '==', userId)
            .where('weekId', '==', weekId);

        if (childProfileId) {
            query = query.where('childProfileId', '==', childProfileId);
        }

        const snap = await query.limit(1).get();
        if (snap.empty) return null;
        return snap.docs[0].data() as WeeklyReport;
    }

    public async getLatestReport(userId: string, childProfileId?: string): Promise<WeeklyReport | null> {
        let query = adminDb.collection('reports')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(1);

        if (childProfileId) {
            query = query.where('childProfileId', '==', childProfileId);
        }

        const snap = await query.get();
        if (snap.empty) return null;
        return snap.docs[0].data() as WeeklyReport;
    }

    // --- Portfolio Scanner ---
    public async savePortfolioReport(report: PortfolioReport): Promise<void> {
        await adminDb.collection('portfolio_reports').doc(report.id).set(report);
    }

    public async getPortfolioReport(reportId: string): Promise<PortfolioReport | null> {
        const snap = await adminDb.collection('portfolio_reports').doc(reportId).get();
        return snap.exists ? snap.data() as PortfolioReport : null;
    }

    public async getUserPortfolioReports(userId: string): Promise<PortfolioReport[]> {
        const snap = await adminDb.collection('portfolio_reports')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .get();
        return snap.docs.map(doc => doc.data() as PortfolioReport);
    }

    // --- Storage ---
    public async uploadFile(buffer: Buffer, mimeType: string, folder: string = 'uploads'): Promise<string> {
        try {
            const ext = mimeType.split('/')[1] || 'bin';
            const filename = `${folder}/${uuidv4()}.${ext}`;
            const bucket = adminStorage.bucket();
            const file = bucket.file(filename);

            // Generate download token for public URL access (bypasses CORS)
            const downloadToken = uuidv4();

            await file.save(buffer, {
                metadata: {
                    contentType: mimeType,
                    metadata: {
                        firebaseStorageDownloadTokens: downloadToken
                    }
                }
            });

            // Return public URL with download token (accessible from browser without CORS issues)
            return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${downloadToken}`;
        } catch (e) {
            console.error("Upload failed", e);
            throw e;
        }
    }

    // --- Video Tasks (Cost Tracking) ---
    public async saveVideoTask(taskId: string, userId: string, cost: number, prompt: string = '', meta: any = {}, profileId?: string) {
        try {
            await adminDb.collection('video_tasks').doc(taskId).set({
                taskId,
                userId,
                profileId, // Save profileId
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

    public async updateVideoTask(taskId: string, updates: any) {
        try {
            await adminDb.collection('video_tasks').doc(taskId).update(updates);
        } catch (e) { console.error('updateVideoTask failed', e); }
    }

    public async markTaskRefunded(taskId: string) {
        try {
            await adminDb.collection('video_tasks').doc(taskId).update({
                status: 'REFUNDED',
                refunded: true
            });
        } catch (e) { console.error('markTaskRefunded failed', e); }
    }

    public async markTaskCompleted(taskId: string, videoUrl?: string) {
        try {
            const updateData: any = { status: 'COMPLETED' };
            if (videoUrl) updateData.videoUrl = videoUrl;

            await adminDb.collection('video_tasks').doc(taskId).update(updateData);
        } catch (e) { console.error('markTaskCompleted failed', e); }
    }

    // --- Images ---
    public async saveImageRecord(
        userId: string,
        imageUrl: string,
        type: 'upload' | 'generated' | 'comic' | 'story' | 'animation' | 'picturebook' | 'masterpiece' | 'cards' | 'graphic-novel' | 'cartoon-book',
        prompt?: string,
        meta?: any,
        profileId?: string // Optional profile ID for child profiles
    ): Promise<ImageRecord> {
        const id = uuidv4();
        const newRecord: ImageRecord = {
            id,
            userId,
            imageUrl,
            type,
            createdAt: new Date().toISOString(),
            prompt,
            meta: { ...meta, profileId }, // Store profileId in meta for now (since root-level schema changes are harder)
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

    public async getUserImages(userId: string, profileId?: string): Promise<ImageRecord[]> {
        try {
            // 1. Fetch Primary Images (Assets)
            const imagesSnap = await adminDb.collection('images')
                .where("userId", "==", userId)
                .get();

            let results = imagesSnap.docs.map(d => {
                const data = d.data() as ImageRecord;
                return { ...data, id: data.id || d.id };
            });

            // 2. Fetch Backup Tasks (Recover lost items)
            // If an item failed to save to 'images' but exists in 'video_tasks' with a URL, recover it.
            const existingTaskIds = new Set(results.map(r => r.meta?.taskId).filter(Boolean));

            try {
                const tasksSnap = await adminDb.collection('video_tasks')
                    .where("userId", "==", userId)
                    .where("status", "==", "COMPLETED") // Only finished tasks
                    .get();

                const tasks = tasksSnap.docs.map(d => d.data());

                for (const task of tasks) {
                    // processing logic: if task has videoUrl AND isn't already in results
                    if (task.videoUrl && task.taskId && !existingTaskIds.has(task.taskId)) {
                        console.log(`[Database] Recovering lost video from task ${task.taskId}`);
                        // Map task to ImageRecord format
                        const recoveredImage: ImageRecord = {
                            id: task.taskId, // Use task ID as Image ID
                            userId: task.userId,
                            imageUrl: task.videoUrl,
                            type: 'animation',
                            createdAt: task.createdAt || new Date().toISOString(),
                            prompt: task.prompt,
                            meta: {
                                ...task.meta,
                                taskId: task.taskId,
                                recovered: true,
                                profileId: task.profileId || task.meta?.profileId // Ensure profileId is carried over
                            },
                            favorite: false
                        };
                        results.push(recoveredImage);
                    }
                }
            } catch (err) {
                console.warn('[Database] Failed to fetch video_tasks backup:', err);
            }

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

    public async transferLegacyHistory(userId: string, targetProfileId: string): Promise<number> {
        try {
            // Find all images for this user that DO NOT have a profileId (Legacy)
            // OR explicitly match the userId (Parent items)
            const snapshot = await adminDb.collection('images')
                .where("userId", "==", userId)
                .get();

            if (snapshot.empty) return 0;

            if (snapshot.empty) return 0;

            let count = 0;
            const CHUNK_SIZE = 100; // Reduced from 400 to 100 for maximum safety

            const docsToUpdate = snapshot.docs.filter(doc => {
                const data = doc.data() as ImageRecord;
                const currentPid = data.meta?.profileId;
                return !currentPid || currentPid === userId;
            });

            // Process chunks
            for (let i = 0; i < docsToUpdate.length; i += CHUNK_SIZE) {
                const chunk = docsToUpdate.slice(i, i + CHUNK_SIZE);
                const batch = adminDb.batch();

                chunk.forEach(doc => {
                    const data = doc.data() as ImageRecord;
                    const meta = data.meta || {};
                    batch.update(doc.ref, {
                        meta: { ...meta, profileId: targetProfileId }
                    });
                });

                await batch.commit();
                count += chunk.length;
                console.log(`[Database] Transferred chunk ${i / CHUNK_SIZE + 1}: ${chunk.length} items.`);
            }

            console.log(`[Database] Transferred total ${count} items to profile ${targetProfileId}`);
            return count;

        } catch (e) {
            console.error('[Database] Transfer failed:', e);
            throw e;
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

    public async saveUserFeedback(userId: string, rating: number, comment?: string): Promise<string> {
        try {
            const id = uuidv4();
            const feedback: UserFeedback = {
                id,
                userId,
                rating,
                comment,
                createdAt: new Date().toISOString()
            };
            await adminDb.collection('user_feedback').doc(id).set(feedback);
            console.log(`[Database] User feedback saved: ${id} (User: ${userId}, Rating: ${rating})`);
            return id;
        } catch (e) {
            console.error('[Database] Save user feedback failed:', e);
            throw e;
        }
    }

    public async getAllUserFeedback(): Promise<UserFeedback[]> {
        try {
            const snap = await adminDb.collection('user_feedback').orderBy('createdAt', 'desc').get();
            return snap.docs.map(doc => doc.data() as UserFeedback);
        } catch (e) {
            console.error('[Database] Get All User Feedback failed:', e);
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

    // --- Cleanup & Maintenance ---
    public async cleanupFailedImages(userId?: string): Promise<{ deleted: number, scanned: number }> {
        try {
            console.log(userId ? `[Database] Starting cleanup for user: ${userId}` : `[Database] Starting GLOBAL cleanup...`);
            let query: FirebaseFirestore.Query = adminDb.collection('images');

            if (userId) {
                query = query.where('userId', '==', userId);
            } else {
                query = query.orderBy('createdAt', 'desc').limit(300); // Safety limit for global scan via API
            }

            const snapshot = await query.get();
            let deletedCount = 0;
            const batch = adminDb.batch();
            let currentBatchSize = 0;
            const batchLimit = 400;

            console.log(`[Database] Scanning ${snapshot.size} records for dead links...`);

            // Helper for URL check
            const checkUrl = async (url: string) => {
                if (!url || !url.startsWith('http')) return false;
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 4000);
                    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
                    clearTimeout(timeoutId);
                    return res.ok;
                } catch {
                    return false;
                }
            };

            for (const doc of snapshot.docs) {
                const data = doc.data() as ImageRecord;
                const url = data.imageUrl;

                let isDead = false;

                // 1. Syntax Check
                if (!url || url.length < 10 || url.includes('undefined')) {
                    isDead = true;
                }
                // 2. Content Check for Stories (New)
                else if (data.type === 'story' || (data.type as string) === 'audio') {
                    // If it's a story but has no text AND no audio, it's garbage.
                    const hasStory = !!(data.meta?.story || data.meta?.bookData);
                    const hasAudio = !!(data.meta?.audioUrl && data.meta.audioUrl.length > 10);

                    if (!hasStory && !hasAudio) {
                        // console.log(`[Cleanup] Found empty story/audio record: ${data.id}`);
                        isDead = true;
                    }
                }
                // 3. Active Check (Real deletion of 403/404s)
                else {
                    const alive = await checkUrl(url);
                    if (!alive) isDead = true;
                }


                if (isDead) {
                    batch.delete(doc.ref);
                    deletedCount++;
                    currentBatchSize++;
                    if (currentBatchSize >= batchLimit) break;
                }
            }

            if (currentBatchSize > 0) {
                await batch.commit();
            }

            console.log(`[Database] Cleanup finished. Deleted ${deletedCount} records.`);
            return { deleted: deletedCount, scanned: snapshot.size };

        } catch (e) {
            console.error('[Database] Cleanup failed:', e);
            throw e;
        }
    }

    // --- Rest Reminder: Get Random Story ---
    public async getRandomCommunityStory(): Promise<ImageRecord | null> {
        try {
            // Fetch a pool of recent stories (e.g., last 50) to pick from
            // We prioritize 'story' (generated audio stories) or 'audio' if any
            const snapshot = await adminDb.collection('images')
                .where("type", "in", ["story", "audio"])
                .orderBy("createdAt", "desc")
                .limit(50)
                .get();

            if (snapshot.empty) return null;

            const docs = snapshot.docs;
            const randomIndex = Math.floor(Math.random() * docs.length);
            return docs[randomIndex].data() as ImageRecord;

        } catch (e) {
            console.error('[Database] getRandomCommunityStory failed:', e);
            return null;
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
                .limit(10) // Fetch a few to find the latest
                .get();

            if (snapshot.empty) return null;

            const seriesList = snapshot.docs.map(d => d.data() as CreativeSeries);
            // Sort to get the most recent one
            seriesList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

            return seriesList[0];
        } catch (e) {
            console.error('[Database] getUserActiveSeries failed:', e);
            return null;
        }
    }

    public async getUserCreativeHistory(userId: string): Promise<CreativeSeries[]> {
        try {
            const snapshot = await adminDb.collection('creative_series')
                .where('userId', '==', userId)
                .limit(50) // Increase limit slightly since we filter/sort in memory
                .get();

            const series = snapshot.docs.map(d => d.data() as CreativeSeries);
            // Sort in memory: newest first
            return series.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        } catch (e) {
            console.error('[Database] getUserCreativeHistory failed:', e);
            return [];
        }
    }

    // --- Daily Treasure Hunt Check-in ---
    public async getCheckInStatus(userId: string): Promise<{ streak: number, lastCheckInDate: string | null, canCheckIn: boolean, nextReward: number, dayCycle: number }> {
        try {
            const checkInRef = adminDb.collection('daily_checkins').doc(userId);
            const userRef = adminDb.collection('users').doc(userId);

            const [checkInSnap, userSnap] = await Promise.all([
                checkInRef.get(),
                userRef.get()
            ]);

            // Determine Reward based on Plan
            let rewardAmount = 10; // Default / Explorer
            if (userSnap.exists) {
                const userData = userSnap.data() as UserRecord;
                const plan = userData.plan || 'explorer';

                if (plan === 'basic') rewardAmount = 30;
                else if (plan === 'pro' || plan === 'yearly') rewardAmount = 50;
            }

            if (!checkInSnap.exists) {
                return { streak: 0, lastCheckInDate: null, canCheckIn: true, nextReward: rewardAmount, dayCycle: 1 };
            }

            const data = checkInSnap.data()!;
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
            // Removed legacy 7-day cycle map logic in favor of flat tier-based rewards

            return { streak, lastCheckInDate: lastDate, canCheckIn, nextReward: rewardAmount, dayCycle };

        } catch (e) {
            console.error('[Database] getCheckInStatus failed:', e);
            throw e;
        }
    }

    public async performCheckIn(userId: string): Promise<{ success: boolean, points: number, dayCycle: number, newStreak: number, message?: string }> {
        const today = new Date().toISOString().split('T')[0];
        const checkInRef = adminDb.collection('daily_checkins').doc(userId);
        const userRef = adminDb.collection('users').doc(userId);

        try {
            return await adminDb.runTransaction(async (transaction) => {
                const [checkInDoc, userDoc] = await Promise.all([
                    transaction.get(checkInRef),
                    transaction.get(userRef)
                ]);

                // Determine Points based on Tier
                let basePoints = 10;
                if (userDoc.exists) {
                    const userData = userDoc.data() as UserRecord;
                    const plan = userData.plan || 'explorer';
                    if (plan === 'basic') basePoints = 30;
                    else if (plan === 'pro' || plan === 'yearly') basePoints = 50;
                }

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

    // --- CARTOON BOOK MANAGEMENT ---

    async saveCartoonBookTask(task: any): Promise<void> {
        try {
            await adminDb.collection('graphic_novel_tasks').doc(task.id).set(task);
            console.log(`[Database] Saved cartoon book task: ${task.id}`);
        } catch (e) {
            console.error('[Database] saveCartoonBookTask failed:', e);
            throw e;
        }
    }

    async updateCartoonBookTask(taskId: string, updates: any): Promise<void> {
        try {
            await adminDb.collection('graphic_novel_tasks').doc(taskId).update(updates);
        } catch (e) {
            console.error('[Database] updateCartoonBookTask failed:', e);
            throw e;
        }
    }

    async getCartoonBookTask(taskId: string): Promise<any | null> {
        try {
            const snap = await adminDb.collection('graphic_novel_tasks').doc(taskId).get();
            return snap.exists ? snap.data() : null;
        } catch (e) {
            console.error('[Database] getCartoonBookTask failed:', e);
            return null;
        }
    }

    async getCartoonBook(id: string): Promise<any | null> {
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
            console.error('[Database] getCartoonBook failed:', e);
            return null;
        }
    }

    async getUserCartoonBooks(userId: string): Promise<any[]> {
        try {
            const snapshot = await adminDb.collection('graphic_novel_tasks')
                .where('userId', '==', userId)
                .where('status', '==', 'COMPLETED')
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(d => d.data());
        } catch (e) {
            console.error('[Database] getUserCartoonBooks failed:', e);
            return [];
        }
    }
}

export const databaseService = new DatabaseService();
