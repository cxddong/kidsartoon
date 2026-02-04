import { motion } from 'framer-motion';

interface ComicBubbleProps {
    text: string;
    position?: 'top' | 'bottom' | 'middle-left' | 'middle-right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    type?: 'speech' | 'thought' | 'narration';
    emotion?: string;
    onClick?: (e: React.MouseEvent) => void;
}

export const ComicBubble: React.FC<ComicBubbleProps> = ({
    text,
    position = 'top',
    type = 'speech',
    emotion = 'happy',
    onClick
}) => {
    // ... (rest of helper objects remain same)
    const positionClasses: Record<string, string> = {
        'bottom': 'justify-end items-center pb-2 md:pb-4',
        'top': 'justify-start items-center pt-2 md:pt-4',
        'middle-left': 'justify-center items-start pl-2 md:pl-3',
        'middle-right': 'justify-center items-end pr-2 md:pr-3',
        'top-left': 'justify-start items-start pt-2 pl-2',
        'top-right': 'justify-start items-end pt-2 pr-2',
        'bottom-left': 'justify-end items-start pb-2 pl-2',
        'bottom-right': 'justify-end items-end pb-2 pr-2'
    };

    const tailClasses: Record<string, string> = {
        'bottom': 'after:bottom-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-l-[12px] after:border-l-transparent after:border-r-[12px] after:border-r-transparent after:border-t-[12px] after:border-t-white',
        'top': 'after:top-[-8px] after:left-1/2 after:-translate-x-1/2 after:border-l-[12px] after:border-l-transparent after:border-r-[12px] after:border-r-transparent after:border-b-[12px] after:border-b-white',
        'middle-left': 'after:left-[-8px] after:top-1/2 after:-translate-y-1/2 after:border-t-[12px] after:border-t-transparent after:border-b-[12px] after:border-b-transparent after:border-r-[12px] after:border-r-white',
        'middle-right': 'after:right-[-8px] after:top-1/2 after:-translate-y-1/2 after:border-t-[12px] after:border-t-transparent after:border-b-[12px] after:border-b-transparent after:border-l-[12px] after:border-l-white',
        'top-left': 'after:top-[-8px] after:left-4 after:border-l-[10px] after:border-l-transparent after:border-r-[10px] after:border-r-transparent after:border-b-[10px] after:border-b-white',
        'top-right': 'after:top-[-8px] after:right-4 after:border-l-[10px] after:border-l-transparent after:border-r-[10px] after:border-r-transparent after:border-b-[10px] after:border-b-white',
        'bottom-left': 'after:bottom-[-8px] after:left-4 after:border-l-[10px] after:border-l-transparent after:border-r-[10px] after:border-r-transparent after:border-t-[10px] after:border-t-white',
        'bottom-right': 'after:bottom-[-8px] after:right-4 after:border-l-[10px] after:border-l-transparent after:border-r-[10px] after:border-r-transparent after:border-t-[10px] after:border-t-white'
    };

    const tailBorderClasses: Record<string, string> = {
        'bottom': 'before:bottom-[-10px] before:left-1/2 before:-translate-x-1/2 before:border-l-[13px] before:border-l-transparent before:border-r-[13px] before:border-r-transparent before:border-t-[13px] before:border-t-slate-900',
        'top': 'before:top-[-10px] before:left-1/2 before:-translate-x-1/2 before:border-l-[13px] before:border-l-transparent before:border-r-[13px] before:border-r-transparent before:border-b-[13px] before:border-b-slate-900',
        'middle-left': 'before:left-[-10px] before:top-1/2 before:-translate-y-1/2 before:border-t-[13px] before:border-t-transparent before:border-b-[13px] before:border-b-transparent before:border-r-[13px] before:border-r-slate-900',
        'middle-right': 'before:right-[-10px] before:top-1/2 before:-translate-y-1/2 before:border-t-[13px] before:border-t-transparent before:border-b-[13px] before:border-b-transparent before:border-l-[13px] before:border-l-slate-900',
        'top-left': 'before:top-[-10px] before:left-3.5 before:border-l-[11px] before:border-l-transparent before:border-r-[11px] before:border-r-transparent before:border-b-[11px] before:border-b-slate-900',
        'top-right': 'before:top-[-10px] before:right-3.5 before:border-l-[11px] before:border-l-transparent before:border-r-[11px] before:border-r-transparent before:border-b-[11px] before:border-b-slate-900',
        'bottom-left': 'before:bottom-[-10px] before:left-3.5 before:border-l-[11px] before:border-l-transparent before:border-r-[11px] before:border-r-transparent before:border-t-[11px] before:border-t-slate-900',
        'bottom-right': 'before:bottom-[-10px] before:right-3.5 before:border-l-[11px] before:border-l-transparent before:border-r-[11px] before:border-r-transparent before:border-t-[11px] before:border-t-slate-900'
    };

    const bubbleShapeClass = type === 'thought'
        ? 'rounded-full'
        : type === 'narration'
            ? 'rounded-sm bg-yellow-50/90'
            : 'rounded-2xl bg-white';

    const showTail = type !== 'narration';
    const displayText = text; // User requested full text display, removing artificial truncation

    return (
        <motion.div
            drag
            dragMomentum={false}
            whileDrag={{ scale: 1.1, zIndex: 100 }}
            className={`relative flex-shrink-0 ${bubbleShapeClass} px-3 py-2 border-[3px] border-slate-900 shadow-[3px_3px_0px_rgba(0,0,0,0.3)] pointer-events-auto text-center cursor-grab active:cursor-grabbing hover:shadow-[4px_4px_0px_rgba(0,0,0,0.4)] max-w-[90%] z-20 ${showTail ? `before:content-[''] before:absolute ${tailBorderClasses[position]} after:content-[''] after:absolute ${tailClasses[position]}` : ''}`}
            onClick={onClick}
            title={text}
        >
            {/* Thought bubble decorative dots */}
            {type === 'thought' && (
                <>
                    <div className="absolute -bottom-5 left-4 w-3 h-3 bg-white border-2 border-slate-900 rounded-full" />
                    <div className="absolute -bottom-8 left-2 w-2 h-2 bg-white border-2 border-slate-900 rounded-full" />
                </>
            )}

            <div
                className="w-full bg-transparent border-none text-[10px] md:text-[12px] lg:text-[14px] font-bold text-slate-900 text-center leading-snug select-none pointer-events-none"
                style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif' }}
            >
                {displayText}
            </div>
        </motion.div>
    );
};

interface ComicBubbleGridProps {
    panels: Array<{
        caption: string;
        bubblePosition?: string;
        bubbleType?: string;
        emotion?: string;
    }>;
    onBubbleClick?: (panelIndex: number) => void;
}

export const ComicBubbleGrid: React.FC<ComicBubbleGridProps> = ({ panels, onBubbleClick }) => {
    // Determine grid layout based on panel count
    const getGridClass = (count: number) => {
        if (count <= 4) return "grid-cols-2 grid-rows-2";
        if (count <= 6) return "grid-cols-2 grid-rows-3";
        return "grid-cols-2 grid-rows-4";
    };

    // Position mapping for container
    const positionClasses: Record<string, string> = {
        'bottom': 'justify-end items-center pb-2 md:pb-4',
        'top': 'justify-start items-center pt-2 md:pt-4',
        'middle-left': 'justify-center items-start pl-2 md:pl-3',
        'middle-right': 'justify-center items-end pr-2 md:pr-3',
        'top-left': 'justify-start items-start pt-2 pl-2',
        'top-right': 'justify-start items-end pt-2 pr-2',
        'bottom-left': 'justify-end items-start pb-2 pl-2',
        'bottom-right': 'justify-end items-end pb-2 pr-2'
    };

    return (
        <div className={`absolute inset-0 grid ${getGridClass(panels.length)} w-full h-full pointer-events-none`}>
            {panels.map((panel, i) => {
                const position = (panel.bubblePosition || 'top') as any;
                const type = (panel.bubbleType || 'speech') as any;
                const emotion = panel.emotion || 'happy';

                return (
                    <div
                        key={i}
                        className={`relative w-full h-full flex flex-col p-1 md:p-2 ${positionClasses[position] || positionClasses['top']}`}
                    >
                        <ComicBubble
                            text={panel.caption}
                            position={position}
                            type={type}
                            emotion={emotion}
                            onClick={(e) => {
                                e.stopPropagation();
                                onBubbleClick?.(i);
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
};
