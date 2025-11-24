/**
 * Google OAuth authentication routes
 * Handles OAuth authorization URL and callback
 */
import { googleOAuthCallbackSchema } from '../types/auth.schemas.js';
import { getGoogleAuthorizationUrl, handleGoogleOAuthCallback } from '../services/oauth.service.js';
export async function oauthRoutes(fastify) {
    /**
     * GET /auth/oauth/google
     * Get Google OAuth authorization URL
     */
    fastify.get('/auth/oauth/google', {
        schema: {
            description: 'Get Google OAuth authorization URL',
            tags: ['Authentication', 'OAuth'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        authUrl: { type: 'string' },
                    },
                },
            },
        },
    }, async (_request, reply) => {
        try {
            const authUrl = getGoogleAuthorizationUrl();
            return reply.code(200).send({
                success: true,
                authUrl,
            });
        }
        catch (error) {
            if (error instanceof Error) {
                return reply.code(500).send({
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
     * POST /auth/oauth/google/callback
     * Handle Google OAuth callback and create/link user account
     */
    fastify.post('/auth/oauth/google/callback', {
        schema: {
            description: 'Handle Google OAuth callback',
            tags: ['Authentication', 'OAuth'],
            body: {
                type: 'object',
                required: ['code'],
                properties: {
                    code: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        isNewUser: { type: 'boolean' },
                        user: { type: 'object' },
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            // Validate input
            const validatedData = googleOAuthCallbackSchema.parse(request.body);
            // Handle OAuth callback
            const result = await handleGoogleOAuthCallback(validatedData.code);
            return reply.code(200).send({
                success: true,
                ...result,
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
