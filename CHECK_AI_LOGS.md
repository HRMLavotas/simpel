# 🔍 Cara Check AI Chatbot Logs

## 📋 Step-by-Step

### 1. Buka Supabase Dashboard
```
URL: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra/functions
```

### 2. Klik Function "ai-chat"
- Di list functions, klik pada "ai-chat"

### 3. Klik Tab "Logs"
- Di halaman function, klik tab "Logs"
- Logs akan menampilkan real-time output

### 4. Cari Log Output
Look for these log entries:

```
=== FETCH RELEVANT DATA START ===
Query: Henry Mujianto pangkatnya apa?
User Department: Pusat
Can View All: true

Fetching employee data...

Employee query result: {
  count: 150,  // <-- Ini harus > 0
  error: null,
  errorDetails: null,
  sampleEmployee: {
    name: "...",
    rank: "...",
    rank_group: "...",
    department: "..."
  }
}

Statistics calculated: {
  total: 150,
  pns: 120,
  ...
}

=== FETCH RELEVANT DATA END ===
```

## 🔍 Apa yang Harus Dicari

### ✅ Good Signs
```
count: 150  // Ada data pegawai
error: null  // Tidak ada error
sampleEmployee: { name: "...", rank: "..." }  // Ada sample data
```

### ❌ Bad Signs
```
count: 0  // TIDAK ADA DATA!
error: "some error message"  // ADA ERROR!
NO EMPLOYEES FOUND!  // Warning message
```

## 🐛 Kemungkinan Masalah

### Problem 1: count: 0 (No Data)
**Penyebab:**
- RLS policy blocking query
- Service role tidak bisa akses
- Data memang kosong

**Solusi:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'employees';

-- Test query as service role
SET ROLE service_role;
SELECT COUNT(*) FROM employees WHERE is_active = true;
RESET ROLE;
```

### Problem 2: Error Message
**Penyebab:**
- Permission denied
- Column tidak ada
- Table tidak ada

**Solusi:**
Check error message detail dan fix accordingly.

### Problem 3: sampleEmployee: null
**Penyebab:**
- employees array kosong
- Data structure issue

**Solusi:**
Check database directly:
```sql
SELECT * FROM employees WHERE is_active = true LIMIT 5;
```

## 🔧 Quick Fixes

### Fix 1: Bypass RLS for Service Role
```sql
-- Service role should bypass RLS automatically
-- But if not, check policies:

-- Drop restrictive policies
DROP POLICY IF EXISTS "some_restrictive_policy" ON employees;

-- Create permissive policy for service role
CREATE POLICY "service_role_full_access"
  ON employees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Fix 2: Grant Permissions
```sql
-- Grant select to service role
GRANT SELECT ON employees TO service_role;
GRANT SELECT ON position_references TO service_role;
```

### Fix 3: Check Table Exists
```sql
-- Verify table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'employees';
```

## 📊 Expected Log Output

### Successful Query
```
=== FETCH RELEVANT DATA START ===
Query: Henry Mujianto pangkatnya apa?
User Department: Pusat
Can View All: true
Fetching employee data...
Employee query result: {
  count: 150,
  error: null,
  errorDetails: null,
  sampleEmployee: {
    name: "Ahmad Suryanto",
    rank: "Penata Tk.I",
    rank_group: "III",
    department: "BPVP Semarang"
  }
}
Statistics calculated: {
  total: 150,
  pns: 120,
  cpns: 5,
  pppk: 15,
  nonAsn: 10,
  departmentCount: 4,
  rankGroupCount: 3
}
Departments found: 4
=== FETCH RELEVANT DATA END ===
Final data summary: {
  hasEmployees: true,
  employeeCount: 150,
  hasPetaJabatan: false,
  petaJabatanCount: 0,
  departmentCount: 4
}
```

### Failed Query (RLS Issue)
```
=== FETCH RELEVANT DATA START ===
Query: Henry Mujianto pangkatnya apa?
User Department: Pusat
Can View All: true
Fetching employee data...
ERROR fetching employees: {
  code: "42501",
  message: "permission denied for table employees"
}
Employee query result: {
  count: 0,
  error: "permission denied for table employees",
  errorDetails: {...},
  sampleEmployee: null
}
NO EMPLOYEES FOUND!
```

## 🚀 Next Steps

### If Logs Show Data (count > 0)
✅ Data fetching works!
❌ Problem is with AI prompt or DeepSeek API
→ Check AI response quality

### If Logs Show No Data (count = 0)
❌ Data fetching failed!
→ Fix RLS policies
→ Grant permissions
→ Check database

### If No Logs Appear
❌ Function not being called!
→ Check frontend integration
→ Check authentication
→ Check network requests

## 📞 Get Help

### Information to Provide
1. **Full log output** from Supabase Dashboard
2. **Error messages** if any
3. **User role** (Admin Pusat/Unit)
4. **Query** that was asked
5. **Expected behavior** vs actual

### Where to Check
1. ✅ Supabase Dashboard > Functions > ai-chat > Logs
2. ✅ Browser Console (F12)
3. ✅ Network Tab (check API calls)
4. ✅ Database directly (run SQL queries)

---

**Quick Access:**
- Dashboard: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra
- Functions: https://supabase.com/dashboard/project/mauyygrbdopmpdpnwzra/functions
- Logs: Click "ai-chat" → "Logs" tab

**Status**: Ready for debugging
**Date**: 7 Mei 2026
