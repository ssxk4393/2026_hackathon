import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test-app';
import { generateToken } from '../middleware/auth';

const app = createTestApp();

describe('Auth API', () => {
  describe('POST /auth/guest', () => {
    it('should create a guest user and return token', async () => {
      const res = await request(app)
        .post('/auth/guest')
        .send({ name: 'TestUser' })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.name).toBe('TestUser');
      expect(res.body.user.provider).toBe('guest');
      expect(typeof res.body.token).toBe('string');
    });

    it('should reject name shorter than 2 characters', async () => {
      const res = await request(app)
        .post('/auth/guest')
        .send({ name: 'A' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should reject empty name', async () => {
      const res = await request(app)
        .post('/auth/guest')
        .send({ name: '' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/auth/guest')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info with valid token', async () => {
      // First create a guest user to get a real user in DB
      const guestRes = await request(app)
        .post('/auth/guest')
        .send({ name: 'AuthMe' })
        .expect(200);

      const token = guestRes.body.token;

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('AuthMe');
      expect(res.body.provider).toBe('guest');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-string')
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent user with valid JWT', async () => {
      const token = generateToken({
        userId: 'non-existent-user-id',
        email: null,
        name: 'Ghost',
      });

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(res.body.error).toBe('사용자를 찾을 수 없습니다');
    });
  });
});
