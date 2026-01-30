import express from 'express';
import { databaseService } from '../services/database.js';
import { adminDb } from '../services/firebaseAdmin.js';

const router = express.Router();

/**
 * MIGRATION PROTOCOL 1.0: SINGLE USER MODE
 * Goal: Merge a specific Child Profile (or the active one) into the Root User.
 * This effectively "deletes" the parent identity and makes the User = The Child.
 */
router.post('/merge-child-identity', async (req, res) => {
    try {
        const { userId, targetProfileId } = req.body;

        if (!userId) return res.status(400).json({ error: 'UserID required' });

        console.log(`[Migration] Starting identity merge for User: ${userId} -> Profile: ${targetProfileId || 'Auto-detect'}`);

        // 1. Get User
        const user = await databaseService.getUser(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // 2. Determine Target Profile
        let targetProfile = null;

        if (targetProfileId) {
            targetProfile = user.profiles?.find(p => p.id === targetProfileId);
        } else {
            // Auto-detect: Prefer "Tiara" or the first profile
            targetProfile = user.profiles?.find(p => p.name === 'Tiara') || user.profiles?.[0];
        }

        if (!targetProfile) {
            return res.status(400).json({ error: 'No child profile found to merge.' });
        }

        console.log(`[Migration] Merging Profile: ${targetProfile.name} (${targetProfile.id}) into User Root.`);

        // 3. Update User Root with Child Attributes
        const updates: any = {
            name: targetProfile.name,
            avatar: targetProfile.avatar || user.photoUrl, // Prefer child avatar
            age: targetProfile.age || 5, // Default if missing
            // theme: targetProfile.theme, // If we had theme on user
            // Keep existing points? Or sum them?
            // User points + Profile Points (if we were tracking separately, but usually points are on user)
        };

        // If gender/interests existed on profile but not user, move them.
        // We'll just overwrite to be safe, as "Parent" data is irrelevant now.
        if ((targetProfile as any).gender) updates.gender = (targetProfile as any).gender;
        if ((targetProfile as any).interests) updates.interests = (targetProfile as any).interests;

        // Clear the profiles array to prevent confusion (or keep as backup? User wants "Single User")
        // Let's archive it instead of deleting, just in case.
        updates.archivedProfiles = user.profiles;
        updates.profiles = []; // CLEAR PROFILES
        updates.currentProfileId = null; // No more profile switching

        await adminDb.collection('users').doc(userId).update(updates);
        console.log('[Migration] User record updated.');

        // 4. Update History / Images
        // We want ALL images for this user to be viewable without profileId filter.
        // We technically don't need to change the image docs if we just stop filtering by profileId in the read queries.
        // BUT, to be clean, let's remove the profileId from the metadata of images belonging to this profile
        // so they are truly "User Level".

        // Batch update recent images (limit 500 to avoid timeout)
        const snapshot = await adminDb.collection('images')
            .where('userId', '==', userId)
            .where('meta.profileId', '==', targetProfile.id)
            .limit(500)
            .get();

        if (!snapshot.empty) {
            const batch = adminDb.batch();
            snapshot.docs.forEach(doc => {
                // Set profileId to null or remove it from meta
                // Firestore doesn't easily let us delete nested fields without rewriting the map.
                // We'll set it to DELETE marker or just null.
                const data = doc.data();
                const meta = data.meta || {};
                delete meta.profileId; // In JS memory

                // For Firestore update:
                batch.update(doc.ref, {
                    meta: meta // Overwrite meta without profileId
                });
            });
            await batch.commit();
            console.log(`[Migration] Transferred ${snapshot.size} image records to root user.`);
        }

        res.json({
            success: true,
            message: `Successfully accepted identity of ${targetProfile.name}.`,
            user: { ...user, ...updates }
        });

    } catch (e: any) {
        console.error('[Migration] Failed:', e);
        res.status(500).json({ error: e.message });
    }
});

export { router };
