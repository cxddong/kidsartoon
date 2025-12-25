
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Note: We use the client SDK in the backend for simplicity as requested/configured.
// In a production backend, firebase-admin is preferred.

const firebaseConfig = {
    apiKey: "AIzaSyAPiovapSN9I5o56rJRrDwKiY-wWeHdY7I",
    authDomain: "kat-antigravity.firebaseapp.com",
    projectId: "kat-antigravity",
    storageBucket: "kat-antigravity.firebasestorage.app",
    messagingSenderId: "1045560094198",
    appId: "1:1045560094198:web:8c0186f65ab1ddbab3ebd7",
    measurementId: "G-Y4M4VX7B5Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
