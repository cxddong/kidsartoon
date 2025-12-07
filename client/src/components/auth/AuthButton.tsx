import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthButton: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(user ? '/profile' : '/login')}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 shadow-sm hover:bg-white/30 transition-all group"
        >
            {user ? (
                <>
                    <div className="w-6 h-6 rounded-full bg-yellow-200 border border-white overflow-hidden">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px]">👤</div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="p-1 bg-white/20 rounded-full">
                        <LogIn className="w-3.5 h-3.5 text-slate-700" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 hidden sm:block pr-1">Login</span>
                </>
            )}
        </button>
    );
};
