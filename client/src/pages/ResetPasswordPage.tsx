import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const oobCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    useEffect(() => {
        // Verify this is a password reset request
        if (mode !== 'resetPassword' || !oobCode) {
            setError('Invalid or expired reset link. Please request a new one.');
        }
    }, [mode, oobCode]);

    const validatePassword = () => {
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validatePassword()) return;
        if (!oobCode) return;

        setLoading(true);

        try {
            const { getAuth, confirmPasswordReset } = await import('firebase/auth');
            const auth = getAuth();

            await confirmPasswordReset(auth, oobCode, newPassword);

            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error: any) {
            console.error('Password reset error:', error);
            if (error.code === 'auth/expired-action-code') {
                setError('Reset link has expired. Please request a new one.');
            } else if (error.code === 'auth/invalid-action-code') {
                setError('Invalid reset link. Please request a new one.');
            } else if (error.code === 'auth/weak-password') {
                setError('Password is too weak. Please use a stronger password.');
            } else {
                setError('Failed to reset password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
                >
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Password Reset!</h2>
                    <p className="text-slate-600">
                        Your password has been successfully updated.
                        <br />
                        Redirecting to login...
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#FAFAFA] flex items-center justify-center p-4">
            <div className="fixed top-[-100px] right-[-100px] w-64 h-64 bg-yellow-200 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="fixed bottom-[-50px] left-[-50px] w-80 h-80 bg-blue-200 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/60 backdrop-blur-xl rounded-[40px] shadow-xl p-8 relative z-10"
            >
                <div className="mb-6 w-48 mx-auto">
                    <video
                        src="/catlogo.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-auto object-contain"
                    />
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-2 text-center">Reset Password</h1>
                <p className="text-slate-500 mb-6 text-center text-sm font-medium">
                    Enter your new password below
                </p>

                {error && (
                    <div className="mb-4 text-red-500 font-bold text-sm bg-red-50 px-4 py-2 rounded-xl text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="New Password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full p-4 pr-12 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={!oobCode || mode !== 'resetPassword'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full p-4 pr-12 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={!oobCode || mode !== 'resetPassword'}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !oobCode || mode !== 'resetPassword'}
                        className="w-full p-4 bg-blue-500 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-blue-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <><Loader2 className="animate-spin w-6 h-6" /> Resetting...</> : 'Reset Password'}
                    </button>
                </form>

                <button
                    onClick={() => navigate('/login')}
                    className="mt-6 w-full text-sm text-slate-500 font-bold hover:text-blue-500 transition-colors"
                >
                    Back to Login
                </button>
            </motion.div>
        </div>
    );
};

export default ResetPasswordPage;
