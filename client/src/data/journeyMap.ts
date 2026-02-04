import { FEATURES_TOOLTIPS } from './featuresData';
import mentorVideo from '../assets/mentor journey.mp4';
import creativeJourneyVid from '../assets/creative journey.mp4';
import artStudioVid from '../assets/art studio.mp4';
import magicLabVid from '../assets/magiclab.mp4';
import mirrorBtnVid from '../assets/mirrorbtn.mp4';
import audioVid from '../assets/audio.mp4';
import pictureBookVid from '../assets/picturebook.mp4'; // For Story Selection
import cardVid from '../assets/greetingcard.mp4';
import jumpVid from '../assets/jump into art.mp4';
import cartoonVid from '../assets/cartoon.mp4';
import videoVid from '../assets/video.mp4';

export interface LevelNode {
    id: string;
    label: string;
    icon: string;
    x: string; // Percent string
    y: string;
    size?: 'md' | 'lg' | 'xl';
    path: string;
    // New Rich Fields
    videoSrc: string;
    shortDesc: string;
    description: string;
    isFree?: boolean;
}

// --- New V15 Map Configuration ---
// Updated with coordinates from User Calibration (latest update)
export const LEVEL_NODES: LevelNode[] = [
    {
        id: 'art-class',
        label: "Art Class", // User JSON value
        icon: '🎨',
        x: '40.4%', y: '72.4%',
        path: '/art-class',
        videoSrc: artStudioVid,
        shortDesc: "Step-by-Step",
        description: "Learn to draw step-by-step with an AI teacher on screen or real paper.",
        size: 'xl'
    },
    {
        id: 'art-studio',
        label: "Art Studio",
        icon: '🖌️',
        x: '21.4%', y: '66.8%',
        path: '/magic-studio', // Fixed: Was /magic-art
        videoSrc: magicLabVid,
        shortDesc: "Sketch to Art",
        description: "Turn simple sketches into artistic masterpieces like a pro."
    },
    {
        id: 'art-coach',
        label: "Art Coach",
        icon: '🎓',
        x: '25.6%', y: '44.2%',
        size: 'lg',
        path: '/creative-journey',
        videoSrc: creativeJourneyVid,
        shortDesc: "Learn to Draw",
        description: "Get advice from Magic Kat to make your drawings even better!"
    },
    {
        id: 'magic-mirror',
        label: "Magic Art",
        icon: '🖌️',
        x: '38.4%', y: '43.4%',
        path: '/magic-art',
        videoSrc: magicLabVid,
        shortDesc: "Sketch to Art",
        description: "Turn simple sketches into artistic masterpieces like a pro."
    },
    {
        id: 'audio',
        label: "Magic Story",
        icon: '🎵',
        x: '45.8%', y: '34.6%',
        path: '/generate/audio',
        videoSrc: audioVid,
        shortDesc: "Voice & Tale",
        description: "Upload a picture! Magic Kat will call you and tell a story about it!",
        isFree: true
    },
    {
        id: 'story-selection',
        label: "Stories",
        icon: '📚',
        x: '57.5%', y: '44.9%',
        size: 'xl',
        path: '/story-selection',
        videoSrc: pictureBookVid,
        shortDesc: "Create Book & Comics",
        description: "Choose from Comic Strip, Storybook, or Graphic Novel!"
    },
    {
        id: 'card',
        label: "Magic Card",
        icon: '💌',
        x: '67.2%', y: '78.4%',
        path: '/generate/greeting-card',
        videoSrc: cardVid,
        shortDesc: "Greeting Cards",
        description: "Design sparkling greeting cards for your friends and family."
    },
    {
        id: 'jump-in',
        label: "Jump Into Art",
        icon: '🌀',
        x: '81.4%', y: '78.1%',
        path: '/jump-into-art',
        videoSrc: jumpVid,
        shortDesc: "Teleport In",
        description: "Teleport yourself inside a famous painting using magic photo blending."
    },
    {
        id: 'animation',
        label: "Magic Cinema",
        icon: '🎬',
        x: '82.0%', y: '33.2%',
        size: 'lg',
        path: '/generate/video',
        videoSrc: videoVid,
        shortDesc: "Make it Move!",
        description: "Turn your still drawing into a 5s-10s animation movie!"
    },
    {
        id: 'magic-toy',
        label: "Magic Toy Maker",
        icon: '🧸',
        x: '68%', y: '28%',
        size: 'lg',
        path: '/magic-toy',
        videoSrc: cartoonVid, // Reuse cartoon video as placeholder
        shortDesc: "Drawings to 3D",
        description: "Turn your drawings into real 3D toys you can spin and look at from all sides! 🧸✨"
    },
    {
        id: 'ask-kat',
        label: "Ask Magic Kat",
        icon: '🐱',
        x: '92%', y: '90%',
        size: 'lg',
        path: '/ask-magic-kat',
        videoSrc: mentorVideo,
        shortDesc: "Chat & Create",
        description: "Chat with your AI partner! Ask for help or start a new creative journey."
    }
];
