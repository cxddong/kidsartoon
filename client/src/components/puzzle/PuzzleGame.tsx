import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Draggable from 'react-draggable';
import {
    type PuzzlePiece,
    type DifficultyLevel,
    DIFFICULTY_CONFIG,
    sliceImage,
    shufflePieces,
    checkSnapDistance,
    checkWinCondition,
    savePuzzleState,
    loadPuzzleState,
    deletePuzzleState
} from '../../lib/puzzle-utils';
import { DifficultySelector } from './DifficultySelector';
import { celebrateWin, burstConfetti } from '../../lib/confetti';
import { X, RefreshCw, Eye, ThumbsUp, Coffee, Sparkles, Trophy, RotateCcw } from 'lucide-react';
import { usePuzzleSession } from '../../lib/puzzle-session';
import { playUiSound } from '../../utils/SoundSynth';

interface PuzzleGameProps {
    imageUrl: string;
    imageId: string;
    onClose: () => void;
    videoUrl?: string; // Optional: Auto-play video on win
}

export const PuzzleGame: React.FC<PuzzleGameProps> = ({ imageUrl, imageId, onClose, videoUrl }) => {
    const [gameState, setGameState] = useState<'selecting' | 'loading' | 'playing' | 'won'>('selecting');
    const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(null);
    const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
    const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
    const [hasSavedProgress, setHasSavedProgress] = useState(false);
    const [showGhost, setShowGhost] = useState(true);
    const boardRef = useRef<HTMLDivElement>(null);
    const { session, incrementGames, needsRest, resetSession } = usePuzzleSession();
    const [showRestReminder, setShowRestReminder] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    // Fake loading progress
    useEffect(() => {
        if (gameState === 'loading') {
            setLoadingProgress(0);
            const interval = setInterval(() => {
                setLoadingProgress(prev => Math.min(prev + Math.floor(Math.random() * 10), 99));
            }, 100);
            return () => clearInterval(interval);
        }
    }, [gameState]);

    // Check for saved progress on mount
    useEffect(() => {
        const saved = loadPuzzleState(imageId);
        if (saved && saved.completedPieces > 0) {
            setHasSavedProgress(true);
        }
    }, [imageId]);

    // Handle responsive board size
    useEffect(() => {
        const updateSize = () => {
            if (boardRef.current) {
                const container = boardRef.current.parentElement;
                if (container) {
                    const maxWidth = Math.min(container.clientWidth - 40, 800);
                    // const maxHeight = container.clientHeight - 200; // Removed unused

                    // We need to maintain aspect ratio, but for puzzles we often assume square or use image proxy
                    // For now let's use a reasonable max size and we'll adjust piece sizes based on actual image ratio
                    setBoardSize({ width: maxWidth, height: maxWidth }); // Assuming square for simplicity or we adjust later
                }
            }
        };

        if (gameState === 'playing') {
            updateSize();
            window.addEventListener('resize', updateSize);
        }
        return () => window.removeEventListener('resize', updateSize);
    }, [gameState]);

    const startNewGame = async (level: DifficultyLevel) => {
        console.log("Starting new game with difficulty:", level);
        try {
            setDifficulty(level);
            // Force re-render of loading state immediately
            setGameState('loading');

            // Wait a tick to ensure UI updates
            await new Promise(r => setTimeout(r, 50));

            const config = DIFFICULTY_CONFIG[level];
            console.log("Slicing image...", imageUrl);
            const sliced = await sliceImage(imageUrl, config.grid);
            console.log("Image sliced successfully", sliced.length);

            const shuffled = shufflePieces(sliced);
            setPieces(shuffled);
            setGameState('playing');

            // Initial save
            savePuzzleState(imageId, {
                imageId,
                imageUrl,
                difficulty: level,
                gridSize: config.grid,
                pieces: shuffled,
                timestamp: Date.now(),
                completedPieces: 0,
                totalPlayTime: 0
            });
        } catch (error: any) {
            console.error("Failed to start puzzle:", error);
            // Show detailed error to user to help debug
            alert(`Puzzle Error: ${error.message || 'Unknown error'}. Try refreshing the page.`);
            setGameState('selecting');
        }
    };

    const continueGame = async () => {
        try {
            const saved = loadPuzzleState(imageId);
            if (saved) {
                setGameState('loading');

                // We need to re-slice the image because we don't save the heavy base64 data
                const config = DIFFICULTY_CONFIG[saved.difficulty];
                console.log("Restoring puzzle...", imageUrl);

                // Re-slice to get fresh image data
                const freshPieces = await sliceImage(imageUrl, saved.gridSize);

                // Merge saved positions/state with fresh image data
                const restoredPieces = saved.pieces.map(savedPiece => {
                    const freshPiece = freshPieces.find(p => p.id === savedPiece.id);
                    return {
                        ...savedPiece,
                        imageData: freshPiece?.imageData || ''
                    };
                });

                setDifficulty(saved.difficulty);
                setPieces(restoredPieces);
                setGameState('playing');
            }
        } catch (error) {
            console.error("Failed to continue game:", error);
            alert("Could not restore saved game. Starting new.");
            // Fallback to selecting if restore fails
            setGameState('selecting');
        }
    };

    const handlePieceDrop = (pieceId: number, x: number, y: number) => {
        if (!difficulty) return;

        const config = DIFFICULTY_CONFIG[difficulty];
        const pieceWidth = boardSize.width / config.grid;
        const pieceHeight = boardSize.height / config.grid;

        const piece = pieces.find(p => p.id === pieceId);
        if (!piece || piece.isPlaced) return;

        // checkSnapDistance expects drag coordinates relative to top-left of board
        const snap = checkSnapDistance(x, y, piece, pieceWidth, pieceHeight, config.snapTolerance);

        if (snap.snapped) {
            // Success snap!
            const newPieces = pieces.map(p =>
                p.id === pieceId ? { ...p, isPlaced: true, currentRow: snap.row, currentCol: snap.col } : p
            );
            setPieces(newPieces);

            // Play snap sound (Updated to SoundSynth)
            playUiSound('pop');

            // Save progress
            savePuzzleState(imageId, {
                imageId,
                imageUrl,
                difficulty,
                gridSize: config.grid,
                pieces: newPieces,
                timestamp: Date.now(),
                completedPieces: newPieces.filter(p => p.isPlaced).length,
                totalPlayTime: 0 // todo
            });

            // Check win
            if (checkWinCondition(newPieces)) {
                setGameState('won');
                deletePuzzleState(imageId);
                celebrateWin();
                playUiSound('magic');
                incrementGames();

                // Check if needs rest after this game
                const isAdvanced = difficulty === 'expert' || difficulty === 'master';
                if (needsRest(isAdvanced)) {
                    setTimeout(() => setShowRestReminder(true), 1500);
                }
            } else {
                playUiSound('click');
                burstConfetti(); // Small burst for motivation
            }
        } else {
            playUiSound('click');
        }
    };

    const resetGame = () => {
        if (difficulty) {
            deletePuzzleState(imageId);
            startNewGame(difficulty);
        }
    };

    if (gameState === 'selecting') {
        return (
            <DifficultySelector
                onSelect={startNewGame}
                onClose={onClose}
                hasSavedProgress={hasSavedProgress}
                onContinue={continueGame}
            />
        );
    }

    const config = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;
    const progress = (pieces.filter(p => p.isPlaced).length / pieces.length) * 100;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="relative w-full max-w-6xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full md:h-auto md:max-h-[90vh]">

                {/* Close Button (Absolute) */}
                <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2 bg-slate-100/80 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-500 transition-colors">
                    <X size={24} />
                </button>

                {/* Main Game Area (Left) */}
                <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center p-4 select-none">
                    {gameState === 'loading' ? (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-indigo-400 font-black animate-pulse uppercase tracking-widest">Slicing Magic...</p>
                            <p className="text-slate-400 font-bold mt-2">{loadingProgress}%</p>
                        </div>
                    ) : (
                        <>
                            {/* The Board */}
                            <div
                                ref={boardRef}
                                className="relative bg-white shadow-xl rounded-xl overflow-visible border border-slate-200 z-10"
                                style={{
                                    width: boardSize.width,
                                    height: boardSize.height,
                                    touchAction: 'none' // Prevent browser scrolling on the board
                                }}
                            >
                                {/* Ghost Image Hint (Refined Style) */}
                                {showGhost && (
                                    <img
                                        src={imageUrl}
                                        alt="Hint"
                                        className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none grayscale rounded-lg"
                                        style={{ zIndex: 0 }}
                                    />
                                )}

                                {/* Pieces already placed */}
                                {pieces.filter(p => p.isPlaced).map(piece => (
                                    <div
                                        key={`placed-${piece.id}`}
                                        className="absolute"
                                        style={{
                                            width: boardSize.width / config!.grid,
                                            height: boardSize.height / config!.grid,
                                            left: piece.currentCol * (boardSize.width / config!.grid),
                                            top: piece.currentRow * (boardSize.height / config!.grid),
                                            backgroundImage: `url(${piece.imageData})`,
                                            backgroundSize: '100% 100%',
                                            zIndex: 1
                                        }}
                                    />
                                ))}
                            </div>

                            {/* The Piece Pool / Tray */}
                            <div className="mt-6 w-full max-w-2xl">
                                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-indigo-100 w-full overflow-x-auto custom-scrollbar flex gap-4 min-h-[100px] items-center shrink-0 z-50 shadow-sm">
                                    {pieces.filter(p => !p.isPlaced).map(piece => (
                                        <DraggablePiece
                                            key={`pool-${piece.id}`}
                                            piece={piece}
                                            boardRef={boardRef}
                                            handlePieceDrop={handlePieceDrop}
                                            boardSize={boardSize}
                                            config={config}
                                        />
                                    ))}
                                    {pieces.filter(p => !p.isPlaced).length === 0 && (
                                        <div className="w-full text-center text-indigo-300 font-bold text-sm italic">
                                            All pieces placed!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Sidebar (Right) - Controls & Progress */}
                <div className="w-full md:w-80 p-8 bg-indigo-50 flex flex-col justify-between border-t md:border-t-0 md:border-l border-indigo-100 z-20">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-600 font-black mb-4">
                            <Sparkles size={20} />
                            <span className="uppercase tracking-widest text-sm">Magic Puzzle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Fix the Art!</h2>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                            Drag the pieces to their original places. Magic Kat is cheering for you! 🐾
                        </p>

                        {/* Progress Bar (User Design) */}
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-indigo-100/50">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Mission Progress</span>
                                <span className="text-sm font-black text-indigo-600">
                                    {pieces.filter(p => p.isPlaced).length} / {pieces.length}
                                </span>
                            </div>
                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ type: "spring", stiffness: 50 }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            onClick={resetGame}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-white text-indigo-600 rounded-2xl font-bold shadow-sm hover:shadow-md active:scale-95 transition-all"
                        >
                            <RotateCcw size={18} /> Reshuffle
                        </button>

                        <button
                            onClick={() => setShowGhost(!showGhost)}
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-colors ${showGhost ? 'text-indigo-500 bg-indigo-100/50' : 'text-slate-400 hover:text-indigo-500'}`}
                        >
                            <Eye size={16} /> {showGhost ? 'Hide Hint' : 'Show Hint'}
                        </button>
                    </div>
                </div>

                {/* Victory Overlay */}
                <AnimatePresence>
                    {gameState === 'won' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-lg p-6"
                        >
                            <div className="text-center max-w-md">
                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="text-8xl mb-6"
                                >
                                    🏆
                                </motion.div>
                                <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">
                                    Incredible!
                                </h2>
                                <p className="text-orange-400 font-bold text-xl mb-8">
                                    "You have the eyes of a true Master!" —— Magic Kat 🐱
                                </p>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={resetGame}
                                        className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xl shadow-lg hover:scale-105 transition-transform"
                                    >
                                        PLAY AGAIN
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 bg-slate-700 text-white rounded-2xl font-black text-xl hover:bg-slate-600 transition-colors"
                                    >
                                        CLAIM GEMS ✨
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Instruction Overlay (First time or mobile hint) */}
                {gameState === 'playing' && progress === 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-40 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 pointer-events-none"
                    >
                        <p className="text-white font-bold flex items-center gap-2">
                            <ThumbsUp size={18} className="text-orange-400" />
                            Drag the pieces to fix the art!
                        </p>
                    </motion.div>
                )}

                {/* Rest Reminder Overlay */}
                <AnimatePresence>
                    {showRestReminder && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-6"
                        >
                            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-4 border-orange-500">
                                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Coffee className="w-10 h-10 text-orange-500" />
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase">Time for a Break!</h2>
                                <p className="text-slate-600 font-bold mb-8">
                                    You've done a great job! Your eyes need a little rest. Go look at something far away for a few minutes. 🌈
                                </p>
                                <button
                                    onClick={() => {
                                        setShowRestReminder(false);
                                        resetSession();
                                    }}
                                    className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xl hover:scale-105 transition-transform"
                                >
                                    OKAY, I'LL REST!
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Helper Component for Draggable with Ref (Strict Mode Fix) ---
const DraggablePiece = ({ piece, boardRef, handlePieceDrop, boardSize, config }: any) => {
    const nodeRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    return (
        <Draggable
            nodeRef={nodeRef}
            enableUserSelectHack={false} // Prevent browser intervention warning
            onStart={() => setIsDragging(true)}
            onStop={(e, data) => {
                setIsDragging(false);
                // Calculate relative to board
                const boardRect = boardRef.current?.getBoundingClientRect();
                if (boardRect) {
                    // Start with mouse/touch client coordinates
                    let clientX, clientY;
                    if ((e as any).changedTouches && (e as any).changedTouches.length > 0) {
                        clientX = (e as any).changedTouches[0].clientX;
                        clientY = (e as any).changedTouches[0].clientY;
                    } else {
                        clientX = (e as any).clientX;
                        clientY = (e as any).clientY;
                    }

                    const x = clientX - boardRect.left;
                    const y = clientY - boardRect.top;
                    handlePieceDrop(piece.id, x, y);
                }
            }}
        >
            <div
                ref={nodeRef}
                className="shrink-0 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                style={{
                    width: Math.min(boardSize.width / config!.grid, 80),
                    height: Math.min(boardSize.height / config!.grid, 80),
                    backgroundImage: `url(${piece.imageData})`,
                    backgroundSize: '100% 100%',
                    borderRadius: '4px',
                    boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.8)' : '0 4px 12px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    position: isDragging ? 'fixed' : 'relative',
                    zIndex: isDragging ? 99999 : 50,
                    touchAction: 'none' // Critical for touch devices check
                }}
            />
        </Draggable>
    );
};
