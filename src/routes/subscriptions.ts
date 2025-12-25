import { Router } from 'express';
import { subscriptionService } from '../services/subscription.js';

export const router = Router();

// Mock Subscribe Endpoint
router.post('/subscribe', async (req, res) => {
  const { userId, planId, platform } = req.body;

  // Security: In production, verify auth token. Here relying on userId.
  if (!userId || !planId) {
    return res.status(400).json({ error: 'Missing userId or planId' });
  }

  try {
    const result = await subscriptionService.subscribeUser(userId, planId, platform || 'web');
    res.json(result);
  } catch (error: any) {
    console.error('[Subscription API] Error:', error);
    res.status(500).json({ error: error.message || 'Subscription failed' });
  }
});

// Get Plans
router.get('/plans', (req, res) => {
  // Return plans structure aligned with frontend requirement
  res.json({
    basic: { id: 'basic', points: 1200, price: 9.99, name: 'Basic' },
    pro: { id: 'pro', points: 2800, price: 19.99, name: 'Pro' },
    yearly_pro: { id: 'yearly_pro', points: 14000, price: 99.00, name: 'Yearly Pro' }
  });
});
