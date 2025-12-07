import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './setup.js';

describe('User API', () => {
  const app = createTestApp();
  let userId: string;

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'Test Kid',
          language: 'zh',
          age: 8,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Kid');
      expect(response.body.language).toBe('zh');
      expect(response.body.age).toBe(8);
      expect(response.body.membership).toBe('free');
      expect(response.body.points).toBe(100);
      expect(response.body.creations).toEqual([]);

      userId = response.body.id;
    });

    it('should create user with default values', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({})
        .expect(201);

      expect(response.body.name).toBe('Kid Artist');
      expect(response.body.language).toBe('en');
      expect(response.body.membership).toBe('free');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      // First create a user
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'Test User' });

      const id = createResponse.body.id;

      const response = await request(app)
        .get(`/api/users/${id}`)
        .expect(200);

      expect(response.body.id).toBe(id);
      expect(response.body.name).toBe('Test User');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should update user profile', async () => {
      // Create a user first
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'Original Name' });

      const id = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/users/${id}`)
        .send({
          name: 'Updated Name',
          age: 10,
          language: 'en',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
      expect(response.body.age).toBe(10);
      expect(response.body.language).toBe('en');
    });
  });

  describe('POST /api/users/:id/points/add', () => {
    it('should add points to user', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'Test User' });

      const id = createResponse.body.id;
      const initialPoints = createResponse.body.points;

      const response = await request(app)
        .post(`/api/users/${id}/points/add`)
        .send({ amount: 50 })
        .expect(200);

      expect(response.body.points).toBe(initialPoints + 50);
    });
  });

  describe('POST /api/users/:id/membership', () => {
    it('should update membership to gold', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({ name: 'Test User' });

      const id = createResponse.body.id;

      const response = await request(app)
        .post(`/api/users/${id}/membership`)
        .send({ level: 'gold' })
        .expect(200);

      expect(response.body.membership).toBe('gold');
    });
  });
});

