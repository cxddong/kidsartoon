import { admin, adminDb, adminStorage } from '../src/services/firebaseAdmin';
import fetch from 'cross-fetch';

// Data scraped from Step 3234 Log (Before final deletion)
// These URLs are from volces.com and were deleted.
// We will try to download them and upload to Firebase Storage, then re-insert the document.

const deletedRecords = [
    {
        id: "03c3a883-06de-4aca-9f56-64ecb177b150",
        userId: "lLcqrs6ZfnZLqaWzSt88nfcdkcv2", // User ID from logs
        data: {
            type: "animation",
            imageUrl: "https://ark-content-generation-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-1-5-pro/02176868922965400000000000000000000ffffac1824ca90f5c0.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260117%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260117T223439Z&X-Tos-Expires=86400&X-Tos-Signature=fa7574cafbde7c4312da2ac605ba71b2ef36b8d4b1dc8dfc684a3ef4205b2e1b&X-Tos-SignedHeaders=host",
            meta: { "taskId": "cgt-20260118063347-2kpcj", "cost": 15, "model": "doubao-seedance-1.5-pro", "originalImageUrl": "https://ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com/doubao-seedream-4-0/0217686707387107c29cc09d3d6ce930b493d0437e13081fb838c_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260117%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260117T172612Z&X-Tos-Expires=86400&X-Tos-Signature=16650376bba01e0fe92bde8ef2bd32d4eee3755a65900b3558c9ac4923b2afb0&X-Tos-SignedHeaders=host" },
            createdAt: admin.firestore.Timestamp.now()
        }
    },
    {
        id: "1756a36b-20be-4a85-8d8d-d06658631f87",
        userId: "lLcqrs6ZfnZLqaWzSt88nfcdkcv2",
        data: {
            type: "animation",
            imageUrl: "https://ark-content-generation-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-1-5-pro/02176868922965400000000000000000000ffffac1824ca90f5c0.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260117%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260117T223439Z&X-Tos-Expires=86400&X-Tos-Signature=fa7574cafbde7c4312da2ac605ba71b2ef36b8d4b1dc8dfc684a3ef4205b2e1b&X-Tos-SignedHeaders=host",
            meta: { "taskId": "cgt-20260118063347-2kpcj", "cost": 15, "model": "doubao-seedance-1.5-pro", "originalImageUrl": "https://ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com/doubao-seedream-4-0/0217686707387107c29cc09d3d6ce930b493d0437e13081fb838c_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260117%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260117T172612Z&X-Tos-Expires=86400&X-Tos-Signature=16650376bba01e0fe92bde8ef2bd32d4eee3755a65900b3558c9ac4923b2afb0&X-Tos-SignedHeaders=host" },
            createdAt: admin.firestore.Timestamp.now()
        }
    },
    {
        id: "8c4b1dc9-3dc7-4005-a356-098350f52c7a",
        userId: "lLcqrs6ZfnZLqaWzSt88nfcdkcv2",
        data: {
            type: "animation",
            imageUrl: "https://ark-content-generation-cn-beijing.tos-cn-beijing.volces.com/doubao-seedance-1-5-pro/02176868922965400000000000000000000ffffac1824ca90f5c0.mp4?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260117%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260117T223439Z&X-Tos-Expires=86400&X-Tos-Signature=fa7574cafbde7c4312da2ac605ba71b2ef36b8d4b1dc8dfc684a3ef4205b2e1b&X-Tos-SignedHeaders=host",
            meta: { "taskId": "cgt-20260118063347-2kpcj", "cost": 15, "model": "doubao-seedance-1.5-pro", "originalImageUrl": "https://ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com/doubao-seedream-4-0/0217686707387107c29cc09d3d6ce930b493d0437e13081fb838c_0.jpeg?X-Tos-Algorithm=TOS4-HMAC-SHA256&X-Tos-Credential=AKLTYWJkZTExNjA1ZDUyNDc3YzhjNTM5OGIyNjBhNDcyOTQ%2F20260117%2Fcn-beijing%2Ftos%2Frequest&X-Tos-Date=20260117T172612Z&X-Tos-Expires=86400&X-Tos-Signature=16650376bba01e0fe92bde8ef2bd32d4eee3755a65900b3558c9ac4923b2afb0&X-Tos-SignedHeaders=host" },
            createdAt: admin.firestore.Timestamp.now()
        }
    }
    // The log only showed these 3 broken ones (indices 0, 1, 2) that were volces.com links.
    // The others in the log (indices 3-9) were storage.googleapis.com and were NOT deleted.
    // We only need to restore these 3.
];

async function restore() {
    console.log('Beginning Emergency Restore...');
    let successCount = 0;

    for (const rec of deletedRecords) {
        console.log(`Restoring ${rec.id}...`);
        let finalImageUrl = rec.data.imageUrl;

        // 1. Try to fetch the Image URL to see if it's alive
        try {
            console.log(`Checking URL: ${finalImageUrl.substring(0, 50)}...`);
            const res = await fetch(finalImageUrl);
            if (res.ok) {
                console.log('URL is ALIVE. Uploading to Firebase Storage to persistent...');
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const bucket = adminStorage.bucket();
                const filePath = `restored/${rec.id}.mp4`;
                const file = bucket.file(filePath);

                await file.save(buffer, {
                    metadata: { contentType: 'video/mp4' },
                    public: true
                });
                // Make public (or get signed URL, using makePublic for simplicity here if bucket allows, otherwise use signed)
                // Assuming Make Public works or we construct public URL
                // finalImageUrl = file.publicUrl(); // Sometimes differs
                finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
                console.log(`Uploaded to: ${finalImageUrl}`);
            } else {
                console.error(`URL failed with status ${res.status}. Restoring with DEAD LINK (better than nothing).`);
            }
        } catch (e) {
            console.error('Fetch failed:', e);
            console.log('Restoring with original dead link.');
        }

        // 2. Restore Document
        await adminDb.collection('users').doc(rec.userId).collection('images').doc(rec.id).set({
            ...rec.data,
            imageUrl: finalImageUrl,
            restoredFromBackup: true
        });
        console.log(`Doc ${rec.id} restored.`);
        successCount++;
    }
    console.log(`Restored ${successCount} records.`);
}

restore().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
