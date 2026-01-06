import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider } from '../firebase';

// Extended User type including Firestore data
export interface User {
    uid: string;
    email: string | null;
    name: string;
    photoURL: string | null;
    age?: number;
    gender?: string;
    points?: number;
    language?: string;
    interests?: string[];
    profileCompleted?: boolean;
    uiMode?: 'visual' | 'standard';
    plan?: 'free' | 'basic' | 'pro' | 'yearly_pro' | 'admin';
    lastPointsReset?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loginWithGoogle: () => Promise<boolean>; // Returns true if new user
    loginWithApple: () => Promise<boolean>;
    login: (email: string, password?: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    console.log('AuthProvider: Initializing...');

    useEffect(() => {
        // Safety check for backend/deployment config issues
        if (!auth || !auth.onAuthStateChanged) {
            console.error("AuthContext: Firebase Auth is not initialized. Check your environment variables.");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Subscribe to real-time updates of user profile from Firestore
                const userRef = doc(db, 'users', firebaseUser.uid);
                const unsubDoc = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = docSnap.data();

                        // Admin / Plan Upgrade Check
                        let currentPlan = userData.plan || 'free';
                        let currentPoints = userData.points ?? 50;

                        // Admin Override for specific user
                        if (firebaseUser.email?.includes('cxddong')) {
                            currentPlan = 'admin'; // Treated as Pro+
                            currentPoints = 99999;
                        }

                        // Monthly Reset Logic for Free Plan
                        if (currentPlan === 'free') {
                            const now = new Date();
                            const lastReset = userData.lastPointsReset ? new Date(userData.lastPointsReset) : null;

                            // If never reset, or reset was in a previous month
                            if (!lastReset || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
                                console.log("Monthly Reset: Resetting Free Plan points to 50.");
                                currentPoints = 50;
                                // Update Firestore immediately to prevent repeat reset
                                // If permission denied, this will throw, but it's async and shouldn't kill the app
                                setDoc(userRef, {
                                    points: 50,
                                    lastPointsReset: now.toISOString()
                                }, { merge: true }).catch(e => console.warn("Reset points failed (permission):", e));
                            }
                        }

                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: userData.name || firebaseUser.displayName || 'Artist',
                            photoURL: userData.photoUrl || firebaseUser.photoURL || null,
                            age: userData.age,
                            gender: userData.gender,
                            points: currentPoints,
                            plan: currentPlan,
                            lastPointsReset: userData.lastPointsReset,
                            language: userData.language || 'English',
                            interests: userData.interests || [],
                            profileCompleted: userData.profileCompleted || false,
                            uiMode: userData.uiMode || 'standard'
                        });
                    } else {
                        // Auto-Heal: Create missing user document
                        const newUserData = {
                            name: firebaseUser.displayName || 'New Artist',
                            email: firebaseUser.email,
                            photoUrl: firebaseUser.photoURL || null,
                            createdAt: new Date().toISOString(),
                            points: 50, // Start with 50 for free tier
                            plan: 'free',
                            language: 'English',
                            profileCompleted: false,
                            creationHistory: [],
                            lastPointsReset: new Date().toISOString()
                        };
                        setDoc(userRef, newUserData, { merge: true }).catch(err => {
                            console.error("Auto-heal profile failed:", err);
                            // FALLBACK: If we can't write, still set user so they can login (READ-ONLY MODE)
                            setUser({
                                uid: firebaseUser.uid,
                                email: firebaseUser.email,
                                name: newUserData.name,
                                photoURL: newUserData.photoUrl,
                                profileCompleted: false,
                                points: 50,
                                plan: 'free'
                            });
                        });
                    }
                    setLoading(false);
                }, (err) => {
                    console.error("Firestore error (Permission?):", err);

                    // FALLBACK FOR PERMISSION ERRORS:
                    // If Firestore is blocked, we must still allow the user to "login" in a limited state
                    // otherwise the router will bounce them back to login page forever (Flash Crash).
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        name: firebaseUser.displayName || 'Guest Artist',
                        photoURL: firebaseUser.photoURL || null,
                        profileCompleted: false, // Force them to onboarding? Or true to skip?
                        points: 50,
                        plan: 'free',
                        // Minimal valid user object
                        language: 'English',
                        interests: []
                    });

                    setLoading(false);
                });

                return () => unsubDoc();
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // 1. Google Login (Redirect-based to avoid popup blockers)
    const loginWithGoogle = async (): Promise<boolean> => {
        try {
            console.log('Starting google login...');
            await signInWithRedirect(auth, googleProvider);
            // Note: After redirect completes, user returns to app
            // and onAuthStateChanged will fire automatically
            return false; // This line won't execute - page redirects
        } catch (error) {
            console.error("PROVIDER LOGIN FAILED:", error, '/', (error as any).code);
            throw error;
        }
    };

    // 2. Apple Login (Redirect-based to avoid popup blockers)
    const loginWithApple = async (): Promise<boolean> => {
        try {
            console.log('Starting apple login...');
            await signInWithRedirect(auth, appleProvider);
            // Note: After redirect completes, user returns to app
            // and onAuthStateChanged will fire automatically
            return false; // This line won't execute - page redirects
        } catch (error) {
            console.error("PROVIDER LOGIN FAILED:", error, '/', (error as any).code);
            throw error;
        }
    };

    // 3. Email Login
    const login = async (email: string, password?: string) => {
        if (!password) throw new Error("Password required");
        await signInWithEmailAndPassword(auth, email, password);
    };

    // 4. Email Signup
    const signup = async (email: string, password: string, name: string) => {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        // Create Initial Profile
        await setDoc(doc(db, 'users', res.user.uid), {
            name,
            email,
            photoUrl: null,
            createdAt: new Date().toISOString(),
            points: 50,
            plan: 'free',
            language: 'English',
            profileCompleted: false,
            creationHistory: [],
            lastPointsReset: new Date().toISOString()
        });
    };

    // 5. Logout
    const logout = async () => {
        await signOut(auth);
    };

    // 6. Update Profile
    const updateProfile = async (data: Partial<User>) => {
        if (!auth.currentUser) return;

        // Filter valid fields
        const firestoreData: any = {};
        if (data.name !== undefined) firestoreData.name = data.name;
        if (data.age !== undefined) firestoreData.age = data.age;
        if (data.gender !== undefined) firestoreData.gender = data.gender;
        if (data.photoURL !== undefined) firestoreData.photoUrl = data.photoURL;
        if (data.language !== undefined) firestoreData.language = data.language;
        if (data.interests !== undefined) firestoreData.interests = data.interests;
        if (data.points !== undefined) firestoreData.points = data.points;
        if (data.plan !== undefined) firestoreData.plan = data.plan; // Allow plan update
        if (data.profileCompleted !== undefined) firestoreData.profileCompleted = data.profileCompleted;
        if (data.uiMode !== undefined) firestoreData.uiMode = data.uiMode;

        await setDoc(doc(db, 'users', auth.currentUser.uid), firestoreData, { merge: true });
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            loginWithGoogle,
            loginWithApple,
            login,
            signup,
            logout,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
