import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
    onClick?: () => void;
    className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, className = '' }) => {
    const navigate = useNavigate();
    const handleClick = () => {
        if (onClick) onClick();
        else navigate(-1);
    };

    return (
        <button
            onClick={handleClick}
            className={`p-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-700 hover:bg-white hover:scale-105 transition-all shadow-sm ${className}`}
        >
            <ArrowLeft className="w-6 h-6" />
        </button>
    );
};
