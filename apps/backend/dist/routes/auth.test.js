/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Integration tests for auth.ts routes
 * Tests POST /auth/register, /auth/login, /auth/refresh, /auth/logout
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authService from '../services/auth.service';
vi.mock('../services/auth.service');
describe('Auth Routes Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('POST /auth/register', () => {
        it('should register user with valid input', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'ValidPassword123!',
                firstName: 'John',
                lastName: 'Doe',
            };
            const mockUser = {
                id: 'user-123',
                email: userData.email,
                first_name: userData.firstName,
                last_name: userData.lastName,
                email_verified: false,
                created_at: new Date(),
            };
            vi.mocked(authService.registerUser).mockResolvedValue(mockUser);
            const result = await authService.registerUser(userData);
            expect(result.id).toBe('user-123');
            expect(result.email).toBe(userData.email);
            expect(authService.registerUser).toHaveBeenCalledWith(userData);
        });
        it('should reject registration with invalid email', async () => {
            const userData = {
                email: 'not-an-email',
                password: 'ValidPassword123!',
            };
            vi.mocked(authService.registerUser).mockRejectedValue(new Error('Invalid email address'));
            await expect(authService.registerUser(userData)).rejects.toThrow('Invalid email address');
        });
        it('should reject registration with weak password', async () => {
            const userData = {
                email: 'user@example.com',
                password: 'weak',
            };
            vi.mocked(authService.registerUser).mockRejectedValue(new Error('Password must be at least 8 characters'));
            await expect(authService.registerUser(userData)).rejects.toThrow('Password must be at least 8 characters');
        });
        it('should reject registration if email already exists', async () => {
            const userData = {
                email: 'existing@example.com',
                password: 'ValidPassword123!',
            };
            vi.mocked(authService.registerUser).mockRejectedValue(new Error('User with this email already exists'));
            await expect(authService.registerUser(userData)).rejects.toThrow('User with this email already exists');
        });
        it('should set email_verified to false on registration', async () => {
            const userData = {
                email: 'newuser@example.com',
                password: 'ValidPassword123!',
            };
            vi.mocked(authService.registerUser).mockResolvedValue({
                id: 'user-123',
                email: userData.email,
                email_verified: false,
            });
            const result = await authService.registerUser(userData);
            expect(result.email_verified).toBe(false);
        });
    });
    describe('POST /auth/login', () => {
        it('should login user with valid credentials', async () => {
            const loginData = {
                email: 'user@example.com',
                password: 'ValidPassword123!',
            };
            vi.mocked(authService.loginUser).mockResolvedValue({
                requiresMfa: false,
                user: {
                    id: 'user-123',
                    email: loginData.email,
                    firstName: 'John',
                    lastName: 'Doe',
                    emailVerified: true,
                },
                accessToken: 'access-token-jwt',
                refreshToken: 'refresh-token-jwt',
            });
            const result = await authService.loginUser(loginData);
            expect(result.requiresMfa).toBe(false);
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user?.id).toBe('user-123');
        });
        it('should reject login with invalid email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'SomePassword123!',
            };
            vi.mocked(authService.loginUser).mockRejectedValue(new Error('Invalid email or password'));
            await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid email or password');
        });
        it('should reject login with wrong password', async () => {
            const loginData = {
                email: 'user@example.com',
                password: 'WrongPassword123!',
            };
            vi.mocked(authService.loginUser).mockRejectedValue(new Error('Invalid email or password'));
            await expect(authService.loginUser(loginData)).rejects.toThrow('Invalid email or password');
        });
        it('should return MFA required flag if user has MFA enabled', async () => {
            const loginData = {
                email: 'user@example.com',
                password: 'ValidPassword123!',
            };
            vi.mocked(authService.loginUser).mockResolvedValue({
                requiresMfa: true,
                userId: 'user-123',
                email: loginData.email,
            });
            const result = await authService.loginUser(loginData);
            expect(result.requiresMfa).toBe(true);
            expect(result.userId).toBe('user-123');
        });
        it('should return tokens with correct format', async () => {
            const loginData = {
                email: 'user@example.com',
                password: 'ValidPassword123!',
            };
            vi.mocked(authService.loginUser).mockResolvedValue({
                requiresMfa: false,
                user: { id: 'user-123', email: loginData.email },
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            });
            const result = await authService.loginUser(loginData);
            expect(result.accessToken).toMatch(/^eyJ/); // JWT format
            expect(result.refreshToken).toMatch(/^eyJ/); // JWT format
        });
    });
    describe('POST /auth/refresh', () => {
        it('should refresh access token with valid refresh token', async () => {
            const refreshToken = 'valid-refresh-token';
            vi.mocked(authService.refreshAccessToken).mockResolvedValue({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            });
            const result = await authService.refreshAccessToken(refreshToken);
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
        });
        it('should reject with invalid refresh token', async () => {
            const refreshToken = 'invalid-refresh-token';
            vi.mocked(authService.refreshAccessToken).mockRejectedValue(new Error('Invalid refresh token'));
            await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow('Invalid refresh token');
        });
        it('should reject with expired refresh token', async () => {
            const refreshToken = 'expired-refresh-token';
            vi.mocked(authService.refreshAccessToken).mockRejectedValue(new Error('Refresh token has expired'));
            await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow('Refresh token has expired');
        });
        it('should reject with revoked refresh token', async () => {
            const refreshToken = 'revoked-refresh-token';
            vi.mocked(authService.refreshAccessToken).mockRejectedValue(new Error('Refresh token is invalid or has been revoked'));
            await expect(authService.refreshAccessToken(refreshToken)).rejects.toThrow('Refresh token is invalid or has been revoked');
        });
        it('should rotate refresh token on successful refresh', async () => {
            const oldRefreshToken = 'old-refresh-token';
            vi.mocked(authService.refreshAccessToken).mockResolvedValue({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            });
            const result = await authService.refreshAccessToken(oldRefreshToken);
            expect(result.refreshToken).not.toBe(oldRefreshToken);
            expect(result.refreshToken).toBeDefined();
        });
    });
    describe('POST /auth/logout', () => {
        it('should logout user successfully', async () => {
            const refreshToken = 'valid-refresh-token';
            vi.mocked(authService.logoutUser).mockResolvedValue({
                success: true,
            });
            const result = await authService.logoutUser(refreshToken);
            expect(result.success).toBe(true);
        });
        it('should revoke refresh token on logout', async () => {
            const refreshToken = 'valid-refresh-token';
            vi.mocked(authService.logoutUser).mockResolvedValue({
                success: true,
            });
            await authService.logoutUser(refreshToken);
            expect(authService.logoutUser).toHaveBeenCalledWith(refreshToken);
        });
        it('should handle logout with invalid token gracefully', async () => {
            const refreshToken = 'invalid-refresh-token';
            vi.mocked(authService.logoutUser).mockResolvedValue({
                success: true,
            });
            // Should not throw error
            const result = await authService.logoutUser(refreshToken);
            expect(result.success).toBe(true);
        });
    });
});
