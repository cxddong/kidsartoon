import http from 'http';
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('ok');
});
server.on('error', (err) => {
    console.error('SERVER ERROR:', err);
    process.exit(1);
});
server.listen(3001, () => {
    console.log('SUCCESS: Listened on 3001');
    process.exit(0);
});
