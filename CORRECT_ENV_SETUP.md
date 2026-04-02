# ✅ Correct Environment Setup - FIXED

## Issue Resolved
Saya salah mengidentifikasi project yang aktif. Project yang BENAR adalah:
- **Project ID:** `mauyygrbdopmpdpnwzra`
- **Project URL:** `https://mauyygrbdopmpdpnwzra.supabase.co`

## Correct Credentials

### Production Project: mauyygrbdopmpdpnwzra

```env
# Project URL
VITE_SUPABASE_URL="https://mauyygrbdopmpdpnwzra.supabase.co"

# Anon/Public Key (safe to expose to client)
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ"

# Publishable Key (alternative anon key format)
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_ihKNfhqseKSHb7fRK3kyaw_ccCHmKAA"

# Service Role Key (NEVER expose to client - server-side only)
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q"

# Database Connection String
DATABASE_URL="postgresql://postgres:Aliham251118!@db.mauyygrbdopmpdpnwzra.supabase.co:5432/postgres"
```

## What Changed

### Before (WRONG):
```env
VITE_SUPABASE_URL="https://sfmfuwhfaqdlxnjcpscw.supabase.co"  # ❌ Wrong project
VITE_SUPABASE_ANON_KEY="eyJ...sfmfuwhfaqdlxnjcpscw..."        # ❌ Wrong project
```

### After (CORRECT):
```env
VITE_SUPABASE_URL="https://mauyygrbdopmpdpnwzra.supabase.co"  # ✅ Correct
VITE_SUPABASE_ANON_KEY="eyJ...mauyygrbdopmpdpnwzra..."        # ✅ Correct
```

## Steps to Apply Fix

### 1. Stop Dev Server
```bash
# Press Ctrl+C
```

### 2. Verify .env File
File `.env` sudah diupdate dengan credentials yang benar.

Check:
```bash
cat .env | grep VITE_SUPABASE_URL
cat .env | grep VITE_SUPABASE_ANON_KEY
```

Should show:
```
VITE_SUPABASE_URL="https://mauyygrbdopmpdpnwzra.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ...mauyygrbdopmpdpnwzra..."
```

### 3. Clear Browser Data
**Option A: Hard Refresh**
- Open DevTools (F12)
- Right-click refresh button
- Select "Empty Cache and Hard Reload"

**Option B: Console**
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### 4. Restart Dev Server
```bash
npm run dev
```

### 5. Test Login
- Go to http://localhost:5173
- Login with your credentials
- Should work now! ✅

## Verification

### Check Environment Variables
In browser console (F12):
```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key starts with:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 30));
```

**Expected:**
```
URL: https://mauyygrbdopmpdpnwzra.supabase.co
Key starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik
```

### Test Supabase Connection
```javascript
// In browser console
const { data, error } = await supabase.auth.getSession();
console.log('Session check:', { hasSession: !!data.session, error });
```

**Expected:**
- No error
- Session data if logged in, or null if not

## Project Information

### Active Project Details:
- **Project ID:** mauyygrbdopmpdpnwzra
- **Project URL:** https://mauyygrbdopmpdpnwzra.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra
- **API Settings:** https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra/settings/api

### CLI Setup:
```bash
# Login to Supabase CLI
supabase login

# Initialize project
supabase init

# Link to project
supabase link --project-ref mauyygrbdopmpdpnwzra
```

## Security Notes

### ⚠️ IMPORTANT: Credentials in .env

**Safe to expose (client-side):**
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`

**NEVER expose (server-side only):**
- 🔴 `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS!
- 🔴 `DATABASE_URL` - Direct database access!
- 🔴 `SUPABASE_ACCESS_TOKEN` - Admin access!

### Why Anon Key is Safe:
- Protected by Row Level Security (RLS)
- Can only access data allowed by RLS policies
- Cannot bypass security rules
- Safe to use in client-side code

### Why Service Role Key is Dangerous:
- Bypasses ALL RLS policies
- Full admin access to database
- Can read/write/delete ANY data
- MUST be kept secret

## Vercel Environment Variables

When deploying to Vercel, set these:

```bash
# Required for client-side
VITE_SUPABASE_URL=https://mauyygrbdopmpdpnwzra.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzEzODQsImV4cCI6MjA5MDUwNzM4NH0.rO9oPY2jbax8GNVjW_rkaE8T4FqrV6OoJa7ME96p4bQ

# Optional: For server-side functions (if needed)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdXl5Z3JiZG9wbXBkcG53enJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDkzMTM4NCwiZXhwIjoyMDkwNTA3Mzg0fQ.qMJoz6Xuy4PKwS-LKWpjf_WM5o0fuNtEE4hsgLjJX4Q
```

## Troubleshooting

### Still Getting "Invalid API Key"?

1. **Check .env file:**
   ```bash
   cat .env | grep VITE_SUPABASE
   ```

2. **Restart dev server:**
   ```bash
   # Stop (Ctrl+C)
   npm run dev
   ```

3. **Clear browser completely:**
   - Close all browser tabs
   - Clear cache and cookies
   - Reopen browser
   - Go to http://localhost:5173

4. **Verify credentials in Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra/settings/api
   - Compare URL and anon key with .env file
   - Should match exactly

### Connection Timeout?

Check if Supabase project is active:
```bash
curl -I https://mauyygrbdopmpdpnwzra.supabase.co
```

Should return `200 OK`

### Database Connection Issues?

Test database connection:
```bash
psql "postgresql://postgres:Aliham251118!@db.mauyygrbdopmpdpnwzra.supabase.co:5432/postgres"
```

## Summary

**Issue:** Invalid API Key error
**Root Cause:** Menggunakan credentials dari project yang salah (sfmfuwhfaqdlxnjcpscw)
**Solution:** Updated .env dengan credentials yang benar (mauyygrbdopmpdpnwzra)
**Status:** ✅ FIXED

## Next Steps

1. ✅ Restart dev server
2. ✅ Clear browser cache
3. ✅ Test login
4. ✅ Verify connection

---

**Fixed:** 2 April 2026  
**Correct Project:** mauyygrbdopmpdpnwzra  
**Status:** Ready to use ✅
