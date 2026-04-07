# Supabase MCP Best Practices

## Migration Best Practices

### 1. Always Use IF NOT EXISTS

**❌ Bad:**
```sql
ALTER TABLE profiles ADD COLUMN new_column jsonb;
```

**✅ Good:**
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS new_column jsonb DEFAULT '[]'::jsonb;
```

**Why:** Makes migration idempotent - safe to run multiple times.

### 2. Add Default Values

**❌ Bad:**
```sql
ALTER TABLE profiles ADD COLUMN preferences jsonb;
```

**✅ Good:**
```sql
ALTER TABLE profiles 
ADD COLUMN preferences jsonb DEFAULT '{}'::jsonb NOT NULL;
```

**Why:** Prevents NULL values, ensures data consistency.

### 3. Document with Comments

**❌ Bad:**
```sql
ALTER TABLE profiles ADD COLUMN data jsonb;
```

**✅ Good:**
```sql
ALTER TABLE profiles 
ADD COLUMN data_builder_templates jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN profiles.data_builder_templates IS 
'User saved query templates for Data Builder stored as JSON array. 
Each template contains: id, name, description, columns, filters, relatedTables.';
```

**Why:** Self-documenting database, helps future developers.

### 4. Use Transactions for Complex Migrations

**❌ Bad:**
```sql
ALTER TABLE profiles ADD COLUMN status text;
UPDATE profiles SET status = 'active';
ALTER TABLE profiles ALTER COLUMN status SET NOT NULL;
```

**✅ Good:**
```sql
BEGIN;

ALTER TABLE profiles ADD COLUMN status text;
UPDATE profiles SET status = 'active' WHERE status IS NULL;
ALTER TABLE profiles ALTER COLUMN status SET NOT NULL;

COMMIT;
```

**Why:** All-or-nothing execution, prevents partial failures.

### 5. Verify After Migration

**❌ Bad:**
```sql
ALTER TABLE profiles ADD COLUMN new_column jsonb;
-- Hope it worked!
```

**✅ Good:**
```sql
ALTER TABLE profiles ADD COLUMN new_column jsonb;

-- Verify
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'new_column';
```

**Why:** Confirms migration success, catches errors early.

## Security Best Practices

### 1. Never Commit Secrets

**❌ Bad:**
```env
# .env (committed to git)
SUPABASE_ACCESS_TOKEN="sbp_actual_token_here"
```

**✅ Good:**
```env
# .env (in .gitignore)
SUPABASE_ACCESS_TOKEN="sbp_actual_token_here"

# .env.example (committed to git)
SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
```

**Why:** Prevents token leakage, protects production access.

### 2. Use Different Tokens for Different Environments

**❌ Bad:**
```env
# Same token for dev and prod
SUPABASE_ACCESS_TOKEN="sbp_production_token"
```

**✅ Good:**
```env
# Development
SUPABASE_ACCESS_TOKEN="sbp_dev_token"

# Production (different token)
SUPABASE_ACCESS_TOKEN="sbp_prod_token"
```

**Why:** Limits blast radius, easier to revoke.

### 3. Rotate Tokens Regularly

**Schedule:**
- Development: Every 3 months
- Production: Every month
- After team member leaves: Immediately

**Process:**
1. Generate new token
2. Update .env files
3. Test connections
4. Revoke old token
5. Document change

### 4. Use Service Role Key Carefully

**❌ Bad:**
```javascript
// Frontend code
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

**✅ Good:**
```javascript
// Backend/server only
const supabase = createClient(url, SERVICE_ROLE_KEY);

// Frontend
const supabase = createClient(url, ANON_KEY);
```

**Why:** Service role bypasses RLS, never expose to client.

## Development Workflow Best Practices

### 1. Test in Development First

**Workflow:**
```
1. Write migration SQL
2. Test in local database
3. Test in development environment
4. Review with team
5. Apply to staging
6. Verify in staging
7. Apply to production
8. Monitor production
```

### 2. Use Migration Files

**❌ Bad:**
```
Run SQL directly in production
```

**✅ Good:**
```
supabase/migrations/
├── 20260407000000_add_templates_column.sql
├── 20260407000001_add_templates_index.sql
└── 20260407000002_update_rls_policies.sql
```

**Why:** Version control, reproducible, auditable.

### 3. Name Migrations Descriptively

**❌ Bad:**
```
20260407000000_migration.sql
20260407000001_update.sql
```

**✅ Good:**
```
20260407000000_add_data_builder_templates_column.sql
20260407000001_create_templates_index.sql
20260407000002_add_templates_rls_policies.sql
```

**Why:** Self-documenting, easy to understand history.

### 4. Keep Migrations Small

**❌ Bad:**
```sql
-- One huge migration with 50 changes
ALTER TABLE profiles ADD COLUMN a text;
ALTER TABLE profiles ADD COLUMN b text;
-- ... 48 more changes
```

**✅ Good:**
```sql
-- Migration 1: Add column
ALTER TABLE profiles ADD COLUMN new_column jsonb;

-- Migration 2: Add index
CREATE INDEX idx_new_column ON profiles(new_column);

-- Migration 3: Update RLS
CREATE POLICY ...
```

**Why:** Easier to review, easier to rollback, clearer history.

## Performance Best Practices

### 1. Add Indexes for Filtered Columns

**❌ Bad:**
```sql
ALTER TABLE profiles ADD COLUMN status text;
-- No index, slow queries
```

**✅ Good:**
```sql
ALTER TABLE profiles ADD COLUMN status text;

CREATE INDEX idx_profiles_status ON profiles(status);
```

**Why:** Faster queries, better performance.

### 2. Use CONCURRENTLY for Large Tables

**❌ Bad:**
```sql
-- Locks table during index creation
CREATE INDEX idx_name ON large_table(column);
```

**✅ Good:**
```sql
-- Doesn't lock table
CREATE INDEX CONCURRENTLY idx_name ON large_table(column);
```

**Why:** Prevents downtime, allows concurrent access.

### 3. Analyze After Major Changes

**After migration:**
```sql
ANALYZE profiles;
```

**Why:** Updates statistics, improves query planner.

### 4. Monitor Query Performance

**Before migration:**
```sql
EXPLAIN ANALYZE SELECT * FROM profiles WHERE status = 'active';
```

**After migration:**
```sql
EXPLAIN ANALYZE SELECT * FROM profiles WHERE status = 'active';
```

**Compare:** Ensure performance didn't degrade.

## Error Handling Best Practices

### 1. Always Have Rollback Plan

**Migration:**
```sql
-- forward.sql
ALTER TABLE profiles ADD COLUMN new_column jsonb;
```

**Rollback:**
```sql
-- rollback.sql
ALTER TABLE profiles DROP COLUMN IF EXISTS new_column;
```

### 2. Test Rollback

**Process:**
1. Apply migration in dev
2. Test application
3. Run rollback
4. Verify rollback worked
5. Re-apply migration
6. Document rollback procedure

### 3. Handle Errors Gracefully

**❌ Bad:**
```javascript
await executeSQLViaManagementAPI(sql);
// Hope it worked
```

**✅ Good:**
```javascript
try {
  const result = await executeSQLViaManagementAPI(sql);
  console.log('✅ Migration successful:', result);
  
  // Verify
  const verify = await verifyMigration();
  if (!verify.success) {
    throw new Error('Verification failed');
  }
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  console.log('📋 Rollback SQL:', rollbackSQL);
  process.exit(1);
}
```

### 4. Log Everything

**Good logging:**
```javascript
console.log('🚀 Starting migration:', migrationName);
console.log('📝 SQL:', sql);
console.log('🔧 Project:', projectId);
console.log('⏰ Timestamp:', new Date().toISOString());

// Execute
const result = await executeSQLViaManagementAPI(sql);

console.log('✅ Result:', result);
console.log('⏱️ Duration:', duration);
```

## Documentation Best Practices

### 1. Document Every Migration

**In migration file:**
```sql
-- ============================================
-- Migration: Add data_builder_templates column
-- Date: 2026-04-07
-- Author: Developer Name
-- Purpose: Enable Query Templates feature
-- Dependencies: None
-- Rollback: DROP COLUMN data_builder_templates
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS data_builder_templates jsonb DEFAULT '[]'::jsonb;
```

### 2. Maintain Migration Log

**File: `supabase/MIGRATION_LOG.md`**
```markdown
# Migration Log

## 2026-04-07

### Add Data Builder Templates Column
- **File**: 20260407000000_add_data_builder_templates.sql
- **Status**: ✅ Applied
- **Applied by**: Kiro MCP
- **Duration**: 2 seconds
- **Verified**: Yes
- **Rollback tested**: Yes
```

### 3. Document Breaking Changes

**In CHANGELOG.md:**
```markdown
## [1.2.0] - 2026-04-07

### Added
- Query Templates feature in Data Builder
- `data_builder_templates` column in profiles table

### Breaking Changes
- None

### Migration Required
- Yes: Run migration 20260407000000
```

## Team Collaboration Best Practices

### 1. Review Migrations

**Process:**
1. Create PR with migration
2. Team reviews SQL
3. Test in dev environment
4. Approve and merge
5. Apply to staging
6. Apply to production

### 2. Communicate Changes

**Before migration:**
```
Team notification:
"Planning to add data_builder_templates column to profiles table.
Migration scheduled for: 2026-04-07 10:00 UTC
Expected downtime: None
Rollback plan: Available
```

### 3. Document Decisions

**In migration file or docs:**
```sql
-- Decision: Using JSONB instead of separate table
-- Reason: Simpler schema, better performance for small datasets
-- Trade-off: Less flexible for complex queries
-- Reviewed by: Team lead
-- Approved: 2026-04-06
```

## Monitoring Best Practices

### 1. Monitor After Migration

**Check:**
- Application logs for errors
- Database performance metrics
- User reports
- Error tracking (Sentry, etc.)

### 2. Set Up Alerts

**Alert on:**
- High error rate
- Slow queries
- Database connection issues
- Disk space usage

### 3. Keep Metrics

**Track:**
- Migration duration
- Success/failure rate
- Rollback frequency
- Performance impact

## Quick Reference Checklist

### Before Migration
- [ ] SQL syntax validated
- [ ] Tested in development
- [ ] Rollback SQL prepared
- [ ] Team notified
- [ ] Backup created
- [ ] Documentation updated
- [ ] Performance impact assessed

### During Migration
- [ ] Monitor logs
- [ ] Watch for errors
- [ ] Verify success
- [ ] Check application health

### After Migration
- [ ] Verify data integrity
- [ ] Check application functionality
- [ ] Monitor performance
- [ ] Update documentation
- [ ] Notify team of completion

## Next Steps

- [API Reference](./06-API-REFERENCE.md)
- [Troubleshooting](./04-TROUBLESHOOTING.md)
- [Running Migrations](./03-RUNNING-MIGRATIONS.md)
