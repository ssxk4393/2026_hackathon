import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// Mock the socket module before importing the app
vi.mock('../socket', () => ({
  getIO: vi.fn().mockReturnValue({
    to: vi.fn().mockReturnValue({ emit: vi.fn() }),
  }),
}));

import { createTestApp } from '../test-app';

const app = createTestApp();

/** Helper: create a guest user and return token + user info */
async function createGuestUser(name: string): Promise<{ token: string; userId: string }> {
  const res = await request(app)
    .post('/auth/guest')
    .send({ name });

  return { token: res.body.token, userId: res.body.user.id };
}

/** Helper: create a session and return its id */
async function createSession(token: string, name: string): Promise<string> {
  const res = await request(app)
    .post('/sessions')
    .set('Authorization', `Bearer ${token}`)
    .send({ name });

  return res.body.id;
}

describe('Session API', () => {
  let creatorToken: string;
  let creatorUserId: string;

  beforeEach(async () => {
    const creator = await createGuestUser('Creator');
    creatorToken = creator.token;
    creatorUserId = creator.userId;
  });

  describe('POST /sessions (create)', () => {
    it('should create a session', async () => {
      const res = await request(app)
        .post('/sessions')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Test Session' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Test Session');
      expect(res.body.createdBy).toBe(creatorUserId);
      expect(res.body.members).toHaveLength(1);
      expect(res.body.members[0].role).toBe('operator');
    });

    it('should return 400 without name', async () => {
      await request(app)
        .post('/sessions')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({})
        .expect(400);
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/sessions')
        .send({ name: 'No Auth' })
        .expect(401);
    });
  });

  describe('GET /sessions (list)', () => {
    it('should return active sessions', async () => {
      await createSession(creatorToken, 'Session 1');
      await createSession(creatorToken, 'Session 2');

      const res = await request(app)
        .get('/sessions')
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /sessions/:id/join', () => {
    it('should join a session with role', async () => {
      const sessionId = await createSession(creatorToken, 'Join Test');

      const joiner = await createGuestUser('Joiner');

      const res = await request(app)
        .post(`/sessions/${sessionId}/join`)
        .set('Authorization', `Bearer ${joiner.token}`)
        .expect(201);

      expect(res.body).toHaveProperty('role');
      expect(res.body.userId).toBe(joiner.userId);
    });

    it('should return existing membership if already joined', async () => {
      const sessionId = await createSession(creatorToken, 'Dup Join');

      // Creator is already a member
      const res = await request(app)
        .post(`/sessions/${sessionId}/join`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(res.body.message).toBe('이미 참가 중입니다');
    });

    it('should assign standby when max operators reached', async () => {
      // Create session with maxOperators = 1 (creator takes the one operator slot)
      const res = await request(app)
        .post('/sessions')
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ name: 'Max Op Test', maxOperators: 1 })
        .expect(201);

      const sessionId = res.body.id;
      const joiner = await createGuestUser('StandbyUser');

      const joinRes = await request(app)
        .post(`/sessions/${sessionId}/join`)
        .set('Authorization', `Bearer ${joiner.token}`)
        .expect(201);

      expect(joinRes.body.role).toBe('standby');
    });
  });

  describe('POST /sessions/:id/end', () => {
    it('should end a session by creator', async () => {
      const sessionId = await createSession(creatorToken, 'End Test');

      const res = await request(app)
        .post(`/sessions/${sessionId}/end`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(res.body.status).toBe('ended');
      expect(res.body.endedAt).toBeTruthy();
    });

    it('should return 403 when non-creator tries to end', async () => {
      const sessionId = await createSession(creatorToken, 'Forbidden End');
      const other = await createGuestUser('Other');

      await request(app)
        .post(`/sessions/${sessionId}/end`)
        .set('Authorization', `Bearer ${other.token}`)
        .expect(403);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .post('/sessions/non-existent-id/end')
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(404);
    });
  });

  describe('POST /sessions/:id/captions (save caption log)', () => {
    it('should save a caption log', async () => {
      const sessionId = await createSession(creatorToken, 'Caption Test');

      const res = await request(app)
        .post(`/sessions/${sessionId}/captions`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ text: 'Hello world caption' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.text).toBe('Hello world caption');
      expect(res.body.sessionId).toBe(sessionId);
    });

    it('should reject empty text', async () => {
      const sessionId = await createSession(creatorToken, 'Empty Caption');

      await request(app)
        .post(`/sessions/${sessionId}/captions`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ text: '' })
        .expect(400);
    });
  });

  describe('GET /sessions/:id/captions (caption history)', () => {
    it('should return caption history', async () => {
      const sessionId = await createSession(creatorToken, 'History Test');

      // Save some captions
      await request(app)
        .post(`/sessions/${sessionId}/captions`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ text: 'First caption' });

      await request(app)
        .post(`/sessions/${sessionId}/captions`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ text: 'Second caption' });

      const res = await request(app)
        .get(`/sessions/${sessionId}/captions`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].text).toBe('First caption');
      expect(res.body[1].text).toBe('Second caption');
    });
  });

  describe('GET /sessions/:id/export', () => {
    it('should export as JSON by default', async () => {
      const sessionId = await createSession(creatorToken, 'Export JSON');

      await request(app)
        .post(`/sessions/${sessionId}/captions`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ text: 'Export test' });

      const res = await request(app)
        .get(`/sessions/${sessionId}/export`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('session');
      expect(res.body).toHaveProperty('captions');
      expect(res.body).toHaveProperty('exportedAt');
      expect(res.body.session.name).toBe('Export JSON');
      expect(res.body.captions).toHaveLength(1);
    });

    it('should export as TXT', async () => {
      const sessionId = await createSession(creatorToken, 'Export TXT');

      await request(app)
        .post(`/sessions/${sessionId}/captions`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ text: 'TXT caption' });

      const res = await request(app)
        .get(`/sessions/${sessionId}/export?format=txt`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/plain');
      expect(res.text).toContain('Export TXT');
      expect(res.text).toContain('TXT caption');
      expect(res.text).toContain('--- 자막 로그 ---');
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/sessions/non-existent-id/export')
        .set('Authorization', `Bearer ${creatorToken}`)
        .expect(404);
    });
  });
});
