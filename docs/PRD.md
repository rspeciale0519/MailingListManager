# Product Requirements Document (PRD)
## Mailing List Manager SaaS Platform

**Version:** 1.0  
**Last Updated:** November 11, 2025  
**Status:** Development Ready

---

## Executive Summary

The Mailing List Manager is a comprehensive multi-tenant SaaS platform designed for importing, cleaning, organizing, and managing large-scale mailing list data. The platform provides powerful data management tools with enterprise-grade security, granular permissions, and scalable architecture.

### Key Value Propositions
- **Import & Normalize**: Intelligent column mapping with ML-assisted field detection and multi-format support
- **Clean & Deduplicate**: Advanced clustering algorithms with manual survivor selection and reversible merges
- **Organize & Segment**: Dynamic filtering, tagging, and saved segments for targeted campaigns
- **Validate & Enrich**: Integrated AccuZip address validation and skip tracing for data enrichment
- **Control & Audit**: Granular RBAC+ABAC permissions with comprehensive audit trails

---

## Product Vision

Build the most intuitive, powerful, and secure mailing list management platform that scales from solo entrepreneurs to enterprise teams, eliminating data quality issues and streamlining contact management workflows.

---

## Target Users

### Primary Personas

**1. Solo Marketer (Free/Starter)**
- Small business owner or freelancer
- Manages 1-5K contacts
- Needs basic import, dedup, and export
- Price-sensitive, self-service

**2. Marketing Manager (Pro)**
- Mid-size company marketing team lead
- Manages 10-50K contacts across campaigns
- Needs team collaboration and advanced filtering
- Values time savings and data quality

**3. Enterprise Data Steward (Enterprise)**
- Large organization with compliance requirements
- Manages 100K+ contacts with strict governance
- Needs SSO, audit trails, and API integrations
- Willing to pay for reliability and support

### Secondary Personas

**4. Platform Administrator**
- Internal staff managing the SaaS platform
- Needs global analytics, abuse monitoring, support tools
- Delegates org access for customer support

---

## Core Features & Requirements

### 1. Multi-Tenancy & Data Isolation

**Requirements:**
- Each organization (org) is a completely isolated tenant
- Row-Level Security (RLS) enforces `org_id` filtering on all queries
- Field-level encryption for PII (name, email, phone, address)
- KMS-managed encryption keys with automatic rotation
- Optional database-per-tenant for Enterprise tier

**Acceptance Criteria:**
- ✅ No org can access another org's data under any circumstance
- ✅ Encryption keys are org-specific and stored in KMS
- ✅ All PII fields are encrypted at rest
- ✅ Platform admins access tenant data only via audited impersonation

---

### 2. User Roles & Permissions System

**Role Hierarchy:**

**Platform Level:**
- **Super Admin**: Global platform control, can impersonate any org
- **Admin User**: Platform staff with delegated, time-bound org access

**Organization Level:**
- **Account Owner**: Full control within their org, manages team members
- **Team Member**: Limited access based on permission toggles set by Account Owner

**Permission Model:**
- Hybrid RBAC (role-based) + ABAC (attribute-based) access control
- Central Policy Engine evaluates: `subject`, `action`, `resource`, `context`
- Permissions cached with TTL for performance
- All permission changes audited with before/after diff

**Account Owner → Team Member Permissions UI:**
- Simplified permission matrix with presets:
  - **Viewer**: Read-only access
  - **Editor**: Edit contacts and tags
  - **Importer**: Can import and map data
  - **Exporter**: Can export data
  - **Manager**: Full access except billing
- Advanced tab for granular toggles:
  - Import data
  - Edit contacts inline
  - Bulk edit/delete
  - Manage tags
  - Run deduplication
  - Export data
  - Manage segments
  - View audit logs
  - Manage schema (add custom fields)

**Acceptance Criteria:**
- ✅ Permission changes preview effective access before saving
- ✅ All changes create audit events with diff
- ✅ Policy decisions cached and invalidated on change
- ✅ Impersonation requires justification and is fully audited

---

### 3. Subscription Plans & Quotas

**Free Tier:**
- Single Account Owner (no team members)
- 1,000 contacts max
- 5 lists max
- 10 imports per month
- 5MB file size limit
- Standard support (email only)

**Starter Tier ($29/month):**
- Single Account Owner (no team members)
- 10,000 contacts
- 25 lists
- 100 imports per month
- 50MB file size limit
- Email support with 48hr response

**Pro Tier ($99/month):**
- Account Owner + 2 included Team Members
- Up to 3 additional paid Team Members ($15/each)
- 50,000 contacts
- Unlimited lists
- Unlimited imports
- 500MB file size limit
- Priority email support (24hr response)
- Advanced features: saved filters, layout presets, API access

**Enterprise Tier ($499/month):**
- Account Owner + 10 included Team Members
- Unlimited additional Team Members ($10/each)
- 500,000+ contacts (custom pricing above)
- Unlimited lists and imports
- 2GB file size limit
- SSO (SAML/OAuth)
- Dedicated account manager
- Phone support
- Custom SLA
- Audit log retention (2 years)
- Optional: database-per-tenant, custom integrations

**Feature Flags:**
- Super Admin can override any feature for specific orgs
- Plan metadata drives all quota enforcement
- Usage counters track: contacts, lists, imports, exports, API calls, storage

**Acceptance Criteria:**
- ✅ Quota limits enforced at API level with clear error messages
- ✅ Usage dashboards show current vs limit with upgrade prompts
- ✅ Automatic enforcement prevents exceeding quotas
- ✅ Graceful degradation when approaching limits

---

### 4. Data Import Pipeline

**Supported Formats:**
- CSV (with various delimiters: comma, semicolon, tab, pipe)
- XLSX (Excel)
- TSV (Tab-separated)
- JSON (array of objects)

**Import Flow:**

**Step 1: Upload**
- Drag-and-drop or file picker
- Virus scan via ClamAV
- Size validation against plan limits
- Upload to temporary S3 bucket with pre-signed URLs
- Multipart upload for large files with resume capability

**Step 2: Parse & Sample**
- Parse first 100 rows to infer schema
- Detect encoding (UTF-8, Latin-1, Windows-1252)
- Identify column headers vs data rows
- Generate data profiles per column (type inference, sample values)

**Step 3: Column Mapping (The Core Innovation)**

**Auto-Mapping System:**
- **Canonical Field Dictionary**: Pre-defined standard fields
  - Identity: `email`, `first_name`, `last_name`, `full_name`
  - Contact: `phone`, `mobile_phone`, `work_phone`
  - Address: `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`
  - Organization: `company`, `title`, `department`
  - Metadata: `tags`, `notes`, `created_date`, `updated_date`

- **Synonym Map**: Alternative header names
  - `email` ← ["e-mail", "email address", "mail", "electronic mail", "e_mail"]
  - `first_name` ← ["fname", "first", "given name", "forename", "firstname"]
  - `last_name` ← ["lname", "last", "surname", "family name", "lastname"]
  - `phone` ← ["telephone", "phone number", "tel", "contact number"]
  - `postal_code` ← ["zip", "zip code", "zipcode", "postcode", "postal"]

- **Normalization**: Headers are normalized before matching
  - Lowercase
  - Trim whitespace
  - Collapse multiple spaces/underscores
  - Strip special characters
  - Standardize abbreviations

- **Confidence Scoring**:
  - Exact match: 100%
  - Synonym match: 95%
  - Fuzzy match (Levenshtein distance): 70-90%
  - Semantic similarity (embedding-based): 60-85%
  - Data profile fit (regex validators): +10% bonus
  - Historical mapping match: +15% bonus

- **Auto-Map Threshold**: Fields with ≥80% confidence are pre-selected

- **Conflict Resolution**:
  - One target field per import (no duplicates)
  - When multiple source columns match same target, use tie-breakers:
    1. Historical mapping preference
    2. Higher confidence score
    3. Data profile fit (e.g., valid email format)
    4. Header proximity (e.g., "first" near "last")
  - Losers become custom fields or require manual resolution

- **Mapping Memory**: Per-org history of successful mappings
  - Store: `source_header_normalized → target_field`
  - Version controlled
  - Explainable with "Why this mapping?" tooltip
  - Apply automatically on future imports

**Mapping UI:**
- Two-column layout: Source (left) → Target (right)
- Drag-and-drop source headers to targets
- Dropdown per source column to select target
- Color-coded confidence badges (green=high, yellow=medium, red=low)
- Conflict indicators with one-click "Keep Best" or manual override
- "Create New Custom Field" option for unmapped columns
- Live preview showing first 50 rows with transformations applied
- Validation badges per cell (✓ valid, ⚠ warning, ✗ invalid)

**Step 4: Data Transformation**
- **Per-Column Transforms** (toggleable):
  - Trim whitespace
  - Case normalization (upper, lower, title, sentence)
  - Phone standardization (E.164 format)
  - Email validation and normalization
  - Date parsing with locale detection
  - Address parsing and standardization

**Step 5: Validation**
- Row-by-row validation in parallel worker pool
- Hard constraints (required fields) vs soft warnings
- Per-row error collection with actionable messages
- Preview errors in UI with quick-fix suggestions
- Option to import valid rows and quarantine invalid

**Step 6: Commit**
- Batch insert (1000 rows per transaction) with conflict handling
- Atomic commits with rollback on error
- Update existing contacts or create new (configurable)
- Stamp all records with `import_id` for traceability

**Step 7: Post-Processing**
- Auto-deduplication (if enabled)
- Tag rule application
- Segment membership updates
- Webhook notifications

**Progress & Cancellation:**
- Real-time progress bar with stages:
  - Upload (bytes transferred)
  - Parse (rows read)
  - Validate (rows checked)
  - Commit (rows inserted)
  - Post-process (dedup, tagging)
- ETA calculation and detailed metrics drawer
- **Cancel Upload** button with two options:
  1. **Reverse Entire Upload**: Remove all data from this import (soft delete first)
  2. **Keep Uploaded Data**: Stop processing, keep committed rows
- All cancellations audited with reason

**Resumability:**
- Checkpoint-based resume for interrupted uploads
- Idempotent operations via `import_id` + row fingerprinting

**Acceptance Criteria:**
- ✅ 95%+ auto-mapping accuracy on common CSV formats
- ✅ Conflict-free mapping enforced (no duplicate targets)
- ✅ Import completes within 5min for 10K rows, 30min for 100K rows
- ✅ Full traceability: every row links back to source file and import job
- ✅ Cancel operations complete within 30 seconds

---

### 5. Data Grid & In-Table Editing

**Grid Features:**
- Virtualized scrolling for 100K+ rows (renders only visible rows)
- Column resizing, reordering (drag-and-drop), hide/show
- Persistent layouts per user, per list
- Sticky headers and frozen columns
- Responsive design (mobile-friendly with horizontal scroll)

**Column Management:**
- Right-click column header for context menu:
  - Hide column
  - Resize to fit
  - Sort ascending/descending
  - Filter by value
  - Add column (create new custom field)
- Column manager modal: checkboxes to show/hide all columns
- Save custom layout presets (Pro+ tier)
- One-click reset to default layout

**In-Table Column Creation:**
- **Quick Add**: Click "+ Column" button in header
  - Name + Type (string/number/boolean/date/enum)
  - Optional default value
  - Creates immediately
- **Advanced Add**: Opens side panel
  - Validation rules (regex, min/max, required)
  - Allowed values (for enum)
  - PII flag
  - Index hint for performance
  - Role visibility (read/export permissions)
  - Computed formula (e.g., `concat(first_name, " ", last_name)`)
- **Scope**: List-only or Org-wide custom field
- **Backfill**: Async job fills existing rows with default/null
- **Undo**: 5-minute soft-undo window; full audit regardless

**Inline Editing:**
- Click cell to edit (or press F2)
- Keyboard navigation: Tab, Shift+Tab, Enter, Escape
- Optimistic UI updates with background validation
- Failed saves rollback with error tooltip
- Per-column validators run on blur
- Multi-row fill: Copy value and paste over selection
- Fill-down shortcut: Ctrl+D (Cmd+D on Mac)

**On-the-Fly Tagging:**
- Tag pill editor in each row
- Typeahead to add existing tags
- Press Enter to create new tag (if permitted)
- Color-coded tags with quick filter from pill
- Bulk tag add/remove via toolbar

**Acceptance Criteria:**
- ✅ Grid renders <100ms for first screen of data
- ✅ Scroll smoothly with 60fps
- ✅ Inline edits save within 500ms with optimistic UI
- ✅ Custom fields appear instantly (async backfill)
- ✅ Column layouts persist across sessions

---

### 6. Search, Filter, Sort, Pagination

**Basic Search:**
- Keyword search bar (always visible)
- Searches across: name, email, phone, address, tags
- Debounced queries (300ms delay)
- Full-text search using GIN indexes (PostgreSQL)
- Instant results (sub-second response)

**Advanced Search:**
- Boolean logic builder with nested AND/OR groups
- Example: `(city = "Austin" AND tags CONTAINS "VIP") OR (state = "TX" AND created_date > "2024-01-01")`
- Visual query builder with drag-and-drop conditions
- Raw SQL mode for power users (Enterprise only)

**Field-Specific Filters:**
- Dropdown filters on each column header
- Dynamic operators by data type:
  - String: equals, contains, starts with, ends with, regex
  - Number: equals, not equals, <, >, ≤, ≥, between
  - Date: before, after, between, relative (last 7 days, this month)
  - Boolean: is true, is false
  - Tags: contains any, contains all, excludes
- Multi-select for enum fields

**Saved Filters:**
- Save current filter combination with name
- Pin to toolbar for quick access
- Share with team (Pro+ tier)
- Schedule filter as report (Enterprise tier)

**Sorting:**
- Click column header to toggle sort direction (↑↓)
- Shift+click for multi-column sort
- Sort order preserved with filter
- Clear all sorts button

**Pagination:**
- Server-side pagination (never load full dataset)
- Selectable page sizes: 25, 50, 100, 250
- Jump to page input
- Optional infinite scroll mode
- "Select all N matching filter" capability (for bulk actions)

**Performance:**
- Indexes on: `org_id`, `list_id`, `email`, `phone`, `postal_code`, `tags` (GIN)
- Trigram indexes for fuzzy text search
- Query result caching (5min TTL)
- Partition large tables by `org_id` or time

**Acceptance Criteria:**
- ✅ Search returns results in <500ms for 100K rows
- ✅ Filters apply without full page reload
- ✅ Sort works across all data (not just current page)
- ✅ Saved filters load instantly from toolbar

---

### 7. Bulk Operations & Multi-Select

**Selection Modes:**
- Checkbox per row
- Click row selects/deselects
- Shift+click for range selection
- Ctrl+click (Cmd+click) for non-contiguous selection
- "Select all N on this page" checkbox in header
- "Select all N matching current filter" (loads confirmation modal)

**Bulk Actions Toolbar** (appears when rows selected):
- **Delete**: Soft delete with confirmation and undo window
- **Tag**: Add or remove tags from selection
- **Format**: Apply transforms (trim, case, phone/email standardize)
- **Move to List**: Reassign contacts to different list
- **Export Selection**: Download as CSV/XLSX
- **Dedup Review**: Run dedup rules on selection
- **Merge**: Manually merge selected contacts
- **Clear Values**: Bulk-clear specific fields
- **Run Transform**: Apply custom formula or script

**Bulk Formatting:**
- Batch transforms on selected rows
- Preview changes with sample rows before applying
- Supported transforms:
  - Trim whitespace
  - Case conversion (upper, lower, title, sentence)
  - Phone formatting (E.164, national, international)
  - Email normalization (lowercase, remove dots in Gmail)
  - Date reformatting
  - Address standardization

**Long-Running Jobs:**
- Execute async for operations on 1000+ rows
- Progress indicator with ETA
- Partial failure reporting (download CSV of errors)
- Job history in background tasks panel

**Safety:**
- Destructive actions require confirmation
- Undo window (5-30 minutes depending on plan)
- All bulk operations audited with selection snapshot

**Acceptance Criteria:**
- ✅ Bulk operations complete within 10s for 1K rows, 60s for 10K rows
- ✅ UI remains responsive during bulk operations
- ✅ Clear feedback on success, partial success, and failures
- ✅ Undo available for destructive actions

---

### 8. Deduplication Workflow

**Goal:** Identify duplicate records, let users review clusters, manually select survivors, and merge or discard duplicates with full auditability and reversibility.

**Step 1: Define Match Criteria**
- **Presets**: Email, Phone, Exact Address, Name+Address, Custom
- **Single or Composite Keys**: 
  - Single: `email` only
  - Composite: `first_name` + `last_name` + `postal_code`
- **Weights**: Assign importance to each field (0-100%)
- **Normalization**: Auto-apply before matching (case, trim, phone formatting)
- **Fuzzy Matching**: 
  - Trigram similarity for names/addresses
  - Jaro-Winkler for strings
  - Threshold slider (0.7-1.0)
- **Save Ruleset**: Name and reuse dedup configurations

**Step 2: Run Clustering**
- Background job groups suspected duplicates into clusters
- Each cluster has:
  - Confidence score (0-100%)
  - Reason codes (e.g., "email exact match", "name similarity 0.92")
  - Member count
- Large clusters paginate internally (max 20 members per view)
- Preview shows key fields side-by-side

**Step 3: Review Clusters**
- Paginated cluster list sorted by confidence (descending)
- Filter clusters by:
  - Confidence range
  - Member count
  - Specific field matches
- Expand cluster to see all member records in tabular comparison

**Step 4: Select Survivor**
- **Manual Selection**: Radio button per record to choose survivor
- **Quick Actions**: One-click presets
  - Keep most complete (fewest null fields)
  - Keep most recent activity
  - Keep cleanest data (highest validation scores)
  - Keep first/last alphabetically
- **Override Anytime**: User can change selection before applying
- **Multi-Cluster Bulk**: Select multiple clusters, apply rule, review exceptions

**Step 5: Define Merge Rules**
- **Field Resolution Strategies** (per field):
  - Use survivor's value (default)
  - Use longest non-empty value
  - Use most recent value
  - Use most valid per validator
  - Concatenate all unique values
  - Custom formula
- **Preview**: Shows resulting merged record with field provenance
- **Discard vs Merge**:
  - **Discard**: Soft delete duplicates, keep survivor only
  - **Merge**: Combine fields from duplicates into survivor per rules

**Step 6: Apply & Audit**
- **Apply Button**: Executes merge transaction
- **Reversible Snapshots**: Store pre-merge state for undo
- **Undo Window**: 30 days (configurable per plan)
- **Audit Trail**: 
  - Cluster ID
  - Chosen survivor
  - Discarded/merged IDs
  - Field resolution rules
  - Actor and timestamp
  - Impersonation context (if applicable)

**Step 7: Post-Merge Updates**
- Update all references:
  - Segments that include merged contacts
  - Exports that reference merged contacts
  - Tags transfer to survivor
- Emit webhooks:
  - `contact.merged` (survivor_id, merged_ids[])
  - `contact.deleted` (discarded_ids[])

**Safety & Permissions:**
- Only Account Owners, delegated Admin Users, or Team Members with "Manage Dedup" permission can apply
- Dry-run mode: preview results without committing
- Bulk approve/reject clusters
- Rollback via unmerge (recreates pre-merge state from snapshots)

**Acceptance Criteria:**
- ✅ Dedup runs complete within 5min for 10K contacts
- ✅ Clustering accuracy ≥90% for exact matches, ≥75% for fuzzy
- ✅ Manual survivor selection overrides all auto-selections
- ✅ Undo restores exact pre-merge state within retention window
- ✅ Zero data loss on merge (all fields accounted for)

---

### 9. Data Formatting & Normalization

**Purpose:** Ensure data consistency across all operations (import, edit, export, dedup).

**Formatting Rules by Field Type:**

**Email:**
- Lowercase entire address
- Trim whitespace
- Validate RFC 5322 format
- Optional: Remove dots in Gmail local part (for dedup)
- Store both raw and normalized versions

**Phone:**
- Convert to E.164 format: `+1NNNNNNNNNN`
- Infer country code from org default or address
- Remove all non-numeric characters
- Validate length and format
- Store formatted version for display (e.g., `(555) 123-4567`)

**Address:**
- Title case street names
- Standardize abbreviations (St, Ave, Blvd, Rd, Apt, Ste)
- Normalize state codes to ISO 3166 (e.g., `California` → `CA`)
- Normalize country codes (e.g., `United States` → `US`)
- Optional: Validate via postal API (AccuZip integration)

**Names:**
- Title case (capitalize first letter of each word)
- Preserve known all-caps acronyms (e.g., `IBM`, `JFK`)
- Keep lowercase particles (e.g., `von`, `de la`, `van der`)
- Trim and collapse multiple spaces
- Merge initials intelligently (e.g., `J. R. R. Tolkien`)

**Name Suffixes:**
- Normalize to canonical forms: `Jr.`, `Sr.`, `III`, `IV`, `V`
- Accept inputs: `jr`, `JR`, `Iii`, `iii`, `3rd`, `third`
- Add comma before suffix: `John Smith, Jr.`
- Avoid duplicating existing suffix
- Handle conflicts (warn if both `Jr.` and `III` present)

**Company Names:**
- Normalize legal designators to style guide:
  - `Inc`, `LLC`, `LLP`, `Ltd.`, `Corp.`, `Co.`, `PLC`
- Collapse excess punctuation/spaces
  - `INC.` → `Inc`
  - `L.L.C.` → `LLC`
- Preserve core brand casing (e.g., `IBM Inc` not `Ibm Inc`)
- Ensure designator appears once, at end
- Optional: Strip designator for display-only contexts

**Dates:**
- Convert to UTC ISO 8601 for storage: `2025-11-11T14:30:00Z`
- Accept multiple input formats: `MM/DD/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`, natural language
- Display in user's local timezone
- Validate against reasonable ranges

**Numbers:**
- Strip thousands separators (`,` or `.` depending on locale)
- Enforce decimal precision per schema
- Localized formatting in UI only

**Tags:**
- Lowercase unique key (for matching)
- Store human-readable label separately
- Trim and collapse spaces
- Enforce uniqueness per org

**Application Points:**
- **On Import**: All data formatted before validation and insert
- **In-Table Edit**: Inline edits formatted on blur
- **Deduplication**: Normalized forms used for comparisons
- **Export**: Option to export formatted, raw, or both

**Org-Level Style Guide Toggles:**
- Company designator punctuation: `Inc` vs `Inc.`
- Company designator casing: `LLC` vs `Llc`
- Suffix punctuation: `Jr.` vs `Jr`
- Suffix delimiter: comma before suffix (on/off)
- Preserve brand acronyms (on by default)
- Strip designators in display while retaining structured `legal_designator` field

**Validation Aids:**
- Warn on multiple designators (e.g., `Acme Inc LLC`)
- Warn on conflicting suffixes (e.g., `Jr.` with `III`)
- One-click fixes in grid and import preview

**Audit & Rollback:**
- Every format transformation logged in `events_audit`
- Before/after values stored for rollback
- Restore original unformatted data within retention window

**Acceptance Criteria:**
- ✅ 100% of emails formatted to lowercase and validated
- ✅ 95%+ of phones converted to E.164 successfully
- ✅ Company names follow org style guide consistently
- ✅ All format changes auditable and reversible

---

### 10. Address Validation & Skip Tracing (Paid Features)

**Goal:** Enrich contact data with validated addresses and additional contact information via third-party services.

### Address Validation (AccuZip + USPS)

**Purpose:** Verify deliverability and standardize addresses per USPS standards.

**Entry Point:**
- **Validate** button on data table toolbar (enabled when rows selected)
- Opens side panel with configuration

**Flow:**

**1. Configure Input Mapping:**
- Review fields to send (defaults from org schema):
  - `first_name`, `last_name`
  - `address_line1`, `address_line2`
  - `city`, `state`, `postal_code`
- Add/remove optional fields (company, unit number)

**2. Cost Estimate:**
- Display per-record price (e.g., $0.05/record)
- Calculate total: `unit_price × selected_count`
- Apply volume discounts if applicable
- Show current balance and confirm sufficient credits

**3. Run Validation:**
- Submit batch to AccuZip API
- Batch size: 1000 records per API call
- Retries with exponential backoff on transient errors
- Respect rate limits (throttle requests)

**4. Progress & Results:**
- Real-time progress bar:
  - Records validated
  - Deliverable
  - Undeliverable
  - Corrected
  - Errors
- ETA based on average response time

**5. Write Back Results:**
- Create new columns (append, don't overwrite):
  - `usps_status` (Deliverable, Undeliverable, Vacant, Unknown)
  - `dpv_code`, `dpv_footnotes`, `carrier_route`, `lot_number`
  - `address_line1_std`, `address_line2_std`
  - `city_std`, `state_std`, `postal_code_std`
  - `first_name_std`, `last_name_std`
  - `validation_timestamp`, `validation_source`, `validation_confidence`
- Original values preserved
- Standardized values stored alongside with provenance

**6. Review & Apply:**
- View before/after comparison in grid
- One-click "Apply Standardized Values" to replace originals
- Or keep both for reference

**Safety:**
- Partial failures quarantined
- Download errors CSV for manual review
- Undo via audit log within retention window

### Skip Tracing (Third-Party Provider)

**Purpose:** Enrich contacts with additional emails, phones, addresses, and related individuals.

**Entry Point:**
- **Skip Trace** button on toolbar
- Opens side panel with configuration

**Flow:**

**1. Select Provider:**
- Choose from configured providers (e.g., Spokeo, BeenVerified, TLO)
- Display provider capabilities and pricing

**2. Configure Input Mapping:**
- Choose fields to send:
  - Name (first, middle, last)
  - Last known address
  - Date of birth (if available)
  - Prior emails/phones
- Mapping saved per org for reuse

**3. Cost Estimate:**
- Per-record pricing (often pay-per-hit)
- Estimate based on expected find rate (e.g., 60% success)
- Show range: `min_cost` to `max_cost`

**4. Run Skip Trace:**
- Submit batch to provider API
- Progress shows found vs not-found counts
- Cost updates in real-time as results arrive

**5. Append Results:**
- Create namespaced columns:
  - `skiptrace_emails[]` (array of emails)
  - `skiptrace_phones[]` (E.164 format)
  - `skiptrace_alt_addresses[]` (structured)
  - `skiptrace_relatives[]` (name + relationship)
  - `skiptrace_score` (confidence 0-100)
  - `skiptrace_provider`, `skiptrace_timestamp`
- Multiple values stored as JSON arrays or separate numbered columns

**6. Privacy & Consent:**
- Display permissible use attestation before first run
- Store consent in audit log
- All new fields flagged as PII
- Visibility controlled by role and plan

**Job Management:**
- Long-running jobs execute in background
- Resumable via checkpoints
- Idempotent (retry-safe)
- **Cancel Options:**
  - **Keep Results**: Stop processing, retain completed writes
  - **Reverse Job**: Remove columns/rows written by this job only
- Progress panel shows:
  - Batches completed / remaining
  - Success rate
  - Cost-to-date
  - ETA

**Bulk & Selection:**
- Supports "selected rows" or "all matching current filter"
- Filter snapshot stored for replayability

**Audit & Observability:**
- Every change recorded in `events_audit`:
  - `job_id`, provider, input mapping hash
  - Before/after diffs per record
  - Actor, timestamp, impersonation context
- Admin console shows:
  - Job history per org
  - Total costs per provider
  - Error rates and latency

**Error Handling:**
- Exponential backoff with jitter
- Dead-letter queue for persistent failures
- Per-record retry cap (3 attempts)
- Graceful degradation on provider throttling

**Quotas & Rate Limits:**
- Per-plan daily caps (e.g., Free: 0, Starter: 100, Pro: 1000, Enterprise: unlimited)
- Concurrency limits to prevent API abuse
- Overflow queued for off-peak processing

**UX Details:**
- Side panel screens: **Inputs** → **Estimate** → **Run** → **Results**
- Results screen:
  - Links to created columns
  - Quick filters (e.g., "Show only found", "Undeliverable")
  - Download results CSV
- Tooltips explain each new column
- Column groups collapse under "Validation" or "Skip Trace" for readability

**Acceptance Criteria:**
- ✅ Address validation ≥98% USPS accuracy
- ✅ Skip trace find rate ≥60% for complete inputs
- ✅ Jobs complete within 10min for 1K records
- ✅ Cost estimates within ±5% of actual
- ✅ Zero unintended charges (strict quota enforcement)
- ✅ Full audit trail for compliance

---

### 11. Segments & Dynamic Lists

**Purpose:** Create reusable, dynamic subsets of contacts based on filter criteria.

**Segment Definition:**
- Name, description, color
- Filter criteria (uses same builder as Advanced Search)
- Auto-update: segment membership recalculates on data changes
- Snapshot mode: freeze segment at point in time (Enterprise)

**Segment UI:**
- Sidebar shows all segments with contact counts
- Click segment to view/edit members
- Drag contacts into segment to tag/add criteria
- Visual indicator when segment is out-of-sync

**Use Cases:**
- "VIP Customers" = `tags CONTAINS "VIP"`
- "Texas Residents" = `state = "TX"`
- "Incomplete Records" = `email IS NULL OR phone IS NULL`
- "Recent Imports" = `created_date > last_30_days`

**Permissions:**
- View: All users
- Create/Edit: Account Owner, Team Members with "Manage Segments" toggle
- Delete: Account Owner only

**Performance:**
- Segment counts cached with 5min TTL
- Materialize large segments as tables (Enterprise)
- Indexed `segment_memberships` table for fast lookups

**Acceptance Criteria:**
- ✅ Segments update within 1min of data changes
- ✅ Segment count queries return in <500ms
- ✅ Segments can be used as filters in exports and bulk actions

---

### 12. Exports

**Purpose:** Download contact data in various formats for use in external systems.

**Export Formats:**
- CSV (configurable delimiter)
- XLSX (Excel)
- JSON (array of objects)
- vCard (for address book import)

**Export Configuration:**
- **Selection**: Current page, selected rows, all rows, or saved filter/segment
- **Columns**: Choose which fields to include (drag to reorder)
- **Format Options**: 
  - Include headers (on/off)
  - Use formatted vs raw values
  - Date format preference
  - Encoding (UTF-8, Latin-1)
- **Compression**: Auto-compress exports >10MB

**Scheduled Exports (Enterprise):**
- Schedule recurring exports (daily, weekly, monthly)
- Deliver via email, SFTP, or webhook
- Incremental exports (only changes since last run)

**Export Quotas:**
- Free: 5 exports/month
- Starter: 50 exports/month
- Pro: Unlimited, max 10K rows per export
- Enterprise: Unlimited, max 100K rows per export

**Privacy & Compliance:**
- PII fields require explicit permission to export
- Audit all exports with:
  - User, timestamp
  - Selection criteria
  - Columns exported
  - Destination (download, email, API)

**Performance:**
- Background job for exports >1K rows
- Download link expires after 24 hours
- S3 pre-signed URLs for secure downloads

**Acceptance Criteria:**
- ✅ Exports generate within 30s for 10K rows
- ✅ Large exports (100K+) notify user when ready
- ✅ Export files downloadable for 24 hours
- ✅ Zero data leakage (only selected columns exported)

---

### 13. Audit & Compliance

**Audit Log:**
- Capture every significant action:
  - User login/logout
  - Permission changes
  - Data imports, edits, deletes
  - Deduplication runs
  - Exports
  - Schema changes
  - Impersonation sessions
- Fields logged:
  - Actor (user ID + name)
  - Action type
  - Resource type + ID
  - Before/after state (JSON diff)
  - IP address, user agent
  - Timestamp
  - Impersonation context (if applicable)
  - Reason/justification

**Audit Retention:**
- Free: 30 days
- Starter: 90 days
- Pro: 1 year
- Enterprise: 2 years (configurable up to 7 years)

**Audit UI:**
- Filterable log viewer
- Search by user, action, resource, date range
- Export audit logs (CSV/JSON) for compliance
- Drill-down to see full before/after diff

**Compliance Features:**
- GDPR Right to Access: Export all data for a user
- GDPR Right to Erasure: Anonymize/delete user data
- Data retention policies per org
- SOC 2 Type II audit trail requirements
- CCPA compliance toolkit

**Acceptance Criteria:**
- ✅ 100% of sensitive actions audited
- ✅ Audit logs immutable (append-only)
- ✅ Logs queryable within 5s for 100K events
- ✅ Audit exports complete within 60s

---

### 14. Onboarding Experience

**Goal:** Reduce friction for new users and accelerate time-to-value.

**Onboarding Flow:**

**Step 1: Account Creation**
- Email signup with verification
- OAuth (Google, Microsoft) for quick sign-in
- Choose plan (free trial of Pro for 14 days)

**Step 2: Welcome Screen**
- Brief product tour (video or interactive)
- Three options:
  1. **Import Your Data** (most common)
  2. **Explore Sample List** (pre-populated demo data)
  3. **Guided Tutorial** (step-by-step walkthrough)

**Step 3: Sample List (Quick Start)**
- One-click import of 100 sample contacts
- Pre-tagged with demo tags ("VIP", "Newsletter", "Customer")
- Includes all field types for exploration
- Non-deletable (can hide) to preserve tutorial context

**Step 4: Interactive Tutorial**
- Modal overlay with tooltips
- Highlights key UI areas:
  - Import button
  - Data grid navigation
  - Filter bar
  - Tag management
  - Dedup button
  - Export options
- Progress tracker (5 steps)
- Dismissible per step
- Option to restart tutorial anytime

**Step 5: Quick Start Checklist**
- Sidebar widget with checkboxes:
  - ☐ Upload your first list
  - ☐ Add a tag to a contact
  - ☐ Run your first deduplication
  - ☐ Export a CSV
  - ☐ Invite a team member (Pro+)
- Auto-checks as user completes tasks
- Collapsible to reduce clutter

**Contextual Help:**
- Tooltip icons throughout UI
- Tooltips show only once per session
- Link to knowledge base articles
- In-app chat support (Pro+ plans)

**Onboarding Metrics:**
- Track completion rate of checklist
- Measure time-to-first-import
- Monitor tutorial abandonment points
- A/B test onboarding flows

**Acceptance Criteria:**
- ✅ ≥70% of new users complete at least 3 checklist items
- ✅ Time-to-first-import <5 minutes
- ✅ Tutorial dismissible without frustration
- ✅ Sample list loads instantly

---

## Technical Requirements

### Performance Targets
- Page load: <2s (initial), <500ms (subsequent)
- Search results: <500ms for 100K rows
- Import: 10K rows in <5min, 100K rows in <30min
- Export: 10K rows in <30s
- Dedup: 10K contacts in <5min
- Grid rendering: <100ms first paint, 60fps scrolling

### Scalability
- Support 10,000+ organizations
- 1M+ contacts per organization (Enterprise)
- 100K+ concurrent requests across platform
- Horizontal scaling for API and workers
- Database sharding by org_id for largest orgs

### Security
- SOC 2 Type II compliant infrastructure
- Field-level encryption for PII (AES-256)
- Encryption in transit (TLS 1.3)
- KMS-managed encryption keys
- Regular key rotation (90 days)
- MFA required for Account Owners (optional for Team Members)
- SSO (SAML 2.0, OAuth 2.0) for Enterprise
- Rate limiting (per-user and per-org)
- DDoS protection (Cloudflare)
- Regular penetration testing

### Availability & Reliability
- 99.9% uptime SLA (Pro+)
- 99.95% uptime SLA (Enterprise)
- Automated backups (daily full, hourly incremental)
- Point-in-time recovery (within 7 days)
- Multi-region failover (Enterprise)
- Blue-green deployments for zero-downtime updates

### Browser Support
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile: iOS Safari 14+, Chrome Android 90+

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation throughout
- Screen reader support
- High-contrast mode
- Configurable font sizes

---

## Success Metrics (KPIs)

### User Acquisition
- New signups per month
- Free-to-paid conversion rate (target: 15%)
- Trial-to-paid conversion rate (target: 40%)
- Referral rate

### Engagement
- Daily Active Users (DAU) / Monthly Active Users (MAU)
- Average session duration
- Imports per user per month
- Dedups run per user per month
- Filters saved per user

### Retention
- 30-day retention rate (target: 60%)
- 90-day retention rate (target: 40%)
- Churn rate (target: <5% monthly)
- Feature adoption rate (% using key features)

### Revenue
- Monthly Recurring Revenue (MRR)
- Average Revenue Per User (ARPU)
- Customer Lifetime Value (LTV)
- LTV:CAC ratio (target: 3:1)
- Expansion revenue (upgrades, add-ons)

### Support
- Support ticket volume
- Average resolution time (target: <24hr)
- Customer Satisfaction (CSAT) score (target: >4.5/5)
- Net Promoter Score (NPS) (target: >50)

---

## Out of Scope (Future Considerations)

**Phase 2 Features:**
- CRM integrations (HubSpot, Salesforce, Pipedrive)
- Marketing automation exports (Mailchimp, ActiveCampaign)
- Email deliverability scoring
- SMS/calling integrations (Twilio)
- Mobile apps (iOS, Android)
- Advanced reporting dashboards
- Data health score per list
- Automated workflows (triggers + actions)
- Address geocoding + distance filters
- AI-powered data enrichment
- Custom branding (white-label for Enterprise)
- Multi-language support

---

## Appendix

### Glossary
- **Org**: Organization; a tenant in the multi-tenant system
- **RLS**: Row-Level Security; database-enforced data isolation
- **RBAC**: Role-Based Access Control
- **ABAC**: Attribute-Based Access Control
- **PII**: Personally Identifiable Information
- **KMS**: Key Management Service
- **Dedup**: Deduplication; process of identifying and merging duplicate records
- **Segment**: Dynamic subset of contacts based on filter criteria
- **Impersonation**: Platform staff accessing an org's data for support purposes

### References
- Architecture Document: `mailing_list_manager_system_architecture_v_1.md`
- AccuZip API: https://www.accuzip.com/developers
- USPS Address Validation: https://www.usps.com/business/web-tools-apis/

---

**End of PRD**
