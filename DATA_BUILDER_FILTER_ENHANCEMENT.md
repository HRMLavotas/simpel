# Peningkatan Data Builder - Comprehensive Edition

## Tanggal: 2 April 2026

## Overview

Data Builder sekarang mendukung export data relasi lengkap (riwayat pendidikan, mutasi, jabatan, pangkat, pelatihan, uji kompetensi, dan keterangan) dalam format Excel multi-sheet yang terstruktur.

## Fitur Utama

### 1. Multi-Select Filter dengan Quick Access

**Quick Filters yang Tersedia:**
- Status ASN (PNS, PPPK, Non-ASN)
- Jenis Jabatan (Struktural, Fungsional, Pelaksana)
- Pangkat/Golongan (I/a sampai IV/e)
- Jenis Kelamin
- Agama (6 agama)

**Operator Filter:**
1. **Sama dengan** (`eq`): Nilai harus sama persis
2. **Mengandung** (`ilike`): Nilai mengandung teks (case-insensitive)
3. **Hanya Mengandung** (`exact_word`): Kata utuh (word boundary)
4. **Salah satu dari** (`in`): Multi-select dengan checkbox

### 2. Data Relasi Lengkap (NEW!)

User dapat memilih data relasi mana yang ingin di-export. Setiap tabel relasi akan menjadi sheet terpisah dalam Excel dengan detail lengkap:

#### A. Riwayat Pendidikan
- Jenjang pendidikan
- Nama institusi
- Jurusan/program studi
- Tahun lulus
- Gelar depan & belakang

#### B. Riwayat Mutasi
- Tanggal mutasi
- Dari unit → Ke unit
- Jabatan saat mutasi
- Nomor SK
- Keterangan

#### C. Riwayat Jabatan
- Tanggal perubahan
- Jabatan lama → Jabatan baru
- Unit kerja
- Nomor SK
- Keterangan

#### D. Riwayat Pangkat
- Tanggal kenaikan
- Pangkat lama → Pangkat baru
- Nomor SK
- TMT (Terhitung Mulai Tanggal)
- Keterangan

#### E. Riwayat Diklat/Pelatihan
- Tanggal mulai & selesai
- Nama diklat/pelatihan
- Penyelenggara
- Nomor sertifikat
- Keterangan

#### F. Riwayat Uji Kompetensi
- Tanggal uji
- Jenis uji kompetensi
- Hasil uji
- Keterangan

#### G. Keterangan Penempatan
- Catatan penempatan
- Tanggal dibuat

#### H. Keterangan Penugasan
- Catatan penugasan tambahan
- Tanggal dibuat

#### I. Keterangan Perubahan
- Catatan perubahan data
- Tanggal dibuat

### 3. Struktur Export Excel

**Format Multi-Sheet:**

1. **Sheet "Data Pegawai"**: Data utama pegawai sesuai kolom yang dipilih
2. **Sheet "Riwayat Pendidikan"**: Satu baris per riwayat pendidikan
   - Kolom: No, NIP, Nama, Unit Kerja, + semua field pendidikan
3. **Sheet "Riwayat Mutasi"**: Satu baris per mutasi
   - Kolom: No, NIP, Nama, Unit Kerja, + semua field mutasi
4. **Sheet "Riwayat Jabatan"**: Satu baris per perubahan jabatan
5. **Sheet "Riwayat Pangkat"**: Satu baris per kenaikan pangkat
6. **Sheet "Riwayat Diklat/Pelatihan"**: Satu baris per pelatihan
7. **Sheet "Riwayat Uji Kompetensi"**: Satu baris per uji
8. **Sheet "Keterangan Penempatan"**: Satu baris per catatan
9. **Sheet "Keterangan Penugasan"**: Satu baris per catatan
10. **Sheet "Keterangan Perubahan"**: Satu baris per catatan
11. **Sheet "Ringkasan"**: Statistik export (jumlah pegawai, kolom, filter, dll)
12. **Sheet "Stat [Kategori]"**: Statistik per kategori (Unit Kerja, Status ASN, dll)

**Keuntungan Format Ini:**
- Mudah di-pivot dan analisis di Excel
- Setiap pegawai bisa punya multiple rows untuk riwayat
- Relasi tetap terjaga dengan NIP sebagai key
- Bisa di-import ke database lain dengan mudah

## Use Cases

### Use Case 1: Export Pegawai dengan Riwayat Pendidikan
1. Pilih kolom: NIP, Nama, Unit Kerja, Status ASN
2. Centang "Riwayat Pendidikan" di bagian Data Relasi
3. Klik "Tampilkan Data" → "Export Excel"
4. Hasil: 2 sheet (Data Pegawai + Riwayat Pendidikan)

### Use Case 2: Analisis Mutasi Pegawai PNS
1. Quick Filter: Status ASN → Pilih "PNS"
2. Pilih kolom: NIP, Nama, Department
3. Centang "Riwayat Mutasi"
4. Export → Analisis pola mutasi di Excel

### Use Case 3: Laporan Lengkap Pegawai Struktural
1. Quick Filter: Jenis Jabatan → "Struktural"
2. Pilih semua kolom yang relevan
3. Centang semua data relasi (9 tabel)
4. Export → Laporan komprehensif dengan 12+ sheets

### Use Case 4: Tracking Kenaikan Pangkat
1. Quick Filter: Pangkat/Golongan → Pilih III/a, III/b, III/c
2. Centang "Riwayat Pangkat"
3. Export → Analisis pola kenaikan pangkat

## Implementasi Teknis

### Components

**1. RelatedDataSelector.tsx** (NEW)
- UI untuk memilih tabel relasi
- Checkbox per tabel dengan deskripsi
- Badge menunjukkan jumlah kolom per tabel
- Info note tentang format export

**2. FilterBuilder.tsx** (ENHANCED)
- Tambah quick filter: Pangkat/Golongan, Agama
- Predefined options untuk rank_group (I/a sampai IV/e)
- Multi-select dengan checkbox grid

**3. DataBuilder.tsx** (ENHANCED)
- State baru: `selectedRelatedTables`
- Fungsi `exportToExcel()` di-refactor untuk fetch & export data relasi
- Parallel fetching untuk performa optimal
- Employee lookup map untuk join data

### Data Flow

```
1. User pilih kolom + filter + data relasi
2. Klik "Tampilkan Data" → Fetch employees (filtered)
3. Klik "Export Excel":
   a. Fetch employee data
   b. Untuk setiap tabel relasi yang dipilih:
      - Fetch data dengan .in('employee_id', employeeIds)
      - Join dengan data employee (NIP, Nama, Unit Kerja)
      - Create sheet dengan format terstruktur
   c. Create summary & statistics sheets
   d. Generate Excel file
```

### Performance Optimization

- Parallel fetching untuk multiple tabel relasi
- Employee lookup map (O(1) access)
- Batch processing untuk large datasets
- Efficient memory usage dengan streaming

## Files Modified/Created

### Created
1. `src/components/data-builder/RelatedDataSelector.tsx`
   - Komponen selector untuk data relasi
   - 9 tabel relasi dengan konfigurasi lengkap

### Modified
1. `src/components/data-builder/FilterBuilder.tsx`
   - Tambah quick filter Pangkat/Golongan & Agama
   - Tambah predefined options untuk rank_group

2. `src/pages/DataBuilder.tsx`
   - Import RelatedDataSelector
   - State untuk selectedRelatedTables
   - Refactor exportToExcel() untuk handle data relasi
   - UI card baru untuk Related Data Selection

3. `DATA_BUILDER_FILTER_ENHANCEMENT.md`
   - Update dokumentasi dengan fitur baru

## Testing Checklist

- [x] Quick filter Pangkat/Golongan berfungsi
- [x] Quick filter Agama berfungsi
- [x] RelatedDataSelector UI responsive
- [x] Select/deselect data relasi
- [x] Export dengan 0 data relasi (backward compatible)
- [x] Export dengan 1 data relasi
- [x] Export dengan semua data relasi (9 tabel)
- [x] Format Excel multi-sheet benar
- [x] Join data employee dengan relasi benar (NIP, Nama, Unit Kerja)
- [x] Tanggal di-format dengan benar (dd/mm/yyyy)
- [x] Sheet names tidak exceed 31 karakter
- [x] Performance dengan 1000+ pegawai
- [x] Error handling untuk tabel kosong

## Benefits

1. **Comprehensive Data Export**: Semua data pegawai + riwayat dalam satu file
2. **Flexible Analysis**: User pilih data apa yang mereka butuhkan
3. **Structured Format**: Mudah untuk pivot, filter, dan analisis di Excel
4. **Relational Integrity**: NIP sebagai key untuk join data
5. **User-Friendly**: UI intuitif dengan deskripsi jelas
6. **Performance**: Parallel fetching untuk speed optimal
7. **Scalable**: Mudah menambah tabel relasi baru di masa depan

## Future Enhancements

- Filter berdasarkan keberadaan data relasi (contoh: "Pegawai yang punya riwayat mutasi")
- Export format lain (CSV, PDF)
- Scheduled export (otomatis setiap bulan)
- Template export yang bisa disimpan
- Visualisasi timeline riwayat pegawai
- Comparison view (bandingkan 2 pegawai)

