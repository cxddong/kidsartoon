import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Share2 } from 'lucide-react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareId: string; // The ID of the content to share
    title: string;
    thumbnailUrl?: string;
    type: 'video' | 'book' | 'comic' | 'image';
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareId, title, thumbnailUrl, type }) => {
    const qrRef = useRef<HTMLDivElement>(null);
    const shareUrl = `${window.location.origin}/view/${shareId}`;

    const handleDownload = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (canvas) {
            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = `magic-pass-${shareId}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Gradient */}
                    <div className="h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-1 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                            <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-lg rotate-3 overflow-hidden">
                                {thumbnailUrl ? (
                                    <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-2xl">🎁</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 pb-8 px-6 text-center">
                        <h3 className="text-xl font-black text-slate-800 mb-1">Magic Share Pass 🎫</h3>
                        <p className="text-slate-500 text-sm mb-6">Scan to watch <span className="font-bold text-indigo-600">{title}</span>!</p>

                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-white border-4 border-indigo-50 rounded-2xl shadow-inner relative group" ref={qrRef}>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                                <QRCodeCanvas
                                    value={shareUrl}
                                    size={200}
                                    bgColor={"#ffffff"}
                                    fgColor={"#4338ca"}
                                    level={"H"}
                                    imageSettings={{
                                        src: "/favicon.ico", // Using favicon as placeholder logo if specific asset not avail
                                        x: undefined,
                                        y: undefined,
                                        height: 34,
                                        width: 34,
                                        excavate: true,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                            >
                                <Download size={16} /> Save Image
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(shareUrl);
                                    alert("Link copied!");
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl font-bold text-sm transition-colors"
                            >
                                <Share2 size={16} /> Copy Link
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-50 py-3 text-center border-t border-slate-100">
                        <p className="text-xs text-slate-400 font-medium">Powered by KidsArtoon Magic Share™</p>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
