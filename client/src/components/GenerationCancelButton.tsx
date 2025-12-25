import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface GenerationCancelButtonProps {
    isGenerating: boolean;
    onCancel: () => void;
    className?: string;
}

const GenerationCancelButton: React.FC<GenerationCancelButtonProps> = ({
    isGenerating,
    onCancel,
    className
}) => {
    const handleClick = () => {
        if (isGenerating) {
            const confirmed = window.confirm(
                "Generation is in progress. Leaving now might prevent you from seeing the results, and points have already been deducted. Are you sure you want to leave?"
            );
            if (!confirmed) return;
        }
        onCancel();
    };

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg",
                isGenerating
                    ? "bg-red-500 hover:bg-red-600 text-white border-2 border-red-400"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600 border-2 border-gray-200",
                className
            )}
        >
            {isGenerating ? (
                <>
                    <XCircle className="w-5 h-5" />
                    <span>Cancel & Return</span>
                </>
            ) : (
                <>
                    <ArrowLeft className="w-5 h-5" />
                    <span>Return to Home</span>
                </>
            )}
        </motion.button>
    );
};

export default GenerationCancelButton;
