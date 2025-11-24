/**
 * Authentication service
 * Handles user registration, login, and token management
 */

import { prisma } from '../utils/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../utils/jwt.js';

/**
 * Register a new user
 */
export async function registerUser(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}) {
  const { email, password, firstName, lastName } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      email_verified: false,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      email_verified: true,
      created_at: true,
    },
  });

  return user;
}

/**
 * Authenticate user and generate tokens
 */
export async function loginUser(data: { email: string; password: string }) {
  const { email, password } = data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      password_hash: true,
      first_name: true,
      last_name: true,
      email_verified: true,
      mfa_enabled: true,
    },
  });

  if (!user || !user.password_hash) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

  // Check if MFA is enabled
  if (user.mfa_enabled) {
    // Return user info without tokens, client needs to provide MFA code
    return {
      requiresMfa: true,
      userId: user.id,
      email: user.email,
    };
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, user.email);

  // Store refresh token in database
  const tokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token: tokenHash,
      expires_at: expiresAt,
    },
  });

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { last_login_at: new Date() },
  });

  return {
    requiresMfa: false,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      emailVerified: user.email_verified,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new Error('Invalid refresh token');
  }

  // Check if token exists in database and is not revoked
  const tokenHash = hashToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: tokenHash },
    include: { user: true },
  });

  if (!storedToken || storedToken.revoked) {
    throw new Error('Refresh token is invalid or has been revoked');
  }

  if (new Date() > storedToken.expires_at) {
    throw new Error('Refresh token has expired');
  }

  // Generate new access token
  const accessToken = generateAccessToken(storedToken.user.id, storedToken.user.email);

  // Optionally rotate refresh token (generate new one)
  const newRefreshToken = generateRefreshToken(storedToken.user.id, storedToken.user.email);
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = getRefreshTokenExpiry();

  // Revoke old token and create new one
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true, revoked_at: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        user_id: storedToken.user.id,
        token: newTokenHash,
        expires_at: expiresAt,
      },
    }),
  ]);

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Logout user by revoking refresh token
 */
export async function logoutUser(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);

  // Revoke the token
  await prisma.refreshToken.updateMany({
    where: { token: tokenHash, revoked: false },
    data: { revoked: true, revoked_at: new Date() },
  });

  return { success: true };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      avatar_url: true,
      email_verified: true,
      mfa_enabled: true,
      created_at: true,
      last_login_at: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
