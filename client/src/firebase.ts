import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
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
        app = initializeApp(firebaseConfig);
        authExports = getAuth(app);
        dbExports = initializeFirestore(app, { experimentalForceLongPolling: true });
        storageExports = getStorage(app);
        googleProviderExports = new GoogleAuthProvider();
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
