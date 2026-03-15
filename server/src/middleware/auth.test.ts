import { describe, it, expect, vi } from 'vitest';
import { generateToken, verifyToken, authMiddleware, AuthPayload, AuthRequest } from './auth';
import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const mockPayload: AuthPayload = {
  userId: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

function createMockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('auth middleware', () => {
  describe('generateToken / verifyToken roundtrip', () => {
    it('should generate and verify a token successfully', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.name).toBe(mockPayload.name);
    });

    it('should include standard JWT claims', () => {
      const token = generateToken(mockPayload);
      const raw = jwt.decode(token) as Record<string, unknown>;

      expect(raw).toHaveProperty('iat');
      expect(raw).toHaveProperty('exp');
    });
  });

  describe('expired token', () => {
    it('should reject an expired token', () => {
      const expiredToken = jwt.sign(mockPayload, JWT_SECRET, { expiresIn: '-1s' });

      expect(() => verifyToken(expiredToken)).toThrow();
    });
  });

  describe('authMiddleware', () => {
    it('should return 401 without Authorization header', () => {
      const req = { headers: {} } as AuthRequest;
      const res = createMockRes();
      const next = vi.fn();

      authMiddleware(req, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: '인증이 필요합니다' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with non-Bearer header', () => {
      const req = { headers: { authorization: 'Basic abc123' } } as AuthRequest;
      const res = createMockRes();
      const next = vi.fn();

      authMiddleware(req, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 with invalid token', () => {
      const req = { headers: { authorization: 'Bearer invalid-token' } } as AuthRequest;
      const res = createMockRes();
      const next = vi.fn();

      authMiddleware(req, res as Response, next as NextFunction);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: '유효하지 않은 토큰입니다' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() and set req.user with valid token', () => {
      const token = generateToken(mockPayload);
      const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
      const res = createMockRes();
      const next = vi.fn();

      authMiddleware(req, res as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user!.userId).toBe(mockPayload.userId);
      expect(req.user!.name).toBe(mockPayload.name);
    });
  });
});
