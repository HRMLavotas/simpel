# Populate History Data from Current Employee State

## Overview
Migration ini membuat initial history records berdasarkan data pegawai yang sudah ada di database. Ini memastikan setiap pegawai memiliki riwayat awal yang sesuai dengan kondisi mereka saat ini.

## What Was Populated

### 1. Riwayat Mutasi (mutation_history)
- **Source:** Unit kerja saat ini (`employees.department`)
- **Logic:** Membuat record mutasi dengan `ke_unit` = unit kerja saat ini
- **Tanggal:** Menggunakan `join_date` atau `created_at` sebagai tanggal mutasi
- **Keterangan:** "Data awal - Unit kerja saat ini"
- **Condition:** Hanya untuk pegawai yang belum punya riwayat mutasi

**Example:**
```
Employee: Ahmad Fauzi
Department: Setditjen Binalavotas
→ Creates mutation_history:
  - tanggal: 2020-01-15 (join_date)
  - ke_unit: Setditjen Binalavotas
  - keterangan: Data awal - Unit kerja saat ini
```

### 2. Riwayat Kenaikan Pangkat (rank_history)
- **Source:** Pangkat/Golongan saat ini (`employees.rank_group`)
- **Logic:** Membuat record kenaikan pangkat dengan `pangkat_baru` = pangkat saat ini
- **Tanggal:** Menggunakan `tmt_cpns`, `join_date`, atau `created_at`
- **TMT:** Same as tanggal
- **Keterangan:** "Data awal - Pangkat/Golongan saat ini"
- **Condition:** Hanya untuk pegawai yang punya pangkat dan belum punya riwayat pangkat
- **Excluded:** Pegawai dengan rank_group = "Tidak Ada"

**Example:**
```
Employee: Siti Nurhaliza
Rank Group: Penata (III/c)
→ Creates rank_history:
  - tanggal: 2014-03-01 (tmt_cpns)
  - pangkat_baru: Penata (III/c)
  - tmt: 2014-03-01
  - keterangan: Data awal - Pangkat/Golongan saat ini
```

### 3. Riwayat Jabatan (position_history)
- **Source:** Jabatan sesuai Kepmen saat ini (`employees.position_name`)
- **Logic:** Membuat record jabatan dengan `jabatan_baru` = jabatan saat ini
- **Tanggal:** Menggunakan `join_date` atau `created_at`
- **Keterangan:** "Data awal - Jabatan sesuai Kepmen 202/2024 saat ini"
- **Condition:** Hanya untuk pegawai yang punya jabatan dan belum punya riwayat jabatan

**Example:**
```
Employee: Dr. Budi Santoso
Position Name: Direktur
→ Creates position_history:
  - tanggal: 2018-06-01 (join_date)
  - jabatan_baru: Direktur
  - keterangan: Data awal - Jabatan sesuai Kepmen 202/2024 saat ini
```

### 4. Keterangan (Notes)
- **Already Migrated:** Data keterangan sudah di-migrate di migration sebelumnya
- **Source:** 
  - `employees.keterangan_penempatan` → `placement_notes`
  - `employees.keterangan_penugasan` → `assignment_notes`
  - `employees.keterangan_perubahan` → `change_notes`
- **Status:** ✅ Sudah di-load di form edit

## Migration Details

**File:** `supabase/migrations/20260331190000_populate_history_from_current_data.sql`

**Applied:** ✅ Successfully pushed to database

**Safety Features:**
- Uses `NOT EXISTS` to avoid duplicates
- Only creates records for employees without existing history
- Uses COALESCE for date fallbacks
- Includes verification queries

## Verification Queries

### Check Records Created
```sql
SELECT 
  'mutation_history' as table_name,
  COUNT(*) as records_created
FROM mutation_history
WHERE keterangan LIKE 'Data awal%'

UNION ALL

SELECT 
  'rank_history' as table_name,
  COUNT(*) as records_created
FROM rank_history
WHERE keterangan LIKE 'Data awal%'

UNION ALL

SELECT 
  'position_history' as table_name,
  COUNT(*) as records_created
FROM position_history
WHERE keterangan LIKE 'Data awal%';
```

### Sample Data Check
```sql
-- Check mutation history
SELECT 
  e.name,
  e.department,
  mh.tanggal,
  mh.ke_unit,
  mh.keterangan
FROM employees e
JOIN mutation_history mh ON e.id = mh.employee_id
WHERE mh.keterangan LIKE 'Data awal%'
LIMIT 10;

-- Check rank history
SELECT 
  e.name,
  e.rank_group,
  rh.tanggal,
  rh.pangkat_baru,
  rh.keterangan
FROM employees e
JOIN rank_history rh ON e.id = rh.employee_id
WHERE rh.keterangan LIKE 'Data awal%'
LIMIT 10;

-- Check position history
SELECT 
  e.name,
  e.position_name,
  ph.tanggal,
  ph.jabatan_baru,
  ph.keterangan
FROM employees e
JOIN position_history ph ON e.id = ph.employee_id
WHERE ph.keterangan LIKE 'Data awal%'
LIMIT 10;
```

## Expected Results

After running this migration, when you edit an employee:

1. **Riwayat Mutasi** section will show:
   - At least 1 entry with current unit kerja
   - Tanggal = join_date or created_at
   - Keterangan = "Data awal - Unit kerja saat ini"

2. **Riwayat Kenaikan Pangkat** section will show:
   - At least 1 entry with current pangkat/golongan
   - Tanggal = tmt_cpns or join_date
   - Keterangan = "Data awal - Pangkat/Golongan saat ini"

3. **Riwayat Jabatan** section will show:
   - At least 1 entry with current jabatan
   - Tanggal = join_date or created_at
   - Keterangan = "Data awal - Jabatan sesuai Kepmen 202/2024 saat ini"

4. **Keterangan Sections** will show:
   - Keterangan Penempatan (if exists in old data)
   - Keterangan Penugasan Tambahan (if exists in old data)
   - Keterangan Perubahan (if exists in old data)

## Testing Instructions

1. **Open Employee Edit Form:**
   - Go to Data Pegawai page
   - Click Edit on any employee

2. **Verify Riwayat Mutasi:**
   - Scroll to "Riwayat Mutasi" section
   - Should see at least 1 entry with current unit kerja
   - Check tanggal and keterangan

3. **Verify Riwayat Kenaikan Pangkat:**
   - Scroll to "Riwayat Kenaikan Pangkat" section
   - Should see at least 1 entry with current pangkat
   - Check tanggal, TMT, and keterangan

4. **Verify Riwayat Jabatan:**
   - Scroll to "Riwayat Jabatan" section
   - Should see at least 1 entry with current jabatan
   - Check tanggal and keterangan

5. **Verify Keterangan:**
   - Scroll to "Keterangan Penempatan" section
   - Should see notes if employee had keterangan_penempatan
   - Same for Penugasan Tambahan and Perubahan

## Notes

- **One-time Migration:** This migration only creates records for employees who don't already have history
- **Safe to Re-run:** Uses `NOT EXISTS` to prevent duplicates
- **Backward Compatible:** Old keterangan columns still exist in employees table
- **Future Records:** New history records can be added manually via form

## Status
✅ Migration created
✅ Migration applied successfully
✅ Data populated from current employee state
⏳ Ready for testing
