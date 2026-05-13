# ✅ Database Integration: Kasus Pegawai

## 🎉 Status: BERHASIL DIINTEGRASIKAN

Sistem Management Kasus Pegawai telah berhasil diintegrasikan dengan Supabase database.

## 📊 Database Schema

### 1. **employee_cases** Table
Tabel utama untuk menyimpan data kasus pegawai.

```sql
CREATE TABLE public.employee_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number TEXT UNIQUE,
  
  -- Employee Information
  employee_id UUID NOT NULL REFERENCES public.profiles(id),
  employee_name TEXT NOT NULL,
  employee_nip TEXT NOT NULL,
  
  -- Case Information
  case_type TEXT NOT NULL CHECK (case_type IN (
    'disiplin', 'kinerja', 'etika', 'administrasi', 'hukum', 'kesehatan', 'lainnya'
  )),
  status TEXT NOT NULL DEFAULT 'baru' CHECK (status IN (
    'baru', 'diproses', 'tertunda', 'selesai', 'ditutup'
  )),
  severity TEXT CHECK (severity IN (
    'ringan', 'sedang', 'berat', 'sangat_berat'
  )),
  description TEXT NOT NULL,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Case Details (JSONB for flexible schema)
  case_details JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- `idx_employee_cases_employee_id` - Fast lookup by employee
- `idx_employee_cases_case_type` - Filter by case type
- `idx_employee_cases_status` - Filter by status
- `idx_employee_cases_created_by` - Filter by creator
- `idx_employee_cases_report_date` - Sort by report date
- `idx_employee_cases_created_at` - Sort by creation date

### 2. **case_timeline** Table
Tabel untuk menyimpan timeline tindak lanjut kasus.

```sql
CREATE TABLE public.case_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.employee_cases(id) ON DELETE CASCADE,
  
  -- Timeline Information
  date DATE NOT NULL,
  description TEXT NOT NULL,
  status TEXT,
  
  -- Legacy fields (backward compatibility)
  involved_parties TEXT,
  document_link TEXT,
  document_name TEXT,
  
  -- New structured fields
  involved_parties_list JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Indexes:**
- `idx_case_timeline_case_id` - Fast lookup by case
- `idx_case_timeline_date` - Sort by date

### 3. **case_access_control** Table
Tabel untuk mengelola akses user ke sistem kasus.

```sql
CREATE TABLE public.case_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User Information
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  
  -- Permissions
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_view BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  granted_by UUID NOT NULL REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);
```

**Indexes:**
- `idx_case_access_control_user_id` - Fast lookup by user

## 🔐 Row Level Security (RLS)

### employee_cases Policies

**Admin Pusat:**
- ✅ View all cases
- ✅ Insert cases
- ✅ Update cases
- ✅ Delete cases

**Users with Granted Access:**
- ✅ View cases (if `can_view = true`)
- ✅ Update cases (if `can_edit = true`)

### case_timeline Policies

**Admin Pusat:**
- ✅ View all timeline items
- ✅ Insert timeline items
- ✅ Update timeline items
- ✅ Delete timeline items

**Users with Granted Access:**
- ✅ View timeline items (if `can_view = true`)
- ✅ Insert/Update/Delete timeline items (if `can_edit = true`)

### case_access_control Policies

**Admin Pusat:**
- ✅ Full access to manage access control

**All Users:**
- ✅ View their own access record

## 🔧 Helper Functions

### 1. `generate_case_number()`
Auto-generate unique case number dengan format: `CASE-YYYYMMDD-XXXXX`

```sql
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  date_part TEXT;
  random_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  random_part := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  new_number := 'CASE-' || date_part || '-' || random_part;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;
```

### 2. Auto-generate Trigger
Otomatis generate case_number saat insert jika tidak diisi.

### 3. `has_role()` Function
Fungsi untuk check user role (sudah ada di sistem).

```sql
has_role(auth.uid(), 'admin_pusat')
```

## 📝 Migration File

**File:** `supabase/migrations/20260513100000_create_employee_cases.sql`

**Status:** ✅ Applied Successfully

**Includes:**
- ✅ Table creation
- ✅ Indexes
- ✅ Triggers
- ✅ RLS policies
- ✅ Helper functions
- ✅ Comments

## 🔄 Storage Layer Update

**File:** `src/lib/employeeCaseStorage.ts`

**Changes:**
- ❌ Removed localStorage implementation
- ✅ Added Supabase queries
- ✅ Proper error handling
- ✅ Type mapping between DB and App

**Key Functions:**
```typescript
// Cases
getAllCases() -> Fetch all cases with timeline
getCaseById(id) -> Fetch single case with timeline
createCase(data) -> Insert new case
updateCase(id, updates) -> Update case
deleteCase(id) -> Delete case

// Timeline
addTimelineItem(...) -> Insert timeline item
updateTimelineItem(...) -> Update timeline item
deleteTimelineItem(...) -> Delete timeline item

// Access Control
getAllAccessControl() -> Fetch all access records
grantAccess(...) -> Grant/update user access
revokeAccess(userId) -> Revoke user access
checkUserAccess(userId) -> Check user access
```

## 🧪 Testing

### Test Database Connection

```typescript
// Test in browser console
import { getAllCases } from '@/lib/employeeCaseStorage';

// Should return empty array or existing cases
const cases = await getAllCases();
console.log(cases);
```

### Test Create Case

```typescript
import { createCase } from '@/lib/employeeCaseStorage';

const newCase = await createCase({
  employeeId: 'user-uuid',
  employeeName: 'Test User',
  employeeNip: '123456789',
  caseType: 'disiplin',
  status: 'baru',
  severity: 'sedang',
  description: 'Test case',
  reportDate: '2026-05-13',
  createdBy: 'admin-uuid'
});

console.log(newCase);
```

## 📊 Data Flow

```
User Action (UI)
    ↓
Component (React)
    ↓
Storage Layer (employeeCaseStorage.ts)
    ↓
Supabase Client
    ↓
PostgreSQL Database
    ↓
RLS Policies Check
    ↓
Return Data
```

## 🔍 Query Examples

### Get All Cases for Admin Pusat
```sql
SELECT * FROM employee_cases
ORDER BY created_at DESC;
```

### Get Cases with Timeline
```sql
SELECT 
  ec.*,
  json_agg(ct ORDER BY ct.date DESC) as timeline
FROM employee_cases ec
LEFT JOIN case_timeline ct ON ct.case_id = ec.id
GROUP BY ec.id
ORDER BY ec.created_at DESC;
```

### Check User Access
```sql
SELECT * FROM case_access_control
WHERE user_id = 'user-uuid';
```

## 🚀 Deployment Checklist

- ✅ Migration file created
- ✅ Migration applied to database
- ✅ RLS policies configured
- ✅ Indexes created
- ✅ Triggers set up
- ✅ Storage layer updated
- ✅ Type mappings correct
- ✅ Error handling implemented

## 🎯 Next Steps

### For Testing
1. ✅ Login as Admin Pusat
2. ✅ Navigate to `/admin/kasus-pegawai`
3. ✅ Create a test case
4. ✅ Add timeline items
5. ✅ Test access control

### For Production
1. ✅ Database already configured
2. ⏳ Test with real data
3. ⏳ Monitor performance
4. ⏳ Setup backup strategy

## 📚 Related Files

### Database
- `supabase/migrations/20260513100000_create_employee_cases.sql`

### Frontend
- `src/lib/employeeCaseStorage.ts` - Storage layer
- `src/lib/employeeCaseTypes.ts` - Type definitions
- `src/pages/EmployeeCaseManagement.tsx` - List page
- `src/pages/EmployeeCaseDetail.tsx` - Detail page

### Components
- `src/components/cases/CaseFormDialog.tsx`
- `src/components/cases/CaseAccessManagement.tsx`
- `src/components/cases/CaseDetailCard.tsx`

## 🐛 Troubleshooting

### Case tidak muncul
```sql
-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'employee_cases';

-- Check user role
SELECT has_role(auth.uid(), 'admin_pusat');
```

### Permission denied
```sql
-- Verify user has admin_pusat role
SELECT * FROM user_roles 
WHERE user_id = auth.uid();
```

### Timeline tidak tersimpan
```sql
-- Check foreign key
SELECT * FROM case_timeline 
WHERE case_id = 'case-uuid';
```

## 📈 Performance

### Indexes
All critical queries are indexed for optimal performance:
- Employee lookup: O(log n)
- Case type filter: O(log n)
- Status filter: O(log n)
- Timeline by case: O(log n)

### Caching
Consider implementing:
- React Query for client-side caching
- Supabase realtime for live updates

## 🎉 Success!

Database integration complete! Sistem Management Kasus Pegawai sekarang fully integrated dengan Supabase.

---

**Migration Applied:** 2026-05-13
**Status:** ✅ Production Ready
