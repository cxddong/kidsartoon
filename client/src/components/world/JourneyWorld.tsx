
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LEVEL_NODES, type LevelNode } from '../../data/journeyMap';
import { MagicVideoButton } from '../ui/MagicVideoButton';
import { MagicNavBar } from '../ui/MagicNavBar';
import { isTouchDevice } from '../../hooks/useTouchInteraction';

export default function JourneyWorld() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const worldRef = useRef<HTMLDivElement>(null); // Ref for coordinate calculation
    const navigate = useNavigate();
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    // 触摸交互状态
    const [touchedNode, setTouchedNode] = useState<string | null>(null);
    const isTouch = isTouchDevice();

    // --- DEBUG MODE STATE ---
    const [debugMode, setDebugMode] = useState(false);
    const [nodes, setNodes] = useState<LevelNode[]>(LEVEL_NODES);
    const [isIpadLandscape, setIsIpadLandscape] = useState(false);

    // Scroll Progress for Parallax Background (Slower than foreground)
    const { scrollXProgress } = useScroll({ container: scrollRef });

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const handleNodeClick = (node: LevelNode) => {
        if (debugMode) return;
        // Toggle selection
        if (selectedNodeId === node.id) {
            setSelectedNodeId(null);
        } else {
            setSelectedNodeId(node.id);
        }
    };

    const handleEnterFeature = (e: React.MouseEvent, path: string) => {
        e.stopPropagation();
        navigate(path);
    };

    // --- DEBUG: Drag Handler ---
    const handleNodeDragEnd = (event: any, info: any, nodeId: string) => {
        if (!worldRef.current) return;
        const worldRect = worldRef.current.getBoundingClientRect();

        // Calculate relative position based on pointer event (more accurate for drop)
        // info.point is client coordinates
        const relativeX = info.point.x - worldRect.left;
        const relativeY = info.point.y - worldRect.top + scrollRef.current!.scrollTop; // Adjust for Scroll if needed (vertical not expected, but good safety)
        // Actually, container is horizontal scroll. 
        // info.point.x includes scroll offset if we use clientX? 
        // No, clientX is viewport. worldRect.left changes with scroll.
        // Wait, worldRef is INSIDE scrollRef? 
        // If worldRef is the 400% width container, its rect.left will be negative as we scroll.
        // So (viewportX - rect.left) gives X relative to start of world. Correct.

        const percentX = (relativeX / worldRect.width) * 100;
        const percentY = (relativeY / worldRect.height) * 100;

        // Clamp 0-100
        const finalX = Math.max(0, Math.min(100, percentX)).toFixed(1) + '%';
        const finalY = Math.max(0, Math.min(100, percentY)).toFixed(1) + '%';

        setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, x: finalX, y: finalY } : n));
        console.log(`Node ${nodeId} -> x: ${finalX}, y: ${finalY}`);
    };

    const exportConfig = () => {
        const configStr = JSON.stringify(nodes.map(n => ({
            id: n.id,
            label: n.label,
            icon: n.icon,
            x: n.x, y: n.y,
            path: n.path,
            videoSrc: "...", // Placeholder or keep ref
            // We only need the geometric updates usually
        })), null, 2);

        console.log(JSON.stringify(nodes, null, 2));
        navigator.clipboard.writeText(JSON.stringify(nodes, null, 2));
        alert("Config copied to clipboard! Check console for full detail.");
    };

    // 触摸交互处理
    const handleNodeTouch = (e: React.TouchEvent, node: LevelNode) => {
        if (debugMode) return;
        e.stopPropagation();

        // 第一次触摸：显示tooltip
        if (touchedNode !== node.id) {
            setTouchedNode(node.id);
            setHoveredNode(node.id);
        } else {
            // 第二次触摸：执行跳转
            handleNodeClick(node);
            setTouchedNode(null);
            setHoveredNode(null);
        }
    };

    // Global click listener to close popup when clicking background
    useEffect(() => {
        const handleGlobalClick = (e: any) => {
            // If clicking strictly outside any node, close selection
            // (We'll handle this by putting a click handler on the background wrapper)
        };
    }, []);

    // iPad Detection
    useEffect(() => {
        const checkIpad = () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const isTouch = navigator.maxTouchPoints > 0;
            // Range 1024-1366, Landscape, AND Touch enabled
            const isIpad = w >= 1024 && w <= 1366 && w > h && isTouch;
            setIsIpadLandscape(isIpad);
        };
        checkIpad();
        window.addEventListener('resize', checkIpad);
        return () => window.removeEventListener('resize', checkIpad);
    }, []);

    // Debug Dimensions
    const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
    useEffect(() => {
        const updateDims = () => setDims({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    const clearSelection = () => setSelectedNodeId(null);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black">


            {/* 📜 Scrollable Game World - Now Fills Entire Page */}
            <div ref={scrollRef} className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={clearSelection}>
                {/* World Container - Fills screen, object-fit:cover handles the image inside */}
                <div ref={worldRef} className="relative w-full h-full shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 🌌 Background Image (Now strictly contained in 16:9 box) */}
                    <div className="absolute inset-0 w-full h-full z-0">
                        {isIpadLandscape ? (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundImage: 'url(/assets/bg1.png?v=fill)',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                    backgroundSize: '100% 100%' // Force fit entire image to container
                                }}
                            />
                        ) : (
                            <img src="/assets/bg.png" className="w-full h-full object-cover" alt="Journey Map" />
                        )}
                    </div>

                    {/* 📍 Nodes (Buttons) */}
                    {nodes.map((node, index) => {
                        const isActive = hoveredNode === node.id || selectedNodeId === node.id;
                        const isTopNode = parseFloat(node.y) < 50;
                        const numX = parseFloat(node.x);
                        // Strict Edge Detection: Anchors tooltip to keep it inside screen
                        const isLeftEdge = numX < 20;
                        const isRightEdge = numX > 80;

                        return (
                            <div
                                key={node.id}
                                className={`absolute transition-all duration-300 ${isActive ? 'z-[100]' : 'z-20'} ${debugMode ? 'cursor-move' : 'pointer-events-none'}`}
                                style={{
                                    left: node.x,
                                    top: node.y,
                                    transform: 'translate(-50%, -50%)',
                                    // Responsive Sizing: Scale with Height (vh) to fit landscape, with Min/Max limits
                                    width: node.size === 'xl' ? 'clamp(60px, 16vh, 100px)'
                                        : node.size === 'lg' ? 'clamp(50px, 13vh, 80px)'
                                            : 'clamp(40px, 10vh, 60px)',
                                    aspectRatio: '1/1'
                                }}
                            >
                                {/* Draggable Wrapper */}
                                <motion.div
                                    drag={debugMode}
                                    dragMomentum={false}
                                    onDragEnd={(e, info) => handleNodeDragEnd(e, info, node.id)}
                                    // Remove fixed width classes, rely on parent style
                                    className={`relative group pointer-events-auto w-full h-full no-select`}
                                    animate={{
                                        scale: [1, node.id === 'art-class' ? 1.1 : 1.05, 1],
                                        filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        delay: index * 0.2 // Stagger the pulse
                                    }}
                                    whileHover={{ scale: debugMode ? 1 : 1.3, zIndex: 100 }}
                                    whileTap={{ scale: 0.95 }}
                                    // Remove Hover trigger for Tooltip to enforce Click-to-Open
                                    // onMouseEnter={() => !isTouch && setHoveredNode(node.id)}
                                    // onMouseLeave={() => !isTouch && setHoveredNode(null)}
                                    onTouchStart={(e) => handleNodeTouch(e, node)}
                                >
                                    <div className="relative w-full h-full z-10">
                                        {/* Layer 1: Meteor Border Mask (Outer) */}
                                        {!debugMode && (
                                            <div className="absolute inset-[-2px] rounded-[20px] overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                                {/* Static background ring for visibility */}
                                                <div className="absolute inset-0 border border-white/20 rounded-[20px]" />

                                                {/* Spinning Meteor */}
                                                <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 animate-[spin_3s_linear_infinite]"
                                                    style={{
                                                        background: 'conic-gradient(from 0deg, transparent 80%, rgba(255,255,255,0.3) 90%, #ffffff 100%)',
                                                        filter: 'blur(4px)',
                                                        animationDelay: `-${index * 0.7}s`
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Layer 2: Content Container (Inner) with White/Gold Border */}
                                        <div className={`absolute inset-[2px] rounded-[16px] overflow-hidden bg-black ${node.id === 'art-class' ? 'border-4 border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)]' : 'border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'} ${debugMode ? 'border-red-500 border-4 opacity-80 bg-white' : ''}`}>
                                            {debugMode ? (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-white">
                                                    {node.id}
                                                </div>
                                            ) : (
                                                <MagicVideoButton
                                                    videoSrc={node.videoSrc}
                                                    label=""
                                                    onClick={() => handleNodeClick(node)}
                                                    className="w-full h-full"
                                                    enableMobileAutoPlay={true}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Debug Label */}
                                    {debugMode && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 bg-black/80 text-white text-[9px] px-1 rounded whitespace-nowrap z-50 pointer-events-none">
                                            {node.x}, {node.y}
                                        </div>
                                    )}

                                    {/* START Badge for Art Class */}
                                    {!debugMode && node.id === 'art-class' && (
                                        <div className="absolute -top-4 -right-4 z-30 animate-bounce">
                                            <div className="bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow-lg transform rotate-12">
                                                START
                                            </div>
                                        </div>
                                    )}

                                    {/* Free Badge */}
                                    {!debugMode && node.isFree && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white z-20 transform rotate-12 animate-pulse pointer-events-none">
                                            FREE
                                        </div>
                                    )}

                                    {/* Tooltip / Info Card - Smart Positioning (MOVED OUTSIDE PULSE) */}
                                </motion.div>

                                <AnimatePresence>
                                    {!debugMode && (selectedNodeId === node.id) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: isTopNode ? -10 : 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: isTopNode ? -10 : 10, scale: 0.9 }}
                                            // SMART POSITIONING v2:
                                            // - Width reduced to w-44
                                            // - If Right Edge (>80%): Anchor right (right-0)
                                            // - If Left Edge (<20%): Anchor left (left-0)
                                            // - Default: Anchor center (left-1/2 -translate-x-1/2)
                                            // - Default: Anchor center (left-1/2 -translate-x-1/2)
                                            className={`absolute p-2 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border-2 border-indigo-100 text-center z-[100] w-40 max-h-[60vh] overflow-y-auto noscrollbar pointer-events-auto
                                                ${isTopNode ? 'top-[140%] origin-top' : 'bottom-[140%] origin-bottom'}
                                                ${isLeftEdge ? 'left-0 translate-x-0 origin-left' : isRightEdge ? 'right-0 translate-x-0 origin-right' : 'left-1/2 -translate-x-1/2'}`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Title Removed per user request */}

                                            <p className="text-[10px] text-gray-700 leading-tight font-semibold mb-1.5 mt-0.5">
                                                {node.description || "Click to explore!"}
                                            </p>

                                            <button
                                                onClick={(e) => handleEnterFeature(e, node.path)}
                                                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-1 rounded-md shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1"
                                            >
                                                <span className="text-[9px]">ENTER</span>
                                                <span className="text-[9px]">➜</span>
                                            </button>

                                            <div className={`absolute w-2.5 h-2.5 bg-white/95 rotate-45 border-indigo-100 
                                                ${isTopNode ? '-top-1.5 border-t border-l' : '-bottom-1.5 border-b border-r'}
                                                ${isLeftEdge ? 'left-4' : isRightEdge ? 'right-4' : 'left-1/2 -translate-x-1/2'}`}
                                            ></div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}

                </div>

            </div>

            {/* 🛠️ Debug Controls (Top Right) */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setDebugMode(!debugMode)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-lg backdrop-blur-md ${debugMode ? 'bg-red-500 text-white border-red-600' : 'bg-black/40 text-white border-white/30'}`}
                >
                    {debugMode ? '🔧 Debug ON' : '🔧 Config'}
                </button>
                {debugMode && (
                    <button
                        onClick={exportConfig}
                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500 text-white border border-blue-600 shadow-lg hover:bg-blue-600"
                    >
                        💾 Copy Config
                    </button>
                )}
            </div>

            {/* 🧭 Global Navigation */}
            <MagicNavBar />

        </div>
    );
}
