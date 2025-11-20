/**
 * Email verification routes
 * Handles email verification and resending verification emails
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { verifyVerificationToken, generateVerificationToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../services/email.service.js';
import { supabase } from '../config/supabase.js';

/**
 * Validation schemas
 */
const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export async function emailVerificationRoutes(fastify: FastifyInstance) {
  /**
   * POST /auth/verify-email
   * Verify user's email address using verification token
   */
  fastify.post<{ Body: VerifyEmailInput }>(
    '/auth/verify-email',
    {
      schema: {
        description: 'Verify email address with verification token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' },
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
    async (request: FastifyRequest<{ Body: VerifyEmailInput }>, reply: FastifyReply) => {
      try {
        // Validate input
        const { token } = verifyEmailSchema.parse(request.body);

        // Verify token
        const payload = verifyVerificationToken(token);
        if (!payload) {
          return reply.code(400).send({
            success: false,
            error: 'Invalid or expired verification token',
          });
        }

        // Update user email verification status
        const { data: user, error } = await supabase
          .from('users')
          .update({ email_verified: true, email_verified_at: new Date().toISOString() })
          .eq('id', payload.userId)
          .select()
          .single();

        if (error || !user) {
          return reply.code(404).send({
            success: false,
            error: 'User not found',
          });
        }

        // Check if already verified
        if (user.email_verified) {
          return reply.code(200).send({
            success: true,
            message: 'Email already verified',
          });
        }

        // Send welcome email
        try {
          await sendWelcomeEmail(user.email, user.first_name || 'there');
        } catch (emailError) {
          // Log error but don't fail the request
          fastify.log.error({ error: emailError }, 'Failed to send welcome email');
        }

        return reply.code(200).send({
          success: true,
          message: 'Email verified successfully',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            success: false,
            error: error.errors[0].message,
          });
        }
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
   * POST /auth/resend-verification
   * Resend verification email to user
   */
  fastify.post<{ Body: ResendVerificationInput }>(
    '/auth/resend-verification',
    {
      schema: {
        description: 'Resend email verification link',
        tags: ['Authentication'],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
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
    async (request: FastifyRequest<{ Body: ResendVerificationInput }>, reply: FastifyReply) => {
      try {
        // Validate input
        const { email } = resendVerificationSchema.parse(request.body);

        // Find user
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !user) {
          // Don't reveal if user exists for security
          return reply.code(200).send({
            success: true,
            message: 'If the email exists, a verification link has been sent',
          });
        }

        // Check if already verified
        if (user.email_verified) {
          return reply.code(400).send({
            success: false,
            error: 'Email is already verified',
          });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken(user.id, user.email);

        // Send verification email
        await sendVerificationEmail(user.email, verificationToken);

        return reply.code(200).send({
          success: true,
          message: 'Verification email sent successfully',
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.code(400).send({
            success: false,
            error: error.errors[0].message,
          });
        }
        if (error instanceof Error) {
          return reply.code(500).send({
            success: false,
            error: 'Failed to send verification email',
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
