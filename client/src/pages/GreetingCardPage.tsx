import React, { useState, useRef, useEffect } from 'react';
import { ImageCropperModal } from '../components/ImageCropperModal';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Camera, Upload, Wand2, Video, Sparkles,
    Check, X, Mic, Download, Share2, Info, Loader2,
    RefreshCw, Image as ImageIcon, User, Sparkles as SparklesIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import html2canvas from 'html2canvas';
import { useAuth } from '../context/AuthContext';
import { MagicNavBar } from '../components/ui/MagicNavBar';
import { UniversalVideoPlayer } from '../components/ui/UniversalVideoPlayer';
import { BouncyButton } from '../components/ui/BouncyButton';
import greetingCardBg from '../assets/greetingcard.mp4';

// --- Assets & Constants ---
const ART_STYLES = [
    { id: 'dreamy_3d', label: 'Dreamy 3D', icon: '🌈', bg: 'bg-blue-100', prompt: 'pixar style, 3d render, cute, cgsociety, vibrant colors, high detail', image: '/assets/art_style_icons/style_dreamy_3d.jpg' },
    { id: 'watercolor', label: 'Soft Watercolor', icon: '🎨', bg: 'bg-green-100', prompt: 'watercolor painting, soft pastel colors, dreamy, artistic, fluid brush strokes', image: '/assets/art_style_icons/style_watercolor.jpg' },
    { id: 'popup_book', label: 'Pop-up Book', icon: '📖', bg: 'bg-orange-100', prompt: 'layered paper craft, 3d depth, popup book style, handmade, textured', image: '/assets/art_style_icons/style_popup_book.jpg' },
    { id: 'superhero', label: 'Super Hero', icon: '⚡', bg: 'bg-yellow-100', prompt: 'comic book style, bold lines, vibrant colors, action-packed, energetic', image: '/assets/art_style_icons/style_super_hero.jpg' },
    { id: 'clay_world', label: 'Clay World', icon: '🧸', bg: 'bg-pink-100', prompt: 'claymation, plasticine, stop motion animation, cute clay figures', image: '/assets/art_style_icons/style_clay_world.jpg' },
    { id: 'crayon_doodle', label: 'Crayon Doodle', icon: '🖍️', bg: 'bg-purple-100', prompt: 'children\'s drawing, crayon texture, hand-drawn, warm and heartfelt', image: '/assets/art_style_icons/style_crayon_doodle.jpg' },
    { id: 'voxel', label: 'Blocky Voxel', icon: '🧊', bg: 'bg-teal-100', prompt: 'voxel art, minecraft style, 3d blocks, pixelated, cubic shapes', image: '/assets/art_style_icons/style_blocky_voxel.jpg' },
    { id: 'origami', label: 'Paper Origami', icon: '🦢', bg: 'bg-rose-100', prompt: 'origami paper craft, folded paper art, layered paper shapes, handmade aesthetic', image: '/assets/art_style_icons/style_origami.png' },
];



const RECIPIENTS = [
    { id: 'Mom', label: 'Mom', image: '/assets/role_icons/role_mom.png' },
    { id: 'Dad', label: 'Dad', image: '/assets/role_icons/role_dad.jpg' },
    { id: 'Grandma', label: 'Grandma', image: '/assets/role_icons/role_grandma.png' },
    { id: 'Grandpa', label: 'Grandpa', image: '/assets/role_icons/role_grandpa.jpg' },
    { id: 'Teacher', label: 'Teacher', image: '/assets/role_icons/role_teacher.png' },
    { id: 'Others', label: 'Others ✏️', icon: '👤' },
];

// --- Smart Occasion System ---
const BASE_OCCASIONS = [
    { id: 'birthday', label: 'Birthday', prompt: 'Happy Birthday theme, birthday cake, candles, party hats, festive atmosphere', image: '/assets/occasion_icons/occasion_birthday.jpg' },
    { id: 'thankyou', label: 'Thank You', prompt: 'Thank You theme, gratitude, flowers, warm colors', image: '/assets/occasion_icons/occasion_thankyou.jpg' },
    { id: 'friendship', label: 'Friendship', prompt: 'Friendship theme, best friends, holding hands, hearts, happy', image: '/assets/occasion_icons/occasion_friendship.jpg' },
    { id: 'love', label: 'Love', prompt: 'Love theme, romance, hearts, couple, red and pink colors', image: '/assets/occasion_icons/occasion_love.jpg' },
];

// Parent-oriented occasions (hidden behind "More" button)
const PARENT_OCCASIONS = [
    { id: 'graduation', label: 'Graduation', prompt: 'Graduation celebration, cap and gown, diploma, academic achievement', image: '/assets/occasion_icons/occasion_graduation.png' },
    { id: 'wedding', label: 'Wedding', prompt: 'Wedding theme, bride and groom, rings, flowers, romantic', image: '/assets/occasion_icons/occasion_wedding.png' },
    { id: 'newbaby', label: 'New Baby', prompt: 'Baby shower, cute baby items, pastel colors, stork, bottle', image: '/assets/occasion_icons/occasion_newbaby.png' },
    { id: 'getwell', label: 'Get Well', prompt: 'Get well soon, healing, flowers, sunshine, comfort', image: '/assets/occasion_icons/occasion_getwell.png' },
    { id: 'good_job', label: 'Good Job!', icon: '⭐', prompt: 'celebration of achievement, stars, medals, trophy, proud moment, encouragement', image: '/assets/occasion_icons/occasion_good_job.png' },
];

// Child-friendly growth milestones (always visible)
const GROWTH_MILESTONES = [
    { id: 'loose_tooth', label: 'Loose a Tooth', icon: '🦷', prompt: 'tooth fairy theme, growing up milestone, cute tooth character, magical, childhood', image: '/assets/occasion_icons/occasion_tooth.jpg' },
    { id: 'sport_star', label: 'Sport Star', icon: '⚽', prompt: 'sports achievement, winner, athletic, energetic, gold medal, champion', image: '/assets/occasion_icons/occasion_sport.jpg' },
    { id: 'music_art', label: 'Music/Art', icon: '🎵', prompt: 'artistic talent, music notes, paintbrush, creative performance, colorful, expressive', image: '/assets/occasion_icons/occasion_art.jpg' },
];

const SEASONAL_OCCASIONS = [
    {
        id: 'christmas',
        label: 'Christmas',
        prompt: 'Christmas theme, winter wonderland, pine tree, ornaments, snow, cozy',
        startMonth: 11, startDay: 25, endMonth: 12, endDay: 26, // Nov 25 - Dec 26
        icon: '🎄', mood: 'festive', image: '/assets/occasion_icons/occasion_christmas.jpg'
    },
    {
        id: 'newyear',
        label: 'New Year',
        prompt: 'New Year celebration, fireworks, sparkles, festive, golden colors',
        startMonth: 12, startDay: 1, endMonth: 1, endDay: 15, // Dec 01 - Jan 15
        icon: '🧨', mood: 'celebration', image: '/assets/occasion_icons/occasion_newyear.jpg'
    },
    {
        id: 'halloween',
        label: 'Halloween',
        prompt: 'Halloween theme, cute pumpkins, bats, magic, spooky fun',
        startMonth: 10, startDay: 1, endMonth: 11, endDay: 1, // Oct 01 - Nov 01
        icon: '🎃', mood: 'spooky', image: '/assets/occasion_icons/occasion_halloween.jpg'
    },
    {
        id: 'mothersday',
        label: 'Mother\'s Day',
        prompt: 'Mother\'s Day theme, flowers, hearts, soft pinks, love',
        startMonth: 4, startDay: 15, endMonth: 5, endDay: 15, // Mid-April - Mid-May (Approx)
        icon: '🌸', mood: 'loving', image: '/assets/occasion_icons/occasion_mothersday.jpg'
    }
];

// --- Expanded Decorations ---
const CARD_FRAMES = [
    { id: 'simple', label: 'Simple', icon: '⬜', prompt: 'with a clean white border, minimal, modern', image: '/assets/card_frame_icons/frame_simple.jpg' },
    { id: 'wizard_scroll', label: 'Wizard Scroll', icon: '📜', prompt: 'displayed on an ancient magical scroll, parchment texture, mystical', image: '/assets/card_frame_icons/frame_wizard_scroll.jpg' },
    { id: 'airmail', label: 'Air Mail', icon: '✈️', prompt: 'styled as vintage airmail envelope, stamps, postmarks, travel theme', image: '/assets/card_frame_icons/frame_airmail.jpg' },
    { id: 'instant_photo', label: 'Instant Photo', icon: '📸', prompt: 'polaroid instant photo style, wide bottom margin, classic film look', image: '/assets/card_frame_icons/frame_instant_photo.jpg' },
    { id: 'retro_tv', label: 'Retro TV', icon: '📺', prompt: 'displayed on vintage cartoon television screen, nostalgic, fun', image: '/assets/card_frame_icons/frame_retro_tv.jpg' },
    { id: 'museum_frame', label: 'Museum Frame', icon: '🖼️', prompt: 'ornate golden museum frame, luxurious, artistic gallery display', image: '/assets/card_frame_icons/frame_museum.jpg' },
];

// Mood Stickers (情绪类)
const MOOD_STICKERS = [
    { id: 'funny_faces', label: 'Funny Faces', icon: '🤪', prompt: 'funny face stickers, silly glasses, mustache, playful expressions', image: '/assets/sticker_icons/sticker_funny_faces_v3.jpg' },
    { id: 'cute_pets', label: 'Cute Pets', icon: '🐾', prompt: 'adorable pet stickers, paws, ears, tails, kawaii animals', image: '/assets/sticker_icons/sticker_cute_pets_v2.jpg' },
    { id: 'emojis_3d', label: '3D Emojis', icon: '😂', prompt: 'floating 3D emoji faces, expressive, colorful', image: '/assets/sticker_icons/sticker_3d_custom.jpg' },
];

// Element Stickers (元素类)
const ELEMENT_STICKERS = [
    { id: 'confetti', label: 'Confetti', icon: '🎉', prompt: 'floating colorful confetti, party celebration', image: '/assets/sticker_icons/sticker_confetti_v2.jpg' },
    { id: 'space', label: 'Space', icon: '🚀', prompt: 'space elements, stars, planets, rocket ships, astronaut', image: '/assets/sticker_icons/sticker_space_v2.jpg' },
    { id: 'magic', label: 'Magic', icon: '✨', prompt: 'magical sparkles, wands, glimmers, enchanted atmosphere', image: '/assets/sticker_icons/sticker_magic_v2.jpg' },
    { id: 'nature', label: 'Nature', icon: '🌿', prompt: 'natural elements, flowers, leaves, butterflies, garden theme', image: '/assets/sticker_icons/sticker_nature_v2.jpg' },
    { id: 'hearts', label: 'Hearts', icon: '❤️', prompt: 'floating 3D hearts, love and affection', image: '/assets/sticker_icons/sticker_hearts.png' },
];

// Combined for UI usage
const ALL_STICKERS = [...MOOD_STICKERS, ...ELEMENT_STICKERS];

const TEXT_STYLES = [
    { id: 'standard', label: 'Standard', prompt: 'clean bold typography', image: '/assets/text_style_icons/text_style_standard.png' },
    { id: 'neon', label: 'Neon', prompt: 'glowing neon tube text style', image: '/assets/text_style_icons/text_style_neon.png' },
    { id: 'cloud', label: 'Cloud', prompt: 'fluffy white cloud text style', image: '/assets/text_style_icons/text_style_cloud.png' },
    { id: 'gold', label: 'Gold', prompt: 'shiny metallic gold foil text style', image: '/assets/text_style_icons/text_style_gold.png' },
    { id: 'candy', label: 'Candy', prompt: 'sweet colorful rounded candy text style', image: '/assets/text_style_icons/text_style_candy.png' },
];

const SELFIE_ROLES = [
    { id: 'myself', label: 'Just Me', prompt: 'the user as themselves', image: null },
    { id: 'superhero', label: 'Superhero', prompt: 'a brave superhero, comic book style', image: '/assets/role_icons/role_superhero.jpg' },
    { id: 'elf', label: 'Elf', prompt: 'a magical elf, fantasy forest style', image: '/assets/role_icons/role_elf.jpg' },
    { id: 'princess', label: 'Princess', prompt: 'a beautiful princess, royal fantasy style', image: '/assets/role_icons/role_princess.jpg' },
    { id: 'scholar', label: 'Scholar', prompt: 'a smart scholar reading a book, cute fantasy style', image: '/assets/role_icons/role_scholar.jpg' },
    { id: 'wizard', label: 'Wizard', prompt: 'a magical wizard, fantasy style', image: '/assets/role_icons/role_wizard.jpg' },
    { id: 'astronaut', label: 'Astronaut', prompt: 'an intrepid astronaut, space suit', image: '/assets/role_icons/role_astronaut.jpg' },
    { id: 'dreamy', label: 'Dreamy', prompt: 'a cute fantasy creature, dreamy style', image: '/assets/role_icons/role_fantasy.jpg' },
];

// Filter Mode: Img2Img with high strength to preserve appearance
const FILTERS = [
    { id: 'cartoon', label: 'Cartoon', icon: '🦁', prompt: '3D Disney Pixar character style, big expressive eyes, cute, vibrant colors', image: '/assets/role_icons/filter_cartoon.jpg' },
    { id: 'sketch', label: 'Sketch', icon: '✏️', prompt: 'pencil sketch drawing, black and white, artistic shading, hand-drawn', image: '/assets/role_icons/filter_sketch.jpg' },
    { id: 'funny', label: 'Funny', icon: '🤪', prompt: 'funny style, slight caricature, exaggerated features, playful', image: '/assets/role_icons/role_smart.jpg' },
];

const COMPOSITION_MODES = [
    { id: 'just_me', label: 'Just Me', icon: '🖼️', description: 'Photo in center' },
    { id: 'magic_mix', label: 'Magic Mix', icon: '🧙‍♀️', description: 'Face swap / Cosplay' },
];

export const GreetingCardPage = () => {
    const { user, activeProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Remix Handling
    useEffect(() => {
        // @ts-ignore
        if (location.state && (location.state.remixImage || location.state.autoUploadImage)) {
            // @ts-ignore
            const remixUrl = location.state.remixImage || location.state.autoUploadImage;
            console.log("[GreetingCard] 📥 Received Auto-Fill Image. Length:", remixUrl?.length);
            setDrawing(remixUrl);
        }
    }, [location]);

    // --- State: Assets ---
    const [drawing, setDrawing] = useState<string | null>(null);
    const [photo, setPhoto] = useState<string | null>(null);
    // const [shouldFuse, setShouldFuse] = useState(false); // Validated Removal: Replaced by compositionMode


    // --- State: Preferences ---
    // --- State: Preferences ---
    const [occasions, setOccasions] = useState<typeof BASE_OCCASIONS>([]);
    const [selectedOccasion, setSelectedOccasion] = useState(BASE_OCCASIONS[0]);
    const [selectedStyle, setSelectedStyle] = useState(ART_STYLES[0]);

    // New Decoration States
    const [selectedFrame, setSelectedFrame] = useState(CARD_FRAMES[0]);
    const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
    const [selectedTextStyle, setSelectedTextStyle] = useState(TEXT_STYLES[0]);

    const [selectedSelfieRole, setSelectedSelfieRole] = useState(SELFIE_ROLES[0]);

    // More Button State (for parent occasions)
    const [showMoreOccasions, setShowMoreOccasions] = useState(false);

    // Smart Occasion Init
    useEffect(() => {
        const today = new Date();
        const month = today.getMonth() + 1; // 1-12
        const day = today.getDate();

        const activeSeasonals = SEASONAL_OCCASIONS.filter(occ => {
            // Check if current date is within range
            // Handle year wrap (e.g. Dec to Jan)
            if (occ.startMonth > occ.endMonth) {
                // Wrap case (e.g. 12 to 1)
                return (month === occ.startMonth && day >= occ.startDay) || (month === occ.endMonth && day <= occ.endDay) || (month > occ.startMonth) || (month < occ.endMonth);
            } else {
                // Normal case
                return (month > occ.startMonth || (month === occ.startMonth && day >= occ.startDay)) &&
                    (month < occ.endMonth || (month === occ.endMonth && day <= occ.endDay));
            }
        });

        // Build occasion list: Seasonal + Growth Milestones + Base (Parent occasions are shown in the distinct 'More' section)
        const merged = [...activeSeasonals, ...BASE_OCCASIONS, ...GROWTH_MILESTONES];
        setOccasions(merged);

        // Auto-select first seasonal if available
        if (activeSeasonals.length > 0) {
            setSelectedOccasion(activeSeasonals[0]);
        } else {
            setSelectedOccasion(BASE_OCCASIONS[0]);
        }
    }, []);


    // Selfie Mode: Filter (img2img) vs Cosplay (face swap)
    const [selfieMode, setSelfieMode] = useState<'filter' | 'cosplay'>('cosplay');
    const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
    const [compositionMode, setCompositionMode] = useState(COMPOSITION_MODES[1]); // Deprecated, keeping for compatibility

    // Handler: Switch selfie mode and clear conflicting selections
    const handleSelfieModeSwitch = (mode: 'filter' | 'cosplay') => {
        setSelfieMode(mode);
        if (mode === 'filter') {
            // When switching to Filter, reset role to 'myself'
            setSelectedSelfieRole(SELFIE_ROLES[0]);
        } else {
            // When switching to Cosplay, reset filter to first option
            setSelectedFilter(FILTERS[0]);
        }
    };

    // --- State: UI ---
    const [isZoomed, setIsZoomed] = useState(false);

    // --- State: Content ---
    const [recipientSelection, setRecipientSelection] = useState<string>('Mom');
    const [customRecipientName, setCustomRecipientName] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [isListeningMessage, setIsListeningMessage] = useState(false);
    const recognitionRef = useRef<any>(null);

    // --- State: System ---
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [videoLoading, setVideoLoading] = useState(false);
    const [pointsError, setPointsError] = useState<{ required: number; current: number } | null>(null);
    const [planError, setPlanError] = useState(false);
    const [pointAnimation, setPointAnimation] = useState(false);

    const [showCamera, setShowCamera] = useState(false);
    const [cameraMode, setCameraMode] = useState<'drawing' | 'photo'>('drawing');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // --- Gallery Logic (Show during loading) ---
    const [publicGallery, setPublicGallery] = useState<any[]>([]);
    const [galleryIndex, setGalleryIndex] = useState(0);

    useEffect(() => {
        // Fetch gallery for loading screen
        fetch('/api/media/public').then(res => res.json()).then(data => {
            if (Array.isArray(data)) setPublicGallery(data);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        let interval: any;
        if (loading && publicGallery.length > 0) {
            interval = setInterval(() => {
                setGalleryIndex(prev => (prev + 1) % publicGallery.length);
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [loading, publicGallery]);


    // --- Image Cropper State ---
    const [cropImage, setCropImage] = useState<{ url: string; type: 'photo' | 'drawing' } | null>(null);

    // Handlers

    // Generic file handler that opens cropper
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'drawing') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropImage({ url: reader.result as string, type });
            };
            reader.readAsDataURL(file);
        }
        e.target.value = ''; // Reset input
    };

    const handleCameraCapture = (imageSrc: string) => {
        setCropImage({ url: imageSrc, type: cameraMode });
        setShowCamera(false);
    };

    const handleCropComplete = (blob: Blob) => {
        if (!cropImage) return;

        const url = URL.createObjectURL(blob);
        // const file = new File([blob], "cropped.jpg", { type: "image/jpeg" }); // Not directly used for state, but good for API if needed

        if (cropImage.type === 'photo') {
            setPhoto(url); // Update the main photo state
            setCompositionMode(COMPOSITION_MODES[1]); // Auto-enable Mix
        } else {
            setDrawing(url); // Update the main drawing state
        }
        setCropImage(null);
    };

    // --- Handlers: Upload ---
    // Modified handleFileChange to use handleFileSelect for cropping
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'drawing' | 'photo') => {
        handleFileSelect(e, type);
    };

    // --- Handlers: Voice Input ---
    const startVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false; // FIXED: Changed from true to false to prevent duplicates
            recognitionRef.current.interimResults = false; // FIXED: Changed to false for cleaner results
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                // FIXED: Only get final result from the latest recognition
                if (event.results.length > 0) {
                    const result = event.results[event.results.length - 1];
                    if (result.isFinal) {
                        const transcript = result[0].transcript;
                        setCustomMessage(prev => {
                            const spacer = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
                            return prev + spacer + transcript;
                        });
                    }
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListeningMessage(false);
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    alert(`Voice input error: ${event.error}`);
                }
            };

            recognitionRef.current.onend = () => {
                setIsListeningMessage(false);
                // Auto-restart if still supposed to be listening (for continuous feel)
                // But this is now managed by user clicking again
            };
        }

        try {
            recognitionRef.current.start();
            setIsListeningMessage(true);
        } catch (error) {
            console.error('Error starting recognition:', error);
        }
    };

    const stopVoiceInput = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListeningMessage(false);
        }
    };

    // --- Handlers: Camera ---
    const startCamera = (mode: 'drawing' | 'photo') => {
        setCameraMode(mode);
        setShowCamera(true);
        navigator.mediaDevices.getUserMedia({ video: { facingMode: mode === 'photo' ? 'user' : 'environment' } })
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(err => alert("Camera error: " + err.message));
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                // Determine crop/aspect ratio if needed, or just grab frame
                ctx.drawImage(videoRef.current, 0, 0, 300, 400);
                const dataUrl = canvasRef.current.toDataURL('image/png');
                if (cameraMode === 'drawing') setDrawing(dataUrl);
                else {
                    setPhoto(dataUrl);
                    // setShouldFuse(true); // Deprecated
                    setCompositionMode(COMPOSITION_MODES[1]);
                }
            }
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            setShowCamera(false);
        }
    };

    const closeCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setShowCamera(false);
    };

    // --- Selfie Sticker State ---
    const [stickerPos, setStickerPos] = useState({ x: 50, y: 50 }); // Percentages
    const [stickerScale, setStickerScale] = useState(1);
    const [showSelfieOverlay, setShowSelfieOverlay] = useState(true);
    const [isDraggingSticker, setIsDraggingSticker] = useState(false);
    const stickerRef = useRef<HTMLDivElement>(null);
    const cardResultRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });

    // --- Handlers: Downloads (Composite) ---
    const handleSaveImage = async () => {
        if (!generatedImage || !cardResultRef.current) return;

        setLoading(true);
        setLoadingMsg('Saving your card...');
        try {
            // Wait a moment for images to be fully ready
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(cardResultRef.current, {
                useCORS: true,
                scale: 2, // High res
                backgroundColor: null,
                logging: false
            });

            const link = document.createElement('a');
            link.download = `kidsart-card-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err: any) {
            console.error("Save failed:", err);
            alert(`Could not save image: ${err.message || err}. Try taking a screenshot!`);
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers: Sticker Interaction ---
    const handleStickerDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsDraggingSticker(true);

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        dragStartRef.current = { x: clientX, y: clientY };
    };

    const handleStickerDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDraggingSticker || !cardResultRef.current) return;
        e.preventDefault();
        e.stopPropagation();

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const deltaX = clientX - dragStartRef.current.x;
        const deltaY = clientY - dragStartRef.current.y;

        const rect = cardResultRef.current.getBoundingClientRect();

        // Convert delta to percentage of container
        const percentX = (deltaX / rect.width) * 100;
        const percentY = (deltaY / rect.height) * 100;

        setStickerPos(prev => ({
            x: Math.max(0, Math.min(100, prev.x + percentX)),
            y: Math.max(0, Math.min(100, prev.y + percentY))
        }));

        dragStartRef.current = { x: clientX, y: clientY };
    };

    const handleStickerDragEnd = () => {
        setIsDraggingSticker(false);
    };

    // Global listener for drag end/move to handle dragging outside element
    useEffect(() => {
        if (isDraggingSticker) {
            window.addEventListener('mouseup', handleStickerDragEnd);
            window.addEventListener('touchend', handleStickerDragEnd);
            window.addEventListener('mousemove', handleStickerDragMove as any);
            window.addEventListener('touchmove', handleStickerDragMove as any);
        }
        return () => {
            window.removeEventListener('mouseup', handleStickerDragEnd);
            window.removeEventListener('touchend', handleStickerDragEnd);
            window.removeEventListener('mousemove', handleStickerDragMove as any);
            window.removeEventListener('touchmove', handleStickerDragMove as any);
        };
    }, [isDraggingSticker]);

    // --- Logic: Image Composition for API (Fusion) ---
    const getCompositeImage = async (): Promise<Blob | null> => {
        // ALWAYS use drawing as base if available
        if (!drawing) return null;

        // NO PHOTO: Send only the drawing
        if (!photo) {
            const res = await fetch(drawing);
            return await res.blob();
        }

        // WITH PHOTO: Create composite (drawing + reference face in corner)
        // The AI prompt will handle Filter vs Cosplay logic
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img1 = new Image();
            const img2 = new Image();

            img1.onload = () => {
                img2.src = photo;
            };

            img2.onload = () => {
                // FORCE HIGH RESOLUTION (1024x1024) to ensure AI sees details
                const TARGET_SIZE = 1024;
                canvas.width = TARGET_SIZE;
                canvas.height = TARGET_SIZE;

                // 1. Draw Background (Drawing) - Contain/Cover
                // Calculate aspect ratio to fit nicely
                if (ctx) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw Drawing (img1) - Scale to fit
                    const scale = Math.min(canvas.width / img1.width, canvas.height / img1.height);
                    const w = img1.width * scale;
                    const h = img1.height * scale;
                    ctx.drawImage(img1, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);

                    // 2. Draw Photo (Avatar) - Top Right Corner
                    // Make it larger! (35% of canvas)
                    const photoSize = TARGET_SIZE * 0.35;
                    const photoX = canvas.width - photoSize - 20;
                    const photoY = 20;

                    // Add white border/frame for clarity
                    ctx.fillStyle = 'white';
                    ctx.fillRect(photoX - 5, photoY - 5, photoSize + 10, photoSize + 10);

                    // Draw Photo crop (Square center crop or fit?)
                    // Assuming photo is usually square from cropper, but let's be safe
                    ctx.drawImage(img2, photoX, photoY, photoSize, photoSize);

                    // Add text label for AI
                    ctx.fillStyle = 'black';
                    ctx.font = 'bold 20px Arial';
                    ctx.fillText("REFERENCE FACE", photoX + 10, photoY + photoSize + 25);
                }

                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
            };

            img1.src = drawing;
        });
    };

    // --- Core: Generator ---
    const handleGenerate = async () => {
        if (!user) {
            alert("Please log in to create and save your Magic Card!");
            return;
        }
        if (!drawing) return;
        setPointAnimation(true);
        setTimeout(() => setPointAnimation(false), 2000);
        setLoading(true);
        setLoadingMsg('Preparing your masterpiece...');
        setGeneratedImage(null);
        setVideoUrl(null);

        try {
            // 1. Prompt Construction
            const finalRecipient = recipientSelection === 'Others' ? customRecipientName : recipientSelection;
            let prompt = "";
            // 2. Prepare Detailed Prompts
            // User Interests (Personalization)
            const userInterestsStr = user?.interests && user.interests.length > 0
                ? ` Incorporate elements related to user's favorites: ${user.interests.join(', ')}.`
                : "";

            const framePrompt = selectedFrame.id !== 'none' ? `framed with ${selectedFrame.prompt}` : '';

            // Map sticker IDs back to prompts
            const stickerPrompts = selectedStickers.map(id => ALL_STICKERS.find(s => s.id === id)?.prompt).filter(Boolean);
            const stickersStr = stickerPrompts.length > 0 ? `decorated with ${stickerPrompts.join(', ')}` : '';

            const textStylePrompt = selectedTextStyle.id !== 'standard' ? `text style is ${selectedTextStyle.prompt}` : '';

            // Combine Decorations
            const decorationDetails = [framePrompt, stickersStr, textStylePrompt].filter(Boolean).join('. ');
            let decorationsStr = decorationDetails ? `Decorations: ${decorationDetails}.` : "";

            // Add Occasion context
            const occasionContext = `Occasion: ${selectedOccasion.label}. Elements to include: ${selectedOccasion.prompt}.${userInterestsStr}`;

            // Determine image strength based on mode
            let imageStrength = 0.7; // Default - High to preserve uploaded drawing

            if (photo) {
                if (selfieMode === 'filter') {
                    // FILTER MODE: Very high strength to preserve the uploaded drawing
                    imageStrength = 0.75;
                    prompt = `CRITICAL: Keep the EXACT composition and layout from the uploaded image.
                    BASE IMAGE: Use the main drawing/scene as the foundation. DO NOT change the characters, objects, or layout.
                    SELFIE (top-right corner labeled "REFERENCE FACE"): Apply ${selectedFilter.prompt} filter to this person and blend them into the scene.
                    Art Style: ${selectedStyle.prompt}.
                    Occasion: ${selectedOccasion.label}. ${occasionContext} ${decorationsStr}
                    Text to display: "To ${finalRecipient}: ${customMessage}".
                    IMPORTANT: Preserve all elements from the original drawing, only enhance and stylize them.`;
                } else {
                    // COSPLAY MODE: Medium-high strength to preserve drawing while transforming character
                    imageStrength = 0.6;
                    prompt = `CRITICAL: Keep the EXACT composition and layout from the uploaded image.
                    BASE IMAGE: Use the main drawing/scene as the foundation.
                    CHARACTER TRANSFORMATION: Find the main character in the scene and transform them into ${selectedSelfieRole.prompt}.
                    FACE REFERENCE (top-right corner labeled "REFERENCE FACE"): Use ONLY the facial features from this reference photo for the transformed character's face.
                    REMOVE: The "REFERENCE FACE" label and corner box from final output.
                    Art Style: ${selectedStyle.prompt}.
                    Occasion: ${selectedOccasion.label}. ${occasionContext} ${decorationsStr}
                    Text: "To ${finalRecipient}: ${customMessage}".
                    Keep background, other characters, and scene layout EXACTLY as in the original drawing.`;
                }
            } else {
                // Drawing Only (no selfie)
                imageStrength = 0.7;
                prompt = `CRITICAL: Keep the composition and layout from the uploaded image.
                Enhance this greeting card for ${selectedOccasion.label}.
                Art Style: ${selectedStyle.prompt}. ${occasionContext} ${decorationsStr}
                Text: "To ${finalRecipient}: ${customMessage}".
                Preserve all characters and elements, only enhance colors and details.`;
            }

            // 2. Prepare Image
            const imageBlob = await getCompositeImage();
            if (!imageBlob) throw new Error("Failed to process image");

            const formData = new FormData();
            formData.append('image', imageBlob, 'input.jpg');
            formData.append('prompt', prompt + " IMPORTANT: The final output image and any text inside it MUST be in ENGLISH only. Do NOT generate any Chinese characters.");
            formData.append('imageStrength', imageStrength.toString());
            formData.append('userId', user?.uid || 'anonymous');
            if (activeProfile?.id) formData.append('profileId', activeProfile.id);
            formData.append('type', 'cards');

            // 3. API Call
            const loadingMessages = [
                'Painting the magic... 🎨',
                'Mixing the colors... 🌈',
                'Sprinkling fairy dust... ✨',
                'Crafting your masterpiece... 🖌️',
                'Bringing your card to life... 💫',
            ];
            setLoadingMsg(loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
            const res = await fetch('/api/media/image-to-image', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (data.errorCode === 'NOT_ENOUGH_POINTS') {
                setPointsError({ required: data.required, current: data.current });
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error(data.error || "Generation failed");

            if (data.cartoonImageUrl) {
                // Pre-fetch image to Blob to avoid CORS issues with html2canvas
                try {
                    const imgResponse = await fetch(data.cartoonImageUrl);
                    const imgBlob = await imgResponse.blob();
                    const localUrl = URL.createObjectURL(imgBlob);
                    setGeneratedImage(localUrl);
                } catch (err) {
                    console.warn("Failed to pre-fetch image as blob, falling back to URL:", err);
                    setGeneratedImage(data.cartoonImageUrl);
                }
            }

        } catch (err: any) {
            alert("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Upsell: Video ---
    const handleVideoGeneration = async () => {
        if (!generatedImage) return;
        setVideoLoading(true);

        try {
            const res = await fetch('/api/media/image-to-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: generatedImage,
                    prompt: "Animate this greeting card, subtle movements, particles, magical atmosphere",
                    userId: user?.uid || 'anonymous'
                })
            });
            const data = await res.json();

            if (data.errorCode === 'PLAN_RESTRICTED') {
                setPlanError(true);
                setVideoLoading(false);
                return;
            }

            if (data.errorCode === 'NOT_ENOUGH_POINTS') {
                setPointsError({ required: data.required, current: data.current });
                setVideoLoading(false);
                return;
            }

            if (data.videoUrl) setVideoUrl(data.videoUrl);
        } catch (e) {
            alert("Video generation failed");
        } finally {
            setVideoLoading(false);
        }
    };

    // --- Render ---
    return (
        <div className="min-h-screen w-full bg-black font-sans pb-24 pt-safe relative custom-scrollbar flex flex-col">
            {/* Background Image - Fixed */}
            {/* ... */}

            {/* Cropper Modal */}
            {cropImage && (
                <ImageCropperModal
                    imageUrl={cropImage.url}
                    onCrop={handleCropComplete}
                    onCancel={() => setCropImage(null)}
                    aspectRatio={1} // Square for greeting card slots usually? Let's check. 
                // Actually, photos can be any ratio. If we force square it might be annoying.
                // Let's default to Square for now as most slots are square/circle.
                />
            )}
            <div className="fixed inset-0 z-0 h-full w-full">
                <video
                    src={greetingCardBg}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controlsList="nodownload noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Header */}
            <div className="fixed top-0 inset-x-0 z-40 px-4 py-3 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="p-2 bg-white/50 backdrop-blur-md rounded-full hover:bg-white/80 text-slate-800 transition-colors shadow-sm">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-bold shadow-sm border border-amber-200">
                    <Sparkles className="w-4 h-4 fill-amber-500" />
                    <span>{user?.points || 0}</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto px-4 mt-20 space-y-12 relative z-10">

                <section className="space-y-6 bg-white/20 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/30 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="bg-white text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md">1</span>
                        <h2 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Upload Assets</h2>
                    </div>

                    {/* Responsive Layout: Stack on Mobile, Row on Desktop */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch">
                        {/* Slot 1: Drawing (Required) */}
                        <div className="flex-1 space-y-3 min-h-[300px]">
                            <label className="block text-sm font-bold text-slate-400 uppercase text-center">Drawing</label>
                            <div className="relative w-full h-full min-h-[300px] aspect-[3/2] bg-white/20 backdrop-blur-md rounded-3xl border-4 border-dashed border-slate-200 hover:border-blue-400 transition-colors group overflow-hidden shadow-sm">
                                {drawing ? (
                                    <>
                                        <img src={drawing} className="w-full h-full object-contain bg-slate-100" alt="Drawing" />
                                        <button
                                            onClick={() => setDrawing(null)}
                                            className="absolute top-2 right-2 p-2 bg-white/80 rounded-full shadow-sm text-red-500 hover:bg-white"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-row items-center justify-center gap-4 p-4">
                                        <label className="flex flex-col items-center justify-center gap-2 cursor-pointer group p-4 rounded-2xl hover:bg-indigo-50 transition-colors">
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'drawing')} />
                                            <div className="bg-white p-3 rounded-full shadow-md group-hover:scale-110 transition-transform">
                                                <Upload className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <span className="text-sm font-bold text-indigo-600">Upload</span>
                                        </label>

                                        <button onClick={() => startCamera('drawing')} className="flex flex-col items-center justify-center gap-2 group p-4 rounded-2xl hover:bg-pink-50 transition-colors">
                                            <div className="bg-white p-3 rounded-full shadow-md group-hover:scale-110 transition-transform">
                                                <Camera className="w-6 h-6 text-pink-500" />
                                            </div>
                                            <span className="text-sm font-bold text-pink-500">Camera</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Slot 2: Photo (Optional - Selfie Only) - ENLARGED */}
                        <div className="w-full md:w-2/5 space-y-3">
                            <label className="block text-base font-bold text-slate-700 text-center">Put Yourself Into the Card</label>
                            <div className="relative w-full aspect-square bg-white/20 backdrop-blur-md rounded-[2rem] border-4 border-dashed border-slate-200 hover:border-pink-400 transition-colors overflow-hidden group shadow-sm">
                                {photo ? (
                                    <>
                                        <img src={photo} className="w-full h-full object-cover" alt="Photo" />
                                        <button
                                            onClick={() => setPhoto(null)}
                                            className="absolute top-1 right-1 p-1.5 bg-white/80 rounded-full shadow-sm text-red-500 hover:bg-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <button onClick={() => startCamera('photo')} className="p-3 bg-pink-50 text-pink-500 rounded-2xl mb-2 hover:bg-pink-100">
                                            <Camera className="w-6 h-6" />
                                        </button>
                                        <span className="text-sm font-bold text-slate-400 text-center leading-tight">Take Selfie</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Hidden Inputs */}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'drawing')} />

                    {/* NEW: Selfie Mode - Both Options Visible */}
                    {photo && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 bg-purple-50 p-6 rounded-3xl border border-purple-100 shadow-inner">
                            <h3 className="text-lg font-bold text-purple-900 flex items-center justify-center gap-2">
                                <SparklesIcon className="w-5 h-5 text-purple-500" />
                                Selfie Mode
                            </h3>

                            {/* Filter Options - Always Visible */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-blue-600 uppercase tracking-widest block text-center flex items-center justify-center gap-2">
                                    <span className="text-lg">✨</span> Style Me - Art Filter
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {FILTERS.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => setSelectedFilter(f)}
                                            className={cn(
                                                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group",
                                                selectedFilter.id === f.id
                                                    ? "border-blue-500 shadow-md transform scale-105 ring-2 ring-blue-200"
                                                    : "border-transparent bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-200"
                                            )}
                                        >
                                            {(f as any).image ? (
                                                <img src={(f as any).image} className="w-full h-full object-cover" alt={f.label} />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center w-full h-full gap-1">
                                                    <span className="text-2xl">{f.icon}</span>
                                                    <span className="text-[10px] font-bold">{f.label.split(' ')[0]}</span>
                                                </div>
                                            )}

                                            {(f as any).image && (
                                                <div className="absolute bottom-0 inset-x-0 p-1 bg-black/50 text-white text-[10px] font-bold text-center truncate">
                                                    {f.label}
                                                </div>
                                            )}

                                            {selectedFilter.id === f.id && (
                                                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-md">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cosplay Options - Always Visible */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-pink-600 uppercase flex items-center justify-center gap-2">
                                    <span className="text-lg">🎭</span> <Wand2 className="w-3 h-3" /> Cosplay - Be a Character
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {SELFIE_ROLES.map(role => (
                                        <button
                                            key={role.id}
                                            onClick={() => setSelectedSelfieRole(role)}
                                            className={cn(
                                                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all group",
                                                selectedSelfieRole.id === role.id
                                                    ? "border-pink-600 shadow-lg ring-2 ring-pink-400 ring-offset-2 scale-105"
                                                    : "border-transparent hover:border-pink-300 hover:shadow-md"
                                            )}
                                        >
                                            {role.image ? (
                                                <img src={role.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={role.label} />
                                            ) : (
                                                <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                                        <User className="w-6 h-6 text-indigo-400" />
                                                    </div>
                                                </div>
                                            )}

                                            <div className={cn(
                                                "absolute bottom-0 inset-x-0 p-1.5 text-[10px] font-bold text-center truncate backdrop-blur-md transition-colors",
                                                role.image ? "bg-black/50 text-white group-hover:bg-black/60" : "bg-indigo-100/80 text-indigo-700"
                                            )}>
                                                {role.label}
                                            </div>

                                            {selectedSelfieRole.id === role.id && (
                                                <div className="absolute top-2 right-2 bg-pink-600 text-white rounded-full p-0.5 shadow-md z-10">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* SECTION B: Customize */}
                <section className="space-y-8 bg-white/20 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/30 shadow-2xl">
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <span className="bg-white text-indigo-600 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md">2</span>
                        <h2 className="text-2xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Magic Maker ✨</h2>
                    </div>

                    {/* 0. Occasion/Festival (Smart System) */}
                    <div className="space-y-3">
                        <label className="text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] block text-center">Occasion</label>

                        {/* Main Occasions Grid */}
                        <div className="grid grid-cols-4 gap-3">
                            {occasions.map(occ => {
                                const isSeasonal = SEASONAL_OCCASIONS.some(s => s.id === occ.id);
                                return (
                                    <button
                                        key={occ.id}
                                        onClick={() => setSelectedOccasion(occ)}
                                        className={cn(
                                            "aspect-square p-2 rounded-2xl font-bold text-xs border transition-all flex flex-col items-center justify-center text-center relative overflow-hidden",
                                            selectedOccasion.id === occ.id
                                                ? (isSeasonal ? "border-4 border-red-500 ring-4 ring-red-300 scale-105" : "border-4 border-pink-500 ring-4 ring-pink-300 scale-105")
                                                : "border-slate-200 hover:border-slate-400 hover:scale-[1.02]",
                                            (occ as any).image ? "bg-cover bg-center text-white shadow-md" : "bg-white text-slate-600 shadow-sm"
                                        )}
                                        style={(occ as any).image ? { backgroundImage: `url(${(occ as any).image})` } : {}}
                                    >
                                        {isSeasonal && <span className="absolute top-2 right-2 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span></span>}
                                        {(occ as any).image ? (
                                            <span className={cn(
                                                "absolute inset-0 flex items-end justify-center pb-2",
                                                "text-[11px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                            )}>
                                                {occ.label}
                                            </span>
                                        ) : (
                                            <div className="relative z-10 flex flex-col items-center gap-1">
                                                <span className="text-xl">{(occ as any).icon || '💝'}</span>
                                                <span className="leading-tight text-[10px] font-bold">{occ.label}</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* More Button for Parent Occasions */}
                        <button
                            onClick={() => setShowMoreOccasions(!showMoreOccasions)}
                            className={cn(
                                "w-full py-3 px-4 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2",
                                showMoreOccasions
                                    ? "bg-indigo-500 text-white border-indigo-500 shadow-md"
                                    : "bg-white/80 backdrop-blur-md text-slate-600 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50"
                            )}
                        >
                            <span>{showMoreOccasions ? 'Less' : 'More Occasions'}</span>
                            <motion.span
                                animate={{ rotate: showMoreOccasions ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                className="text-lg"
                            >
                                ▼
                            </motion.span>
                        </button>

                        {/* Parent Occasions (Expandable) */}
                        <AnimatePresence>
                            {showMoreOccasions && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="pt-2 pb-1 px-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                        <p className="text-xs font-semibold text-indigo-600 mb-3 text-center">👨‍👩‍👧 For Parents</p>
                                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {PARENT_OCCASIONS.map(occ => (
                                                <button
                                                    key={occ.id}
                                                    onClick={() => setSelectedOccasion(occ)}
                                                    className={cn(
                                                        "aspect-square p-2 rounded-2xl font-bold text-xs border transition-all flex flex-col items-center justify-center text-center relative overflow-hidden",
                                                        selectedOccasion.id === occ.id
                                                            ? "border-indigo-500 ring-2 ring-indigo-200 scale-105"
                                                            : "border-slate-200 hover:border-indigo-400 hover:scale-[1.02]",
                                                        (occ as any).image ? "bg-cover bg-center text-white shadow-md" : "bg-white text-slate-600 shadow-sm"
                                                    )}
                                                    style={(occ as any).image ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0)), url(${(occ as any).image})` } : {}}
                                                >
                                                    {(occ as any).image ? (
                                                        <span className={cn(
                                                            "absolute inset-0 flex items-end justify-center pb-2",
                                                            "text-[11px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                                        )}>
                                                            {occ.label}
                                                        </span>
                                                    ) : (
                                                        <div className="relative z-10 flex flex-col items-center gap-1">
                                                            <span className="text-xl">{(occ as any).icon || '💝'}</span>
                                                            <span className="leading-tight text-[10px] font-bold">{occ.label}</span>
                                                        </div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* 1. Art Style */}
                    <div className="space-y-4">
                        <label className="text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] block text-center">Art Style</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {ART_STYLES.map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => setSelectedStyle(style)}
                                    className={cn(
                                        "aspect-square rounded-2xl border-4 transition-all overflow-hidden relative",
                                        "bg-cover bg-center shadow-md",
                                        selectedStyle.id === style.id
                                            ? "border-blue-500 ring-4 ring-blue-200 scale-105 z-10"
                                            : "border-white hover:border-blue-300 hover:scale-[1.02]"
                                    )}
                                    style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0)), url(${style.image})` }}
                                >
                                    <span className={cn(
                                        "absolute inset-0 flex items-end justify-center pb-2",
                                        "text-[11px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                                    )}>
                                        {style.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Expanded Decorations */}
                    <div className="space-y-6 bg-white/50 p-6 rounded-2xl border border-slate-100">
                        {/* A. Frame */}
                        <div className="space-y-4">
                            <label className="text-base font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase tracking-widest block text-center">Card Frame</label>
                            <div className="grid grid-cols-3 gap-2">
                                {CARD_FRAMES.map(frame => (
                                    <button
                                        key={frame.id}
                                        onClick={() => setSelectedFrame(frame)}
                                        className={cn(
                                            "aspect-square rounded-xl border-3 transition-all overflow-hidden relative",
                                            "bg-cover bg-center shadow-sm",
                                            selectedFrame.id === frame.id
                                                ? "border-slate-700 ring-3 ring-slate-300 scale-105"
                                                : "border-slate-200 hover:border-slate-400 hover:scale-[1.02]"
                                        )}
                                        style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0)), url(${frame.image})` }}
                                    >
                                        <span className={cn(
                                            "absolute inset-0 flex items-end justify-center pb-1",
                                            "text-[9px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                                        )}>
                                            {frame.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* B. Stickers */}
                        <div className="space-y-4">
                            <label className="text-base font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase tracking-widest block text-center">Stickers</label>
                            <div className="grid grid-cols-4 gap-2">
                                {ALL_STICKERS.map(sticker => {
                                    const isSelected = selectedStickers.includes(sticker.id);
                                    return (
                                        <button
                                            key={sticker.id}
                                            onClick={() => {
                                                if (isSelected) setSelectedStickers(prev => prev.filter(id => id !== sticker.id));
                                                else setSelectedStickers(prev => [...prev, sticker.id]);
                                            }}
                                            className={cn(
                                                "aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center relative overflow-hidden group",
                                                isSelected
                                                    ? "border-indigo-500 ring-4 ring-indigo-200/50 shadow-lg scale-105 z-10 bg-indigo-50"
                                                    : "border-slate-100 bg-white hover:border-indigo-300 hover:shadow-md hover:scale-[1.02]",
                                                (sticker as any).image ? "bg-cover bg-center" : "p-2"
                                            )}
                                            style={(sticker as any).image ? {
                                                backgroundImage: `url(${(sticker as any).image})`
                                            } : {}}
                                        >
                                            {/* Selection Badge */}
                                            {isSelected && (
                                                <div className="absolute top-1 right-1 bg-indigo-500 text-white rounded-full p-0.5 shadow-sm animate-in zoom-in-50">
                                                    <Check className="w-3 h-3" />
                                                </div>
                                            )}

                                            {(sticker as any).image ? (
                                                <span className={cn(
                                                    "absolute inset-x-0 bottom-0 py-1 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center",
                                                    "text-[10px] font-bold text-white tracking-wide"
                                                )}>
                                                    {sticker.label.split(' ')[0]}
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{sticker.icon || '😊'}</span>
                                                    <span className="text-[10px] leading-tight font-bold text-slate-600">{sticker.label.split(' ')[0]}</span>
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* C. Text Style */}
                        <div className="space-y-4">
                            <label className="text-base font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] uppercase tracking-widest block text-center">Text Style</label>
                            <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                                {TEXT_STYLES.map(style => (
                                    <button
                                        key={style.id}
                                        onClick={() => setSelectedTextStyle(style)}
                                        className={cn(
                                            "aspect-square rounded-xl border transition-all relative overflow-hidden",
                                            (style as any).image ? "bg-cover bg-center" : "p-2 flex flex-col items-center justify-center text-center gap-1",
                                            selectedTextStyle.id === style.id
                                                ? (style as any).image
                                                    ? "border-blue-500 ring-2 ring-blue-300 shadow-md scale-105"
                                                    : "bg-blue-600 text-white border-blue-600 shadow-md"
                                                : (style as any).image
                                                    ? "border-slate-200 hover:border-slate-300"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                        )}
                                        style={(style as any).image ? {
                                            backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.5), rgba(0,0,0,0)), url(${(style as any).image})`
                                        } : {}}
                                    >
                                        {(style as any).image ? (
                                            <span className={cn(
                                                "absolute inset-0 flex items-end justify-center pb-1",
                                                "text-[9px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                                            )}>
                                                {style.label}
                                            </span>
                                        ) : (
                                            <>
                                                <span className="text-lg font-bold">Aa</span>
                                                <span className="text-[10px] font-bold">{style.label}</span>
                                            </>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* This section was removed as per instruction */}
                    </div>

                    {/* 3. Recipient */}
                    <div className="space-y-2">
                        <label className="text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] block text-center">Who is this for?</label>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            {RECIPIENTS.map(rec => (
                                <button
                                    key={rec.id}
                                    onClick={() => setRecipientSelection(rec.id)}
                                    className={cn(
                                        "aspect-square p-2 rounded-2xl font-bold text-sm border transition-all flex flex-col items-center justify-center text-center gap-1 relative overflow-hidden",
                                        recipientSelection === rec.id
                                            ? "bg-blue-100 text-blue-700 border-4 border-blue-500 ring-4 ring-blue-300 scale-105 shadow-lg"
                                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300",
                                        (rec as any).image ? "bg-cover bg-center" : ""
                                    )}
                                    style={(rec as any).image ? { backgroundImage: `url(${(rec as any).image})` } : {}}
                                >
                                    {(rec as any).image ? (
                                        <span className="absolute inset-x-0 bottom-0 py-1 bg-black/40 text-white text-[10px] backdrop-blur-sm">
                                            {rec.label}
                                        </span>
                                    ) : (
                                        <>
                                            <span className="text-2xl">{(rec as any).icon || '👤'}</span>
                                            {rec.label}
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                        {recipientSelection === 'Others' && (
                            <motion.input
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                type="text"
                                placeholder="Enter name..."
                                value={customRecipientName}
                                onChange={e => setCustomRecipientName(e.target.value)}
                                className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-500 outline-none font-bold text-slate-700 bg-white"
                            />
                        )}
                    </div>

                    {/* 4. Warm Wishes */}
                    <div className="space-y-2">
                        <label className="text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] block text-center">Warm Wishes</label>
                        <div className="relative">
                            <textarea
                                placeholder="Write your blessing here..."
                                value={customMessage}
                                onChange={e => setCustomMessage(e.target.value)}
                                className="w-full p-4 pr-14 rounded-2xl border-none shadow-sm bg-white font-medium text-slate-700 resize-none h-32 focus:ring-2 focus:ring-blue-100 outline-none"
                            />

                            {/* Clear Button */}
                            {customMessage.length > 0 && (
                                <button
                                    onClick={() => setCustomMessage('')}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors shadow-sm"
                                    title="Clear text"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}

                            <button
                                onClick={isListeningMessage ? stopVoiceInput : startVoiceInput}
                                className={cn(
                                    "absolute bottom-3 right-3 p-2.5 rounded-full transition-all",
                                    isListeningMessage
                                        ? "bg-red-500 text-white animate-pulse shadow-lg"
                                        : "bg-blue-50 text-blue-500 hover:bg-blue-100"
                                )}
                                title={isListeningMessage ? "Stop recording" : "Start voice input"}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* SECTION C: Generation */}
                <div className="pt-8 pb-32">
                    <button
                        onClick={handleGenerate}
                        className="relative w-full py-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3 overflow-hidden"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Wand2 className="w-6 h-6" />}
                        Generate Magic Card
                        <AnimatePresence>
                            {pointAnimation && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.5 }}
                                    animate={{ opacity: 1, y: -50, scale: 1.5 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 mix-blend-screen"
                                >
                                    <span className="text-amber-300 font-extrabold text-5xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flex items-center gap-2">
                                        ✨ -8
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </div>

            {/* RESULT VIEW (Modal/Overlay) */}
            <AnimatePresence>
                {
                    generatedImage && (
                        <motion.div
                            initial={{ opacity: 0, y: '100%' }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: '100%' }}
                            className="fixed inset-0 z-50 bg-white flex flex-col pt-safe overflow-hidden"
                        >
                            {/* Result Header */}
                            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-10 pointer-events-none">
                                <div className="flex-1" /> {/* Spacer */}
                                <button onClick={() => setGeneratedImage(null)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-slate-800 pointer-events-auto hover:bg-white shadow-sm border border-white/50">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row h-full">
                                {/* Left Panel: Image Display */}
                                <div className="flex-1 bg-slate-100/50 relative flex flex-col items-center justify-center p-2 overflow-hidden h-full">
                                    {/* The Card Container - Click to Zoom */}
                                    <div
                                        className="relative w-auto max-w-full h-full max-h-[85vh] flex-shrink-1 bg-white rounded-xl shadow-xl overflow-hidden flex flex-col group touch-none"
                                    >
                                        <div
                                            ref={cardResultRef}
                                            className="bg-slate-50 flex-1 flex items-center justify-center p-0 min-h-0 relative overflow-hidden"
                                        >
                                            <img
                                                src={generatedImage}
                                                alt="Card"
                                                onClick={() => !isDraggingSticker && setIsZoomed(true)}
                                                className="max-w-full max-h-full w-auto h-auto object-contain z-0"
                                                style={{ display: 'block' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Panel: Parameters & Actions (Desktop Sidebar) */}
                                <div className="w-full md:w-80 bg-white border-l border-slate-100 flex flex-col h-[40vh] md:h-full overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                        <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-indigo-500" />
                                            Magic Settings
                                        </h3>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                                        {/* 1. Occasion & Style */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-cover bg-center shadow-sm border border-slate-200" style={{ backgroundImage: `url(${(selectedOccasion as any).image})` }} />
                                                <div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Occasion</span>
                                                    <p className="font-bold text-slate-800">{selectedOccasion.label}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-cover bg-center shadow-sm border border-slate-200" style={{ backgroundImage: `url(${(selectedStyle as any).image})` }} />
                                                <div>
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Art Style</span>
                                                    <p className="font-bold text-slate-800">{selectedStyle.label}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="border-slate-100" />

                                        {/* 2. Recipient */}
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 uppercase">For</span>
                                            <p className="font-bold text-slate-800 text-lg">
                                                {recipientSelection === 'Others' ? customRecipientName : recipientSelection}
                                            </p>
                                            <p className="text-sm text-slate-600 mt-1 italic">"{customMessage}"</p>
                                        </div>

                                        <hr className="border-slate-100" />

                                        {/* 3. Selfie Info (If active) */}
                                        {photo && (
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-400 uppercase">Input Selfie</span>
                                                    <img src={photo} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                                                </div>
                                                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 space-y-2">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-purple-600 font-bold">Role:</span>
                                                        <span className="font-bold text-slate-700">{selectedSelfieRole.label}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-purple-600 font-bold">Filter:</span>
                                                        <span className="font-bold text-slate-700">{selectedFilter.label}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                    </div>

                                    {/* Actions Footer */}
                                    <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-3 shrink-0">
                                        {/* Upsell Video */}
                                        {!videoUrl ? (
                                            <BouncyButton
                                                onClick={handleVideoGeneration}
                                                disabled={videoLoading}
                                                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
                                            >
                                                {videoLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Video className="w-4 h-4" />}
                                                Make it Move!
                                            </BouncyButton>
                                        ) : (
                                            <div className="space-y-2">
                                                <UniversalVideoPlayer source={videoUrl} className="w-full h-32 rounded-xl shadow-md" />
                                                <div className="text-center text-green-600 font-bold text-xs flex items-center justify-center gap-1">
                                                    <Check className="w-3 h-3" /> Video Created!
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveImage}
                                                disabled={loading}
                                                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                                            >
                                                {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
                                                Save
                                            </button>

                                            <button className="flex-1 py-3 rounded-xl bg-white border border-slate-200 font-bold text-slate-600 text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5 shadow-sm">
                                                <Share2 className="w-4 h-4" /> Share
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Loading Overlay (Gallery) */}
            {
                loading && (
                    <div className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
                        <div className="mb-6">
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                            <h2 className="text-3xl font-black text-slate-800 mb-2">{loadingMsg}</h2>
                            <p className="text-slate-500 font-medium text-lg">Wait for it...</p>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-64 h-3 bg-slate-100 rounded-full mt-6 overflow-hidden border border-slate-200">
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${galleryIndex * 25}%` }} // Mock progress based on gallery rotation or just auto
                                transition={{ duration: 0.5 }}
                            />
                            {/* Better Mock Progress using time */}
                            <motion.div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 absolute top-0 left-0"
                                initial={{ width: "0%" }}
                                animate={{ width: "95%" }}
                                transition={{ duration: 15, ease: "linear" }}
                            />
                        </div>

                        {/* Gallery Carousel */}
                        {publicGallery.length > 0 && (
                            <div className="w-full max-w-xs aspect-[4/5] bg-slate-100 rounded-3xl shadow-2xl overflow-hidden relative border-8 border-white transform rotate-2 mt-8">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={galleryIndex}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.5 }}
                                        src={publicGallery[galleryIndex]?.imageUrl}
                                        className="w-full h-full object-cover absolute inset-0"
                                    />
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Camera Modal */}
            {
                showCamera && (
                    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
                        <video ref={videoRef} autoPlay playsInline disablePictureInPicture controlsList="nodownload noremoteplayback" className="flex-1 object-cover" />
                        <canvas ref={canvasRef} width="300" height="400" className="hidden" />
                        <div className="p-8 pb-12 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 inset-x-0 flex justify-between items-center">
                            <button onClick={closeCamera} className="p-4 rounded-full bg-white/20 text-white backdrop-blur-md">
                                <X className="w-6 h-6" />
                            </button>
                            <button onClick={takePhoto} className="w-20 h-20 rounded-full border-4 border-white bg-white/50 hover:bg-white transition-all hover:scale-110 shadow-lg" />
                            <div className="w-14" />
                        </div>
                    </div>
                )
            }
            {/* Not Enough Points Modal */}
            <AnimatePresence>
                {pointsError && (
                    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <span className="text-4xl">😿</span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Magic Points Low!</h3>
                                <p className="text-slate-500 font-medium">
                                    You need <span className="text-purple-600 font-bold">{pointsError.required} points</span>,<br />
                                    but you only have <span className="text-orange-500 font-bold">{pointsError.current}</span>.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPointsError(null)}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                                >
                                    Later
                                </button>
                                <button
                                    onClick={() => {
                                        setPointsError(null);
                                        navigate('/subscription');
                                    }}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
                                >
                                    Get Points
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Upgrade Modal */}
            <AnimatePresence>
                {planError && (
                    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 border-4 border-purple-100"
                        >
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto relative">
                                <span className="text-4xl">🚀</span>
                                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">PRO</div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Upgrade to Animate!</h3>
                                <p className="text-slate-500 font-medium text-sm">
                                    Video generation is a <b>Pro Feature</b>.<br />
                                    Upgrade your plan to bring your drawings to life!
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setPlanError(false)}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200"
                                >
                                    Later
                                </button>
                                <button
                                    onClick={() => {
                                        setPlanError(false);
                                        navigate('/subscription');
                                    }}
                                    className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold shadow-lg shadow-purple-200 hover:scale-105 transition-transform"
                                >
                                    View Plans
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
// --- Zoom Modal ---
            {/* Image Zoom Modal */}
            <AnimatePresence>
                {isZoomed && generatedImage && (
                    <div
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
                        onClick={() => setIsZoomed(false)}
                    >
                        <motion.img
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            src={generatedImage}
                            alt="Zoomed Card"
                            className="max-w-full max-h-screen object-contain rounded-lg shadow-2xl"
                        />
                        <button className="absolute top-4 right-4 p-3 bg-white/20 rounded-full text-white hover:bg-white/40">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                )}
            </AnimatePresence>
            <MagicNavBar />
        </div >
    );
};
