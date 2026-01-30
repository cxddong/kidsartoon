/**
 * Audio Cache Generator
 * 
 * Batch-generates MP3 files for all cached phrases using MiniMax API.
 * Run this script once to create all pregenerated audio files.
 * 
 * Usage: tsx scripts/generate-audio-cache.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import from client config (need to adjust path)
const CACHED_PHRASES = {
    'art-class-welcome': { id: 'art-class-welcome', text: "Meow! Welcome to Art Class! I'm Kat, and I'll be your teacher today. What should we draw?", voiceId: 'kiki' },
    'art-class-mode-select': { id: 'art-class-mode-select', text: "Where do you want to draw? Screen or Paper?", voiceId: 'kiki' },
    'art-class-great-choice-cat': { id: 'art-class-great-choice-cat', text: "A Cat! Great choice! Let's do it!", voiceId: 'kiki' },
    'art-class-show-examples': { id: 'art-class-show-examples', text: "Here are some ideas!", voiceId: 'kiki' },
    'art-class-lets-draw-cat': { id: 'art-class-lets-draw-cat', text: "Let's draw a kitty!", voiceId: 'kiki' },
    'art-class-build-castle': { id: 'art-class-build-castle', text: "Let's build a castle!", voiceId: 'kiki' },
    'art-class-on-screen': { id: 'art-class-on-screen', text: "On Screen it is!", voiceId: 'kiki' },
    'art-class-real-paper': { id: 'art-class-real-paper', text: "Real paper! I'll watch!", voiceId: 'kiki' },
    'art-step-1-head': { id: 'art-step-1-head', text: "Meow! Ready to draw? Let's start with a big circle for my head!", voiceId: 'kiki' },
    'art-step-2-ears': { id: 'art-step-2-ears', text: "Great job! Now add two triangles on top for my ears.", voiceId: 'kiki' },
    'art-step-3-face': { id: 'art-step-3-face', text: "I need to see and smell! Draw two dot eyes and a nose.", voiceId: 'kiki' },
    'art-step-4-whiskers': { id: 'art-step-4-whiskers', text: "Don't forget my whiskers! Three on each side.", voiceId: 'kiki' },
    'art-step-5-color': { id: 'art-step-5-color', text: "I look pale! Can you color me Orange or Black?", voiceId: 'kiki' },
    'encourage-great-job': { id: 'encourage-great-job', text: "Great job!", voiceId: 'kiki' },
    'encourage-awesome': { id: 'encourage-awesome', text: "Awesome!", voiceId: 'kiki' },
    'encourage-perfect': { id: 'encourage-perfect', text: "Perfect!", voiceId: 'kiki' },
    'encourage-keep-going': { id: 'encourage-keep-going', text: "Keep going! You're doing amazing!", voiceId: 'kiki' }
};

const API_URL = 'http://localhost:3001/api/sparkle/speak-minimax-stream';
const OUTPUT_DIR = path.join(process.cwd(), 'client', 'public', 'assets', 'audio', 'phrases');

async function generatePhraseAudio(phraseId: string, text: string, voiceId: string): Promise<void> {
    console.log(`🎵 Generating: ${phraseId}`);
    console.log(`   Text: "${text}"`);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, voiceId })
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const outputPath = path.join(OUTPUT_DIR, `${phraseId}.mp3`);
        await fs.writeFile(outputPath, buffer);

        const sizeKB = (buffer.length / 1024).toFixed(2);
        console.log(`✅ Saved: ${phraseId}.mp3 (${sizeKB} KB)\n`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error: any) {
        console.error(`❌ Failed to generate ${phraseId}:`, error.message);
        throw error;
    }
}

async function main() {
    console.log('🚀 Audio Cache Generator\n');
    console.log(`Output directory: ${OUTPUT_DIR}\n`);

    // Create output directory if it doesn't exist
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log('✅ Output directory ready\n');

    const phrases = Object.values(CACHED_PHRASES);
    console.log(`📝 Generating ${phrases.length} phrases...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const phrase of phrases) {
        try {
            await generatePhraseAudio(phrase.id, phrase.text, phrase.voiceId);
            successCount++;
        } catch (error) {
            failCount++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Generation Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📁 Total: ${phrases.length}`);
    console.log('='.repeat(60));

    if (failCount > 0) {
        console.error('\n⚠️  Some phrases failed to generate. Check errors above.');
        process.exit(1);
    } else {
        console.log('\n🎉 All phrases generated successfully!');
        console.log('💡 You can now use the audio cache service in your app.');
    }
}

main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
