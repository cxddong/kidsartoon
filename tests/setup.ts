import express from 'express';
import cors from 'cors';
import { router as mediaRouter } from '../src/routes/media.js';
import { router as userRouter } from '../src/routes/users.js';
import { router as communityRouter } from '../src/routes/community.js';
import { router as subscriptionRouter } from '../src/routes/subscriptions.js';
import { router as apiKeyRouter } from '../src/routes/api-keys.js';
import { optionalApiKeyAuth } from '../src/middleware/auth.js';

/**
 * Create a test Express app instance
 */
export function createTestApp() {
  const app = express();
  
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // API key management routes (require auth)
  app.use('/api/api-keys', apiKeyRouter);
  
  // Other routes (optional auth)
  app.use('/api/media', optionalApiKeyAuth, mediaRouter);
  app.use('/api/users', optionalApiKeyAuth, userRouter);
  app.use('/api/community', optionalApiKeyAuth, communityRouter);
  app.use('/api/subscriptions', optionalApiKeyAuth, subscriptionRouter);
  
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  
  return app;
}

