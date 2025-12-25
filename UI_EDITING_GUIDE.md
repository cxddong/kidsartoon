# UI 改动指南

## 项目UI架构概览

本项目使用 **React + TypeScript + Tailwind CSS** 构建，UI系统主要包含以下部分：

### 1. 样式系统结构

```
client/src/
├── index.css           # 全局样式和主题配置（主要UI配置文件）
├── App.css            # App组件特定样式
├── styles/
│   └── MagicLab.css   # Magic Lab页面专用样式
└── components/
    └── effects/
        └── Fireworks.css  # 特效样式
```

### 2. 主题和颜色配置

**主要配置文件：`client/src/index.css`**

在 `@theme` 块中定义了全局主题变量：

```css
@theme {
  --color-primary: #FF6B6B;           /* 主色调 - 红色 */
  --color-primary-hover: #FF5252;     /* 主色悬停 */
  --color-primary-light: #FF8787;     /* 主色浅色 */
  
  --color-secondary: #4ECDC4;         /* 次要色 - 青色 */
  --color-secondary-hover: #45B7AF;   /* 次要色悬停 */
  
  --color-accent-yellow: #FFE66D;     /* 强调色 - 黄色 */
  --color-accent-purple: #6C5CE7;     /* 强调色 - 紫色 */
  
  --color-background: #F7F9FC;        /* 背景色 */
  
  --font-sans: "Nunito", ...;         /* 字体 */
}
```

### 3. 如何修改UI

#### 🔧 方式一：修改全局主题（推荐）

**文件：`client/src/index.css`**

**修改颜色：**
```css
@theme {
  /* 修改主色调 */
  --color-primary: #YOUR_COLOR;
  --color-primary-hover: #YOUR_HOVER_COLOR;
  
  /* 修改背景色 */
  --color-background: #YOUR_BG_COLOR;
  
  /* 添加新颜色 */
  --color-new: #YOUR_NEW_COLOR;
}
```

**修改字体：**
```css
@theme {
  /* 更改字体族 */
  --font-sans: "Your-Font-Name", "Segoe UI", Roboto, sans-serif;
}
```

**添加自定义动画：**
```css
@theme {
  @keyframes your-animation {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }
  
  --animate-your-name: your-animation 3s infinite;
}
```

#### 🎨 方式二：使用Tailwind CSS类（组件内）

所有React组件都可以使用Tailwind CSS类名：

```tsx
// 在组件中直接使用Tailwind类
<div className="bg-primary text-white p-4 rounded-lg hover:bg-primary-hover">
  Hello World
</div>

// 使用自定义主题颜色
<button className="bg-primary text-white px-6 py-2 rounded-full">
  按钮
</button>

// 响应式设计
<div className="w-full md:w-1/2 lg:w-1/3">
  内容
</div>
```

**常用Tailwind类：**
- `bg-primary` - 使用主色调背景
- `text-primary` - 使用主色调文字
- `border-primary` - 使用主色调边框
- `hover:bg-primary-hover` - 悬停效果
- `rounded-lg` - 圆角
- `shadow-lg` - 阴影
- `transition-all` - 过渡动画

#### 📄 方式三：修改特定页面样式

**示例：修改Magic Lab页面**

文件：`client/src/styles/MagicLab.css`

```css
/* 修改Magic Lab背景 */
.magic-lab-container {
    background: radial-gradient(circle at top left, #YOUR_COLOR1, #YOUR_COLOR2);
}

/* 修改按钮样式 */
.magic-transform-btn {
    @apply px-8 py-4 bg-gradient-to-r from-yellow-400 to-pink-500;
    /* 自定义样式 */
    box-shadow: 0 0 20px rgba(255, 105, 180, 0.8);
}
```

**示例：修改组件样式**

直接编辑对应的 `.tsx` 文件，修改 `className` 属性：

```tsx
// client/src/components/ui/BouncyButton.tsx
export const BouncyButton: React.FC<BouncyButtonProps> = ({
    children,
    className,
    ...props
}) => (
    <motion.button
        className={cn(
            "transition-colors",
            "bg-primary text-white",  // 添加你的样式
            "px-4 py-2 rounded-full",  // 添加你的样式
            className
        )}
        {...props}
    >
        {children}
    </motion.button>
);
```

#### 🎭 方式四：添加新的CSS文件

如果需要为特定功能添加样式：

1. **创建新的CSS文件**
   ```
   client/src/styles/YourFeature.css
   ```

2. **在index.css中导入**
   ```css
   @import './styles/YourFeature.css';
   ```

3. **在组件中使用**
   ```tsx
   import './styles/YourFeature.css';
   
   <div className="your-feature-class">
     内容
   </div>
   ```

### 4. 常用UI修改场景

#### 修改按钮样式

**全局按钮样式（推荐）：**
在 `index.css` 中添加：

```css
.btn-primary {
  @apply bg-primary text-white px-6 py-3 rounded-full font-bold;
  @apply hover:bg-primary-hover transition-all duration-200;
  @apply shadow-lg hover:shadow-xl;
}
```

然后在组件中使用：
```tsx
<button className="btn-primary">按钮</button>
```

#### 修改卡片样式

```css
.card {
  @apply bg-white rounded-2xl p-6 shadow-md;
  @apply hover:shadow-lg transition-shadow;
}
```

#### 修改滚动条样式

已在 `index.css` 中定义，可以直接修改：

```css
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-thumb {
  background: #FF6B6B;  /* 修改这里改变滚动条颜色 */
  border-radius: 5px;
}
```

### 5. 响应式设计

使用Tailwind的响应式前缀：

```tsx
<div className="
  text-sm           // 移动端：小字体
  md:text-base      // 平板：中等字体
  lg:text-lg        // 桌面：大字体
  xl:text-xl        // 大屏：更大字体
">
  响应式文字
</div>

<div className="
  grid grid-cols-1    // 移动端：1列
  md:grid-cols-2      // 平板：2列
  lg:grid-cols-3      // 桌面：3列
">
  响应式网格
</div>
```

### 6. 动画效果

项目使用 **Framer Motion** 和 **CSS动画**：

**使用Framer Motion（推荐）：**
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  动画内容
</motion.div>
```

**使用CSS动画：**
```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fade-in 0.3s ease-out;
}
```

### 7. 开发工作流

#### 实时预览修改

1. **启动开发服务器**
   ```bash
   cd client
   npm run dev
   ```

2. **修改文件后自动刷新**
   - 修改 `.tsx` 文件 → 自动热重载
   - 修改 `.css` 文件 → 自动更新样式

3. **查看效果**
   - 浏览器访问：`http://localhost:5173` (默认Vite端口)
   - 使用浏览器开发者工具调试样式

#### 构建生产版本

```bash
cd client
npm run build
```

### 8. 文件结构指南

**页面组件：**
- 位置：`client/src/pages/`
- 示例：`HomePage.tsx`, `LoginPage.tsx`

**可复用组件：**
- 位置：`client/src/components/`
- 示例：`BouncyButton.tsx`, `BottomNav.tsx`

**布局组件：**
- 位置：`client/src/components/layout/`
- 示例：`Layout.tsx`

**样式文件：**
- 全局：`client/src/index.css`
- 特定：`client/src/styles/`

### 9. 最佳实践

✅ **推荐做法：**
- 优先使用Tailwind CSS工具类
- 在 `@theme` 中定义可复用的颜色和变量
- 使用组件化的方式组织样式
- 保持样式的一致性

❌ **避免：**
- 避免内联样式（除非必要）
- 避免过度使用 `!important`
- 避免创建过多的自定义CSS类（优先使用Tailwind）

### 10. 常见问题

**Q: 如何快速定位要修改的UI？**
A: 使用浏览器开发者工具（F12）→ Elements/检查元素 → 找到对应的组件文件

**Q: 修改后没有生效？**
A: 
- 检查文件是否保存
- 检查开发服务器是否运行
- 清除浏览器缓存并刷新
- 检查控制台是否有错误

**Q: 如何添加新的图标？**
A: 项目使用 `lucide-react`，可以直接导入使用：
```tsx
import { Heart, Star, Sparkles } from 'lucide-react';

<Heart className="w-6 h-6 text-primary" />
```

### 11. 有用的资源

- **Tailwind CSS文档：** https://tailwindcss.com/docs
- **Framer Motion文档：** https://www.framer.com/motion/
- **Lucide图标库：** https://lucide.dev/icons/
- **React文档：** https://react.dev/

---

**需要帮助？** 查看具体组件文件了解实现细节，或参考现有页面的样式模式。


