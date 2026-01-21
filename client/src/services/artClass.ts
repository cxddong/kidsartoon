export interface ArtLessonStep {
    id: string;
    description: string;
    tutorMessage: string;
    ghostPath?: { x: number; y: number }[];
    referenceImage?: string;
    requiredShape?: 'circle' | 'box' | 'triangle' | 'any';
    color?: string;
}

export interface ArtLesson {
    id: string;
    title: string;
    steps: ArtLessonStep[];
}

// Helper to generate circle points
const createCircle = (cx: number, cy: number, r: number, points = 50) => {
    const arr = [];
    for (let i = 0; i <= points; i++) {
        const theta = (i / points) * 2 * Math.PI;
        arr.push({
            x: cx + r * Math.cos(theta),
            y: cy + r * Math.sin(theta)
        });
    }
    return arr;
};

// Helper to generate triangle points
const createTriangle = (p1: { x: number, y: number }, p2: { x: number, y: number }, p3: { x: number, y: number }) => {
    return [p1, p2, p3, p1];
};

export const CAT_LESSON: ArtLesson = {
    id: 'draw_cat',
    title: 'Draw a Cute Cat',
    steps: [
        {
            id: 'intro',
            description: 'Introduction',
            tutorMessage: "Meow! Ready to draw? Let's start with a big circle for my head!",
            ghostPath: createCircle(400, 300, 150),
            requiredShape: 'circle'
        },
        {
            id: 'ears',
            description: 'Draw Ears',
            tutorMessage: "Great job! Now add two triangles on top for my ears.",
            ghostPath: [
                ...createTriangle({ x: 300, y: 200 }, { x: 250, y: 100 }, { x: 350, y: 170 }),
                // simple separator for ghost path logic needed if multiple shapes? 
                // For MVP, assume continuous or just show one ear guidance
            ],
            // For MVP let's just show left ear then right ear, or combined path
            requiredShape: 'triangle'
        },
        {
            id: 'face',
            description: 'Draw Face',
            tutorMessage: "I need to see and smell! Draw two dot eyes and a nose.",
            ghostPath: [], // user freehand
            requiredShape: 'any'
        },
        {
            id: 'whiskers',
            description: 'Whiskers',
            tutorMessage: "Don't forget my whiskers! Three on each side.",
            ghostPath: [],
            requiredShape: 'any'
        },
        {
            id: 'color',
            description: 'Coloring',
            tutorMessage: "I look pale! Can you color me Orange or Black?",
            ghostPath: [],
            requiredShape: 'any',
            color: 'orange'
        }
    ]
};

export const getLesson = (id: string) => {
    return CAT_LESSON; // Mock
};
