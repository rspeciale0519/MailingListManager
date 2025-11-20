/**
 * Alternative authentication service using Supabase REST API
 * This bypasses Prisma and direct database connections
 * Useful when Prisma can't reach the database directly
 */

import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
  generateVerificationToken,
} from '../utils/jwt.js';
import { sendVerificationEmail } from './email.service.js';
import { supabase } from '../config/supabase.js';
import { OAuth2Client } from 'google-auth-library';

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
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      email_verified: false,
    })
    .select('id, email, first_name, last_name, email_verified, created_at')
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  // Generate verification token and send email
  try {
    const verificationToken = generateVerificationToken(newUser.id, newUser.email);
    await sendVerificationEmail(newUser.email, verificationToken);
  } catch (emailError) {
    // Log error but don't fail registration
    console.error('Failed to send verification email:', emailError);
  }

  return newUser;
}

/**
 * Authenticate user and generate tokens
 */
export async function loginUser(data: { email: string; password: string }) {
  const { email, password } = data;

  // Find user
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, password_hash, first_name, last_name, email_verified, mfa_enabled')
    .eq('email', email.toLowerCase())
    .limit(1);

  if (error || !users || users.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = users[0];

  if (!user.password_hash) {
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

  const { error: tokenError } = await supabase.from('refresh_tokens').insert({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (tokenError) {
    throw new Error(`Failed to create refresh token: ${tokenError.message}`);
  }

  // Update last login
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', user.id);

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
  const { data: tokens, error } = await supabase
    .from('refresh_tokens')
    .select('*, user:users(*)')
    .eq('token_hash', tokenHash)
    .limit(1);

  if (error || !tokens || tokens.length === 0) {
    throw new Error('Refresh token is invalid or has been revoked');
  }

  const storedToken = tokens[0];

  if (storedToken.revoked) {
    throw new Error('Refresh token has been revoked');
  }

  if (new Date() > new Date(storedToken.expires_at)) {
    throw new Error('Refresh token has expired');
  }

  const user = storedToken.user;

  // Generate new access token
  const accessToken = generateAccessToken(user.id, user.email);

  // Optionally rotate refresh token (generate new one)
  const newRefreshToken = generateRefreshToken(user.id, user.email);
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = getRefreshTokenExpiry();

  // Revoke old token and create new one
  const { error: updateError } = await supabase
    .from('refresh_tokens')
    .update({
      revoked: true,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', storedToken.id);

  if (updateError) {
    throw new Error(`Failed to revoke old token: ${updateError.message}`);
  }

  const { error: createError } = await supabase.from('refresh_tokens').insert({
    user_id: user.id,
    token_hash: newTokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (createError) {
    throw new Error(`Failed to create new token: ${createError.message}`);
  }

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
  const { error } = await supabase
    .from('refresh_tokens')
    .update({
      revoked: true,
      revoked_at: new Date().toISOString(),
    })
    .eq('token_hash', tokenHash)
    .eq('revoked', false);

  if (error) {
    throw new Error(`Failed to logout: ${error.message}`);
  }

  return { success: true };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const { data: users, error } = await supabase
    .from('users')
    .select(
      'id, email, first_name, last_name, avatar_url, email_verified, mfa_enabled, created_at, last_login_at'
    )
    .eq('id', userId)
    .limit(1);

  if (error || !users || users.length === 0) {
    throw new Error('User not found');
  }

  const user = users[0];
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    avatarUrl: user.avatar_url,
    emailVerified: user.email_verified,
    mfaEnabled: user.mfa_enabled,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  };
}

/**
 * Get Google OAuth client instance
 */
function getGoogleOAuthClient(): OAuth2Client {
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new OAuth2Client({
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  });
}

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthorizationUrl(): string {
  const client = getGoogleOAuthClient();

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  return url;
}

/**
 * Handle Google OAuth callback and create/link user account
 */
export async function handleGoogleOAuthCallback(code: string) {
  const client = getGoogleOAuthClient();

  // Exchange authorization code for tokens
  const { tokens } = await client.getToken(code);

  if (!tokens.id_token) {
    throw new Error('Failed to obtain ID token from Google');
  }

  // Verify the ID token and get user info
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Unable to retrieve email from Google ID token');
  }

  const { email, given_name, family_name, picture } = payload;

  // Check if user already exists with this email
  const { data: existingUsers } = await supabase
    .from('users')
    .select('id, oauth_provider, oauth_id, password_hash')
    .eq('email', email)
    .limit(1);

  if (existingUsers && existingUsers.length > 0) {
    const user = existingUsers[0];

    // If user already has OAuth with Google, just return their data
    if (user.oauth_provider === 'google') {
      // Update last login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      return {
        isNewUser: false,
        user: await getUserById(user.id),
        accessToken: generateAccessToken(user.id, email),
        refreshToken: generateRefreshToken(user.id, email),
      };
    }

    // If user exists but doesn't have OAuth, link their account
    if (!user.password_hash) {
      // OAuth-only account, link Google
      const { error: updateError } = await supabase
        .from('users')
        .update({
          oauth_provider: 'google',
          oauth_id: payload.sub,
          last_login_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Failed to link Google account: ${updateError.message}`);
      }

      return {
        isNewUser: false,
        user: await getUserById(user.id),
        accessToken: generateAccessToken(user.id, email),
        refreshToken: generateRefreshToken(user.id, email),
      };
    }

    // User has password - this is a potential security issue
    // We don't auto-link in this case, let the user decide
    throw new Error(
      'An account with this email already exists. Please sign in with your password or use a different email.'
    );
  }

  // Create new user
  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      email,
      first_name: given_name || '',
      last_name: family_name || '',
      avatar_url: picture,
      oauth_provider: 'google',
      oauth_id: payload.sub,
      email_verified: payload.email_verified || true,
      password_hash: null,
    })
    .select('id, email, first_name, last_name, avatar_url, email_verified')
    .single();

  if (createError) {
    throw new Error(`Failed to create user: ${createError.message}`);
  }

  // Generate tokens
  const accessToken = generateAccessToken(newUser.id, newUser.email);
  const refreshToken = generateRefreshToken(newUser.id, newUser.email);

  // Store refresh token
  const tokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry();

  const { error: tokenError } = await supabase.from('refresh_tokens').insert({
    user_id: newUser.id,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  if (tokenError) {
    throw new Error(`Failed to create refresh token: ${tokenError.message}`);
  }

  return {
    isNewUser: true,
    user: {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      avatarUrl: newUser.avatar_url,
      emailVerified: newUser.email_verified,
    },
    accessToken,
    refreshToken,
  };
}
