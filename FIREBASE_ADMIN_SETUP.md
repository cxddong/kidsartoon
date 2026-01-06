# Firebase 管理员凭证配置 / Firebase Admin Credentials Setup

## 🚨 当前问题 / Current Issue
您的应用目前使用临时图片链接，这些链接会在几小时后失效。用户将无法从数据库访问历史作品。

Your app is currently using temporary image URLs that expire after a few hours. Users won't be able to access their saved artworks.

---

## ✅ 解决方案 / Solution
配置 Firebase Admin SDK 服务账号，实现永久云存储。

Configure Firebase Admin SDK service account for permanent cloud storage.

---

## 📋 详细步骤 / Step-by-Step Instructions

### 1️⃣ 下载服务账号密钥 / Download Service Account Key

1. 打开 Firebase 控制台 / Open Firebase Console:
   👉 https://console.firebase.google.com/

2. 选择您的项目 / Select your project:
   **kat-antigravity**

3. 点击左侧齿轮图标 ⚙️ → **项目设置 / Project Settings**

4. 切换到 **服务账号 / Service Accounts** 标签页

5. 点击 **生成新的私钥 / Generate New Private Key**

6. 确认下载对话框，会下载一个 JSON 文件

7. **重命名文件为**: `firebase-admin-key.json`

8. **移动文件到项目根目录**:
   ```
   D:\KAT\KAT\firebase-admin-key.json
   ```

---

### 2️⃣ 更新代码 / Update Code

打开文件 / Open file: `src/services/adminStorage.ts`

**查找这行 (第11行) / Find this line (line 11):**
```typescript
credential: admin.credential.applicationDefault(),
```

**替换为 / Replace with:**
```typescript
credential: admin.credential.cert('./firebase-admin-key.json'),
```

---

### 3️⃣ 添加到 .gitignore

**重要！不要将密钥提交到 Git！**
**Important! Don't commit the key to Git!**

打开 `.gitignore` 文件，添加:
```
firebase-admin-key.json
```

---

### 4️⃣ 重启服务器 / Restart Server

```bash
# 停止当前服务器 (Ctrl + C)
# 重新启动
npm run dev:all
```

---

## 🎯 验证成功 / Verify Success

重启后，您应该看到:
```
[AdminStorage] Firebase Admin SDK initialized successfully
```

生成卡片时，应该看到:
```
[AdminStorage] Upload success: https://storage.googleapis.com/...
```

**不再出现** "Could not load the default credentials" 错误

---

## 🔐 生产环境部署 / Production Deployment

如果部署到云平台 (Google Cloud, Heroku, AWS 等):

### 选项 A: 环境变量
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-admin-key.json"
```

### 选项 B: Application Default Credentials
保持代码使用 `applicationDefault()`，确保云平台已配置服务账号权限。

---

## ❓ 常见问题 / FAQ

**Q: 密钥文件放在哪里？**
A: 项目根目录 `D:\KAT\KAT\firebase-admin-key.json`

**Q: 如何确认文件放对了？**
A: 运行 `dir firebase-admin-key.json` 应该能看到文件

**Q: 还是报错怎么办？**
A: 检查文件路径是否正确，确保文件名完全匹配

**Q: 这会影响已生成的图片吗？**
A: 不会。之后生成的所有图片都会永久保存到云端。

---

## 📞 需要帮助？ / Need Help?

如果遇到问题，请提供以下信息:
1. 文件是否存在: `dir firebase-admin-key.json`
2. 启动日志中的错误信息
3. `adminStorage.ts` 的第11行内容
