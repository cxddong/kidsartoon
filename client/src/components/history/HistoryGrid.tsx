import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HistoryThumbnailCard from './HistoryThumbnailCard';
import type { ImageRecord } from './ImageModal';
import { jellyPopContainer } from '../../lib/animations';

interface HistoryGridProps {
    images: ImageRecord[];
    onImageClick: (image: ImageRecord) => void;
    viewMode?: 'grid' | 'list';
    isSelectionMode?: boolean;
    selectedIds?: Set<string>;
    onToggleItem?: (id: string) => void;
}

const HistoryGrid: React.FC<HistoryGridProps> = ({
    images,
    onImageClick,
    viewMode = 'grid',
    isSelectionMode,
    selectedIds,
    onToggleItem
}) => {
    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-3xl">🖼️</span>
                </div>
                <h3 className="text-lg font-bold mb-1">No artwork found</h3>
                <p className="text-sm">Create something amazing first!</p>
            </div>
        );
    }

    return (
        <motion.div
            layout
            variants={jellyPopContainer}
            initial="initial"
            animate="animate"
            className={viewMode === 'grid'
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 p-1 pb-20"
                : "flex flex-col gap-3 p-1 pb-20 max-w-3xl mx-auto"
            }
        >
            <AnimatePresence mode='popLayout'>
                {images.map((image) => (
                    <HistoryThumbnailCard
                        key={image.id}
                        image={image}
                        onClick={() => onImageClick(image)}
                        viewMode={viewMode}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds?.has(image.id)}
                        onToggle={() => onToggleItem?.(image.id)}
                    />
                ))}
            </AnimatePresence>
        </motion.div>
    );
};

export default HistoryGrid;
