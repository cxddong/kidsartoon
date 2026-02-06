
import * as dashscopePkg from 'dashscope';

console.log('TYPE:', typeof dashscopePkg);
// Check if it has a default export
console.log('HAS_DEFAULT:', 'default' in dashscopePkg);

const d = (dashscopePkg as any).default;
console.log('DEFAULT_EXPORT:', d);

if (d) {
    console.log('DEFAULT.audio:', d.audio);
    if (d.audio) {
        console.log('DEFAULT.audio KEYS:', Object.keys(d.audio));
    }
}

console.log('PKG_KEYS:', Object.keys(dashscopePkg));
if ((dashscopePkg as any).audio) {
    console.log('PKG.audio:', (dashscopePkg as any).audio);
}

// Emulate the service logic
const dashscope = (dashscopePkg as any).default || dashscopePkg;
console.log('RESOLVED_DASHSCOPE:', dashscope);
console.log('RESOLVED_DASHSCOPE.audio:', dashscope?.audio);
