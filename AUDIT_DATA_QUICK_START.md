# Quick Start: Fitur Audit Data

## Ringkasan
Fitur baru untuk mengidentifikasi dan memperbaiki data pegawai yang tidak lengkap atau format salah.

## Yang Sudah Dibuat

### 1. File Baru
- ✅ `src/pages/DataAudit.tsx` - Halaman utama audit data
- ✅ `src/hooks/useDataAudit.ts` - Hook untuk fetch dan validasi data
- ✅ `AUDIT_DATA_FEATURE.md` - Dokumentasi lengkap fitur

### 2. File yang Dimodifikasi
- ✅ `src/App.tsx` - Menambahkan route `/audit-data`
- ✅ `src/components/layout/AppSidebar.tsx` - Menambahkan menu "Audit Data"

## Cara Menggunakan

### Langkah 1: Akses Menu
1. Login sebagai Admin Unit atau Admin Pusat
2. Klik menu **Audit Data** di sidebar (icon clipboard dengan checklist)

### Langkah 2: Lihat Data Bermasalah
Dashboard akan menampilkan:
- Jumlah pegawai dengan data bermasalah
- Total masalah yang terdeteksi
- Tingkat kelengkapan data

### Langkah 3: Filter dan Cari
- Gunakan search box untuk mencari nama, NIP, atau unit kerja
- Gunakan dropdown filter untuk melihat jenis masalah tertentu

### Langkah 4: Perbaiki Data
1. Klik tombol **Perbaiki** pada pegawai yang bermasalah
2. Modal edit akan terbuka
3. Lengkapi atau perbaiki field yang bermasalah (ditandai dengan badge merah/orange)
4. Klik **Simpan**

## Jenis Masalah yang Terdeteksi

### 🔴 Data Kosong
- Jenis kelamin
- Tanggal lahir
- Tempat lahir
- Agama
- Pangkat/Golongan
- Jabatan
- Status ASN

### 🟠 Format Salah
- **NIP**: Harus 18 digit (contoh: `199001012020011001`)
- **Pangkat**: Harus format `IV/a`, `III/c`, dll (bukan `IV` atau `4`)

## Contoh Kasus

### Kasus 1: Format Pangkat Salah
**Masalah**: Pangkat tertulis "IV" atau "4"
**Solusi**: 
1. Klik tombol Perbaiki
2. Ubah pangkat menjadi format yang benar, misalnya "IV/a"
3. Simpan

### Kasus 2: Data Jenis Kelamin Kosong
**Masalah**: Field gender kosong
**Solusi**:
1. Klik tombol Perbaiki
2. Pilih "Laki-laki" atau "Perempuan"
3. Simpan

### Kasus 3: NIP Tidak Valid
**Masalah**: NIP kurang dari 18 digit atau ada spasi
**Solusi**:
1. Klik tombol Perbaiki
2. Perbaiki NIP menjadi 18 digit tanpa spasi
3. Simpan

## Perbedaan Akses

### Admin Unit
- Hanya melihat data pegawai di unit kerja sendiri
- Dapat memperbaiki data pegawai di unit sendiri

### Admin Pusat
- Melihat data pegawai dari semua unit kerja
- Dapat memperbaiki data pegawai dari semua unit
- Dapat menggunakan filter untuk fokus pada unit tertentu

## Tips Penggunaan

1. **Prioritas**: Perbaiki data dengan badge merah (data kosong) terlebih dahulu
2. **Batch**: Gunakan filter untuk memperbaiki masalah sejenis secara berurutan
3. **Format Pangkat**: Selalu gunakan angka romawi (I, II, III, IV) dan huruf kecil (a, b, c, d, e)
4. **Validasi**: Setelah memperbaiki, data akan otomatis hilang dari daftar jika sudah benar

## Integrasi

Fitur ini terintegrasi dengan:
- ✅ Data Pegawai (menggunakan modal edit yang sama)
- ✅ RLS Supabase (admin unit hanya lihat data unit sendiri)
- ✅ Monitoring Unit (perubahan data akan tercatat)

## Testing

Untuk test fitur ini:
1. Buat data pegawai dengan field kosong atau format salah
2. Akses menu Audit Data
3. Verifikasi data muncul di daftar
4. Perbaiki data
5. Verifikasi data hilang dari daftar setelah diperbaiki

## Troubleshooting

### Data tidak muncul
- Pastikan ada data pegawai dengan field kosong atau format salah
- Refresh halaman (F5)
- Cek console browser untuk error

### Modal edit tidak terbuka
- Cek console browser untuk error
- Pastikan EmployeeFormModal berfungsi normal di halaman Data Pegawai

### Data masih muncul setelah diperbaiki
- Refresh halaman (F5)
- Pastikan semua field yang bermasalah sudah diperbaiki dengan benar
- Cek format pangkat dan NIP sesuai aturan

## Next Steps (Opsional)

Fitur tambahan yang bisa dikembangkan:
- Export daftar audit ke Excel
- Notifikasi email untuk admin unit yang punya data bermasalah
- Dashboard statistik per unit kerja
- Bulk edit untuk memperbaiki banyak data sekaligus
- History audit (siapa yang memperbaiki data kapan)
