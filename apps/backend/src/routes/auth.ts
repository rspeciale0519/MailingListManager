/**
 * Authentication routes
 * Handles user registration, login, logout, and token refresh
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  googleOAuthCallbackSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  LogoutInput,
  GoogleOAuthCallbackInput,
} from '../types/auth.schemas.js';
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getGoogleAuthorizationUrl,
  handleGoogleOAuthCallback,
} from '../services/auth.supabase.js';

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/register
   * Register a new user account
   */
  fastify.post<{ Body: RegisterInput }>(
    '/auth/register',
    {
      schema: {
        description: 'Register a new user account',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
        response: {
          201: {
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
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
      try {
        // Validate input
        const validatedData = registerSchema.parse(request.body);

        // Register user
        const user = await registerUser(validatedData);

        return reply.code(201).send({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
          },
        });
      } catch (error) {
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
    }
  );

  /**
   * POST /auth/login
   * Authenticate user and generate tokens
   */
  fastify.post<{ Body: LoginInput }>(
    '/auth/login',
    {
      schema: {
        description: 'Login and receive access/refresh tokens',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              requiresMfa: { type: 'boolean' },
              user: { type: 'object' },
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
      try {
        // Validate input
        const validatedData = loginSchema.parse(request.body);

        // Login user
        const result = await loginUser(validatedData);

        return reply.code(200).send({
          success: true,
          ...result,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(401).send({
            success: false,
            error: error.message,
          });
        }
        return reply.code(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post<{ Body: RefreshTokenInput }>(
    '/auth/refresh',
    {
      schema: {
        description: 'Refresh access token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              accessToken: { type: 'string' },
              refreshToken: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: RefreshTokenInput }>, reply: FastifyReply) => {
      try {
        // Validate input
        const validatedData = refreshTokenSchema.parse(request.body);

        // Refresh tokens
        const tokens = await refreshAccessToken(validatedData.refreshToken);

        return reply.code(200).send({
          success: true,
          ...tokens,
        });
      } catch (error) {
        if (error instanceof Error) {
          return reply.code(401).send({
            success: false,
            error: error.message,
          });
        }
        return reply.code(500).send({
          success: false,
          error: 'Internal server error',
        });
      }
    }
  );

  /**
   * POST /auth/logout
   * Logout user by revoking refresh token
   */
  fastify.post<{ Body: LogoutInput }>(
    '/auth/logout',
    {
      schema: {
        description: 'Logout user',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: LogoutInput }>, reply: FastifyReply) => {
      try {
        // Validate input
        const validatedData = logoutSchema.parse(request.body);

        // Logout user
        await logoutUser(validatedData.refreshToken);

        return reply.code(200).send({
          success: true,
          message: 'Logged out successfully',
        });
      } catch (error) {
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
    }
  );

  /**
   * GET /auth/oauth/google
   * Get Google OAuth authorization URL
   */
  fastify.get(
    '/auth/oauth/google',
    {
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
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUrl = getGoogleAuthorizationUrl();

        return reply.code(200).send({
          success: true,
          authUrl,
        });
      } catch (error) {
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
    }
  );

  /**
   * POST /auth/oauth/google/callback
   * Handle Google OAuth callback and create/link user account
   */
  fastify.post<{ Body: GoogleOAuthCallbackInput }>(
    '/auth/oauth/google/callback',
    {
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
    },
    async (request: FastifyRequest<{ Body: GoogleOAuthCallbackInput }>, reply: FastifyReply) => {
      try {
        // Validate input
        const validatedData = googleOAuthCallbackSchema.parse(request.body);

        // Handle OAuth callback
        const result = await handleGoogleOAuthCallback(validatedData.code);

        return reply.code(200).send({
          success: true,
          ...result,
        });
      } catch (error) {
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
    }
  );
}
