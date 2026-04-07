# Setup Supabase MCP Connection

## Step 1: Get Supabase Access Token

### Via Supabase Dashboard

1. Buka https://supabase.com/dashboard
2. Login dengan account Anda
3. Klik **Account Settings** (icon user di kanan atas)
4. Pilih tab **Access Tokens**
5. Klik **Generate New Token**
6. Beri nama token (contoh: "Kiro Development")
7. Copy token yang dihasilkan (format: `sbp_...`)

⚠️ **PENTING**: Token hanya ditampilkan sekali! Simpan dengan aman.

### Token Permissions

Access token memberikan akses ke:
- ✅ List projects
- ✅ Execute SQL queries
- ✅ Apply migrations
- ✅ Deploy edge functions
- ✅ View logs dan advisors

## Step 2: Add Token to .env File

Buka file `.env` di root project dan tambahkan:

```env
# Supabase Access Token (for Supabase CLI and MCP)
SUPABASE_ACCESS_TOKEN="sbp_your_token_here"
```

**Contoh lengkap .env:**

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
SUPABASE_ACCESS_TOKEN="sbp_df72ebc9cae53c148193f88736ea05f4e0feab89"
DATABASE_URL="postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
```

⚠️ **SECURITY**: Jangan commit `.env` ke git! Pastikan ada di `.gitignore`.

## Step 3: Verify MCP Configuration

### Check Kiro MCP Settings

File: `~/.kiro/settings/mcp.json`

```json
{
  "mcpServers": {},
  "powers": {
    "mcpServers": {
      "power-supabase-hosted-supabase": {
        "url": "https://mcp.supabase.com/mcp",
        "disabled": false,
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

### Verify Configuration

1. Pastikan `disabled: false`
2. Pastikan `autoApprove` berisi tools yang Anda butuhkan
3. Restart Kiro jika ada perubahan

## Step 4: Test Connection

### Test via Kiro

Tanya Kiro:
```
"List my Supabase projects"
```

Expected response:
```json
{
  "projects": [
    {
      "id": "your-project-id",
      "name": "Your Project Name",
      "region": "ap-southeast-1",
      "status": "ACTIVE"
    }
  ]
}
```

### Test via Script

Buat file `test_mcp_connection.mjs`:

```javascript
import https from 'https';

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

function listProjects() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      path: '/v1/projects',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Connection successful!');
          console.log(JSON.parse(data));
          resolve(data);
        } else {
          console.error('❌ Connection failed:', res.statusCode);
          reject(new Error(data));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

listProjects();
```

Run:
```bash
node test_mcp_connection.mjs
```

## Step 5: Configure Project-Specific Settings

### Get Project ID

Dari response `list_projects`, ambil `id` atau `ref` project Anda.

### Add to .env

```env
VITE_SUPABASE_PROJECT_ID="mauyygrbdopmpdpnwzra"
```

### Verify Project Access

Tanya Kiro:
```
"Get details for project mauyygrbdopmpdpnwzra"
```

## Troubleshooting Setup

### Error: "You do not have permission"

**Penyebab:**
- Access token salah atau expired
- Token tidak punya akses ke project
- Project ada di organization berbeda

**Solusi:**
1. Generate token baru dari Dashboard
2. Pastikan login dengan account yang benar
3. Check organization membership
4. Verify token di .env sudah benar

### Error: "Project not found"

**Penyebab:**
- Project ID salah
- Project sudah dihapus
- Token tidak punya akses

**Solusi:**
1. List projects untuk verify ID
2. Check project masih aktif di Dashboard
3. Verify organization

### Error: "Network error"

**Penyebab:**
- Tidak ada koneksi internet
- Firewall blocking Supabase API
- VPN issues

**Solusi:**
1. Check internet connection
2. Try disable VPN
3. Check firewall settings
4. Try dari network berbeda

## Security Best Practices

### ✅ DO:
- Store token di .env file
- Add .env to .gitignore
- Rotate token secara berkala
- Use different tokens untuk dev/prod
- Revoke token jika tidak digunakan

### ❌ DON'T:
- Commit token ke git
- Share token di public
- Use production token di development
- Store token di code
- Use same token untuk semua projects

## Environment Variables Summary

```env
# Required for MCP
SUPABASE_ACCESS_TOKEN="sbp_..."

# Required for application
VITE_SUPABASE_URL="https://..."
VITE_SUPABASE_ANON_KEY="eyJ..."

# Optional but recommended
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
VITE_SUPABASE_PROJECT_ID="..."
DATABASE_URL="postgresql://..."
```

## Next Steps

Setelah setup berhasil:
- [Running Migrations](./03-RUNNING-MIGRATIONS.md)
- [Troubleshooting](./04-TROUBLESHOOTING.md)
- [Best Practices](./05-BEST-PRACTICES.md)
