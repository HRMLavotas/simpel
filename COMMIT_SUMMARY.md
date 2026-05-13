# Commit Summary: Fix Admin Pusat & Simplify Quick Action

## Changes to Commit

### 1. Backend - Database Migration ✅ (Already deployed to Supabase)
**File:** `supabase/migrations/20260513000001_restore_admin_pusat_policies.sql`
**Status:** Already pushed to Supabase, no need to commit to git

### 2. Frontend - QuickActionForm.tsx
**File:** `src/components/employees/QuickActionForm.tsx`

**Changes:**
1. Import `useEffect` from 'react'
2. Add 4 useEffect hooks for auto-apply:
   - Naik Pangkat
   - Mutasi
   - Ganti Jabatan
   - Non-Aktif
3. Remove 4 "Terapkan" buttons
4. Update Alert instructions
5. Simplify success messages

### 3. Frontend - EmployeeFormModal.tsx
**File:** `src/components/employees/EmployeeFormModal.tsx`

**Changes:**
1. Fix race condition in employee data loading
2. Consolidate setTimeout for rank_group setting

## Commit Message

```
fix: admin pusat permissions and simplify Quick Action

- Restore admin_pusat RLS policies (deployed to Supabase)
- Remove "Terapkan" buttons from Quick Action
- Add auto-apply with useEffect for all Quick Actions
- Fix race condition in form data loading
- Fix mutation not saving issue

BREAKING CHANGE: Quick Action now auto-applies changes without "Terapkan" button
```

## Files to Stage

```powershell
git add src/components/employees/QuickActionForm.tsx
git add src/components/employees/EmployeeFormModal.tsx
```

## Note

Migration file tidak perlu di-commit karena:
1. Sudah di-push ke Supabase production
2. Sudah berjalan dengan baik
3. Tidak ada di working directory (hilang saat reset)

Dokumentasi tidak di-commit karena mengandung sensitive tokens.
