# Implementasi Form dan Import Non-ASN

## Ringkasan Perubahan

Telah dibuat sistem terpisah untuk mengelola data Non-ASN (Tenaga Alih Daya dan Tenaga Ahli) yang berbeda dari sistem ASN yang sudah ada.

## File Baru yang Dibuat

### 1. `src/components/employees/NonAsnFormModal.tsx`
Form modal khusus untuk menambah dan mengedit data Non-ASN dengan field:
- NIK (wajib)
- Nama (wajib)
- Jabatan (wajib) - contoh: Pengemudi, Petugas Kebersihan, Pramubakti, Petugas Keamanan
- Pendidikan - dropdown dengan pilihan: SD, SMP, SMA, D1-D4, S1-S3
- Tempat Lahir
- Tanggal Lahir
- Jenis Kelamin
- Agama
- Unit Kerja (wajib)
- Type Non ASN (wajib) - pilihan: Tenaga Alih Daya / Tenaga Ahli
- Deskripsi Tugas
- Catatan - untuk informasi tambahan seperti pindahan unit, dll

### 2. `src/pages/ImportNonAsn.tsx`
Halaman import khusus untuk data Non-ASN dengan fitur:
- Download template Excel sesuai format yang Anda berikan
- Upload dan preview data (10 baris pertama)
- Validasi data sebelum import
- Progress bar saat import
- Error log detail untuk data yang gagal
- Parsing otomatis untuk:
  - Tanggal lahir dari format DD/MM/YYYY atau DD-MM-YYYY
  - Mapping unit kerja
  - Default value untuk Type Non ASN

## File yang Dimodifikasi

### 1. `src/pages/Employees.tsx`
**Perubahan:**
- Import `NonAsnFormModal` component
- Tambah state `nonAsnModalOpen` untuk kontrol modal Non-ASN
- Update tombol "Tambah Pegawai" menjadi dropdown menu dengan 2 pilihan:
  - Tambah Data ASN (form yang sudah ada)
  - Tambah Data Non-ASN (form baru)
- Update fungsi `handleEditEmployee` untuk membuka modal yang sesuai berdasarkan `asn_status`
- Render `NonAsnFormModal` component

### 2. `src/App.tsx`
**Perubahan:**
- Import `ImportNonAsn` page
- Tambah route `/import-non-asn`

### 3. `src/components/layout/AppSidebar.tsx`
**Perubahan:**
- Update label "Import Data" menjadi "Import Data ASN"
- Tambah menu baru "Import Non-ASN" dengan route `/import-non-asn`

## Struktur Data Non-ASN

Data Non-ASN disimpan di tabel `employees` yang sama dengan ASN, dengan field khusus:
- `asn_status`: 'Non ASN'
- `nik`: NIK (bukan NIP)
- `type_non_asn`: 'Tenaga Alih Daya' atau 'Tenaga Ahli'
- `job_description`: Deskripsi tugas
- `notes`: Catatan tambahan
- `position`: Jabatan (Pengemudi, Petugas Kebersihan, dll)
- `education`: Pendidikan terakhir
- `birth_place`: Tempat lahir
- `birth_date`: Tanggal lahir
- `gender`: Jenis kelamin
- `religion`: Agama
- `department`: Unit kerja

## Format Template Excel Non-ASN

Template yang dihasilkan memiliki kolom:
1. No.
2. NIK (wajib)
3. Nama (wajib)
4. Jabatan (wajib)
5. Pendidikan
6. Tempat Tanggal Lahir
7. Jenis Kelamin
8. Agama
9. Unit Kerja (wajib)
10. Type Non ASN (wajib)
11. Deskripsi Tugas
12. Catatan

## Fitur Utama

### Form Non-ASN
- ✅ Validasi field wajib (NIK, Nama, Jabatan, Unit Kerja)
- ✅ Dropdown untuk field standar (Pendidikan, Jenis Kelamin, Agama, Type Non ASN)
- ✅ Auto-save ke database dengan status 'Non ASN'
- ✅ Support edit data Non-ASN yang sudah ada
- ✅ Integrasi dengan permission system (canEdit)

### Import Non-ASN
- ✅ Download template Excel dengan format yang sesuai
- ✅ Preview data sebelum import
- ✅ Validasi data (NIK, Nama, Jabatan wajib diisi)
- ✅ Progress indicator saat import
- ✅ Error handling dengan log detail
- ✅ Parsing tanggal otomatis
- ✅ Support untuk Admin Pusat (bisa pilih unit kerja) dan Admin Unit (fixed unit kerja)

### Integrasi dengan Sistem
- ✅ Dropdown menu di tombol "Tambah Pegawai"
- ✅ Auto-detect saat edit: buka form ASN atau Non-ASN sesuai data
- ✅ Menu navigasi terpisah untuk Import ASN dan Import Non-ASN
- ✅ Data Non-ASN muncul di halaman Data Pegawai dengan badge "Non ASN"

## Cara Penggunaan

### Menambah Data Non-ASN Manual
1. Buka halaman "Data Pegawai"
2. Klik tombol "Tambah Pegawai" (dengan dropdown)
3. Pilih "Tambah Data Non-ASN"
4. Isi form yang muncul
5. Klik "Tambah Non-ASN"

### Import Data Non-ASN dari Excel
1. Buka menu "Import Non-ASN" di sidebar
2. Klik "Download Template" untuk mendapatkan format Excel
3. Isi data Non-ASN sesuai template
4. Upload file Excel
5. Preview data yang akan diimport
6. Klik "Mulai Import"
7. Lihat hasil import dan error log (jika ada)

### Edit Data Non-ASN
1. Buka halaman "Data Pegawai"
2. Cari pegawai Non-ASN yang ingin diedit
3. Klik menu titik tiga (⋮) > "Edit"
4. Form Non-ASN akan terbuka otomatis
5. Edit data yang diperlukan
6. Klik "Simpan Perubahan"

## Catatan Penting

1. **Pemisahan Form**: Form ASN dan Non-ASN sepenuhnya terpisah karena field yang dibutuhkan berbeda
2. **Database**: Menggunakan tabel `employees` yang sama, dibedakan dengan field `asn_status`
3. **Permission**: Mengikuti sistem permission yang sudah ada (canEdit, isAdminPusat)
4. **Validasi**: Field wajib: NIK, Nama, Jabatan, Unit Kerja, Type Non ASN
5. **Template Excel**: Sesuai dengan format yang Anda berikan di dokumen

## Testing Checklist

- [ ] Test tambah data Non-ASN manual
- [ ] Test edit data Non-ASN
- [ ] Test download template Excel
- [ ] Test import data Non-ASN dari Excel
- [ ] Test validasi field wajib
- [ ] Test parsing tanggal lahir
- [ ] Test permission Admin Pusat vs Admin Unit
- [ ] Test tampilan data Non-ASN di halaman Data Pegawai
- [ ] Test filter berdasarkan status ASN
- [ ] Test export data termasuk Non-ASN

## Next Steps (Opsional)

1. Tambahkan filter khusus untuk Type Non ASN (Tenaga Alih Daya / Tenaga Ahli)
2. Buat laporan khusus untuk data Non-ASN
3. Tambahkan field tambahan jika diperlukan (masa kontrak, dll)
4. Implementasi bulk edit untuk data Non-ASN
