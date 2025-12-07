# API Key 设置指南

## 目录
1. [环境变量配置（后端）](#环境变量配置后端)
2. [前端设置](#前端设置)
3. [生成新的 API Key](#生成新的-api-key)
4. [在不同场景中使用](#在不同场景中使用)
5. [常见问题](#常见问题)

---

## 环境变量配置（后端）

### 方法 1: 创建 .env 文件（推荐）

在项目根目录 `KAT/` 下创建 `.env` 文件：

```bash
# API Key 配置
API_KEY=your-secure-api-key-here

# 服务器端口
PORT=3000
```

**⚠️ 重要提示：**
- `.env` 文件不要提交到 Git（已在 .gitignore 中）
- 使用强随机字符串作为 API Key
- 生产环境必须更改默认 Key

### 方法 2: 系统环境变量

**Windows (PowerShell):**
```powershell
$env:API_KEY="your-api-key-here"
$env:PORT=3000
npm run dev
```

**Windows (CMD):**
```cmd
set API_KEY=your-api-key-here
set PORT=3000
npm run dev
```

**Linux/Mac:**
```bash
export API_KEY=your-api-key-here
export PORT=3000
npm run dev
```

### 方法 3: 启动时设置

```bash
# Windows PowerShell
$env:API_KEY="my-secret-key-123"; npm run dev

# Linux/Mac
API_KEY=my-secret-key-123 npm run dev
```

---

## 前端设置

### 方法 1: 浏览器 localStorage（自动）

前端代码已自动集成，API Key 会存储在浏览器的 localStorage 中：

```javascript
// 自动使用默认 Key（首次访问时）
// 默认 Key: dev-key-12345
```

### 方法 2: 手动设置 API Key

在浏览器 Console 中运行：

```javascript
// 设置 API Key
localStorage.setItem('apiKey', 'your-api-key-here');

// 查看当前 API Key
console.log(localStorage.getItem('apiKey'));

// 清除 API Key
localStorage.removeItem('apiKey');
```

### 方法 3: 在代码中设置

修改 `public/index.html` 中的初始化代码：

```javascript
// 在 init() 函数中
let currentApiKey = localStorage.getItem('apiKey') || 'your-default-key-here';
```

---

## 生成新的 API Key

### 方法 1: 使用 API 端点（推荐）

#### 使用 cURL:
```bash
curl -X POST http://localhost:3000/api/api-keys \
  -H "X-API-Key: dev-key-12345" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"My App Key\", \"userId\": \"user-123\"}"
```

#### 使用 PowerShell:
```powershell
$headers = @{
    "X-API-Key" = "dev-key-12345"
    "Content-Type" = "application/json"
}
$body = @{
    name = "My App Key"
    userId = "user-123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/api-keys" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

#### 使用浏览器 Console:
```javascript
fetch('/api/api-keys', {
  method: 'POST',
  headers: {
    'X-API-Key': 'dev-key-12345',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My App Key',
    userId: 'user-123'
  })
})
  .then(res => res.json())
  .then(data => {
    console.log('新 API Key:', data.apiKey);
    // ⚠️ 重要：保存这个 Key，它只会显示一次！
    localStorage.setItem('apiKey', data.apiKey);
  });
```

### 方法 2: 使用代码生成

在 Node.js 中：

```javascript
import { apiKeyManager } from './src/middleware/auth.js';

const newKey = apiKeyManager.generateKey('My App', 'user-id');
console.log('新 API Key:', newKey);
```

---

## 在不同场景中使用

### 1. 前端 JavaScript (浏览器)

```javascript
// 方式 1: 使用 X-API-Key header
fetch('/api/users', {
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  }
});

// 方式 2: 使用 Authorization Bearer
fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer your-api-key-here',
    'Content-Type': 'application/json'
  }
});

// 方式 3: 使用 Query 参数
fetch('/api/users?apiKey=your-api-key-here', {
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 2. Node.js / Express

```javascript
const axios = require('axios');

const apiKey = process.env.API_KEY || 'dev-key-12345';

// 使用 X-API-Key
const response = await axios.get('http://localhost:3000/api/users', {
  headers: {
    'X-API-Key': apiKey
  }
});

// 或使用 Authorization Bearer
const response2 = await axios.get('http://localhost:3000/api/users', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});
```

### 3. Python

```python
import requests
import os

api_key = os.getenv('API_KEY', 'dev-key-12345')

# 使用 X-API-Key
headers = {
    'X-API-Key': api_key,
    'Content-Type': 'application/json'
}
response = requests.get('http://localhost:3000/api/users', headers=headers)

# 或使用 Authorization Bearer
headers2 = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}
response2 = requests.get('http://localhost:3000/api/users', headers=headers2)
```

### 4. cURL

```bash
# X-API-Key header
curl -H "X-API-Key: your-api-key-here" http://localhost:3000/api/users

# Authorization Bearer
curl -H "Authorization: Bearer your-api-key-here" http://localhost:3000/api/users

# Query 参数
curl "http://localhost:3000/api/users?apiKey=your-api-key-here"
```

### 5. Postman

1. 创建新请求
2. 在 **Headers** 标签页添加：
   - Key: `X-API-Key`
   - Value: `your-api-key-here`
3. 或使用 **Authorization** 标签页：
   - Type: `Bearer Token`
   - Token: `your-api-key-here`

---

## 快速设置步骤

### 步骤 1: 设置默认 API Key（后端）

创建 `.env` 文件：
```bash
API_KEY=my-secure-production-key-2024
PORT=3000
```

### 步骤 2: 重启服务器

```bash
npm run dev
```

### 步骤 3: 验证设置

```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试 API Key 验证
curl -H "X-API-Key: my-secure-production-key-2024" \
  http://localhost:3000/api/api-keys/validate
```

### 步骤 4: 在前端使用

在浏览器 Console 中：
```javascript
// 设置 API Key
localStorage.setItem('apiKey', 'my-secure-production-key-2024');

// 验证设置
fetch('/api/api-keys/validate', {
  headers: { 'X-API-Key': localStorage.getItem('apiKey') }
})
  .then(res => res.json())
  .then(data => console.log('验证结果:', data));
```

---

## 常见问题

### Q1: 如何生成强随机 API Key？

**方法 1: 使用 Node.js**
```javascript
const crypto = require('crypto');
const apiKey = 'kat_' + Date.now() + '_' + crypto.randomBytes(16).toString('hex');
console.log(apiKey);
```

**方法 2: 使用在线工具**
- 访问 https://www.random.org/strings/
- 生成 32-64 字符的随机字符串

**方法 3: 使用 PowerShell**
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$apiKey = "kat_" + [Convert]::ToBase64String($bytes) -replace '[+/=]', ''
Write-Host $apiKey
```

### Q2: 如何查看当前使用的 API Key？

**后端（服务器日志）:**
检查启动时的日志，会显示使用的默认 Key。

**前端（浏览器）:**
```javascript
console.log('当前 API Key:', localStorage.getItem('apiKey'));
```

**API 端点:**
```bash
curl -H "X-API-Key: your-key" http://localhost:3000/api/api-keys/current
```

### Q3: 如何更改 API Key？

1. **更改环境变量:**
   ```bash
   # 编辑 .env 文件
   API_KEY=new-api-key-here
   ```

2. **重启服务器:**
   ```bash
   npm run dev
   ```

3. **更新前端:**
   ```javascript
   localStorage.setItem('apiKey', 'new-api-key-here');
   ```

### Q4: 忘记 API Key 怎么办？

如果使用的是默认 Key：
- 默认 Key: `dev-key-12345`

如果生成的新 Key 丢失了：
- 需要重新生成（旧的 Key 无法恢复）
- 使用现有的有效 Key 生成新的

### Q5: 如何为不同环境设置不同的 Key？

**开发环境 (.env.development):**
```bash
API_KEY=dev-key-12345
PORT=3000
```

**生产环境 (.env.production):**
```bash
API_KEY=prod-secure-key-xyz789
PORT=3000
```

**使用方式:**
```bash
# 开发环境
npm run dev

# 生产环境（需要配置环境变量）
$env:NODE_ENV="production"; npm start
```

### Q6: API Key 有有效期吗？

当前版本没有设置有效期，但建议：
- 定期轮换 API Key（每 3-6 个月）
- 监控 API Key 使用情况
- 及时删除不再使用的 Key

---

## 安全最佳实践

1. ✅ **使用强随机字符串**作为 API Key
2. ✅ **不要在代码中硬编码** API Key
3. ✅ **使用环境变量**存储 API Key
4. ✅ **不要提交** `.env` 文件到版本控制
5. ✅ **定期轮换** API Key
6. ✅ **使用 HTTPS** 传输 API Key
7. ✅ **限制 API Key 权限**（如果实现权限系统）
8. ✅ **监控 API Key 使用情况**

---

## 相关文档

- [API Key 使用指南](./API_KEY_GUIDE.md) - 完整使用文档
- [API Key 测试指南](./API_KEY_TEST.md) - 测试方法
- [API Key 测试结果](./API_KEY_TEST_RESULTS.md) - 测试结果

