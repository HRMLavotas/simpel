# Deploy Usulan Ujikom Migrations

## 📦 File Migrasi yang Akan Di-deploy

Setelah cleanup duplikat, ada 2 file migrasi yang perlu dijalankan:

1. **20260603000000_create_usulan_ujikom_tables_and_rls.sql** - Tables + RLS Policies
2. **20260603000000_create_usulan_ujikom_storage.sql** - Storage Bucket

## 🚀 Step-by-Step Deployment

### Preparation

1. Buka Supabase Dashboard
2. Go to **SQL Editor**
3. Pastikan Anda memiliki akses admin

### Migration 1: Create Tables and RLS (2-3 minutes)

```sql
-- Copy paste SELURUH isi file:
-- supabase/migrations/20260603000000_create_usulan_ujikom_tables_and_rls.sql

-- File ini akan create:
-- ✓ Table usulan_ujikom (dengan 6 indexes)
-- ✓ Table usulan_ujikom_status_history (dengan 1 index)
-- ✓ Trigger untuk updated_at
-- ✓ 5 RLS policies untuk usulan_ujikom
-- ✓ 3 RLS policies untuk usulan_ujikom_status_history
-- ✓ GRANT permissions
```

**Cara Deploy:**
1. Buka file `supabase/migrations/20260603000000_create_usulan_ujikom_tables_and_rls.sql`
2. Copy **semua** isinya (Ctrl+A, Ctrl+C)
3. Paste ke Supabase SQL Editor
4. Click **Run** (atau Ctrl+Enter)
5. Tunggu sampai selesai (biasanya 5-10 detik)

**Expected Output:**
```
Success. No rows returned
```

**Verification:**
```sql
-- Cek tables dibuat
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'usulan_ujikom%';

-- Expected: 2 rows (usulan_ujikom, usulan_ujikom_status_history)

-- Cek indexes dibuat
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'usulan_ujikom';

-- Expected: 6 indexes

-- Cek RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'usulan_ujikom%';

-- Expected: Both should have rowsecurity = true
```

### Migration 2: Create Storage Bucket (1-2 minutes)

```sql
-- Copy paste SELURUH isi file:
-- supabase/migrations/20260603000000_create_usulan_ujikom_storage.sql

-- File ini akan create:
-- ✓ Storage bucket 'usulan-ujikom'
-- ✓ 2 storage policies untuk Admin Pusat
-- ✓ 4 storage policies untuk Admin Unit
```

**Cara Deploy:**
1. Buka file `supabase/migrations/20260603000000_create_usulan_ujikom_storage.sql`
2. Copy **semua** isinya (Ctrl+A, Ctrl+C)
3. Paste ke Supabase SQL Editor
4. Click **Run**
5. Tunggu sampai selesai

**Expected Output:**
```
Success. No rows returned
```

**Verification:**
```sql
-- Cek bucket dibuat
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'usulan-ujikom';

-- Expected: 1 row
-- public should be false
-- file_size_limit should be 5242880 (5MB)

-- Cek storage policies dibuat
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%usulan%';

-- Expected: 6 policies
```

## ✅ Final Verification

Setelah kedua migrasi selesai, jalankan verification lengkap:

```sql
-- 1. Check tables
SELECT 
  'Tables' as check_type,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'usulan_ujikom%'

UNION ALL

-- 2. Check indexes
SELECT 
  'Indexes' as check_type,
  COUNT(*) as count
FROM pg_indexes 
WHERE tablename = 'usulan_ujikom'

UNION ALL

-- 3. Check RLS policies
SELECT 
  'RLS Policies' as check_type,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename LIKE 'usulan_ujikom%'

UNION ALL

-- 4. Check storage policies
SELECT 
  'Storage Policies' as check_type,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'storage' 
AND policyname LIKE '%usulan%';

-- Expected results:
-- Tables: 2
-- Indexes: 7 (6 for main table + 1 for history)
-- RLS Policies: 8 (5 + 3)
-- Storage Policies: 6
```

## 🎯 Test the Deployment

### Test 1: Table Access

```sql
-- Try to select from tables
SELECT COUNT(*) FROM public.usulan_ujikom;
-- Should return 0 (empty table)

SELECT COUNT(*) FROM public.usulan_ujikom_status_history;
-- Should return 0 (empty table)
```

### Test 2: Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. You should see bucket: **usulan-ujikom**
3. Click on it - should be empty
4. Settings should show:
   - Public: OFF
   - File size limit: 5MB
   - Allowed MIME types: PDF, JPG, JPEG, PNG

### Test 3: Application Access

1. **Restart your development server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Login as Admin Unit:**
   - Navigate to app
   - Look for "Usulan Ujikom" in sidebar menu
   - Click to open page
   - Should load without errors

3. **Login as Admin Pusat:**
   - Navigate to app
   - Look for "Menu Usulan Ujikom" in sidebar menu
   - Click to open page
   - Should load without errors

## 🐛 Troubleshooting

### Error: "relation does not exist"
**Problem:** Tables not created
**Solution:** Re-run Migration 1

### Error: "bucket already exists"
**Problem:** Bucket created previously
**Solution:** This is OK. The migration uses ON CONFLICT DO NOTHING

### Error: "policy already exists"
**Problem:** Policies created previously
**Solution:** This is OK. The migration uses DROP POLICY IF EXISTS before creating

### Error: "function has_role does not exist"
**Problem:** Missing helper functions
**Solution:** 
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'has_role';

-- If not exists, you need to create it first
-- (This should already exist in your database from previous migrations)
```

### Error: "function get_user_department does not exist"
**Problem:** Missing helper functions
**Solution:**
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'get_user_department';

-- If not exists, you need to create it first
-- (This should already exist in your database from previous migrations)
```

### Cannot see menu items after deployment
**Problem:** Browser cache or dev server not restarted
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Restart dev server
4. Check your role (must be admin_unit or admin_pusat)

### Storage upload fails with "permission denied"
**Problem:** RLS policies not working or user role incorrect
**Solution:**
1. Verify bucket policies exist (see verification above)
2. Check user role in profiles table
3. Try re-running Migration 2

## 📊 Database Schema Overview

After successful deployment, you'll have:

### Tables
- `usulan_ujikom` - Main table for usulan data
- `usulan_ujikom_status_history` - Audit trail

### Storage
- `usulan-ujikom` bucket - For document uploads

### Indexes (7 total)
- Employee lookup
- Position lookup
- Department filtering
- Status filtering
- Waiting queue management
- Submission date sorting
- Creator filtering
- Status history lookup

### RLS Policies (8 total)
- 5 for usulan_ujikom table
- 3 for usulan_ujikom_status_history table

### Storage Policies (6 total)
- 2 for Admin Pusat (view, delete)
- 4 for Admin Unit (upload, view, update, delete)

## ✨ Next Steps

After successful deployment:

1. **Test Create Usulan:**
   - Login as Admin Unit
   - Create a test usulan
   - Upload a test document
   - Submit usulan

2. **Test Status Change:**
   - Login as Admin Pusat
   - View the test usulan
   - Change status
   - Verify notification sent

3. **Test Waiting List:**
   - Create multiple usulan for same position (when formasi full)
   - Verify queue positions assigned
   - Change one to "Tidak_Lulus"
   - Verify auto-promotion works

4. **Production Deployment:**
   - Apply same migrations to production database
   - Test thoroughly before announcing feature

---

**Deployment Status:** Ready to deploy! 🚀
**Estimated Time:** 5 minutes total
**Risk Level:** Low (idempotent migrations with safety checks)
