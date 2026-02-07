
import fs from 'fs';
import path from 'path';

const files = fs.readFileSync('files.txt', 'utf-8').split('\n').filter(Boolean);

let missingCount = 0;

for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    let fileModified = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match relative imports: import ... from './foo' or import './foo'
        // Regex: (import|export).*from\s+['"](\.\/|\.\.\/)[^'"]+['"]
        // Or simple: (import|export).*\s+['"]\.\.?\/[^'"]+['"]
        const match = line.match(/(import|export).*\s+['"](\.\.?\/[^'"]+)['"]/);

        if (match) {
            const importPath = match[2];
            if (!importPath.endsWith('.js') && !importPath.endsWith('.json') && !importPath.endsWith('.css') && !importPath.endsWith('.svg') && !importPath.endsWith('.png') && !importPath.endsWith('.jpg')) {
                console.log(`[MISSING] ${file}:${i + 1} -> ${line.trim()}`);
                missingCount++;
            }
        }
    }
}

console.log(`\nTotal missing extensions: ${missingCount}`);
