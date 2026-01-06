import 'dotenv/config';
console.log('--- Environment Check ---');
console.log('ELEVENLABS_API_KEY exists:', !!process.env.ELEVENLABS_API_KEY);
console.log('VITE_ELEVENLABS_API_KEY exists:', !!process.env.VITE_ELEVENLABS_API_KEY);
console.log('Keys found in process.env starting with ELEVENLABS or VITE_ELEVENLABS:');
Object.keys(process.env).forEach(key => {
    if (key.startsWith('ELEVENLABS') || key.startsWith('VITE_ELEVENLABS')) {
        console.log(`- ${key}`);
    }
});
console.log('-------------------------');
