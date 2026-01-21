import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAPiovapSN9I5o56rJRrDwKiY-wWeHdY7I",
    authDomain: "kat-antigravity.firebaseapp.com",  // Use custom domain for "Continue to www.kidsartoon.com"
    projectId: "kat-antigravity",
    storageBucket: "kat-antigravity.firebasestorage.app",
    messagingSenderId: "1045560094198",
    appId: "1:1045560094198:web:8c0186f65ab1ddbab3ebd7",
    measurementId: "G-Y4M4VX7B5Q"
};

// Initialize Firebase
// Initialize Firebase safely
let app;
let authExports: any = {};
let dbExports: any = {};
let storageExports: any = {};
let googleProviderExports: any = {};
let appleProviderExports: any = {};

if (!firebaseConfig.apiKey) {
    console.error("🚨 CRITICAL: Firebase API Keys are missing!");
    console.error("Please add VITE_FIREBASE_API_KEY and other variables to your .env file or deployment configuration.");
    // Mock to prevent immediate crash, app will fail gracefully later or show error
} else {
    try {
        // Prevent duplicate initialization (HMR/hot reload issue)
        const existingApps = getApps();
        if (existingApps.length === 0) {
            app = initializeApp(firebaseConfig);
            console.log('[Firebase] Initialized new app');
        } else {
            app = existingApps[0];
            console.log('[Firebase] Reusing existing app instance');
        }

        authExports = getAuth(app);
        dbExports = initializeFirestore(app, { experimentalForceLongPolling: true });
        storageExports = getStorage(app);
        googleProviderExports = new GoogleAuthProvider();
        googleProviderExports.setCustomParameters({
            prompt: 'consent',           // Force OAuth consent screen
            access_type: 'offline',      // Request offline access
            include_granted_scopes: 'false'  // Don't include previously granted scopes
        });
        appleProviderExports = new OAuthProvider('apple.com');
    } catch (e) {
        console.error("Firebase Initialization Error:", e);
    }
}

export const auth = authExports;
export const db = dbExports;
export const storage = storageExports;
export const googleProvider = googleProviderExports;
export const appleProvider = appleProviderExports;

export default app;
