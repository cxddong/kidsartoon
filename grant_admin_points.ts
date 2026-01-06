// Quick script to grant admin points to your account
// Run this with: npx ts-node grant_admin_points.ts

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Copy your Firebase config here
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function grantAdminPoints(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            points: 99999,  // Admin points
            isAdmin: true   // Optional admin flag
        });
        console.log(`✅ Successfully granted 99999 points to user: ${userId}`);
        console.log(`User is now an admin and will bypass all point consumption checks!`);
    } catch (error) {
        console.error('❌ Error granting points:', error);
    }
}

// REPLACE WITH YOUR USER ID
const YOUR_USER_ID = 'YOUR_UID_HERE';  // Replace this!

grantAdminPoints(YOUR_USER_ID);
