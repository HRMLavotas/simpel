# 🔐 Row Level Security (RLS) Implementation Guide

## Overview
Row Level Security (RLS) adalah fitur keamanan di PostgreSQL/Supabase yang membatasi akses data berdasarkan user yang sedang login.

## Why RLS is Critical

### Without RLS:
- ❌ Semua user bisa akses semua data
- ❌ Anon key bisa digunakan untuk unauthorized access
- ❌ Data breach risk tinggi

### With RLS:
- ✅ User hanya bisa akses data sesuai role
- ✅ Anon key aman karena dibatasi RLS
- ✅ Data breach risk minimal

## Current Status

### ⚠️ ACTION REQUIRED: Verify RLS Implementation

Anda perlu memverifikasi bahwa RLS sudah diaktifkan di semua tabel:

1. Login ke Supabase Dashboard
2. Go to Database > Tables
3. Check setiap tabel apakah RLS enabled
4. Verify policies sudah benar

## Tables yang Perlu RLS

### 1. employees
**RLS Status:** ⚠️ VERIFY REQUIRED

**Policies:**
```sql
-- Policy: Admin Pusat bisa akses semua
CREATE POLICY "admin_pusat_all_access" ON employees
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pusat'
    )
  );

-- Policy: Admin Pimpinan bisa read semua
CREATE POLICY "admin_pimpinan_read_all" ON employees
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pimpinan'
    )
  );

-- Policy: Admin Unit hanya bisa akses unit mereka
CREATE POLICY "admin_unit_own_department" ON employees
  FOR ALL
  USING (
    department = (
      SELECT profiles.department
      FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );
```

### 2. profiles
**RLS Status:** ⚠️ VERIFY REQUIRED

**Policies:**
```sql
-- Policy: User bisa read profile sendiri
CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Admin Pusat bisa read semua profiles
CREATE POLICY "admin_pusat_read_all_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pusat'
    )
  );

-- Policy: Admin Pusat bisa update profiles
CREATE POLICY "admin_pusat_update_profiles" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pusat'
    )
  );
```

### 3. user_roles
**RLS Status:** ⚠️ VERIFY REQUIRED

**Policies:**
```sql
-- Policy: User bisa read role sendiri
CREATE POLICY "users_read_own_role" ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admin Pusat bisa manage semua roles
CREATE POLICY "admin_pusat_manage_roles" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin_pusat'
    )
  );
```

### 4. departments
**RLS Status:** ⚠️ VERIFY REQUIRED

**Policies:**
```sql
-- Policy: Semua authenticated user bisa read departments
CREATE POLICY "authenticated_read_departments" ON departments
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Admin Pusat bisa manage departments
CREATE POLICY "admin_pusat_manage_departments" ON departments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pusat'
    )
  );
```

### 5. History Tables
**Tables:**
- education_history
- mutation_history
- position_history
- rank_history
- competency_test_history
- training_history

**Policies (sama untuk semua):**
```sql
-- Policy: Admin Pusat bisa akses semua
CREATE POLICY "admin_pusat_all_access" ON [table_name]
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pusat'
    )
  );

-- Policy: Admin Pimpinan bisa read semua
CREATE POLICY "admin_pimpinan_read_all" ON [table_name]
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin_pimpinan'
    )
  );

-- Policy: Admin Unit hanya bisa akses data dari unit mereka
CREATE POLICY "admin_unit_own_department" ON [table_name]
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees e
      JOIN profiles p ON p.id = auth.uid()
      WHERE e.id = [table_name].employee_id
      AND e.department = p.department
    )
  );
```

### 6. Notes Tables
**Tables:**
- placement_notes
- assignment_notes
- change_notes

**Policies:** (sama seperti history tables)

## Implementation Steps

### Step 1: Enable RLS on All Tables

```sql
-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_test_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_notes ENABLE ROW LEVEL SECURITY;
```

### Step 2: Create Policies

Run the SQL policies above for each table.

### Step 3: Test RLS

```sql
-- Test as admin_pusat
SELECT * FROM employees; -- Should return all

-- Test as admin_unit
SELECT * FROM employees; -- Should return only their department

-- Test as admin_pimpinan
SELECT * FROM employees; -- Should return all (read-only)
```

## Verification Checklist

- [ ] RLS enabled on `employees` table
- [ ] RLS enabled on `profiles` table
- [ ] RLS enabled on `user_roles` table
- [ ] RLS enabled on `departments` table
- [ ] RLS enabled on all history tables
- [ ] RLS enabled on all notes tables
- [ ] Policies created for admin_pusat
- [ ] Policies created for admin_pimpinan
- [ ] Policies created for admin_unit
- [ ] Tested with different user roles
- [ ] Verified unauthorized access is blocked

## Testing RLS

### Test 1: Admin Pusat Access
```javascript
// Login as admin_pusat
const { data } = await supabase
  .from('employees')
  .select('*');

// Expected: Returns all employees
console.log('Admin Pusat sees:', data.length, 'employees');
```

### Test 2: Admin Unit Access
```javascript
// Login as admin_unit (e.g., Dinas Kesehatan)
const { data } = await supabase
  .from('employees')
  .select('*');

// Expected: Returns only Dinas Kesehatan employees
console.log('Admin Unit sees:', data.length, 'employees');
console.log('All from department:', data.every(e => e.department === 'Dinas Kesehatan'));
```

### Test 3: Unauthorized Access
```javascript
// Try to access with invalid token
const { data, error } = await supabase
  .from('employees')
  .select('*');

// Expected: Error or empty array
console.log('Unauthorized access:', error || 'No data');
```

## Common Issues

### Issue 1: RLS blocks all access
**Cause:** No policies created
**Solution:** Create appropriate policies for each role

### Issue 2: Admin Unit can't access their data
**Cause:** Policy not matching department correctly
**Solution:** Check profile.department matches employee.department

### Issue 3: Policies too permissive
**Cause:** Using `true` in USING clause
**Solution:** Use proper role checks

## Security Best Practices

### 1. Always Enable RLS
```sql
-- ✅ Good
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- ❌ Bad
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
```

### 2. Use Specific Policies
```sql
-- ✅ Good - Specific role check
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin_pusat'
  )
)

-- ❌ Bad - Too permissive
USING (true)
```

### 3. Test Each Policy
- Test with different user roles
- Test unauthorized access
- Test edge cases

### 4. Monitor Access
- Enable Supabase logging
- Review access patterns
- Alert on suspicious activity

## Emergency Procedures

### If RLS is Blocking Legitimate Access:

1. **Temporary Fix (NOT RECOMMENDED):**
```sql
-- ONLY for emergency debugging
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
```

2. **Proper Fix:**
```sql
-- Review and fix policies
DROP POLICY IF EXISTS "policy_name" ON employees;
CREATE POLICY "policy_name" ON employees
  FOR ALL
  USING (/* correct condition */);
```

3. **Re-enable RLS:**
```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
```

## Monitoring

### Check RLS Status:
```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Check Policies:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [OWASP Access Control](https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control)

---

**CRITICAL:** RLS harus diaktifkan sebelum aplikasi go live!

**Last Updated:** 2 April 2026  
**Next Review:** 2 Mei 2026
