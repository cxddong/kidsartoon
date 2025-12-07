import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const HeaderBar: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="w-full flex items-center justify-end px-6 py-4 fixed top-0 right-0 z-50 pointer-events-none">
            {/* Always show Login / Signup Buttons as requested */}
            <div className="flex gap-3 pointer-events-auto">
                {user ? (
                    <button
                        onClick={() => navigate('/profile')}
                        className="w-12 h-12 rounded-full border-[3px] border-white shadow-xl overflow-hidden hover:scale-105 transition-transform bg-slate-200"
                        title="Go to Profile"
                    >
                        <img
                            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // Fallback if image fails
                                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;
                            }}
                        />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white text-slate-700 font-black text-sm hover:bg-white hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <LogIn className="w-4 h-4" />
                            Log In
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            className="px-5 py-2.5 bg-blue-500 rounded-xl shadow-lg text-white font-black text-sm hover:bg-blue-600 hover:scale-105 transition-all hidden sm:block"
                        >
                            Sign Up
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
