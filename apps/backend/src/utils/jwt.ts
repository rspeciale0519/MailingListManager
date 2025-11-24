/**
 * JWT token generation and verification utilities
 * Handles access tokens and refresh tokens for authentication
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT secrets from environment variables
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';
const JWT_VERIFICATION_SECRET = process.env.JWT_VERIFICATION_SECRET || '';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '30d';
const JWT_VERIFICATION_EXPIRY = process.env.JWT_VERIFICATION_EXPIRY || '24h';

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET || !JWT_VERIFICATION_SECRET) {
  throw new Error('JWT secrets must be configured in environment variables');
}

/**
 * Payload structure for JWT tokens
 */
export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh' | 'verification' | 'password_reset';
}

/**
 * Generate an access token for a user
 * @param userId - User ID
 * @param email - User email
 * @returns Signed JWT access token
 */
export function generateAccessToken(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    type: 'access',
  };

  const options: jwt.SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'],
    issuer: 'mlm-api',
    subject: userId,
  };

  const token = jwt.sign(payload, JWT_ACCESS_SECRET, options);

  return token;
}

/**
 * Generate a refresh token for a user
 * @param userId - User ID
 * @param email - User email
 * @returns Signed JWT refresh token
 */
export function generateRefreshToken(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    type: 'refresh',
  };

  const options: jwt.SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'],
    issuer: 'mlm-api',
    subject: userId,
  };

  const token = jwt.sign(payload, JWT_REFRESH_SECRET, options);

  return token;
}

/**
 * Verify and decode an access token
 * @param token - JWT access token to verify
 * @returns Decoded payload if valid, null otherwise
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'mlm-api',
    }) as JWTPayload;

    if (decoded.type !== 'access') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode a refresh token
 * @param token - JWT refresh token to verify
 * @returns Decoded payload if valid, null otherwise
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'mlm-api',
    }) as JWTPayload;

    if (decoded.type !== 'refresh') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a secure random token hash for storing refresh tokens
 * @param token - Token to hash
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate expiration date for refresh token
 * @returns Date object representing when the refresh token expires
 */
export function getRefreshTokenExpiry(): Date {
  // Parse the expiry string (e.g., "30d" -> 30 days)
  const match = JWT_REFRESH_EXPIRY.match(/^(\d+)([dhms])$/);
  if (!match) {
    // Default to 30 days if format is invalid
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  const milliseconds = num * multipliers[unit as keyof typeof multipliers];
  return new Date(Date.now() + milliseconds);
}

/**
 * Generate an email verification token
 * @param userId - User ID
 * @param email - User email
 * @returns Signed JWT verification token (24h expiry)
 */
export function generateVerificationToken(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    type: 'verification',
  };

  const options: jwt.SignOptions = {
    expiresIn: JWT_VERIFICATION_EXPIRY as jwt.SignOptions['expiresIn'],
    issuer: 'mlm-api',
    subject: userId,
  };

  const token = jwt.sign(payload, JWT_VERIFICATION_SECRET, options);

  return token;
}

/**
 * Verify and decode an email verification token
 * @param token - JWT verification token to verify
 * @returns Decoded payload if valid, null otherwise
 */
export function verifyVerificationToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_VERIFICATION_SECRET, {
      issuer: 'mlm-api',
    }) as JWTPayload;

    if (decoded.type !== 'verification') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Generate a password reset token
 * @param userId - User ID
 * @param email - User email
 * @returns Signed JWT password reset token (1h expiry)
 */
export function generatePasswordResetToken(userId: string, email: string): string {
  const payload: JWTPayload = {
    userId,
    email,
    type: 'password_reset',
  };

  const token = jwt.sign(payload, JWT_VERIFICATION_SECRET, {
    expiresIn: '1h',
    issuer: 'mlm-api',
    subject: userId,
  });

  return token;
}

/**
 * Verify and decode a password reset token
 * @param token - JWT password reset token to verify
 * @returns Decoded payload if valid, null otherwise
 */
export function verifyPasswordResetToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_VERIFICATION_SECRET, {
      issuer: 'mlm-api',
    }) as JWTPayload;

    if (decoded.type !== 'password_reset') {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
}
