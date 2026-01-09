/**
 * Utility Script: Update Admin User Points to 99999
 * 
 * This script updates the points value for admin users (emails containing 'cxddong')
 * in the Firestore database to match the frontend display.
 * 
 * Usage:
 *   npx tsx update_admin_points.ts
 */

import { adminDb } from './src/services/firebaseAdmin.js';

async function updateAdminPoints() {
    try {
        console.log('🔍 Searching for admin users (emails containing "cxddong")...');

        const usersSnapshot = await adminDb.collection('users').get();

        let updatedCount = 0;

        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            const email = userData.email || '';

            if (email.includes('cxddong')) {
                console.log(`\n📧 Found admin user: ${email}`);
                console.log(`   Current points: ${userData.points || 0}`);
                console.log(`   Current plan: ${userData.plan || 'N/A'}`);

                // Update to admin values
                await adminDb.collection('users').doc(doc.id).update({
                    points: 99999,
                    plan: 'admin'
                });

                console.log(`   ✅ Updated points to 99999, plan to admin`);
                updatedCount++;
            }
        }

        if (updatedCount === 0) {
            console.log('\n⚠️  No admin users found with email containing "cxddong"');
        } else {
            console.log(`\n✨ Successfully updated ${updatedCount} admin user(s)!`);
        }

    } catch (error) {
        console.error('❌ Error updating admin points:', error);
        process.exit(1);
    }
}

// Run the script
updateAdminPoints()
    .then(() => {
        console.log('\n🎉 Script completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    });
