# Update: Export Excel Data Pegawai

## Tanggal
20 Mei 2026

## Perubahan yang Dilakukan

### 1. Gabungkan Gelar Depan, Nama, dan Gelar Belakang
**Sebelum**:
```
| Gelar Depan | Nama          | Gelar Belakang |
|-------------|---------------|----------------|
| Dr.         | Ahmad Suryadi | S.E., M.M.     |
```

**Sesudah**:
```
| Nama Lengkap              |
|---------------------------|
| Dr. Ahmad Suryadi S.E., M.M. |
```

**Implementasi**:
```typescript
const fullName = [
  emp.front_title,
  emp.name,
  emp.back_title
].filter(Boolean).join(' ');
```

### 2. Tambah Kolom Sesuai Form Edit Pegawai ASN

#### Kolom Baru yang Ditambahkan:
1. **Tempat Lahir** - `birth_place`
2. **Tanggal Lahir** - `birth_date`
3. **Jenis Kelamin** - `gender`
4. **Agama** - `religion`
5. **Kejuruan** - `kejuruan` (untuk Instruktur)
6. **Satuan Kerja Penugasan** - `satuan_kerja_penugasan`
7. **TMT CPNS** - `tmt_cpns`
8. **TMT PNS** - `tmt_pns`
9. **TMT Pensiun** - `tmt_pensiun`
10. **Nomor HP** - `mobile_phone`
11. **Nomor Telepon** - `phone`
12. **Alamat** - `address`

#### Urutan Kolom Lengkap (25 kolom):
```
1.  No
2.  NIP/NIK
3.  Nama Lengkap (Gelar Depan + Nama + Gelar Belakang)
4.  Tempat Lahir
5.  Tanggal Lahir
6.  Jenis Kelamin
7.  Agama
8.  Status ASN
9.  Golongan/Pangkat
10. Jenis Jabatan
11. Nama Jabatan
12. Jabatan Tambahan / PLT
13. Kejuruan
14. Unit Kerja
15. Satuan Kerja Penugasan
16. TMT CPNS
17. TMT PNS
18. TMT Pensiun
19. Nomor HP
20. Nomor Telepon
21. Alamat
22. Ket. Formasi
23. Ket. Penempatan
24. Ket. Penugasan
25. Ket. Perubahan
```

### 3. Penyesuaian Lebar Kolom
Lebar kolom disesuaikan dengan jenis data:
- **Nama Lengkap**: 35 (lebih lebar karena gabungan gelar + nama)
- **Alamat**: 40 (paling lebar untuk teks panjang)
- **Tanggal**: 14 (format YYYY-MM-DD)
- **Nomor Telepon/HP**: 16
- **Keterangan**: 25

## Perbandingan

### Sebelum (16 kolom)
```
No | NIP | Gelar Depan | Nama | Gelar Belakang | Jenis Jabatan | 
Nama Jabatan | Jabatan Tambahan | Status ASN | Golongan | 
Unit Kerja | Tanggal Masuk | Ket. Formasi | Ket. Penempatan | 
Ket. Penugasan | Ket. Perubahan
```

### Sesudah (25 kolom)
```
No | NIP/NIK | Nama Lengkap | Tempat Lahir | Tanggal Lahir | 
Jenis Kelamin | Agama | Status ASN | Golongan/Pangkat | 
Jenis Jabatan | Nama Jabatan | Jabatan Tambahan | Kejuruan | 
Unit Kerja | Satuan Kerja Penugasan | TMT CPNS | TMT PNS | 
TMT Pensiun | Nomor HP | Nomor Telepon | Alamat | 
Ket. Formasi | Ket. Penempatan | Ket. Penugasan | Ket. Perubahan
```

## Manfaat

### 1. Data Lebih Lengkap
✅ Export sekarang mencakup **semua field** yang ada di form edit pegawai ASN  
✅ Tidak ada data yang hilang saat export  
✅ Cocok untuk backup data lengkap atau analisis mendalam  

### 2. Format Nama Lebih Rapi
✅ Nama dengan gelar tampil dalam 1 kolom  
✅ Lebih mudah dibaca dan di-copy  
✅ Hemat kolom di Excel  

### 3. Data Pribadi Lengkap
✅ Tempat & tanggal lahir untuk keperluan administrasi  
✅ Jenis kelamin & agama untuk statistik  
✅ Kontak (HP & telepon) untuk komunikasi  
✅ Alamat untuk keperluan surat menyurat  

### 4. Data Kepegawaian Lengkap
✅ TMT CPNS, PNS, dan Pensiun untuk perhitungan masa kerja  
✅ Kejuruan untuk Instruktur  
✅ Satuan Kerja Penugasan untuk pegawai yang ditugaskan ke Satpel/Workshop  

## Testing

### Test Case 1: Export Pegawai ASN
1. Buka halaman **Data Pegawai**
2. Pilih tab **PNS**, **CPNS**, atau **PPPK**
3. Klik tombol **Export Excel**
4. Buka file Excel yang di-download
5. **Expected**: 
   - Kolom "Nama Lengkap" berisi gelar + nama (contoh: "Dr. Ahmad Suryadi S.E., M.M.")
   - Ada 25 kolom total
   - Semua data terisi sesuai dengan data di form edit

### Test Case 2: Export Pegawai Non-ASN
1. Pilih tab **Non ASN**
2. Klik **Export Excel**
3. **Expected**:
   - Kolom ke-2 adalah "NIK" (bukan "NIP")
   - Data Non-ASN ter-export dengan lengkap

### Test Case 3: Verifikasi Data Lengkap
1. Export data pegawai
2. Pilih 1 pegawai di Excel
3. Buka form edit pegawai yang sama di aplikasi
4. **Expected**: Semua data di Excel sama dengan data di form edit

### Test Case 4: Nama dengan Gelar
Verifikasi berbagai kombinasi nama:
- **Dengan gelar depan & belakang**: "Dr. Ahmad Suryadi S.E., M.M."
- **Hanya gelar depan**: "Dr. Ahmad Suryadi"
- **Hanya gelar belakang**: "Ahmad Suryadi S.E., M.M."
- **Tanpa gelar**: "Ahmad Suryadi"

## Files Changed
- ✅ `src/pages/Employees.tsx` - Update fungsi `handleExport()`

## Backward Compatibility
⚠️ **Breaking Change**: Format export berubah dari 16 kolom menjadi 25 kolom

**Impact**:
- Template import Excel lama mungkin tidak kompatibel
- Script/tool yang bergantung pada urutan kolom perlu disesuaikan
- Laporan yang menggunakan export Excel perlu update

**Mitigation**:
- Dokumentasikan format baru
- Buat template import baru jika diperlukan
- Informasikan user tentang perubahan format

## Status
✅ **COMPLETED** - Ready for testing

## Next Steps (Optional)
1. Buat template import Excel yang sesuai dengan format export baru
2. Tambahkan opsi "Export Format" (Simple vs Complete) jika user butuh format lama
3. Tambahkan sheet "Riwayat Pendidikan" dan "Riwayat Jabatan" untuk export yang lebih lengkap
