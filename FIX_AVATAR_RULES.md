# 如何修复 "Permission Denied" (权限被拒绝) 错误

您的错误 `storage/unauthorized` 是因为 Firebase **Storage (存储)** 的安全规则默认拒绝了写入操作。

请按以下步骤操作：

1. 打开 [Firebase Console](https://console.firebase.google.com/)。
2. 选择您的项目 **kat-antigravity**。
3. 点击左侧菜单的 **Storage** (如果是第一次，点击 "Get Started")。
4. 点击顶部的 **Rules (规则)** 标签页。
5. 将现有规则替换为以下内容：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 允许所有已登录用户上传和读取文件
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. 点击 **Publish (发布)**。

完成此操作后，等待 1-2 分钟，再次尝试上传头像即可成功！
