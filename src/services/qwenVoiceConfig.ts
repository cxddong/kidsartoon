
// src/services/qwenVoiceConfig.ts

/**
 * 💡 Qwen CosyVoice Official IDs
 */
export const QWEN_OFFICIAL_VOICES = {
    KIKI: "Cherry",   // Keep for fallback/legacy if needed
    AIAI: "Serena",   // Keep for fallback/legacy
    TITI: "Eric",     // Keep for fallback/legacy
    AIDEN: "aiden",   // 🆕 Sunshine American Female
    RYAN: "ryan",     // 🆕 Dynamic Male
    MOCHI: "mochi"    // 🆕 Smart Little Boy
};

/**
 * Helper to resolve Voice ID based on character name and optional custom ID.
 */
export function resolveVoiceId(characterName: string, customVoiceId?: string): string {
    if (!characterName) return customVoiceId || QWEN_OFFICIAL_VOICES.AIDEN;
    const nameUpper = characterName.toUpperCase();

    switch (nameUpper) {
        case "AIDEN":
            return QWEN_OFFICIAL_VOICES.AIDEN;
        case "RYAN":
            return QWEN_OFFICIAL_VOICES.RYAN;
        case "MOCHI":
            return QWEN_OFFICIAL_VOICES.MOCHI;
        case "KIKI":
            return QWEN_OFFICIAL_VOICES.KIKI;
        case "AIAI":
            return QWEN_OFFICIAL_VOICES.AIAI;
        case "TITI":
            return QWEN_OFFICIAL_VOICES.TITI;
        case "MY_VOICE":
        case "MY VOICE":
            return customVoiceId || QWEN_OFFICIAL_VOICES.AIDEN; // Fallback to safe default
        default:
            // 💡 CRITICAL FIX: Allow custom voice IDs to pass through!
            // Custom voices usually start with 'v' (our generated ones) or match specific patterns.
            // If it's a known official voice, use it.
            if (Object.values(QWEN_OFFICIAL_VOICES).includes(characterName as any)) {
                return characterName;
            }
            // If it looks like a custom ID (e.g. starts with 'v' and has numbers, or is a long string)
            // or if it was explicitly passed as customVoiceId
            if (characterName.startsWith('v') || characterName.length > 20) {
                return characterName;
            }

            return customVoiceId || QWEN_OFFICIAL_VOICES.AIDEN; // Default fallback
    }
}
