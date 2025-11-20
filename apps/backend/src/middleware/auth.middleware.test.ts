/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for auth.middleware.ts
 * Tests authentication and authorization middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, optionalAuthMiddleware, requireRole } from './auth.middleware';
import * as jwt from '../utils/jwt';
import * as authSupabase from '../services/auth.supabase';

vi.mock('../utils/jwt');
vi.mock('../services/auth.supabase');

describe('Auth Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      headers: {},
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
  });

  describe('authMiddleware', () => {
    it('should attach user to request if token is valid', async () => {
      const validToken = 'valid.jwt.token';
      const payload = { userId: 'user-123', email: 'test@example.com' };

      (mockRequest as any).headers.authorization = `Bearer ${validToken}`;
      vi.mocked(jwt.verifyAccessToken).mockReturnValue(payload as any);

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect((mockRequest as any).user).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should reject request if no authorization header', async () => {
      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Missing authorization header',
        })
      );
    });

    it('should reject request if authorization header format is invalid', async () => {
      (mockRequest as any).headers.authorization = 'InvalidFormat token';

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid authorization header format'),
        })
      );
    });

    it('should reject request if token is invalid', async () => {
      (mockRequest as any).headers.authorization = 'Bearer invalid.token';
      vi.mocked(jwt.verifyAccessToken).mockReturnValue(null);

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid or expired access token',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      (mockRequest as any).headers.authorization = 'Bearer token';
      vi.mocked(jwt.verifyAccessToken).mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      await authMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication failed',
        })
      );
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should attach user if valid token is provided', async () => {
      const validToken = 'valid.jwt.token';
      const payload = { userId: 'user-123', email: 'test@example.com' };

      (mockRequest as any).headers.authorization = `Bearer ${validToken}`;
      vi.mocked(jwt.verifyAccessToken).mockReturnValue(payload as any);

      await optionalAuthMiddleware(mockRequest as FastifyRequest);

      expect((mockRequest as any).user).toEqual({
        userId: 'user-123',
        email: 'test@example.com',
      });
    });

    it('should continue if no authorization header', async () => {
      await optionalAuthMiddleware(mockRequest as FastifyRequest);

      expect((mockRequest as any).user).toBeUndefined();
    });

    it('should continue if authorization header format is invalid', async () => {
      (mockRequest as any).headers.authorization = 'InvalidFormat token';

      await optionalAuthMiddleware(mockRequest as FastifyRequest);

      expect((mockRequest as any).user).toBeUndefined();
    });

    it('should continue if token is invalid', async () => {
      (mockRequest as any).headers.authorization = 'Bearer invalid.token';
      vi.mocked(jwt.verifyAccessToken).mockReturnValue(null);

      await optionalAuthMiddleware(mockRequest as FastifyRequest);

      expect((mockRequest as any).user).toBeUndefined();
    });

    it('should silently handle errors', async () => {
      (mockRequest as any).headers.authorization = 'Bearer token';
      vi.mocked(jwt.verifyAccessToken).mockImplementation(() => {
        throw new Error('Token verification failed');
      });

      // Should not throw
      await expect(optionalAuthMiddleware(mockRequest as FastifyRequest)).resolves.toBeUndefined();
    });
  });

  describe('requireRole', () => {
    it('should allow request if user has required role', async () => {
      const allowedRoles = ['admin'];
      const middleware = requireRole(allowedRoles);

      (mockRequest as any).user = { userId: 'user-123', email: 'test@example.com' };
      vi.mocked(authSupabase.getUserById).mockResolvedValue({
        id: 'user-123',
        role: 'admin',
      } as any);

      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Should not call send for error
      expect(mockReply.send).not.toHaveBeenCalled();
    });

    it('should reject if user is not authenticated', async () => {
      const allowedRoles = ['admin'];
      const middleware = requireRole(allowedRoles);

      (mockRequest as any).user = undefined;

      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(401);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authentication required',
        })
      );
    });

    it('should reject if user does not have required role', async () => {
      const allowedRoles = ['admin'];
      const middleware = requireRole(allowedRoles);

      (mockRequest as any).user = { userId: 'user-123', email: 'test@example.com' };
      vi.mocked(authSupabase.getUserById).mockResolvedValue({
        id: 'user-123',
        role: 'user',
      } as any);

      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Insufficient permissions',
        })
      );
    });

    it('should handle errors gracefully', async () => {
      const allowedRoles = ['admin'];
      const middleware = requireRole(allowedRoles);

      (mockRequest as any).user = { userId: 'user-123', email: 'test@example.com' };
      vi.mocked(authSupabase.getUserById).mockRejectedValue(new Error('Database error'));

      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Authorization failed',
        })
      );
    });

    it('should default to user role if not specified', async () => {
      const allowedRoles = ['user'];
      const middleware = requireRole(allowedRoles);

      (mockRequest as any).user = { userId: 'user-123', email: 'test@example.com' };
      vi.mocked(authSupabase.getUserById).mockResolvedValue({
        id: 'user-123',
      } as any);

      await middleware(mockRequest as FastifyRequest, mockReply as FastifyReply);

      // Should not call send for error (default role 'user' is allowed)
      expect(mockReply.send).not.toHaveBeenCalled();
    });
  });
});
