# Supabase MCP Overview

## Apa itu Supabase MCP?

Supabase MCP (Model Context Protocol) adalah interface yang memungkinkan AI assistant (seperti Kiro) untuk berinteraksi langsung dengan Supabase project Anda melalui API.

## Keuntungan Menggunakan MCP

### ✅ Kelebihan
- **Otomatis**: AI bisa jalankan migration tanpa manual copy-paste
- **Cepat**: Tidak perlu buka browser dan dashboard
- **Terintegrasi**: Langsung dari development environment
- **Aman**: Menggunakan access token dengan permission terbatas
- **Verifiable**: Bisa langsung verify hasil migration

### ⚠️ Keterbatasan
- Memerlukan access token yang valid
- Harus punya permission ke project
- Network harus bisa akses Supabase API
- Tidak semua operasi tersedia via MCP

## Kapan Menggunakan MCP vs Manual

### Gunakan MCP Ketika:
- ✅ Menjalankan migration sederhana
- ✅ Execute SQL query
- ✅ List tables dan struktur database
- ✅ Deploy edge functions
- ✅ Get project information
- ✅ Automation dalam development workflow

### Gunakan Manual (Dashboard) Ketika:
- ⚠️ MCP tidak punya akses ke project
- ⚠️ Migration sangat kompleks dengan banyak dependencies
- ⚠️ Perlu visual feedback (table editor, query results)
- ⚠️ Troubleshooting masalah database
- ⚠️ Setup RLS policies yang kompleks

## Arsitektur

```
┌─────────────────┐
│   Kiro AI       │
│   Assistant     │
└────────┬────────┘
         │
         │ Uses MCP Power
         ▼
┌─────────────────┐
│ Supabase MCP    │
│ Power           │
└────────┬────────┘
         │
         │ HTTPS API Calls
         ▼
┌─────────────────┐
│ Supabase        │
│ Management API  │
└────────┬────────┘
         │
         │ Database Operations
         ▼
┌─────────────────┐
│ PostgreSQL      │
│ Database        │
└─────────────────┘
```

## Tools yang Tersedia

### Database Operations
- `list_tables` - List semua tables
- `execute_sql` - Execute SQL query
- `apply_migration` - Apply migration file
- `list_migrations` - List migration history

### Project Management
- `list_projects` - List semua projects
- `get_project` - Get project details
- `get_project_url` - Get API URL
- `get_publishable_keys` - Get API keys

### Edge Functions
- `list_edge_functions` - List functions
- `get_edge_function` - Get function code
- `deploy_edge_function` - Deploy function

### Monitoring
- `get_logs` - Get service logs
- `get_advisors` - Get security advisors

## Prerequisites

1. **Supabase Account** dengan project aktif
2. **Access Token** dari Supabase Dashboard
3. **MCP Configuration** di Kiro settings
4. **Network Access** ke Supabase API

## File Terkait

- `02-SETUP-MCP-CONNECTION.md` - Setup dan konfigurasi
- `03-RUNNING-MIGRATIONS.md` - Cara jalankan migration
- `04-TROUBLESHOOTING.md` - Troubleshooting common issues
- `05-BEST-PRACTICES.md` - Best practices
- `06-API-REFERENCE.md` - API reference lengkap

## Quick Start

```bash
# 1. Get access token dari Supabase Dashboard
# 2. Add ke .env file
SUPABASE_ACCESS_TOKEN="sbp_your_token_here"

# 3. Verify MCP configuration
# Check ~/.kiro/settings/mcp.json

# 4. Test connection
# Ask Kiro: "list my supabase projects"

# 5. Run migration
# Ask Kiro: "apply migration to add column X to table Y"
```

## Support

Jika ada masalah:
1. Check dokumentasi di folder ini
2. Verify access token masih valid
3. Check network connectivity
4. Fallback ke manual via Dashboard

## Next Steps

Baca dokumentasi berikutnya:
- [Setup MCP Connection](./02-SETUP-MCP-CONNECTION.md)
- [Running Migrations](./03-RUNNING-MIGRATIONS.md)
