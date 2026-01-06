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

async function cleanupFailedRecords(userId: string) {
    console.log(`🧹 Starting cleanup for user: ${userId}`);

    const imagesRef = db.collection('images');
    const query = imagesRef.where('userId', '==', userId);

    const snapshot = await query.get();
    console.log(`📊 Found ${snapshot.size} total records`);

    let deletedCount = 0;
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
        const data = doc.data();

        // Criteria for failed records:
        // 1. Missing imageUrl or empty imageUrl
        // 2. imageUrl contains 'undefined' or 'null'
        // 3. imageUrl is not a valid URL
        const imageUrl = data.imageUrl || '';

        const isFailed =
            !imageUrl ||
            imageUrl.length < 10 ||
            imageUrl.includes('undefined') ||
            imageUrl.includes('null') ||
            imageUrl === 'https://' ||
            (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'));

        if (isFailed) {
            console.log(`❌ Deleting failed record: ${doc.id} - URL: "${imageUrl}"`);
            batch.delete(doc.ref);
            deletedCount++;
        }
    });

    if (deletedCount > 0) {
        await batch.commit();
        console.log(`✅ Deleted ${deletedCount} failed records`);
    } else {
        console.log(`✨ No failed records found!`);
    }

    console.log(`📊 Remaining records: ${snapshot.size - deletedCount}`);
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
