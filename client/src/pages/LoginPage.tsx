import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { login, loginWithGoogle, loginWithGoogleRedirect, loginWithApple } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    // Password reset states
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);

    // DEBUGGING STATE (Removed)
    // const [debugLogs, setDebugLogs] = useState<string[]>([]);
    // const addLog = ... (Removed)

    // Install Global Error Handlers (Removed)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr('');
        setLoading(true);
        // addLog(`Starting email login with: ${email}`);

        try {
            await login(email, password);
            // addLog('Email login successful, navigating...');
            navigate('/home');
        } catch (error: any) {
            console.error("Login Error:", error);
            // addLog(`Login Error: ${error.message} (${error.code})`);

            const code = error.code || '';
            const msg = error.message || '';

            // Handle specific error cases
            if (code === 'auth/invalid-credential' || msg.includes('invalid-credential') || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
                setErr('Incorrect email or password. Please try again.');
            } else if (code === 'auth/too-many-requests') {
                setErr('Too many failed attempts. Please try again later.');
            } else if (code === 'permission-denied' || msg.includes('Missing or insufficient permissions')) {
                // Firebase/Firestore permission error - not a login issue
                // This error should not prevent login, might be from background services
                console.warn('Firestore permission issue detected, but login succeeded at auth level');
                // addLog('Firestore permission warning (ignoring)');
                // Still navigate since authentication might have succeeded
                navigate('/home');
            } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                setErr('Cannot connect to server. Please check your connection.');
            } else {
                setErr('Login failed. Please check your email and password.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleProvider = async (provider: 'google' | 'apple') => {
        setErr('');
        try {
            let isNew = false;
            if (provider === 'google') {
                try {
                    isNew = await loginWithGoogle();
                } catch (popupError: any) {
                    // If popup is blocked or fails, and it's Google, offer redirect as fallback
                    if (popupError.message.includes('Popup blocked') || popupError.message.includes('Login cancelled')) {
                        console.log("Switching to redirect mode due to popup issue...");
                        await loginWithGoogleRedirect();
                        return; // Execution will resume via onAuthStateChanged after redirect
                    }
                    throw popupError;
                }
            } else {
                isNew = await loginWithApple();
            }

            if (isNew) {
                navigate('/startup');
            } else {
                navigate('/home');
            }
        } catch (error: any) {
            console.error("Login failed", error);
            setErr(error.message || "Login failed");
        }
    };

    const handleForgotPassword = () => {
        setResetEmail(email); // Pre-fill with current email
        setShowResetModal(true);
        setResetSuccess(false);
        setErr(''); // Clear any previous errors
    };

    const handleSendResetEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) return;

        setResetLoading(true);
        setErr('');

        try {
            // Import Firebase auth dynamically
            const { getAuth, sendPasswordResetEmail } = await import('firebase/auth');
            const auth = getAuth();

            // Configure action code settings for proper redirect
            const actionCodeSettings = {
                // URL you want to redirect back to after clicking reset link
                url: window.location.origin + '/reset-password',
                handleCodeInApp: false,
            };

            await sendPasswordResetEmail(auth, resetEmail, actionCodeSettings);
            setResetSuccess(true);

            // Auto-close after 8 seconds (给用户更多时间阅读提示)
            setTimeout(() => {
                setShowResetModal(false);
                setResetSuccess(false);
                setResetEmail(''); // 重置邮箱，允许再次发送
            }, 8000);
        } catch (error: any) {
            console.error('Password reset error:', error);
            if (error.code === 'auth/user-not-found') {
                setErr('No account found with this email.');
            } else if (error.code === 'auth/invalid-email') {
                setErr('Invalid email address.');
            } else if (error.code === 'auth/too-many-requests') {
                setErr('Too many requests. Please wait a few minutes and try again.');
            } else {
                setErr('Failed to send reset email. Please try again.');
            }
        } finally {
            setResetLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-[#FAFAFA] overflow-y-auto relative custom-scrollbar">
            {/* Scrollable Container Wrapper for safer centering */}
            <div className="min-h-full w-full flex flex-col items-center justify-center p-4 py-10">

                {/* Decorative Background Elements (Fixed to backend) */}
                <div className="fixed top-[-100px] right-[-100px] w-64 h-64 bg-yellow-200 rounded-full blur-3xl opacity-50 pointer-events-none" />
                <div className="fixed bottom-[-50px] left-[-50px] w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-50 pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white/60 backdrop-blur-xl rounded-[40px] shadow-xl p-8 flex flex-col items-center border border-white/50 relative z-10"
                >
                    {/* Logo Video */}
                    <div className="mb-6 w-64 flex items-center justify-center shrink-0">
                        <video
                            src="/catlogo.mp4"
                            autoPlay
                            loop
                            muted
                            playsInline
                            controlsList="nodownload noremoteplayback"
                            disablePictureInPicture
                            onContextMenu={(e) => e.preventDefault()}
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    <h1 className="text-2xl font-black text-slate-800 mb-2 text-center">Welcome to KidsArtoon!</h1>
                    <p className="text-slate-500 mb-6 text-center text-sm font-medium">Log in to create and save your art</p>

                    {err && <div className="mb-4 text-red-500 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl text-center">{err}</div>}

                    <form onSubmit={handleLogin} className="w-full space-y-4 mb-2">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full p-4 bg-blue-500 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Log In"}
                        </button>
                    </form>

                    <button
                        onClick={handleForgotPassword}
                        className="mb-6 text-sm text-slate-400 font-bold hover:text-primary transition-colors hover:underline"
                        type="button"
                    >
                        Forgot password?
                    </button>

                    <div className="relative w-full text-center border-t border-slate-200 pt-6 mt-0">
                        <span className="absolute top-[-10px] left-1/2 -translate-x-1/2 bg-[#FAFAFA] px-2 text-xs font-bold text-slate-400">OR</span>
                    </div>

                    <div className="flex flex-col gap-4 w-full mt-4">
                        {/* Google Button */}
                        <button
                            onClick={() => handleProvider('google')}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-2xl shadow-sm border-2 border-slate-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            type="button"
                        >
                            Continue with Google
                        </button>

                        <button
                            onClick={() => handleProvider('google')}
                            className="w-full text-xs text-slate-400 font-medium hover:text-blue-500 transition-colors py-1"
                            type="button"
                        >
                            Popup blocked? Click here to use redirect
                        </button>

                        {/* Apple Button */}
                        <button
                            onClick={() => handleProvider('apple')}
                            className="w-full bg-black text-white hover:bg-slate-800 font-bold py-3 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            type="button"
                        >
                            <span className="text-xl">🍎</span>
                            Continue with Apple
                        </button>
                    </div>

                    {/* DEBUG LOG SECTION (Removed) */}
                </motion.div>

                {/* Password Reset Modal */}
                {showResetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full mx-4"
                        >
                            {resetSuccess ? (
                                <div className="text-center">
                                    <div className="text-6xl mb-4">✅</div>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">Email Sent!</h3>
                                    <p className="text-slate-600 mb-3">
                                        Password reset email has been sent.
                                        <br />
                                        <strong>Check your inbox now!</strong>
                                    </p>
                                    <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-xl mb-2">
                                        ⏱️ Reset link valid for 1 hour
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Don't see it? Check spam folder or wait a moment
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-black text-slate-800 mb-2">Reset Password</h3>
                                    <p className="text-slate-500 mb-6 text-sm">
                                        Enter your email to receive reset instructions
                                    </p>

                                    {err && <div className="mb-4 text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">{err}</div>}

                                    <form onSubmit={handleSendResetEmail} className="space-y-4">
                                        <input
                                            type="email"
                                            placeholder="Email"
                                            value={resetEmail}
                                            onChange={e => setResetEmail(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                            autoFocus
                                        />
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowResetModal(false);
                                                    setErr('');
                                                }}
                                                className="flex-1 p-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={resetLoading}
                                                className="flex-1 p-3 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {resetLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Send Email'}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}

                <button
                    onClick={() => navigate('/signup')}
                    className="mt-8 text-slate-500 text-sm font-bold hover:text-blue-500 transition-colors z-10 py-4"
                >
                    Create new account
                </button>
            </div>
        </div>
    );
};

export default LoginPage;
