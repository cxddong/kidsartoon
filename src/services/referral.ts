import { adminDb as db } from './firebaseAdmin.js'; // Correct import
import { databaseService } from './database.js';
import admin from 'firebase-admin';

export interface ReferralCode {
    code: string;
    value: number; // 500, 1000, 2000
    status: 'active' | 'used';
    createdAt: number;
    createdBy?: string;
    usedBy?: string;
    usedAt?: number;
}

class ReferralService {
    private collection = db.collection('referral_codes');

    /**
     * Generate a random code string
     */
    private generateCodeString(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude I, O, 1, 0 for clarity
        let result = 'MAGIC-';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Create new referral codes
     */
    async generateCodes(value: number, quantity: number = 1, createdBy: string = 'admin'): Promise<ReferralCode[]> {
        const codes: ReferralCode[] = [];
        const batch = db.batch();

        for (let i = 0; i < quantity; i++) {
            const codeString = this.generateCodeString();
            const referralCode: ReferralCode = {
                code: codeString,
                value,
                status: 'active',
                createdAt: Date.now(),
                createdBy
            };

            const ref = this.collection.doc(codeString);
            batch.set(ref, referralCode);
            codes.push(referralCode);
        }

        await batch.commit();
        return codes;
    }

    /**
     * Redeem a code for a user
     */
    async redeemCode(code: string, userId: string): Promise<{ success: boolean; message: string; pointsAdded?: number }> {
        const codeRef = this.collection.doc(code);

        try {
            const result = await db.runTransaction(async (t) => {
                const doc = await t.get(codeRef);

                if (!doc.exists) {
                    throw new Error("Invalid Code");
                }

                const data = doc.data() as ReferralCode;
                if (data.status !== 'active') {
                    throw new Error("Code already used");
                }

                // 1. Mark code as used
                t.update(codeRef, {
                    status: 'used',
                    usedBy: userId,
                    usedAt: Date.now()
                });

                // 2. Add points to user
                // We need to call user update separately or integrate with databaseService logic here.
                // Since this transaction handles the code, we'll return value to caller to update user.
                return data.value;
            });

            // If transaction successful, update user points
            // Note: Ideally this should be inside the transaction if user data is in same DB instance
            // But databaseService.deductCredits handles its own logic. 
            // We need an "addCredits" equivalent.

            // Using direct update for now as we are essentially "admin" here
            const userRef = db.collection('users').doc(userId);
            await userRef.update({
                credits: admin.firestore.FieldValue.increment(result)
            });

            return { success: true, message: `Redeemed ${result} Points!`, pointsAdded: result };

        } catch (e: any) {
            console.error("Redemption Error:", e);
            return { success: false, message: e.message || "Redemption Failed" };
        }
    }
}

export const referralService = new ReferralService();
