-- Migration: 002_create_organization_layer
-- Description: Create Organization Layer tables (orgs, org_memberships)
-- Date: 2025-11-19

-- ============================================================
-- ORGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orgs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly identifier

  -- Subscription
  plan VARCHAR(50) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  trial_ends_at TIMESTAMPTZ,

  -- Configuration
  settings JSONB DEFAULT '{}'::JSONB,
  feature_overrides JSONB DEFAULT '{}'::JSONB,

  -- Multi-Tenancy Strategy
  db_isolation_mode VARCHAR(50) DEFAULT 'shared' CHECK (db_isolation_mode IN ('shared', 'dedicated')),
  encryption_key_id VARCHAR(255), -- KMS key ID for this org

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'canceled', 'deleted')),
  suspended_reason TEXT,
  suspended_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for orgs table
CREATE INDEX IF NOT EXISTS idx_orgs_slug ON orgs(slug) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_orgs_plan ON orgs(plan);
CREATE INDEX IF NOT EXISTS idx_orgs_status ON orgs(status);
CREATE INDEX IF NOT EXISTS idx_orgs_trial ON orgs(trial_ends_at) WHERE trial_ends_at IS NOT NULL AND status = 'active';

COMMENT ON TABLE orgs IS 'Organizations (tenants). Each org is completely isolated.';
COMMENT ON COLUMN orgs.encryption_key_id IS 'AWS KMS key ID for encrypting PII fields in this org.';


-- ============================================================
-- ORG_MEMBERSHIPS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS org_memberships (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Role within org (account_owner | team_member | org_admin_delegate)
  org_role VARCHAR(50) NOT NULL CHECK (org_role IN ('account_owner', 'team_member', 'org_admin_delegate')),

  -- Permissions (for team_member role)
  permissions JSONB DEFAULT '{}'::JSONB,

  -- Delegation (for org_admin_delegate)
  delegated_by UUID REFERENCES users(id), -- Which super admin granted access
  delegation_reason TEXT,
  expires_at TIMESTAMPTZ, -- Time-bound access for platform admins

  -- Invitation
  invited_by UUID REFERENCES users(id),
  invitation_token VARCHAR(255) UNIQUE,
  invitation_expires_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),

  -- Timestamps
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(user_id, org_id)
);

-- Indexes for org_memberships table
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON org_memberships(org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_role ON org_memberships(org_id, org_role);
CREATE INDEX IF NOT EXISTS idx_org_memberships_expires ON org_memberships(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_org_memberships_invitation ON org_memberships(invitation_token) WHERE invitation_token IS NOT NULL;

COMMENT ON TABLE org_memberships IS 'Links users to orgs. A user can be member of multiple orgs.';
COMMENT ON COLUMN org_memberships.org_role IS 'Role determines permission scope. account_owner has full access.';
