
console.log('Start Index Deps Debug');
try {
    console.log('Importing swagger...');
    await import('swagger-ui-express');
    console.log('Swagger OK');

    console.log('Importing yamljs...');
    await import('yamljs');
    console.log('YAML OK');

    console.log('Importing express...');
    await import('express');
    console.log('Express OK');

} catch (e) {
    console.error('Import Failed:', e);
}
