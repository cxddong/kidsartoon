
import { databaseService } from '../src/services/database';
import { adminDb } from '../src/services/firebaseAdmin';

async function runCleanup() {
    console.log('Starting DEEP cleanup...');

    // Get all users
    const usersSnap = await adminDb.collection('users').get();
    const users = usersSnap.docs.map(d => d.id);

    console.log(`Found ${users.length} users.`);

    for (const userId of users) {
        console.log(`Scanning user ${userId}...`);
        // Get all images (including recovered ones)
        const images = await databaseService.getUserImages(userId);
        let deleted = 0;

        for (const img of images) {
            let isBroken = false;

            // 1. Check Main URL
            if (img.imageUrl && !img.imageUrl.startsWith('http') && !img.imageUrl.startsWith('data:')) {
                isBroken = true;
            }

            // 2. Check Original URL (This is the main culprit based on logs)
            if (img.meta?.originalImageUrl) {
                const orig = img.meta.originalImageUrl;
                // If it's a local path (starts with /), it's broken
                if (orig && (orig.startsWith('/') || (!orig.startsWith('http') && !orig.startsWith('data:')))) {
                    isBroken = true;
                }
            }

            // 3. Check for Expired Temporary API Links (Volcengine / Doubao)
            // These links usually expire after 24h. If found, they are likely dead history.
            if (!isBroken && img.imageUrl && img.imageUrl.includes('volces.com')) {
                isBroken = true;
            }
            if (!isBroken && img.meta?.originalImageUrl && img.meta.originalImageUrl.includes('volces.com')) {
                isBroken = true;
            }

            if (isBroken) {
                process.stdout.write(`X`);

                // 1. Delete Image Record
                await databaseService.deleteImage(img.id, userId);

                // 2. Delete Underlying Video Task (Stop resurrection)
                // The ID of the image is typically the taskId for recovered items
                // Or stored in meta.taskId
                const taskId = img.id || img.meta?.taskId;
                if (taskId) {
                    await adminDb.collection('video_tasks').doc(taskId).delete();
                }

                deleted++;
            } else {
                process.stdout.write(`.`);
            }
        }
        console.log(`\nCleaned ${deleted} broken items for ${userId}.`);
    }
}

runCleanup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
