import { Router } from 'express';
import { apiKeyAuth, apiKeyManager } from '../middleware/auth.js';

export const router = Router();

// All API key management routes require authentication
router.use(apiKeyAuth);

/**
 * Generate new API key
 * POST /api/api-keys
 */
router.post('/', (req, res) => {
  const { name, userId } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }

  const newKey = apiKeyManager.generateKey(name, userId);

  res.status(201).json({
    success: true,
    apiKey: newKey,
    message: 'API key generated successfully. Store it securely, it will not be shown again.',
    warning: 'This is the only time you will see this API key. Make sure to save it!',
  });
});

/**
 * Get current API key info
 * GET /api/api-keys/current
 */
router.get('/current', (req, res) => {
  const apiKey = req.apiKey!;
  const keyData = apiKeyManager.getKeyInfo(apiKey);

  if (!keyData) {
    return res.status(404).json({ error: 'API key not found' });
  }

  res.json({
    key: apiKey.substring(0, 10) + '...', // Show only partial key
    name: keyData.name,
    userId: keyData.userId,
    createdAt: keyData.createdAt,
    lastUsed: keyData.lastUsed,
    requestsCount: keyData.requestsCount,
  });
});

/**
 * Validate API key
 * GET /api/api-keys/validate
 */
router.get('/validate', (req, res) => {
  const apiKey = req.apiKey!;
  const isValid = apiKeyManager.validateKey(apiKey);

  res.json({
    valid: isValid,
    key: apiKey.substring(0, 10) + '...',
  });
});

/**
 * List all API keys (Admin only)
 * GET /api/api-keys
 */
router.get('/', (req, res) => {
  // Admin check logic can be added here
  const keys = apiKeyManager.listKeys();

  res.json({
    count: keys.length,
    keys,
  });
});

/**
 * Delete API key
 * DELETE /api/api-keys/:key
 */
router.delete('/:key', (req, res) => {
  const keyToDelete = req.params.key;
  const currentKey = req.apiKey!;

  // Cannot delete the API key currently in use
  if (keyToDelete === currentKey) {
    return res.status(400).json({ error: 'Cannot delete the API key you are currently using' });
  }

  const deleted = apiKeyManager.deleteKey(keyToDelete);

  if (deleted) {
    res.json({ success: true, message: 'API key deleted' });
  } else {
    res.status(404).json({ error: 'API key not found' });
  }
});

