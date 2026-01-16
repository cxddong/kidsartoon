import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider, appleProvider } from '../firebase';

// Child Profile Interface
export interface ChildProfile {
    id: string;
    name: string;
    avatar: string;
    age?: number;
    theme?: string;
    gender?: string;
    interests?: string[];
    language?: string;
    points?: number;
    profileCompleted?: boolean;
}

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

    // Child Profile Support
    profiles?: ChildProfile[];
    currentProfileId?: string; // ID of the currently active child profile (or undefined for main parent)
    parentPin?: string;
}

interface AuthContextType {
    user: User | null;
    activeProfile: ChildProfile | null; // Derived helper
    loading: boolean;
    loginWithGoogle: () => Promise<boolean>; // Returns true if new user
    loginWithApple: () => Promise<boolean>;
    login: (email: string, password?: string) => Promise<void>;
    signup: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    addChildProfile: (name: string, avatar: string, age?: number) => Promise<void>;
    deleteChildProfile: (profileId: string) => Promise<void>; // Added
    switchProfile: (profileId: string | null) => Promise<void>;
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
                            uiMode: userData.uiMode || 'standard',
                            profiles: userData.profiles || [],
                            currentProfileId: userData.currentProfileId
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

                    // Check for pending OAuth navigation
                    const pendingNav = sessionStorage.getItem('oauth_pending_nav');
                    if (pendingNav) {
                        console.log('🚀 Navigating to:', pendingNav);
                        sessionStorage.removeItem('oauth_pending_nav');
                        // Use setTimeout to ensure state is fully settled
                        setTimeout(() => {
                            window.location.href = pendingNav;
                        }, 100);
                    }
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

                    // Check for pending OAuth navigation even in error case
                    const pendingNav = sessionStorage.getItem('oauth_pending_nav');
                    if (pendingNav) {
                        console.log('🚀 Navigating to:', pendingNav);
                        sessionStorage.removeItem('oauth_pending_nav');
                        setTimeout(() => {
                            window.location.href = pendingNav;
                        }, 100);
                    }
                });

                return () => unsubDoc();
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // 1. Google Login (Popup-based for immediate authentication)
    const loginWithGoogle = async (): Promise<boolean> => {
        try {
            console.log('🔐 Starting Google login with popup...');
            const result = await signInWithPopup(auth, googleProvider);

            // Check if new user
            const creationTime = new Date(result.user.metadata.creationTime!).getTime();
            const lastSignInTime = new Date(result.user.metadata.lastSignInTime!).getTime();
            const isNewUser = Math.abs(creationTime - lastSignInTime) < 5000;

            console.log(`✅ Google login success! User: ${result.user.email}, isNew: ${isNewUser}`);
            return isNewUser;
        } catch (error: any) {
            console.error("❌ Google login failed:", error.code, error.message);

            // User-friendly error messages
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Login cancelled. Please try again.');
            } else if (error.code === 'auth/popup-blocked') {
                throw new Error('Popup blocked by browser. Please allow popups and try again.');
            } else if (error.code === 'auth/cancelled-popup-request') {
                throw new Error('Login cancelled.');
            }

            throw error;
        }
    };

    // 2. Apple Login (Popup-based for immediate authentication)
    const loginWithApple = async (): Promise<boolean> => {
        try {
            console.log('🍎 Starting Apple login with popup...');
            const result = await signInWithPopup(auth, appleProvider);

            // Check if new user
            const creationTime = new Date(result.user.metadata.creationTime!).getTime();
            const lastSignInTime = new Date(result.user.metadata.lastSignInTime!).getTime();
            const isNewUser = Math.abs(creationTime - lastSignInTime) < 5000;

            console.log(`✅ Apple login success! User: ${result.user.email}, isNew: ${isNewUser}`);
            return isNewUser;
        } catch (error: any) {
            console.error("❌ Apple login failed:", error.code, error.message);

            // User-friendly error messages
            if (error.code === 'auth/popup-closed-by-user') {
                throw new Error('Login cancelled. Please try again.');
            } else if (error.code === 'auth/popup-blocked') {
                throw new Error('Popup blocked by browser. Please allow popups and try again.');
            } else if (error.code === 'auth/cancelled-popup-request') {
                throw new Error('Login cancelled.');
            }

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

        // --- CHILD PROFILE INTERCEPT ---
        // If we are in "Child Mode" (activeProfile exists) AND we are NOT explicitly moving/switching profiles
        // then rewrite the data to target the child profile inside the 'profiles' array instead.
        if (user?.currentProfileId && data.profiles === undefined && data.currentProfileId === undefined) {
            const profileIdx = user.profiles?.findIndex(p => p.id === user.currentProfileId);
            if (profileIdx !== undefined && profileIdx !== -1 && user.profiles) {
                console.log("👶 Updating Active Child Profile:", user.currentProfileId);

                const updatedChild = { ...user.profiles[profileIdx] };

                // Map User fields to ChildProfile fields
                if (data.name !== undefined) updatedChild.name = data.name;
                if (data.photoURL !== undefined) updatedChild.avatar = data.photoURL || updatedChild.avatar; // Map photoURL -> avatar
                if (data.age !== undefined) updatedChild.age = data.age;
                if (data.gender !== undefined) updatedChild.gender = data.gender;
                if (data.interests !== undefined) updatedChild.interests = data.interests;
                if (data.language !== undefined) updatedChild.language = data.language;
                if (data.points !== undefined) updatedChild.points = data.points;
                if (data.profileCompleted !== undefined) updatedChild.profileCompleted = data.profileCompleted;

                // Create new profiles array
                const newProfiles = [...user.profiles];
                newProfiles[profileIdx] = updatedChild;

                // Save via standard flow (recursively call with 'profiles' set, so passes this check)
                await updateProfile({ profiles: newProfiles });
                return;
            }
        }
        // -------------------------------

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
        if (data.profiles !== undefined) firestoreData.profiles = data.profiles;
        if (data.currentProfileId !== undefined) firestoreData.currentProfileId = data.currentProfileId;

        await setDoc(doc(db, 'users', auth.currentUser.uid), firestoreData, { merge: true });
    };

    // 7. Add Child Profile
    const addChildProfile = async (name: string, avatar: string, age?: number) => {
        if (!auth.currentUser || !user) return;

        const newProfile: ChildProfile = {
            id: crypto.randomUUID(),
            name,
            avatar,
            age
        };

        const updatedProfiles = [...(user.profiles || []), newProfile];

        await updateProfile({
            profiles: updatedProfiles,
            currentProfileId: newProfile.id // Auto-switch to new profile
        });
    };

    // 9. Delete Child Profile (New)
    const deleteChildProfile = async (profileId: string) => {
        if (!auth.currentUser || !user || !user.profiles) return;

        // Filter out target profile
        const updatedProfiles = user.profiles.filter(p => p.id !== profileId);

        let newActiveId = user.currentProfileId;
        // If we are deleting the CURRENTLY active profile, switch back to parent (undefined)
        if (user.currentProfileId === profileId) {
            newActiveId = undefined;
        }

        await updateProfile({
            profiles: updatedProfiles,
            currentProfileId: newActiveId
        });
    };

    // 8. Switch Profile
    const switchProfile = async (profileId: string | null) => {
        if (!auth.currentUser) return;
        // Currently just updating local state/firestore preference
        // Depending on app logic, this might just be local state if we don't need persistence across devices for "last active"
        // But persisting is better UX.
        await updateProfile({ currentProfileId: profileId || undefined });
    };

    const activeProfile = user?.profiles?.find(p => p.id === user.currentProfileId) || null;

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            loginWithGoogle,
            loginWithApple,
            login,
            signup,
            logout,
            updateProfile,
            addChildProfile,
            deleteChildProfile,
            switchProfile,
            activeProfile
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
