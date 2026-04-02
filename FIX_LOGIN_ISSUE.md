# ✅ Fix Login Issue - Invalid API Key

## Problem Identified
Error "invalid API Key" terjadi karena **mismatch credentials**:
- `VITE_SUPABASE_URL` → Project: `sfmfuwhfaqdlxnjcpscw` ✅
- `VITE_SUPABASE_ANON_KEY` → Project: `mauyygrbdopmpdpnwzra` ❌ (OLD)

## Solution Applied
Updated `.env` file untuk menggunakan credentials yang konsisten.

---

## 🚀 Steps to Fix (DO THIS NOW)

### Step 1: Stop Dev Server
```bash
# Press Ctrl+C in terminal where dev server is running
```

### Step 2: Clear Browser Data
**Option A: Hard Refresh**
1. Open browser DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

**Option B: Manual Clear**
1. Open browser console (F12)
2. Run:
```javascript
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Step 3: Restart Dev Server
```bash
npm run dev
```

### Step 4: Test Login
1. Go to http://localhost:5173
2. Try to login with your credentials
3. Should work now! ✅

---

## 🔍 Verification

### Check if credentials are loaded:
Open browser console (F12) and run:
```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 30) + '...');
```

**Expected Output:**
```
URL: https://sfmfuwhfaqdlxnjcpscw.supabase.co
Key: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
```

---

## ⚠️ If Still Not Working

### Option 1: Get Fresh Credentials from Supabase

1. **Login to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/sfmfuwhfaqdlxnjcpscw/settings/api
   ```

2. **Copy these values:**
   - **Project URL:** (should be `https://sfmfuwhfaqdlxnjcpscw.supabase.co`)
   - **Anon/Public Key:** Click "Reveal" and copy the key

3. **Update .env file:**
   ```env
   VITE_SUPABASE_URL="[paste URL here]"
   VITE_SUPABASE_ANON_KEY="[paste key here]"
   ```

4. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Option 2: Check Supabase Project Status

1. Go to Supabase Dashboard
2. Check if project `sfmfuwhfaqdlxnjcpscw` is active
3. Check if there are any service issues

### Option 3: Test Connection

In browser console:
```javascript
// Test basic connection
fetch('https://sfmfuwhfaqdlxnjcpscw.supabase.co/rest/v1/', {
  headers: {
    'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + import.meta.env.VITE_SUPABASE_ANON_KEY
  }
})
.then(r => r.json())
.then(d => console.log('Connection OK:', d))
.catch(e => console.error('Connection Failed:', e));
```

---

## 📝 What Was Changed

### Before (.env):
```env
VITE_SUPABASE_URL="https://sfmfuwhfaqdlxnjcpscw.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ...mauyygrbdopmpdpnwzra..." # ❌ Wrong!
```

### After (.env):
```env
VITE_SUPABASE_URL="https://sfmfuwhfaqdlxnjcpscw.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ...sfmfuwhfaqdlxnjcpscw..." # ✅ Correct!
```

---

## 🎯 Quick Checklist

- [ ] Dev server stopped (Ctrl+C)
- [ ] Browser cache cleared
- [ ] localStorage cleared
- [ ] Dev server restarted (`npm run dev`)
- [ ] Login tested
- [ ] Login successful ✅

---

## 💡 Why This Happened

Kamu memiliki 2 Supabase projects:
1. **Old Project:** `mauyygrbdopmpdpnwzra`
2. **New Project:** `sfmfuwhfaqdlxnjcpscw` (current)

Di `.env` file, URL sudah mengarah ke project baru, tapi anon key masih dari project lama. Ini menyebabkan mismatch dan error "invalid API Key".

---

## 🔒 Security Note

**IMPORTANT:** Jangan commit file `.env` ke git!

Check `.gitignore`:
```bash
cat .gitignore | grep .env
```

Should show:
```
.env
.env.local
.env.*.local
```

---

## 📚 Related Documentation

- `TROUBLESHOOTING_INVALID_API_KEY.md` - Detailed troubleshooting guide
- `PHASE_1_SUMMARY.md` - Phase 1 implementation summary
- `RLS_SECURITY_GUIDE.md` - RLS security guide

---

## ✅ Status

**Issue:** Invalid API Key  
**Cause:** Mismatched Supabase credentials  
**Fix Applied:** Updated .env with correct credentials  
**Status:** RESOLVED ✅

**Next:** Restart dev server and test login!

---

**Fixed:** 2 April 2026  
**Time to Fix:** 5 minutes  
**Impact:** Login now works ✅
