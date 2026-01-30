/**
 * Audio Cache Service
 * 
 * Intelligent audio playback that automatically uses cached MP3 files
 * for frequently used phrases, and falls back to MiniMax API for dynamic content.
 */

import { CACHED_PHRASES, findPhraseByText } from '../config/audioPhrases';

class AudioCacheService {
    private audioContext: AudioContext | null = null;

    /**
     * Initialize or resume AudioContext
     */
    private async ensureAudioContext(): Promise<AudioContext> {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        return this.audioContext;
    }

    /**
     * Check if a phrase has a pregenerated MP3 file
     */
    hasCache(text: string): boolean {
        const phrase = findPhraseByText(text);
        return phrase !== null;
    }

    /**
     * Play audio from cached MP3 file
     */
    async playCached(text: string): Promise<number> {
        const phrase = findPhraseByText(text);

        if (!phrase) {
            throw new Error(`No cached audio found for: "${text}"`);
        }

        console.log(`🎵 [AudioCache] Playing cached phrase: ${phrase.id}`);

        try {
            const audioPath = `/assets/audio/phrases/${phrase.id}.mp3`;
            const response = await fetch(audioPath);

            if (!response.ok) {
                throw new Error(`Failed to load cached audio: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const ctx = await this.ensureAudioContext();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = 1.05; // Slight speedup for peppiness
            source.connect(ctx.destination);
            source.start(0);

            const duration = audioBuffer.duration / 1.05;
            console.log(`✅ [AudioCache] Cached audio playing for ${duration.toFixed(2)}s`);

            return duration;
        } catch (error) {
            console.error('❌ [AudioCache] Failed to play cached audio:', error);
            throw error;
        }
    }

    /**
     * Play audio using MiniMax API (for dynamic content)
     */
    async playDynamic(text: string, voiceId: string = 'kiki'): Promise<number> {
        console.log(`🔊 [AudioCache] Playing dynamic content via MiniMax API`);

        try {
            const response = await fetch('/api/sparkle/speak-minimax-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, voiceId })
            });

            if (!response.ok) {
                throw new Error(`MiniMax API error: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const ctx = await this.ensureAudioContext();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = 1.05;
            source.connect(ctx.destination);
            source.start(0);

            const duration = audioBuffer.duration / 1.05;
            console.log(`✅ [AudioCache] Dynamic audio playing for ${duration.toFixed(2)}s`);

            return duration;
        } catch (error) {
            console.error('❌ [AudioCache] MiniMax API failed:', error);
            throw error;
        }
    }

    /**
     * Smart play - automatically uses cache if available, else calls API
     * 
     * @param text - Text to speak
     * @param voiceId - Voice ID (only used if calling API)
     * @returns Duration in seconds
     */
    async play(text: string, voiceId: string = 'kiki'): Promise<number> {
        const hasCache = this.hasCache(text);

        if (hasCache) {
            console.log(`💾 [AudioCache] Cache HIT - using pregenerated MP3`);
            return await this.playCached(text);
        } else {
            console.log(`🌐 [AudioCache] Cache MISS - calling MiniMax API`);
            return await this.playDynamic(text, voiceId);
        }
    }

    /**
     * Preload a cached phrase into memory (for instant playback)
     */
    async preload(phraseId: string): Promise<void> {
        try {
            const audioPath = `/assets/audio/phrases/${phraseId}.mp3`;
            await fetch(audioPath);
            console.log(`📥 [AudioCache] Preloaded: ${phraseId}`);
        } catch (error) {
            console.warn(`⚠️ [AudioCache] Failed to preload: ${phraseId}`, error);
        }
    }

    /**
     * Preload multiple common phrases
     */
    async preloadCommon(): Promise<void> {
        const commonPhrases = [
            'art-class-welcome',
            'art-class-mode-select',
            'art-step-1-head',
            'art-step-2-ears'
        ];

        await Promise.all(commonPhrases.map(id => this.preload(id)));
        console.log('✅ [AudioCache] Common phrases preloaded');
    }
}

export const audioCacheService = new AudioCacheService();
