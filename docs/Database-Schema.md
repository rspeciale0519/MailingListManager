# Database Schema Documentation
## Mailing List Manager SaaS Platform

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Database:** PostgreSQL 15+

---

## Table of Contents
1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Relationships & Foreign Keys](#relationships--foreign-keys)
4. [Indexes](#indexes)
5. [Row-Level Security (RLS)](#row-level-security-rls)
6. [Partitioning Strategy](#partitioning-strategy)
7. [Migrations](#migrations)
8. [Data Retention](#data-retention)

---

## Schema Overview

### Database Structure

```
mailing_list_db
├── Platform Layer (No org_id)
│   ├── users
│   └── (platform-level audit events)
│
├── Organization Layer (Has org_id)
│   ├── orgs
│   ├── org_memberships
│   ├── billing_subscriptions
│   ├── usage_counters
│   │
│   ├── Data Management
│   │   ├── lists
│   │   ├── contacts
│   │   ├── tags
│   │   ├── segments
│   │   └── custom_fields
│   │
│   ├── Operations
│   │   ├── imports
│   │   ├── import_rows
│   │   ├── exports
│   │   ├── dedup_runs
│   │   ├── dedup_merges
│   │   ├── validation_jobs
│   │   └── skiptrace_jobs
│   │
│   └── Audit & Compliance
│       └── events_audit
```

---

## Core Tables

### Platform Layer

#### users
**Purpose:** Platform-level user identities (exists before org membership)

```sql
CREATE TABLE users (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255), -- NULL for OAuth-only users
  
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

-- Indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id) WHERE oauth_provider IS NOT NULL;
CREATE INDEX idx_users_platform_role ON users(platform_role) WHERE platform_role != 'none';
CREATE INDEX idx_users_status ON users(status);

-- Comments
COMMENT ON TABLE users IS 'Platform-level user identities. Users can be members of multiple orgs.';
COMMENT ON COLUMN users.platform_role IS 'Platform-wide privileges. super_admin has global access, admin has delegated access, none is normal user.';
```

#### refresh_tokens
**Purpose:** Track refresh tokens for JWT authentication

```sql
CREATE TABLE refresh_tokens (
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

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash) WHERE NOT revoked;
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE NOT revoked;
```

---

### Organization Layer

#### orgs
**Purpose:** Organization/tenant entities

```sql
CREATE TABLE orgs (
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
  /*
    Example settings structure:
    {
      "default_country": "US",
      "timezone": "America/New_York",
      "date_format": "MM/DD/YYYY",
      "formatting_rules": {
        "company_designator_punctuation": true,
        "suffix_punctuation": true,
        "preserve_brand_acronyms": true
      },
      "import_defaults": {
        "auto_dedup": true,
        "auto_tag": false
      }
    }
  */
  
  -- Feature Overrides (Super Admin can override plan limits)
  feature_overrides JSONB DEFAULT '{}'::JSONB,
  /*
    Example overrides:
    {
      "max_contacts": 100000,
      "max_lists": 50,
      "api_rate_limit": 5000,
      "enable_sso": true,
      "enable_api": true
    }
  */
  
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

-- Indexes
CREATE INDEX idx_orgs_slug ON orgs(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_orgs_plan ON orgs(plan);
CREATE INDEX idx_orgs_status ON orgs(status);
CREATE INDEX idx_orgs_trial ON orgs(trial_ends_at) WHERE trial_ends_at IS NOT NULL AND status = 'active';

COMMENT ON TABLE orgs IS 'Organizations (tenants). Each org is completely isolated.';
COMMENT ON COLUMN orgs.encryption_key_id IS 'AWS KMS key ID for encrypting PII fields in this org.';
```

#### org_memberships
**Purpose:** Links users to organizations with roles

```sql
CREATE TABLE org_memberships (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Role within org
  org_role VARCHAR(50) NOT NULL CHECK (org_role IN ('account_owner', 'team_member', 'org_admin_delegate')),
  /*
    - account_owner: Owns the org, full control
    - team_member: Limited by permission toggles
    - org_admin_delegate: Platform admin with time-bound access
  */
  
  -- Permissions (for team_member role)
  permissions JSONB DEFAULT '{}'::JSONB,
  /*
    Example permissions:
    {
      "imports_create": true,
      "contacts_read": true,
      "contacts_update": true,
      "contacts_delete": false,
      "contacts_bulk_edit": true,
      "tags_manage": true,
      "dedup_run": false,
      "exports_create": true,
      "segments_manage": false,
      "audit_view": false,
      "schema_manage": false
    }
  */
  
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

-- Indexes
CREATE INDEX idx_org_memberships_user ON org_memberships(user_id);
CREATE INDEX idx_org_memberships_org ON org_memberships(org_id);
CREATE INDEX idx_org_memberships_role ON org_memberships(org_id, org_role);
CREATE INDEX idx_org_memberships_expires ON org_memberships(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_org_memberships_invitation ON org_memberships(invitation_token) WHERE invitation_token IS NOT NULL;

COMMENT ON TABLE org_memberships IS 'Links users to orgs. A user can be member of multiple orgs.';
COMMENT ON COLUMN org_memberships.org_role IS 'Role determines permission scope. account_owner has full access.';
```

---

### Data Management Tables

#### lists
**Purpose:** Collections of contacts within an organization

```sql
CREATE TABLE lists (
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
CREATE INDEX idx_lists_org ON lists(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lists_created_by ON lists(created_by);
CREATE INDEX idx_lists_updated ON lists(org_id, updated_at DESC);

-- Row-Level Security
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON lists
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE lists IS 'Collections of contacts. Each list belongs to one org.';
```

#### contacts
**Purpose:** Contact records with PII encryption

```sql
CREATE TABLE contacts (
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
  import_id UUID REFERENCES imports(id) ON DELETE SET NULL,
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
CREATE INDEX idx_contacts_org_list ON contacts(org_id, list_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email_hash ON contacts(org_id, email_hash) WHERE email_hash IS NOT NULL;
CREATE INDEX idx_contacts_phone_hash ON contacts(org_id, phone_hash) WHERE phone_hash IS NOT NULL;
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_import ON contacts(import_id, import_batch_seq);
CREATE INDEX idx_contacts_merged ON contacts(merged_into) WHERE merged_into IS NOT NULL;
CREATE INDEX idx_contacts_status ON contacts(org_id, status);
CREATE INDEX idx_contacts_created ON contacts(org_id, created_at DESC);
CREATE INDEX idx_contacts_updated ON contacts(org_id, updated_at DESC);

-- Full-Text Search Index
CREATE INDEX idx_contacts_fts ON contacts USING GIN(
  to_tsvector('english', 
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(company, '') || ' ' ||
    COALESCE(city, '') || ' ' ||
    COALESCE(state, '')
  )
) WHERE deleted_at IS NULL;

-- Custom Fields Index (for common searches)
CREATE INDEX idx_contacts_custom_fields ON contacts USING GIN(custom_fields);

-- Row-Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON contacts
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE contacts IS 'Contact records. PII fields encrypted at application layer before storage.';
COMMENT ON COLUMN contacts.email_hash IS 'HMAC-SHA256 hash of normalized email for search without decryption.';
COMMENT ON COLUMN contacts.merged_from IS 'IDs of contacts that were merged into this record during deduplication.';
```

#### tags
**Purpose:** Tag definitions for categorizing contacts

```sql
CREATE TABLE tags (
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
CREATE INDEX idx_tags_org ON tags(org_id);
CREATE INDEX idx_tags_slug ON tags(org_id, slug);

-- Row-Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tags
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE tags IS 'Tag definitions. Tags stored denormalized in contacts.tags array.';
```

#### segments
**Purpose:** Dynamic subsets of contacts based on filter criteria

```sql
CREATE TABLE segments (
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
  /*
    Example structure:
    {
      "type": "and",
      "conditions": [
        { "field": "state", "operator": "eq", "value": "TX" },
        { "field": "tags", "operator": "contains", "value": "VIP" },
        {
          "type": "or",
          "conditions": [
            { "field": "created_at", "operator": "gt", "value": "2024-01-01" },
            { "field": "email", "operator": "contains", "value": "@gmail.com" }
          ]
        }
      ]
    }
  */
  
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
CREATE INDEX idx_segments_org ON segments(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_segments_created_by ON segments(created_by);
CREATE INDEX idx_segments_cache_valid ON segments(org_id, cache_valid) WHERE cache_valid = FALSE;

-- Row-Level Security
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON segments
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE segments IS 'Dynamic contact subsets based on filters. Cached for performance.';
```

#### custom_fields
**Purpose:** Schema registry for custom fields added by users

```sql
CREATE TABLE custom_fields (
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
  /*
    Example:
    {
      "required": false,
      "min_length": 5,
      "max_length": 100,
      "pattern": "^[A-Z]{2,5}$",
      "min": 0,
      "max": 1000,
      "allowed_values": ["option1", "option2"]
    }
  */
  
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
CREATE INDEX idx_custom_fields_org ON custom_fields(org_id);
CREATE INDEX idx_custom_fields_list ON custom_fields(list_id) WHERE list_id IS NOT NULL;

-- Row-Level Security
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON custom_fields
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE custom_fields IS 'Schema registry for user-defined custom fields.';
```

---

### Operations Tables

#### imports
**Purpose:** Track import jobs and their status

```sql
CREATE TABLE imports (
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
  /*
    Example:
    {
      "mappings": [
        {
          "source_header": "Email Address",
          "target_field": "email",
          "confidence": 0.95,
          "transform": "lowercase|trim"
        },
        {
          "source_header": "First",
          "target_field": "first_name",
          "confidence": 0.90
        }
      ],
      "conflicts": [],
      "unmapped": ["Custom Field 1"],
      "new_fields": ["Custom Field 1"]
    }
  */
  
  -- Options
  options JSONB DEFAULT '{}'::JSONB,
  /*
    {
      "skip_duplicates": true,
      "update_existing": false,
      "auto_dedup": true,
      "auto_tag": "imported-2025-11-11"
    }
  */
  
  -- Progress
  total_rows INTEGER,
  processed_rows INTEGER DEFAULT 0,
  valid_rows INTEGER DEFAULT 0,
  invalid_rows INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  
  -- Statistics
  stats JSONB DEFAULT '{}'::JSONB,
  /*
    {
      "parse_time_ms": 1234,
      "validate_time_ms": 5678,
      "commit_time_ms": 2345,
      "errors_by_type": { "invalid_email": 5, "missing_required": 3 }
    }
  */
  
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
CREATE INDEX idx_imports_org ON imports(org_id);
CREATE INDEX idx_imports_list ON imports(list_id);
CREATE INDEX idx_imports_status ON imports(org_id, status);
CREATE INDEX idx_imports_created ON imports(org_id, created_at DESC);
CREATE INDEX idx_imports_created_by ON imports(created_by);

-- Row-Level Security
ALTER TABLE imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON imports
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE imports IS 'Import job tracking. Each import creates contacts in target list.';
```

#### import_rows
**Purpose:** Staging table for imported rows during validation

```sql
CREATE TABLE import_rows (
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
CREATE INDEX idx_import_rows_import ON import_rows(import_id);
CREATE INDEX idx_import_rows_status ON import_rows(import_id, status);
CREATE INDEX idx_import_rows_contact ON import_rows(contact_id) WHERE contact_id IS NOT NULL;

-- Partition by import_id (for large imports)
-- ALTER TABLE import_rows PARTITION BY LIST (import_id);

COMMENT ON TABLE import_rows IS 'Staging for import validation. Rows cleaned up after import completes.';
```

#### exports
**Purpose:** Track export requests and generated files

```sql
CREATE TABLE exports (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Selection
  selection JSONB NOT NULL,
  /*
    {
      "type": "filter",
      "filter_id": "uuid",
      "contact_ids": ["uuid1", "uuid2"], // for explicit selection
      "segment_id": "uuid",
      "list_id": "uuid"
    }
  */
  
  -- Configuration
  columns TEXT[] NOT NULL, -- Which fields to export
  format VARCHAR(50) NOT NULL CHECK (format IN ('csv', 'xlsx', 'json', 'vcard')),
  options JSONB DEFAULT '{}'::JSONB,
  /*
    {
      "include_headers": true,
      "use_formatted": true,
      "delimiter": ",",
      "encoding": "UTF-8",
      "compression": "gzip"
    }
  */
  
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
CREATE INDEX idx_exports_org ON exports(org_id);
CREATE INDEX idx_exports_status ON exports(org_id, status);
CREATE INDEX idx_exports_created ON exports(org_id, created_at DESC);
CREATE INDEX idx_exports_created_by ON exports(created_by);
CREATE INDEX idx_exports_expires ON exports(expires_at) WHERE status = 'complete' AND expires_at < NOW();

-- Row-Level Security
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON exports
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE exports IS 'Export job tracking. Files auto-deleted after expiration.';
```

#### dedup_runs
**Purpose:** Deduplication job tracking

```sql
CREATE TABLE dedup_runs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant & Scope
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE SET NULL, -- NULL = all lists
  
  -- Criteria
  criteria JSONB NOT NULL,
  /*
    {
      "name": "Email Dedup",
      "fields": [
        { "field": "email", "weight": 1.0, "normalize": true }
      ],
      "fuzzy": {
        "enabled": false,
        "algorithm": "jaro_winkler",
        "threshold": 0.85
      }
    }
  */
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'clustering', 'review', 'applying', 'complete', 'failed', 'canceled'
  )),
  
  -- Results
  total_contacts INTEGER,
  duplicate_contacts INTEGER,
  cluster_count INTEGER,
  clusters JSONB, -- Array of cluster summaries (full data separate)
  /*
    [
      {
        "cluster_id": "cluster-1",
        "confidence": 0.95,
        "member_count": 3,
        "reason": "email exact match",
        "survivor_id": null,
        "status": "pending"
      }
    ]
  */
  
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
CREATE INDEX idx_dedup_runs_org ON dedup_runs(org_id);
CREATE INDEX idx_dedup_runs_list ON dedup_runs(list_id) WHERE list_id IS NOT NULL;
CREATE INDEX idx_dedup_runs_status ON dedup_runs(org_id, status);
CREATE INDEX idx_dedup_runs_created ON dedup_runs(org_id, created_at DESC);

-- Row-Level Security
ALTER TABLE dedup_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON dedup_runs
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE dedup_runs IS 'Deduplication job tracking with clustering results.';
```

#### dedup_clusters
**Purpose:** Detailed cluster data for review (separate from dedup_runs for size)

```sql
CREATE TABLE dedup_clusters (
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
CREATE INDEX idx_dedup_clusters_run ON dedup_clusters(dedup_run_id);
CREATE INDEX idx_dedup_clusters_status ON dedup_clusters(dedup_run_id, status);

COMMENT ON TABLE dedup_clusters IS 'Detailed cluster data for dedup review. Cleaned up after run completes.';
```

#### dedup_merges
**Purpose:** Audit trail of merge transactions (for undo)

```sql
CREATE TABLE dedup_merges (
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
  /*
    {
      "survivor": { ... full contact data },
      "merged": [
        { "id": "uuid1", "data": {...} },
        { "id": "uuid2", "data": {...} }
      ],
      "field_resolutions": {
        "email": { "source": "survivor", "value": "..." },
        "phone": { "source": "merged[0]", "value": "..." }
      }
    }
  */
  
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
CREATE INDEX idx_dedup_merges_run ON dedup_merges(dedup_run_id);
CREATE INDEX idx_dedup_merges_survivor ON dedup_merges(survivor_id);
CREATE INDEX idx_dedup_merges_undo ON dedup_merges(can_undo, undo_expires_at) WHERE can_undo = TRUE;

COMMENT ON TABLE dedup_merges IS 'Merge transaction audit for undo capability. Snapshots deleted after retention.';
```

#### validation_jobs
**Purpose:** Address validation job tracking (AccuZip)

```sql
CREATE TABLE validation_jobs (
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
  /*
    {
      "first_name": "first_name",
      "last_name": "last_name",
      "address_line1": "address_line1",
      "city": "city",
      "state": "state",
      "postal_code": "postal_code"
    }
  */
  
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
CREATE INDEX idx_validation_jobs_org ON validation_jobs(org_id);
CREATE INDEX idx_validation_jobs_status ON validation_jobs(org_id, status);
CREATE INDEX idx_validation_jobs_created ON validation_jobs(org_id, created_at DESC);

-- Row-Level Security
ALTER TABLE validation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON validation_jobs
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE validation_jobs IS 'Address validation job tracking via AccuZip/USPS. See docs/API-AccuZip.md for field mappings and integration details.';
```

**Field Mapping Reference:**
- `input_mapping`: Maps MLM contact fields → AccuZIP input parameters (see [API-AccuZip.md Section 18.2](API-AccuZip.md#182-point-of-entry-api-mlm--accuzip-parameters))
- `results`: Stores AccuZIP validated_address response (see [API-AccuZip.md Section 18.3](API-AccuZip.md#183-accuzip-response--mlm-database-fields))
- For complete field mapping tables and transformation examples, see [AccuZIP Integration Guide](API-AccuZip.md)

#### skiptrace_jobs
**Purpose:** Skip trace job tracking

```sql
CREATE TABLE skiptrace_jobs (
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
CREATE INDEX idx_skiptrace_jobs_org ON skiptrace_jobs(org_id);
CREATE INDEX idx_skiptrace_jobs_status ON skiptrace_jobs(org_id, status);
CREATE INDEX idx_skiptrace_jobs_created ON skiptrace_jobs(org_id, created_at DESC);

-- Row-Level Security
ALTER TABLE skiptrace_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON skiptrace_jobs
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE skiptrace_jobs IS 'Skip trace enrichment job tracking.';
```

---

### Audit & Compliance

#### events_audit
**Purpose:** Comprehensive audit log of all significant actions

```sql
CREATE TABLE events_audit (
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
  /*
    Examples:
    - auth.login
    - auth.logout
    - auth.mfa_enabled
    - contacts.created
    - contacts.updated
    - contacts.deleted
    - imports.started
    - imports.completed
    - exports.created
    - dedup.run_started
    - dedup.merge_applied
    - permissions.updated
    - org.settings_updated
  */
  
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
  /*
    {
      "impersonator_id": "uuid",
      "impersonator_email": "admin@example.com",
      "reason": "Customer support request #1234",
      "expires_at": "2025-11-11T18:00:00Z"
    }
  */
  
  -- Metadata
  metadata JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_audit_org_ts ON events_audit(org_id, created_at DESC);
CREATE INDEX idx_events_audit_actor_ts ON events_audit(actor_id, created_at DESC);
CREATE INDEX idx_events_audit_resource ON events_audit(resource_type, resource_id);
CREATE INDEX idx_events_audit_action ON events_audit(action, created_at DESC);
CREATE INDEX idx_events_audit_impersonation ON events_audit((impersonation_context->>'impersonator_id')) 
  WHERE impersonation_context IS NOT NULL;
CREATE INDEX idx_events_audit_ts ON events_audit(created_at DESC);

-- Partitioning by month (for large volumes)
-- ALTER TABLE events_audit PARTITION BY RANGE (created_at);

COMMENT ON TABLE events_audit IS 'Immutable audit log. All significant actions logged here.';
COMMENT ON COLUMN events_audit.impersonation_context IS 'Set when platform admin accesses org data.';
```

---

### Billing & Usage

#### billing_subscriptions
**Purpose:** Stripe subscription tracking

```sql
CREATE TABLE billing_subscriptions (
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
CREATE INDEX idx_billing_subscriptions_org ON billing_subscriptions(org_id);
CREATE INDEX idx_billing_subscriptions_stripe_customer ON billing_subscriptions(stripe_customer_id);
CREATE INDEX idx_billing_subscriptions_status ON billing_subscriptions(status);

COMMENT ON TABLE billing_subscriptions IS 'Stripe subscription data synced via webhooks.';
```

#### usage_counters
**Purpose:** Track usage metrics for quota enforcement

```sql
CREATE TABLE usage_counters (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- Metric
  metric VARCHAR(100) NOT NULL,
  /*
    - contacts_total
    - contacts_current_month
    - lists_total
    - imports_current_month
    - exports_current_month
    - api_calls_current_day
    - api_calls_current_month
    - storage_bytes
    - validation_credits_used
    - skiptrace_credits_used
  */
  
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
CREATE INDEX idx_usage_counters_org ON usage_counters(org_id);
CREATE INDEX idx_usage_counters_metric ON usage_counters(org_id, metric);
CREATE INDEX idx_usage_counters_period ON usage_counters(period, period_start);

-- Row-Level Security
ALTER TABLE usage_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON usage_counters
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

COMMENT ON TABLE usage_counters IS 'Usage tracking for quota enforcement and billing.';
```

---

## Relationships & Foreign Keys

**Visualization:**

```
users (1) ──────> (N) org_memberships (N) <────── (1) orgs
                           │
                           │
                           ▼
                     permissions
                           
orgs (1) ──────> (N) lists (1) ──────> (N) contacts
 │                                           │
 │                                           │
 ├───────> (N) tags                         │
 ├───────> (N) segments                     │
 ├───────> (N) imports ────────────────────┘
 ├───────> (N) exports
 ├───────> (N) dedup_runs
 ├───────> (N) validation_jobs
 ├───────> (N) skiptrace_jobs
 ├───────> (N) events_audit
 ├───────> (1) billing_subscriptions
 └───────> (N) usage_counters

contacts (N) <──────> (N) tags (via contacts.tags array)
contacts (1) ──────> (1) contacts (merged_into self-reference)
```

---

## Indexes

### Primary Indexes (Already Defined Above)

All tables have indexes on:
- Primary keys (automatic)
- Foreign keys (for join performance)
- `org_id` (for RLS and tenant filtering)
- Timestamp columns (for sorting)

### Additional Composite Indexes

```sql
-- Frequently joined columns
CREATE INDEX idx_contacts_org_list_status ON contacts(org_id, list_id, status) 
  WHERE deleted_at IS NULL;

-- Search performance
CREATE INDEX idx_contacts_email_phone ON contacts(org_id, email_hash, phone_hash) 
  WHERE deleted_at IS NULL;

-- Audit queries
CREATE INDEX idx_events_audit_org_action_ts ON events_audit(org_id, action, created_at DESC);

-- Job monitoring
CREATE INDEX idx_imports_status_ts ON imports(status, created_at DESC) 
  WHERE status IN ('pending', 'processing');
```

---

## Row-Level Security (RLS)

### Enable RLS on All Tenant Tables

```sql
-- Template for tenant tables
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON {table_name}
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);
```

### Set Org Context Per Request

```typescript
// In application middleware
await db.$executeRaw`SET LOCAL app.org_id = ${orgId}`;

// All subsequent queries automatically filtered by RLS
const contacts = await db.contacts.findMany({}); // Only returns contacts for orgId
```

### Bypass RLS for Platform Admins

```sql
-- Create privileged role
CREATE ROLE platform_admin;

-- Grant bypass RLS privilege
GRANT BYPASSRLS ON DATABASE mailing_list_db TO platform_admin;

-- Platform admin operations use SECURITY DEFINER functions
CREATE FUNCTION admin_get_org_contacts(target_org_id UUID)
RETURNS SETOF contacts
SECURITY DEFINER
AS $$
  SELECT * FROM contacts WHERE org_id = target_org_id;
$$ LANGUAGE SQL;
```

---

## Partitioning Strategy

### Partition Large Tables by org_id (Enterprise Orgs)

```sql
-- Partition contacts for large enterprise orgs
CREATE TABLE contacts_partitioned (
  -- Same schema as contacts
  LIKE contacts INCLUDING ALL
) PARTITION BY LIST (org_id);

-- Create partition for specific org
CREATE TABLE contacts_org_{org_id} PARTITION OF contacts_partitioned
  FOR VALUES IN ('{org_id}');

-- Default partition for all other orgs
CREATE TABLE contacts_default PARTITION OF contacts_partitioned DEFAULT;
```

### Time-Based Partitioning for Audit Logs

```sql
-- Partition events_audit by month
CREATE TABLE events_audit_partitioned (
  -- Same schema
  LIKE events_audit INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create partitions per month
CREATE TABLE events_audit_2025_11 PARTITION OF events_audit_partitioned
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE events_audit_2025_12 PARTITION OF events_audit_partitioned
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Automated partition creation
CREATE EXTENSION IF NOT EXISTS pg_partman;
SELECT partman.create_parent('public.events_audit_partitioned', 'created_at', 'native', 'monthly');
```

---

## Migrations

### Migration Strategy

Use **Prisma Migrate** or custom migration scripts.

**Example Migration: Add Custom Fields Table**

```sql
-- migrations/002_add_custom_fields.sql

-- Create custom_fields table
CREATE TABLE custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  field_name VARCHAR(255) NOT NULL,
  field_key VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  validation_rules JSONB,
  default_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, field_key)
);

CREATE INDEX idx_custom_fields_org ON custom_fields(org_id);

-- Enable RLS
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON custom_fields
  FOR ALL TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

-- Rollback
-- DROP TABLE custom_fields;
```

### Prisma Schema Example

```prisma
// prisma/schema.prisma
model Contact {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  orgId         String   @map("org_id") @db.Uuid
  listId        String   @map("list_id") @db.Uuid
  email         String?  @db.VarChar(500)
  emailHash     String?  @map("email_hash") @db.VarChar(64)
  phone         String?  @db.VarChar(500)
  phoneHash     String?  @map("phone_hash") @db.VarChar(64)
  firstName     String?  @map("first_name") @db.VarChar(500)
  lastName      String?  @map("last_name") @db.VarChar(500)
  customFields  Json?    @map("custom_fields") @db.JsonB
  tags          String[] @default([])
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz
  
  org           Org      @relation(fields: [orgId], references: [id], onDelete: Cascade)
  list          List     @relation(fields: [listId], references: [id], onDelete: Cascade)
  
  @@index([orgId, listId])
  @@index([orgId, emailHash])
  @@map("contacts")
}
```

---

## Data Retention

### Retention Policies by Plan

| Data Type | Free | Starter | Pro | Enterprise |
|-----------|------|---------|-----|------------|
| Contacts | Forever | Forever | Forever | Forever |
| Import Jobs | 30 days | 90 days | 1 year | 2 years |
| Export Files | 24 hours | 7 days | 30 days | 90 days |
| Audit Logs | 30 days | 90 days | 1 year | 2-7 years |
| Dedup Snapshots | 7 days | 30 days | 90 days | 1 year |
| Soft-Deleted Contacts | 30 days | 90 days | 1 year | Configurable |

### Automated Cleanup Jobs

```sql
-- Delete expired export files
DELETE FROM exports
WHERE status = 'complete'
  AND expires_at < NOW() - INTERVAL '1 day';

-- Cleanup old import_rows (after import complete)
DELETE FROM import_rows
WHERE import_id IN (
  SELECT id FROM imports
  WHERE status IN ('complete', 'failed')
    AND completed_at < NOW() - INTERVAL '90 days'
);

-- Archive old audit logs
INSERT INTO events_audit_archive
SELECT * FROM events_audit
WHERE created_at < NOW() - INTERVAL '2 years';

DELETE FROM events_audit
WHERE created_at < NOW() - INTERVAL '2 years';
```

---

**End of Database Schema Documentation**

**Next Document:** API Specification
