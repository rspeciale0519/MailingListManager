-- Migration: 004_create_operations_layer
-- Description: Create Operations tables (imports, import_rows, exports, dedup_runs, dedup_clusters, dedup_merges, validation_jobs, skiptrace_jobs)
-- Date: 2025-11-19

-- ============================================================
-- IMPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS imports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant & Target
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'uploading', 'parsing', 'mapping', 'validating',
    'committing', 'post_processing', 'complete',
    'failed', 'canceled_partial', 'reverting', 'reverted'
  )),

  -- Source
  source_filename VARCHAR(500),
  source_format VARCHAR(50), -- csv | xlsx | tsv | json
  file_size BIGINT, -- bytes
  file_ref VARCHAR(500), -- S3 key
  file_encoding VARCHAR(50) DEFAULT 'UTF-8',

  -- Column Mapping
  column_map JSONB,

  -- Options
  options JSONB DEFAULT '{}'::JSONB,

  -- Progress
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  valid_rows INTEGER DEFAULT 0,
  invalid_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,

  -- Statistics
  stats JSONB DEFAULT '{}'::JSONB,

  -- Errors
  errors JSONB[], -- Array of error objects

  -- Ownership
  created_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,

  -- Checkpoints (for resume)
  checkpoint JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_imports_org ON imports(org_id);
CREATE INDEX IF NOT EXISTS idx_imports_list ON imports(list_id);
CREATE INDEX IF NOT EXISTS idx_imports_status ON imports(org_id, status);
CREATE INDEX IF NOT EXISTS idx_imports_created ON imports(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_imports_created_by ON imports(created_by);

COMMENT ON TABLE imports IS 'Import job tracking. Each import creates contacts in target list.';


-- ============================================================
-- IMPORT_ROWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS import_rows (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent Import
  import_id UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,

  -- Row Data
  row_idx INTEGER NOT NULL,
  raw_data JSONB NOT NULL, -- Original parsed data
  normalized_data JSONB, -- After formatting/validation

  -- Validation
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'valid', 'invalid', 'skipped', 'committed')),
  errors JSONB[], -- Array of validation errors
  warnings JSONB[], -- Non-blocking issues

  -- Result
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Created/updated contact
  action VARCHAR(50), -- created | updated | skipped

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(import_id, row_idx)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_import_rows_import ON import_rows(import_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_status ON import_rows(import_id, status);
CREATE INDEX IF NOT EXISTS idx_import_rows_contact ON import_rows(contact_id) WHERE contact_id IS NOT NULL;

COMMENT ON TABLE import_rows IS 'Staging for import validation. Rows cleaned up after import completes.';


-- Add FK from contacts to imports
ALTER TABLE contacts ADD CONSTRAINT fk_contacts_import
  FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL;


-- ============================================================
-- EXPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Selection
  selection JSONB NOT NULL,

  -- Configuration
  columns TEXT[] NOT NULL, -- Which fields to export
  format VARCHAR(50) NOT NULL CHECK (format IN ('csv', 'xlsx', 'json', 'vcard')),
  options JSONB DEFAULT '{}'::JSONB,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed', 'expired')),

  -- Result
  file_ref VARCHAR(500), -- S3 key
  file_size BIGINT,
  row_count INTEGER,
  download_url TEXT, -- Pre-signed S3 URL
  expires_at TIMESTAMPTZ, -- URL expires after 24 hours

  -- Error
  error_message TEXT,

  -- Ownership
  created_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exports_org ON exports(org_id);
CREATE INDEX IF NOT EXISTS idx_exports_status ON exports(org_id, status);
CREATE INDEX IF NOT EXISTS idx_exports_created ON exports(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exports_created_by ON exports(created_by);
CREATE INDEX IF NOT EXISTS idx_exports_expires ON exports(expires_at) WHERE status = 'complete' AND expires_at < NOW();

COMMENT ON TABLE exports IS 'Export job tracking. Files auto-deleted after expiration.';


-- ============================================================
-- DEDUP_RUNS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS dedup_runs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant & Scope
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE SET NULL, -- NULL = all lists

  -- Criteria
  criteria JSONB NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'clustering', 'review', 'applying', 'complete', 'failed', 'canceled'
  )),

  -- Results
  total_contacts INTEGER,
  duplicate_contacts INTEGER,
  cluster_count INTEGER,
  clusters JSONB, -- Array of cluster summaries

  -- Statistics
  stats JSONB DEFAULT '{}'::JSONB,

  -- Ownership
  created_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dedup_runs_org ON dedup_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_dedup_runs_list ON dedup_runs(list_id) WHERE list_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dedup_runs_status ON dedup_runs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_dedup_runs_created ON dedup_runs(org_id, created_at DESC);

COMMENT ON TABLE dedup_runs IS 'Deduplication job tracking with clustering results.';


-- ============================================================
-- DEDUP_CLUSTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS dedup_clusters (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent Run
  dedup_run_id UUID NOT NULL REFERENCES dedup_runs(id) ON DELETE CASCADE,
  cluster_id VARCHAR(100) NOT NULL,

  -- Members
  contact_ids UUID[] NOT NULL,
  contact_data JSONB NOT NULL, -- Denormalized contact data for comparison

  -- Confidence
  confidence DECIMAL(3,2) NOT NULL,
  reason_codes TEXT[],
  match_details JSONB,

  -- Review Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'applied', 'skipped')),
  survivor_id UUID,
  merge_strategy JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(dedup_run_id, cluster_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dedup_clusters_run ON dedup_clusters(dedup_run_id);
CREATE INDEX IF NOT EXISTS idx_dedup_clusters_status ON dedup_clusters(dedup_run_id, status);

COMMENT ON TABLE dedup_clusters IS 'Detailed cluster data for dedup review. Cleaned up after run completes.';


-- ============================================================
-- DEDUP_MERGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS dedup_merges (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  dedup_run_id UUID REFERENCES dedup_runs(id) ON DELETE CASCADE,
  cluster_id VARCHAR(100),

  -- Merge Details
  survivor_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  merged_ids UUID[] NOT NULL,

  -- Pre-Merge Snapshot (for undo)
  snapshot JSONB NOT NULL,

  -- Undo
  can_undo BOOLEAN DEFAULT TRUE,
  undone BOOLEAN DEFAULT FALSE,
  undone_at TIMESTAMPTZ,
  undone_by UUID REFERENCES users(id),

  -- Timestamps
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  undo_expires_at TIMESTAMPTZ -- After this, snapshot can be deleted
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dedup_merges_run ON dedup_merges(dedup_run_id);
CREATE INDEX IF NOT EXISTS idx_dedup_merges_survivor ON dedup_merges(survivor_id);
CREATE INDEX IF NOT EXISTS idx_dedup_merges_undo ON dedup_merges(can_undo, undo_expires_at) WHERE can_undo = TRUE;

COMMENT ON TABLE dedup_merges IS 'Merge transaction audit for undo capability. Snapshots deleted after retention.';


-- ============================================================
-- VALIDATION_JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS validation_jobs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Selection
  contact_ids UUID[] NOT NULL,

  -- Provider
  provider VARCHAR(50) NOT NULL DEFAULT 'accuzip',

  -- Configuration
  input_mapping JSONB NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'complete', 'failed', 'canceled'
  )),

  -- Progress
  total_records INTEGER NOT NULL,
  processed_records INTEGER DEFAULT 0,
  deliverable_count INTEGER DEFAULT 0,
  undeliverable_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Cost
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),

  -- Results
  results JSONB,

  -- Error
  error_message TEXT,

  -- Ownership
  created_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_validation_jobs_org ON validation_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_validation_jobs_status ON validation_jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_validation_jobs_created ON validation_jobs(org_id, created_at DESC);

COMMENT ON TABLE validation_jobs IS 'Address validation job tracking via AccuZip/USPS. See docs/API-AccuZip.md for field mappings and integration details.';


-- ============================================================
-- SKIPTRACE_JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS skiptrace_jobs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Selection
  contact_ids UUID[] NOT NULL,

  -- Provider
  provider VARCHAR(50) NOT NULL, -- spokeo | beenverified | tlo

  -- Configuration
  input_mapping JSONB NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'complete', 'failed', 'canceled'
  )),

  -- Progress
  total_records INTEGER NOT NULL,
  processed_records INTEGER DEFAULT 0,
  found_count INTEGER DEFAULT 0,
  not_found_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Cost
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),

  -- Results
  results JSONB,

  -- Error
  error_message TEXT,

  -- Ownership
  created_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skiptrace_jobs_org ON skiptrace_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_skiptrace_jobs_status ON skiptrace_jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_skiptrace_jobs_created ON skiptrace_jobs(org_id, created_at DESC);

COMMENT ON TABLE skiptrace_jobs IS 'Skip trace enrichment job tracking.';
