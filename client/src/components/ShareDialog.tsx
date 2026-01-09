import React from 'react';
import { X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareDialogProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    title?: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({ isOpen, onClose, imageUrl, title = 'My Creation' }) => {
    const platforms = [
        {
            name: 'Instagram',
            icon: '📷',
            color: 'from-purple-500 to-pink-500',
            action: () => {
                // Instagram doesn't support direct sharing via URL, so we copy the image URL
                navigator.clipboard.writeText(imageUrl);
                alert('Image URL copied! Open Instagram app to share.');
            }
        },
        {
            name: 'Facebook',
            icon: '👍',
            color: 'from-blue-600 to-blue-700',
            action: () => {
                const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`;
                window.open(url, '_blank', 'width=600,height=400');
            }
        },
        {
            name: 'X (Twitter)',
            icon: '🐦',
            color: 'from-black to-gray-800',
            action: () => {
                const text = encodeURIComponent(`Check out my ${title}!`);
                const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(imageUrl)}`;
                window.open(url, '_blank', 'width=600,height=400');
            }
        },
        {
            name: 'TikTok',
            icon: '🎵',
            color: 'from-pink-500 to-cyan-500',
            action: () => {
                // TikTok doesn't support direct sharing via URL
                navigator.clipboard.writeText(imageUrl);
                alert('Image URL copied! Open TikTok app to share.');
            }
        }
    ];

    const handleDownloadImage = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `kidsartoon-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image. Please try again.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                    <Share2 className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800">Share Your Creation</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-600" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Download Button */}
                            <button
                                onClick={handleDownloadImage}
                                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">⬇️</span>
                                <span>Download Image First</span>
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-3 text-sm text-slate-500 font-medium">Then share on</span>
                                </div>
                            </div>

                            {/* Platform Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                {platforms.map((platform) => (
                                    <button
                                        key={platform.name}
                                        onClick={platform.action}
                                        className={`p-4 rounded-2xl bg-gradient-to-br ${platform.color} text-white font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2`}
                                    >
                                        <span className="text-3xl">{platform.icon}</span>
                                        <span className="text-sm">{platform.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Help Text */}
                            <p className="text-xs text-center text-slate-500 leading-relaxed">
                                💡 <strong>Tip:</strong> Download the image first, then use your social media app to post it!
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
