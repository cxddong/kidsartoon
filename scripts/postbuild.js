import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const clientDist = path.join(rootDir, 'client', 'dist');
const targetDir = path.join(rootDir, 'dist', 'public');

console.log('[PostBuild] Starting copy of frontend build to dist/public...');

if (!fs.existsSync(clientDist)) {
    console.error(`[PostBuild] Error: client/dist not found at ${clientDist}`);
    process.exit(1);
}

if (!fs.existsSync(path.join(rootDir, 'dist'))) {
    fs.mkdirSync(path.join(rootDir, 'dist'), { recursive: true });
}

// Simple recursive copy function
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

try {
    if (fs.existsSync(targetDir)) {
        console.log('[PostBuild] Cleaning target directory...');
        // Node 14.14+
        fs.rmSync(targetDir, { recursive: true, force: true });
    }
    copyRecursiveSync(clientDist, targetDir);
    console.log(`[PostBuild] Success! Copied to ${targetDir}`);
} catch (err) {
    console.error('[PostBuild] Failed to copy:', err);
    process.exit(1);
}
