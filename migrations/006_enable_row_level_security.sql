-- Migration: 006_enable_row_level_security
-- Description: Enable Row-Level Security (RLS) policies for multi-tenant isolation
-- Date: 2025-11-19

-- ============================================================
-- Enable RLS on Tenant Tables
-- ============================================================

-- Organization Layer
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

-- Operations Layer
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE dedup_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skiptrace_jobs ENABLE ROW LEVEL SECURITY;

-- Usage Tracking
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- Create RLS Policies for Tenant Isolation
-- ============================================================

-- Lists Table
CREATE POLICY tenant_isolation ON lists
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Tags Table
CREATE POLICY tenant_isolation ON tags
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Contacts Table
CREATE POLICY tenant_isolation ON contacts
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Segments Table
CREATE POLICY tenant_isolation ON segments
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Custom Fields Table
CREATE POLICY tenant_isolation ON custom_fields
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Imports Table
CREATE POLICY tenant_isolation ON imports
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Exports Table
CREATE POLICY tenant_isolation ON exports
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Dedup Runs Table
CREATE POLICY tenant_isolation ON dedup_runs
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Validation Jobs Table
CREATE POLICY tenant_isolation ON validation_jobs
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Skiptrace Jobs Table
CREATE POLICY tenant_isolation ON skiptrace_jobs
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);

-- Usage Counters Table
CREATE POLICY tenant_isolation ON usage_counters
  FOR ALL
  USING (org_id = current_setting('app.org_id', true)::uuid);


-- ============================================================
-- Comments
-- ============================================================

COMMENT ON POLICY tenant_isolation ON lists IS 'Ensures users can only access lists from their current organization';
COMMENT ON POLICY tenant_isolation ON tags IS 'Ensures users can only access tags from their current organization';
COMMENT ON POLICY tenant_isolation ON contacts IS 'Ensures users can only access contacts from their current organization';
COMMENT ON POLICY tenant_isolation ON segments IS 'Ensures users can only access segments from their current organization';
COMMENT ON POLICY tenant_isolation ON custom_fields IS 'Ensures users can only access custom fields from their current organization';
COMMENT ON POLICY tenant_isolation ON imports IS 'Ensures users can only access imports from their current organization';
COMMENT ON POLICY tenant_isolation ON exports IS 'Ensures users can only access exports from their current organization';
COMMENT ON POLICY tenant_isolation ON dedup_runs IS 'Ensures users can only access dedup runs from their current organization';
COMMENT ON POLICY tenant_isolation ON validation_jobs IS 'Ensures users can only access validation jobs from their current organization';
COMMENT ON POLICY tenant_isolation ON skiptrace_jobs IS 'Ensures users can only access skiptrace jobs from their current organization';
COMMENT ON POLICY tenant_isolation ON usage_counters IS 'Ensures users can only access usage counters from their current organization';
