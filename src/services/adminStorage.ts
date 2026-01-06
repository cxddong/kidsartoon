import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Disable proxy to avoid invalid URL errors
process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';
process.env.http_proxy = '';
process.env.https_proxy = '';

let useAdminSDK = false;
let adminBucket: admin.storage.Storage | null = null;

// Try to initialize Admin SDK
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert('./firebase-admin-key.json'),
            storageBucket: 'kat-antigravity.firebasestorage.app'
        });
        adminBucket = admin.storage();
        useAdminSDK = true;
        console.log('[AdminStorage] Firebase Admin SDK initialized successfully');
    }
} catch (error) {
    console.warn('[AdminStorage] Admin SDK initialization failed - Will use local storage fallback.', error);
    // console.error('[AdminStorage] Please download firebase-admin-key.json from Firebase Console');
    useAdminSDK = false;
}

export class AdminStorageService {
    /**
     * Upload file to Firebase Storage using Admin SDK
     * Returns the temporary Doubao URL if Admin SDK is not available
     */
    async uploadFile(buffer: Buffer, mimeType: string, folder: string = 'uploads'): Promise<string> {
        // Fallback function for local storage
        const saveLocally = () => {
            try {
                // Ensure directory exists in public folder
                // Resolving path relative to CWD. Assumes CWD is project root.
                const publicDir = path.join(process.cwd(), 'client', 'public');
                const uploadDir = path.join(publicDir, folder);

                if (!fs.existsSync(uploadDir)) {
                    console.log(`[AdminStorage] Creating directory: ${uploadDir}`);
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const ext = mimeType.split('/')[1] || 'bin';
                const filename = `${Date.now()}_${uuidv4()}.${ext}`;
                const filePath = path.join(uploadDir, filename);

                fs.writeFileSync(filePath, buffer);

                // Return URL relative to web root (client/public is web root)
                const localUrl = `/${folder}/${filename}`;
                console.log(`[AdminStorage] Local fallback success. Saved to: ${filePath}`);
                return Promise.resolve(localUrl);
            } catch (localErr: any) {
                console.error("[AdminStorage] Local save failed:", localErr);
                throw new Error("Storage failed: " + localErr.message);
            }
        };

        if (!useAdminSDK || !adminBucket) {
            console.warn('[AdminStorage] SDK not active. Saving locally...');
            return saveLocally();
        }

        const ext = mimeType.split('/')[1] || 'bin';
        const filename = `${folder}/${uuidv4()}.${ext}`;

        try {
            const file = adminBucket.bucket().file(filename);
            await file.save(buffer, {
                metadata: { contentType: mimeType },
                public: true,
            });
            // Construct public URL - assuming bucket is readable or use download token
            // For public read enabled buckets:
            const publicUrl = `https://storage.googleapis.com/${adminBucket.bucket().name}/${filename}`;
            console.log(`[AdminStorage] Cloud Upload success: ${publicUrl}`);
            return publicUrl;
        } catch (error) {
            console.error('[AdminStorage] Admin Cloud Upload failed, falling back to local:', error);
            return saveLocally();
        }
    }
}

export const adminStorageService = new AdminStorageService();
