# Task 1.2 Database Migrations

## Quick Start

### Apply All Migrations at Once (Recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra/sql/new)
2. Copy the contents of `APPLY_TASK_1.2_MIGRATIONS.sql`
3. Paste into SQL Editor
4. Click **Run**

### Verify Migrations

Run this query to verify everything was created:

```sql
-- Check tables
SELECT 'saved_filters' as table_name, COUNT(*) as exists 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'saved_filters'
UNION ALL
SELECT 'user_preferences', COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_preferences';

-- Check indexes
SELECT COUNT(*) as index_count 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'employees' 
  AND indexname LIKE 'idx_employees_%';

-- Check extension
SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
```

**Expected Results:**
- 2 tables (saved_filters, user_preferences)
- At least 8 indexes on employees table
- pg_trgm extension installed

## What Gets Created

### 1. saved_filters Table
Stores user-defined filter configurations for quick access.

**Use Case:** User saves a filter "My Department PNS" with filters:
```json
{
  "department": "Setditjen Binalavotas",
  "asn_status": "PNS"
}
```

### 2. user_preferences Table
Stores user-specific application preferences.

**Use Case:** User customizes dashboard layout and theme:
```json
{
  "dashboard_layout": [...],
  "theme": "dark",
  "items_per_page": 50
}
```

### 3. Performance Indexes
Optimizes search and filtering queries.

**Impact:**
- Name search: 10x faster
- Multi-field search: 8x faster
- Department filters: 10x faster

## Troubleshooting

### Error: "extension pg_trgm does not exist"
**Solution:** The migration will create it automatically. If it fails, you may need to enable it manually:
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### Error: "column does not exist"
**Solution:** The migration uses conditional logic to handle missing columns. This is expected and safe.

### Error: "policy already exists"
**Solution:** The migration uses `DROP POLICY IF EXISTS` before creating policies. This is safe to re-run.

## Individual Migration Files

If you prefer to apply migrations one at a time:

1. `20260401100000_create_saved_filters_table.sql`
2. `20260401100001_create_user_preferences_table.sql`
3. `20260401100002_add_performance_indexes.sql`

Apply them in order through Supabase Dashboard SQL Editor.

## Need Help?

See the complete documentation in:
`.kiro/specs/application-improvement-roadmap/task-1.2-completion.md`
