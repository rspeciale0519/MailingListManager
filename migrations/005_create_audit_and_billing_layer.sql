-- Migration: 005_create_audit_and_billing_layer
-- Description: Create Audit & Billing tables (events_audit, billing_subscriptions, usage_counters)
-- Date: 2025-11-19

-- ============================================================
-- EVENTS_AUDIT TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS events_audit (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant (nullable for platform-level events)
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,

  -- Actor
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  actor_role VARCHAR(50),

  -- Action
  action VARCHAR(255) NOT NULL,

  -- Resource
  resource_type VARCHAR(100),
  resource_id UUID,
  resource_name VARCHAR(500),

  -- State Changes
  before_state JSONB,
  after_state JSONB,
  diff JSONB, -- JSON diff for efficient storage

  -- Request Context
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100), -- Trace ID

  -- Impersonation Context
  impersonation_context JSONB,

  -- Metadata
  metadata JSONB,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_audit_org_ts ON events_audit(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_audit_actor_ts ON events_audit(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_audit_resource ON events_audit(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_events_audit_action ON events_audit(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_audit_impersonation ON events_audit((impersonation_context->>'impersonator_id'))
  WHERE impersonation_context IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_audit_ts ON events_audit(created_at DESC);

COMMENT ON TABLE events_audit IS 'Immutable audit log. All significant actions logged here.';
COMMENT ON COLUMN events_audit.impersonation_context IS 'Set when platform admin accesses org data.';


-- ============================================================
-- BILLING_SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_subscriptions (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant
  org_id UUID NOT NULL UNIQUE REFERENCES orgs(id) ON DELETE CASCADE,

  -- Plan
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),

  -- Status
  status VARCHAR(50) NOT NULL CHECK (status IN (
    'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete'
  )),

  -- Stripe IDs
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),

  -- Billing Period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Quantities (for metered billing)
  base_contacts INTEGER,
  additional_team_members INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_org ON billing_subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe_customer ON billing_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status ON billing_subscriptions(status);

COMMENT ON TABLE billing_subscriptions IS 'Stripe subscription data synced via webhooks.';


-- ============================================================
-- USAGE_COUNTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS usage_counters (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Metric
  metric VARCHAR(100) NOT NULL,

  -- Period
  period VARCHAR(50) NOT NULL, -- daily | monthly | total
  period_start DATE,
  period_end DATE,

  -- Count
  count BIGINT DEFAULT 0,

  -- Timestamps
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(org_id, metric, period, period_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_counters_org ON usage_counters(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_counters_metric ON usage_counters(org_id, metric);
CREATE INDEX IF NOT EXISTS idx_usage_counters_period ON usage_counters(period, period_start);

COMMENT ON TABLE usage_counters IS 'Usage tracking for quota enforcement and billing.';
