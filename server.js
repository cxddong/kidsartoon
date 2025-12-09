// server.js
const express = require('express');
const app = express();

// 一个简单的路由
app.get('/', (req, res) => {
    res.send('Kidsartoon app is running on Cloud Run!');
});

// Cloud Run 要求监听 process.env.PORT
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});