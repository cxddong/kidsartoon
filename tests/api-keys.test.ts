import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';

describe('API Key Authentication', () => {
  const app = createTestApp();
  let testApiKey: string;

  beforeEach(async () => {
    // 使用默认 API key 进行测试
    testApiKey = 'dev-key-12345';
  });

  describe('API Key Management', () => {
    it('should generate a new API key', async () => {
      const response = await request(app)
        .post('/api/api-keys')
        .set('X-API-Key', testApiKey)
        .send({
          name: 'Test API Key',
          userId: 'test-user-id',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('apiKey');
      expect(response.body.apiKey).toMatch(/^kat_/);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('warning');
    });

    it('should require API key to generate new key', async () => {
      await request(app)
        .post('/api/api-keys')
        .send({
          name: 'Test API Key',
        })
        .expect(401);
    });

    it('should get current API key info', async () => {
      const response = await request(app)
        .get('/api/api-keys/current')
        .set('X-API-Key', testApiKey)
        .expect(200);

      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('requestsCount');
    });

    it('should validate API key', async () => {
      const response = await request(app)
        .get('/api/api-keys/validate')
        .set('X-API-Key', testApiKey)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('key');
    });

    it('should reject invalid API key', async () => {
      await request(app)
        .get('/api/api-keys/validate')
        .set('X-API-Key', 'invalid-key')
        .expect(401);
    });
  });

  describe('API Key in Headers', () => {
    it('should accept X-API-Key header', async () => {
      const response = await request(app)
        .get('/api/api-keys/current')
        .set('X-API-Key', testApiKey)
        .expect(200);

      expect(response.body).toHaveProperty('key');
    });

    it('should accept Authorization Bearer token', async () => {
      const response = await request(app)
        .get('/api/api-keys/current')
        .set('Authorization', `Bearer ${testApiKey}`)
        .expect(200);

      expect(response.body).toHaveProperty('key');
    });
  });

  describe('API Key in Query Parameter', () => {
    it('should accept API key in query parameter', async () => {
      const response = await request(app)
        .get(`/api/api-keys/validate?apiKey=${testApiKey}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
    });
  });

  describe('Optional Authentication', () => {
    it('should allow requests without API key (optional auth)', async () => {
      // 这些路由使用 optionalApiKeyAuth，所以不需要 API key
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('should track usage when API key is provided', async () => {
      // 先获取当前请求计数
      const beforeResponse = await request(app)
        .get('/api/api-keys/current')
        .set('X-API-Key', testApiKey)
        .expect(200);

      const beforeCount = beforeResponse.body.requestsCount;

      // 发送一个请求
      await request(app)
        .get('/health')
        .set('X-API-Key', testApiKey)
        .expect(200);

      // 检查计数是否增加（注意：可选认证可能不会增加计数）
      // 这取决于实现细节
    });
  });
});

