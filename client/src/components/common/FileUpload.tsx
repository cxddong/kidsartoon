
import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: Record<string, string[]>;
    maxSize?: number; // MB
    className?: string;
    label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
    onFileSelect,
    accept = { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxSize = 5,
    className = "",
    label = "Click or Drag to Upload"
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndPass = (file: File) => {
        setError(null);
        // Check size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File too large. Max size is ${maxSize}MB`);
            return;
        }
        // Simple type check (can be expanded with 'accept' parsing if needed)
        if (!file.type.startsWith('image/')) {
            setError("Only image files are allowed");
            return;
        }

        onFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndPass(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            validateAndPass(e.target.files[0]);
        }
    };

    return (
        <div
            className={`relative group cursor-pointer ${className}`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
        >
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={Object.entries(accept).map(([k, v]) => `${k},${v.join(',')}`).join(',')}
                onChange={handleChange}
            />

            <div className={`
                w-full h-full rounded-3xl border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center
                ${dragActive
                    ? 'border-white bg-white/20 scale-105'
                    : 'border-white/30 bg-white/5 hover:bg-white/10 hover:border-white/50'}
            `}>
                <div className="bg-white/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
                <p className="text-sm text-white/50">Supports PNG, JPG, WEBP (Max {maxSize}MB)</p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 px-4 py-2 bg-red-500/80 rounded-lg text-white text-sm font-bold"
                    >
                        {error}
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default FileUpload;
