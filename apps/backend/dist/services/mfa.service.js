/**
 * MFA (Multi-Factor Authentication) service
 * Handles setup, enablement, and verification of TOTP-based 2FA
 */
import { generateMFASecret, generateTOTPUri, verifyTOTPCode } from '../utils/mfa.js';
import { supabase } from '../config/supabase.js';
/**
 * Setup MFA for a user
 * Generates a new MFA secret and returns QR code data
 */
export async function setupMFA(userId) {
    // Check if user exists
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, email, mfa_enabled')
        .eq('id', userId)
        .limit(1);
    if (userError || !users || users.length === 0) {
        throw new Error('User not found');
    }
    const user = users[0];
    if (user.mfa_enabled) {
        throw new Error('MFA is already enabled for this account');
    }
    // Generate new MFA secret
    const secret = generateMFASecret();
    const qrCodeUri = generateTOTPUri(secret, user.email);
    return {
        secret,
        qrCodeUri,
        message: 'Scan this QR code with your authenticator app to enable 2FA',
    };
}
/**
 * Enable MFA for a user after verifying the code
 */
export async function enableMFA(userId, code, secret) {
    // Verify the code first
    if (!verifyTOTPCode(code, secret)) {
        throw new Error('Invalid authentication code');
    }
    // Update user MFA settings
    const { error } = await supabase
        .from('users')
        .update({
        mfa_enabled: true,
        mfa_secret: secret,
    })
        .eq('id', userId);
    if (error) {
        throw new Error(`Failed to enable MFA: ${error.message}`);
    }
    return {
        success: true,
        message: '2FA has been enabled successfully',
    };
}
/**
 * Disable MFA for a user
 */
export async function disableMFA(userId) {
    const { error } = await supabase
        .from('users')
        .update({
        mfa_enabled: false,
        mfa_secret: null,
    })
        .eq('id', userId);
    if (error) {
        throw new Error(`Failed to disable MFA: ${error.message}`);
    }
    return {
        success: true,
        message: '2FA has been disabled',
    };
}
/**
 * Verify MFA code for login
 */
export async function verifyMFACode(userId, code) {
    const { data: users, error } = await supabase
        .from('users')
        .select('mfa_secret, mfa_enabled')
        .eq('id', userId)
        .limit(1);
    if (error || !users || users.length === 0) {
        throw new Error('User not found');
    }
    const user = users[0];
    if (!user.mfa_enabled || !user.mfa_secret) {
        throw new Error('MFA is not enabled for this account');
    }
    return verifyTOTPCode(code, user.mfa_secret);
}
