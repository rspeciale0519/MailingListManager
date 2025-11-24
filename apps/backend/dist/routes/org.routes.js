/**
 * Organization routes
 * Endpoints for organization (tenant) CRUD management
 */
import { authMiddleware } from '../middleware/auth.middleware.js';
import { setOrgContext, requireOrgRole } from '../middleware/tenant.middleware.js';
import { createOrganization, getOrganizationById, getOrganizationBySlug, updateOrganization, deleteOrganization, getUserOrganizations, } from '../services/org.service.js';
export async function orgRoutes(fastify) {
    /**
     * POST /orgs
     * Create a new organization
     */
    fastify.post('/orgs', {
        preHandler: [authMiddleware],
        schema: {
            description: 'Create a new organization',
            tags: ['Organizations'],
            security: [{ bearerAuth: [] }],
            body: {
                type: 'object',
                required: ['name', 'slug'],
                properties: {
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    plan: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise'] },
                    settings: { type: 'object' },
                },
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        org: { type: 'object' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const body = request.body;
            const org = await createOrganization({
                name: body.name,
                slug: body.slug,
                plan: body.plan,
                ownerId: request.user.userId,
                settings: body.settings,
            });
            return reply.code(201).send({
                success: true,
                org,
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
     * GET /orgs
     * Get all organizations for the current user
     */
    fastify.get('/orgs', {
        preHandler: [authMiddleware],
        schema: {
            description: 'Get all organizations for current user',
            tags: ['Organizations'],
            security: [{ bearerAuth: [] }],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        orgs: { type: 'array' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            if (!request.user) {
                return reply.code(401).send({ error: 'Unauthorized' });
            }
            const orgs = await getUserOrganizations(request.user.userId);
            return reply.code(200).send({
                success: true,
                orgs,
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
     * GET /orgs/:orgId
     * Get organization by ID
     */
    fastify.get('/orgs/:orgId', {
        preHandler: [authMiddleware, setOrgContext],
        schema: {
            description: 'Get organization by ID',
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
                        org: { type: 'object' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { orgId } = request.params;
            const org = await getOrganizationById(orgId);
            if (!org) {
                return reply.code(404).send({
                    success: false,
                    error: 'Organization not found',
                });
            }
            return reply.code(200).send({
                success: true,
                org,
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
     * GET /orgs/slug/:slug
     * Get organization by slug
     */
    fastify.get('/orgs/slug/:slug', {
        preHandler: [authMiddleware],
        schema: {
            description: 'Get organization by slug',
            tags: ['Organizations'],
            security: [{ bearerAuth: [] }],
            params: {
                type: 'object',
                required: ['slug'],
                properties: {
                    slug: { type: 'string' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        org: { type: 'object' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { slug } = request.params;
            const org = await getOrganizationBySlug(slug);
            if (!org) {
                return reply.code(404).send({
                    success: false,
                    error: 'Organization not found',
                });
            }
            return reply.code(200).send({
                success: true,
                org,
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
     * PATCH /orgs/:orgId
     * Update organization (account_owner only)
     */
    fastify.patch('/orgs/:orgId', {
        preHandler: [authMiddleware, setOrgContext, requireOrgRole('account_owner')],
        schema: {
            description: 'Update organization',
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
                properties: {
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    plan: { type: 'string', enum: ['free', 'starter', 'pro', 'enterprise'] },
                    settings: { type: 'object' },
                    featureOverrides: { type: 'object' },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        org: { type: 'object' },
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { orgId } = request.params;
            const body = request.body;
            const org = await updateOrganization(orgId, body);
            return reply.code(200).send({
                success: true,
                org,
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
     * DELETE /orgs/:orgId
     * Delete organization (soft delete, account_owner only)
     */
    fastify.delete('/orgs/:orgId', {
        preHandler: [authMiddleware, setOrgContext, requireOrgRole('account_owner')],
        schema: {
            description: 'Delete organization',
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
                    },
                },
            },
        },
    }, async (request, reply) => {
        try {
            const { orgId } = request.params;
            await deleteOrganization(orgId);
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
