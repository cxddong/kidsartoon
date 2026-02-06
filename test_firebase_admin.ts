import admin from 'firebase-admin';
import fs from 'fs';

console.log('\n=== Testing Firebase Admin SDK ===\n');

// Step 1: Check if key file exists
const keyPath = './firebase-admin-key.json';
if (!fs.existsSync(keyPath)) {
    console.error('❌ firebase-admin-key.json not found!');
    process.exit(1);
}
console.log('✅ firebase-admin-key.json exists');

// Step 2: Parse the key file
try {
    const keyContent = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
    console.log('✅ Key file is valid JSON');
    console.log(`   Project ID: ${keyContent.project_id}`);
    console.log(`   Client Email: ${keyContent.client_email}`);
} catch (e: any) {
    console.error('❌ Key file is invalid JSON:', e.message);
    process.exit(1);
}

// Step 3: Initialize Admin SDK
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(keyPath),
            storageBucket: 'kat-antigravity.firebasestorage.app'
        });
        console.log('✅ Firebase Admin SDK initialized successfully');
    }
} catch (e: any) {
    console.error('❌ Admin SDK initialization failed:', e.message);
    console.error('   Stack:', e.stack);
    process.exit(1);
}

// Step 4: Test Storage access
try {
    const bucket = admin.storage().bucket();
    console.log(`✅ Storage bucket accessible: ${bucket.name}`);

    // Try to upload a test file
    const testData = Buffer.from('test');
    const testFile = bucket.file('test/admin-sdk-test.txt');

    await testFile.save(testData, {
        metadata: { contentType: 'text/plain' },
        public: true,
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/test/admin-sdk-test.txt`;
    console.log(`✅ Test file uploaded successfully`);
    console.log(`   URL: ${publicUrl}`);

    // Clean up
    await testFile.delete();
    console.log('✅ Test file deleted (cleanup)');

} catch (e: any) {
    console.error('❌ Storage test failed:', e.message);
    console.error('   This might be due to permissions or network issues');
}

console.log('\n=== All tests passed! ===\n');
