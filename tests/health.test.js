import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';
describe('Health Check', () => {
    const app = createTestApp();
    it('should return ok status', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);
        expect(response.body).toEqual({ status: 'ok' });
    });
});
