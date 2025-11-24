/**
 * OAuth authentication service
 * Handles Google OAuth 2.0 flow and user account creation/linking
 */
import { OAuth2Client } from 'google-auth-library';
import { supabase } from '../config/supabase.js';
import { generateAccessToken, generateRefreshToken, hashToken, getRefreshTokenExpiry, } from '../utils/jwt.js';
/**
 * Get Google OAuth client instance
 */
function getGoogleOAuthClient() {
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
export function getGoogleAuthorizationUrl() {
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
 * Get user by ID from database
 */
async function getUserById(userId) {
    const { data: users, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, avatar_url, email_verified, mfa_enabled, created_at, last_login_at')
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
 * Handle Google OAuth callback and create/link user account
 */
export async function handleGoogleOAuthCallback(code) {
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
        throw new Error('An account with this email already exists. Please sign in with your password or use a different email.');
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
