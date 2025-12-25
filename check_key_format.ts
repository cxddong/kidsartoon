import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

try {
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');

        console.log("=== Checking ARK_API_KEY format ===");

        lines.forEach((line, idx) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('ARK_API_KEY') || trimmed.startsWith('DOUBAO_API_KEY')) {
                console.log(`Found Line ${idx + 1}: [${trimmed}]`);

                const parts = trimmed.split('=');
                if (parts.length >= 2) {
                    const val = parts.slice(1).join('=').trim();
                    console.log(`Value part: [${val}]`);
                    console.log(`Length: ${val.length}`);

                    if (val.startsWith('"') || val.startsWith("'")) {
                        console.log("⚠️ WARNING: Value is quoted. This might be the issue.");
                    }
                    if (val.includes(' ')) {
                        console.log("⚠️ WARNING: Value contains spaces.");
                    }
                }
            }
        });
    } else {
        console.log(".env file not found.");
    }
} catch (e) {
    console.error("Error reading .env", e);
}
