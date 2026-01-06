import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Helper to determine root dir (ESM vs CJS issue sometimes, but process.cwd() is safe for runtime)
const rootDir = process.cwd();
const keyPathResult = path.join(rootDir, 'firebase-admin-key.json');

console.log('[FirebaseAdmin] Initializing Admin SDK...');

let adminDb: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;
let adminStorage: admin.storage.Storage;

try {
    if (!admin.apps.length) {
        if (fs.existsSync(keyPathResult)) {
            const serviceAccount = JSON.parse(fs.readFileSync(keyPathResult, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: 'kat-antigravity.firebasestorage.app' // Hardcoded from existing config
            });
            console.log('[FirebaseAdmin] Admin SDK initialized with key file.');
        } else {
            console.warn('[FirebaseAdmin] Key file not found at', keyPathResult);
            // Fallback for cloud environments (GCP) where auto-discovery works
            admin.initializeApp({
                storageBucket: 'kat-antigravity.firebasestorage.app'
            });
            console.log('[FirebaseAdmin] Admin SDK initialized with default credentials (Cloud).');
        }
    } else {
        console.log('[FirebaseAdmin] Admin SDK already initialized.');
    }

    adminDb = admin.firestore();
    adminAuth = admin.auth();
    adminStorage = admin.storage();

    // settings
    adminDb.settings({ ignoreUndefinedProperties: true });

} catch (error) {
    console.error('[FirebaseAdmin] CRITICAL INITIALIZATION ERROR:', error);
    process.exit(1);
}

export { admin, adminDb, adminAuth, adminStorage };
