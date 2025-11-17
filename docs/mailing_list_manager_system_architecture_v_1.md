# Mailing List Manager – System Architecture (v1)

**App Description:**
The Mailing List Manager is a comprehensive SaaS platform for importing, cleaning, organizing, and managing large-scale mailing list data. It provides powerful tools for importing and mapping columns, editing and tagging data inline, deduplicating records, and enforcing consistent data formatting standards. Users can customize table layouts, filter and search records, and create dynamic segments. A robust permissions system supports multiple user roles and subscription tiers. Built for scalability, auditability, and performance, the app offers a clean, responsive interface with onboarding guidance to help users get started quickly, and it supports future integrations like CRM sync, address validation, skip tracing, and marketing exports for extended data enrichment and automation.



### Data Table Column Management Enhancements
- **Rearrangeable Columns**: Users can drag-and-drop to reorder columns directly within the grid header.
- **Hide/Unhide Columns**: Users can toggle column visibility from a context menu or column manager. Hidden columns remain available in filters and exports unless disabled by permissions.
- **Persistent Layouts**: Each user’s preferred column order and visibility are automatically saved per list and device.
- **Reset and Presets**: One-click reset to default layout or save custom presets (e.g., “Mailing Details”, “Address Focus”).
- **Permissions & Plan Control**: Rearranging and visibility toggling available to all plans; layout presets limited to paid tiers.
- **UX Notes**: Smooth drag handles, visibility checkboxes, visual drop indicators, and real-time preview of new order and visibility changes.

---

### Search, Filter, Sort, and Pagination
- **Basic Search**: Keyword search across common fields (name, email, phone, address, tags). Uses indexed full-text search for instant results.
- **Advanced Search**: Boolean logic builder allowing multi-condition filters (e.g., city = “Austin” AND tags CONTAINS “VIP”). Supports nested AND/OR groups.
- **Field-Specific Filters**: Dropdown and text filters on each column header; dynamic operators by field type (equals, contains, starts with, range, etc.).
- **Saved Filters**: Users can save, name, and share filter combinations. Saved filters are available as shortcuts on the toolbar.
- **Sorting**: Clickable column headers toggle ascending/descending; supports multi-column sorting via Shift-click.
- **Pagination**: Server-driven pagination with selectable page sizes (25, 50, 100, 250). Infinite scroll mode optional.
- **Search Performance**: Uses debounced queries and prebuilt indexes (GIN/FTS). Incremental fetch for large lists.
- **Permissions**: Search and filter accessible to all users; saving and sharing filters available to paid tiers.
- **UX Notes**: Sticky filter bar, quick clear, and persistent filters per session or saved view. Highlight search matches in grid cells.

---

### Future Integrations and Expansion Opportunities
- **CRM Sync**: Integrate with CRMs (HubSpot, Salesforce, Pipedrive) for bi-directional contact updates.
- **Marketing Automation Export**: One-click export to email tools (Mailchimp, ActiveCampaign, Klaviyo).
- **Reporting Dashboards**: Visual analytics for data quality, import trends, list growth, and dedup impact.
- **Address Geocoding**: Add geolocation and distance-based filtering for targeted mail campaigns.
- **Email Deliverability Scoring**: Integrate third-party services to validate and score email addresses.
- **Data Health Metrics**: Provide per-list health score (validity, completeness, duplicates, tag coverage).
- **Custom Workflows**: Allow automations via triggers (on import complete, on dedup, on tag added).

---

## MVP Onboarding Experience

**Lightweight Onboarding Guidance**
- **Sample List Import**: New users can import a pre-populated sample mailing list with a single click to explore app features immediately.
- **Interactive Tutorial Modal**: Step-by-step overlay highlighting key UI areas (import, filters, tags, dedup, exports) with tooltips and progress tracking.
- **Quick Start Checklist**: Sidebar checklist that marks off major setup steps (upload first list, add first tag, run first dedup).
- **Dismissible Tips**: Contextual help icons and short tips that appear only once per session to reduce clutter.
- **Goal**: Reduce onboarding friction, ensure early success, and increase trial-to-paid conversion.

---

## Objectives

Design a multi-tenant, large-scale mailing-list management SaaS with responsive UX, robust imports/exports, powerful search, deduplication, tagging, and granular permissions. Enforce modular code organization so no file exceeds 400 LOC.

---

## User Types and Access Model

- **Super Admin**: Global platform operator. Full control across app settings, plans, orgs, users, and data. Can impersonate organizations for support. Access to global analytics.
- **Admin User (Platform Staff)**: Works for the Super Admin to manage the app itself. Global access to platform tooling as granted by Super Admin. May be granted **delegated, time-bound access** to specific organizations for support via impersonation or temporary membership. Not limited to any single org.
- **Account Owner**: Owner of an organization account. Full feature access per plan. Manages their org’s data, settings, and Team Members.
- **Team Member**: Limited by the Account Owner’s permission toggles. Added per tier rules.

**Permission Strategy**: Hybrid **RBAC + ABAC**.

- Roles define broad powers (super_admin, admin, account_owner, team_member) and combine with per-org **memberships** for scoping.
- Attribute-based rules constrain actions by plan tier, org, list ownership, quotas, and explicit toggles.
- Central **Policy Engine** evaluates `subject, action, resource, context` with cached policy decisions.

---

## Plans and Quotas

- **Free**: Single Account Owner. Limited features and quotas.
- **Starter**: Single Account Owner. Full features. No Team Members.
- **Pro**: Full features + 2 included Team Members. Up to 3 additional paid Team Members.
- **Enterprise**: Full features + 10 included Team Members. Unlimited additional paid Team Members.

**Feature flags** per plan and per org let Super Admin override any capability. Plan metadata drives:

- Max lists, contacts per list / total, imports per day, file size, export frequency, API rate limits, webhooks, SSO, audit retention, support SLA.

---

## Multi-Tenancy and Data Isolation

- **Tenant model**: each organization (org) is a tenant. All tenant rows include `org_id` and are enforced by **Row Level Security (RLS)**.
- **Platform staff**: Super Admin and Admin Users exist at the **platform layer** (no default `org_id`). They access tenant data via audited **impersonation** or temporary **delegated scopes** that attach an `org_id` context per session.
- **Isolation**: soft multi-tenant by default using RLS + per-org encryption keys for PII fields; optional dedicated DB cluster for Enterprise via **database-per-tenant** flag.
- **PII**: name, email, phone, address parts encrypted at rest (field-level). KMS-managed keys with periodic rotation.

---

## Data Model (Core Tables)

- **users**: id, platform_role (super_admin|admin|none), email, status, mfa_enabled. *(Platform-level identity; not tied to a single org.)*
- **orgs**: id, name, plan, settings_json, feature_overrides_json.
- **org_memberships**: user_id, org_id, org_role (account_owner|team_member|org_admin_delegate), status. *(Allows Admin Users to be temporarily delegated to an org.)*
- **permissions**: org_id, user_id, policy_json (generated from toggles and plan entitlements).
- **seats**: org_id, base_included, additional_paid, limit_policy.
- **lists**: id, org_id, name, description, tags[], created_by.
- **contacts**: id, org_id, list_id, email, phone, address_line1..country, custom_json, pii_encrypted_fields.
- **contact_tags**: contact_id, tag_id.
- **tags**: id, org_id, name, color.
- **segments**: id, org_id, name, definition_json (filter DSL).
- **imports**: id, org_id, status, source, column_map_json, stats_json, file_ref.
- **import_rows**: import_id, row_idx, raw_json, normalized_json, errors[].
- **dedup_runs**: id, org_id, ruleset_json, stats.
- **exports**: id, org_id, selection_json, columns[], status, file_ref.
- **events_audit**: id, org_id nullable, actor_id, action, resource_type, resource_id, before, after, ip, ua, ts, impersonation_context.
- **billing_subscriptions**: org_id, plan, status, stripe_ids, renewal_at, quantities.
- **usage_counters**: org_id, metric, period, count.

Indexes: compound on `(org_id, list_id)`, trigram on email/phone, GIN for tags and FTS, partition contacts by org_id or time. `events_audit` indexed by `impersonation_context`.

---

## Permissions UI (Super Admin and Account Owner)

- **Super Admin → Admin User Permissions**: global platform permissions matrix (manage plans, feature flags, abuse controls, support tooling). Assign **delegated org scopes** with time limits and reasons; quick-impersonate with mandatory justification. Includes per-org plan override panel, seat limits, SSO, API access, data export rights, and audit visibility.
- **Account Owner → Team Member Permissions**: simplified matrix limited to that org. Presets: Viewer, Editor, Importer, Exporter, Manager. Advanced tab for granular toggles.
- All changes preview effective permissions; store as `policy_json` with diff and audit event.

---



## Import Pipeline and Column Mapping

1. Upload CSV/XLSX/TSV/JSON to temporary S3; virus scan and size checks.
2. Sample first N rows to infer schema and suggest column mapping via rules + ML assistance.
3. **Intuitive Column Mapping System**
   - **Default header dictionary**: Curated canonical fields (email, first_name, last_name, phone, address_line1, address_line2, city, state, postal_code, country, company, title, tags, notes, etc.) with a synonym map (e.g., "e-mail", "mail", "email address").
   - **Normalization**: Lowercase, trim, collapse spaces/underscores, strip punctuation, standardize common abbreviations (e.g., "zip" → postal_code).
   - **Auto-map first**: If source header matches a canonical field or its synonyms with confidence ≥ threshold, preselect that target.
   - **No-duplicate targets**: A target field can be chosen only once per import. If multiple source columns would map to the same target, run tie-breakers and assign the best; the rest fall back to other candidates or become **new custom fields**.
   - **Tie-break scoring**: Prioritize by per-org mapping history, data profile fit (regex/validator match for emails/phones/postal codes), semantic similarity, and header proximity signals (e.g., "first" near "last").
   - **Mapping memory**: Per org, store successful mappings (header → target) and apply them on future imports, versioned and explainable with a "why" tooltip.
   - **Custom fields**: Any unmapped source column defaults to **create new custom field** using the source header, with automatic de-duplication of field names (suffix _2, _3, or merge prompt).
   - **Conflict resolver UI**: Inline chips showing conflicts (e.g., two columns want "email"). One-click "Keep best" or manual override. Keyboard support.
   - **Preview panel**: Shows first 50 rows with validation badges per field (valid/invalid/normalized). Hover reveals transform rules applied.
   - **Transforms library**: Trim, case normalize, phone/e-mail standardize, date parsing with locale, address parse/enrich. Per-column toggleable.
   - **Validation**: Hard constraints for required fields; soft warnings for suspicious data. Row-level error list with quick-fix actions.
   - **Audited decisions**: Persist selected mapping, conflicts, overrides, and reasons in `imports.column_map_json`.
4. Validate each row in worker pool; write `import_rows` with errors for per-row triage.
5. Commit phase writes normalized contacts in batches; enqueue dedup if enabled.
6. Emit domain events; update stats.

**Resumable** via checkpoints. **Idempotent** via import_id + fingerprinting.

---

### Upload Progress & Cancel Behavior

**Real-time progress bar**
- Shows stages with actual progress: **Upload** (bytes to S3), **Parse** (rows read), **Validate** (rows checked), **Commit** (rows inserted), **Post-process** (dedup, tagging rules).
- Progress computed from job metrics: `bytes_uploaded/bytes_total`, `rows_processed/rows_total`, etc. UI animates smoothly but remains tied to actual numbers.
- ETA and per-stage counts (e.g., valid, corrected, failed) displayed in a details drawer.

**Cancel Upload button**
- Visible during any stage; opens a confirm modal with two choices:
  1) **Reverse Entire Upload**: remove all data created by this import job.
  2) **Keep Uploaded Data**: stop processing now; keep what is already committed.

**Semantics**
- Every inserted/updated record is stamped with `import_id` and `import_batch_seq`.
- **Reverse Entire Upload** workflow:
  - Mark import status `reverting` then enqueue a background job that deletes or reverts all rows with this `import_id`.
  - If merges/dedup occurred, attempt structured **unmerge** using snapshots; if not fully reversible, mark conflicts and surface a report.
  - Soft-delete first for safety; hard-delete after retention window per plan.
  - Audit event includes who canceled and the reason.
- **Keep Uploaded Data** workflow:
  - Mark import as `canceled_partial` with counts of committed vs remaining.
  - Stop remaining parse/validate/commit tasks gracefully; leave partial data intact and tag contacts with `import_id` for later filtering/cleanup.

**Edge cases & safety**
- If the job is in **Upload** stage, cancel aborts the multipart upload.
- If the job is in **Commit** stage, in-flight batch completes or rolls back atomically.
- Exports, segments, or dedup jobs triggered by this import are also canceled or reverted based on choice.
- Permission checks: only Account Owners, Admin Users (delegated), or Super Admin can cancel.

**API**
- `POST /orgs/{org_id}/imports/{import_id}/cancel` with `{ mode: "reverse" | "keep" }`.
- `GET /orgs/{org_id}/imports/{import_id}/progress` returns stage metrics for the progress UI.

---



### Manual Column Creation (during Import & in Data Model)

- **Add new target columns on the fly**: In the mapping UI, users can create fresh columns not present in the source file. Define **name**, **data type** (string, number, boolean, date, enum, JSON), **validation** (regex, length, required), **default value**, **computed formula** (optional), **PII flag**, **indexing hint**, and **visibility** (read/export permissions by role).
- **Uniqueness + collisions**: Enforce unique names per org; suggest alternatives when collisions occur and display where a name is already used in lists, segments, or exports.
- **Schema registry**: Persist new columns to an org-level schema registry; expose them in filters, segments, exports, and future imports’ auto-mapping memory.
- **Backfill & migration**: When a new column is created, backfill existing contacts with the default value or null. Track as a migration event in audit logs.
- **Templates**: Allow saving new columns to presets so future imports pre-create and map them automatically.
- **Plan controls**: Super Admin can limit custom column count and types per plan; warn users as they approach limits.



## In-Table Column Creation (Data Grid UI)

**Goal**: Let users add new columns directly from the contacts data grid without leaving context, while keeping schema safe, auditable, and performant at scale.

**UX**
- **Add Column affordances**: Rightmost header has “+ Column” button; also available via header context menu and keyboard shortcut.
- **Two modes**:
  1) **Quick Add**: Name + Type (string/number/boolean/date/enum). Optional default value. Creates immediately and shows an editable empty column.
  2) **Advanced**: Opens a side panel to set validation, regex, min/max, allowed values (enum), uniqueness, PII flag, index hint, role visibility (read/export), and **computed formula** (e.g., `concat(first_name, " ", last_name)`).
- **Scope selector**: Choose **This List only** or **Org-wide** custom field. Defaults to List scope for safety.
- **Impact preview**: Shows how many rows will be backfilled with default; estimates time for large tables. Async backfill with progress toast.
- **Undo**: 5-minute soft-undo for schema additions; full audit regardless.

**Behavior & Rules**
- **Permissions**: Account Owners can create org-wide fields; Team Members need the “Manage Schema” toggle. Admin Users can create on behalf of an org via delegated scope. Feature is plan-gated with per-plan caps.
- **Name collisions**: Inline validator prevents duplicates; suggests alternatives. Shows where a name is already used (filters, segments, exports).
- **Validation & defaults**: Applied at write-time and during bulk backfill. Invalid existing rows are marked with a badge and added to a fix queue.
- **Computed columns**: Read-only cells; recalculated in background on source-field changes via event triggers.
- **Indexing**: Index hint translates to background index creation jobs to avoid table locks. Surface status in column menu.
- **Performance**: Column appears instantly (optimistic UI). Server job applies schema and backfill asynchronously. Virtualized grid avoids re-render storms.
- **Audit & governance**: `events_audit` logs schema changes with actor, reason, scope, and impersonation context. Exports include new column only if export visibility allows.

**Backend/Infra**
- Endpoint: `POST /orgs/{org_id}/schema/fields` with body `{ scope, name, type, validation, default, computed, pii, visibility, index_hint }`.
- Migration: Writes to **schema registry** then issues DDL via safe migration runner; for Postgres, prefer `ALTER TABLE ... ADD COLUMN` with nullable default, then backfill in batches.
- Rollback: `DELETE /schema/fields/{field_id}` if empty or not referenced; otherwise soft-delete and hide from UI.

**Edge Cases**
- **List vs Org-wide** conflicts: If a List-scoped field shares a name with an Org-wide field, require rename or upgrade scope.
- **Quota exceeded**: Prompt to upgrade tier or remove unused fields.
- **Bulk edit interaction**: When a new column is created, allow immediate bulk-fill from a formula or static value over the current selection.



## In-Table Editing, On-the-Fly Tagging, and Bulk Actions

**Inline Editing**
- Click-to-edit cells with keyboard support (Enter to edit, Tab/Shift+Tab to navigate, Esc to cancel, Enter to save).
- Optimistic updates with background validation; failed writes roll back and highlight cells with error tooltips.
- Per-column validators run on blur; server-side re-validate and normalize (emails, phones, dates, addresses).
- Multi-row fill: copy a value and paste across selected cells; fill-down shortcut (Ctrl+D/Cmd+D).

**On-the-Fly Tagging**
- Tag pill editor in each row. Typeahead to add existing tags; hit Enter to create a new tag if allowed by permissions.
- Color-coded tags with quick filters from the pill itself. Tag rules can auto-apply based on conditions.
- Bulk tag add/remove via toolbar; preview counts before applying.

**Multi-Select and Bulk Operations**
- Selection modes: checkbox per row, Shift-click range, and "Select all N in view" with option to select all matching current filter.
- Bulk toolbar actions: Delete, Tag add/remove, Format values, Move to list, Export selection, Start Dedup Review, Merge, Clear values, Run custom transform.
- Bulk formatting: common transforms (trim, case, phone/email standardize, date reformat). Preview changes with sample rows before apply.
- Bulk dedup: run rules against selected records; show group clusters with suggested primary; one-click merge or send to review queue.
- Long-running jobs execute async with progress and partial failure reports. Users can download a CSV of failures.

**Permissions & Safety**
- Actions gated by role toggles. Account Owners can enable/disable bulk delete/export for Team Members.
- Destructive ops require confirmation and can be undone for a limited window. All actions logged to `events_audit` with selection snapshot.

**Performance**
- Virtualized grid and batched updates. Server accepts vectorized payloads for bulk actions with idempotency keys.

**API Endpoints**
- `POST /orgs/{org_id}/contacts/bulk` with `{ selection, action, params }` where `selection` supports ids or a saved filter reference; returns job id.
- `POST /orgs/{org_id}/contacts/{id}/tags` to add/remove; `POST /.../format` for transforms; `POST /.../dedup/start` for scoped runs.



## Deduplication Workflow (Clusters, Survivors, and Discards)

**Goal**: Let users define how duplicates are detected and explicitly choose which records to keep, merge, or discard.

**1) Target Columns & Rules**
- User selects match criteria: single column (e.g., email) or composite keys (e.g., first_name + last_name + postal_code) with optional weights.
- Presets: Email, Phone, Exact Address, Name+Address, Custom. Saveable per org.
- Normalizers applied per field (case/trim, phone E.164, address standardization) before matching.
- Fuzzy options: trigram or Jaro-Winkler similarity for names/addresses with threshold slider.

**2) Clustering**
- Engine groups suspected duplicates into **clusters** with a confidence score and reason codes (e.g., email exact, phone normalized, name similarity 0.92).
- Large clusters paginate internally; preview shows representative fields.

**3) Manual Survivor Selection**
- For each cluster, the UI shows all member records side-by-side.
- User can **manually pick the survivor** (record to keep) with a radio control per cluster.
- Remaining records can be marked **Discard** (soft delete) or **Merge into survivor** with field-by-field conflict rules.
- Quick actions: "Keep most complete", "Keep most recent activity", "Keep cleanest email"; user can override anytime.
- Multi-cluster bulk action: select multiple clusters and apply a rule (e.g., keep most complete) then review exceptions manually.

**4) Merge Preview & Field Rules**
- Preview shows the resulting survivor with per-field provenance (which source record supplied each field).
- Field resolution strategies: priority order, longest non-empty, most valid per validator, or custom formula.

**5) Apply, Undo, and Audit**
- Applying writes a **merge transaction** with reversible snapshots. Undo available for a retention window; beyond that, unmerge recreates prior state from snapshots when possible.
- All actions recorded in `events_audit` with cluster id, chosen survivor, discarded ids, and rules applied.

**6) Safety & Permissions**
- Only Account Owners, Admin Users (delegated), or Team Members with the "Manage Dedup" permission can run apply.
- Exports and segments update references to merged records; webhooks fire `contact.merged` and `contact.deleted` events.

**API**
- `POST /orgs/{org_id}/dedup/runs` with `{ criteria, thresholds, sample_only? }`.
- `GET /orgs/{org_id}/dedup/runs/{id}/clusters` to paginate clusters.
- `POST /orgs/{org_id}/dedup/runs/{id}/apply` with `{ decisions: [{ cluster_id, survivor_id, discard_ids[], field_rules{} }] }`.



## Data Formatting Rules and Normalization

**Purpose**: Ensure data consistency, readability, and interoperability across imports, in-table edits, exports, and deduplication.

**1) Standardization Layer**
- Central formatting service normalizes all user-input and imported data before storage.
- Applies consistent casing, spacing, punctuation, and locale-aware transformations.
- Formatting profiles differ by data type but are enforced globally unless overridden per org.

**2) Field-Specific Rules**
- **Email**: Lowercase, trim, validate RFC 5322, and remove dots in Gmail local part (optional). Duplicate detection is case-insensitive.
- **Phone**: Convert to E.164 format using country inference or default org country; remove non-numeric characters.
- **Addresses**: Title case, abbreviate standard postal terms, validate via postal API; normalize state/country codes (ISO 3166).
- **Names**: Capitalize first letters, trim spaces, merge initials intelligently. Preserve known all-caps acronyms (e.g., "IBM"), keep lowercase particles where appropriate (e.g., "de la").
- **Name Suffixes**: Normalize to canonical forms with punctuation and casing: "Jr.", "Sr.", "III", "IV". Ensure proper placement after a comma (e.g., "John Smith, Jr."). Accept inputs like "jr", "JR", "Iii" and convert consistently. Avoid duplicating existing suffixes.
- **Company Names**: Normalize legal entity designators to a configurable style guide: "Inc", "LLC", "LLP", "Ltd.", "Corp.", "Co.", "PLC". Collapse excess punctuation/spaces ("INC." → "Inc"). Ensure designator appears once, at the end, and preserve the core brand casing. Optionally strip designator for display-only contexts while retaining in a separate field.
- **Dates**: Convert to UTC ISO 8601 internally; display in user’s local time zone. Supports multiple input formats.
- **Numbers**: Strip thousands separators, enforce decimal precision per schema; localized formatting handled in UI only.
- **Tags**: Lowercase unique key, human-readable label stored separately.
- **Custom Fields**: Follows declared data type and validation pattern; fallback to string normalization.

**3) Application Points**
- **On Import**: All data passes through formatter before validation and insert. Normalized and raw values stored separately for audit.
- **In-Table Editing**: Changes run through same formatter; invalid formats are highlighted inline.
- **Deduplication**: Normalized forms used for comparisons to improve matching accuracy.
- **Export**: Option to export formatted, raw, or both versions depending on compliance or downstream system needs.

**4) Extensibility and Overrides**
- Account Owners can override specific rules (e.g., phone formatting locale) in org settings.
- Super Admin can publish new formatting rules globally without downtime.
- Enterprise orgs can upload custom formatter plug-ins via sandboxed scripts.

**5) Auditing and Rollback**
- Every format transformation logged in `events_audit` with before/after values when changes alter normalized data.
- Restoring original unformatted data available from audit trail within the retention window.



### Formatting Examples & Style Guide Toggles

**Example normalizations (inputs → outputs)**
- Company types: `ACME INC.` → `ACME Inc`; `Blue Sky llc` → `Blue Sky LLC`; `DataCorp, corp.` → `DataCorp Corp.`; `North Sea ltd` → `North Sea Ltd.`
- Name suffixes: `john smith jr` → `John Smith, Jr.`; `MARIA LOPEZ SR` → `Maria Lopez, Sr.`; `Evan Cole iii` → `Evan Cole, III`; `R. K. Patel iv` → `R. K. Patel, IV`
- Mixed cases: `ibm, inc.` → `IBM Inc`; `McDONALD lLc` → `McDonald LLC`

**Style guide toggles (org-level)**
- Company designator punctuation: `Inc` vs `Inc.`
- Company designator casing: `LLC` vs `Llc` (default preserves acronym forms like `LLC`)
- Suffix punctuation: `Jr.`/`Sr.` with period vs without
- Suffix delimiter: include comma before suffix (`John Smith, Jr.`) on/off
- Preserve brand acronyms: always keep recognized acronyms uppercase (on by default)
- Strip designators in display-only contexts while retaining a structured `legal_designator` field (on/off)

**Validation aids**
- Warn when multiple designators are detected (e.g., `Acme Inc LLC`); suggest one per org policy.
- Warn when suffix and generational numerals conflict (`Jr.` with `III`).
- Provide one-click fixes in the grid and during import preview.



## Address Validation and Skip Tracing (Paid Actions)

**UI Entry Points**
- Two buttons on the data table toolbar: **Validate** and **Skip Trace**. Enabled only when one or more rows are selected and the user has an eligible plan/permission.
- Both open a side panel with input mapping, cost estimate, and a run summary.

**Plans, Permissions, and Pricing**
- Feature-gated by plan. Per-record metered pricing with real-time cost estimate: `estimated_cost = unit_price * selected_count` minus discounts.
- Permissions: toggleable per role. Admin Users may run on behalf of an org via delegated scope.

### Validate (AccuZip + USPS)
**Purpose**: Verify deliverability and standardize name and address data.

**Flow**
1) User reviews the input fields to send (defaults from org schema: first_name, last_name, address_line1, address_line2, city, state, postal_code).
2) System batches the selection and calls your **AccuZip API**. Retries with backoff on transient errors; respects rate limits.
3) Progress bar shows records validated, corrected, undeliverable, and errors.
4) Results write back to the grid as **new columns**; existing columns may be standardized per formatting rules.

**Result Columns (examples)**
- `usps_status` (Deliverable, Undeliverable, Vacant, Unknown)
- `dpv_code`, `dpv_footnotes`, `carrier_route`, `lot_number`
- `address_line1_std`, `address_line2_std`, `city_std`, `state_std`, `postal_code_std`
- `first_name_std`, `last_name_std`
- `validation_timestamp`, `validation_source` (`accuzip`), `validation_confidence`

**Safety**
- Original values preserved; standardized values stored alongside with provenance. One-click restore from audit.
- Partial failures quarantined; users can download an errors CSV.

**API**
- `POST /orgs/{org_id}/validate/start` with `{ selection, input_map, provider:"accuzip" }` → returns `job_id`.
- `GET /orgs/{org_id}/validate/{job_id}/status` for progress.
- Webhook handler for AccuZip callbacks (optional) to mark batches complete.

### Skip Trace (3rd-party provider)
**Purpose**: Enrich selected records with additional contact details.

**Flow**
1) User chooses which input fields to send (e.g., name, last known address, DOB, prior emails/phones). Mapping is saved per org.
2) System batches and calls the configured **Skip Trace provider**. Supports pluggable providers via adapter interface.
3) Progress shows found vs not-found counts; costs update as results arrive if provider is pay-per-hit.
4) Responses are appended as **new namespaced columns**; multiple values become indexed arrays or numbered columns.

**Result Columns (examples)**
- `skiptrace_emails[]`, `skiptrace_phones[]` (E.164), `skiptrace_alt_addresses[]` (structured)
- `skiptrace_relatives[]` (structured sub-objects with relationship)
- `skiptrace_score`, `skiptrace_provider`, `skiptrace_timestamp`

**Privacy and Governance**
- All new fields are flagged as PII by default; visibility controlled by role and plan.
- Consent and permissible-purpose attestation shown before first run; stored in audit.

**API**
- `POST /orgs/{org_id}/skiptrace/start` with `{ selection, input_map, provider, options }` → `job_id`.
- `GET /orgs/{org_id}/skiptrace/{job_id}/status` for progress.

### Jobs, Progress, and Cancel
- Long-running tasks run as background jobs with resumable checkpoints and idempotency keys.
- Users can **Cancel** a running job:
  - **Keep Results**: preserves completed writes; stops remaining batches.
  - **Reverse Job**: removes only the columns/rows written by this job, using `job_id` and per-row change journal.
- Progress includes batches completed, remaining, success rate, cost-to-date, ETA.

### Bulk and Selection Semantics
- Supports “selected rows” or “all rows matching current filter.” The latter records the filter snapshot for replayability.

### Audit and Observability
- Every change is recorded in `events_audit` with `job_id`, provider, input mapping hash, before/after diffs, actor, and impersonation context.
- Admin console shows job history, costs, error rates, and provider latency per org.

### Error Handling and Retries
- Exponential backoff with jitter, dead-letter queue for persistent failures, and per-record retry caps.
- Graceful degradation when providers throttle; informs user and pauses batches.

### Quotas and Rate Limits
- Per-plan daily caps and concurrency limits. Overflow goes to a scheduled queue with time windows.

### UX Details
- Side panel screens: **Inputs**, **Estimate**, **Run**, **Results**. Results screen links to created columns and offers quick filters (e.g., “Undeliverable”).
- Tooltips explain each added column. Column groups collapse under “Validation” or “Skip Trace” in the grid for readability.

