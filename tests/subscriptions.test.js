import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';
describe('Subscriptions API', () => {
    const app = createTestApp();
    let userId;
    beforeEach(async () => {
        const userResponse = await request(app)
            .post('/api/users')
            .send({ name: 'Test User' });
        userId = userResponse.body.id;
    });
    describe('GET /api/subscriptions/plans', () => {
        it('should return subscription plans', async () => {
            const response = await request(app)
                .get('/api/subscriptions/plans')
                .expect(200);
            expect(response.body).toHaveProperty('free');
            expect(response.body).toHaveProperty('gold');
            expect(response.body.free).toHaveProperty('perks');
            expect(response.body.free).toHaveProperty('watermark');
            expect(response.body.free.watermark).toBe(true);
            expect(response.body.gold.watermark).toBe(false);
        });
    });
    describe('GET /api/subscriptions/:userId/usage', () => {
        it('should return daily usage', async () => {
            const response = await request(app)
                .get(`/api/subscriptions/${userId}/usage`)
                .expect(200);
            expect(response.body).toHaveProperty('pictureBooks');
            expect(response.body).toHaveProperty('animations');
            expect(response.body).toHaveProperty('audioStories');
            expect(response.body.pictureBooks).toBe(0);
            expect(response.body.animations).toBe(0);
            expect(response.body.audioStories).toBe(0);
        });
    });
    describe('POST /api/subscriptions/:userId/check-quota', () => {
        it('should check if user can consume quota', async () => {
            const response = await request(app)
                .post(`/api/subscriptions/${userId}/check-quota`)
                .send({
                type: 'audioStories',
                membership: 'free',
            })
                .expect(200);
            expect(response.body).toHaveProperty('canConsume');
            expect(response.body).toHaveProperty('current');
            expect(response.body).toHaveProperty('limit');
            expect(response.body).toHaveProperty('remaining');
            expect(response.body.canConsume).toBe(true);
            expect(response.body.current).toBe(0);
        });
    });
    describe('POST /api/subscriptions/:userId/consume', () => {
        it('should consume quota for free member', async () => {
            const response = await request(app)
                .post(`/api/subscriptions/${userId}/consume`)
                .send({
                type: 'audioStories',
                membership: 'free',
            })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.usage.audioStories).toBe(1);
        });
        it('should reject when quota exceeded for free member', async () => {
            // Consume the free quota (1 audio story)
            await request(app)
                .post(`/api/subscriptions/${userId}/consume`)
                .send({
                type: 'audioStories',
                membership: 'free',
            });
            // Try to consume again
            const response = await request(app)
                .post(`/api/subscriptions/${userId}/consume`)
                .send({
                type: 'audioStories',
                membership: 'free',
            })
                .expect(403);
            expect(response.body.error).toBe('Daily quota exceeded');
        });
        it('should allow unlimited audio stories for gold member', async () => {
            // Upgrade to gold
            await request(app)
                .post(`/api/users/${userId}/membership`)
                .send({ level: 'gold' });
            // Consume multiple times
            await request(app)
                .post(`/api/subscriptions/${userId}/consume`)
                .send({
                type: 'audioStories',
                membership: 'gold',
            })
                .expect(200);
            await request(app)
                .post(`/api/subscriptions/${userId}/consume`)
                .send({
                type: 'audioStories',
                membership: 'gold',
            })
                .expect(200);
            // Should still work
            const response = await request(app)
                .post(`/api/subscriptions/${userId}/consume`)
                .send({
                type: 'audioStories',
                membership: 'gold',
            })
                .expect(200);
            expect(response.body.success).toBe(true);
        });
    });
});
