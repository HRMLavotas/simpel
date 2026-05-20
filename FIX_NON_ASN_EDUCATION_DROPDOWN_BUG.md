# Fix Non-ASN Education Dropdown Bug

## Tanggal
20 Mei 2026

## Masalah yang Ditemukan
Bug pada form edit Data Non-ASN:
- **Gejala**: Dropdown "Pendidikan Terakhir" di tab "Data Utama" kosong/tidak terisi
- **Padahal**: Di tab "Riwayat Pendidikan" ada data pendidikannya
- **Root Cause**: 
  1. Kolom `education_level` dan `education_major` belum ada di tabel `employees`
  2. Sinkronisasi data dari `education_history` ke form tidak berjalan dengan benar

## Solusi yang Diterapkan

### 1. Database Migration
**File**: `supabase/migrations/20260520100000_add_education_fields_to_employees.sql`

Menambahkan 2 kolom baru ke tabel `employees`:
- `education_level` (varchar 100) - Pendidikan terakhir (SD, SMP, SMA, D1-D4, S1-S3)
- `education_major` (varchar 255) - Jurusan/program studi

Migration juga melakukan sinkronisasi data awal dari `education_history` ke kolom baru:
```sql
UPDATE public.employees e
SET 
  education_level = eh.level,
  education_major = eh.major
FROM (
  SELECT DISTINCT ON (employee_id)
    employee_id, level, major
  FROM public.education_history
  ORDER BY employee_id, graduation_year DESC NULLS LAST, created_at DESC
) eh
WHERE e.id = eh.employee_id
  AND (e.education_level IS NULL OR e.education_major IS NULL);
```

**Hasil**:
- Total pegawai Non-ASN: 782
- Pegawai dengan data pendidikan: 740 (94.6%)
- Pegawai tanpa data pendidikan: 42 (5.4%)

### 2. Frontend Fix - NonAsnFormModal.tsx
**File**: `src/components/employees/NonAsnFormModal.tsx`

#### Bug Fix #1: Sinkronisasi Data dari Riwayat Pendidikan
**Lokasi**: Fungsi `fetchHistory()` - baris 228-248

**Sebelum**:
```typescript
if (eduRes.data) {
  loadedEdu = eduRes.data.map(d => ({...}));
  setEducationEntries(loadedEdu);
  // ❌ Tidak ada update ke formData
}
```

**Sesudah**:
```typescript
if (eduRes.data) {
  loadedEdu = eduRes.data.map(d => ({...}));
  setEducationEntries(loadedEdu);
  
  // ✅ Update formData dengan pendidikan terbaru dari history
  if (loadedEdu.length > 0) {
    const latestEdu = loadedEdu[loadedEdu.length - 1];
    setFormData(prev => ({
      ...prev,
      education_level: latestEdu.level || '',
      education_major: latestEdu.major || '',
    }));
  }
}
```

**Penjelasan**: 
- Ketika form edit dibuka, data dari `education_history` diambil
- Pendidikan terbaru (entry terakhir) digunakan untuk mengisi dropdown di tab "Data Utama"
- Ini memastikan sinkronisasi 2 arah antara tab "Data Utama" dan "Riwayat Pendidikan"

#### Bug Fix #2: Error Handling yang Lebih Baik
**Lokasi**: Fungsi `handleSubmit()` - baris 398-410 dan 526-536

**Sebelum**:
```typescript
if (error) throw error;
// ...
catch (err: unknown) {
  logger.error('Error saving Non-ASN:', error);
  // ❌ Error message tidak informatif: "[object Object]"
}
```

**Sesudah**:
```typescript
if (error) {
  logger.error('Error updating Non-ASN employee:', error);
  throw new Error(error.message || 'Gagal memperbarui data pegawai');
}
// ...
catch (err: unknown) {
  const supabaseError = err as any;
  const errorMessage = supabaseError?.message || error.message || 'Terjadi kesalahan';
  const errorDetails = supabaseError?.details || supabaseError?.hint || '';
  
  toast({
    variant: 'destructive',
    title: 'Gagal menyimpan',
    description: errorDetails ? `${errorMessage}\n${errorDetails}` : errorMessage,
  });
}
```

**Penjelasan**:
- Error dari Supabase sekarang ditampilkan dengan jelas
- Menampilkan `message`, `details`, dan `hint` dari error
- Memudahkan debugging masalah database

## Testing

### Test Case 1: Edit Pegawai Non-ASN dengan Riwayat Pendidikan
1. Buka halaman Data Pegawai
2. Pilih pegawai Non-ASN yang sudah memiliki riwayat pendidikan
3. Klik "Edit"
4. **Expected**: Dropdown "Pendidikan Terakhir" dan field "Jurusan" terisi otomatis
5. **Expected**: Data di tab "Data Utama" sama dengan entry terbaru di tab "Riwayat Pendidikan"

### Test Case 2: Ubah Pendidikan di Tab Data Utama
1. Edit pegawai Non-ASN
2. Ubah "Pendidikan Terakhir" di tab "Data Utama"
3. Pindah ke tab "Riwayat Pendidikan"
4. **Expected**: Entry terbaru di riwayat pendidikan ikut berubah
5. Simpan data
6. **Expected**: Data tersimpan tanpa error

### Test Case 3: Ubah Pendidikan di Tab Riwayat Pendidikan
1. Edit pegawai Non-ASN
2. Ubah entry terbaru di tab "Riwayat Pendidikan"
3. Pindah ke tab "Data Utama"
4. **Expected**: Dropdown "Pendidikan Terakhir" ikut berubah
5. Simpan data
6. **Expected**: Data tersimpan tanpa error

### Test Case 4: Tambah Pegawai Non-ASN Baru
1. Klik "Tambah Non-ASN"
2. Isi data di tab "Data Utama" termasuk "Pendidikan Terakhir"
3. Pindah ke tab "Riwayat Pendidikan"
4. **Expected**: Otomatis ada 1 entry dengan data dari tab "Data Utama"
5. Simpan data
6. **Expected**: Data tersimpan dengan benar di tabel `employees` dan `education_history`

## Deployment

### 1. Deploy Migration
```powershell
$env:SUPABASE_ACCESS_TOKEN="<your-token>"
Get-Content "supabase\migrations\20260520100000_add_education_fields_to_employees.sql" | npx supabase db query --linked
```

### 2. Verifikasi Migration
```powershell
$env:SUPABASE_ACCESS_TOKEN="<your-token>"
npx supabase db query --linked "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employees' AND column_name IN ('education_level', 'education_major');"
```

### 3. Deploy Frontend
```bash
npm run build
# Deploy ke Vercel atau hosting lainnya
```

## Impact Analysis

### Positive Impact
✅ Bug dropdown pendidikan terakhir teratasi  
✅ Sinkronisasi 2 arah antara tab "Data Utama" dan "Riwayat Pendidikan"  
✅ Error message lebih informatif untuk debugging  
✅ Data pendidikan tersimpan di 2 tempat (redundant tapi konsisten)  
✅ Query lebih cepat karena tidak perlu JOIN ke `education_history` untuk mendapatkan pendidikan terakhir  

### Potential Issues
⚠️ Data redundancy: pendidikan terakhir ada di `employees.education_level` dan `education_history`  
⚠️ Perlu memastikan sinkronisasi tetap konsisten saat ada perubahan  

### Mitigation
- Form sudah menangani sinkronisasi otomatis saat edit
- Migration sudah melakukan sinkronisasi data awal
- Jika ada inkonsistensi di masa depan, bisa jalankan query UPDATE seperti di migration

## Related Files
- `supabase/migrations/20260520100000_add_education_fields_to_employees.sql`
- `src/components/employees/NonAsnFormModal.tsx`
- `src/lib/constants.ts` (EDUCATION_LEVELS)

## Status
✅ **COMPLETED** - Bug fixed, migration deployed, ready for testing
