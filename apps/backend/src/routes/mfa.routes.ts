/**
 * Multi-Factor Authentication (MFA) routes
 * Handles MFA setup, enablement, and verification
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  enableMFASchema,
  verifyMFACodeSchema,
  EnableMFAInput,
  VerifyMFACodeInput,
} from '../types/auth.schemas.js';
import { setupMFA, enableMFA, disableMFA, verifyMFACode } from '../services/mfa.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

export async function mfaRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/mfa/setup
   * Setup MFA - returns QR code URI for user to scan
   */
  fastify.post(
    '/auth/mfa/setup',
    {
      preHandler: [authMiddleware],
      schema: {
        description: 'Setup 2FA for user account',
        tags: ['Authentication', 'MFA'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              secret: { type: 'string' },
              qrCodeUri: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as unknown as { id: string }).id;
        const result = await setupMFA(userId);

        return reply.code(200).send({
          success: true,
          secret: result.secret,
          qrCodeUri: result.qrCodeUri,
          message: result.message,
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
   * POST /auth/mfa/enable
   * Enable MFA after verifying the code
   */
  fastify.post<{ Body: EnableMFAInput }>(
    '/auth/mfa/enable',
    {
      preHandler: [authMiddleware],
      schema: {
        description: 'Enable 2FA after verifying code',
        tags: ['Authentication', 'MFA'],
        body: {
          type: 'object',
          required: ['code', 'secret'],
          properties: {
            code: { type: 'string' },
            secret: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: EnableMFAInput }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as unknown as { id: string }).id;
        const validatedData = enableMFASchema.parse(request.body);
        const result = await enableMFA(userId, validatedData.code, validatedData.secret);

        return reply.code(200).send({
          success: true,
          message: result.message,
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
   * POST /auth/mfa/disable
   * Disable MFA for user
   */
  fastify.post(
    '/auth/mfa/disable',
    {
      preHandler: [authMiddleware],
      schema: {
        description: 'Disable 2FA',
        tags: ['Authentication', 'MFA'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request.user as unknown as { id: string }).id;
        const result = await disableMFA(userId);

        return reply.code(200).send({
          success: true,
          message: result.message,
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
   * POST /auth/mfa/verify
   * Verify MFA code during login
   */
  fastify.post<{ Body: VerifyMFACodeInput }>(
    '/auth/mfa/verify',
    {
      schema: {
        description: 'Verify 2FA code during login',
        tags: ['Authentication', 'MFA'],
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
              valid: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: VerifyMFACodeInput }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as unknown as { id?: string } | undefined)?.id;
        if (!userId) {
          return reply.code(401).send({
            success: false,
            error: 'User not authenticated',
          });
        }

        const validatedData = verifyMFACodeSchema.parse(request.body);
        const isValid = await verifyMFACode(userId, validatedData.code);

        return reply.code(200).send({
          success: true,
          valid: isValid,
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
