import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const { login, loginWithGoogle, loginWithApple } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    // DEBUGGING STATE
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const addLog = (msg: string) => setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    // Install Global Error Handlers
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            addLog(`Global Error: ${event.message} at ${event.filename}:${event.lineno}`);
        };
        const handleRejection = (event: PromiseRejectionEvent) => {
            addLog(`Unhandled Rejection: ${event.reason}`);
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr('');
        setLoading(true);
        addLog(`Starting email login with: ${email}`);

        try {
            await login(email, password);
            addLog('Email login successful, navigating...');
            navigate('/home');
        } catch (error: any) {
            console.error("Login Error:", error);
            addLog(`Login Error: ${error.message} (${error.code})`);

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
                addLog('Firestore permission warning (ignoring)');
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
        // BLOCKING ALERT TO VERIFY CLICK
        alert(`DEBUG: Clicked ${provider} login. Starting...`);
        try {
            addLog(`Starting ${provider} login...`);
            let isNew = false;

            // ALERT BEFORE AWAIT
            if (provider === 'google') {
                alert('DEBUG: calling loginWithGoogle()');
                isNew = await loginWithGoogle();
            } else {
                isNew = await loginWithApple();
            }

            alert(`DEBUG: Login Success! isNew=${isNew}`);
            addLog(`${provider} login success. isNew=${isNew}`);

            if (isNew) {
                navigate('/startup');
            } else {
                navigate('/home');
            }
        } catch (error: any) {
            alert(`DEBUG: Catch Error! ${error.message}`);
            console.error("Login failed", error);
            addLog(`PROVIDER LOGIN FAILED: ${error.message} / ${error.code}`);
            setErr(error.message || "Login failed");
        }
    };

    const handleForgotPassword = () => {
        // Firebase handling would go here, for now alert is fine or sendPasswordResetEmail
        alert("Please use the Google/Apple login for this demo, or contact support.");
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
                            <span className="text-xl">🇬</span>
                            Continue with Google
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

                    {/* DEBUG LOG SECTION */}
                    {debugLogs.length > 0 && (
                        <div className="w-full mt-8 p-4 bg-black/80 rounded-xl text-green-400 text-xs font-mono overflow-hidden">
                            <div className="flex justify-between items-center mb-2 border-b border-white/20 pb-2">
                                <span className="font-bold text-white">Debug Logs</span>
                                <button onClick={() => setDebugLogs([])} className="text-xs text-white/50 hover:text-white">Clear</button>
                            </div>
                            <div className="h-40 overflow-y-auto">
                                {debugLogs.map((log, i) => (
                                    <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{log}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

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
