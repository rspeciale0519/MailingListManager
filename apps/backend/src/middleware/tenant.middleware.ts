/**
 * Tenant middleware
 * Sets the organization context for RLS (Row-Level Security) policies
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { getUserOrgMembership } from '../services/org.service.js';
import { prisma } from '../utils/prisma.js';

/**
 * Middleware to set the current organization ID for RLS
 * This sets the PostgreSQL session variable 'app.org_id' which is used by RLS policies
 *
 * Usage: Apply this middleware to routes that need tenant isolation
 */
export async function setOrgContext(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user?.userId;

  if (!userId) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }

  // Get org_id from request headers, query params, or body
  const orgId =
    (request.headers['x-org-id'] as string) ||
    (request.query as any)?.org_id ||
    (request.body as any)?.org_id;

  if (!orgId) {
    reply.code(400).send({ error: 'Organization ID is required' });
    return;
  }

  // Verify user has access to this organization
  const membership = await getUserOrgMembership(userId, orgId);

  if (!membership || membership.status !== 'active') {
    reply.code(403).send({ error: 'Access denied to this organization' });
    return;
  }

  // Check if membership has expired
  if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
    reply.code(403).send({ error: 'Membership has expired' });
    return;
  }

  // Set the org_id in the PostgreSQL session for RLS
  await prisma.$executeRaw`SELECT set_config('app.org_id', ${orgId}, true)`;

  // Attach org context to request for downstream use
  request.orgContext = {
    orgId,
    role: membership.org_role as any,
    permissions: membership.permissions as any,
  };
}

/**
 * Optional tenant middleware - sets org context if provided, but doesn't require it
 * Useful for endpoints that can work with or without an org context
 */
export async function optionalOrgContext(request: FastifyRequest, _reply: FastifyReply) {
  const userId = request.user?.userId;

  if (!userId) {
    return; // No user, skip org context
  }

  // Get org_id from request headers, query params, or body
  const orgId =
    (request.headers['x-org-id'] as string) ||
    (request.query as any)?.org_id ||
    (request.body as any)?.org_id;

  if (!orgId) {
    return; // No org specified, skip org context
  }

  // Verify user has access to this organization
  const membership = await getUserOrgMembership(userId, orgId);

  if (!membership || membership.status !== 'active') {
    return; // No valid membership, skip org context
  }

  // Check if membership has expired
  if (membership.expires_at && new Date(membership.expires_at) < new Date()) {
    return; // Expired, skip org context
  }

  // Set the org_id in the PostgreSQL session for RLS
  await prisma.$executeRaw`SELECT set_config('app.org_id', ${orgId}, true)`;

  // Attach org context to request for downstream use
  request.orgContext = {
    orgId,
    role: membership.org_role as any,
    permissions: membership.permissions as any,
  };
}

/**
 * Require specific org role middleware
 */
export function requireOrgRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.orgContext) {
      reply.code(403).send({ error: 'Organization context required' });
      return;
    }

    if (!allowedRoles.includes(request.orgContext.role)) {
      reply.code(403).send({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: request.orgContext.role,
      });
      return;
    }
  };
}

/**
 * Check if user has specific permission within the organization
 */
export function requireOrgPermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.orgContext) {
      reply.code(403).send({ error: 'Organization context required' });
      return;
    }

    const { role, permissions } = request.orgContext;

    // Account owners have all permissions
    if (role === 'account_owner') {
      return;
    }

    // Check if permission is granted
    const hasPermission = permissions?.[permission] === true;

    if (!hasPermission) {
      reply.code(403).send({
        error: 'Insufficient permissions',
        required: permission,
      });
      return;
    }
  };
}

// Type augmentation for FastifyRequest
declare module 'fastify' {
  interface FastifyRequest {
    orgContext?: {
      orgId: string;
      role: 'account_owner' | 'team_member' | 'org_admin_delegate';
      permissions: Record<string, boolean>;
    };
  }
}
