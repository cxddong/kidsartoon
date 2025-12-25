import fs from 'fs';
import path from 'path';

const assetsDir = path.join('client', 'dist', 'assets');
const files = fs.readdirSync(assetsDir);
const jsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js'));

if (!jsFile) {
    console.log("No index JS found");
    process.exit(1);
}

const content = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

const apiKey = content.match(/AIza[a-zA-Z0-9_\-]+/);
const appId = content.match(/1:\d+:web:[a-z0-9]+/);
const measurementId = content.match(/G-[A-Z0-9]+/);

// Search for patterns like a:"value" or a:"value" for config
const projectId = content.match(/projectId:"([a-z0-9\-]+)"/) || content.match(/projectId:"([a-z0-9\-]+)"/) || content.match(/[a-z0-9\-]+.firebaseapp.com/);

const result = {
    apiKey: apiKey ? apiKey[0] : null,
    appId: appId ? appId[0] : null,
    projectId: projectId ? projectId[0] : null,
};
const key = result.apiKey;
console.log('KEY_LENGTH:', key.length);
console.log('KEY_ESCAPED:', JSON.stringify(key)); // Visual verification
if (key.length > 50) console.warn("WARNING: Key too long?");

const outputPath = path.join(process.cwd(), 'keys_safe.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('Keys saved to ' + outputPath);
