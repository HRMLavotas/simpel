# Auto-Populate History on Import

## Overview
Import function sekarang otomatis membuat history records dan notes saat import pegawai baru. Ini memastikan setiap pegawai yang di-import langsung memiliki riwayat awal.

## What Gets Auto-Created

### 1. Riwayat Mutasi (mutation_history)
**When:** Employee baru di-import dengan `department`
**Data:**
- `tanggal`: TMT CPNS atau tanggal import
- `ke_unit`: Unit kerja dari Excel
- `keterangan`: "Data import - Unit kerja saat ini"

**Example:**
```
Excel Row:
  Nama: Ahmad Fauzi
  Unit Kerja: Setditjen Binalavotas
  TMT CPNS: 2020-01-15

→ Creates mutation_history:
  tanggal: 2020-01-15
  ke_unit: Setditjen Binalavotas
  keterangan: Data import - Unit kerja saat ini
```

### 2. Riwayat Kenaikan Pangkat (rank_history)
**When:** Employee baru di-import dengan `rank_group` (bukan "Tidak Ada")
**Data:**
- `tanggal`: TMT CPNS atau tanggal import
- `pangkat_baru`: Pangkat/Golongan dari Excel
- `tmt`: Same as tanggal
- `keterangan`: "Data import - Pangkat/Golongan saat ini"

**Example:**
```
Excel Row:
  Nama: Siti Nurhaliza
  Pangkat Golongan: III/c
  TMT CPNS: 2014-03-01

→ Creates rank_history:
  tanggal: 2014-03-01
  pangkat_baru: Penata (III/c)
  tmt: 2014-03-01
  keterangan: Data import - Pangkat/Golongan saat ini
```

### 3. Riwayat Jabatan (position_history)
**When:** Employee baru di-import dengan `position_name`
**Data:**
- `tanggal`: TMT CPNS atau tanggal import
- `jabatan_baru`: Jabatan sesuai Kepmen dari Excel
- `keterangan`: "Data import - Jabatan sesuai Kepmen 202/2024 saat ini"

**Example:**
```
Excel Row:
  Nama: Dr. Budi Santoso
  Jabatan Sesuai Kepmen: Direktur
  TMT CPNS: 2018-06-01

→ Creates position_history:
  tanggal: 2018-06-01
  jabatan_baru: Direktur
  keterangan: Data import - Jabatan sesuai Kepmen 202/2024 saat ini
```

### 4. Keterangan Notes
**When:** Employee baru di-import dengan keterangan fields
**Data:**
- `keterangan_penempatan` → `placement_notes`
- `keterangan_penugasan` → `assignment_notes`
- `keterangan_perubahan` → `change_notes`

**Example:**
```
Excel Row:
  Keterangan Penempatan: Ditempatkan di Subbag Kepegawaian
  Keterangan Penugasan: Sertigas tgl 24 Oktober 2025
  Keterangan Perubahan: PPPK TMT 1 Mei 2025

→ Creates 3 notes:
  placement_notes: "Ditempatkan di Subbag Kepegawaian"
  assignment_notes: "Sertigas tgl 24 Oktober 2025"
  change_notes: "PPPK TMT 1 Mei 2025"
```

## Important Notes

### Only for New Employees
- Auto-creation **ONLY** happens for NEW employees (`!existing`)
- For existing employees (updates), history is NOT auto-created
- This prevents duplicate history records

### Date Priority
Tanggal untuk history records menggunakan prioritas:
1. `tmt_cpns` (jika ada)
2. `birth_date` (jika ada)
3. Current date (fallback)

### Conditional Creation
- History records only created if data exists
- Empty or null values are skipped
- "Tidak Ada" rank_group is skipped

## Code Changes

**File:** `src/pages/Import.tsx`

**Location:** After employee insert/update, before education parsing

**Logic:**
```typescript
if (employeeId && !existing) {
  // Only for new employees
  const importDate = row.tmt_cpns || row.birth_date || new Date().toISOString().split('T')[0];

  // Create mutation history
  if (row.department) {
    await supabase.from('mutation_history').insert({...});
  }

  // Create rank history
  if (row.rank_group && row.rank_group !== 'Tidak Ada') {
    await supabase.from('rank_history').insert({...});
  }

  // Create position history
  if (row.position_name) {
    await supabase.from('position_history').insert({...});
  }

  // Create notes
  if (row.keterangan_penempatan) {
    await supabase.from('placement_notes').insert({...});
  }
  // ... same for assignment and change notes
}
```

## Testing Instructions

### Test 1: Import New Employee
1. Prepare Excel with sample data:
   ```
   Nama: Test Employee
   Unit Kerja: Setditjen Binalavotas
   Pangkat Golongan: III/c
   Jabatan Sesuai Kepmen: Analis Kebijakan
   TMT CPNS: 2020-01-15
   Keterangan Penempatan: Test placement note
   ```

2. Import the file

3. Edit the employee

4. Verify sections have data:
   - Riwayat Mutasi: 1 entry
   - Riwayat Kenaikan Pangkat: 1 entry
   - Riwayat Jabatan: 1 entry
   - Keterangan Penempatan: 1 note

### Test 2: Update Existing Employee
1. Re-import same employee with different data

2. Edit the employee

3. Verify:
   - History records NOT duplicated
   - Only original history remains
   - Employee data updated

### Test 3: Import Without Optional Fields
1. Import employee without:
   - No keterangan fields
   - No TMT CPNS
   - Rank = "Tidak Ada"

2. Edit the employee

3. Verify:
   - Riwayat Mutasi: 1 entry (always created if department exists)
   - Riwayat Kenaikan Pangkat: 0 entries (skipped for "Tidak Ada")
   - Riwayat Jabatan: 1 entry (if position_name exists)
   - Keterangan: 0 notes (no keterangan fields)

## Benefits

1. **Automatic Data Population:** No manual entry needed for initial history
2. **Consistent Data:** Every employee has baseline history
3. **Time Saving:** Bulk import creates all related records
4. **Audit Trail:** Clear indication of import source ("Data import - ...")
5. **No Duplicates:** Only creates for new employees

## Backward Compatibility

- Old keterangan columns still exist in employees table
- Migration already populated history for existing employees
- New imports will have history from day one
- Manual edits can add more history records

## Status
✅ Import logic updated
✅ Auto-create history for new employees
✅ Auto-create notes from keterangan fields
✅ No diagnostics errors
⏳ Ready for testing
