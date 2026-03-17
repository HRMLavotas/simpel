

## Plan: Setup Admin, Departments & Enhanced Employee Management

### 1. Create Admin Pusat User
Call the `seed-admin` edge function with:
- Email: ali.coolz30@gmail.com
- Password: alhadi42
- Role: admin_pusat
- Department: Pusat

### 2. Insert Department Data
Insert 28 departments into the `departments` table using the data insert tool.

### 3. Create New Database Tables for Employee History
Create 5 new tables for the additional riwayat (history) data:

- **`mutation_history`** (employee_id, tanggal, dari_unit, ke_unit, nomor_sk, keterangan)
- **`position_history`** (employee_id, tanggal, jabatan_lama, jabatan_baru, nomor_sk, keterangan)
- **`rank_history`** (employee_id, tanggal, pangkat_lama, pangkat_baru, nomor_sk, tmt)
- **`competency_test_history`** (employee_id, tanggal, jenis_uji, hasil, keterangan)
- **`training_history`** (employee_id, tanggal_mulai, tanggal_selesai, nama_diklat, penyelenggara, sertifikat, keterangan)

All with RLS policies matching the existing education_history pattern (admin_pusat full access, admin_unit own department).

### 4. Update Employee Form Modal
Add the missing fields from the requested structure:
- **keterangan_formasi** (already in DB, not in form)
- **keterangan_penempatan** (already in DB, not in form)  
- **keterangan_penugasan** (already in DB, not in form)
- **keterangan_perubahan** (already in DB, not in form)

Add 5 new repeatable history sections (same pattern as EducationHistoryForm):
- Riwayat Mutasi
- Riwayat Jabatan
- Riwayat Kenaikan Pangkat
- Riwayat Uji Kompetensi
- Riwayat Diklat

Reorganize form field order to match the requested structure:
Jabatan (position_name) → Kelas Jabatan (grade via position_references) → Kriteria ASN → NIP → Pangkat/Golongan → Pendidikan Terakhir → Jenis Kelamin → Keterangan fields

### 5. Update Employee Form Submit Handler
Save/update all 5 new history types on form submit (same pattern as education_history: delete + re-insert).

### 6. Update Import Template & Parser
Update the Excel template columns to match the new structure:
`No, Jabatan Sesuai Kepmen 202 Tahun 2024, Kelas Jabatan, Jumlah ABK, Jumlah Existing, Nama Pemangku, Kriteria ASN, NIP, Pangkat Golongan, Pendidikan Terakhir, Jenis Kelamin, Keterangan Formasi, Keterangan Penempatan, Keterangan Penugasan Tambahan, Keterangan Perubahan`

Update the parser to map these columns to the employees table fields and also populate `keterangan_formasi`, `keterangan_penempatan`, `keterangan_penugasan`, `keterangan_perubahan`.

### 7. Update Peta Jabatan
Add the additional columns to the Peta Jabatan table display:
- Pendidikan Terakhir (fetched from education_history)
- Keterangan Penempatan
- Keterangan Penugasan Tambahan  
- Keterangan Perubahan

Update the export to include these columns. Update the employee query in PetaJabatan to also fetch `keterangan_formasi`, `keterangan_penempatan`, `keterangan_penugasan`, `keterangan_perubahan`.

### Technical Details

**Database migration SQL** will create 5 tables with proper foreign keys to employees, RLS policies using `has_role()` and `get_user_department()`, and `updated_at` triggers.

**New component**: `EmployeeHistoryForm.tsx` — a generic repeatable-entry form component used for all 5 history types (configurable fields per type).

**Files to modify**:
- `src/components/employees/EmployeeFormModal.tsx` — add keterangan fields + 5 history sections
- `src/pages/Employees.tsx` — fetch/save all history types on edit/submit
- `src/pages/Import.tsx` — new template structure, updated parser, map new columns
- `src/pages/PetaJabatan.tsx` — add columns, fetch additional employee data + education

