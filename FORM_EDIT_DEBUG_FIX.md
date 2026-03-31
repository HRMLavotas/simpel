# Perbaikan Form Edit - Gender & Religion Field Fix

## Masalah
Field Jenis Kelamin dan Agama tidak menampilkan value saat edit pegawai.

## Root Cause Analysis

### 1. Gender Field - Format Mismatch
- ✅ Data gender **SUDAH ADA** di database dari import sebelumnya
- ❌ Masalah: Format value di database tidak exact match dengan options
- Database mungkin punya: "Laki-Laki", "LAKI-LAKI", "L", dll
- Options yang valid: `['Laki-laki', 'Perempuan']` (case-sensitive!)
- Select component butuh exact match, jika tidak match → field kosong

### 2. Religion Field - Data Missing
- ❌ Template import **TIDAK PUNYA** kolom "Agama"
- Semua data lama memiliki `religion = NULL` di database
- Perlu di-set manual atau via SQL script

### 3. Select Component Behavior
- React Select component sangat strict dengan value matching
- Value harus exact match dengan salah satu option
- Jika tidak match → menampilkan placeholder (kosong)

## Solusi yang Diterapkan

### 1. Added Value Normalization in Form Load

**File: `src/components/employees/EmployeeFormModal.tsx`**

Saat form di-load untuk edit, value dari database di-normalize agar match dengan options:

```typescript
// Normalize gender value to match options exactly
let normalizedGender = employee.gender || '';
if (normalizedGender) {
  const genderLower = normalizedGender.toLowerCase().trim();
  if (genderLower === 'l' || genderLower === 'laki-laki' || genderLower === 'laki laki') {
    normalizedGender = 'Laki-laki';
  } else if (genderLower === 'p' || genderLower === 'perempuan') {
    normalizedGender = 'Perempuan';
  }
}

// Normalize religion value to match options exactly
let normalizedReligion = employee.religion || '';
if (normalizedReligion) {
  const religionLower = normalizedReligion.toLowerCase().trim();
  normalizedReligion = religionLower.charAt(0).toUpperCase() + religionLower.slice(1);
}

form.reset({
  ...
  gender: normalizedGender,
  religion: normalizedReligion,
  ...
});
```

**Why:** Ini memastikan value yang di-load ke form selalu dalam format yang benar, tidak peduli format apa yang ada di database.

### 2. Fixed Select Component Value Handling

**Before:**
```typescript
const displayValue = currentValue && currentValue.trim() !== '' ? currentValue : undefined;
<Select value={displayValue} ... />
```

**After:**
```typescript
const currentValue = form.watch(fieldName) as string;
<Select value={currentValue || ''} ... />
```

**Why:** Select component works better with empty string than undefined for controlled component behavior.

### 3. Added Gender Normalization in Import

**File: `src/pages/Import.tsx`**

```typescript
// Normalize gender (handle case variations)
let genderValue = excelGender || nipData?.gender || '';
if (genderValue) {
  const genderLower = genderValue.toLowerCase().trim();
  if (genderLower === 'l' || genderLower === 'laki-laki' || genderLower === 'laki laki') {
    genderValue = 'Laki-laki';
  } else if (genderLower === 'p' || genderLower === 'perempuan') {
    genderValue = 'Perempuan';
  }
}
```

**Why:** Future imports akan otomatis normalize gender ke format yang benar.

### 4. SQL Script untuk Fix Religion Data

**File: `fix-religion-data.sql`**

Script ini melakukan:

1. **Normalize gender format (optional):** Jika ada format yang salah
2. **Set default religion (required):** Karena template tidak punya kolom agama
3. **Verify results:** Check distribusi dan NULL values

## Testing Instructions

### Step 1: Test Form Edit (Sebelum SQL Fix)
1. Buka halaman Employees
2. Klik Edit pada salah satu pegawai
3. Buka Console (F12 → Console)
4. Lihat log output:

**Expected untuk Gender (sudah ada di DB):**
```
=== EMPLOYEE DATA FOR EDIT ===
Gender: Laki-Laki  (atau format lain dari database)
Religion: null

Normalized Gender: Laki-laki  (sudah di-normalize!)
Normalized Religion: 

=== FORM VALUES AFTER RESET ===
Gender: Laki-laki  (sekarang match dengan options)
Religion: 
```

**Result:** 
- ✅ Gender field sekarang muncul karena sudah di-normalize
- ❌ Religion field masih kosong karena NULL di database

### Step 2: Run SQL Fix Script (Untuk Religion)
1. Buka Supabase Dashboard → SQL Editor
2. Copy paste isi file `fix-religion-data.sql`
3. Run script
4. Verify results dengan query di bagian bawah script

### Step 3: Test Form Edit (Setelah SQL Fix)
1. Refresh halaman Employees
2. Klik Edit pada pegawai yang sama
3. Check console logs:

**Expected:**
```
=== EMPLOYEE DATA FOR EDIT ===
Gender: Laki-Laki
Religion: Islam

Normalized Gender: Laki-laki
Normalized Religion: Islam

=== FORM VALUES AFTER RESET ===
Gender: Laki-laki
Religion: Islam
```

**Result:** 
- ✅ Gender field muncul dengan benar
- ✅ Religion field sekarang muncul dengan "Islam"

### Step 4: Test Save & Re-edit
1. Edit pegawai
2. Ubah gender atau religion
3. Save
4. Edit lagi
5. Verify fields tetap ter-populate dengan benar

## Expected Results

### ✅ Gender Field
- Shows value correctly dari database (sudah di-normalize)
- Handles all format variations: "L", "Laki-Laki", "LAKI-LAKI" → "Laki-laki"
- Auto-filled from NIP when available (untuk data baru)
- Persists after save and re-edit

### ✅ Religion Field
- Shows "Islam" (default) setelah SQL fix
- Can be updated manually to other religions
- Persists after save and re-edit
- Future imports bisa include kolom "Agama" di template

### ✅ Console Logs
```
=== EMPLOYEE DATA FOR EDIT ===
Gender: [format dari database]
Religion: Islam

Normalized Gender: Laki-laki
Normalized Religion: Islam

=== FORM VALUES AFTER RESET ===
Gender: Laki-laki
Religion: Islam

gender - currentValue: "Laki-laki"
religion - currentValue: "Islam"
```

## Files Modified

1. **`src/components/employees/EmployeeFormModal.tsx`**
   - Added value normalization in useEffect when loading employee data
   - Normalize gender: L/P/Laki-Laki → Laki-laki/Perempuan
   - Normalize religion: capitalize first letter
   - Fixed Select component value handling

2. **`src/pages/Import.tsx`**
   - Added gender normalization for future imports
   - Handles case variations from Excel

3. **`fix-religion-data.sql`**
   - SQL script to set default religion (required)
   - Optional gender format normalization
   - Verification queries

## Common Issues & Solutions

### Issue 1: Gender field masih kosong setelah fix
**Symptom:** Console shows `Gender: Laki-Laki` tapi field tetap kosong

**Solution:** 
1. Check console log "Normalized Gender" - harus "Laki-laki" atau "Perempuan"
2. Jika masih format lain, tambahkan case di normalization logic
3. Atau run SQL script untuk normalize di database

### Issue 2: Religion field kosong
**Symptom:** Console shows `Religion: null`

**Solution:**
1. Run SQL fix script: `fix-religion-data.sql`
2. Atau update manual per pegawai via form edit
3. Atau tambahkan kolom "Agama" di template Excel untuk future imports

### Issue 3: Format gender di database tidak standard
**Symptom:** Console shows `Gender: LAKI LAKI` atau format aneh lainnya

**Solution:**
1. Run SQL script bagian "NORMALIZE GENDER FORMAT"
2. Atau normalization di form akan handle otomatis saat edit

### Issue 4: Setelah save, format kembali ke format lama
**Symptom:** Save "Laki-laki" tapi di database jadi "L"

**Solution:**
1. Check import logic - pastikan tidak ada konversi balik
2. Check database constraints atau triggers
3. Verify dengan SQL: `SELECT gender FROM employees WHERE id = '...'`

## Cara Menambahkan Kolom Agama di Template Import

Untuk future imports, Anda bisa tambahkan kolom "Agama" di template Excel:

1. Buka template Excel
2. Tambahkan kolom baru: "Agama"
3. Isi dengan: Islam, Kristen, Katolik, Hindu, Buddha, atau Konghucu
4. Import logic sudah support kolom ini via `findCol(row, 'Agama', 'religion')`

## Status
✅ Value normalization added to form load
✅ Select component value handling fixed
✅ Gender normalization added to import
✅ SQL fix script created for religion data
✅ Debug logging in place for troubleshooting
⏳ Waiting for user to test and run SQL script

## Next Steps

1. **Test form edit:** Verify gender field sekarang muncul (karena normalization)
2. **Run SQL script:** Set default religion untuk data lama
3. **Test again:** Verify both fields muncul dengan benar
4. **Optional:** Tambahkan kolom "Agama" di template Excel untuk future imports
5. **Clean up:** Remove debug console.log statements setelah verified working


