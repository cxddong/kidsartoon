import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';
describe('Community API', () => {
    const app = createTestApp();
    let workId;
    let authorId;
    beforeEach(async () => {
        // Create a user for testing
        const userResponse = await request(app)
            .post('/api/users')
            .send({ name: 'Test Author' });
        authorId = userResponse.body.id;
    });
    describe('POST /api/community/works', () => {
        it('should publish a work to community', async () => {
            const response = await request(app)
                .post('/api/community/works')
                .send({
                authorId,
                authorName: 'Test Author',
                type: 'picture',
                title: 'My Artwork',
                description: 'A beautiful drawing',
                mediaUrl: 'https://example.com/image.png',
                canCoCreate: true,
            })
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.authorId).toBe(authorId);
            expect(response.body.type).toBe('picture');
            expect(response.body.title).toBe('My Artwork');
            expect(response.body.likeCount).toBe(0);
            expect(response.body.canCoCreate).toBe(true);
            workId = response.body.id;
        });
        it('should create work with default values', async () => {
            const response = await request(app)
                .post('/api/community/works')
                .send({
                authorId,
                type: 'audio',
                mediaUrl: 'https://example.com/audio.mp3',
            })
                .expect(201);
            expect(response.body.title).toBe('Untitled');
            expect(response.body.authorName).toBe('Anonymous Artist');
            expect(response.body.canCoCreate).toBe(true);
        });
    });
    describe('GET /api/community/works', () => {
        it('should list all works', async () => {
            // Create a work first
            await request(app)
                .post('/api/community/works')
                .send({
                authorId,
                type: 'picture',
                mediaUrl: 'https://example.com/image.png',
            });
            const response = await request(app)
                .get('/api/community/works')
                .expect(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        it('should filter works by type', async () => {
            // Create works of different types
            await request(app)
                .post('/api/community/works')
                .send({
                authorId,
                type: 'audio',
                mediaUrl: 'https://example.com/audio.mp3',
            });
            await request(app)
                .post('/api/community/works')
                .send({
                authorId,
                type: 'picture',
                mediaUrl: 'https://example.com/image.png',
            });
            const response = await request(app)
                .get('/api/community/works?type=audio')
                .expect(200);
            expect(response.body.every((work) => work.type === 'audio')).toBe(true);
        });
    });
    describe('POST /api/community/works/:id/like', () => {
        it('should like a work', async () => {
            // Create a work
            const workResponse = await request(app)
                .post('/api/community/works')
                .send({
                authorId,
                type: 'picture',
                mediaUrl: 'https://example.com/image.png',
            });
            const workId = workResponse.body.id;
            // Create another user to like the work
            const likerResponse = await request(app)
                .post('/api/users')
                .send({ name: 'Liker' });
            const likerId = likerResponse.body.id;
            const response = await request(app)
                .post(`/api/community/works/${workId}/like`)
                .send({ userId: likerId })
                .expect(200);
            expect(response.body.likeCount).toBe(1);
            expect(response.body.authorReward).toBe(1);
        });
        it('should not allow duplicate likes', async () => {
            const workResponse = await request(app)
                .post('/api/community/works')
                .send({
                authorId,
                type: 'picture',
                mediaUrl: 'https://example.com/image.png',
            });
            const workId = workResponse.body.id;
            const likerResponse = await request(app)
                .post('/api/users')
                .send({ name: 'Liker' });
            const likerId = likerResponse.body.id;
            // Like once
            await request(app)
                .post(`/api/community/works/${workId}/like`)
                .send({ userId: likerId });
            // Try to like again
            const response = await request(app)
                .post(`/api/community/works/${workId}/like`)
                .send({ userId: likerId })
                .expect(200);
            expect(response.body.alreadyLiked).toBe(true);
        });
    });
    describe('POST /api/community/works/:id/share', () => {
        it('should share a work', async () => {
            const workResponse = await request(app)
                .post('/api/community/works')
                .send({
                authorId,
                type: 'picture',
                mediaUrl: 'https://example.com/image.png',
            });
            const workId = workResponse.body.id;
            const response = await request(app)
                .post(`/api/community/works/${workId}/share`)
                .expect(200);
            expect(response.body.shareCount).toBe(1);
            expect(response.body).toHaveProperty('shareUrl');
        });
    });
});
