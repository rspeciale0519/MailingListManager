import { z } from 'zod';

/**
 * Email validation
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

/**
 * Password validation
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[@$!%*?&#]/, 'Password must contain at least one special character');

/**
 * Phone validation (US format)
 */
export const phoneSchema = z
  .string()
  .regex(/^[\d\s\-()+]+$/, 'Invalid phone number format')
  .optional();

/**
 * Postal code validation (US ZIP)
 */
export const postalCodeSchema = z
  .string()
  .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code (use 12345 or 12345-6789)')
  .optional();

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Register schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  org_name: z.string().min(1, 'Organization name is required'),
});

/**
 * Contact schema
 */
export const contactSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema,
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  postal_code: postalCodeSchema,
  country: z.string().max(2).optional(),
});

/**
 * List schema
 */
export const listSchema = z.object({
  name: z.string().min(1, 'List name is required').max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

/**
 * Tag schema
 */
export const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(255),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  description: z.string().optional(),
});

/**
 * Segment schema
 */
export const segmentSchema = z.object({
  name: z.string().min(1, 'Segment name is required').max(255),
  description: z.string().optional(),
  filter_definition: z.object({
    type: z.enum(['and', 'or']),
    conditions: z.array(z.any()),
  }),
  auto_update: z.boolean().default(true),
});

// Export types
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type ListInput = z.infer<typeof listSchema>;
export type TagInput = z.infer<typeof tagSchema>;
export type SegmentInput = z.infer<typeof segmentSchema>;
