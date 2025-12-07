# API Key 使用指南

## 概述

Kids Art Tales API 支持 API Key 认证机制，用于保护 API 端点和追踪使用情况。

## 配置 API Key

### 1. 环境变量配置

创建 `.env` 文件（或设置环境变量）：

```bash
# 默认 API Key（用于开发）
API_KEY=dev-key-12345

# 端口
PORT=3000
```

### 2. 默认 API Key

如果没有配置环境变量，系统会使用默认的 API Key: `dev-key-12345`

**⚠️ 警告：生产环境请务必更改默认 API Key！**

## 使用方式

### 方式 1: HTTP Header (推荐)

```javascript
// 使用 X-API-Key header
fetch('/api/users', {
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  }
});

// 或使用 Authorization Bearer
fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer your-api-key-here',
    'Content-Type': 'application/json'
  }
});
```

### 方式 2: Query Parameter

```javascript
fetch('/api/users?apiKey=your-api-key-here', {
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 方式 3: cURL 示例

```bash
# 使用 X-API-Key header
curl -H "X-API-Key: your-api-key-here" http://localhost:3000/api/users

# 使用 Authorization Bearer
curl -H "Authorization: Bearer your-api-key-here" http://localhost:3000/api/users

# 使用 Query 参数
curl "http://localhost:3000/api/users?apiKey=your-api-key-here"
```

## API Key 管理 API

### 生成新的 API Key

```bash
POST /api/api-keys
Content-Type: application/json
X-API-Key: your-existing-api-key

{
  "name": "My App Key",
  "userId": "optional-user-id"
}
```

响应：
```json
{
  "success": true,
  "apiKey": "kat_1234567890_abcdef123456",
  "message": "API key generated successfully. Store it securely, it will not be shown again.",
  "warning": "This is the only time you will see this API key. Make sure to save it!"
}
```

### 获取当前 API Key 信息

```bash
GET /api/api-keys/current
X-API-Key: your-api-key
```

响应：
```json
{
  "key": "kat_1234567...",
  "name": "My App Key",
  "userId": "user-123",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastUsed": "2024-01-01T12:00:00.000Z",
  "requestsCount": 42
}
```

### 验证 API Key

```bash
GET /api/api-keys/validate
X-API-Key: your-api-key
```

响应：
```json
{
  "valid": true,
  "key": "kat_1234567..."
}
```

### 列出所有 API Keys

```bash
GET /api/api-keys
X-API-Key: your-api-key
```

### 删除 API Key

```bash
DELETE /api/api-keys/:key
X-API-Key: your-api-key
```

## 认证模式

### 可选认证（当前默认）

当前所有 API 路由使用**可选认证**模式，这意味着：
- 如果提供了有效的 API Key，会记录使用情况
- 如果没有提供 API Key，请求仍然可以正常处理

### 强制认证

如果需要强制要求 API Key，可以修改 `src/index.ts`：

```typescript
import { apiKeyAuth } from './middleware/auth.js';

// 强制认证
app.use('/api/media', apiKeyAuth, mediaRouter);
app.use('/api/users', apiKeyAuth, userRouter);
// ...
```

## 前端集成

前端代码已经自动集成了 API Key 支持：

1. API Key 存储在 `localStorage` 中
2. 所有请求自动包含 `X-API-Key` header
3. 默认使用 `dev-key-12345`（开发环境）

### 在前端设置 API Key

```javascript
// 设置 API Key
localStorage.setItem('apiKey', 'your-api-key-here');

// 获取 API Key
const apiKey = localStorage.getItem('apiKey');

// 清除 API Key
localStorage.removeItem('apiKey');
```

## 安全建议

1. **生产环境**：
   - 使用强随机生成的 API Key
   - 不要在代码中硬编码 API Key
   - 使用环境变量存储 API Key

2. **API Key 管理**：
   - 定期轮换 API Key
   - 为不同应用/服务使用不同的 API Key
   - 及时删除不再使用的 API Key

3. **传输安全**：
   - 使用 HTTPS 传输 API Key
   - 避免在 URL 中传递 API Key（使用 Header）

4. **存储安全**：
   - 不要将 API Key 提交到版本控制系统
   - 使用安全的密钥管理服务

## 错误响应

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "API key is required. Provide it via X-API-Key header, Authorization Bearer token, or apiKey query parameter."
}
```

### 无效的 API Key

```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

## 示例代码

### Node.js / Express

```javascript
const axios = require('axios');

const apiKey = process.env.API_KEY || 'dev-key-12345';

const response = await axios.get('http://localhost:3000/api/users', {
  headers: {
    'X-API-Key': apiKey
  }
});
```

### Python

```python
import requests

api_key = os.getenv('API_KEY', 'dev-key-12345')

headers = {
    'X-API-Key': api_key
}

response = requests.get('http://localhost:3000/api/users', headers=headers)
```

### JavaScript (浏览器)

```javascript
const apiKey = localStorage.getItem('apiKey') || 'dev-key-12345';

fetch('/api/users', {
  headers: {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  }
})
  .then(res => res.json())
  .then(data => console.log(data));
```

## 测试

使用默认 API Key 测试：

```bash
curl -H "X-API-Key: dev-key-12345" http://localhost:3000/health
```

## 常见问题

**Q: 如何生成新的 API Key？**
A: 使用 `/api/api-keys` POST 端点，需要先有一个有效的 API Key 进行认证。

**Q: API Key 丢失了怎么办？**
A: 如果丢失了 API Key，需要联系管理员重新生成。系统不会显示已生成的完整 API Key。

**Q: 可以同时使用多个 API Key 吗？**
A: 可以，每个 API Key 独立追踪使用情况。

**Q: API Key 有有效期吗？**
A: 当前版本没有设置有效期，但建议定期轮换。

