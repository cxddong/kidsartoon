# 🔥 快速设置 Firebase 管理员密钥

## 第一步：下载密钥文件

**点击这个链接直接访问：**
👉 https://console.firebase.google.com/project/kat-antigravity/settings/serviceaccounts/adminsdk

或者手动导航：
1. https://console.firebase.google.com/
2. 选择项目 **kat-antigravity**
3. 左侧齿轮 ⚙️ → 项目设置 → 服务账号
4. 点击 **生成新的私钥** (Generate new private key)

## 第二步：重命名和放置文件

下载的文件名类似: `kat-antigravity-firebase-adminsdk-xxxxx-xxxxxxxxxx.json`

**重命名为**: `firebase-admin-key.json`

**放到这个位置**:
```
D:\KAT\KAT\firebase-admin-key.json
```

## 第三步：验证文件

在项目根目录运行：
```bash
dir firebase-admin-key.json
```

应该看到文件存在。

## 第四步：重启服务器

```bash
# 按 Ctrl+C 停止服务器
# 然后重新启动
npm run dev:all
```

## 🎯 成功标志

启动后看到：
```
[AdminStorage] Firebase Admin SDK initialized successfully
```

生成卡片时看到：
```
[AdminStorage] Upload success: https://storage.googleapis.com/...
```

**完成！** 现在所有图片都会永久保存到云端。

---

## ⚠️ 重要提醒

✅ 代码已自动更新
✅ .gitignore 已配置（密钥不会被提交到 Git）
❌ **切勿分享此密钥文件给任何人**
❌ **切勿上传到公开仓库**
