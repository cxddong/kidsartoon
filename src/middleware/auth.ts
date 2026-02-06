import { Request, Response, NextFunction } from 'express';

// API Key storage (Use database in production)
const apiKeys = new Map<string, {
  key: string;
  userId?: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  rateLimit?: number;
  requestsCount: number;
}>();

// Load default API key from environment variables
const DEFAULT_API_KEY = process.env.API_KEY || 'dev-key-12345';

// Initialize default API key
if (!apiKeys.has(DEFAULT_API_KEY)) {
  apiKeys.set(DEFAULT_API_KEY, {
    key: DEFAULT_API_KEY,
    name: 'Default API Key',
    createdAt: new Date().toISOString(),
    requestsCount: 0,
  });
}

/**
 * API Key Authentication Middleware
 * Supports getting API key from:
 * 1. Header: X-API-Key
 * 2. Header: Authorization: Bearer <key>
 * 3. Query parameter: apiKey
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // Get API key
  let apiKey: string | undefined;

  // 1. From Header X-API-Key
  if (req.headers['x-api-key']) {
    apiKey = req.headers['x-api-key'] as string;
  }
  // 2. From Authorization Bearer
  else if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    }
  }
  // 3. From Query parameter
  else if (req.query.apiKey) {
    apiKey = req.query.apiKey as string;
  }

  // If no API key provided
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Provide it via X-API-Key header, Authorization Bearer token, or apiKey query parameter.',
    });
  }

  // Validate API key
  const keyData = apiKeys.get(apiKey);
  if (!keyData) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  // Update usage info
  keyData.lastUsed = new Date().toISOString();
  keyData.requestsCount += 1;

  // Attach API key info to request object
  (req as any).apiKey = apiKey;
  (req as any).apiKeyData = keyData;

  next();
}

/**
 * Optional API Key Authentication (Not mandatory)
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
 * API Key Manager
 */
export const apiKeyManager = {
  /**
   * Generate new API key
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
   * Validate API key
   */
  validateKey(key: string): boolean {
    return apiKeys.has(key);
  },

  /**
   * Get API key info
   */
  getKeyInfo(key: string) {
    return apiKeys.get(key);
  },

  /**
   * List all API keys (Admin function)
   */
  listKeys() {
    return Array.from(apiKeys.values()).map(({ key, ...rest }) => ({
      key: key.substring(0, 10) + '...', // Show partial key only
      ...rest,
    }));
  },

  /**
   * Delete API key
   */
  deleteKey(key: string): boolean {
    return apiKeys.delete(key);
  },

  /**
   * Get storage object (for management)
   */
  getStorage() {
    return apiKeys;
  },
};

// Type declarations
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


/**
 * Require Authentication Middleware (Stub/Placeholder)
 * Ensure this validates session/token in production
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // For now, allow all (dev mode) or validate apiKeyAuth which runs before
  // If you need strict user auth, implement firebase admin verifyIdToken here
  next();
}
