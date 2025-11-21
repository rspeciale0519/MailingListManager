/**
 * Zod validation schemas for authentication endpoints
 */

import { z } from 'zod';

/**
 * Registration schema
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

/**
 * Logout schema
 */
export const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type LogoutInput = z.infer<typeof logoutSchema>;

/**
 * Google OAuth callback schema
 */
export const googleOAuthCallbackSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
});

export type GoogleOAuthCallbackInput = z.infer<typeof googleOAuthCallbackSchema>;

/**
 * Enable MFA schema
 */
export const enableMFASchema = z.object({
  code: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits'),
  secret: z.string().min(1, 'Secret is required'),
});

export type EnableMFAInput = z.infer<typeof enableMFASchema>;

/**
 * Verify MFA code schema
 */
export const verifyMFACodeSchema = z.object({
  code: z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits'),
});

export type VerifyMFACodeInput = z.infer<typeof verifyMFACodeSchema>;
