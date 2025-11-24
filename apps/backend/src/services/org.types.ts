/**
 * Organization service types
 */

export type OrgRole = 'account_owner' | 'team_member' | 'org_admin_delegate';
export type OrgPlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type OrgStatus = 'active' | 'suspended' | 'canceled' | 'deleted';

export interface CreateOrgData {
  name: string;
  slug: string;
  plan?: OrgPlan;
  ownerId: string;
  settings?: Record<string, any>;
}

export interface UpdateOrgData {
  name?: string;
  slug?: string;
  plan?: OrgPlan;
  settings?: Record<string, any>;
  featureOverrides?: Record<string, any>;
  status?: OrgStatus;
  suspendedReason?: string;
}

export interface AddMemberData {
  userId: string;
  orgId: string;
  role: OrgRole;
  permissions?: Record<string, any>;
  invitedBy: string;
  delegatedBy?: string;
  delegationReason?: string;
  expiresAt?: Date;
}
