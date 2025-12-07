import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';

const SignupPage: React.FC = () => {
    const { signup, loginWithGoogle, loginWithApple } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr('');
        setLoading(true);
        try {
            await signup(email, password, name);
            navigate('/home');
        } catch (error: any) {
            const msg = error.message;
            if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                setErr('Cannot connect to server. Please try again later.');
            } else {
                setErr(msg || 'Signup failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleProvider = async (provider: 'google' | 'apple') => {
        try {
            let isNew = false;
            if (provider === 'google') isNew = await loginWithGoogle();
            else isNew = await loginWithApple();

            if (isNew) {
                navigate('/startup');
            } else {
                navigate('/home');
            }
        } catch (error: any) {
            console.error("Signup failed", error);
            alert(`Last Error: ${error.message}`);
            setErr(error.message || "Signup failed");
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-pink-200 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-purple-200 rounded-full blur-3xl opacity-50" />

            <button
                onClick={() => navigate('/login')}
                className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors"
                type="button"
            >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/60 backdrop-blur-xl rounded-[40px] shadow-xl p-8 flex flex-col items-center border border-white/50"
            >
                {/* Logo */}
                <div className="mb-8 p-4 bg-white rounded-3xl shadow-sm">
                    <span className="text-4xl">🚀</span>
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-2">Create Account</h1>
                <p className="text-slate-500 mb-6 text-center text-sm font-medium">Join us to start your artistic journey!</p>

                {err && <div className="mb-4 text-red-500 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl">{err}</div>}

                <form onSubmit={handleSignup} className="w-full space-y-4 mb-6">
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
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
                        {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Sign Up"}
                    </button>
                </form>

                <div className="relative w-full text-center border-t border-slate-200 pt-6 mt-2">
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
                        Sign up with Google
                    </button>

                    {/* Apple Button */}
                    <button
                        onClick={() => handleProvider('apple')}
                        className="w-full bg-black text-white hover:bg-slate-800 font-bold py-3 rounded-2xl shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        type="button"
                    >
                        <span className="text-xl">🍎</span>
                        Sign up with Apple
                    </button>
                </div>
            </motion.div>

            <div className="mt-8 flex gap-2 text-sm font-bold">
                <span className="text-slate-400">Already have an account?</span>
                <button onClick={() => navigate('/login')} className="text-blue-500 hover:underline">
                    Log in
                </button>
            </div>
        </div>
    );
};

export default SignupPage;
