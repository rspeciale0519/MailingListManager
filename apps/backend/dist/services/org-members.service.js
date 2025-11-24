/**
 * Organization membership service
 * Handles organization member management operations
 */
import { prisma } from '../utils/prisma.js';
/**
 * Add a member to an organization
 */
export async function addOrganizationMember(data) {
    const { userId, orgId, role, permissions = {}, invitedBy, delegatedBy, delegationReason, expiresAt, } = data;
    // Check if membership already exists
    const existing = await prisma.$queryRaw `
    SELECT id FROM org_memberships
    WHERE user_id = ${userId} AND org_id = ${orgId}
  `;
    if (existing.length > 0) {
        throw new Error('User is already a member of this organization');
    }
    const result = await prisma.$queryRaw `
    INSERT INTO org_memberships (
      user_id, org_id, org_role, permissions, invited_by,
      delegated_by, delegation_reason, expires_at, status
    )
    VALUES (
      ${userId}, ${orgId}, ${role}, ${JSON.stringify(permissions)}::jsonb, ${invitedBy},
      ${delegatedBy || null}, ${delegationReason || null}, ${expiresAt || null}, 'active'
    )
    RETURNING id, user_id, org_id, org_role, status, joined_at
  `;
    if (result.length === 0) {
        throw new Error('Failed to add organization member');
    }
    return result[0];
}
/**
 * Get all members of an organization
 */
export async function getOrganizationMembers(orgId) {
    const members = await prisma.$queryRaw `
    SELECT
      om.id, om.user_id, om.org_role, om.permissions, om.status,
      om.joined_at, om.last_active_at,
      u.email as user_email, u.first_name as user_first_name, u.last_name as user_last_name
    FROM org_memberships om
    JOIN users u ON om.user_id = u.id
    WHERE om.org_id = ${orgId}
    ORDER BY om.joined_at ASC
  `;
    return members;
}
/**
 * Get user's membership in an organization
 */
export async function getUserOrgMembership(userId, orgId) {
    const membership = await prisma.$queryRaw `
    SELECT id, user_id, org_id, org_role, permissions, status, joined_at, expires_at
    FROM org_memberships
    WHERE user_id = ${userId} AND org_id = ${orgId}
  `;
    if (membership.length === 0) {
        return null;
    }
    return membership[0];
}
/**
 * Get all organizations a user is a member of
 */
export async function getUserOrganizations(userId) {
    const orgs = await prisma.$queryRaw `
    SELECT
      o.id, o.name, o.slug, o.plan, o.status,
      om.org_role as role, om.joined_at
    FROM orgs o
    JOIN org_memberships om ON o.id = om.org_id
    WHERE om.user_id = ${userId}
      AND o.deleted_at IS NULL
      AND om.status = 'active'
    ORDER BY om.joined_at ASC
  `;
    return orgs;
}
/**
 * Update organization member role or permissions
 */
export async function updateOrganizationMember(membershipId, data) {
    const updates = [];
    const values = [];
    if (data.role !== undefined) {
        updates.push(`org_role = $${values.length + 1}`);
        values.push(data.role);
    }
    if (data.permissions !== undefined) {
        updates.push(`permissions = $${values.length + 1}::jsonb`);
        values.push(JSON.stringify(data.permissions));
    }
    if (data.status !== undefined) {
        updates.push(`status = $${values.length + 1}`);
        values.push(data.status);
    }
    if (updates.length === 0) {
        throw new Error('No fields to update');
    }
    values.push(membershipId);
    const query = `
    UPDATE org_memberships
    SET ${updates.join(', ')}
    WHERE id = $${values.length}
    RETURNING id, user_id, org_id, org_role, permissions, status
  `;
    const result = await prisma.$queryRawUnsafe(query, ...values);
    if (result.length === 0) {
        throw new Error('Membership not found');
    }
    return result[0];
}
/**
 * Remove a member from an organization
 */
export async function removeOrganizationMember(membershipId) {
    const result = await prisma.$queryRaw `
    UPDATE org_memberships
    SET status = 'removed'
    WHERE id = ${membershipId}
    RETURNING id
  `;
    if (result.length === 0) {
        throw new Error('Membership not found');
    }
    return true;
}
