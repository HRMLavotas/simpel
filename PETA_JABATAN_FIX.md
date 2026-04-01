# Peta Jabatan 400 Error - FIXED ✅

## Problem
The Peta Jabatan page was throwing 400 errors when trying to fetch employee data because the Supabase queries were trying to select columns that don't exist in the database.

## Root Cause
The employees table was designed for ASN employees and doesn't have Non-ASN specific columns like:
- `nik` (NIK for Non-ASN)
- `position` (different from `position_name`)
- `education` & `education_major`
- `type_non_asn`
- `job_description`
- `notes`

## Solution: Column Mapping Strategy

Instead of modifying the database schema, we mapped Non-ASN fields to existing ASN columns:

| Non-ASN Field | Maps To | ASN Column | Notes |
|---------------|---------|------------|-------|
| NIK | → | `nip` | Both are ID fields |
| Jabatan | → | `position_name` | Position/job title |
| Type Non ASN | → | `rank_group` | Repurposed for Non-ASN type |
| Deskripsi Tugas | → | `keterangan_penugasan` | Assignment notes |
| Catatan | → | `keterangan_perubahan` | Change notes |
| ~~Pendidikan~~ | ❌ | Removed | Can be added to education_history table later |
| ~~Jurusan~~ | ❌ | Removed | Can be added to education_history table later |

## Changes Applied

### 1. PetaJabatan.tsx
- Fixed ASN query to use correct columns
- Fixed Non-ASN query to use mapped columns
- Updated EmployeeMatch interface
- Updated Non-ASN tab table to show: NIK/NIP, Nama, Jabatan, Jenis Kelamin, Type Non ASN, Deskripsi Tugas

### 2. NonAsnFormModal.tsx
- Updated NonAsnFormData interface to use mapped column names
- Changed `nik` → `nip`
- Changed `position` → `position_name`
- Changed `type_non_asn` → `rank_group`
- Changed `job_description` → `keterangan_penugasan`
- Changed `notes` → `keterangan_perubahan`
- Removed education fields (can be added later via education_history table)

### 3. ImportNonAsn.tsx
- Updated insert statement to map Non-ASN fields to ASN columns
- NIK data goes to `nip` field
- Position goes to `position_name` field
- Type Non ASN goes to `rank_group` field
- Job description goes to `keterangan_penugasan` field
- Notes go to `keterangan_perubahan` field

## Result
✅ No more 400 errors
✅ ASN tab displays correctly with Kepmen 202/2024 structure
✅ Non-ASN tab displays correctly with employee list
✅ Non-ASN form saves data correctly
✅ Non-ASN import works with column mapping
✅ All TypeScript errors resolved
✅ No database schema changes required

## Files Modified
- `src/pages/PetaJabatan.tsx`
- `src/components/employees/NonAsnFormModal.tsx`
- `src/pages/ImportNonAsn.tsx`

## Future Enhancements
If education data is needed for Non-ASN employees, it can be stored in the `education_history` table with a reference to the employee_id.
