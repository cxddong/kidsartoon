
import { admin, adminDb, adminStorage } from '../src/services/firebaseAdmin';
import * as fs from 'fs';
import * as path from 'path';
import fetch from 'cross-fetch';

async function restoreFromDump() {
    console.log('Reading profile_dump.txt...');
    const dumpPath = path.join(process.cwd(), 'profile_dump.txt');

    if (!fs.existsSync(dumpPath)) {
        console.error('Dump file not found!');
        return;
    }

    const content = fs.readFileSync(dumpPath, 'utf8');
    const records: any[] = [];

    // Naive parsing logic based on the known format
    // --- [0] ID: ... ---
    // Type: ...
    // ImageUrl: ...
    // Original: ...
    // Meta: ...

    const entries = content.split('--- [');
    for (const entry of entries) {
        if (!entry.trim()) continue;

        try {
            const lines = entry.split('\n');
            // Line 0: N] ID: <GUID> ---
            const idLine = lines[0];
            const idMatch = idLine.match(/ID:\s+(.+)\s+---/);
            if (!idMatch) continue;

            const id = idMatch[1].trim();
            const type = lines.find(l => l.startsWith('Type:'))?.replace('Type:', '').trim();
            const imageUrlLine = lines.find(l => l.startsWith('ImageUrl:'));
            let imageUrl = imageUrlLine ? imageUrlLine.replace('ImageUrl:', '').trim() : '';
            // Remove quotes
            if (imageUrl.startsWith('"') && imageUrl.endsWith('"')) {
                imageUrl = imageUrl.substring(1, imageUrl.length - 1);
            }

            const metaLine = lines.find(l => l.startsWith('Meta:'));
            const meta = metaLine ? JSON.parse(metaLine.replace('Meta:', '').trim()) : {};

            // Reconstruct object
            records.push({
                id,
                userId: "lLcqrs6ZfnZLqaWzSt88nfcdkcv2", // Hardcoded based on previous context
                data: {
                    type,
                    imageUrl,
                    meta,
                    createdAt: admin.firestore.Timestamp.now()
                }
            });
        } catch (e) {
            console.warn('Failed to parse an entry', e);
        }
    }

    console.log(`Parsed ${records.length} records from dump.`);

    // Filter for volces.com
    const targets = records.filter(r => r.data.imageUrl && r.data.imageUrl.includes('volces.com'));
    console.log(`Found ${targets.length} records with volces.com links.`);

    let restoredCount = 0;

    for (const rec of targets) {
        // Check if exists
        const docRef = adminDb.collection('users').doc(rec.userId).collection('images').doc(rec.id);
        const doc = await docRef.get();

        if (doc.exists) {
            console.log(`Record ${rec.id} exists. Skipping.`);
            continue;
        }

        console.log(`Restoring missing record ${rec.id}...`);

        let finalImageUrl = rec.data.imageUrl;

        try {
            const res = await fetch(finalImageUrl);
            if (res.ok) {
                console.log('  URL is ALIVE. Uploading to Storage...');
                const arrayBuffer = await res.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const bucket = adminStorage.bucket();
                // Determine extension
                const ext = rec.data.imageUrl.includes('.mp4') ? 'mp4' : 'jpg';
                const contentType = ext === 'mp4' ? 'video/mp4' : 'image/jpeg';
                const filePath = `restored/${rec.id}.${ext}`;
                const file = bucket.file(filePath);

                await file.save(buffer, {
                    metadata: { contentType },
                    public: true
                });

                finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
                console.log(`  New URL: ${finalImageUrl}`);
            } else {
                console.warn(`  Source URL failed (${res.status}). Using dead link.`);
            }
        } catch (e) {
            console.warn('  Fetch error. Using dead link.', e);
        }

        await docRef.set({
            ...rec.data,
            imageUrl: finalImageUrl,
            restoredFromBackup: true
        });
        restoredCount++;
    }

    console.log(`Finished. Restored ${restoredCount} items.`);
}

restoreFromDump().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
