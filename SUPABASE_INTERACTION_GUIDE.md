# Supabase Interaction Guide - SIMPEL Project

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Running Migrations](#running-migrations)
3. [Executing SQL Queries](#executing-sql-queries)
4. [Troubleshooting](#troubleshooting)
5. [Best Practices](#best-practices)

---

## Environment Setup

### Required Environment Variables

File: `.env`

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://mauyygrbdopmpdpnwzra.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Service Role Key (for server-side operations only)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Access Token (for Supabase CLI) - IMPORTANT: This expires!
SUPABASE_ACCESS_TOKEN="sbp_22ba3f60a354b232096872aabe63e66c1a8ebdd5"

# Database Connection
DATABASE_URL="postgresql://postgres:Aliham251118!@db.mauyygrbdopmpdpnwzra.supabase.co:5432/postgres"
SUPABASE_DB_PASSWORD="Aliham251118!"
```

### Important Notes:
- ✅ **Access Token expires** - update regularly when you get 401 errors
- ✅ **DB Password** must be set as environment variable for CLI commands
- ✅ **Never commit** `.env` to git (already in `.gitignore`)

---

## Running Migrations

### Method 1: Using Supabase CLI (RECOMMENDED)

#### Prerequisites
```powershell
# Install Supabase CLI (if not installed)
npm install -g supabase

# Or use npx (no installation needed)
npx -y supabase@2.93.0 --version
```

#### Push Migrations to Remote Database

**✅ WORKING COMMAND:**

```powershell
$env:SUPABASE_DB_PASSWORD="Aliham251118!"; npx -y supabase@2.93.0 db push --linked
```

**Breakdown:**
- `$env:SUPABASE_DB_PASSWORD="..."` - Set DB password as environment variable
- `npx -y supabase@2.93.0` - Use specific Supabase CLI version
- `db push` - Push local migrations to remote database
- `--linked` - Use linked project (configured in `.supabase/config.toml`)

**Expected Output:**
```
Applying migration 20260421100000_add_unit_activity_monitoring.sql...
Applying migration 20260421100001_fix_monitoring_view_show_all_units.sql...
✓ All migrations applied successfully
```

#### Common Errors and Solutions

**Error: `unexpected status 401: {"message":"Unauthorized"}`**

**Solution:** Access token expired, update it:
1. Get new token from Supabase Dashboard → Settings → API → Generate new token
2. Update `.env` file:
   ```env
   SUPABASE_ACCESS_TOKEN="sbp_NEW_TOKEN_HERE"
   ```
3. Run command again

**Error: `Failed to run sql query: ERROR: relation already exists`**

**Solution:** Migration already applied, skip it or create new migration

---

## Executing SQL Queries

### Method 1: Using Supabase CLI (RECOMMENDED)

#### Execute SQL Query Directly

**✅ WORKING COMMAND:**

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_22ba3f60a354b232096872aabe63e66c1a8ebdd5"; $env:SUPABASE_DB_PASSWORD="Aliham251118!"; npx -y supabase@2.93.0 db query "SELECT * FROM employees LIMIT 5;" --linked
```

**Example Output:**
```
┌──────────────────────┬──────────┬────────────┐
│         name         │ asn_status │ rank_group │
├──────────────────────┼──────────┼────────────┤
│ Abdullah Qiqi Asmara │ PNS      │ Pembina... │
└──────────────────────┴──────────┴────────────┘
```

#### Execute SQL from File

**✅ WORKING COMMAND:**

```powershell
$env:SUPABASE_ACCESS_TOKEN="sbp_22ba3f60a354b232096872aabe63e66c1a8ebdd5"; $env:SUPABASE_DB_PASSWORD="Aliham251118!"; Get-Content check_rank_data.sql | npx -y supabase@2.93.0 db query --linked
```

**SQL File Example:** `check_rank_data.sql`

```sql
-- Check rank_group data
SELECT 
  id,
  name,
  asn_status,
  rank_group,
  department
FROM employees
WHERE rank_group IS NOT NULL 
  AND rank_group != ''
LIMIT 10;
```

**Important Notes:**
- ❌ **DO NOT use `\echo`** - not supported in CLI query
- ❌ **DO NOT use `--file` flag** - use pipe instead: `Get-Content file.sql | npx supabase db query --linked`
- ✅ **DO use simple SQL** - complex scripts may fail

### Method 2: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select project: **simpel**
3. Go to **SQL Editor**
4. Paste your SQL query
5. Click **Run**

**Pros:**
- ✅ Visual interface
- ✅ Query history
- ✅ Syntax highlighting

**Cons:**
- ❌ Manual process
- ❌ Not scriptable
- ❌ No version control

---

## Migration File Structure

### Naming Convention

```
supabase/migrations/YYYYMMDDHHMMSS_description.sql
```

**Example:**
```
supabase/migrations/20260421100000_add_unit_activity_monitoring.sql
```

**Rules:**
- ✅ Use timestamp format: `YYYYMMDDHHMMSS`
- ✅ Use descriptive name with underscores
- ✅ Keep names short but clear
- ✅ Sequential order matters

### Migration File Template

```sql
-- Migration: Add new feature
-- Created: 2026-04-21
-- Description: Brief description of what this migration does

BEGIN;

-- 1. Create tables
CREATE TABLE IF NOT EXISTS public.new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create indexes
CREATE INDEX idx_new_table_name ON public.new_table(name);

-- 3. Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view own data"
ON public.new_table FOR SELECT
USING (auth.uid() = user_id);

-- 5. Create functions (if needed)
CREATE OR REPLACE FUNCTION public.get_data()
RETURNS TABLE(...) AS $$
BEGIN
  -- Function logic
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
```

**Best Practices:**
- ✅ Wrap in `BEGIN;` and `COMMIT;` for transaction safety
- ✅ Use `IF NOT EXISTS` to make migrations idempotent
- ✅ Add comments explaining what each section does
- ✅ Test locally before pushing to production

---

## Common SQL Operations

### 1. Check Data

```sql
-- Count records
SELECT COUNT(*) FROM employees;

-- Check specific field
SELECT name, rank_group 
FROM employees 
WHERE rank_group IS NULL 
LIMIT 10;

-- Check data distribution
SELECT rank_group, COUNT(*) as count
FROM employees
GROUP BY rank_group
ORDER BY count DESC;
```

### 2. Update Data

```sql
-- Update single record
UPDATE employees 
SET rank_group = 'Pembina (IV/a)' 
WHERE id = 'uuid-here';

-- Update multiple records
UPDATE employees 
SET rank_group = 'Tenaga Alih Daya' 
WHERE asn_status = 'Non ASN' 
  AND rank_group IS NULL;

-- Update with condition
UPDATE employees 
SET rank_group = NULL 
WHERE rank_group = '-';
```

### 3. Create Views

```sql
-- Create or replace view
CREATE OR REPLACE VIEW unit_activity_summary AS
SELECT 
  department,
  COUNT(*) as total_changes,
  MAX(updated_at) as last_update
FROM employees
GROUP BY department;
```

### 4. Create Functions

```sql
-- Create function
CREATE OR REPLACE FUNCTION get_unit_monthly_details(
  p_department TEXT,
  p_year INT,
  p_month INT
)
RETURNS TABLE(
  change_type TEXT,
  change_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'mutation' as change_type,
    COUNT(*) as change_count
  FROM mutation_history
  WHERE department = p_department
    AND EXTRACT(YEAR FROM tanggal) = p_year
    AND EXTRACT(MONTH FROM tanggal) = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Troubleshooting

### Issue 1: 401 Unauthorized

**Symptoms:**
```
unexpected status 401: {"message":"Unauthorized"}
```

**Solution:**
1. Get new access token from Supabase Dashboard
2. Update `.env` file
3. Retry command

### Issue 2: Migration Already Applied

**Symptoms:**
```
ERROR: relation "table_name" already exists
```

**Solution:**
- Check if migration already applied: Look at Supabase Dashboard → Database → Migrations
- If already applied, skip it
- If partially applied, rollback and reapply

### Issue 3: Syntax Error in SQL

**Symptoms:**
```
ERROR: 42601: syntax error at or near "..."
```

**Solution:**
- Check SQL syntax
- Remove `\echo` commands (not supported in CLI)
- Test query in Supabase Dashboard SQL Editor first

### Issue 4: Permission Denied

**Symptoms:**
```
ERROR: permission denied for table ...
```

**Solution:**
- Check RLS policies
- Ensure user has correct role
- Use `SECURITY DEFINER` for functions that need elevated permissions

---

## Best Practices

### 1. Always Use Environment Variables

```powershell
# ✅ GOOD
$env:SUPABASE_DB_PASSWORD="password"; npx supabase db push --linked

# ❌ BAD - hardcoded password
npx supabase db push --linked --password "password"
```

### 2. Test Queries Before Migration

```powershell
# Test query first
$env:SUPABASE_ACCESS_TOKEN="..."; npx supabase db query "SELECT 1;" --linked

# If successful, create migration
```

### 3. Use Transactions

```sql
-- ✅ GOOD
BEGIN;
  UPDATE employees SET rank_group = 'X';
  UPDATE mutation_history SET ...;
COMMIT;

-- ❌ BAD - no transaction
UPDATE employees SET rank_group = 'X';
UPDATE mutation_history SET ...;
```

### 4. Backup Before Major Changes

```powershell
# Export data before major migration
$env:SUPABASE_ACCESS_TOKEN="..."; npx supabase db dump --linked > backup.sql
```

### 5. Version Control Migrations

```bash
# Always commit migrations to git
git add supabase/migrations/
git commit -m "Add: unit activity monitoring migration"
git push
```

---

## Quick Reference Commands

### Setup
```powershell
# Set environment variables
$env:SUPABASE_ACCESS_TOKEN="sbp_..."
$env:SUPABASE_DB_PASSWORD="..."
```

### Migrations
```powershell
# Push migrations
$env:SUPABASE_DB_PASSWORD="..."; npx -y supabase@2.93.0 db push --linked

# Check migration status
npx -y supabase@2.93.0 migration list --linked
```

### Queries
```powershell
# Execute query
$env:SUPABASE_ACCESS_TOKEN="..."; $env:SUPABASE_DB_PASSWORD="..."; npx -y supabase@2.93.0 db query "SELECT * FROM employees LIMIT 5;" --linked

# Execute from file
$env:SUPABASE_ACCESS_TOKEN="..."; $env:SUPABASE_DB_PASSWORD="..."; Get-Content query.sql | npx -y supabase@2.93.0 db query --linked
```

### Projects
```powershell
# List projects
$env:SUPABASE_ACCESS_TOKEN="..."; npx -y supabase@2.93.0 projects list

# Link project
npx -y supabase@2.93.0 link --project-ref mauyygrbdopmpdpnwzra
```

---

## Project-Specific Information

### Current Project
- **Project Name:** SIMPEL Production
- **Project ID:** mauyygrbdopmpdpnwzra
- **Region:** Southeast Asia (Singapore)
- **Database:** PostgreSQL

### Key Tables
- `employees` - Main employee data
- `mutation_history` - Employee transfers
- `position_history` - Position changes
- `rank_history` - Rank promotions
- `education_history` - Education records
- `profiles` - User profiles
- `user_roles` - User role assignments

### Key Views
- `unit_activity_summary` - Monthly activity per unit

### Key Functions
- `get_unit_monthly_details()` - Get detailed changes for a unit/month
- `has_role()` - Check user role
- `get_user_department()` - Get user's department

---

## Success Indicators

When commands work correctly, you should see:

### Migrations
```
✓ All migrations applied successfully
```

### Queries
```
┌──────────┬──────────┐
│   name   │  value   │
├──────────┼──────────┤
│ Result   │ Success  │
└──────────┴──────────┘
```

### Projects
```
LINKED | ORG ID | REFERENCE ID | NAME | REGION | CREATED AT
  ●    | ...    | mauyygr...   | simpel | SEA  | 2026-03-31
```

---

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Supabase Migrations Guide](https://supabase.com/docs/guides/cli/local-development)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Changelog

- **2026-04-21**: Initial documentation created
- **2026-04-21**: Added unit activity monitoring migrations
- **2026-04-21**: Added created_by tracking to history tables
- **2026-04-21**: Fixed rank_group data issues

---

## Contact

For issues or questions about Supabase interactions, refer to this guide first. If issues persist, check:
1. Supabase Dashboard for error logs
2. Terminal output for detailed error messages
3. `.env` file for correct credentials
