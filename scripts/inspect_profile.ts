
import { databaseService } from '../src/services/database';
import { adminDb } from '../src/services/firebaseAdmin';

async function inspectProfile() {
    const userId = 'lLcqrs6ZfnZLqaWzSt88nfcdkcv2'; // User from previous log
    console.log(`Inspecting user ${userId}...`);

    const images = await databaseService.getUserImages(userId);
    console.log(`Found ${images.length} images.`);

    // Print the most recent 10 images in concise format
    const recent = images.slice(0, 10);

    const fs = await import('fs');
    const path = await import('path');

    let output = '';
    recent.forEach((img, i) => {
        output += `\n--- [${i}] ID: ${img.id} ---\n`;
        output += `Type: ${img.type}\n`;
        output += `ImageUrl: "${img.imageUrl}"\n`;
        output += `Original: "${img.meta?.originalImageUrl}"\n`;
        output += `Meta: ${JSON.stringify(img.meta)}\n`;
    });

    fs.writeFileSync(path.join(process.cwd(), 'profile_dump.txt'), output);
    console.log('Dump written to profile_dump.txt');
}

inspectProfile().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
