/**
 * Organization member routes
 * Endpoints for organization member management
 */
import { authMiddleware } from '../middleware/auth.middleware.js';
import { setOrgContext, requireOrgRole } from '../middleware/tenant.middleware.js';
import { addOrganizationMember, getOrganizationMembers, updateOrganizationMember, removeOrganizationMember, } from '../services/org.service.js';
export async function orgMemberRoutes(fastify) {
    /**
     * GET /orgs/:orgId/members
     * Get all members of an organization
     */
    fastify.get('/orgs/:orgId/members', {
        preHandler: [authMiddleware, setOrgContext],
        schema: {
            description: 'Get organization members',
            tags: ['Organizations'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['orgId'],
                properties: {
                    orgId: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        members: { type: 'array' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { orgId } = request.params;
            const members = await getOrganizationMembers(orgId);
            return reply.code(200).send({
                success: true,
                members,
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
     * POST /orgs/:orgId/members
     * Add a member to an organization (account_owner or org_admin_delegate only)
     */
    fastify.post('/orgs/:orgId/members', {
        preHandler: [
            authMiddleware,
            setOrgContext,
            requireOrgRole('account_owner', 'org_admin_delegate'),
        ],
        schema: {
            description: 'Add organization member',
            tags: ['Organizations'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['orgId'],
                properties: {
                    orgId: { type: 'string' },
                },
            },
            body: {
                type: 'object',
                required: ['userId', 'role'],
                properties: {
                    userId: { type: 'string' },
                    role: {
                        type: 'string',
                        enum: ['account_owner', 'team_member', 'org_admin_delegate'],
                    },
                    permissions: { type: 'object' },
                    delegationReason: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' },
                },
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        member: { type: 'object' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const { orgId } = request.params;
            const body = request.body;
            const member = await addOrganizationMember({
                userId: body.userId,
                orgId,
                role: body.role,
                permissions: body.permissions,
                invitedBy: request.user.userId,
                delegatedBy: body.role === 'org_admin_delegate' ? request.user.userId : undefined,
                delegationReason: body.delegationReason,
                expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
            });
            return reply.code(201).send({
                success: true,
                member,
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
     * PATCH /orgs/:orgId/members/:membershipId
     * Update organization member (account_owner or org_admin_delegate only)
     */
    fastify.patch('/orgs/:orgId/members/:membershipId', {
        preHandler: [
            authMiddleware,
            setOrgContext,
            requireOrgRole('account_owner', 'org_admin_delegate'),
        ],
        schema: {
            description: 'Update organization member',
            tags: ['Organizations'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['orgId', 'membershipId'],
                properties: {
                    orgId: { type: 'string' },
                    membershipId: { type: 'string' },
                },
            },
            body: {
                type: 'object',
                properties: {
                    role: {
                        type: 'string',
                        enum: ['account_owner', 'team_member', 'org_admin_delegate'],
                    },
                    permissions: { type: 'object' },
                    status: { type: 'string', enum: ['active', 'suspended', 'removed'] },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        member: { type: 'object' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { membershipId } = request.params;
            const body = request.body;
            const member = await updateOrganizationMember(membershipId, body);
            return reply.code(200).send({
                success: true,
                member,
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
     * DELETE /orgs/:orgId/members/:membershipId
     * Remove a member from an organization (account_owner only)
     */
    fastify.delete('/orgs/:orgId/members/:membershipId', {
        preHandler: [authMiddleware, setOrgContext, requireOrgRole('account_owner')],
        schema: {
            description: 'Remove organization member',
            tags: ['Organizations'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['orgId', 'membershipId'],
                properties: {
                    orgId: { type: 'string' },
                    membershipId: { type: 'string' },
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
    }, async (request, reply) => {
        try {
            const { membershipId } = request.params;
            await removeOrganizationMember(membershipId);
            return reply.code(200).send({
                success: true,
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
