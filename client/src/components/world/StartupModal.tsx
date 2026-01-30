
import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Upload } from 'lucide-react';

interface StartupModalProps {
    onDraw: () => void;
    onUpload: (image: string) => void;
}

export const StartupModal: React.FC<StartupModalProps> = ({ onDraw, onUpload }) => {

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    onUpload(reader.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-white/80 ring-4 ring-indigo-200"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-indigo-900 mb-2">Welcome Back! ✨</h2>
                    <p className="text-lg text-indigo-600 font-medium">What magic shall we create today?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Left Option: Draw */}
                    <button
                        onClick={onDraw}
                        className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 hover:scale-105 transition-all group"
                    >
                        <div className="w-20 h-20 bg-amber-200 rounded-full flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
                            <Palette className="w-10 h-10 text-amber-700" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-black text-amber-900 text-lg">I want to Draw</h3>
                            <p className="text-xs text-amber-700 font-bold">Start fresh canvas</p>
                        </div>
                    </button>

                    {/* Right Option: Upload */}
                    <label className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 hover:scale-105 transition-all group cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                        <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center shadow-inner group-hover:-rotate-12 transition-transform">
                            <Upload className="w-10 h-10 text-blue-700" />
                        </div>
                        <div className="text-center">
                            <h3 className="font-black text-blue-900 text-lg">I have a Picture</h3>
                            <p className="text-xs text-blue-700 font-bold">Upload from gallery</p>
                        </div>
                    </label>
                </div>
            </motion.div>
        </div>
    );
};
