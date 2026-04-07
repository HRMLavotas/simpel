# Running Migrations with Supabase MCP

## Overview

Ada 3 cara untuk menjalankan migration:
1. **Via Kiro MCP** (Recommended) - Otomatis via AI
2. **Via Management API Script** - Script Node.js
3. **Via Dashboard** (Fallback) - Manual copy-paste

## Method 1: Via Kiro MCP (Recommended)

### Prerequisites
- ✅ MCP sudah dikonfigurasi
- ✅ Access token valid di .env
- ✅ Project ID sudah diketahui

### Step-by-Step

#### 1. Prepare Migration SQL

Buat file migration di `supabase/migrations/`:

```sql
-- supabase/migrations/20260407000000_add_column_example.sql

-- Add new column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS new_column jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN profiles.new_column IS 'Description of the column';
```

#### 2. Ask Kiro to Apply Migration

**Option A: Direct SQL**
```
"Apply this migration to project mauyygrbdopmpdpnwzra:
ALTER TABLE profiles ADD COLUMN new_column jsonb DEFAULT '[]'::jsonb;"
```

**Option B: From File**
```
"Apply migration from file supabase/migrations/20260407000000_add_column_example.sql"
```

**Option C: Describe What You Want**
```
"Add a jsonb column called 'preferences' to the profiles table with default empty object"
```

#### 3. Verify Migration

Kiro akan otomatis verify dengan query:
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'new_column';
```

Expected output:
```
column_name  | data_type | column_default
-------------|-----------|----------------
new_column   | jsonb     | '[]'::jsonb
```

### Example: Real Migration

**User Request:**
```
"I need to add a data_builder_templates column to profiles table 
for storing user query templates as JSON array"
```

**Kiro Response:**
```
✅ Migration applied successfully!
✅ Column verified!

Column details:
- Name: data_builder_templates
- Type: jsonb
- Default: '[]'::jsonb
- Nullable: YES
```

## Method 2: Via Management API Script

### When to Use
- MCP tidak available
- Automation dalam CI/CD
- Batch migrations
- Custom migration logic

### Create Migration Script

File: `apply_migration.mjs`

```javascript
#!/usr/bin/env node

import https from 'https';

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = process.env.VITE_SUPABASE_PROJECT_ID;

const migrationSQL = `
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS new_column jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN profiles.new_column IS 'Column description';
`;

async function executeSQLViaManagementAPI(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });
    
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runMigration() {
  console.log('🚀 Applying migration...');
  
  try {
    const result = await executeSQLViaManagementAPI(migrationSQL);
    console.log('✅ Migration applied successfully!');
    console.log('Result:', result.data);
    
    // Verify
    const verifySQL = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'profiles' 
        AND column_name = 'new_column'
    `;
    
    const verifyResult = await executeSQLViaManagementAPI(verifySQL);
    console.log('✅ Column verified!');
    console.log('Details:', verifyResult.data);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();
```

### Run Script

```bash
node apply_migration.mjs
```

### Expected Output

```
🚀 Applying migration...
✅ Migration applied successfully!
Result: []
✅ Column verified!
Details: [
  {
    column_name: 'new_column',
    data_type: 'jsonb',
    column_default: "'[]'::jsonb"
  }
]
```

## Method 3: Via Dashboard (Fallback)

### When to Use
- MCP dan API tidak available
- Network issues
- Quick manual fix
- Visual verification needed

### Steps

1. Buka https://supabase.com/dashboard
2. Login dan pilih project
3. Klik **SQL Editor** di sidebar
4. Klik **New Query**
5. Copy-paste SQL migration
6. Klik **Run** (Ctrl+Enter)
7. Verify hasil query

### Example SQL

```sql
-- Add column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS new_column jsonb DEFAULT '[]'::jsonb;

-- Add comment
COMMENT ON COLUMN profiles.new_column IS 'Column description';

-- Verify
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'new_column';
```

## Migration Best Practices

### ✅ DO:

1. **Use IF NOT EXISTS**
   ```sql
   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS new_column jsonb;
   ```
   Makes migration idempotent (safe to run multiple times)

2. **Add Comments**
   ```sql
   COMMENT ON COLUMN profiles.new_column IS 'Description';
   ```
   Documents purpose of column

3. **Verify After Migration**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'profiles' AND column_name = 'new_column';
   ```

4. **Use Transactions for Complex Migrations**
   ```sql
   BEGIN;
   
   ALTER TABLE profiles ADD COLUMN new_column jsonb;
   UPDATE profiles SET new_column = '[]'::jsonb WHERE new_column IS NULL;
   ALTER TABLE profiles ALTER COLUMN new_column SET NOT NULL;
   
   COMMIT;
   ```

5. **Test in Development First**
   - Test migration di local/dev environment
   - Verify tidak ada breaking changes
   - Check performance impact

### ❌ DON'T:

1. **Don't Drop Columns Without Backup**
   ```sql
   -- BAD: No backup
   ALTER TABLE profiles DROP COLUMN old_column;
   
   -- GOOD: Rename first, drop later
   ALTER TABLE profiles RENAME COLUMN old_column TO old_column_deprecated;
   -- Wait, verify, then drop
   ```

2. **Don't Forget Default Values**
   ```sql
   -- BAD: No default
   ALTER TABLE profiles ADD COLUMN new_column jsonb;
   
   -- GOOD: With default
   ALTER TABLE profiles ADD COLUMN new_column jsonb DEFAULT '[]'::jsonb;
   ```

3. **Don't Run Destructive Migrations in Production Without Backup**
   - Always backup before destructive operations
   - Test rollback procedure
   - Have rollback SQL ready

## Migration Patterns

### Adding Column

```sql
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS column_name data_type DEFAULT default_value;

COMMENT ON COLUMN table_name.column_name IS 'Description';
```

### Modifying Column

```sql
-- Change type
ALTER TABLE table_name 
ALTER COLUMN column_name TYPE new_type USING column_name::new_type;

-- Change default
ALTER TABLE table_name 
ALTER COLUMN column_name SET DEFAULT new_default;

-- Add NOT NULL
ALTER TABLE table_name 
ALTER COLUMN column_name SET NOT NULL;
```

### Renaming Column

```sql
ALTER TABLE table_name 
RENAME COLUMN old_name TO new_name;
```

### Adding Index

```sql
CREATE INDEX IF NOT EXISTS idx_table_column 
ON table_name(column_name);
```

### Adding Foreign Key

```sql
ALTER TABLE table_name 
ADD CONSTRAINT fk_name 
FOREIGN KEY (column_name) 
REFERENCES other_table(id) 
ON DELETE CASCADE;
```

## Rollback Strategy

### Prepare Rollback SQL

For every migration, prepare rollback:

**Migration:**
```sql
ALTER TABLE profiles ADD COLUMN new_column jsonb DEFAULT '[]'::jsonb;
```

**Rollback:**
```sql
ALTER TABLE profiles DROP COLUMN IF EXISTS new_column;
```

### Test Rollback

1. Apply migration in dev
2. Test rollback in dev
3. Verify data integrity
4. Document rollback procedure

## Troubleshooting

### Migration Failed

**Check:**
1. SQL syntax correct?
2. Table/column exists?
3. Permissions sufficient?
4. Constraints violated?

**Debug:**
```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'your_table';

-- Check column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'your_table' AND column_name = 'your_column';

-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'your_table';
```

### Migration Stuck

**Possible causes:**
- Long-running query
- Table locked
- Large table (slow ALTER)

**Solutions:**
1. Check pg_stat_activity for blocking queries
2. Kill blocking queries if safe
3. Run during low-traffic period
4. Use CONCURRENTLY for indexes

## Next Steps

- [Troubleshooting Guide](./04-TROUBLESHOOTING.md)
- [Best Practices](./05-BEST-PRACTICES.md)
- [API Reference](./06-API-REFERENCE.md)
