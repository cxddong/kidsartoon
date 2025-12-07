import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';
describe('Media API', () => {
    const app = createTestApp();
    describe('POST /api/media/image-to-voice', () => {
        it('should generate audio story from image and voice text', async () => {
            const response = await request(app)
                .post('/api/media/image-to-voice')
                .field('voiceText', 'magical adventure')
                .field('userId', 'test-user-id')
                .expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('keywords');
            expect(response.body).toHaveProperty('story');
            expect(response.body).toHaveProperty('audioUrl');
            expect(response.body.userId).toBe('test-user-id');
            expect(Array.isArray(response.body.keywords)).toBe(true);
        });
        it('should work without image', async () => {
            const response = await request(app)
                .post('/api/media/image-to-voice')
                .field('voiceText', 'test story')
                .expect(200);
            expect(response.body).toHaveProperty('story');
            expect(response.body).toHaveProperty('audioUrl');
        });
    });
    describe('POST /api/media/image-to-image', () => {
        it('should generate cartoon image', async () => {
            const response = await request(app)
                .post('/api/media/image-to-image')
                .field('prompt', 'cute cartoon character')
                .field('userId', 'test-user-id')
                .expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('cartoonImageUrl');
            expect(response.body.prompt).toBe('cute cartoon character');
            expect(response.body.userId).toBe('test-user-id');
        });
    });
    describe('POST /api/media/image-to-video', () => {
        it('should generate animation video', async () => {
            const response = await request(app)
                .post('/api/media/image-to-video')
                .field('prompt', 'animated story')
                .field('userId', 'test-user-id')
                .expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('videoUrl');
            expect(response.body).toHaveProperty('durationSec');
            expect(response.body.durationSec).toBeLessThanOrEqual(60);
            expect(response.body.userId).toBe('test-user-id');
        });
    });
    describe('POST /api/media/generate-picture-book', () => {
        it('should generate picture book with default 4 pages', async () => {
            const response = await request(app)
                .post('/api/media/generate-picture-book')
                .field('prompt', 'adventure story')
                .field('userId', 'test-user-id')
                .field('cartoonImageUrl', 'https://example.com/image.png')
                .expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('title');
            expect(response.body).toHaveProperty('pages');
            expect(response.body.pageCount).toBe(4);
            expect(response.body.pages).toHaveLength(4);
            expect(response.body.pages[0]).toHaveProperty('pageNumber');
            expect(response.body.pages[0]).toHaveProperty('imageUrl');
            expect(response.body.pages[0]).toHaveProperty('text');
        });
        it('should generate picture book with 6 pages when specified', async () => {
            const response = await request(app)
                .post('/api/media/generate-picture-book')
                .field('pageCount', '6')
                .field('userId', 'test-user-id')
                .expect(200);
            expect(response.body.pageCount).toBe(6);
            expect(response.body.pages).toHaveLength(6);
        });
        it('should limit page count to 6 maximum', async () => {
            const response = await request(app)
                .post('/api/media/generate-picture-book')
                .field('pageCount', '10')
                .field('userId', 'test-user-id')
                .expect(200);
            expect(response.body.pageCount).toBeLessThanOrEqual(6);
        });
    });
    describe('POST /api/media/cocreate', () => {
        it('should co-create content from multiple works', async () => {
            const response = await request(app)
                .post('/api/media/cocreate')
                .send({
                workIds: ['work1', 'work2'],
                type: 'picture-book',
                userId: 'test-user-id',
                prompt: 'combined story',
            })
                .expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body.type).toBe('picture-book');
            expect(response.body.workIds).toEqual(['work1', 'work2']);
            expect(response.body.pages).toHaveLength(4);
        });
        it('should return 400 if less than 2 work IDs provided', async () => {
            await request(app)
                .post('/api/media/cocreate')
                .send({
                workIds: ['work1'],
                type: 'animation',
                userId: 'test-user-id',
            })
                .expect(400);
        });
    });
});
