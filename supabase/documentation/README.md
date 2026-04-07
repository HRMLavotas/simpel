# Supabase MCP Documentation

Dokumentasi lengkap untuk menggunakan Supabase dengan Model Context Protocol (MCP) dan Management API.

## 📚 Daftar Dokumentasi

### 1. [Overview](./01-SUPABASE-MCP-OVERVIEW.md)
Pengenalan Supabase MCP, keuntungan, keterbatasan, dan kapan menggunakannya.

**Topik:**
- Apa itu Supabase MCP
- Keuntungan dan keterbatasan
- Kapan menggunakan MCP vs Manual
- Arsitektur dan tools yang tersedia

### 2. [Setup MCP Connection](./02-SETUP-MCP-CONNECTION.md)
Panduan lengkap setup koneksi Supabase MCP dari awal.

**Topik:**
- Mendapatkan access token
- Konfigurasi .env file
- Verify MCP configuration
- Test connection
- Troubleshooting setup

### 3. [Running Migrations](./03-RUNNING-MIGRATIONS.md)
Cara menjalankan database migrations dengan berbagai metode.

**Topik:**
- Via Kiro MCP (recommended)
- Via Management API script
- Via Dashboard (fallback)
- Migration patterns
- Rollback strategy

### 4. [Troubleshooting](./04-TROUBLESHOOTING.md)
Solusi untuk masalah umum yang sering terjadi.

**Topik:**
- Permission denied errors
- Network connection errors
- Project not found
- SQL execution errors
- Timeout errors
- Debugging checklist

### 5. [Best Practices](./05-BEST-PRACTICES.md)
Best practices untuk migration, security, dan development workflow.

**Topik:**
- Migration best practices
- Security best practices
- Development workflow
- Performance optimization
- Error handling
- Documentation

### 6. [API Reference](./06-API-REFERENCE.md)
Referensi lengkap untuk Supabase Management API dan MCP tools.

**Topik:**
- MCP tools reference
- Management API endpoints
- Error responses
- Rate limits
- Code examples
- TypeScript types

### 7. [MCP Configuration](./07-MCP-CONFIGURATION.md)
Panduan lengkap konfigurasi Supabase MCP di workspace dan user level.

**Topik:**
- Configuration levels (user vs workspace)
- Environment variables mapping
- Auto-approve tools
- Configuration templates
- Troubleshooting config issues

## 🚀 Quick Start

### 1. Setup (5 menit)

```bash
# 1. Get access token dari Supabase Dashboard
# Account Settings → Access Tokens → Generate New Token

# 2. Add ke .env
echo 'SUPABASE_ACCESS_TOKEN="sbp_your_token_here"' >> .env

# 3. Verify MCP config
cat ~/.kiro/settings/mcp.json

# 4. Test connection
# Ask Kiro: "list my supabase projects"
```

### 2. Run Migration (2 menit)

**Via Kiro:**
```
"Apply migration to add column X to table Y in project Z"
```

**Via Script:**
```bash
node apply_migration.mjs
```

**Via Dashboard:**
1. Buka https://supabase.com/dashboard
2. SQL Editor → New Query
3. Paste SQL → Run

### 3. Verify (1 menit)

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'your_table' 
  AND column_name = 'your_column';
```

## 📖 Reading Guide

### Untuk Pemula
1. Start dengan [Overview](./01-SUPABASE-MCP-OVERVIEW.md)
2. Follow [Setup Guide](./02-SETUP-MCP-CONNECTION.md)
3. Try [Running Migrations](./03-RUNNING-MIGRATIONS.md)
4. Bookmark [Troubleshooting](./04-TROUBLESHOOTING.md)

### Untuk Developer Berpengalaman
1. Skim [Overview](./01-SUPABASE-MCP-OVERVIEW.md)
2. Jump to [Running Migrations](./03-RUNNING-MIGRATIONS.md)
3. Reference [API Reference](./06-API-REFERENCE.md)
4. Follow [Best Practices](./05-BEST-PRACTICES.md)

### Untuk Troubleshooting
1. Check [Troubleshooting](./04-TROUBLESHOOTING.md) first
2. Verify [Setup](./02-SETUP-MCP-CONNECTION.md)
3. Review [Best Practices](./05-BEST-PRACTICES.md)
4. Consult [API Reference](./06-API-REFERENCE.md)

## 🎯 Common Tasks

### Task: Add New Column

**Documentation:** [Running Migrations](./03-RUNNING-MIGRATIONS.md#adding-column)

```sql
ALTER TABLE table_name 
ADD COLUMN IF NOT EXISTS column_name data_type DEFAULT default_value;
```

### Task: Create Index

**Documentation:** [Running Migrations](./03-RUNNING-MIGRATIONS.md#adding-index)

```sql
CREATE INDEX IF NOT EXISTS idx_name ON table_name(column_name);
```

### Task: Update RLS Policy

**Documentation:** [Best Practices](./05-BEST-PRACTICES.md#security-best-practices)

```sql
CREATE POLICY policy_name ON table_name
FOR SELECT USING (auth.uid() = user_id);
```

### Task: Rollback Migration

**Documentation:** [Running Migrations](./03-RUNNING-MIGRATIONS.md#rollback-strategy)

```sql
-- Prepare rollback SQL before migration
ALTER TABLE table_name DROP COLUMN IF EXISTS column_name;
```

## 🔧 Tools & Scripts

### Migration Scripts

Located in project root:

- `apply_migration_management_api.mjs` - Apply migration via Management API
- `test_mcp_connection.mjs` - Test MCP connection
- `list_projects.mjs` - List all projects

### Migration Files

Located in `supabase/migrations/`:

```
supabase/migrations/
├── 20260407000000_add_templates_column.sql
├── 20260407000001_add_templates_index.sql
└── 20260407000002_update_rls_policies.sql
```

## 📝 Migration Naming Convention

```
YYYYMMDDHHMMSS_descriptive_name.sql

Examples:
20260407000000_add_data_builder_templates_column.sql
20260407000001_create_templates_index.sql
20260407000002_add_templates_rls_policies.sql
```

## 🔐 Security Notes

### ⚠️ NEVER:
- Commit access tokens to git
- Share tokens publicly
- Use production tokens in development
- Expose service role key to client

### ✅ ALWAYS:
- Store tokens in .env (gitignored)
- Rotate tokens regularly
- Use different tokens for dev/prod
- Test migrations in development first

## 🆘 Getting Help

### Internal Resources
1. Check this documentation
2. Review migration files in `supabase/migrations/`
3. Check project .env file
4. Ask team members

### External Resources
1. Supabase Docs: https://supabase.com/docs
2. Supabase Discord: https://discord.supabase.com
3. GitHub Issues: https://github.com/supabase/supabase/issues
4. Stack Overflow: Tag `supabase`

### Emergency Contacts
- **Supabase Status**: https://status.supabase.com
- **Support Email**: support@supabase.io
- **Discord**: https://discord.supabase.com

## 📊 Success Metrics

After reading this documentation, you should be able to:

- ✅ Setup Supabase MCP connection
- ✅ Run migrations via MCP or API
- ✅ Troubleshoot common issues
- ✅ Follow best practices
- ✅ Write safe, idempotent migrations
- ✅ Handle errors gracefully
- ✅ Document changes properly

## 🔄 Updates

This documentation is maintained alongside the project. Last updated: **2026-04-07**

### Recent Changes
- 2026-04-07: Initial documentation created
- 2026-04-07: Added all 6 core documents
- 2026-04-07: Added examples and code snippets

### Contributing
If you find errors or have suggestions:
1. Document the issue
2. Propose solution
3. Update relevant documentation
4. Notify team

## 📚 Related Documentation

### Project Documentation
- `README.md` - Project overview
- `CHANGELOG.md` - Change history
- `.env.example` - Environment variables template

### Supabase Official Docs
- [Database Migrations](https://supabase.com/docs/guides/database/migrations)
- [Management API](https://supabase.com/docs/reference/api)
- [CLI Reference](https://supabase.com/docs/reference/cli)

## 🎓 Learning Path

### Beginner (Week 1)
- [ ] Read Overview
- [ ] Complete Setup
- [ ] Run first migration
- [ ] Understand basic SQL

### Intermediate (Week 2-3)
- [ ] Master migration patterns
- [ ] Learn rollback strategies
- [ ] Understand RLS policies
- [ ] Practice error handling

### Advanced (Week 4+)
- [ ] Optimize performance
- [ ] Automate workflows
- [ ] Contribute to docs
- [ ] Mentor others

## 📞 Support

For questions or issues:
1. Check documentation first
2. Search existing issues
3. Ask in team chat
4. Create new issue if needed

---

**Happy migrating! 🚀**
