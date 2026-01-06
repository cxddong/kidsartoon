# 大师灵感匹配 (Masterpiece Match) 实现方案

## 功能概述
让孩子的涂鸦与艺术大师的名画产生联系，通过 AI 分析找到相似的艺术风格，给予孩子鼓励和灵感。

---

## 技术架构

### 数据层

#### [NEW] [src/data/masterpieces.ts](file:///d:/KAT/KAT/src/data/masterpieces.ts)

创建名画数据库，包含 20-30 幅经典作品：

```typescript
export interface Masterpiece {
  id: string;
  artist: string;
  title: string;
  tags: string[];
  imagePath: string;
  kidFriendlyFact: string;
}

export const MASTERPIECES: Masterpiece[] = [
  {
    id: "van_gogh_starry",
    artist: "Vincent van Gogh",
    title: "The Starry Night",
    tags: ["blue", "swirls", "night", "stars", "yellow"],
    imagePath: "/assets/masterpieces/van_gogh_starry.jpg",
    kidFriendlyFact: "He loved painting the wind and stars like magic swirls!"
  },
  // ... 更多名画
];
```

**推荐画作列表**：
1. Van Gogh - The Starry Night
2. Monet - Water Lilies
3. Matisse - The Snail
4. Picasso - Three Musicians
5. Kandinsky - Squares with Concentric Circles
6. Mondrian - Composition with Red, Blue and Yellow
7. Pollock - Number 1A
8. Miro - The Sun
9. Klimt - The Tree of Life
10. Hokusai - The Great Wave

---

### 后端服务

#### [MODIFY] [src/services/gemini.ts](file:///d:/KAT/KAT/src/services/gemini.ts)

添加新方法使用 Gemini Vision API 分析图片：

```typescript
async analyzeAndMatchMasterpiece(imageBase64: string): Promise<MasterpieceMatch> {
  const artListText = MASTERPIECES.map(m => 
    `ID: ${m.id} | Artist: ${m.artist} | Keywords: ${m.tags.join(", ")}`
  ).join("\n");

  const prompt = `
You are Magic Kat, an art historian for kids.

TASK:
1. Analyze this drawing: colors, shapes, composition, subject
2. Match it to ONE artwork from the list below
3. Explain the connection to a child (age 5-10)
4. Give one simple improvement tip

AVAILABLE ARTWORKS:
${artListText}

OUTPUT (JSON only):
{
  "matchId": "id_from_list",
  "analysis": "Wow! You used blue swirls just like Van Gogh!",
  "suggestion": "Try adding a bright yellow moon next!",
  "commonFeatures": ["blue colors", "swirly lines"]
}
`;

  // 使用 Gemini Vision API
  const result = await this.analyzeImageWithGemini(imageBase64, prompt);
  return JSON.parse(result);
}
```

**或者使用豆包 Vision**（如果更稳定）：

#### [MODIFY] [src/services/doubao.ts](file:///d:/KAT/KAT/src/services/doubao.ts)

```typescript
async analyzeAndMatchMasterpiece(imageBase64: string): Promise<MasterpieceMatch> {
  // 类似实现
}
```

---

#### [NEW] [src/routes/masterpiece.ts](file:///d:/KAT/KAT/src/routes/masterpiece.ts)

创建新的 API 路由：

```typescript
import { Router } from 'express';
import multer from 'multer';
import { geminiService } from '../services/gemini.js';
import { pointsService } from '../services/points.js';

export const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/match', upload.single('image'), async (req, res) => {
  try {
    const userId = req.body.userId;
    
    // 消耗积分（比如5分）
    const canAfford = await pointsService.deductPoints(userId, 5, 'masterpiece_match');
    if (!canAfford.success) {
      return res.status(402).json({ error: 'Not enough points' });
    }

    // 转换图片为 base64
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // AI 分析匹配
    const match = await geminiService.analyzeAndMatchMasterpiece(base64);
    
    res.json({
      success: true,
      match
    });
  } catch (error) {
    await pointsService.refundPoints(userId, 5, 'masterpiece_match', 'error');
    res.status(500).json({ error: 'Analysis failed' });
  }
});
```

---

### 前端实现

#### [MODIFY] [client/src/pages/GeneratePage.tsx](file:///d:/KAT/KAT/client/src/pages/GeneratePage.tsx)

在页面中添加"大师匹配"入口：

```tsx
// 在现有功能卡片旁边添加
<motion.div 
  className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 cursor-pointer"
  onClick={() => navigate('/masterpiece-match')}
>
  <div className="text-6xl mb-4">🎨</div>
  <h3 className="text-white font-bold text-xl">大师灵感</h3>
  <p className="text-white/80 text-sm">发现你的艺术天赋</p>
</motion.div>
```

---

#### [NEW] [client/src/pages/MasterpieceMatchPage.tsx](file:///d:/KAT/KAT/client/src/pages/MasterpieceMatchPage.tsx)

创建专门的匹配页面：

**页面流程**：
1. **上传界面** - 让孩子上传涂鸦
2. **分析中** - Magic Kat 拿放大镜动画
3. **结果展示** - 左右对比 + 连线动画
4. **鼓励对话** - Kat 的评价和建议

```tsx
export default function MasterpieceMatchPage() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MasterpieceMatch | null>(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // 调用 API
    const res = await fetch('/api/masterpiece/match', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    setResult(data.match);
    setAnalyzing(false);
  };

  return (
    <div>
      {!result ? (
        <UploadSection onUpload={handleAnalyze} />
      ) : (
        <ResultSection uploadedImage={uploadedImage} result={result} />
      )}
    </div>
  );
}
```

---

#### 关键组件设计

**1. AnalyzingAnimation.tsx** - 分析动画
```tsx
<motion.div>
  <img src="/assets/kat-magnifying.gif" alt="Analyzing" />
  <p>Magic Kat 正在寻找灵感...</p>
</motion.div>
```

**2. ComparisonView.tsx** - 对比展示
```tsx
<div className="grid grid-cols-2 gap-8">
  {/* 左边：孩子的画 */}
  <div>
    <img src={userDrawing} />
    <p>你的作品 ✨</p>
  </div>
  
  {/* 右边：名画 */}
  <div>
    <img src={masterpiece.imagePath} />
    <p>{masterpiece.artist} - {masterpiece.title}</p>
  </div>
</div>

{/* 中间连线动画 */}
<ConnectionAnimation features={result.commonFeatures} />
```

**3. KatDialogue.tsx** - 对话气泡
```tsx
<div className="kat-bubble">
  <img src="/assets/kat-excited.png" />
  <div className="dialogue">
    <p>{result.analysis}</p>
    <p className="suggestion">{result.suggestion}</p>
  </div>
</div>
```

---

## 资源准备

### 名画图片来源
- **公有领域**：使用 Google Arts & Culture 或 WikiArt
- **生成**：使用 AI 生成工具创建类似风格的"致敬"版本
- **尺寸**：建议 800x600 左右，保持加载速度

### 动画资源
- Magic Kat 拿放大镜动画
- 连线动画效果
- 星星/火花点缀效果

---

## 验证计划

### 功能测试
1. 上传各种风格的画作（抽象、写实、色彩鲜艳等）
2. 验证 AI 匹配的准确性
3. 测试在不同设备上的显示效果

### 用户体验测试
1. 让真实的孩子使用并观察反应
2. 记录他们最喜欢的部分
3. 根据反馈优化对话文案

---

## 扩展功能（可选）

1. **保存匹配记录** - 让孩子看到"我的灵感墙"
2. **分享功能** - 生成对比图分享给家人
3. **大师知识卡** - 点击名画展示艺术家小故事
4. **挑战模式** - "试着画一幅莫奈风格的画吧！"
