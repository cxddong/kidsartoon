import React, { useState, useMemo } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import {
    Wand2, Sparkles, Castle, Map, Moon, ScrollText,
    Film, Wind, Grid as GridIcon, PenTool, Smile,
    Flame, Rocket, Palette, PawPrint, Users, Cake, Music, Waves,
    Mic, MicOff, BookOpen, Video, LayoutList, GraduationCap,
    Footprints, Hand
} from 'lucide-react-native';

// Types
export type PageMode = 'story' | 'comic' | 'picture_book' | 'animation';

interface CreativeStudioScreenProps {
    mode: PageMode;
    onGenerate: (request: GenerationRequest) => void;
    initialImageUri?: string; // For testing/preview
}

// Interface for the AI request
export interface GenerationRequest {
    image_base64: string; // Placeholder for actual base64 data
    user_preferences: {
        story_style: string;
        visual_style: string;
        content_tags: string[];
        voice_transcript?: string;
        // Extra fields based on suggestions
        layout_style?: string; // For Comics
    };
    system_prompt_logic: string;
}

// --- Data Constants ---

// Module 1: Story Styles (Default)
const STORY_STYLES = [
    { id: 'fairy_tale', label: 'Fairy Tale', icon: Wand2, value: 'fairy_tale' },
    { id: 'magic_land', label: 'Magic Land', icon: Sparkles, value: 'magic_land' },
    { id: 'disney_story', label: 'Disney Style', icon: Castle, value: 'disney_narrative' },
    { id: 'adventure', label: 'Adventure', icon: Map, value: 'adventure' },
    { id: 'bedtime', label: 'Bedtime', icon: Moon, value: 'bedtime' },
];

// Module 1 Alternative: Book Themes (Picture Book)
const BOOK_THEMES = [
    { id: 'fable', label: 'Fable', icon: ScrollText, value: 'fable_moral' },
    { id: 'diary', label: 'Diary', icon: BookOpen, value: 'diary_entry' },
    { id: 'science', label: 'Science', icon: GraduationCap, value: 'educational_science' },
];

// Module 1 Alternative: Motion Styles (Animation)
const MOTION_STYLES = [
    { id: 'run_fast', label: 'Run Fast', icon: Footprints, value: 'run_cycle' },
    { id: 'dance', label: 'Dance', icon: Music, value: 'dance_move' },
    { id: 'magic_float', label: 'Magic Float', icon: Sparkles, value: 'floating_magic' },
    { id: 'laugh', label: 'Laugh', icon: Smile, value: 'laughing_interaction' },
    { id: 'wave', label: 'Wave Hand', icon: Hand, value: 'waving_hand' },
];

// Module 2: Visual Styles
const VISUAL_STYLES = [
    { id: 'disney_3d', label: 'Disney 3D', icon: Film, value: 'disney_3d' },
    { id: 'ghibli', label: 'Ghibli', icon: Wind, value: 'ghibli' },
    { id: 'pixel', label: 'Pixel Art', icon: GridIcon, value: 'pixel_art' },
    { id: 'crayon', label: 'Crayon', icon: PenTool, value: 'crayon_drawing' },
    { id: 'cute', label: 'Cute Toon', icon: Smile, value: 'cute_cartoon' },
    { id: 'manga', label: 'Manga', icon: LayoutList, value: 'manga_comic' }, // Added for Comic
];

// Module 3: Content Tags
const CONTENT_TAGS = [
    { id: 'dragon', label: 'Dragon', icon: Flame, text: 'Dragon 🐉' },
    { id: 'unicorn', label: 'Unicorn', icon: Sparkles, text: 'Unicorn 🦄' },
    { id: 'space', label: 'Space', icon: Rocket, text: 'Space 🚀' },
    { id: 'rainbow', label: 'Rainbow', icon: Palette, text: 'Rainbow 🌈' },
    { id: 'animals', label: 'Animals', icon: PawPrint, text: 'Animals 🐱' },
    { id: 'family', label: 'Family', icon: Users, text: 'Family 👨‍👩‍👧' },
    { id: 'birthday', label: 'Birthday', icon: Cake, text: 'Birthday 🎂' },
    { id: 'music', label: 'Music', icon: Music, text: 'Music 🎵' },
    { id: 'ocean', label: 'Ocean', icon: Waves, text: 'Ocean 🌊' },
];

// --- Component ---

export const CreativeStudioScreen: React.FC<CreativeStudioScreenProps> = ({
    mode = 'story',
    onGenerate,
    initialImageUri
}) => {
    // State
    const [imageUri, setImageUri] = useState<string | null>(initialImageUri || null);

    // Selections
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null); // Module 1
    const [selectedVisual, setSelectedVisual] = useState<string | null>(null); // Module 2
    const [selectedLayout, setSelectedLayout] = useState<string>('4_panel'); // For Comic Layout
    const [selectedTags, setSelectedTags] = useState<string[]>([]); // Module 3
    const [voiceNote, setVoiceNote] = useState<string>('');
    const [isRecording, setIsRecording] = useState(false);

    // --- Dynamic Configuration based on Mode ---
    const module1Config = useMemo(() => {
        switch (mode) {
            case 'picture_book':
                return { title: 'Choose Book Theme 📚', data: BOOK_THEMES, default: 'fable' };
            case 'animation':
                return { title: 'Choose Motion 🏃‍♂️', data: MOTION_STYLES, default: 'run_fast' };
            case 'story':
            case 'comic':
            default:
                return { title: 'Pick Story Vibe 📖', data: STORY_STYLES, default: 'fairy_tale' };
        }
    }, [mode]);

    // Set default Module 1 selection on mount
    React.useEffect(() => {
        // Optional: Pre-select the first one?
        if (!selectedStyle && module1Config.data.length > 0) {
            setSelectedStyle(module1Config.data[0].value);
        }
    }, [module1Config]);

    // Comic Special Logic: Lock or Bias Visual Style to Manga
    React.useEffect(() => {
        if (mode === 'comic' && !selectedVisual) {
            setSelectedVisual('manga_comic');
        }
    }, [mode]);


    // Helper: Toggle Tag
    const toggleTag = (tagText: string) => {
        if (selectedTags.includes(tagText)) {
            setSelectedTags(prev => prev.filter(t => t !== tagText));
        } else {
            if (selectedTags.length >= 3) {
                Alert.alert("Max 3 Tags", "You can only pick 3 special elements!");
                return;
            }
            setSelectedTags(prev => [...prev, tagText]);
        }
    };

    // Helper: Toggle Voice (Simulated)
    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            // Simulate result
            setVoiceNote(prev => prev + " (Voice note transcript...)");
        } else {
            setIsRecording(true);
        }
    };

    // Validation
    const canGenerate = useMemo(() => {
        const hasImage = !!imageUri;
        const hasStyle = !!selectedStyle;
        const hasVisual = !!selectedVisual;
        return hasImage && hasStyle && hasVisual;
    }, [imageUri, selectedStyle, selectedVisual]);

    // Formatting Generate Text
    const generateButtonText = useMemo(() => {
        switch (mode) {
            case 'animation': return "Generate Animation 🎬";
            case 'comic': return "Create Comic 💬";
            case 'picture_book': return "Make My Book 📘";
            default: return "Generate My Story ✨";
        }
    }, [mode]);

    // Action: Generate
    const handleGeneratePress = () => {
        if (!canGenerate) return;

        // Construct Backend Request
        const systemPrompt = `
You are a children's story creator.
INPUT:
- Image context: [Analyzed from Vision API]
- Story Style: ${selectedStyle}
- Visual Style: ${selectedVisual}
- Key Elements: ${selectedTags.join(', ')}
- User Notes: ${voiceNote}
${mode === 'comic' ? `- Layout: ${selectedLayout}` : ''}
RULES: 
- Age 4-8
- ${mode === 'picture_book' ? 'Output split into pages (Page 1, Page 2...)' : 'Short story'}
- Positive tone
- Preserve original drawing content
    `.trim();

        const payload: GenerationRequest = {
            image_base64: "BASE64_PLACEHOLDER", // Real app would convert imageUri
            user_preferences: {
                story_style: selectedStyle || '',
                visual_style: selectedVisual || '',
                content_tags: selectedTags,
                voice_transcript: voiceNote,
                layout_style: mode === 'comic' ? selectedLayout : undefined
            },
            system_prompt_logic: systemPrompt
        };

        onGenerate(payload);
    };

    return (
        <ScrollView className="flex-1 bg-slate-50" contentContainerStyle={{ paddingBottom: 100 }}>

            {/* A. Top Section: Image Display */}
            <View className="h-[30vh] w-full bg-slate-200 m-4 rounded-[24px] overflow-hidden self-center shadow-sm border border-slate-300 relative">
                {imageUri ? (
                    <Image source={{ uri: imageUri }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <TouchableOpacity
                        className="flex-1 items-center justify-center border-2 border-dashed border-slate-400 m-2 rounded-[20px] bg-slate-100"
                        onPress={() => Alert.alert("Upload", "Pick from gallery")} // Placeholder
                    >
                        <Text className="text-slate-500 font-bold text-lg">Tap to Upload Drawing 📸</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* B. Middle Section: System Selection Panel */}
            <View className="flex-1 bg-white rounded-t-[32px] -mt-6 pt-8 pb-8 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">

                {/* Module 1: Dynamic Style Selector */}
                <View className="mb-8">
                    <View className="flex-row items-center gap-2 mb-3 px-2">
                        <View className="w-8 h-8 rounded-full bg-yellow-400 items-center justify-center">
                            <Text className="text-white font-bold">1</Text>
                        </View>
                        <Text className="text-xl font-bold text-slate-800">{module1Config.title}</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 8 }}>
                        {module1Config.data.map((item) => {
                            const isSelected = selectedStyle === item.value;
                            const Icon = item.icon;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => setSelectedStyle(item.value)}
                                    className={`w-28 h-28 rounded-2xl items-center justify-center border-2 p-2 ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50'}`}
                                >
                                    <Icon size={32} color={isSelected ? '#a855f7' : '#94a3b8'} />
                                    <Text className={`font-bold mt-2 text-center text-sm ${isSelected ? 'text-purple-700' : 'text-slate-500'}`}>
                                        {item.label}
                                    </Text>
                                    {isSelected && (
                                        <View className="absolute top-2 right-2 bg-purple-500 w-3 h-3 rounded-full" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Module 2: Visual Style */}
                <View className="mb-8">
                    <View className="flex-row items-center gap-2 mb-3 px-2">
                        <View className="w-8 h-8 rounded-full bg-pink-400 items-center justify-center">
                            <Text className="text-white font-bold">2</Text>
                        </View>
                        <Text className="text-xl font-bold text-slate-800">Visual Style 🎨</Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 8 }}>
                        {VISUAL_STYLES.map((item) => {
                            const isSelected = selectedVisual === item.value;
                            const Icon = item.icon;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => setSelectedVisual(item.value)}
                                    className={`h-24 w-24 rounded-full items-center justify-center border-2 ${isSelected ? 'border-pink-500 bg-pink-50' : 'border-slate-100 bg-white'}`}
                                >
                                    <Icon size={28} color={isSelected ? '#ec4899' : '#94a3b8'} />
                                    <Text className={`font-bold text-[10px] mt-1 ${isSelected ? 'text-pink-600' : 'text-slate-400'}`}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Optional: Comic Layout Selector */}
                {mode === 'comic' && (
                    <View className="mb-8">
                        <View className="flex-row items-center gap-2 mb-3 px-2">
                            <View className="w-8 h-8 rounded-full bg-orange-400 items-center justify-center">
                                <Text className="text-white font-bold">L</Text>
                            </View>
                            <Text className="text-xl font-bold text-slate-800">Layout Choice 📐</Text>
                        </View>
                        <View className="flex-row gap-4 px-2">
                            {['4_panel', 'poster'].map((l) => (
                                <TouchableOpacity
                                    key={l}
                                    onPress={() => setSelectedLayout(l)}
                                    className={`flex-1 py-4 rounded-xl border-2 items-center ${selectedLayout === l ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white'}`}
                                >
                                    <Text className={`font-bold ${selectedLayout === l ? 'text-orange-600' : 'text-slate-500'}`}>
                                        {l === '4_panel' ? '4-Panel Comic' : 'Single Poster'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Module 3: Content Tags */}
                <View className="mb-8">
                    <View className="flex-row items-center gap-2 mb-3 px-2">
                        <View className="w-8 h-8 rounded-full bg-blue-400 items-center justify-center">
                            <Text className="text-white font-bold">3</Text>
                        </View>
                        <Text className="text-xl font-bold text-slate-800">Magical Elements 🦄</Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2 px-2">
                        {CONTENT_TAGS.map((tag) => {
                            const isSelected = selectedTags.includes(tag.text);
                            return (
                                <TouchableOpacity
                                    key={tag.id}
                                    onPress={() => toggleTag(tag.text)}
                                    className={`px-4 py-2 rounded-full border-2 ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'}`}
                                >
                                    <Text className={`font-bold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                        {tag.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Module 4: Voice Input */}
                <View className="mb-24">
                    <View className="flex-row items-center justify-between px-2 mb-2">
                        <Text className="text-slate-500 font-bold">Tell us more (Optional) 🎤</Text>
                        {voiceNote.length > 0 && (
                            <TouchableOpacity onPress={() => setVoiceNote('')}>
                                <Text className="text-red-400 font-bold text-xs">Clear</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View className="flex-row items-center gap-2">
                        <TextInput
                            value={voiceNote}
                            onChangeText={setVoiceNote}
                            placeholder="Type or record notes..."
                            multiline
                            className="flex-1 bg-slate-50 rounded-2xl p-4 h-24 border-2 border-slate-100 text-slate-700"
                            textAlignVertical="top"
                        />
                        <TouchableOpacity
                            onPress={toggleRecording}
                            className={`h-14 w-14 rounded-full items-center justify-center shadow-sm ${isRecording ? 'bg-red-500' : 'bg-white border-2 border-slate-100'}`}
                        >
                            {isRecording ? <MicOff color="white" size={24} /> : <Mic color="#94a3b8" size={24} />}
                        </TouchableOpacity>
                    </View>
                </View>

            </View>

            {/* C. Bottom Section: Action Area (Floating) */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 border-t border-slate-100" style={{ paddingBottom: 30 }}>
                <TouchableOpacity
                    onPress={handleGeneratePress}
                    disabled={!canGenerate}
                    className={`w-full py-5 rounded-2xl shadow-lg items-center ${canGenerate ? 'bg-violet-500' : 'bg-slate-300'}`}
                >
                    <Text className="text-white font-black text-xl tracking-wider">
                        {generateButtonText}
                    </Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
};
