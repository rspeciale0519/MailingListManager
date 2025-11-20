/**
 * User routes
 * Protected endpoints for user profile and account management
 */
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getUserById } from '../services/auth.supabase.js';
export async function userRoutes(fastify) {
    /**
     * GET /user/profile
     * Get current user's profile (protected route)
     */
    fastify.get('/user/profile', {
        preHandler: [authMiddleware],
        schema: {
            description: 'Get current user profile',
            tags: ['User'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        user: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                email: { type: 'string' },
                                firstName: { type: 'string' },
                                lastName: { type: 'string' },
                                emailVerified: { type: 'boolean' },
                                mfaEnabled: { type: 'boolean' },
                                createdAt: { type: 'string' },
                                lastLoginAt: { type: 'string' },
                            },
                        },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.code(401).send({
                    success: false,
                    error: 'Not authenticated',
                });
            }
            // Get full user details
            const user = await getUserById(request.user.userId);
            return reply.code(200).send({
                success: true,
                user,
            });
        }
        catch (error) {
            if (error instanceof Error) {
                return reply.code(400).send({
                    success: false,
                    error: error.message,
                });
            }
            return reply.code(500).send({
                success: false,
                error: 'Internal server error',
            });
        }
    });
    /**
     * GET /user/me
     * Alias for /user/profile for convenience
     */
    fastify.get('/user/me', {
        preHandler: [authMiddleware],
        schema: {
            description: 'Get current user (alias for /user/profile)',
            tags: ['User'],
            security: [{ bearerAuth: [] }],
        },
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.code(401).send({
                    success: false,
                    error: 'Not authenticated',
                });
            }
            const user = await getUserById(request.user.userId);
            return reply.code(200).send({
                success: true,
                user,
            });
        }
        catch (error) {
            if (error instanceof Error) {
                return reply.code(400).send({
                    success: false,
                    error: error.message,
                });
            }
            return reply.code(500).send({
                success: false,
                error: 'Internal server error',
            });
        }
    });
}
