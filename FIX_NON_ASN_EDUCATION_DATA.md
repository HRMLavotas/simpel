# Perbaikan Data Pendidikan Non ASN

## Tanggal: 2 April 2026

## Masalah yang Ditemukan

1. **Data pendidikan Non ASN tidak muncul di dashboard**
   - Template import Non ASN memiliki kolom Pendidikan dan Jurusan
   - Data berhasil di-parse saat import
   - Namun data pendidikan tidak tersimpan ke tabel `education_history`
   - Dashboard hanya membaca dari tabel `education_history`, sehingga data pendidikan Non ASN tidak muncul

2. **Error syntax di useDashboardData.ts**
   - Identifier `getCacheKey` dideklarasikan dua kali
   - Fungsi cache (`getFromCache`, `setCache`) tidak digunakan

3. **Data pegawai tidak lengkap di dashboard**
   - Hanya 47 dari 823 pegawai yang memiliki data pendidikan
   - Ini karena data pendidikan hanya ada di `education_history` untuk pegawai ASN yang diimport dengan lengkap

## Solusi yang Diterapkan

### 1. Perbaikan Import Non ASN (`src/pages/ImportNonAsn.tsx`)

**Perubahan:**
- Menambahkan insert ke tabel `education_history` setelah insert employee berhasil
- Menggunakan `.select('id').single()` untuk mendapatkan ID employee yang baru dibuat
- Insert education data dengan struktur:
  ```typescript
  {
    employee_id: newEmployee.id,
    level: item.education,
    major: item.education_major || null,
    institution: null,
    graduation_year: null,
  }
  ```

**Kode sebelum:**
```typescript
const { error } = await supabase.from('employees').insert([{...}]);
if (error) throw error;
successCount++;
```

**Kode sesudah:**
```typescript
const { data: newEmployee, error: empError } = await supabase
  .from('employees')
  .insert([{...}])
  .select('id')
  .single();

if (empError) throw empError;

// Insert education data if available
if (newEmployee && item.education) {
  const { error: eduError } = await supabase
    .from('education_history')
    .insert([{
      employee_id: newEmployee.id,
      level: item.education,
      major: item.education_major || null,
      institution: null,
      graduation_year: null,
    }]);

  if (eduError) {
    console.error('Failed to insert education data:', eduError);
    // Don't fail the entire import if education insert fails
  }
}

successCount++;
```

### 2. Perbaikan Dashboard Hook (`src/hooks/useDashboardData.ts`)

**Perubahan:**
- Menghapus fungsi cache yang tidak digunakan (`getFromCache`, `setCache`)
- Menghilangkan duplikasi deklarasi `getCacheKey`

**Kode yang dihapus:**
```typescript
// Helper function to check cache
const getFromCache = useCallback((dataType: string) => {...}, [getCacheKey]);

// Helper function to set cache
const setCache = useCallback((dataType: string, data: any) => {...}, [getCacheKey, getDepartmentFilter]);
```

## Dampak Perubahan

### Positif:
1. ✅ Data pendidikan Non ASN sekarang tersimpan ke `education_history`
2. ✅ Dashboard akan menampilkan data pendidikan untuk semua pegawai (ASN dan Non ASN)
3. ✅ Error syntax di dashboard hook teratasi
4. ✅ Import Non ASN lebih konsisten dengan import ASN

### Catatan Penting:
- Data Non ASN yang sudah diimport sebelumnya **tidak memiliki data pendidikan** di `education_history`
- Untuk melengkapi data lama, ada 2 opsi:
  1. **Re-import**: Hapus data Non ASN lama dan import ulang dengan fungsi yang sudah diperbaiki
  2. **Migration Script**: Buat script untuk memigrasikan data pendidikan dari field lain (jika ada) ke `education_history`

## Testing yang Diperlukan

1. **Test Import Baru:**
   - Upload template Non ASN dengan data pendidikan
   - Verifikasi data masuk ke tabel `employees` dan `education_history`
   - Cek dashboard apakah data pendidikan muncul

2. **Test Dashboard:**
   - Buka dashboard dengan filter "Semua Unit Kerja"
   - Verifikasi chart "Distribusi Jenjang Pendidikan" menampilkan data lengkap
   - Test dengan filter ASN Status: All, ASN, Non ASN

3. **Test Edge Cases:**
   - Import Non ASN tanpa data pendidikan (kolom kosong)
   - Import Non ASN dengan pendidikan tapi tanpa jurusan
   - Import campuran (ada yang lengkap, ada yang tidak)

## Rekomendasi Selanjutnya

1. **Migrasi Data Lama:**
   - Buat script untuk mengecek pegawai Non ASN yang belum punya data di `education_history`
   - Jika ada field pendidikan di tempat lain, migrasikan ke `education_history`

2. **Validasi Template:**
   - Pertimbangkan membuat kolom Pendidikan dan Jurusan sebagai required di template
   - Atau minimal berikan warning jika kosong

3. **Monitoring:**
   - Tambahkan logging untuk track berapa pegawai yang berhasil/gagal insert education data
   - Monitor dashboard untuk memastikan semua data muncul dengan benar

## File yang Diubah

1. `src/pages/ImportNonAsn.tsx` - Menambahkan insert ke education_history
2. `src/hooks/useDashboardData.ts` - Menghapus fungsi cache yang tidak digunakan
