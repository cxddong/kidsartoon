# 创建 .env 文件指南

## 方法 1: 使用 PowerShell 脚本（推荐）

### 步骤 1: 运行创建脚本

```powershell
cd KAT
.\create-env.ps1
```

脚本会自动：
- 生成强随机 API Key
- 创建 .env 文件
- 显示生成的 API Key
- 提供下一步操作说明

### 步骤 2: 重启服务器

```bash
npm run dev
```

## 方法 2: 手动创建

### 步骤 1: 创建 .env 文件

在 `KAT` 目录下创建 `.env` 文件

### 步骤 2: 添加内容

```bash
# Kids Art Tales API 配置文件

# API Key 配置
API_KEY=dev-key-12345

# 服务器端口
PORT=3000
```

### 步骤 3: 生成强随机 API Key（可选但推荐）

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

然后将生成的 Key 替换 `.env` 文件中的 `dev-key-12345`

### 步骤 4: 重启服务器

```bash
npm run dev
```

## 方法 3: 复制示例文件

### 步骤 1: 复制示例文件

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Linux/Mac
cp .env.example .env
```

### 步骤 2: 编辑 .env 文件

打开 `.env` 文件，修改 `API_KEY` 的值

### 步骤 3: 重启服务器

```bash
npm run dev
```

## 验证设置

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

## 默认配置

如果不创建 .env 文件，系统会使用默认配置：
- **API Key:** `dev-key-12345`
- **端口:** `3000`

⚠️ **生产环境必须更改默认 API Key！**

## 安全提示

1. ✅ 使用强随机字符串作为 API Key
2. ✅ 不要将 .env 文件提交到 Git
3. ✅ 定期轮换 API Key
4. ✅ 使用环境变量管理敏感信息
5. ✅ 生产环境使用 HTTPS

## 相关文档

- [API Key 设置指南](./API_KEY_SETUP.md) - 完整设置文档
- [快速设置指南](./QUICK_SETUP.md) - 快速设置步骤
- [API Key 使用指南](./API_KEY_GUIDE.md) - 使用文档

