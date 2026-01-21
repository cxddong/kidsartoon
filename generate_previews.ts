import 'dotenv/config';
import { minimaxService } from './src/services/minimax.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(process.cwd(), 'client', 'public', 'assets', 'audio_demos');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VOICES = [
    {
        id: 'kiki',
        text: "Hi there! I'm Kiki, and I love telling magical stories!",
        filename: 'kiki_preview.mp3'
    },
    {
        id: 'aiai',
        text: "Good day! I'm Aiai, and I shall narrate your wonderful tale.",
        filename: 'aiai_preview.mp3'
    },
    {
        id: 'titi',
        text: "Hey! I'm Titi, and I'm super excited to tell your story!",
        filename: 'titi_preview.mp3'
    }
];

async function generate() {
    console.log("Starting Preview Generation...");

    for (const voice of VOICES) {
        console.log(`Generating preview for ${voice.id}...`);
        try {
            const buffer = await minimaxService.generateSpeech(voice.text, voice.id);
            const outFile = path.join(OUTPUT_DIR, voice.filename);
            fs.writeFileSync(outFile, buffer);
            console.log(`Saved ${voice.filename} to ${outFile}`);
        } catch (e: any) {
            console.error(`Failed to generate ${voice.id}:`, e.message);
        }
    }
    console.log("Done!");
}

generate();
