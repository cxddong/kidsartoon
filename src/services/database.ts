import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    Timestamp,
    increment,
    runTransaction
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from 'uuid';

const firebaseConfig = {
    apiKey: "AIzaSyAPiovapSN9I5o56rJRrDwKiY-wWeHdY7I",
    authDomain: "kat-antigravity.firebaseapp.com",
    projectId: "kat-antigravity",
    storageBucket: "kat-antigravity.firebasestorage.app",
    messagingSenderId: "1045560094198",
    appId: "1:1045560094198:web:8c0186f65ab1ddbab3ebd7",
    measurementId: "G-Y4M4VX7B5Q"
};

console.log("[DatabaseService] Init with FORCE config: " + firebaseConfig.projectId);
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);

export interface ImageRecord {
    id: string; // Firestore ID usually, but we keep our UUID for compatibility
    userId: string;
    imageUrl: string;
    type: 'upload' | 'generated' | 'comic' | 'story' | 'animation';
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

export interface CreditTransaction {
    id: string;
    userId: string;
    amount: number; // Negative for deduction, Positive for refund/add
    type: 'MAGIC_LAB_CHAT' | 'IMAGE_TRANSFORM' | 'REFUND' | 'SIGNUP_BONUS' | 'RECHARGE';
    reason: string;
    createdAt: string;
    meta?: any;
}

export class DatabaseService {
    constructor() {
        console.log('[DatabaseService] Initialized with Firebase Firestore');
    }

    // --- Storage ---
    public async uploadFile(buffer: Buffer, mimeType: string, folder: string = 'uploads'): Promise<string> {
        try {
            const ext = mimeType.split('/')[1] || 'bin';
            const filename = `${folder}/${uuidv4()}.${ext}`;
            const storageRef = ref(storage, filename);

            // Convert Buffer to Uint8Array for Firebase JS SDK
            const uint8Array = new Uint8Array(buffer);

            const snapshot = await uploadBytes(storageRef, uint8Array, {
                contentType: mimeType
            });

            return await getDownloadURL(snapshot.ref);
        } catch (e) {
            console.error("Upload failed", e);
            throw e;
        }
    }

    // --- Video Tasks (Cost Tracking) ---
    public async saveVideoTask(taskId: string, userId: string, cost: number, prompt: string = '', meta: any = {}) {
        try {
            await setDoc(doc(db, 'video_tasks', taskId), {
                taskId,
                userId,
                cost,
                prompt, // Store prompt
                meta,   // Store extra metadata (e.g., originalImageUrl)
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                refunded: false
            });
        } catch (e) { console.error('saveVideoTask failed', e); }
    }

    public async getVideoTask(taskId: string) {
        try {
            const snap = await getDoc(doc(db, 'video_tasks', taskId));
            return snap.exists() ? snap.data() : null;
        } catch (e) { return null; }
    }

    public async markTaskRefunded(taskId: string) {
        try {
            await updateDoc(doc(db, 'video_tasks', taskId), {
                status: 'REFUNDED',
                refunded: true
            });
        } catch (e) { console.error('markTaskRefunded failed', e); }
    }

    public async markTaskCompleted(taskId: string) {
        try {
            await updateDoc(doc(db, 'video_tasks', taskId), {
                status: 'COMPLETED'
            });
        } catch (e) { }
    }

    // --- Images ---
    public async saveImageRecord(
        userId: string,
        imageUrl: string,
        type: ImageRecord['type'],
        prompt?: string,
        meta?: any
    ): Promise<ImageRecord> {
        const id = uuidv4(); // Generate our own UUID
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
            // Use setDoc with specific ID instead of addDoc (auto-ID)
            // This ensures our 'id' field matches the Document ID, simplifying queries.
            await setDoc(doc(db, "images", id), newRecord);
            console.log(`[Database] Saved image record: ${id} (User: ${userId}, Type: ${type})`);
        } catch (e) {
            console.error('[Database] Failed to save image:', e);
            throw e; // Throw so we know it failed
        }
        return newRecord;
    }

    public async getUserImages(userId: string): Promise<ImageRecord[]> {
        try {
            // REMOVED orderBy to avoid needing a composite index (userId + createdAt)
            const q = query(
                collection(db, "images"),
                where("userId", "==", userId)
            );
            const snapshot = await getDocs(q);
            const results = snapshot.docs.map(d => {
                const data = d.data() as ImageRecord;
                // CRITICAL: Ensure 'id' is present. If saved without 'id' field, use doc.id
                // Also ensure we don't have duplicate field issues.
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
            const snap = await getDoc(doc(db, 'users', userId));
            if (snap.exists()) {
                const data = snap.data() as UserRecord;
                // Ensure credits exist for legacy users
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
            const q = query(collection(db, "images"), where("id", "==", id), where("userId", "==", userId)); // Assuming 'id' field is used
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const docRef = snapshot.docs[0].ref;
            const data = snapshot.docs[0].data() as ImageRecord;
            const newVal = !data.favorite;

            await updateDoc(docRef, { favorite: newVal });

            return { ...data, favorite: newVal };
        } catch (e) {
            console.error('[Database] Toggle fav failed:', e);
            return null;
        }
    }

    public async deleteImage(id: string, userId: string): Promise<boolean> {
        try {
            const q = query(collection(db, "images"), where("id", "==", id), where("userId", "==", userId));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return false;

            await deleteDoc(snapshot.docs[0].ref);
            return true;
        } catch (e) {
            console.error('[Database] Delete failed:', e);
            return false;
        }
    }

    // --- Likes System ---
    public async toggleLike(userId: string, imageId: string): Promise<boolean> {
        try {
            // Check if already liked
            const q = query(
                collection(db, "likes"),
                where("userId", "==", userId),
                where("imageId", "==", imageId)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                // Allows unlike
                await deleteDoc(snapshot.docs[0].ref);
                return false;
            } else {
                // Like
                await addDoc(collection(db, "likes"), {
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
            const q = query(collection(db, "likes"), where("userId", "==", userId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => d.data().imageId);
        } catch (e) {
            return [];
        }
    }

    public async getLikedImages(userId: string): Promise<ImageRecord[]> {
        try {
            const imageIds = await this.getLikedImageIds(userId);
            if (imageIds.length === 0) return [];

            // Firestore "in" query limited to 10, so might need chunking or individual fetches.
            // For simplicity/demo, let's fetch individual (less efficient but works for small sets)
            // OR fetch all images and filter (bad scale).
            // Let's rely on "where id in ids" if < 10, else loop.

            // Actually, we can just use the existing generic 'getImages' if we had one by ID.
            // Let's implement a verify simple fetch-by-id loop for now.
            const images: ImageRecord[] = [];
            for (const id of imageIds) {
                const q = query(collection(db, "images"), where("id", "==", id));
                const snap = await getDocs(q);
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
            // Find document by our custom 'id' field
            const q = query(collection(db, "images"), where("id", "==", id));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                console.warn(`[Database] Image with id ${id} not found for feedback.`);
                return false;
            }

            const docRef = snapshot.docs[0].ref;
            const data = snapshot.docs[0].data() as ImageRecord;
            const meta = data.meta || {};
            meta.feedback = feedback;

            await updateDoc(docRef, { meta });
            console.log(`[Database] Feedback saved for ${id}`);
            return true;
        } catch (e) {
            console.error('[Database] Save feedback failed:', e);
            return false;
        }
    }

    public async getPublicImages(type?: string): Promise<ImageRecord[]> {
        try {
            let q;
            if (type) {
                // If filtering by type, we should ideally have a composite index (type + createdAt).
                // If not, we might fall back to client-side filtering or just 'where' (and hope for implicit order or add explicit index later).
                // Let's try simple where + orderBy first.
                q = query(
                    collection(db, "images"),
                    where("type", "==", type),
                    orderBy("createdAt", "desc"),
                    limit(50)
                );
            } else {
                q = query(collection(db, "images"), orderBy("createdAt", "desc"), limit(50));
            }
            const snapshot = await getDocs(q);
            return snapshot.docs.map(d => d.data() as ImageRecord);
        } catch (e) {
            console.error('[Database] Public images failed:', e);
            return [];
        }
    }

    // --- Users ---
    public async getUserProfile(uid: string): Promise<UserRecord | null> {
        try {
            const docRef = doc(db, "users", uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data() as UserRecord;
                // Ensure credits exist for legacy users safely
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
            const docRef = doc(db, "users", uid);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                await updateDoc(docRef, data);
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

                await setDoc(docRef, newUser);

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
            const q = query(collection(db, "users"), where("email", "==", email));
            const snapshot = await getDocs(q);
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

            await addDoc(collection(db, "points_history"), {
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
            const q = query(collection(db, "points_history"), where("userId", "==", userId), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
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
            await addDoc(collection(db, 'credit_transactions'), {
                userId,
                amount,
                type,
                reason,
                createdAt: new Date().toISOString()
            });
        } catch (e) { console.error('Log credit failed', e); }
    }

    public async deductCredits(userId: string, amount: number, reason: string, type: CreditTransaction['type']): Promise<boolean> {
        const docRef = doc(db, "users", userId);

        try {
            return await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(docRef);
                if (!userDoc.exists()) throw "User does not exist!";

                const userData = userDoc.data() as UserRecord;
                const currentCredits = userData.credits || 0;

                if (currentCredits < amount) {
                    return false; // Insufficient funds
                }

                const newBalance = currentCredits - amount;
                transaction.update(docRef, { credits: newBalance });

                // We should also log inside transaction ideally, but independent log is okay for loose coupling
                // To be safe, let's rely on calling logCreditTransaction AFTER success, or addDoc here (but addDoc is not transactional on root level usually unless keyed)
                // We will return true and let caller log, or log strictly here.

                return true;
            });
        } catch (e) {
            console.error("Deduct credits failed", e);
            return false;
        }
    }

    public async refundCredits(userId: string, amount: number, reason: string): Promise<void> {
        try {
            const docRef = doc(db, "users", userId);
            await updateDoc(docRef, {
                credits: increment(amount)
            });
            await this.logCreditTransaction(userId, amount, 'REFUND', reason);
        } catch (e) {
            console.error("Refund failed", e);
        }
    }
}

export const databaseService = new DatabaseService();
