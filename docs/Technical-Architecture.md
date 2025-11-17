# Technical Architecture Document
## Mailing List Manager SaaS Platform

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Status:** Development Ready

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Architecture](#data-architecture)
5. [Security Architecture](#security-architecture)
6. [API Design](#api-design)
7. [Infrastructure & Deployment](#infrastructure--deployment)
8. [Scalability & Performance](#scalability--performance)
9. [Monitoring & Observability](#monitoring--observability)
10. [Disaster Recovery](#disaster-recovery)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile Web  │  │   API SDK    │          │
│  │  (React SPA) │  │ (Responsive) │  │  (REST/GQL)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         CDN Layer                                │
│                    (Cloudflare / CloudFront)                     │
│             Static Assets, Edge Caching, DDoS Protection         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer                               │
│                    (ALB / NGINX / Traefik)                       │
│                  SSL Termination, Rate Limiting                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                 │
│              Authentication, Authorization, Routing              │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   API Service    │ │ Worker Queue │ │ WebSocket    │
│   (Node.js/Go)   │ │ (BullMQ/SQS) │ │   Service    │
│                  │ │              │ │              │
│ • REST API       │ │ • Imports    │ │ • Real-time  │
│ • GraphQL        │ │ • Exports    │ │ • Progress   │
│ • Auth           │ │ • Dedup      │ │ • Collab     │
│ • Business Logic │ │ • Validation │ │              │
└──────────────────┘ └──────────────┘ └──────────────┘
        │                    │                 │
        └────────────────────┼─────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │    Redis     │  │   S3/Blob    │          │
│  │  (Primary)   │  │   (Cache)    │  │   Storage    │          │
│  │              │  │              │  │              │          │
│  │ • Transact   │  │ • Sessions   │  │ • Files      │          │
│  │ • Contacts   │  │ • Rate Limit │  │ • Exports    │          │
│  │ • Audit      │  │ • Job Queue  │  │ • Backups    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Modular Architecture**: No file exceeds 450 lines of code
2. **Separation of Concerns**: Clear boundaries between layers
3. **Scalability**: Horizontal scaling for all stateless components
4. **Security First**: Defense in depth, least privilege access
5. **Multi-Tenancy**: Complete data isolation per organization
6. **API-First**: All features accessible via API
7. **Observability**: Comprehensive logging, metrics, and tracing

---

## Technology Stack

### Frontend
- **Framework**: React 18+ (with TypeScript)
- **State Management**: Zustand (lightweight) + React Query (server state)
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: TailwindCSS 3+
- **Data Grid**: TanStack Table (React Table v8)
- **Forms**: React Hook Form + Zod validation
- **Build Tool**: Vite
- **Testing**: Vitest + React Testing Library + Playwright

### Backend
- **Primary Language**: Node.js 20+ with TypeScript
- **Framework**: Fastify (high-performance REST API)
- **GraphQL**: Apollo Server (optional, for complex queries)
- **Validation**: Zod (shared schemas with frontend)
- **ORM**: Prisma (type-safe database access)
- **Job Queue**: BullMQ (Redis-backed)
- **Testing**: Jest + Supertest

**Alternative Backend (Performance-Critical Services):**
- **Language**: Go 1.21+
- **Framework**: Gin or Fiber
- **Use Cases**: Import workers, dedup engine, real-time services

### Database
- **Primary Database**: PostgreSQL 15+
  - Native JSON support
  - Full-text search (GIN indexes)
  - Row-Level Security (RLS)
  - Partitioning support
- **Cache**: Redis 7+ (Cluster mode for HA)
- **Search Engine**: PostgreSQL FTS (or Elasticsearch for enterprise)

### Storage
- **Object Storage**: AWS S3 (or compatible: MinIO, Cloudflare R2)
- **CDN**: Cloudflare (or AWS CloudFront)

### Infrastructure
- **Orchestration**: Kubernetes (or Docker Swarm for simpler deployments)
- **CI/CD**: GitHub Actions (or GitLab CI)
- **IaC**: Terraform + Helm charts
- **Cloud Provider**: AWS (or GCP, Azure, DigitalOcean)

### Security
- **Secrets Management**: AWS Secrets Manager (or HashiCorp Vault)
- **Encryption**: AWS KMS (or Vault Transit)
- **Auth**: JWT (access tokens) + Refresh tokens
- **SSO**: SAML 2.0, OAuth 2.0 (Auth0 or AWS Cognito)
- **MFA**: TOTP (via OTP libraries)

### Monitoring & Observability
- **Logs**: Structured JSON logs → Loki or CloudWatch
- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry → Jaeger or Tempo
- **APM**: DataDog or New Relic (optional)
- **Error Tracking**: Sentry

### DevOps Tools
- **Version Control**: Git (GitHub or GitLab)
- **Container Registry**: GitHub Container Registry (GHCR) or ECR
- **Reverse Proxy**: NGINX or Traefik
- **Load Balancer**: AWS ALB or HAProxy

---

## System Components

### 1. API Service (Node.js/TypeScript)

**Responsibilities:**
- Handle HTTP REST requests
- Authenticate and authorize requests
- Execute business logic
- Return responses

**Key Modules** (each <450 LOC):
```
src/
├── api/
│   ├── routes/
│   │   ├── auth.routes.ts          # Auth endpoints
│   │   ├── orgs.routes.ts          # Organization CRUD
│   │   ├── users.routes.ts         # User management
│   │   ├── lists.routes.ts         # List CRUD
│   │   ├── contacts.routes.ts      # Contact CRUD + search
│   │   ├── imports.routes.ts       # Import pipeline
│   │   ├── exports.routes.ts       # Export requests
│   │   ├── dedup.routes.ts         # Deduplication
│   │   ├── tags.routes.ts          # Tag management
│   │   ├── segments.routes.ts      # Segment CRUD
│   │   ├── validate.routes.ts      # Address validation
│   │   ├── skiptrace.routes.ts     # Skip trace
│   │   └── audit.routes.ts         # Audit log queries
│   ├── controllers/                # Request handlers
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── rbac.middleware.ts      # Permission checks
│   │   ├── rateLimit.middleware.ts # Rate limiting
│   │   ├── tenant.middleware.ts    # org_id injection
│   │   └── validation.middleware.ts# Schema validation
│   └── server.ts                   # Fastify app setup
├── services/                       # Business logic
│   ├── auth.service.ts
│   ├── org.service.ts
│   ├── user.service.ts
│   ├── contact.service.ts
│   ├── import.service.ts
│   ├── export.service.ts
│   ├── dedup.service.ts
│   ├── format.service.ts           # Data normalization
│   ├── policy.service.ts           # Permission engine
│   └── billing.service.ts
├── repositories/                   # Data access layer
│   ├── base.repository.ts          # Base CRUD operations
│   ├── contact.repository.ts
│   ├── org.repository.ts
│   └── audit.repository.ts
├── lib/                            # Shared utilities
│   ├── crypto.ts                   # Encryption helpers
│   ├── validators.ts               # Data validators
│   ├── formatters.ts               # Data formatters
│   ├── logger.ts                   # Structured logging
│   ├── cache.ts                    # Redis wrapper
│   ├── s3.ts                       # S3 client
│   └── queue.ts                    # Job queue client
└── types/                          # TypeScript types
    ├── api.types.ts
    ├── db.types.ts
    └── domain.types.ts
```

**Code Modularization Example:**

```typescript
// ❌ BAD: 800 LOC monolithic controller
// contacts.controller.ts

// ✅ GOOD: Split into focused modules (<450 LOC each)
// controllers/contacts/
//   ├── contacts.create.controller.ts      (150 LOC)
//   ├── contacts.update.controller.ts      (200 LOC)
//   ├── contacts.search.controller.ts      (300 LOC)
//   ├── contacts.bulk.controller.ts        (400 LOC)
//   └── contacts.delete.controller.ts      (100 LOC)
```

### 2. Worker Queue System (BullMQ + Redis)

**Responsibilities:**
- Execute long-running jobs asynchronously
- Retry failed jobs with exponential backoff
- Monitor job progress
- Scale horizontally

**Job Types:**
```
workers/
├── import.worker.ts                # Import pipeline jobs
│   ├── parseJob()
│   ├── validateJob()
│   ├── normalizeJob()
│   └── commitJob()
├── export.worker.ts                # Export generation
├── dedup.worker.ts                 # Deduplication clustering
├── validate.worker.ts              # Address validation (AccuZip)
├── skiptrace.worker.ts             # Skip trace enrichment
├── email.worker.ts                 # Transactional emails
└── cleanup.worker.ts               # Data retention cleanup
```

**Queue Configuration:**
```typescript
// lib/queue.config.ts
export const QUEUE_CONFIG = {
  imports: {
    concurrency: 5,
    limiter: { max: 100, duration: 60000 }, // 100 jobs/min
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  },
  exports: {
    concurrency: 10,
    limiter: { max: 200, duration: 60000 },
    attempts: 2
  },
  dedup: {
    concurrency: 3, // CPU-intensive
    limiter: { max: 50, duration: 60000 },
    attempts: 2
  },
  // ... other queues
};
```

### 3. Real-Time WebSocket Service

**Responsibilities:**
- Push progress updates to clients
- Collaborative editing notifications
- Live data refresh

**Technologies:**
- Socket.io (WebSocket library)
- Redis adapter for multi-instance scaling

**Events:**
```typescript
// Socket events
enum SocketEvents {
  // Import progress
  IMPORT_PROGRESS = 'import:progress',
  IMPORT_COMPLETE = 'import:complete',
  IMPORT_ERROR = 'import:error',
  
  // Export progress
  EXPORT_PROGRESS = 'export:progress',
  EXPORT_COMPLETE = 'export:complete',
  
  // Dedup progress
  DEDUP_PROGRESS = 'dedup:progress',
  DEDUP_COMPLETE = 'dedup:complete',
  
  // Real-time data updates
  CONTACT_UPDATED = 'contact:updated',
  CONTACT_DELETED = 'contact:deleted',
  TAG_ADDED = 'tag:added',
}
```

### 4. Policy Engine (Permissions)

**Responsibilities:**
- Evaluate access control decisions
- Cache policy results for performance
- Audit permission checks

**Policy Structure:**
```typescript
interface PolicyDecision {
  subject: string;      // user_id
  action: string;       // 'contacts:read', 'imports:create'
  resource: string;     // 'org:123/list:456'
  context: {
    org_id: string;
    plan: string;
    role: string;
    attributes: Record<string, any>;
  };
  decision: 'allow' | 'deny';
  reason?: string;
}
```

**Evaluation Logic:**
```typescript
// services/policy.service.ts (simplified)
class PolicyService {
  async evaluate(request: PolicyRequest): Promise<PolicyDecision> {
    // 1. Check cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;
    
    // 2. Load user's effective permissions
    const permissions = await this.loadPermissions(request.subject);
    
    // 3. Apply RBAC rules
    const rbacDecision = this.evaluateRBAC(permissions, request);
    
    // 4. Apply ABAC rules (plan, quota, org settings)
    const abacDecision = this.evaluateABAC(request.context);
    
    // 5. Combine decisions (both must allow)
    const finalDecision = rbacDecision && abacDecision 
      ? 'allow' 
      : 'deny';
    
    // 6. Cache result
    await this.cache.set(cacheKey, finalDecision, 300); // 5min TTL
    
    // 7. Audit decision
    await this.auditPolicyCheck(request, finalDecision);
    
    return { decision: finalDecision, ... };
  }
}
```

### 5. Data Formatting Service

**Responsibilities:**
- Normalize all input data
- Apply org-specific formatting rules
- Validate against schemas

**Formatters** (each <450 LOC):
```
services/formatters/
├── email.formatter.ts              # Email normalization
├── phone.formatter.ts              # Phone E.164 conversion
├── address.formatter.ts            # Address standardization
├── name.formatter.ts               # Name title-casing
├── company.formatter.ts            # Company name normalization
├── date.formatter.ts               # Date parsing & ISO conversion
└── custom.formatter.ts             # Custom field formatting
```

**Example: Email Formatter:**
```typescript
// services/formatters/email.formatter.ts
export class EmailFormatter {
  format(email: string, options?: FormatOptions): FormattedResult {
    // 1. Trim and lowercase
    let normalized = email.trim().toLowerCase();
    
    // 2. Validate RFC 5322
    if (!this.isValidEmail(normalized)) {
      return { valid: false, error: 'Invalid email format' };
    }
    
    // 3. Optional: Remove dots in Gmail local part
    if (options?.gmailDotRemoval && normalized.endsWith('@gmail.com')) {
      const [local, domain] = normalized.split('@');
      normalized = `${local.replace(/\./g, '')}@${domain}`;
    }
    
    // 4. Return formatted and raw
    return {
      valid: true,
      formatted: normalized,
      raw: email,
      changes: email !== normalized
    };
  }
}
```

---

## Data Architecture

### Multi-Tenancy Strategy

**Approach:** Soft multi-tenancy with Row-Level Security (RLS)

**Key Principles:**
1. All tenant tables include `org_id` column
2. PostgreSQL RLS policies enforce `org_id = current_setting('app.org_id')`
3. Application sets `org_id` in session context per request
4. No query can access data from other orgs

**RLS Policy Example:**
```sql
-- Enable RLS on contacts table
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see contacts from their org
CREATE POLICY tenant_isolation ON contacts
  FOR ALL
  TO authenticated_user
  USING (org_id = current_setting('app.org_id')::uuid);

-- Set org_id per request (in application)
-- SET LOCAL app.org_id = '123e4567-e89b-12d3-a456-426614174000';
```

**Platform Admin Access:**
- Super Admin and Admin Users bypass RLS via `SECURITY DEFINER` functions
- All access audited with impersonation context
- Time-bound delegated access with auto-expiry

### Database Schema (Simplified)

**Core Tables:**
```sql
-- Users (platform-level identity)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  platform_role VARCHAR(50) DEFAULT 'none', -- super_admin | admin | none
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active', -- active | suspended | deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations (tenants)
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL, -- free | starter | pro | enterprise
  status VARCHAR(50) DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  feature_overrides JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Org memberships (links users to orgs)
CREATE TABLE org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  org_role VARCHAR(50) NOT NULL, -- account_owner | team_member | org_admin_delegate
  status VARCHAR(50) DEFAULT 'active',
  permissions JSONB DEFAULT '{}', -- Effective permission set
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For time-bound delegated access
  UNIQUE(user_id, org_id)
);

-- Lists
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_lists_org ON lists(org_id);

-- Contacts (tenant-specific)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  
  -- Core fields (encrypted at application level)
  email VARCHAR(255),
  phone VARCHAR(50),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company VARCHAR(255),
  title VARCHAR(255),
  
  -- Address fields
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(255),
  state VARCHAR(100),
  postal_code VARCHAR(50),
  country VARCHAR(100),
  
  -- Custom fields (JSONB)
  custom_fields JSONB DEFAULT '{}',
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  import_id UUID,
  import_batch_seq INTEGER,
  merged_from UUID[], -- IDs of contacts merged into this one
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_contacts_org_list ON contacts(org_id, list_id);
CREATE INDEX idx_contacts_email ON contacts(org_id, email);
CREATE INDEX idx_contacts_phone ON contacts(org_id, phone);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_fts ON contacts USING GIN(
  to_tsvector('english', 
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(company, '')
  )
);

-- Imports
CREATE TABLE imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL, -- pending | parsing | validating | committing | complete | failed | canceled_partial | reverting
  source VARCHAR(255), -- File name
  file_ref VARCHAR(500), -- S3 key
  column_map JSONB, -- Source to target field mapping
  stats JSONB, -- { total: N, valid: N, invalid: N, duplicates: N }
  errors JSONB[], -- Per-row errors
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Import rows (staging)
CREATE TABLE import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
  row_idx INTEGER NOT NULL,
  raw_data JSONB NOT NULL,
  normalized_data JSONB,
  errors JSONB[],
  status VARCHAR(50) -- valid | invalid | skipped
);
CREATE INDEX idx_import_rows_import ON import_rows(import_id);

-- Dedup runs
CREATE TABLE dedup_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  list_id UUID REFERENCES lists(id) ON DELETE SET NULL,
  criteria JSONB NOT NULL, -- Match rules
  status VARCHAR(50), -- pending | clustering | review | applying | complete | failed
  clusters JSONB[], -- Array of cluster objects
  stats JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Dedup merge transactions (for undo)
CREATE TABLE dedup_merges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedup_run_id UUID REFERENCES dedup_runs(id) ON DELETE CASCADE,
  cluster_id VARCHAR(100),
  survivor_id UUID NOT NULL REFERENCES contacts(id),
  merged_ids UUID[] NOT NULL,
  snapshot JSONB NOT NULL, -- Pre-merge state
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  can_undo BOOLEAN DEFAULT TRUE
);

-- Exports
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  selection JSONB NOT NULL, -- Filter or contact IDs
  columns TEXT[] NOT NULL,
  format VARCHAR(50), -- csv | xlsx | json | vcard
  status VARCHAR(50), -- pending | processing | complete | failed
  file_ref VARCHAR(500), -- S3 key
  download_url TEXT, -- Pre-signed URL (expires)
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Segments
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  filter_definition JSONB NOT NULL,
  auto_update BOOLEAN DEFAULT TRUE,
  snapshot_at TIMESTAMPTZ, -- For frozen segments
  cached_count INTEGER,
  cached_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, name)
);

-- Audit log
CREATE TABLE events_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE SET NULL, -- NULL for platform-level events
  actor_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  before_state JSONB,
  after_state JSONB,
  diff JSONB, -- JSON diff of changes
  ip_address INET,
  user_agent TEXT,
  impersonation_context JSONB, -- { impersonator_id, reason, expires_at }
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_org_ts ON events_audit(org_id, created_at DESC);
CREATE INDEX idx_audit_actor ON events_audit(actor_id, created_at DESC);
CREATE INDEX idx_audit_resource ON events_audit(resource_type, resource_id);

-- Billing subscriptions
CREATE TABLE billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50), -- active | canceled | past_due
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage counters (for quota enforcement)
CREATE TABLE usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  metric VARCHAR(100) NOT NULL, -- contacts | lists | imports | exports | api_calls
  period VARCHAR(50) NOT NULL, -- daily | monthly | total
  period_start DATE,
  count BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, metric, period, period_start)
);
```

### Field-Level Encryption

**PII Fields** (encrypted at application layer before database write):
- `email`, `phone`, `first_name`, `last_name`, `address_line1`, `address_line2`

**Encryption Strategy:**
```typescript
// lib/crypto.ts
import { KMS } from 'aws-sdk';

class FieldEncryption {
  private kms: KMS;
  
  async encrypt(orgId: string, plaintext: string): Promise<string> {
    // 1. Get org-specific KMS key
    const keyId = await this.getOrgKMSKey(orgId);
    
    // 2. Encrypt using AWS KMS
    const { CiphertextBlob } = await this.kms.encrypt({
      KeyId: keyId,
      Plaintext: plaintext
    }).promise();
    
    // 3. Return base64-encoded ciphertext
    return CiphertextBlob!.toString('base64');
  }
  
  async decrypt(orgId: string, ciphertext: string): Promise<string> {
    // 1. Decode base64
    const buffer = Buffer.from(ciphertext, 'base64');
    
    // 2. Decrypt using KMS (automatically uses correct key)
    const { Plaintext } = await this.kms.decrypt({
      CiphertextBlob: buffer
    }).promise();
    
    return Plaintext!.toString('utf-8');
  }
}
```

**Searchable Encryption:**
- Store hashed versions alongside encrypted for search/dedup
- Use HMAC-SHA256 with org-specific salt

```typescript
// Search on email without decrypting
const emailHash = hmacSHA256(email.toLowerCase(), orgSalt);
const contacts = await db.contacts.findMany({
  where: { 
    org_id: orgId, 
    email_hash: emailHash 
  }
});
```

### Partitioning Strategy

**Partition large tables by `org_id` for enterprise customers:**

```sql
-- Partition contacts table
CREATE TABLE contacts_partitioned (
  -- Same columns as contacts
) PARTITION BY LIST (org_id);

-- Create partition per large org
CREATE TABLE contacts_org_123 PARTITION OF contacts_partitioned
  FOR VALUES IN ('123e4567-e89b-12d3-a456-426614174000');

-- Default partition for small orgs
CREATE TABLE contacts_default PARTITION OF contacts_partitioned DEFAULT;
```

---

## Security Architecture

### Authentication Flow

**JWT-Based Authentication:**

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │  API    │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  POST /auth/login                            │
     │  { email, password }                         │
     ├─────────────────────────────────────────────>│
     │                                              │
     │                   ┌──────────────────────┐   │
     │                   │ 1. Verify credentials │   │
     │                   │ 2. Check MFA if enabled│  │
     │                   │ 3. Generate tokens    │   │
     │                   └──────────────────────┘   │
     │                                              │
     │  { accessToken, refreshToken, user }         │
     │<─────────────────────────────────────────────┤
     │                                              │
     │  GET /api/contacts                           │
     │  Header: Authorization: Bearer <accessToken> │
     ├─────────────────────────────────────────────>│
     │                                              │
     │                   ┌──────────────────────┐   │
     │                   │ 1. Verify JWT        │   │
     │                   │ 2. Check expiry      │   │
     │                   │ 3. Extract user_id   │   │
     │                   │ 4. Load org_id       │   │
     │                   │ 5. Check permissions │   │
     │                   └──────────────────────┘   │
     │                                              │
     │  { contacts: [...] }                         │
     │<─────────────────────────────────────────────┤
```

**Token Structure:**

```typescript
// Access Token (JWT, short-lived: 15 minutes)
interface AccessToken {
  sub: string;        // user_id
  email: string;
  platform_role: string;
  orgs: Array<{       // User's org memberships
    org_id: string;
    org_role: string;
    permissions: string[];
  }>;
  iat: number;
  exp: number;
}

// Refresh Token (opaque, long-lived: 30 days)
// Stored in database with user_id, expires_at, revoked flag
```

### Authorization Middleware

**Request Flow:**

```typescript
// middleware/auth.middleware.ts
export async function authenticate(req, res, next) {
  // 1. Extract token from header
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // 2. Verify JWT signature and expiry
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // 3. Attach user to request
  req.user = decoded;
  
  next();
}

// middleware/tenant.middleware.ts
export async function injectTenant(req, res, next) {
  // 1. Extract org_id from URL or body
  const orgId = req.params.org_id || req.body.org_id;
  
  // 2. Verify user is member of this org
  const membership = req.user.orgs.find(o => o.org_id === orgId);
  if (!membership) {
    throw new ForbiddenError('Not a member of this organization');
  }
  
  // 3. Set org context in database session
  await db.$executeRaw`SET LOCAL app.org_id = ${orgId}`;
  
  // 4. Attach to request
  req.org_id = orgId;
  req.org_role = membership.org_role;
  req.permissions = membership.permissions;
  
  next();
}

// middleware/rbac.middleware.ts
export function requirePermission(action: string) {
  return async (req, res, next) => {
    const hasPermission = await policyService.evaluate({
      subject: req.user.sub,
      action,
      resource: `org:${req.org_id}`,
      context: {
        org_id: req.org_id,
        plan: req.org.plan,
        role: req.org_role,
        permissions: req.permissions
      }
    });
    
    if (hasPermission.decision === 'deny') {
      throw new ForbiddenError(hasPermission.reason);
    }
    
    next();
  };
}
```

**Usage in Routes:**
```typescript
// routes/contacts.routes.ts
router.get(
  '/orgs/:org_id/contacts',
  authenticate,           // Verify JWT
  injectTenant,          // Set org_id context
  requirePermission('contacts:read'), // Check permission
  contactsController.list
);

router.post(
  '/orgs/:org_id/contacts',
  authenticate,
  injectTenant,
  requirePermission('contacts:create'),
  validate(createContactSchema),
  contactsController.create
);
```

### Rate Limiting

**Redis-backed rate limiter:**

```typescript
// middleware/rateLimit.middleware.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rate_limit',
  points: 100,        // Number of requests
  duration: 60,       // Per 60 seconds
  blockDuration: 300  // Block for 5 minutes if exceeded
});

export async function rateLimitMiddleware(req, res, next) {
  const key = `${req.user.sub}:${req.org_id}`; // Per user per org
  
  try {
    await rateLimiter.consume(key, 1);
    next();
  } catch (error) {
    res.status(429).json({ 
      error: 'Too many requests',
      retryAfter: error.msBeforeNext / 1000 
    });
  }
}
```

**Tiered Rate Limits:**
```typescript
const RATE_LIMITS = {
  free: { points: 100, duration: 60 },      // 100 req/min
  starter: { points: 500, duration: 60 },   // 500 req/min
  pro: { points: 2000, duration: 60 },      // 2000 req/min
  enterprise: { points: 10000, duration: 60 } // 10k req/min
};
```

---

## API Design

### REST API Conventions

**Base URL:** `https://api.mailinglistmanager.com/v1`

**Common Patterns:**

1. **List Resources:**
   - `GET /orgs/:org_id/contacts?page=1&limit=50&filter=...&sort=...`
   - Response: `{ data: [...], meta: { page, limit, total, hasMore } }`

2. **Get Single Resource:**
   - `GET /orgs/:org_id/contacts/:contact_id`
   - Response: `{ data: { id, email, ... } }`

3. **Create Resource:**
   - `POST /orgs/:org_id/contacts`
   - Body: `{ email, first_name, ... }`
   - Response: `{ data: { id, ... } }` (201 Created)

4. **Update Resource:**
   - `PATCH /orgs/:org_id/contacts/:contact_id`
   - Body: `{ email: "new@example.com" }`
   - Response: `{ data: { id, ... } }` (200 OK)

5. **Delete Resource:**
   - `DELETE /orgs/:org_id/contacts/:contact_id`
   - Response: `{ success: true }` (204 No Content)

6. **Bulk Operations:**
   - `POST /orgs/:org_id/contacts/bulk`
   - Body: `{ selection: {...}, action: "delete", params: {...} }`
   - Response: `{ job_id: "..." }` (202 Accepted)

7. **Job Status:**
   - `GET /orgs/:org_id/jobs/:job_id`
   - Response: `{ status, progress, result }`

**Error Responses:**
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid email format",
    details: {
      field: "email",
      value: "not-an-email",
      constraint: "Must be valid email"
    }
  }
}
```

### GraphQL API (Optional, for Complex Queries)

**Schema Example:**
```graphql
type Query {
  org(id: ID!): Org
  contacts(
    orgId: ID!
    listId: ID
    filter: ContactFilterInput
    sort: ContactSortInput
    page: Int
    limit: Int
  ): ContactConnection!
}

type ContactConnection {
  edges: [ContactEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ContactEdge {
  node: Contact!
  cursor: String!
}

type Contact {
  id: ID!
  email: String
  phone: String
  firstName: String
  lastName: String
  fullName: String # Computed field
  address: Address
  tags: [Tag!]!
  customFields: JSON
  createdAt: DateTime!
  updatedAt: DateTime!
}

input ContactFilterInput {
  email: StringFilter
  tags: StringArrayFilter
  createdAt: DateRangeFilter
  and: [ContactFilterInput!]
  or: [ContactFilterInput!]
}

input StringFilter {
  eq: String
  ne: String
  contains: String
  startsWith: String
  endsWith: String
  in: [String!]
}
```

---

## Infrastructure & Deployment

### Deployment Architecture

**Kubernetes Cluster:**

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: ghcr.io/yourorg/mailing-list-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: LoadBalancer
  selector:
    app: api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}/api:${{ github.sha }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: azure/k8s-set-context@v3
        with:
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      - run: |
          kubectl set image deployment/api \
            api=ghcr.io/${{ github.repository }}/api:${{ github.sha }}
          kubectl rollout status deployment/api
```

### Environment Variables

```bash
# .env.production
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@db-host:5432/mailing_list_prod?sslmode=require
DATABASE_POOL_SIZE=20

# Redis
REDIS_URL=redis://:password@redis-host:6379/0
REDIS_TLS=true

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET=mailing-list-uploads-prod
KMS_KEY_ID=alias/mailing-list-prod

# Auth
JWT_SECRET=xxx
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=30d

# External Services
ACCUZIP_API_KEY=xxx
SKIPTRACE_PROVIDER_API_KEY=xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## Scalability & Performance

### Caching Strategy

**Cache Layers:**

1. **Application Cache (Redis):**
   - Session tokens
   - Permission decisions (5min TTL)
   - Segment counts (5min TTL)
   - Frequently accessed orgs/users

2. **Database Query Cache:**
   - Materialized views for complex queries
   - Query result caching in Redis

3. **CDN Cache:**
   - Static assets (JS, CSS, images)
   - Public API documentation

**Cache Invalidation:**
```typescript
// When contact updated, invalidate related caches
await Promise.all([
  cache.del(`contact:${contactId}`),
  cache.del(`list:${listId}:count`),
  cache.del(`segment:${segmentId}:count`),
  cache.invalidatePattern(`contacts:search:*`)
]);
```

### Database Optimization

**Index Strategy:**
- Compound indexes on frequently joined columns: `(org_id, list_id, created_at)`
- Partial indexes for common filters: `WHERE status = 'active'`
- GIN indexes for full-text search and JSONB queries
- Covering indexes to avoid table lookups

**Query Optimization:**
```typescript
// ❌ BAD: N+1 queries
for (const contact of contacts) {
  const tags = await db.tags.findMany({ where: { contact_id: contact.id } });
  contact.tags = tags;
}

// ✅ GOOD: Single query with join
const contacts = await db.contacts.findMany({
  where: { org_id, list_id },
  include: { tags: true }
});
```

**Connection Pooling:**
```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_timeout = 10
  connection_limit = 20
}
```

### Horizontal Scaling

**Stateless API Servers:**
- All state in database or Redis
- No in-memory session storage
- Scale API pods based on CPU/memory

**Worker Scaling:**
- Scale workers independently per queue
- CPU-intensive jobs (dedup) on compute-optimized instances
- IO-intensive jobs (imports) on balanced instances

**Auto-Scaling Configuration:**
```yaml
# k8s/api-hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Monitoring & Observability

### Structured Logging

```typescript
// lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers,
      org_id: req.org_id,
      user_id: req.user?.sub
    }),
    err: pino.stdSerializers.err
  }
});

// Usage
logger.info({ org_id, contact_id }, 'Contact created');
logger.error({ err, org_id }, 'Import failed');
```

### Metrics (Prometheus)

```typescript
// lib/metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const metrics = {
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
  }),
  
  importJobsTotal: new Counter({
    name: 'import_jobs_total',
    help: 'Total number of import jobs',
    labelNames: ['status', 'org_id']
  }),
  
  activeImports: new Gauge({
    name: 'active_imports',
    help: 'Number of currently running imports'
  }),
  
  contactsTotal: new Gauge({
    name: 'contacts_total',
    help: 'Total number of contacts',
    labelNames: ['org_id']
  })
};

// Middleware to track request duration
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    metrics.httpRequestDuration.labels(
      req.method,
      req.route?.path || 'unknown',
      res.statusCode
    ).observe(duration);
  });
  next();
}
```

### Distributed Tracing

```typescript
// lib/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: 'http://jaeger:14268/api/traces'
  }),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start();

// Custom spans
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('mailing-list-api');

export async function importContacts(file) {
  const span = tracer.startSpan('import_contacts');
  span.setAttribute('file_size', file.size);
  span.setAttribute('org_id', orgId);
  
  try {
    // Import logic
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR });
    throw error;
  } finally {
    span.end();
  }
}
```

### Health Checks

```typescript
// routes/health.routes.ts
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      s3: await checkS3()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(c => c.status === 'ok');
  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

---

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Full backup: Daily at 2 AM UTC
- Incremental backup: Hourly
- Transaction log shipping for point-in-time recovery
- Retention: 30 days (configurable per plan)
- Stored in S3 with cross-region replication

**Restore Procedures:**
```bash
# Restore from full backup
pg_restore -d mailing_list_prod backup_2025-11-11.dump

# Point-in-time recovery (to specific timestamp)
pg_restore --target-time="2025-11-11 10:30:00" \
  -d mailing_list_prod backup_base.dump
```

### Multi-Region Failover (Enterprise)

**Primary Region:** us-east-1  
**Secondary Region:** us-west-2

**Failover Strategy:**
1. Database: PostgreSQL streaming replication to standby
2. Redis: Redis Cluster with replicas in secondary region
3. S3: Cross-region replication (automatic)
4. DNS: Route53 health checks with automatic failover

**RTO (Recovery Time Objective):** 5 minutes  
**RPO (Recovery Point Objective):** 1 minute

---

**End of Technical Architecture Document**

**Code Modularization Reminder:**
> **CRITICAL:** No single code file should exceed 450 lines of code. When a module approaches this limit, split it into focused sub-modules with clear responsibilities. Use the examples provided throughout this document as guidance.

**Next Steps:**
- Review Database Schema document for detailed table definitions
- Review API Specification for complete endpoint documentation
- Review Development Roadmap for implementation task list
