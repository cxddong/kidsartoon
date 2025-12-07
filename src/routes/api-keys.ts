import { Router } from 'express';
import { apiKeyAuth, apiKeyManager } from '../middleware/auth.js';

export const router = Router();

// 所有 API key 管理路由都需要认证
router.use(apiKeyAuth);

/**
 * 生成新的 API key
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
 * 获取当前 API key 信息
 * GET /api/api-keys/current
 */
router.get('/current', (req, res) => {
  const apiKey = req.apiKey!;
  const keyData = apiKeyManager.getKeyInfo(apiKey);
  
  if (!keyData) {
    return res.status(404).json({ error: 'API key not found' });
  }

  res.json({
    key: apiKey.substring(0, 10) + '...', // 只显示部分
    name: keyData.name,
    userId: keyData.userId,
    createdAt: keyData.createdAt,
    lastUsed: keyData.lastUsed,
    requestsCount: keyData.requestsCount,
  });
});

/**
 * 验证 API key
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
 * 列出所有 API keys（需要管理员权限）
 * GET /api/api-keys
 */
router.get('/', (req, res) => {
  // 这里可以添加管理员检查逻辑
  const keys = apiKeyManager.listKeys();
  
  res.json({
    count: keys.length,
    keys,
  });
});

/**
 * 删除 API key
 * DELETE /api/api-keys/:key
 */
router.delete('/:key', (req, res) => {
  const keyToDelete = req.params.key;
  const currentKey = req.apiKey!;
  
  // 不能删除当前使用的 key
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

