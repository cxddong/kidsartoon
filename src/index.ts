// src/index.ts
import 'dotenv/config'; // Read .env (Must be at the top)
import { router as pictureBookRouter } from './routes/picturebook.js';
import fs from 'fs'; // For checking clientDist
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

// Restore __dirname under ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global Crash Handler
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  // Keep process alive for debugging per user request context (normally should exit)
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// Basic Middleware
app.use(cors({
  origin: true, // Allow all origins for dev simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.disable('x-powered-by'); // Security

// Debug Middleware: Log all requests
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// ===== Static Files & Frontend Serving =====

// Resolve paths relative to process.cwd() for container safety
const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public'); // Backend public (legacy)
const clientPublicDir = path.join(rootDir, 'client', 'public'); // Generated content (e.g. comics)

// Frontend Build Location Strategies
const strategySource = path.join(rootDir, 'client', 'dist'); // Standard Dev/Local
const strategyBundled = path.join(rootDir, 'dist', 'public'); // Bundled for Cloud
let clientDist = strategySource;

if (fs.existsSync(strategyBundled)) {
  console.log(`[SERVER-START] Found Bundled Frontend at: ${strategyBundled}`);
  clientDist = strategyBundled;
} else {
  console.log(`[SERVER-START] Bundled Frontend not found. Trying Source at: ${strategySource}`);
  clientDist = strategySource;
}

console.log(`[SERVER-START] Root: ${rootDir}`);
console.log(`[SERVER-START] Final clientDist Target: ${clientDist}`);

// 1. Serve Backend Public Assets
app.use(express.static(publicDir));

// 2. Serve Client Generated Assets (Runtime)
// Must be before build static to ensure new files are served
if (fs.existsSync(clientPublicDir)) {
  app.use(express.static(clientPublicDir));
}

// 3. Import Business Routes
import { router as mediaRouter } from './routes/media.js';
import { router as userRouter } from './routes/users.js';
import { router as communityRouter } from './routes/community.js';
import { router as subscriptionRouter } from './routes/subscriptions.js';
import { router as apiKeyRouter } from './routes/api-keys.js';
import { router as imageRouter } from './routes/images.js';
import { router as authRouter } from './routes/auth.js';
import { router as storyRouter } from './routes/story.js';
import { router as feedbackRouter } from './routes/feedback.js';
import { router as pointsRouter } from './routes/points.js';
import { router as sparkleRouter } from './routes/sparkle.js';
import { router as videoRouter } from './routes/video.js';
import { optionalApiKeyAuth } from './middleware/auth.js';

// --- Health Check (Highest Priority for load balancers) ---
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// --- API Routes ---
app.use('/api/media', mediaRouter);
app.use('/api/images', imageRouter);
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api', storyRouter);
app.use('/api/community', optionalApiKeyAuth, communityRouter);
app.use('/api/subscriptions', optionalApiKeyAuth, subscriptionRouter);
app.use('/api/feedback', optionalApiKeyAuth, feedbackRouter);
app.use('/api/points', pointsRouter);
app.use('/api/sparkle', optionalApiKeyAuth, sparkleRouter);
app.use('/api/video', videoRouter);
app.use('/api/picturebook', pictureBookRouter);

// AI Related
const aiRouter = express.Router();
app.use('/api/ai', optionalApiKeyAuth, aiRouter);

// Demo Page
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

// 4. Serve Frontend SPA (Last Priority)
if (fs.existsSync(clientDist)) {
  console.log(`[SERVER-START] Serving production frontend from: ${clientDist}`);

  app.use(express.static(clientDist, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('index.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  app.get('*', (req, res, next) => {
    // Skip matched routes
    if (req.path.startsWith('/api') || req.path.startsWith('/docs') || req.path === '/health') return next();

    // Missing files return 404
    if (req.path.includes('.') && !req.path.includes('.html')) return res.status(404).send('Not Found');

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  console.warn(`[SERVER-START] clientDist not found at ${clientDist}. API only mode active.`);
}

// Start Server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`\n\n[Server] 🚀 Backend running on http://localhost:${port}`);
  console.log(`📱 Main App:  http://localhost:${port}/`);
});
