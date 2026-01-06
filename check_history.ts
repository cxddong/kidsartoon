
import { adminDb } from './src/services/firebaseAdmin.js';

const targetUserId = 'lLcqrs6ZfnZLqaWzSt88nfcdkcv2';

async function checkHistory() {
    console.log(`Checking history for user: ${targetUserId}...`);
    try {
        const snapshot = await adminDb.collection('images')
            .where('userId', '==', targetUserId)
            .get();

        console.log(`Found ${snapshot.size} records.`);
        if (snapshot.size > 0) {
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                console.log(`- [${data.type}] ${data.id} (Created: ${data.createdAt})`);
            });
        }
    } catch (error) {
        console.error('Error querying Firestore:', error);
    }
}

checkHistory();
