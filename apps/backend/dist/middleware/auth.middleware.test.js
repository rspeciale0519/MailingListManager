/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for auth.middleware.ts
 * Tests authentication and authorization middleware
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authMiddleware, optionalAuthMiddleware, requireRole } from './auth.middleware';
import * as jwt from '../utils/jwt';
import * as authSupabase from '../services/auth.supabase';
vi.mock('../utils/jwt');
vi.mock('../services/auth.supabase');
describe('Auth Middleware', () => {
    let mockRequest;
    let mockReply;
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
            mockRequest.headers.authorization = `Bearer ${validToken}`;
            vi.mocked(jwt.verifyAccessToken).mockReturnValue(payload);
            await authMiddleware(mockRequest, mockReply);
            expect(mockRequest.user).toEqual({
                userId: 'user-123',
                email: 'test@example.com',
            });
        });
        it('should reject request if no authorization header', async () => {
            await authMiddleware(mockRequest, mockReply);
            expect(mockReply.code).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                error: 'Missing authorization header',
            }));
        });
        it('should reject request if authorization header format is invalid', async () => {
            mockRequest.headers.authorization = 'InvalidFormat token';
            await authMiddleware(mockRequest, mockReply);
            expect(mockReply.code).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                error: expect.stringContaining('Invalid authorization header format'),
            }));
        });
        it('should reject request if token is invalid', async () => {
            mockRequest.headers.authorization = 'Bearer invalid.token';
            vi.mocked(jwt.verifyAccessToken).mockReturnValue(null);
            await authMiddleware(mockRequest, mockReply);
            expect(mockReply.code).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid or expired access token',
            }));
        });
        it('should handle errors gracefully', async () => {
            mockRequest.headers.authorization = 'Bearer token';
            vi.mocked(jwt.verifyAccessToken).mockImplementation(() => {
                throw new Error('Token verification failed');
            });
            await authMiddleware(mockRequest, mockReply);
            expect(mockReply.code).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Authentication failed',
            }));
        });
    });
    describe('optionalAuthMiddleware', () => {
        it('should attach user if valid token is provided', async () => {
            const validToken = 'valid.jwt.token';
            const payload = { userId: 'user-123', email: 'test@example.com' };
            mockRequest.headers.authorization = `Bearer ${validToken}`;
            vi.mocked(jwt.verifyAccessToken).mockReturnValue(payload);
            await optionalAuthMiddleware(mockRequest);
            expect(mockRequest.user).toEqual({
                userId: 'user-123',
                email: 'test@example.com',
            });
        });
        it('should continue if no authorization header', async () => {
            await optionalAuthMiddleware(mockRequest);
            expect(mockRequest.user).toBeUndefined();
        });
        it('should continue if authorization header format is invalid', async () => {
            mockRequest.headers.authorization = 'InvalidFormat token';
            await optionalAuthMiddleware(mockRequest);
            expect(mockRequest.user).toBeUndefined();
        });
        it('should continue if token is invalid', async () => {
            mockRequest.headers.authorization = 'Bearer invalid.token';
            vi.mocked(jwt.verifyAccessToken).mockReturnValue(null);
            await optionalAuthMiddleware(mockRequest);
            expect(mockRequest.user).toBeUndefined();
        });
        it('should silently handle errors', async () => {
            mockRequest.headers.authorization = 'Bearer token';
            vi.mocked(jwt.verifyAccessToken).mockImplementation(() => {
                throw new Error('Token verification failed');
            });
            // Should not throw
            await expect(optionalAuthMiddleware(mockRequest)).resolves.toBeUndefined();
        });
    });
    describe('requireRole', () => {
        it('should allow request if user has required role', async () => {
            const allowedRoles = ['admin'];
            const middleware = requireRole(allowedRoles);
            mockRequest.user = { userId: 'user-123', email: 'test@example.com' };
            vi.mocked(authSupabase.getUserById).mockResolvedValue({
                id: 'user-123',
                role: 'admin',
            });
            await middleware(mockRequest, mockReply);
            // Should not call send for error
            expect(mockReply.send).not.toHaveBeenCalled();
        });
        it('should reject if user is not authenticated', async () => {
            const allowedRoles = ['admin'];
            const middleware = requireRole(allowedRoles);
            mockRequest.user = undefined;
            await middleware(mockRequest, mockReply);
            expect(mockReply.code).toHaveBeenCalledWith(401);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Authentication required',
            }));
        });
        it('should reject if user does not have required role', async () => {
            const allowedRoles = ['admin'];
            const middleware = requireRole(allowedRoles);
            mockRequest.user = { userId: 'user-123', email: 'test@example.com' };
            vi.mocked(authSupabase.getUserById).mockResolvedValue({
                id: 'user-123',
                role: 'user',
            });
            await middleware(mockRequest, mockReply);
            expect(mockReply.code).toHaveBeenCalledWith(403);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Insufficient permissions',
            }));
        });
        it('should handle errors gracefully', async () => {
            const allowedRoles = ['admin'];
            const middleware = requireRole(allowedRoles);
            mockRequest.user = { userId: 'user-123', email: 'test@example.com' };
            vi.mocked(authSupabase.getUserById).mockRejectedValue(new Error('Database error'));
            await middleware(mockRequest, mockReply);
            expect(mockReply.code).toHaveBeenCalledWith(403);
            expect(mockReply.send).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Authorization failed',
            }));
        });
        it('should default to user role if not specified', async () => {
            const allowedRoles = ['user'];
            const middleware = requireRole(allowedRoles);
            mockRequest.user = { userId: 'user-123', email: 'test@example.com' };
            vi.mocked(authSupabase.getUserById).mockResolvedValue({
                id: 'user-123',
            });
            await middleware(mockRequest, mockReply);
            // Should not call send for error (default role 'user' is allowed)
            expect(mockReply.send).not.toHaveBeenCalled();
        });
    });
});
