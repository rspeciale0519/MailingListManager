/**
 * MFA (Multi-Factor Authentication) utilities
 * Using TOTP (Time-based One-Time Password) algorithm
 */

import { authenticator } from 'otplib';

// Configure TOTP settings
authenticator.options = {
  window: 1, // Allow 1 step before and after current time
  step: 30, // 30 second time step
};

/**
 * Generate a new MFA secret for a user
 */
export function generateMFASecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate a TOTP URI for QR code generation
 * @param secret - The MFA secret
 * @param email - User's email address
 * @param issuer - Application name
 */
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer = 'Mailing List Manager'
): string {
  return authenticator.keyuri(email, issuer, secret);
}

/**
 * Verify a TOTP code against a secret
 * @param code - The 6-digit code provided by the user
 * @param secret - The user's MFA secret
 */
export function verifyTOTPCode(code: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch (error) {
    return false;
  }
}

/**
 * Generate a TOTP code (for testing purposes)
 * @param secret - The MFA secret
 */
export function generateTOTPCode(secret: string): string {
  return authenticator.generate(secret);
}
