/**
 * Password hashing utilities using bcrypt
 * Provides secure password hashing and verification
 */
import bcrypt from 'bcrypt';
// Salt rounds for bcrypt (10 is a good balance between security and performance)
const SALT_ROUNDS = 10;
/**
 * Hash a plain text password
 * @param password - Plain text password to hash
 * @returns Hashed password string
 */
export async function hashPassword(password) {
    if (!password || password.length === 0) {
        throw new Error('Password cannot be empty');
    }
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
    }
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
}
/**
 * Verify a plain text password against a hashed password
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password, hash) {
    if (!password || !hash) {
        return false;
    }
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
}
