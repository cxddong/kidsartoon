# API Key 功能测试指南

## 快速测试步骤

### 1. 启动服务器

```bash
cd KAT
npm run dev
```

服务器应该在 `http://localhost:3000` 启动

### 2. 使用 PowerShell 测试脚本

```powershell
cd KAT
.\test-api-key.ps1
```

### 3. 使用 cURL 手动测试

#### 测试 1: 健康检查（不需要 API Key）
```bash
curl http://localhost:3000/health
```

#### 测试 2: 验证 API Key（使用 X-API-Key header）
```bash
curl -H "X-API-Key: dev-key-12345" http://localhost:3000/api/api-keys/validate
```

#### 测试 3: 获取当前 API Key 信息
```bash
curl -H "X-API-Key: dev-key-12345" http://localhost:3000/api/api-keys/current
```

#### 测试 4: 生成新的 API Key
```bash
curl -X POST http://localhost:3000/api/api-keys \
  -H "X-API-Key: dev-key-12345" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"My Test Key\"}"
```

#### 测试 5: 使用 Authorization Bearer
```bash
curl -H "Authorization: Bearer dev-key-12345" http://localhost:3000/api/api-keys/validate
```

#### 测试 6: 使用 Query 参数
```bash
curl "http://localhost:3000/api/api-keys/validate?apiKey=dev-key-12345"
```

#### 测试 7: 测试无效的 API Key（应该返回 401）
```bash
curl -H "X-API-Key: invalid-key" http://localhost:3000/api/api-keys/validate
```

#### 测试 8: 测试没有 API Key（应该返回 401）
```bash
curl http://localhost:3000/api/api-keys/current
```

### 4. 使用浏览器测试

1. 打开浏览器，访问：http://localhost:3000
2. 打开浏览器开发者工具 (F12)
3. 在 Console 中运行：

```javascript
// 测试验证 API Key
fetch('/api/api-keys/validate', {
  headers: {
    'X-API-Key': 'dev-key-12345'
  }
})
  .then(res => res.json())
  .then(data => console.log('验证结果:', data));

// 测试获取 API Key 信息
fetch('/api/api-keys/current', {
  headers: {
    'X-API-Key': 'dev-key-12345'
  }
})
  .then(res => res.json())
  .then(data => console.log('API Key 信息:', data));

// 测试生成新的 API Key
fetch('/api/api-keys', {
  method: 'POST',
  headers: {
    'X-API-Key': 'dev-key-12345',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Browser Test Key',
    userId: 'test-user'
  })
})
  .then(res => res.json())
  .then(data => {
    console.log('新 API Key:', data.apiKey);
    console.log('警告:', data.warning);
  });
```

### 5. 使用 Postman 或类似的 API 工具

1. **创建新请求**
   - URL: `http://localhost:3000/api/api-keys/validate`
   - Method: `GET`

2. **添加 Header**
   - Key: `X-API-Key`
   - Value: `dev-key-12345`

3. **发送请求**
   - 应该返回 200 状态码和验证结果

## 预期结果

### 成功响应示例

**验证 API Key:**
```json
{
  "valid": true,
  "key": "dev-key-1..."
}
```

**获取 API Key 信息:**
```json
{
  "key": "dev-key-1...",
  "name": "Default API Key",
  "userId": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastUsed": "2024-01-01T12:00:00.000Z",
  "requestsCount": 5
}
```

**生成新的 API Key:**
```json
{
  "success": true,
  "apiKey": "kat_1234567890_abcdef123456",
  "message": "API key generated successfully. Store it securely, it will not be shown again.",
  "warning": "This is the only time you will see this API key. Make sure to save it!"
}
```

### 错误响应示例

**401 Unauthorized（缺少 API Key）:**
```json
{
  "error": "Unauthorized",
  "message": "API key is required. Provide it via X-API-Key header, Authorization Bearer token, or apiKey query parameter."
}
```

**401 Unauthorized（无效的 API Key）:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

## 自动化测试

运行 Vitest 测试：

```bash
cd KAT
npm run test:run -- tests/api-keys.test.ts
```

或者运行所有测试：

```bash
npm run test:run
```

## 故障排除

### 问题 1: 服务器未启动
**解决方案:** 确保服务器正在运行
```bash
npm run dev
```

### 问题 2: 端口被占用
**解决方案:** 更改端口
```bash
$env:PORT=3001; npm run dev
```

### 问题 3: API Key 验证失败
**解决方案:** 
- 检查是否使用了正确的 API Key (`dev-key-12345`)
- 检查 Header 名称是否正确 (`X-API-Key`)
- 检查服务器日志查看详细错误

### 问题 4: CORS 错误
**解决方案:** 服务器已配置 CORS，如果仍有问题，检查浏览器控制台

## 下一步

- 查看 `API_KEY_GUIDE.md` 了解完整的使用文档
- 查看 `src/middleware/auth.ts` 了解认证中间件实现
- 查看 `src/routes/api-keys.ts` 了解 API Key 管理路由

