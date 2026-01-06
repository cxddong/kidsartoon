# 大师灵感匹配功能开发任务 (Masterpiece Match)

## 目标
创建一个新功能：用户上传涂鸦 → AI分析 → 匹配艺术大师名画 → 展示对比 → 给予鼓励

## 任务清单

### 1. 数据准备
- [x] 创建名画数据库文件 `src/data/masterpieces.ts` <!-- id: 1 -->
- [/] 收集/生成 20-30 张经典名画图片（已生成3张示例）<!-- id: 2 -->
- [x] 将名画图片放置到 `client/public/assets/masterpieces/` <!-- id: 3 -->

### 2. 后端服务
- [x] 在 `src/services/gemini.ts` 添加 `analyzeAndMatchMasterpiece` 方法 <!-- id: 5 -->
- [x] 创建新的 API 路由 `/api/masterpiece/match` <!-- id: 6 -->
- [x] 在 `index.ts` 注册 masterpiece 路由 <!-- id: 6.1 -->

### 3. 前端页面
- [ ] 在 Generate 页面添加"大师匹配"入口图标 <!-- id: 7 -->
- [ ] 创建 `MasterpieceMatchPage.tsx` 或模态框组件 <!-- id: 8 -->
- [ ] 实现图片上传界面 <!-- id: 9 -->
- [ ] 实现加载动画（Magic Kat 拿放大镜） <!-- id: 10 -->
- [ ] 实现对比展示界面（左：孩子画作，右：名画） <!-- id: 11 -->
- [ ] 添加连线动画展示共同点 <!-- id: 12 -->
- [ ] 添加 Kat 对话气泡展示分析和建议 <!-- id: 13 -->

### 4. 测试与优化
- [ ] 测试各种画风的匹配准确性 <!-- id: 14 -->
- [ ] 优化 UI/UX 交互体验 <!-- id: 15 -->
- [ ] 添加保存和分享功能 <!-- id: 16 -->
