# Troubleshooting Supabase MCP

## Common Issues and Solutions

### 1. Permission Denied Errors

#### Error Message
```
MCP error -32600: You do not have permission to perform this action
```

#### Possible Causes
- Access token invalid atau expired
- Token tidak punya akses ke project
- Project ada di organization berbeda
- Token tidak punya permission untuk operasi tertentu

#### Solutions

**A. Verify Access Token**
```bash
# Check token di .env
cat .env | grep SUPABASE_ACCESS_TOKEN

# Test token via API
curl -X GET https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**B. Generate New Token**
1. Buka https://supabase.com/dashboard
2. Account Settings → Access Tokens
3. Generate New Token
4. Update .env file
5. Restart Kiro

**C. Check Project Access**
```
Ask Kiro: "List my Supabase projects"
```
Verify project ID muncul di list.

**D. Check Organization**
- Pastikan login dengan account yang benar
- Verify project ada di organization yang sama
- Check organization membership

### 2. Network Connection Errors

#### Error Message
```
getaddrinfo ENOTFOUND db.project.supabase.co
Error: Network error
```

#### Possible Causes
- Tidak ada koneksi internet
- Firewall blocking Supabase
- VPN issues
- DNS resolution failed

#### Solutions

**A. Check Internet Connection**
```bash
# Ping Supabase
ping api.supabase.com

# Test HTTPS
curl https://api.supabase.com/v1/projects
```

**B. Check Firewall**
- Allow outbound HTTPS (port 443)
- Whitelist *.supabase.com
- Check corporate firewall rules

**C. Try Different Network**
- Disable VPN
- Try mobile hotspot
- Use different WiFi

**D. Check DNS**
```bash
# Resolve DNS
nslookup api.supabase.com

# Try different DNS
# Use 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare)
```

### 3. Project Not Found

#### Error Message
```
Project not found
HTTP 404: Project does not exist
```

#### Possible Causes
- Project ID salah
- Project sudah dihapus
- Project paused atau inactive
- Token tidak punya akses

#### Solutions

**A. Verify Project ID**
```
Ask Kiro: "List my Supabase projects"
```
Check project ID dari response.

**B. Check Project Status**
1. Buka Supabase Dashboard
2. Verify project masih ada
3. Check status (ACTIVE, PAUSED, etc.)
4. Resume project jika paused

**C. Update .env**
```env
VITE_SUPABASE_PROJECT_ID="correct-project-id"
```

### 4. SQL Execution Errors

#### Error Message
```
HTTP 400: Bad Request
Syntax error at or near "..."
Column "..." does not exist
```

#### Possible Causes
- SQL syntax error
- Table/column tidak exist
- Type mismatch
- Constraint violation

#### Solutions

**A. Validate SQL Syntax**
```sql
-- Test di SQL Editor dulu
-- Verify syntax correct
-- Check table/column names
```

**B. Check Table Exists**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'your_table';
```

**C. Check Column Exists**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'your_table';
```

**D. Check Constraints**
```sql
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'your_table';
```

### 5. RPC Function Not Found

#### Error Message
```
HTTP 404: Could not find the function public.exec_sql
```

#### Possible Causes
- RPC function tidak tersedia
- Function name salah
- Schema tidak correct

#### Solutions

**A. Use Management API Instead**
Gunakan script dengan Management API endpoint:
```javascript
const options = {
  hostname: 'api.supabase.com',
  path: `/v1/projects/${PROJECT_REF}/database/query`,
  method: 'POST'
};
```

**B. Create RPC Function**
```sql
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE query INTO result;
  RETURN result;
END;
$$;
```

**C. Use Dashboard SQL Editor**
Fallback ke manual execution.

### 6. Migration Already Applied

#### Error Message
```
Column "..." already exists
Relation "..." already exists
```

#### Possible Causes
- Migration sudah pernah dijalankan
- Manual changes di database
- Migration file dijalankan multiple times

#### Solutions

**A. Use IF NOT EXISTS**
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS new_column jsonb;

CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

**B. Check Existing State**
```sql
-- Check column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'new_column';

-- Check index
SELECT indexname FROM pg_indexes
WHERE tablename = 'profiles' AND indexname = 'idx_name';
```

**C. Skip or Modify Migration**
- If already applied, skip
- If partially applied, modify SQL
- Document manual changes

### 7. Timeout Errors

#### Error Message
```
Request timeout
Operation timed out
```

#### Possible Causes
- Large table (slow ALTER)
- Table locked by other query
- Network latency
- Server overload

#### Solutions

**A. Check Table Size**
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename = 'your_table';
```

**B. Check Locks**
```sql
SELECT 
  pid,
  usename,
  pg_blocking_pids(pid) as blocked_by,
  query as blocked_query
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

**C. Run During Low Traffic**
- Schedule migration during off-peak
- Use maintenance window
- Notify users

**D. Use CONCURRENTLY**
```sql
-- For indexes
CREATE INDEX CONCURRENTLY idx_name ON table(column);
```

### 8. MCP Not Responding

#### Error Message
```
MCP server not responding
Connection timeout
```

#### Possible Causes
- MCP server down
- Configuration error
- Kiro restart needed

#### Solutions

**A. Check MCP Configuration**
```json
// ~/.kiro/settings/mcp.json
{
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false
      }
    }
  }
}
```

**B. Restart Kiro**
1. Close Kiro
2. Clear cache if needed
3. Restart Kiro
4. Try again

**C. Check MCP Status**
```
Ask Kiro: "Check Supabase MCP status"
```

**D. Use Alternative Method**
Fallback ke Management API script atau Dashboard.

## Debugging Checklist

### Before Running Migration

- [ ] SQL syntax validated
- [ ] Table/column names correct
- [ ] Access token valid
- [ ] Project ID correct
- [ ] Network connection stable
- [ ] Backup created (if destructive)
- [ ] Rollback SQL prepared
- [ ] Tested in development

### After Migration Failed

- [ ] Check error message
- [ ] Verify database state
- [ ] Check logs
- [ ] Test rollback
- [ ] Document issue
- [ ] Try alternative method

### When to Use Each Method

| Issue | MCP | API Script | Dashboard |
|-------|-----|------------|-----------|
| Permission denied | ❌ | ❌ | ✅ |
| Network error | ❌ | ❌ | ✅ |
| RPC not found | ❌ | ✅ | ✅ |
| Syntax error | ✅ | ✅ | ✅ |
| Timeout | ❌ | ❌ | ✅ |
| Complex migration | ❌ | ❌ | ✅ |

## Getting Help

### 1. Check Documentation
- Read relevant docs in this folder
- Check Supabase official docs
- Search GitHub issues

### 2. Enable Debug Mode
```javascript
// In migration script
console.log('Request:', options);
console.log('Response:', data);
```

### 3. Check Logs
```
Ask Kiro: "Get logs for project mauyygrbdopmpdpnwzra service postgres"
```

### 4. Contact Support
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase
- Email: support@supabase.io

## Prevention Tips

### ✅ Best Practices

1. **Always Test First**
   - Test in development
   - Verify SQL syntax
   - Check for side effects

2. **Use Version Control**
   - Commit migration files
   - Document changes
   - Track applied migrations

3. **Monitor After Migration**
   - Check application logs
   - Monitor database performance
   - Verify data integrity

4. **Have Rollback Plan**
   - Prepare rollback SQL
   - Test rollback procedure
   - Document rollback steps

5. **Keep Backups**
   - Backup before destructive operations
   - Test restore procedure
   - Keep multiple backup points

## Quick Reference

### Common Commands

```bash
# Test connection
curl https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"

# List projects
node -e "require('./list_projects.mjs')"

# Apply migration
node apply_migration.mjs

# Verify column
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name='profiles'"
```

### Emergency Contacts

- **Supabase Status**: https://status.supabase.com
- **Discord**: https://discord.supabase.com
- **GitHub**: https://github.com/supabase/supabase/issues
- **Docs**: https://supabase.com/docs

## Next Steps

- [Best Practices](./05-BEST-PRACTICES.md)
- [API Reference](./06-API-REFERENCE.md)
- [Migration Guide](./03-RUNNING-MIGRATIONS.md)
