import express from 'express';
import cors from 'cors';
import { router as mediaRouter } from '../src/routes/media.js';
import { router as userRouter } from '../src/routes/users.js';
import { router as communityRouter } from '../src/routes/community.js';
import { router as subscriptionRouter } from '../src/routes/subscriptions.js';
/**
 * Create a test Express app instance
 */
export function createTestApp() {
    const app = express();
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/media', mediaRouter);
    app.use('/api/users', userRouter);
    app.use('/api/community', communityRouter);
    app.use('/api/subscriptions', subscriptionRouter);
    app.get('/health', (_req, res) => res.json({ status: 'ok' }));
    return app;
}
