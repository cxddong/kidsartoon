# API Key 快速设置

## 🚀 3 步快速设置

### 步骤 1: 创建 .env 文件

在 `KAT` 目录下创建 `.env` 文件：

```bash
API_KEY=your-secure-api-key-here
PORT=3000
```

**或者直接复制示例文件：**
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

### 步骤 2: 生成强随机 API Key（可选但推荐）

**使用 Node.js:**
```bash
node -e "console.log('kat_' + Date.now() + '_' + require('crypto').randomBytes(16).toString('hex'))"
```

**使用 PowerShell:**
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
"kat_" + [Convert]::ToBase64String($bytes) -replace '[+/=]', ''
```

**在线生成:**
访问 https://www.random.org/strings/ 生成 32-64 字符的随机字符串

### 步骤 3: 重启服务器

```bash
npm run dev
```

## ✅ 验证设置

### 测试 1: 健康检查
```bash
curl http://localhost:3000/health
```

### 测试 2: 验证 API Key
```bash
curl -H "X-API-Key: your-api-key-here" http://localhost:3000/api/api-keys/validate
```

### 测试 3: 浏览器测试
打开浏览器 Console (F12)，运行：
```javascript
fetch('/api/api-keys/validate', {
  headers: { 'X-API-Key': 'your-api-key-here' }
})
  .then(res => res.json())
  .then(data => console.log('✓ 验证成功:', data));
```

## 📝 前端设置

在浏览器 Console 中设置：
```javascript
// 设置 API Key
localStorage.setItem('apiKey', 'your-api-key-here');

// 查看当前 Key
console.log(localStorage.getItem('apiKey'));
```

## 🔑 默认 API Key

如果不设置，系统会使用默认 Key：
- **默认 Key:** `dev-key-12345`
- ⚠️ **生产环境必须更改！**

## 📚 更多信息

- 详细设置指南: [API_KEY_SETUP.md](./API_KEY_SETUP.md)
- 使用指南: [API_KEY_GUIDE.md](./API_KEY_GUIDE.md)
- 测试指南: [API_KEY_TEST.md](./API_KEY_TEST.md)

