/**
 * Migration Script: Mark Existing Portfolio Scanner Images as Analysis-Only
 * 
 * This script updates all existing images uploaded via portfolio_scanner
 * to add the isAnalysisOnly flag so they don't appear in artwork gallery.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'firebase-admin-key.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const adminDb = getFirestore();

async function migrateAnalysisImages() {
    try {
        console.log('[Migration] Starting migration of portfolio_scanner images...');

        // Query all images with source: portfolio_scanner
        const imagesRef = adminDb.collection('images');
        const snapshot = await imagesRef
            .where('meta.source', '==', 'portfolio_scanner')
            .get();

        console.log(`[Migration] Found ${snapshot.size} portfolio_scanner images to update`);

        if (snapshot.empty) {
            console.log('[Migration] No images to migrate. All done!');
            return;
        }

        let updated = 0;
        const batch = adminDb.batch();

        snapshot.forEach(doc => {
            const data = doc.data();

            // Check if already has isAnalysisOnly flag
            if (!data.meta?.isAnalysisOnly) {
                batch.update(doc.ref, {
                    'meta.isAnalysisOnly': true
                });
                updated++;
                console.log(`[Migration] Marking ${doc.id} as analysis-only`);
            }
        });

        if (updated > 0) {
            await batch.commit();
            console.log(`[Migration] ✅ Successfully updated ${updated} images!`);
        } else {
            console.log('[Migration] All images already have isAnalysisOnly flag.');
        }

        process.exit(0);
    } catch (error) {
        console.error('[Migration] ❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrateAnalysisImages();
