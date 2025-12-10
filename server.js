import express from 'express';
import path from 'path';

const app = express();

// 托管 dist 目录里的静态文件
app.use(express.static(path.join(__dirname, 'dist')));

// 所有路由都返回 index.html（支持前端路由）
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});