# Database Migration Guide

This directory contains SQL migration files for the Mailing List Manager database schema.

## Migration Order

Run the migrations in the following order:

1. **001_create_platform_layer.sql** - Platform layer (users, refresh_tokens)
2. **002_create_organization_layer.sql** - Organization layer (orgs, org_memberships)
3. **003_create_data_management_layer.sql** - Data management (lists, contacts, tags, segments, custom_fields)
4. **004_create_operations_layer.sql** - Operations (imports, exports, dedup, validation, skiptrace)
5. **005_create_audit_and_billing_layer.sql** - Audit & billing (events_audit, billing_subscriptions, usage_counters)
6. **006_enable_row_level_security.sql** - Row-Level Security policies for multi-tenant isolation

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste each migration file content
4. Execute them in order (001 → 006)
5. Check for any errors in the output

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Navigate to project root
cd /home/rob/dev/mlm

# Run migrations
supabase db push

# Or run individual migration files
psql $DATABASE_URL -f migrations/001_create_platform_layer.sql
psql $DATABASE_URL -f migrations/002_create_organization_layer.sql
psql $DATABASE_URL -f migrations/003_create_data_management_layer.sql
psql $DATABASE_URL -f migrations/004_create_operations_layer.sql
psql $DATABASE_URL -f migrations/005_create_audit_and_billing_layer.sql
psql $DATABASE_URL -f migrations/006_enable_row_level_security.sql
```

### Option 3: PostgreSQL Client

If you have direct PostgreSQL access:

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run each migration file
\i migrations/001_create_platform_layer.sql
\i migrations/002_create_organization_layer.sql
\i migrations/003_create_data_management_layer.sql
\i migrations/004_create_operations_layer.sql
\i migrations/005_create_audit_and_billing_layer.sql
\i migrations/006_enable_row_level_security.sql
```

## Verification

After running all migrations, verify the schema:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Check policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

## Schema Overview

### Platform Layer (No org_id)
- **users** - Platform-level user identities
- **refresh_tokens** - JWT token management

### Organization Layer (Has org_id)
- **orgs** - Organization/tenant entities
- **org_memberships** - User-org relationships with roles and permissions

### Data Management Layer
- **lists** - Contact collections
- **contacts** - Contact records (PII encrypted at app layer)
- **tags** - Tag definitions
- **segments** - Dynamic contact subsets
- **custom_fields** - Schema registry for custom fields

### Operations Layer
- **imports** - Import job tracking
- **import_rows** - Import staging/validation
- **exports** - Export job tracking
- **dedup_runs** - Deduplication jobs
- **dedup_clusters** - Dedup cluster details
- **dedup_merges** - Merge audit trail
- **validation_jobs** - Address validation (AccuZip)
- **skiptrace_jobs** - Skip trace enrichment

### Audit & Billing Layer
- **events_audit** - Comprehensive audit log
- **billing_subscriptions** - Stripe subscription tracking
- **usage_counters** - Usage metrics for quotas

## Row-Level Security (RLS)

All tenant tables have RLS enabled with policies that filter by `org_id`.

**How it works:**
1. Application sets the org context per request: `SET LOCAL app.org_id = 'uuid'`
2. All queries are automatically filtered by the RLS policy
3. Users can only access data from their current organization

**Example middleware:**
```typescript
// Set org context before queries
await db.$executeRaw`SET LOCAL app.org_id = ${orgId}`;

// All subsequent queries are automatically filtered
const contacts = await db.contacts.findMany({}); // Only returns contacts for orgId
```

## Important Notes

1. **PII Encryption**: The `contacts` table stores encrypted PII fields. Encryption happens at the application layer before database storage.

2. **Hash Fields**: Fields like `email_hash` and `phone_hash` allow searching without decryption (HMAC-SHA256).

3. **Soft Deletes**: Most tables support soft deletion via `deleted_at` timestamp.

4. **JSONB Fields**: Many tables use JSONB for flexible schema (custom_fields, settings, filter_definition, etc.).

5. **Indexes**: All necessary indexes are created in the migration files for optimal query performance.

6. **Foreign Keys**: Proper cascade behaviors are configured (CASCADE, SET NULL, RESTRICT).

## Troubleshooting

### Permission Errors
If you get permission errors when running migrations, ensure:
- You're using the `postgres` role or service_role key
- Your Supabase project has the necessary privileges enabled

### RLS Policies Blocking Queries
If queries return no results after enabling RLS:
- Ensure you're setting `app.org_id` in your session before queries
- Check that the org_id values match between the session variable and data
- For testing, you can temporarily disable RLS: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

### Migration Conflicts
If a migration fails partway through:
- Check which objects were created: `\dt` (tables), `\di` (indexes), `\df` (functions)
- Drop conflicting objects before re-running: `DROP TABLE IF EXISTS table_name CASCADE;`
- Or use `CREATE TABLE IF NOT EXISTS` statements (already included in migrations)

## Next Steps

After running migrations:

1. **Create Test Data**: Insert sample users, orgs, and contacts for testing
2. **Configure Application**: Update app database connection and RLS context setting
3. **Test RLS**: Verify multi-tenant isolation works correctly
4. **Set up Backups**: Configure Supabase backup schedules
5. **Monitor Performance**: Use Supabase logs to identify slow queries

## References

- [Database Schema Documentation](../docs/Database-Schema.md)
- [API Specification](../docs/API-Specification.md)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
