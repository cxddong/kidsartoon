export interface PuzzlePiece {
    id: number;
    correctRow: number;
    correctCol: number;
    currentRow: number;
    currentCol: number;
    imageData: string; // Base64 slice
    isPlaced: boolean;
}

export type DifficultyLevel = 'baby' | 'easy' | 'smart' | 'expert' | 'master';

export const DIFFICULTY_CONFIG = {
    baby: { grid: 2, pieces: 4, snapTolerance: 25, label: 'Baby (4 pcs)' },
    easy: { grid: 3, pieces: 9, snapTolerance: 20, label: 'Easy (9 pcs)' },
    smart: { grid: 4, pieces: 16, snapTolerance: 20, label: 'Smart (16 pcs)' },
    expert: { grid: 7, pieces: 49, snapTolerance: 10, label: 'Expert (49 pcs)' },
    master: { grid: 10, pieces: 100, snapTolerance: 10, label: 'Master (100 pcs)' }
} as const;

export interface SavedPuzzleState {
    imageId: string;
    imageUrl: string;
    difficulty: DifficultyLevel;
    gridSize: number;
    pieces: PuzzlePiece[];
    timestamp: number;
    completedPieces: number;
    totalPlayTime: number;
}

const STORAGE_KEY = 'kat_puzzle_progress';

/**
 * Slice an image into puzzle pieces based on grid size
 */
export async function sliceImage(
    imageUrl: string,
    gridSize: number
): Promise<PuzzlePiece[]> {
    return new Promise((resolve, reject) => {
        const loadAndSlice = (src: string, isRetry = false) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    if (img.width === 0 || img.height === 0) {
                        reject(new Error('Image has 0 dimensions'));
                        return;
                    }

                    const pieceWidth = img.width / gridSize;
                    const pieceHeight = img.height / gridSize;

                    const pieces: PuzzlePiece[] = [];
                    let id = 0;

                    for (let row = 0; row < gridSize; row++) {
                        for (let col = 0; col < gridSize; col++) {
                            canvas.width = pieceWidth;
                            canvas.height = pieceHeight;

                            ctx.clearRect(0, 0, pieceWidth, pieceHeight);
                            ctx.drawImage(
                                img,
                                col * pieceWidth,
                                row * pieceHeight,
                                pieceWidth,
                                pieceHeight,
                                0,
                                0,
                                pieceWidth,
                                pieceHeight
                            );

                            pieces.push({
                                id: id++,
                                correctRow: row,
                                correctCol: col,
                                currentRow: -1,
                                currentCol: -1,
                                imageData: canvas.toDataURL('image/png'),
                                isPlaced: false
                            });
                        }
                    }

                    resolve(pieces);
                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => {
                if (!isRetry && src.includes('/api/media/proxy')) {
                    // Proxy failed, try direct (e.g. Firebase might have CORS enabled)
                    console.warn(`[Puzzle] Proxy load failed for ${src}. Retrying direct load...`);
                    const originalUrl = decodeURIComponent(src.split('url=')[1]);
                    loadAndSlice(originalUrl, true);
                } else {
                    console.error('[Puzzle] Image Load Error', src);
                    reject(new Error('Failed to load image for puzzle'));
                }
            };

            img.src = src;
        };

        // Initial load logic: Auto-proxy remote images unless same origin
        let initialSrc = imageUrl;
        if (initialSrc.startsWith('http') && !initialSrc.startsWith(window.location.origin)) {
            // Check if already proxied to avoid double-proxy
            if (!initialSrc.includes('/api/media/proxy')) {
                initialSrc = `/api/media/proxy/image?url=${encodeURIComponent(initialSrc)}`;
            }
        }

        loadAndSlice(initialSrc);
    });
}

/**
 * Shuffle puzzle pieces using Fisher-Yates algorithm
 */
export function shufflePieces(pieces: PuzzlePiece[]): PuzzlePiece[] {
    const shuffled = [...pieces];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/**
 * Check if a piece is close enough to snap to its correct position
 */
export function checkSnapDistance(
    dragX: number,
    dragY: number,
    piece: PuzzlePiece,
    pieceWidth: number,
    pieceHeight: number,
    snapTolerance: number
): { snapped: boolean; row: number; col: number } {
    const targetX = piece.correctCol * pieceWidth;
    const targetY = piece.correctRow * pieceHeight;

    const distance = Math.sqrt(
        Math.pow(dragX - targetX, 2) +
        Math.pow(dragY - targetY, 2)
    );

    if (distance < snapTolerance) {
        return {
            snapped: true,
            row: piece.correctRow,
            col: piece.correctCol
        };
    }

    return { snapped: false, row: -1, col: -1 };
}

/**
 * Check if all pieces are correctly placed (win condition)
 */
export function checkWinCondition(pieces: PuzzlePiece[]): boolean {
    return pieces.every(piece => piece.isPlaced);
}

/**
 * Save puzzle progress to localStorage
 */
export function savePuzzleState(imageId: string, state: SavedPuzzleState): void {
    try {
        const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

        // Strip heavy base64 imageData from pieces before saving
        const optimizedPieces = state.pieces.map(p => ({
            ...p,
            imageData: '' // Don't save image data, we regenerate it on load
        }));

        storage[imageId] = {
            ...state,
            pieces: optimizedPieces,
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
        console.log(`[Puzzle] Saved progress for ${imageId}: ${state.completedPieces}/${state.pieces.length} pieces`);
    } catch (error: any) {
        console.error('[Puzzle] Failed to save progress:', error);
        // If quota exceeded, try to clear space
        if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
            console.warn('[Puzzle] Storage quota exceeded. Clearing old saves...');
            try {
                // Clear all puzzle saves as a fallback to allow playing
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                console.error('Failed to clear storage:', e);
            }
        }
    }
}

/**
 * Load saved puzzle progress from localStorage
 */
export function loadPuzzleState(imageId: string): SavedPuzzleState | null {
    try {
        const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const saved = storage[imageId];

        if (!saved) return null;

        // Check if save is not too old (7 days)
        const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - saved.timestamp > MAX_AGE) {
            deletePuzzleState(imageId);
            return null;
        }

        return saved;
    } catch (error) {
        console.error('[Puzzle] Failed to load progress:', error);
        return null;
    }
}

/**
 * Delete saved puzzle progress
 */
export function deletePuzzleState(imageId: string): void {
    try {
        const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        delete storage[imageId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
        console.log(`[Puzzle] Deleted progress for ${imageId}`);
    } catch (error) {
        console.error('[Puzzle] Failed to delete progress:', error);
    }
}

/**
 * Cleanup old puzzle saves (>7 days)
 */
export function cleanupOldPuzzles(): void {
    try {
        const storage = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        let cleaned = 0;

        Object.keys(storage).forEach(imageId => {
            if (now - storage[imageId].timestamp > MAX_AGE) {
                delete storage[imageId];
                cleaned++;
            }
        });

        if (cleaned > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
            console.log(`[Puzzle] Cleaned up ${cleaned} old puzzle saves`);
        }
    } catch (error) {
        console.error('[Puzzle] Failed to cleanup:', error);
    }
}
