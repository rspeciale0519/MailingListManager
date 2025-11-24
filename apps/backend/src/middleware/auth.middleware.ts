/**
 * Authentication middleware for Fastify
 * Verifies JWT tokens and attaches user info to requests
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from '../utils/jwt.js';
import { getUserById } from '../services/auth.supabase.js';

/**
 * User information attached to authenticated requests
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}

/**
 * Extend Fastify request type to include user
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

/**
 * Authentication middleware
 * Verifies JWT access token from Authorization header
 * Attaches user info to request.user if valid
 */
export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.code(401).send({
        success: false,
        error: 'Missing authorization header',
      });
    }

    // Extract token from "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return reply.code(401).send({
        success: false,
        error: 'Invalid authorization header format. Use: Bearer <token>',
      });
    }

    const token = parts[1];

    // Verify token
    const payload = verifyAccessToken(token);
    if (!payload) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid or expired access token',
      });
    }

    // Attach user info to request
    request.user = {
      userId: payload.userId,
      email: payload.email,
    };
  } catch (error) {
    return reply.code(401).send({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is present and valid,
 * but doesn't reject requests without tokens
 */
export async function optionalAuthMiddleware(request: FastifyRequest): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      // No token provided, continue without auth
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without auth
      return;
    }

    const token = parts[1];
    const payload = verifyAccessToken(token);

    if (payload) {
      // Valid token, attach user info
      request.user = {
        userId: payload.userId,
        email: payload.email,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    return;
  }
}

/**
 * Role-based authorization middleware
 * Requires authentication and checks user role
 * @param allowedRoles - Array of roles allowed to access the route
 */
export function requireRole(allowedRoles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    // First ensure user is authenticated
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    try {
      // Get user details including role
      const user = await getUserById(request.user.userId);

      // Check if user has allowed role
      // Note: This assumes getUserById returns a 'role' field
      // You may need to modify based on your actual user schema
      const userRole = ((user as Record<string, unknown>).role as string) || 'user';

      if (!allowedRoles.includes(userRole)) {
        return reply.code(403).send({
          success: false,
          error: 'Insufficient permissions',
        });
      }
    } catch (error) {
      return reply.code(403).send({
        success: false,
        error: 'Authorization failed',
      });
    }
  };
}
