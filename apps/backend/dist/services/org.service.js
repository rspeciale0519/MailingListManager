/**
 * Organization service
 * Handles organization (tenant) CRUD operations
 */
import { prisma } from '../utils/prisma.js';
// Re-export member functions for backwards compatibility
export * from './org-members.service.js';
export * from './org.types.js';
/**
 * Create a new organization with an account owner
 */
export async function createOrganization(data) {
    const { name, slug, plan = 'free', ownerId, settings = {} } = data;
    // Check if slug is already taken
    const existingOrg = await prisma.$queryRaw `
    SELECT id FROM orgs WHERE slug = ${slug} AND deleted_at IS NULL
  `;
    if (existingOrg.length > 0) {
        throw new Error('Organization slug is already taken');
    }
    // Create organization and account owner membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create organization
        const org = await tx.$queryRaw `
      INSERT INTO orgs (name, slug, plan, settings, status)
      VALUES (${name}, ${slug}, ${plan}, ${JSON.stringify(settings)}::jsonb, 'active')
      RETURNING id, name, slug, plan, status, created_at
    `;
        if (org.length === 0) {
            throw new Error('Failed to create organization');
        }
        const newOrg = org[0];
        // Add account owner membership
        await tx.$queryRaw `
      INSERT INTO org_memberships (user_id, org_id, org_role, permissions, status)
      VALUES (${ownerId}, ${newOrg.id}, 'account_owner', '{}'::jsonb, 'active')
    `;
        return newOrg;
    });
    return result;
}
/**
 * Get organization by ID
 */
export async function getOrganizationById(orgId) {
    const org = await prisma.$queryRaw `
    SELECT id, name, slug, plan, trial_ends_at, settings, feature_overrides,
           status, suspended_reason, created_at, updated_at
    FROM orgs
    WHERE id = ${orgId} AND deleted_at IS NULL
  `;
    if (org.length === 0) {
        return null;
    }
    return org[0];
}
/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug) {
    const org = await prisma.$queryRaw `
    SELECT id, name, slug, plan, trial_ends_at, settings, feature_overrides,
           status, suspended_reason, created_at, updated_at
    FROM orgs
    WHERE slug = ${slug} AND deleted_at IS NULL
  `;
    if (org.length === 0) {
        return null;
    }
    return org[0];
}
/**
 * Update organization
 */
export async function updateOrganization(orgId, data) {
    const updates = [];
    const values = [];
    if (data.name !== undefined) {
        updates.push(`name = $${values.length + 1}`);
        values.push(data.name);
    }
    if (data.slug !== undefined) {
        // Check if new slug is available
        const existing = await prisma.$queryRaw `
      SELECT id FROM orgs
      WHERE slug = ${data.slug} AND id != ${orgId} AND deleted_at IS NULL
    `;
        if (existing.length > 0) {
            throw new Error('Organization slug is already taken');
        }
        updates.push(`slug = $${values.length + 1}`);
        values.push(data.slug);
    }
    if (data.plan !== undefined) {
        updates.push(`plan = $${values.length + 1}`);
        values.push(data.plan);
    }
    if (data.settings !== undefined) {
        updates.push(`settings = $${values.length + 1}::jsonb`);
        values.push(JSON.stringify(data.settings));
    }
    if (data.featureOverrides !== undefined) {
        updates.push(`feature_overrides = $${values.length + 1}::jsonb`);
        values.push(JSON.stringify(data.featureOverrides));
    }
    if (data.status !== undefined) {
        updates.push(`status = $${values.length + 1}`);
        values.push(data.status);
        if (data.status === 'suspended' && data.suspendedReason) {
            updates.push(`suspended_reason = $${values.length + 1}`);
            values.push(data.suspendedReason);
            updates.push('suspended_at = NOW()');
        }
    }
    if (updates.length === 0) {
        throw new Error('No fields to update');
    }
    updates.push('updated_at = NOW()');
    values.push(orgId);
    const query = `
    UPDATE orgs
    SET ${updates.join(', ')}
    WHERE id = $${values.length} AND deleted_at IS NULL
    RETURNING id, name, slug, plan, settings, status, updated_at
  `;
    const result = await prisma.$queryRawUnsafe(query, ...values);
    if (result.length === 0) {
        throw new Error('Organization not found or update failed');
    }
    return result[0];
}
/**
 * Soft delete organization
 */
export async function deleteOrganization(orgId) {
    const result = await prisma.$queryRaw `
    UPDATE orgs
    SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ${orgId} AND deleted_at IS NULL
    RETURNING id
  `;
    if (result.length === 0) {
        throw new Error('Organization not found');
    }
    return true;
}
