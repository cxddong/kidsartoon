
import {
    Wand2, Sparkles, Castle, Map, Moon, ScrollText,
    Smile, Flame, Rocket, Palette, PawPrint,
    Users, Cake, Music, Waves, Mic, MicOff, Check,
    Play, Pause, Volume2, Volume, Globe, Fish, Snowflake,
    TreeDeciduous, Footprints, Hand, Gift, Lock, Brain
} from 'lucide-react';

export const STORY_STYLES = [
    { id: 'castle_ball', labels: { en: 'Castle Ball' }, image: '/assets/story_icons/story_castle.jpg', icon: Castle },
    { id: 'little_wizard', labels: { en: 'Magic School' }, image: '/assets/story_icons/story_wizard.jpg', icon: Wand2 },
    { id: 'ice_kingdom', labels: { en: 'Ice Kingdom' }, image: '/assets/story_icons/story_ice.jpg', icon: Snowflake },
    { id: 'magic_woods', labels: { en: 'Magic Woods' }, image: '/assets/story_icons/story_woods.png', icon: TreeDeciduous },
    { id: 'dino_egg', labels: { en: 'Dino Island' }, image: '/assets/story_icons/story_dino.jpg', icon: Footprints },
    { id: 'space_rescue', labels: { en: 'Space Rescue' }, image: '/assets/story_icons/story_space.jpg', icon: Rocket },
    { id: 'marshmallow_clouds', labels: { en: 'Cloud Adventure' }, image: '/assets/story_icons/story_clouds.png', icon: Moon },
    { id: 'alien_base', labels: { en: 'Alien Base' }, image: '/assets/story_icons/story_alien.jpg', icon: Globe },
    { id: 'rainbow_palace', labels: { en: 'Pearl Palace' }, image: '/assets/story_icons/story_underwater.jpg', icon: Fish },
];

export const CONTENT_TAGS = [
    { id: 'Dragon', icon: Flame, image: '/assets/themes/dragon.jpg' },
    { id: 'Unicorn', icon: Sparkles, image: '/assets/themes/unicorn.jpg' },
    { id: 'Space', icon: Rocket, image: '/assets/themes/space.jpg' },
    { id: 'Rainbow', icon: Palette, image: '/assets/themes/rainbow.jpg' },
    { id: 'Animal Friend', icon: PawPrint, image: '/assets/themes/animal_friends.jpg' },
    { id: 'Family', icon: Users, image: '/assets/themes/family.jpg' },
    { id: 'Birthday', icon: Cake, image: '/assets/themes/birthday.jpg' },
    { id: 'Music', icon: Music, image: '/assets/themes/music.jpg' },
    { id: 'Ocean', icon: Waves, image: '/assets/themes/ocean.jpg' },
];

export const MOODS = [
    { id: 'happy', labels: { en: 'Happy' }, image: '/assets/mood_icons/mood_sun.jpg', icon: Smile },
    { id: 'adventurous', labels: { en: 'Adventurous' }, image: '/assets/mood_icons/mood_racing.jpg', icon: Rocket },
    { id: 'calm', labels: { en: 'Calm' }, image: '/assets/mood_icons/mood_teddy.jpg', icon: Moon },
    { id: 'mysterious', labels: { en: 'Mysterious' }, image: '/assets/mood_icons/mood_magic.jpg', icon: Sparkles },
    { id: 'silly', labels: { en: 'Silly' }, image: '/assets/mood_icons/mood_party.jpg', icon: Gift },
    { id: 'spooky', labels: { en: 'Spooky' }, image: '/assets/mood_icons/mood_forest.jpg', icon: Hand }
];

export const VOICES = [
    { id: 'standard', label: 'Robot Friend', tier: 'standard', cost: 0, image: '/assets/role_icons/icon_robot_new.jpg', icon: Volume2, description: '[FREE] Robot Friend', demoText: 'Hello! I am the standard narrator voice.', demoUrl: '/assets/audio_demos/standard_preview.mp3' },
    { id: 'kiki', label: 'Kiki', tier: 'premium', cost: 20, image: '/assets/role_icons/icon_titi_new.jpg', icon: Volume2, description: 'Playful & Energetic 🐱', demoText: 'Meow! I am Kiki, your art class friend!', demoUrl: '/assets/audio_demos/kiki_preview.mp3' },
    { id: 'titi', label: 'Titi', tier: 'premium', cost: 20, image: '/assets/role_icons/icon_kiki_new.png', icon: Volume2, description: 'Gentle & Calm 🎩', demoText: 'Hello, I am Titi. Let us tell a story.', demoUrl: '/assets/audio_demos/titi_preview.mp3' },
    { id: 'aiai', label: 'Aiai', tier: 'premium', cost: 20, image: '/assets/role_icons/icon_aiai_new.jpg', icon: Volume2, description: 'Sweet & Caring 🌸', demoText: 'Hi cutie! I am Aiai, ready to help!', demoUrl: '/assets/audio_demos/aiai_preview.mp3' },
];

export const MODELS = [
    { id: 'standard', label: 'Quick Story (1 min)', tier: 'standard', cost: 0, image: '/assets/story_icons/icon_basic.png', icon: Sparkles, description: '[FREE] Quick Story' },
    { id: 'gpt5', label: 'Epic Story (3 mins)', tier: 'premium', cost: 50, image: '/assets/story_icons/icon_smartest.png', icon: Brain, description: '50 💎 (Premium ✨) - Double the magic!' },
];

export interface StoryBuilderData {
    storyStyle: string;
    contentTags: string[];
    mood: string;
    voice: string;
    voiceTier: 'standard' | 'premium';
    modelTier: 'standard' | 'premium';
    voiceNote: string;
}
