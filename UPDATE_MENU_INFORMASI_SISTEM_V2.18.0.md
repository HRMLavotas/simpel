# Update Menu Informasi Sistem - Versi 2.18.0

**Tanggal**: 6 Mei 2026  
**Status**: ✅ Selesai

## 📋 Ringkasan

Menu Informasi Sistem telah diperbarui dengan menambahkan **Versi 2.18.0** yang mencakup semua perbaikan dan peningkatan terbaru aplikasi SIMPEL.

---

## 🎯 Perubahan yang Ditambahkan

### **Versi 2.18.0 - 6 Mei 2026** (Label: Terbaru)

#### 🔧 Perbaikan (5 items)

1. **Data Pegawai & Peta Jabatan: Konsistensi Data**
   - Konsistensi data ditingkatkan dari 75% ke 95%+
   - Employees.tsx kini menggunakan normalizeString() di 4 lokasi
   - Real-time subscription untuk sinkronisasi otomatis

2. **Peta Jabatan: Urutan Hierarki Jabatan Berjenjang**
   - 364 posisi Analis dan Pranata di 56 unit diperbaiki
   - Urutan: Ahli Utama → Ahli Madya → Ahli Muda → Ahli Pertama → Penyelia → Mahir → Terampil → Pelaksana

3. **Peta Jabatan: Urutan Alfabetis dalam Level yang Sama**
   - 165 posisi dalam level hierarki yang sama kini terurut A-Z
   - Contoh: Analis Hukum sebelum Analis Keuangan dalam level Ahli Muda

4. **Peta Jabatan: Pengelompokan Jabatan Sejenis**
   - 795 posisi di 25 unit kini berkelompok rapi
   - Semua Arsiparis berurutan 1-6, lalu Analis Hukum 7-9, tanpa jabatan lain di tengah

5. **Peta Jabatan: Sorting Frontend**
   - Ditambahkan tiebreaker position_name di 3 query database dan export function
   - Logika: position_category → position_order → position_name

6. **Data Builder: Filter Pangkat/Golongan**
   - Format filter kini cocok dengan database
   - Contoh: "Pembina (IV/a)" bukan hanya "IV/a"
   - Termasuk semua golongan I-IV dan PPPK (III, V, VII, IX)

7. **Data Builder: Filter "(Tidak Ada)" untuk Non ASN**
   - Kini menampilkan 786 pegawai
   - 781 Non ASN dengan rank_group "Tenaga Alih Daya" + "Tidak Ada" + NULL
   - Plus 5 lainnya

#### ✨ Fitur Baru (1 item)

1. **Data Builder: Kolom "Nomor HP"**
   - Kolom mobile_phone tersedia untuk dipilih, difilter, dan diexport
   - Kategori: Data Pribadi (identity)

#### ✅ Peningkatan (2 items)

1. **Peta Jabatan: Verifikasi Semua Jabatan Berjenjang**
   - 569 jabatan (Instruktur, Widyaiswara, Arsiparis, Analis, Pranata, dll)
   - Sudah terurut dengan benar (0 issues found)

2. **Data Pegawai: Urutan Tampil Konsisten**
   - Urutan kini konsisten dengan Peta Jabatan
   - Perubahan urutan di Peta Jabatan otomatis berlaku di Data Pegawai

---

## 📊 Statistik Update

- **Total Perubahan**: 10 items
  - 🔧 Perbaikan: 7 items
  - ✨ Fitur Baru: 1 item
  - ✅ Peningkatan: 2 items

- **Total Posisi Diperbaiki**: 1.324 posisi
  - Hierarki: 364 posisi
  - Alfabetis: 165 posisi
  - Pengelompokan: 795 posisi

- **Unit Kerja Terpengaruh**: 56 unit kerja

---

## 🔄 Perubahan pada File

### File yang Dimodifikasi

1. **src/pages/SystemInfo.tsx**
   - Menambahkan release baru versi 2.18.0
   - Memindahkan label "Terbaru" dari v2.17.0 ke v2.18.0
   - Total 10 change items ditambahkan

---

## ✅ Verifikasi

### Diagnostics Check
```bash
✓ src/pages/SystemInfo.tsx: No diagnostics found
```

### Struktur Release
- ✅ Version: 2.18.0
- ✅ Date: 6 Mei 2026
- ✅ Label: Terbaru
- ✅ Changes: 10 items (7 fix, 1 feature, 2 improvement)

---

## 📝 Catatan

1. **Versi Sebelumnya**: v2.17.0 kini tidak lagi memiliki label "Terbaru"
2. **Format Konsisten**: Semua change items mengikuti format yang sama dengan release sebelumnya
3. **Kategori Tepat**: 
   - Fix: untuk perbaikan bug/masalah
   - Feature: untuk fitur baru
   - Improvement: untuk peningkatan fitur yang sudah ada

---

## 🎯 Dampak untuk User

### Admin Pusat
- Dapat melihat riwayat lengkap semua perbaikan terbaru
- Memahami peningkatan konsistensi data 75% → 95%+
- Mengetahui perbaikan urutan jabatan di 56 unit kerja

### Admin Unit
- Dapat melihat perbaikan yang mempengaruhi unit mereka
- Memahami peningkatan kualitas data pegawai
- Mengetahui fitur baru kolom Nomor HP di Data Builder

### Admin Pimpinan
- Dapat melihat peningkatan kualitas data secara keseluruhan
- Memahami perbaikan konsistensi antara menu Data Pegawai dan Peta Jabatan

---

## 🚀 Cara Mengakses

1. Login ke aplikasi SIMPEL
2. Klik menu **"Informasi Sistem"** di sidebar
3. Tab **"Riwayat Pembaruan"** akan menampilkan versi 2.18.0 di paling atas
4. Klik pada card versi untuk melihat detail perubahan

---

## 📚 Dokumentasi Terkait

- `KONSISTENSI_DATA_PEGAWAI_PETA_JABATAN.md` - Fix konsistensi data
- `FIX_HIERARCHICAL_POSITIONS_SUMMARY.md` - Fix urutan hierarki
- `FIX_POSITION_ORDER_ALPHABETICAL_SUMMARY.md` - Fix urutan alfabetis
- `FIX_POSITION_GROUPING_ALL_UNITS.md` - Fix pengelompokan jabatan
- `FIX_PETA_JABATAN_SORTING_CONSISTENCY.md` - Fix sorting frontend
- `FIX_DATA_BUILDER_RANK_GROUP_FILTER.md` - Fix filter pangkat/golongan
- `FIX_DATA_BUILDER_NON_ASN_FILTER_FINAL.md` - Fix filter Non ASN

---

**Status**: ✅ Update berhasil diterapkan  
**Versi Aplikasi**: 2.18.0  
**Tanggal Update**: 6 Mei 2026
