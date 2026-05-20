# Fix: Education Level Dropdown Mismatch

## Tanggal
20 Mei 2026

## Root Cause
Dropdown "Pendidikan Terakhir" kosong karena **value mismatch** antara:

### Database Values
```
SLTA/SMA Sederajat    (599 pegawai)
S1                    (65 pegawai)
SLTP/SMP Sederajat    (35 pegawai)
SD/Sederajat          (23 pegawai)
DIII                  (8 pegawai)
S2                    (3 pegawai)
D3                    (1 pegawai)
DIV                   (1 pegawai)
```

### Constants (Sebelum Fix)
```typescript
['SD', 'SMP', 'SMA/SMK', 'D1', 'D2', 'D3', 'D4', 'S1', 'S2', 'S3']
```

❌ **Tidak ada yang match!** Dropdown tidak bisa menampilkan nilai karena:
- Database: `"SLTA/SMA Sederajat"`
- Constants: `"SMA/SMK"`

## Solusi

### Update EDUCATION_LEVELS Constants
**File**: `src/lib/constants.ts`

```typescript
export const EDUCATION_LEVELS = [
  'SD/Sederajat',
  'SLTP/SMP Sederajat', 
  'SLTA/SMA Sederajat',
  'D1',
  'D2', 
  'D3',
  'DIII',
  'D4',
  'DIV',
  'S1',
  'S2',
  'S3'
] as const;
```

✅ Sekarang include semua format yang ada di database

### Tambah Debug Logging
**File**: `src/components/employees/NonAsnFormModal.tsx`

Menambahkan logging untuk memudahkan debugging:
```typescript
logger.debug('[NonAsnFormModal] Initial form data from editData:', {
  education_level: initialFormData.education_level,
  education_major: initialFormData.education_major,
});

logger.debug('[NonAsnFormModal] Updating education from history:', {
  level: latestEdu.level,
  major: latestEdu.major,
});
```

## Testing

### Test Case 1: Edit Pegawai dengan "SLTA/SMA Sederajat"
1. Buka Data Pegawai
2. Edit pegawai Non-ASN (contoh: Yayik Prandi Puspitasari)
3. **Expected**: Dropdown "Pendidikan Terakhir" menampilkan "SLTA/SMA Sederajat"
4. **Expected**: Field "Jurusan" terisi

### Test Case 2: Edit Pegawai dengan "S1"
1. Edit pegawai Non-ASN dengan pendidikan S1
2. **Expected**: Dropdown menampilkan "S1"

### Test Case 3: Cek Console Log
1. Buka DevTools Console
2. Edit pegawai Non-ASN
3. **Expected**: Melihat log:
   ```
   [NonAsnFormModal] Initial form data from editData: {education_level: "SLTA/SMA Sederajat", ...}
   [NonAsnFormModal] Updating education from history: {level: "SLTA/SMA Sederajat", ...}
   ```

## Files Changed
- ✅ `src/lib/constants.ts` - Update EDUCATION_LEVELS
- ✅ `src/components/employees/NonAsnFormModal.tsx` - Add debug logging

## Status
✅ **READY FOR TESTING**

Silakan refresh browser dan test edit pegawai Non-ASN!
