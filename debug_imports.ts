
console.log('Start Debug');
try {
    console.log('Importing database...');
    await import('./src/services/database.js');
    console.log('Database OK');

    console.log('Importing gemini...');
    await import('./src/services/gemini.js');
    console.log('Gemini OK');

    console.log('Importing worldBuilder...');
    await import('./src/services/worldBuilder.js');
    console.log('WorldBuilder OK');

    console.log('Importing graphicNovel...');
    await import('./src/routes/graphicNovel.js');
    console.log('GraphicNovel OK');

} catch (e) {
    console.error('Import Failed:', e);
}
