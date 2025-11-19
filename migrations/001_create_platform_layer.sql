-- Migration: 001_create_platform_layer
-- Description: Create Platform Layer tables (users, refresh_tokens)
-- Date: 2025-11-19

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),

  -- Platform Role (super_admin, admin, or none)
  platform_role VARCHAR(50) DEFAULT 'none' CHECK (platform_role IN ('super_admin', 'admin', 'none')),

  -- MFA
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  backup_codes TEXT[], -- Encrypted backup codes

  -- OAuth
  oauth_provider VARCHAR(50), -- google | microsoft | github
  oauth_id VARCHAR(255),

  -- Profile
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  avatar_url TEXT,
  timezone VARCHAR(100) DEFAULT 'UTC',
  locale VARCHAR(10) DEFAULT 'en-US',

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  suspended_reason TEXT,
  suspended_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- Soft Delete
  deleted_at TIMESTAMPTZ
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_oauth ON users(oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_platform_role ON users(platform_role) WHERE platform_role != 'none';
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Comments
COMMENT ON TABLE users IS 'Platform-level user identities. Users can be members of multiple orgs.';
COMMENT ON COLUMN users.platform_role IS 'Platform-wide privileges. super_admin has global access, admin has delegated access, none is normal user.';


-- ============================================================
-- REFRESH_TOKENS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Token
  token_hash VARCHAR(255) UNIQUE NOT NULL, -- SHA-256 hash of token

  -- Metadata
  device_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Lifecycle
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes for refresh_tokens table
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE NOT revoked;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE NOT revoked;

COMMENT ON TABLE refresh_tokens IS 'Track refresh tokens for JWT authentication';
