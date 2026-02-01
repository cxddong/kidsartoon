import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

initializeApp({
    credential: cert(serviceAccount as any)
});

const db = getFirestore();

async function checkUrlStatus(url: string): Promise<boolean> {
    if (!url || !url.startsWith('http')) return false;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        return response.ok;
    } catch (e) {
        // If HEAD fails (e.g. CORS or network), try GET with range to minimize data
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Range': 'bytes=0-10' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (err) {
            return false;
        }
    }
}

async function cleanupFailedRecords(userId?: string) {
    console.log(userId ? `🧹 Starting cleanup for user: ${userId}` : `🧹 Starting GLOBAL cleanup...`);

    const imagesRef = db.collection('images');
    let query: FirebaseFirestore.Query = imagesRef;

    if (userId) {
        query = query.where('userId', '==', userId);
    } else {
        // Limit batch size for global cleanup to avoid memory issues
        // query = query.limit(500); 
    }

    const snapshot = await query.get();
    console.log(`📊 Found ${snapshot.size} total records to scan...`);

    let deletedCount = 0;
    const batch = db.batch();
    const batchSize = 400; // Firestore limit is 500
    let currentBatchSize = 0;
    let totalChecked = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const imageUrl = data.imageUrl || '';
        totalChecked++;

        if (totalChecked % 20 === 0) process.stdout.write('.');

        // 1. Basic Syntax Check
        let isFailed =
            !imageUrl ||
            imageUrl.length < 10 ||
            imageUrl.includes('undefined') ||
            imageUrl.includes('null') ||
            imageUrl === 'https://' ||
            (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'));

        // 2. Active Health Check (only if syntax passes)
        if (!isFailed) {
            const isAlive = await checkUrlStatus(imageUrl);
            if (!isAlive) {
                console.log(`\n❌ Dead Link Found: ${data.id} (${imageUrl})`);
                isFailed = true;
            }
        } else {
            console.log(`\n❌ Invalid Data Found: ${data.id}`);
        }

        if (isFailed) {
            batch.delete(doc.ref);
            deletedCount++;
            currentBatchSize++;

            if (currentBatchSize >= batchSize) {
                await batch.commit();
                console.log(`\n💾 Committed batch of ${currentBatchSize} deletions...`);
                currentBatchSize = 0;
                // Reset batch? No, just create new one logically if using same obj, but better to re-instantiate if needed?
                // Actually Firestore batch is one-time use.
                // WE NEED TO BREAK AND RESTART OR HANDLE MULTIPLE BATCHES.
                // For simplicity in this script, let's just use one batch and cap at 400 changes per run.
                console.log("⚠️ Batch limit reached. Please run again for more.");
                break;
            }
        }
    }

    if (currentBatchSize > 0) {
        await batch.commit();
        console.log(`\n✅ Committed final batch of ${currentBatchSize} deletions.`);
    }

    console.log(`\n🏁 Cleanup Finished. Deleted ${deletedCount} records.`);
}

// Usage
const userId = process.env.USER_ID || process.argv[2];

if (!userId) {
    console.error('❌ Please provide USER_ID as environment variable or command line argument');
    console.error('Usage: tsx cleanup_failed_records.ts <userId>');
    process.exit(1);
}

cleanupFailedRecords(userId)
    .then(() => {
        console.log('✅ Cleanup completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    });
