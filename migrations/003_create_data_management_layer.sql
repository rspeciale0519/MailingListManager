-- Migration: 003_create_data_management_layer
-- Description: Create Data Management tables (lists, contacts, tags, segments, custom_fields)
-- Date: 2025-11-19

-- ============================================================
-- LISTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lists (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Identity
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50), -- Hex color for UI
  icon VARCHAR(50), -- Icon identifier

  -- Metadata
  tags TEXT[] DEFAULT '{}',

  -- Statistics (cached)
  contact_count INTEGER DEFAULT 0,
  last_import_at TIMESTAMPTZ,

  -- Ownership
  created_by UUID REFERENCES users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft Delete
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT lists_org_name_unique UNIQUE(org_id, name) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lists_org ON lists(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lists_created_by ON lists(created_by);
CREATE INDEX IF NOT EXISTS idx_lists_updated ON lists(org_id, updated_at DESC);

COMMENT ON TABLE lists IS 'Collections of contacts. Each list belongs to one org.';


-- ============================================================
-- TAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Identity
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL, -- URL-friendly, lowercase

  -- Display
  color VARCHAR(50) DEFAULT '#3B82F6', -- Hex color
  icon VARCHAR(50),
  description TEXT,

  -- Usage Stats (cached)
  contact_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(org_id, slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tags_org ON tags(org_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(org_id, slug);

COMMENT ON TABLE tags IS 'Tag definitions. Tags stored denormalized in contacts.tags array.';


-- ============================================================
-- CONTACTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant & List
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,

  -- Core Identity Fields (Encrypted at application layer)
  email VARCHAR(500), -- Encrypted, stores base64 ciphertext
  email_hash VARCHAR(64), -- HMAC-SHA256 for search without decryption

  phone VARCHAR(500), -- Encrypted
  phone_hash VARCHAR(64),

  first_name VARCHAR(500), -- Encrypted
  last_name VARCHAR(500), -- Encrypted
  full_name VARCHAR(1000), -- Computed: first + last

  company VARCHAR(500), -- Encrypted
  title VARCHAR(500),
  department VARCHAR(255),

  -- Address Fields (Encrypted)
  address_line1 VARCHAR(500),
  address_line2 VARCHAR(500),
  city VARCHAR(500),
  state VARCHAR(100),
  postal_code VARCHAR(100),
  country VARCHAR(100),

  -- Standardized/Validated Address Fields
  address_line1_std VARCHAR(500),
  address_line2_std VARCHAR(500),
  city_std VARCHAR(500),
  state_std VARCHAR(100),
  postal_code_std VARCHAR(100),
  country_std VARCHAR(100),

  -- Validation Metadata
  usps_status VARCHAR(50), -- Deliverable | Undeliverable | Vacant | Unknown
  dpv_code VARCHAR(10),
  dpv_footnotes VARCHAR(50),
  carrier_route VARCHAR(10),
  validation_timestamp TIMESTAMPTZ,
  validation_source VARCHAR(50), -- accuzip | usps
  validation_confidence DECIMAL(3,2),

  -- Skip Trace Results
  skiptrace_emails JSONB, -- Array of additional emails
  skiptrace_phones JSONB, -- Array of additional phones
  skiptrace_addresses JSONB, -- Array of alternative addresses
  skiptrace_relatives JSONB, -- Array of relative objects
  skiptrace_score INTEGER,
  skiptrace_provider VARCHAR(50),
  skiptrace_timestamp TIMESTAMPTZ,

  -- Custom Fields (Flexible JSONB)
  custom_fields JSONB DEFAULT '{}'::JSONB,

  -- Tags
  tags TEXT[] DEFAULT '{}',

  -- Import Tracking
  import_id UUID, -- Will be added as FK after imports table exists
  import_batch_seq INTEGER,
  import_source VARCHAR(255), -- Original filename

  -- Deduplication Tracking
  merged_from UUID[], -- Array of contact IDs merged into this one
  is_primary BOOLEAN DEFAULT TRUE, -- FALSE if merged into another contact
  merged_into UUID REFERENCES contacts(id) ON DELETE SET NULL,
  merge_timestamp TIMESTAMPTZ,

  -- Metadata
  source VARCHAR(100), -- import | manual | api | crm_sync
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'bounced', 'unsubscribed', 'deleted')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,

  -- Soft Delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_org_list ON contacts(org_id, list_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_email_hash ON contacts(org_id, email_hash) WHERE email_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_phone_hash ON contacts(org_id, phone_hash) WHERE phone_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_contacts_import ON contacts(import_id, import_batch_seq);
CREATE INDEX IF NOT EXISTS idx_contacts_merged ON contacts(merged_into) WHERE merged_into IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(org_id, status);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_updated ON contacts(org_id, updated_at DESC);

-- Full-Text Search Index
CREATE INDEX IF NOT EXISTS idx_contacts_fts ON contacts USING GIN(
  to_tsvector('english',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(company, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(state, '')
  )
) WHERE deleted_at IS NULL;

-- Custom Fields Index
CREATE INDEX IF NOT EXISTS idx_contacts_custom_fields ON contacts USING GIN(custom_fields);

COMMENT ON TABLE contacts IS 'Contact records. PII fields encrypted at application layer before storage.';
COMMENT ON COLUMN contacts.email_hash IS 'HMAC-SHA256 hash of normalized email for search without decryption.';
COMMENT ON COLUMN contacts.merged_from IS 'IDs of contacts that were merged into this record during deduplication.';


-- ============================================================
-- SEGMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS segments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Identity
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(50),

  -- Filter Definition
  filter_definition JSONB NOT NULL,

  -- Behavior
  auto_update BOOLEAN DEFAULT TRUE, -- Recalculate on data changes
  snapshot_at TIMESTAMPTZ, -- For frozen segments (Enterprise)

  -- Cached Results
  cached_count INTEGER,
  cached_contact_ids UUID[], -- Materialized list (for small segments)
  cached_at TIMESTAMPTZ,
  cache_valid BOOLEAN DEFAULT TRUE,

  -- Ownership
  created_by UUID REFERENCES users(id),
  shared_with UUID[], -- User IDs who can access this segment

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft Delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_segments_org ON segments(org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_segments_created_by ON segments(created_by);
CREATE INDEX IF NOT EXISTS idx_segments_cache_valid ON segments(org_id, cache_valid) WHERE cache_valid = FALSE;

COMMENT ON TABLE segments IS 'Dynamic contact subsets based on filters. Cached for performance.';


-- ============================================================
-- CUSTOM_FIELDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS custom_fields (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE, -- NULL = org-wide

  -- Definition
  field_name VARCHAR(255) NOT NULL,
  field_key VARCHAR(255) NOT NULL, -- Normalized key for storage
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('string', 'number', 'boolean', 'date', 'enum', 'json')),

  -- Validation
  validation_rules JSONB,

  -- Defaults & Computed
  default_value TEXT,
  computed_formula TEXT, -- e.g., "concat(first_name, ' ', last_name)"
  is_computed BOOLEAN DEFAULT FALSE,

  -- Privacy & Access
  is_pii BOOLEAN DEFAULT FALSE,
  visibility JSONB DEFAULT '{"read": ["all"], "export": ["account_owner"]}'::JSONB,

  -- Indexing
  index_hint VARCHAR(50), -- btree | gin | none
  index_status VARCHAR(50) DEFAULT 'pending', -- pending | creating | ready | failed

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(org_id, field_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_fields_org ON custom_fields(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_list ON custom_fields(list_id) WHERE list_id IS NOT NULL;

COMMENT ON TABLE custom_fields IS 'Schema registry for user-defined custom fields.';
