
const path = require('path');
const fs = require('fs');
const https = require('https');
const { URL } = require('url');

// Simple dotenv parser since we might not have it in this context or want to rely on it
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            const envConfig = fs.readFileSync(envPath, 'utf8');
            envConfig.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    process.env[key.trim()] = value.trim();
                }
            });
        }
    } catch (e) {
        console.warn('Could not load .env file', e);
    }
}

loadEnv();

const DEMO_OUTPUT_DIR = path.resolve(__dirname, '../../client/public/assets/audio_demos');

if (!fs.existsSync(DEMO_OUTPUT_DIR)) {
    fs.mkdirSync(DEMO_OUTPUT_DIR, { recursive: true });
}

// Voice Mappings
const VOICE_MAP = {
    'kiki': 'English_PlayfulGirl',
    'aiai': 'English_Soft-spokenGirl',
    'titi': 'English_CaptivatingStoryteller',
};

const VOICES_TO_GENERATE = [
    {
        id: 'kiki',
        text: 'Meow! I am Kiki, your art class friend!',
        filename: 'kiki_preview.mp3'
    },
    {
        id: 'aiai',
        text: 'Hi cutie! I am Aiai, ready to help!',
        filename: 'aiai_preview.mp3'
    },
    {
        id: 'titi',
        text: 'Hello, I am Titi. Let us tell a story.',
        filename: 'titi_preview.mp3'
    }
];

// Simple HTTPS Post Helper
function postJson(urlStr, data, headers) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = https.request(options, (res) => {
            let chunks = [];
            res.on('data', (d) => chunks.push(d));
            res.on('end', () => {
                const body = Buffer.concat(chunks);
                resolve({ status: res.statusCode, data: body });
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(data));
        req.end();
    });
}

async function generateSpeech(text, voiceKey) {
    const MINIMAX_API_URL = process.env.MINIMAX_API_URL || 'https://api.minimaxi.chat/v1/t2a_v2';
    const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY || '';
    const MINIMAX_GROUP_ID = process.env.MINIMAX_GROUP_ID || '';

    const voiceId = VOICE_MAP[voiceKey] || 'English_PlayfulGirl';
    console.log(`[Minimax] Generating speech for voice: ${voiceKey} -> ${voiceId}`);

    if (!MINIMAX_API_KEY || !MINIMAX_GROUP_ID) {
        throw new Error("Missing Minimax API Key or Group ID");
    }

    const payload = {
        model: "speech-01-turbo",
        text: text,
        stream: false,
        voice_setting: {
            voice_id: voiceId,
            speed: 1.0,
            vol: 1.0,
            pitch: 0
        },
        audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3",
            channel: 1
        }
    };

    const response = await postJson(`${MINIMAX_API_URL}?GroupId=${MINIMAX_GROUP_ID}`, payload, {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
    });

    if (response.status === 200) {
        const jsonStr = response.data.toString('utf8');
        try {
            const json = JSON.parse(jsonStr);
            if (json.base_resp && json.base_resp.status_code === 0 && json.data && json.data.audio) {
                return Buffer.from(json.data.audio, 'hex');
            } else {
                throw new Error(`MiniMax API Error: ${JSON.stringify(json)}`);
            }
        } catch (e) {
            throw new Error("Failed to parse response: " + e.message + " | " + jsonStr.substring(0, 100));
        }
    } else {
        throw new Error(`HTTP Error ${response.status}: ${response.data.toString()}`);
    }
}

async function main() {
    console.log('🚀 Starting Voice Demo Generation (JS)...');

    for (const voice of VOICES_TO_GENERATE) {
        try {
            console.log(`\n🎙️ Generating demo for ${voice.id}...`);
            const audioBuffer = await generateSpeech(voice.text, voice.id);

            const outputPath = path.join(DEMO_OUTPUT_DIR, voice.filename);
            fs.writeFileSync(outputPath, audioBuffer);

            console.log(`✅ Saved to: ${voice.filename}`);
        } catch (error) {
            console.error(`❌ Failed to generate ${voice.id}:`, error.message);
        }
    }
    console.log('\n✨ All done!');
}

main();
