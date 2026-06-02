# Usulan Ujikom - Schema Fixes Summary

## Tanggal: 2026-06-03

## Masalah yang Diperbaiki

### 1. Column Name Mismatches
**Masalah**: Query menggunakan nama kolom yang tidak ada di database
**Solusi**: Update semua query untuk match dengan schema aktual

#### Perubahan di `employees` table:
- ❌ `current_position` (tidak ada)
- ✅ `position_name` (kolom aktual)

#### Perubahan di `position_references` table:
- ❌ `position_grade` (tidak ada)
- ✅ `grade` (kolom aktual, tipe: integer)

#### Perubahan di semua tabel (department field):
- ❌ `department_id` (foreign key - tidak ada)
- ✅ `department` (VARCHAR - kolom aktual)

### 2. Foreign Key vs VARCHAR Field
**Masalah**: Code mengasumsikan `department_id` adalah foreign key, padahal database menggunakan denormalized VARCHAR field `department`

**Tables affected**:
- `usulan_ujikom.department` → VARCHAR
- `employees.department` → VARCHAR  
- `position_references.department` → VARCHAR
- `profiles.department` → VARCHAR

### 3. Sidebar Layout Integration
**Masalah**: Pages tidak menggunakan AppLayout wrapper sehingga sidebar tidak muncul

**Solusi**: Wrap kedua pages dengan `<AppLayout>` component:
- ✅ `src/pages/UsulanUjikom.tsx`
- ✅ `src/pages/UsulanUjikomPusat.tsx`

## Files yang Diubah

### Storage Layer
- ✅ `src/lib/usulan-ujikom/storage.ts`
  - Update semua SELECT queries: `position_name`, `grade`, `department`
  - Update semua WHERE clauses: `.eq('department', ...)` bukan `.eq('department_id', ...)`
  - Fix `fetchUsulanList()`, `fetchUsulanById()`, `calculateFormasi()`, `createUsulan()`, `promoteFromWaitingList()`, `reorderWaitingList()`, `fetchWaitingListInfo()`, `getUsulanStatistics()`

### Type Definitions  
- ✅ `src/lib/usulan-ujikom/types.ts`
  - Update `UsulanUjikomWithDetails.employee.position_name`
  - Update `UsulanUjikomWithDetails.position_reference.grade` (number)

### UI Components
- ✅ `src/components/usulan-ujikom/EmployeeSelector.tsx`
  - Update Employee interface: `position_name`
  - Update query: `.eq('department', ...)` dan `.select('...position_name...')`
  - Update display: `employee.position_name`
  - Use `profile?.department` bukan `profile?.department_id`

- ✅ `src/components/usulan-ujikom/PetaJabatanSelector.tsx`
  - Update PositionReference interface: `grade: number | null`, `department: string`
  - Update query: `.select('...grade, department')` dan `.eq('department', ...)`
  - Update display: `Grade {position.grade}`
  - Use `profile?.department`

- ✅ `src/components/usulan-ujikom/UsulanList.tsx`
  - Update display: `position_reference.grade` → `Grade {grade}`

- ✅ `src/components/usulan-ujikom/UsulanDetail.tsx`
  - Update display: `position_reference.grade` → `Grade {grade}`

- ✅ `src/components/usulan-ujikom/UsulanPusatList.tsx`
  - Update display: `position_reference.grade` → `Grade {grade}`

- ✅ `src/components/usulan-ujikom/UsulanPusatDetail.tsx`
  - Update display: `position_reference.grade` → `Grade {grade}`

- ✅ `src/components/usulan-ujikom/UsulanForm.tsx`
  - Use `profile?.department` untuk default values
  - Use `usulan.department.id` saat editing

### Hooks
- ✅ `src/hooks/useUsulanUjikom.ts`
  - Update `useUsulanStatistics()`: use `profile?.department`

### Pages
- ✅ `src/pages/UsulanUjikom.tsx`
  - Add `<AppLayout>` wrapper
  - Add import `AppLayout`

- ✅ `src/pages/UsulanUjikomPusat.tsx`
  - Add `<AppLayout>` wrapper
  - Add import `AppLayout`
  - Update query untuk stats: `.select('status, department')` bukan `department_id`

## Schema Aktual Database

### `usulan_ujikom` table:
```sql
id                       uuid (PK)
employee_id              uuid (FK → employees)
position_reference_id    uuid (FK → position_references)
creator_id               uuid (FK → auth.users)
department               varchar NOT NULL (denormalized)
jabatan_target           varchar
employee_name            varchar
employee_nip             varchar
status                   varchar
queue_position           integer
surat_pengantar_url      text
surat_pengantar_path     text
link_dokumen_persyaratan text
cancellation_reason      text
feedback_notes           text
admin_notes              text
submitted_at             timestamptz
created_at               timestamptz
updated_at               timestamptz
```

### `employees` table (relevant columns):
```sql
id             uuid (PK)
position_name  varchar (bukan current_position!)
rank           varchar
asn_status     varchar
is_active      boolean
department     varchar (bukan department_id!)
```

### `position_references` table:
```sql
id                uuid (PK)
department        varchar (bukan department_id!)
position_category varchar
position_name     varchar
grade             integer (bukan position_grade!)
abk_count         integer
```

### `profiles` table (relevant columns):
```sql
id         uuid (PK)
department varchar (bukan department_id!)
```

## Testing Checklist

### ✅ Harus Ditest:
1. ✅ Load halaman Usulan Ujikom (Admin Unit) - sidebar harus muncul
2. ✅ Load halaman Usulan Ujikom Pusat (Admin Pusat) - sidebar harus muncul
3. ⏳ Fetch usulan list - tidak ada error column tidak ditemukan
4. ⏳ View usulan detail - semua field tampil dengan benar
5. ⏳ Create usulan baru - bisa save dengan department VARCHAR
6. ⏳ Update usulan - update berhasil
7. ⏳ Employee selector - load dan display pegawai dengan benar
8. ⏳ Position selector - load dan display jabatan dengan grade
9. ⏳ Statistics dashboard - load data dengan benar
10. ⏳ Waiting list - queue position management

## Status
- **Column mismatches**: ✅ FIXED
- **Department field**: ✅ FIXED  
- **Sidebar layout**: ✅ FIXED
- **TypeScript types**: ✅ FIXED
- **Testing**: ⏳ PENDING (user verification)

## Next Steps
1. Refresh browser dan test halaman Usulan Ujikom
2. Verify tidak ada console errors
3. Test create/edit usulan functionality
4. Test formasi calculation
5. Create storage bucket manually di Supabase Dashboard jika belum
