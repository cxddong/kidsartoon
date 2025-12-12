// src/index.ts
import 'dotenv/config'; // 读取 .env（必须放最顶）
import fs from 'fs'; // For checking clientDist
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// ESM 下还原 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 基础中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态资源：让 /public 下文件可访问 (Legacy)
// 静态资源：让 /public 下文件可访问 (Legacy)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// 关键修正：让 client/public 下文件（如 generated）也可访问
const clientPublicDir = path.join(__dirname, '..', 'client', 'public');
app.use(express.static(clientPublicDir));

// Serve React Frontend (Production)
// Serve React Frontend (Production)
const clientDist = path.join(__dirname, '..', 'client', 'dist');
// Always serve client if it exists, since we build it in Docker
if (true) {
  app.use(express.static(clientDist));
  // Catch-all for SPA routing
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/docs')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  // Dev mode: Redirect root to Vite dev server if accessed directly (optional convenience)
  app.get('/', (_req, res) => {
    res.redirect('http://localhost:5173');
  });
}

// Demo 页面仍然可用 (Legacy)
app.get('/demo', (_req, res) => {
  res.sendFile(path.join(publicDir, 'demo.html'));
});

// OpenAPI /docs
try {
  const openapiPath = path.join(__dirname, '..', 'openapi', 'openapi.yaml');
  const openapiDoc = YAML.load(openapiPath);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
} catch {
  console.warn('OpenAPI spec not found; /docs will be disabled until yaml is present.');
}

// 业务路由
import { router as mediaRouter } from './routes/media.js';
import { router as userRouter } from './routes/users.js';
import { router as communityRouter } from './routes/community.js';
import { router as subscriptionRouter } from './routes/subscriptions.js';
import { router as apiKeyRouter } from './routes/api-keys.js';
import { router as imageRouter } from './routes/images.js';
import { router as authRouter } from './routes/auth.js';
import { router as storyRouter } from './routes/story.js';
import { optionalApiKeyAuth } from './middleware/auth.js';

// ====== 新增：AI 相关最小可用路由 ======
const aiRouter = express.Router();

/**
 * POST /api/ai/openai/image
 * body: { prompt: string, size?: "256x256" | "512x512" | "1024x1024" | "2048x2048" }
 * 返回: { url: string }
 */
aiRouter.post('/openai/image', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    const { prompt, size = '1024x1024' } = req.body ?? {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required (string)' });
    }

    const resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size,
        n: 1,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: 'openai_error', detail: text });
    }

    const data = await resp.json();
    const url = data?.data?.[0]?.url;
    if (!url) return res.status(502).json({ error: 'No image url from OpenAI' });
    res.json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * POST /api/ai/doubao/image
 * body: { prompt: string, size?: "2K" | "4K", response_format?: "url" | "b64_json" }
 * 返回: { url?: string, b64?: string }
 */
aiRouter.post('/doubao/image', async (req, res) => {
  try {
    const volcKey = process.env.Doubao_API_KEY;
    if (!volcKey) return res.status(500).json({ error: 'Missing Doubao_API_KEY' });

    const {
      prompt,
      size = '2K',
      response_format = 'url',
      model = 'doubao-seedream-4-0-250828',
    } = req.body ?? {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required (string)' });
    }

    const resp = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${volcKey}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        size,
        sequential_image_generation: 'disabled',
        response_format,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: 'doubao_error', detail: text });
    }

    const data = await resp.json();
    const first = data?.data?.[0] ?? {};
    if (response_format === 'b64_json' && first?.b64_json) {
      return res.json({ b64: first.b64_json });
    }
    if (first?.url) return res.json({ url: first.url });

    res.status(502).json({ error: 'No image returned from Doubao' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Help user if they try GET
aiRouter.get('/doubao/image', (req, res) => {
  res.status(405).json({ error: 'Method Not Allowed', message: 'Please use POST method for this endpoint.' });
});
// ====== 新增路由结束 ======

// API key 管理路由（需要认证）
app.use('/api/api-keys', apiKeyRouter);

// 其他 API 路由（可选认证；需要可一键切成强制认证）
app.use('/api/media', mediaRouter);
app.use('/api/images', imageRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api', storyRouter); // Mount context root for /analyze-image etc. e.g /api/create-story-from-image
app.use('/api/community', optionalApiKeyAuth, communityRouter);
app.use('/api/subscriptions', optionalApiKeyAuth, subscriptionRouter);

// 新增的 AI 路由同样套上可选认证
app.use('/api/ai', optionalApiKeyAuth, aiRouter);

// 健康检查
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 启动
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`\n🎨 Kids Art Tales App is running!`);

  // DEBUG: Check files
  if (fs.existsSync(clientDist)) {
    console.log(`[DEBUG] Client Dist exists at: ${clientDist}`);
    console.log(`[DEBUG] Files: ${fs.readdirSync(clientDist).join(', ')}`);
  } else {
    console.log(`[DEBUG] Client Dist NOT FOUND at: ${clientDist}`);
  }

  console.log(`\n📱 Main App:  http://localhost:${port}/`);
  console.log(`📚 API Docs:  http://localhost:${port}/docs`);
  console.log(`🧪 Demo Page: http://localhost:${port}/demo`);
  console.log(`🤖 OpenAI:    POST http://localhost:${port}/api/ai/openai/image`);
  console.log(`🤖 Doubao:    POST http://localhost:${port}/api/ai/doubao/image\n`);
});
