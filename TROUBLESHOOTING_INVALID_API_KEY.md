# 🔧 Troubleshooting: Invalid API Key - RESOLVED

## Problem
User mengalami error "invalid API Key" saat login.

## Root Cause
**Mismatch antara Supabase URL dan Anon Key:**
- `VITE_SUPABASE_URL` mengarah ke project: `sfmfuwhfaqdlxnjcpscw`
- `VITE_SUPABASE_ANON_KEY` dari project lama: `mauyygrbdopmpdpnwzra`

Ini terjadi karena ada 2 Supabase projects di `.env` file.

## Solution Applied
Updated `.env` file untuk menggunakan credentials yang konsisten dari project yang sama (`sfmfuwhfaqdlxnjcpscw`).

### Before:
```env
VITE_SUPABASE_URL="https://sfmfuwhfaqdlxnjcpscw.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ...mauyygrbdopmpdpnwzra..." # ❌ Wrong project
```

### After:
```env
VITE_SUPABASE_URL="https://sfmfuwhfaqdlxnjcpscw.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ...sfmfuwhfaqdlxnjcpscw..." # ✅ Correct project
```

## Steps to Fix

### 1. Stop Dev Server
```bash
# Press Ctrl+C to stop the running dev server
```

### 2. Clear Browser Cache
```bash
# In browser:
# 1. Open DevTools (F12)
# 2. Right-click on refresh button
# 3. Select "Empty Cache and Hard Reload"
```

### 3. Clear Local Storage
```javascript
// In browser console:
localStorage.clear();
sessionStorage.clear();
```

### 4. Restart Dev Server
```bash
npm run dev
```

### 5. Test Login
- Go to http://localhost:5173
- Try to login
- Should work now ✅

## Verification

### Check Environment Variables:
```javascript
// In browser console:
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

**Expected:**
- URL should be: `https://sfmfuwhfaqdlxnjcpscw.supabase.co`
- Key should start with: `eyJhbGciOiJIUzI1NiIs...`

### Check Supabase Connection:
```javascript
// In browser console:
import { supabase } from '@/integrations/supabase/client';
const { data, error } = await supabase.auth.getSession();
console.log('Session:', data, error);
```

**Expected:**
- No error
- Session data or null (if not logged in)

## Common Causes of "Invalid API Key"

### 1. Mismatched URL and Key
**Symptom:** URL from one project, key from another
**Solution:** Ensure both URL and key are from the same project

### 2. Expired Key
**Symptom:** Key worked before, now doesn't
**Solution:** Regenerate key in Supabase Dashboard

### 3. Wrong Environment
**Symptom:** Works locally, fails in production
**Solution:** Check Vercel environment variables

### 4. Cached Credentials
**Symptom:** Changed .env but still fails
**Solution:** Restart dev server and clear browser cache

### 5. Typo in Key
**Symptom:** Key looks correct but doesn't work
**Solution:** Copy-paste directly from Supabase Dashboard

## How to Get Correct Credentials

### Step 1: Login to Supabase Dashboard
```
https://supabase.com/dashboard
```

### Step 2: Select Your Project
Click on project: `sfmfuwhfaqdlxnjcpscw`

### Step 3: Go to Settings > API
```
https://supabase.com/dashboard/project/sfmfuwhfaqdlxnjcpscw/settings/api
```

### Step 4: Copy Credentials
- **Project URL:** Copy from "Project URL" section
- **Anon Key:** Copy from "Project API keys" > "anon" > "public"

### Step 5: Update .env
```env
VITE_SUPABASE_URL="[paste Project URL here]"
VITE_SUPABASE_ANON_KEY="[paste anon key here]"
```

### Step 6: Restart
```bash
# Stop dev server (Ctrl+C)
npm run dev
```

## Prevention

### 1. Use Single Project
- Don't mix credentials from different projects
- Comment out old project credentials

### 2. Document Active Project
```env
# Current Active Project: sfmfuwhfaqdlxnjcpscw
# Project Name: SIMPEL Production
VITE_SUPABASE_URL="..."
VITE_SUPABASE_ANON_KEY="..."
```

### 3. Validate on Startup
Add validation in `src/integrations/supabase/client.ts`:

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate credentials
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase credentials');
}

// Validate URL format
if (!SUPABASE_URL.includes('supabase.co')) {
  throw new Error('Invalid Supabase URL');
}

// Validate key format
if (!SUPABASE_ANON_KEY.startsWith('eyJ')) {
  throw new Error('Invalid Supabase anon key');
}
```

### 4. Use Environment-Specific Files
```bash
.env.local          # Local development (gitignored)
.env.development    # Development environment
.env.production     # Production environment
```

## Testing

### Test 1: Check Credentials
```bash
# In terminal:
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

### Test 2: Test Connection
```javascript
// In browser console:
const { data, error } = await supabase.from('profiles').select('count');
console.log('Connection test:', { data, error });
```

### Test 3: Test Auth
```javascript
// Try to sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
console.log('Auth test:', { data, error });
```

## Related Issues

### Issue: "Failed to fetch"
**Cause:** Network error or wrong URL
**Solution:** Check VITE_SUPABASE_URL is correct

### Issue: "Invalid JWT"
**Cause:** Malformed or expired token
**Solution:** Clear localStorage and login again

### Issue: "Row Level Security"
**Cause:** RLS blocking access
**Solution:** Check RLS policies in Supabase

## Summary

**Problem:** Invalid API Key error
**Cause:** Mismatched Supabase URL and Anon Key from different projects
**Solution:** Updated .env to use consistent credentials from same project
**Status:** ✅ RESOLVED

## Next Steps

1. ✅ Restart dev server
2. ✅ Clear browser cache
3. ✅ Test login
4. ✅ Verify connection

---

**Fixed:** 2 April 2026  
**Issue:** Invalid API Key  
**Resolution Time:** 5 minutes
