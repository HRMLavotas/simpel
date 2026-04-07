# Supabase MCP Configuration Guide

## Overview

Dokumentasi lengkap tentang konfigurasi Supabase MCP di workspace dan user level.

## Configuration Levels

### 1. User-Level Config
**Location:** `~/.kiro/settings/mcp.json`

Konfigurasi global yang berlaku untuk semua workspace.

### 2. Workspace-Level Config
**Location:** `.kiro/settings/mcp.json`

Konfigurasi spesifik untuk workspace/project tertentu. **Overrides user-level config.**

## Workspace Configuration (Recommended)

### File: `.kiro/settings/mcp.json`

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "your_testsprite_api_key"
      },
      "disabled": false,
      "autoApprove": []
    }
  },
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false,
        "env": {
          "SUPABASE_ACCESS_TOKEN": "sbp_your_token_here",
          "SUPABASE_PROJECT_ID": "your_project_id",
          "SUPABASE_URL": "https://your-project.supabase.co",
          "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key"
        },
        "autoApprove": [
          "list_tables",
          "apply_migration",
          "list_projects",
          "get_project_url",
          "get_publishable_keys",
          "list_migrations",
          "execute_sql",
          "deploy_edge_function",
          "list_edge_functions",
          "get_advisors",
          "get_edge_function"
        ]
      }
    }
  }
}
```

## Environment Variables Mapping

### From .env to MCP Config

**Source: `.env`**
```env
SUPABASE_ACCESS_TOKEN="sbp_df72ebc9cae53c148193f88736ea05f4e0feab89"
VITE_SUPABASE_PROJECT_ID="mauyygrbdopmpdpnwzra"
VITE_SUPABASE_URL="https://mauyygrbdopmpdpnwzra.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

**Target: `.kiro/settings/mcp.json`**
```json
{
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "env": {
          "SUPABASE_ACCESS_TOKEN": "sbp_df72ebc9cae53c148193f88736ea05f4e0feab89",
          "SUPABASE_PROJECT_ID": "mauyygrbdopmpdpnwzra",
          "SUPABASE_URL": "https://mauyygrbdopmpdpnwzra.supabase.co",
          "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGc..."
        }
      }
    }
  }
}
```

## Configuration Fields Explained

### mcpServers

Standard MCP servers yang dijalankan sebagai command.

**Fields:**
- `command`: Command untuk menjalankan server (e.g., "npx", "node")
- `args`: Arguments untuk command
- `env`: Environment variables untuk server
- `disabled`: Boolean untuk enable/disable server
- `autoApprove`: Array of tool names yang auto-approved

**Example:**
```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "your_api_key"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### powers.mcpServers

Supabase MCP sebagai "power" - hosted MCP server.

**Fields:**
- `url`: URL endpoint MCP server
- `disabled`: Boolean untuk enable/disable
- `env`: Environment variables (credentials)
- `autoApprove`: Array of tool names yang auto-approved

**Example:**
```json
{
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false,
        "env": {
          "SUPABASE_ACCESS_TOKEN": "sbp_...",
          "SUPABASE_PROJECT_ID": "project_id"
        },
        "autoApprove": ["list_tables", "execute_sql"]
      }
    }
  }
}
```

## Auto-Approve Tools

Tools yang di-auto-approve tidak perlu konfirmasi manual dari user.

### Recommended Auto-Approve List

```json
{
  "autoApprove": [
    "list_tables",           // Safe: Read-only
    "list_projects",         // Safe: Read-only
    "get_project_url",       // Safe: Read-only
    "get_publishable_keys",  // Safe: Read-only
    "list_migrations",       // Safe: Read-only
    "get_advisors",          // Safe: Read-only
    "get_edge_function",     // Safe: Read-only
    "list_edge_functions",   // Safe: Read-only
    "execute_sql",           // Caution: Can modify data
    "apply_migration",       // Caution: Can modify schema
    "deploy_edge_function"   // Caution: Deploys code
  ]
}
```

### Security Considerations

**Safe to Auto-Approve:**
- ✅ Read-only operations (list, get)
- ✅ Non-destructive queries
- ✅ Metadata retrieval

**Require Manual Approval:**
- ⚠️ Write operations (insert, update, delete)
- ⚠️ Schema changes (alter, drop)
- ⚠️ Deployments
- ⚠️ Destructive operations

## Setup Steps

### Step 1: Copy Template

```bash
# Create workspace config if not exists
mkdir -p .kiro/settings
touch .kiro/settings/mcp.json
```

### Step 2: Get Credentials from .env

```bash
# View current .env
cat .env | grep SUPABASE
```

### Step 3: Update MCP Config

Copy values dari .env ke `.kiro/settings/mcp.json`:

```json
{
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false,
        "env": {
          "SUPABASE_ACCESS_TOKEN": "from_env",
          "SUPABASE_PROJECT_ID": "from_env",
          "SUPABASE_URL": "from_env",
          "SUPABASE_SERVICE_ROLE_KEY": "from_env"
        },
        "autoApprove": [
          "list_tables",
          "apply_migration",
          "execute_sql"
        ]
      }
    }
  }
}
```

### Step 4: Restart Kiro

Restart Kiro untuk apply konfigurasi baru.

### Step 5: Verify

Test connection:
```
Ask Kiro: "List my Supabase projects"
```

## Troubleshooting

### Config Not Loading

**Symptoms:**
- MCP tools tidak tersedia
- "Power not found" error

**Solutions:**
1. Check file location: `.kiro/settings/mcp.json`
2. Validate JSON syntax
3. Restart Kiro
4. Check file permissions

### Invalid Credentials

**Symptoms:**
- "Permission denied" error
- "Unauthorized" error

**Solutions:**
1. Verify credentials di .env
2. Check token masih valid
3. Regenerate access token
4. Update MCP config

### Tools Not Auto-Approved

**Symptoms:**
- Kiro asks for approval setiap kali
- Manual confirmation required

**Solutions:**
1. Add tool name ke `autoApprove` array
2. Restart Kiro
3. Verify spelling of tool name

## Best Practices

### ✅ DO:

1. **Use Workspace Config**
   - Project-specific credentials
   - Team can share config structure
   - Easier to manage per-project

2. **Keep Credentials in .env**
   - Single source of truth
   - Easier to rotate
   - Better security

3. **Auto-Approve Safe Operations**
   - Read-only operations
   - Non-destructive queries
   - Speeds up workflow

4. **Document Changes**
   - Comment why certain tools auto-approved
   - Document credential sources
   - Track config changes

### ❌ DON'T:

1. **Don't Commit Credentials**
   - Add `.kiro/settings/mcp.json` to `.gitignore`
   - Use template file instead
   - Document setup process

2. **Don't Auto-Approve Everything**
   - Review destructive operations
   - Keep manual approval for critical tools
   - Balance convenience vs safety

3. **Don't Share Tokens**
   - Each developer should have own token
   - Use different tokens for dev/prod
   - Rotate regularly

## Configuration Templates

### Minimal Config

```json
{
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false,
        "env": {
          "SUPABASE_ACCESS_TOKEN": "sbp_..."
        },
        "autoApprove": []
      }
    }
  }
}
```

### Full Config

```json
{
  "mcpServers": {
    "TestSprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "API_KEY": "your_key"
      },
      "disabled": false,
      "autoApprove": []
    }
  },
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false,
        "env": {
          "SUPABASE_ACCESS_TOKEN": "sbp_...",
          "SUPABASE_PROJECT_ID": "project_id",
          "SUPABASE_URL": "https://project.supabase.co",
          "SUPABASE_SERVICE_ROLE_KEY": "eyJ..."
        },
        "autoApprove": [
          "list_tables",
          "apply_migration",
          "list_projects",
          "get_project_url",
          "get_publishable_keys",
          "list_migrations",
          "execute_sql",
          "deploy_edge_function",
          "list_edge_functions",
          "get_advisors",
          "get_edge_function"
        ]
      }
    }
  }
}
```

### Development Config

```json
{
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false,
        "env": {
          "SUPABASE_ACCESS_TOKEN": "sbp_dev_token",
          "SUPABASE_PROJECT_ID": "dev_project_id"
        },
        "autoApprove": [
          "list_tables",
          "execute_sql",
          "apply_migration"
        ]
      }
    }
  }
}
```

### Production Config

```json
{
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false,
        "env": {
          "SUPABASE_ACCESS_TOKEN": "sbp_prod_token",
          "SUPABASE_PROJECT_ID": "prod_project_id"
        },
        "autoApprove": [
          "list_tables",
          "list_projects",
          "get_project_url"
        ]
      }
    }
  }
}
```

## Validation

### Check Config Syntax

```bash
# Validate JSON
cat .kiro/settings/mcp.json | jq .

# Should output formatted JSON without errors
```

### Test Connection

```javascript
// test_mcp_config.mjs
import { readFileSync } from 'fs';

const config = JSON.parse(
  readFileSync('.kiro/settings/mcp.json', 'utf8')
);

const supabaseConfig = config.powers?.mcpServers?.['power-supabase-hosted-supabase'];

if (!supabaseConfig) {
  console.error('❌ Supabase MCP not configured');
  process.exit(1);
}

if (!supabaseConfig.env?.SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Access token not configured');
  process.exit(1);
}

console.log('✅ Config valid');
console.log('URL:', supabaseConfig.url);
console.log('Disabled:', supabaseConfig.disabled);
console.log('Auto-approve:', supabaseConfig.autoApprove.length, 'tools');
```

## Migration from User to Workspace Config

### Step 1: Export User Config

```bash
cp ~/.kiro/settings/mcp.json ~/.kiro/settings/mcp.json.backup
```

### Step 2: Create Workspace Config

```bash
mkdir -p .kiro/settings
touch .kiro/settings/mcp.json
```

### Step 3: Copy Relevant Parts

Copy only project-specific configuration ke workspace config.

### Step 4: Update Credentials

Update dengan credentials dari .env.

### Step 5: Test

Restart Kiro dan test connection.

## Next Steps

- [Setup MCP Connection](./02-SETUP-MCP-CONNECTION.md)
- [Running Migrations](./03-RUNNING-MIGRATIONS.md)
- [Troubleshooting](./04-TROUBLESHOOTING.md)
- [Best Practices](./05-BEST-PRACTICES.md)
