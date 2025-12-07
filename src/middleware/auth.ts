import { Request, Response, NextFunction } from 'express';

// API Key 存储（生产环境应使用数据库）
const apiKeys = new Map<string, {
  key: string;
  userId?: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  rateLimit?: number;
  requestsCount: number;
}>();

// 从环境变量加载默认 API key
const DEFAULT_API_KEY = process.env.API_KEY || 'dev-key-12345';

// 初始化默认 API key
if (!apiKeys.has(DEFAULT_API_KEY)) {
  apiKeys.set(DEFAULT_API_KEY, {
    key: DEFAULT_API_KEY,
    name: 'Default API Key',
    createdAt: new Date().toISOString(),
    requestsCount: 0,
  });
}

/**
 * API Key 认证中间件
 * 支持从以下位置获取 API key:
 * 1. Header: X-API-Key
 * 2. Header: Authorization: Bearer <key>
 * 3. Query parameter: apiKey
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // 获取 API key
  let apiKey: string | undefined;

  // 1. 从 Header X-API-Key 获取
  if (req.headers['x-api-key']) {
    apiKey = req.headers['x-api-key'] as string;
  }
  // 2. 从 Authorization Bearer 获取
  else if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    }
  }
  // 3. 从 Query 参数获取
  else if (req.query.apiKey) {
    apiKey = req.query.apiKey as string;
  }

  // 如果没有提供 API key
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Provide it via X-API-Key header, Authorization Bearer token, or apiKey query parameter.',
    });
  }

  // 验证 API key
  const keyData = apiKeys.get(apiKey);
  if (!keyData) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  // 更新使用信息
  keyData.lastUsed = new Date().toISOString();
  keyData.requestsCount += 1;

  // 将 API key 信息附加到请求对象
  (req as any).apiKey = apiKey;
  (req as any).apiKeyData = keyData;

  next();
}

/**
 * 可选的 API Key 认证（不强制要求）
 */
export function optionalApiKeyAuth(req: Request, res: Response, next: NextFunction) {
  let apiKey: string | undefined;

  if (req.headers['x-api-key']) {
    apiKey = req.headers['x-api-key'] as string;
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    apiKey = req.headers.authorization.substring(7);
  } else if (req.query.apiKey) {
    apiKey = req.query.apiKey as string;
  }

  if (apiKey) {
    const keyData = apiKeys.get(apiKey);
    if (keyData) {
      keyData.lastUsed = new Date().toISOString();
      keyData.requestsCount += 1;
      (req as any).apiKey = apiKey;
      (req as any).apiKeyData = keyData;
    }
  }

  next();
}

/**
 * API Key 管理函数
 */
export const apiKeyManager = {
  /**
   * 生成新的 API key
   */
  generateKey(name: string, userId?: string): string {
    const key = `kat_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    apiKeys.set(key, {
      key,
      userId,
      name,
      createdAt: new Date().toISOString(),
      requestsCount: 0,
    });
    return key;
  },

  /**
   * 验证 API key
   */
  validateKey(key: string): boolean {
    return apiKeys.has(key);
  },

  /**
   * 获取 API key 信息
   */
  getKeyInfo(key: string) {
    return apiKeys.get(key);
  },

  /**
   * 列出所有 API keys（管理员功能）
   */
  listKeys() {
    return Array.from(apiKeys.values()).map(({ key, ...rest }) => ({
      key: key.substring(0, 10) + '...', // 只显示部分 key
      ...rest,
    }));
  },

  /**
   * 删除 API key
   */
  deleteKey(key: string): boolean {
    return apiKeys.delete(key);
  },

  /**
   * 获取存储对象（用于管理）
   */
  getStorage() {
    return apiKeys;
  },
};

// 类型声明
declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
      apiKeyData?: {
        key: string;
        userId?: string;
        name: string;
        createdAt: string;
        lastUsed?: string;
        requestsCount: number;
      };
    }
  }
}

