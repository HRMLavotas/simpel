# Export Peta Jabatan - Sheet SUMMARY dengan Data Agregasi Lengkap

## 📋 Overview

Sheet **SUMMARY** pada export peta jabatan semua unit kerja sekarang menampilkan data agregasi lengkap untuk setiap unit kerja, tidak hanya ringkasan jabatan saja. Data agregasi ini sama dengan yang ada di fitur **Agregasi Cepat**.

## ✨ Fitur yang Ditambahkan

### Data Agregasi Lengkap per Unit Kerja:

#### 1. **Data Jabatan** (sudah ada sebelumnya)
- Total Jabatan
- Total ABK
- Total Existing
- Gap (ABK-Existing)
- % Terisi
- Status (Kurang/Lebih/Sesuai)

#### 2. **Status ASN** (BARU)
- PNS
- CPNS
- PPPK
- Non ASN
- Total ASN (PNS + CPNS + PPPK)

#### 3. **Jenis Kelamin** (BARU)
- Laki-laki
- Perempuan

#### 4. **Pangkat/Golongan** (BARU)
- Gol I
- Gol II
- Gol III
- Gol IV
- Gol PPPK

#### 5. **Pendidikan** (BARU)
- SD
- SMP
- SMA/SMK
- D1, D2, D3, D4
- S1, S2, S3

#### 6. **Agama** (BARU)
- Islam
- Kristen
- Katolik
- Hindu
- Buddha
- Konghucu

#### 7. **Rentang Usia** (BARU)
- <25 tahun
- 25-34 tahun
- 35-44 tahun
- 45-54 tahun
- ≥55 tahun
- Rata-rata Usia

## 📊 Struktur Sheet SUMMARY

Sheet SUMMARY sekarang memiliki **47 kolom** yang mencakup:

| Kategori | Jumlah Kolom | Kolom |
|----------|--------------|-------|
| Identitas | 2 | No, Unit Kerja |
| Data Jabatan | 6 | Total Jabatan, Total ABK, Total Existing, Gap, % Terisi, Status |
| Status ASN | 5 | PNS, CPNS, PPPK, Non ASN, Total ASN |
| Jenis Kelamin | 2 | Laki-laki, Perempuan |
| Pangkat/Golongan | 5 | Gol I, Gol II, Gol III, Gol IV, Gol PPPK |
| Pendidikan | 10 | SD, SMP, SMA/SMK, D1, D2, D3, D4, S1, S2, S3 |
| Agama | 6 | Islam, Kristen, Katolik, Hindu, Buddha, Konghucu |
| Rentang Usia | 6 | <25 thn, 25-34 thn, 35-44 thn, 45-54 thn, ≥55 thn, Rata-rata Usia |

## 🎯 Cara Menggunakan

### 1. Export Peta Jabatan Semua Unit
```
1. Login sebagai Admin Pusat
2. Navigasi ke menu "Peta Jabatan"
3. Klik tab "Formasi ASN"
4. Klik tombol "Export Semua Unit"
5. File Excel akan diunduh dengan nama: Peta_Jabatan_ASN_Semua_Unit_YYYYMMDD.xlsx
```

### 2. Buka Sheet SUMMARY
```
1. Buka file Excel yang telah diunduh
2. Klik sheet "SUMMARY" (sheet pertama)
3. Lihat data agregasi lengkap untuk semua unit kerja
```

### 3. Analisis Data
```
Sheet SUMMARY dapat digunakan untuk:
- Membandingkan data antar unit kerja
- Melihat distribusi pegawai berdasarkan berbagai kategori
- Membuat pivot table atau chart di Excel
- Export ke format lain untuk presentasi
```

## 💡 Keunggulan

### ✅ Data Lengkap dalam Satu Sheet
- Tidak perlu membuka banyak sheet untuk melihat data agregasi
- Semua data unit kerja dalam satu tabel yang mudah dibandingkan

### ✅ Konsisten dengan Agregasi Cepat
- Menggunakan logika agregasi yang sama dengan fitur Agregasi Cepat
- Data dijamin konsisten dan akurat

### ✅ Siap untuk Analisis Lanjutan
- Format tabel memudahkan pembuatan pivot table
- Dapat langsung digunakan untuk membuat chart/grafik
- Mudah di-copy ke PowerPoint atau Word

### ✅ Hemat Waktu
- Tidak perlu export Agregasi Cepat secara terpisah
- Semua data dalam satu file Excel

## 📝 Contoh Penggunaan

### Skenario 1: Laporan Bulanan Pimpinan
```
1. Export Peta Jabatan Semua Unit
2. Buka sheet SUMMARY
3. Copy tabel ke PowerPoint
4. Tambahkan chart untuk visualisasi
5. Presentasikan ke pimpinan
```

### Skenario 2: Analisis Kebutuhan Rekrutmen
```
1. Export Peta Jabatan Semua Unit
2. Buka sheet SUMMARY
3. Lihat kolom "Gap (ABK-Existing)" untuk setiap unit
4. Lihat kolom "Status ASN" untuk mengetahui komposisi pegawai
5. Tentukan prioritas rekrutmen berdasarkan gap dan komposisi
```

### Skenario 3: Monitoring Distribusi Pendidikan
```
1. Export Peta Jabatan Semua Unit
2. Buka sheet SUMMARY
3. Lihat kolom pendidikan (SD, SMP, SMA/SMK, D1-D4, S1-S3)
4. Identifikasi unit yang perlu peningkatan kualifikasi pendidikan
5. Rencanakan program pengembangan SDM
```

### Skenario 4: Analisis Demografi Pegawai
```
1. Export Peta Jabatan Semua Unit
2. Buka sheet SUMMARY
3. Lihat kolom "Rentang Usia" dan "Rata-rata Usia"
4. Identifikasi unit dengan pegawai yang mendekati pensiun
5. Rencanakan regenerasi pegawai
```

## 🔧 Detail Teknis

### Perubahan Kode

**File:** `src/pages/PetaJabatan.tsx`

**Fungsi:** `handleExportAllDepartments()`

**Perubahan:**
1. Menambahkan field `religion`, `birth_date`, `tmt_cpns` pada query employees
2. Menambahkan helper functions untuk agregasi:
   - `normalizeAsnStatus()` - Normalisasi status ASN
   - `normalizeGender()` - Normalisasi jenis kelamin
   - `extractMainRank()` - Ekstrak golongan utama dari rank_group
   - `extractEducationLevel()` - Ekstrak jenjang pendidikan dari eduMap
   - `calculateAge()` - Hitung usia dari tanggal lahir
   - `categorizeAge()` - Kategorisasi usia ke rentang
3. Menambahkan perhitungan agregasi untuk setiap unit kerja:
   - Status ASN (PNS, CPNS, PPPK, Non ASN)
   - Jenis Kelamin (Laki-laki, Perempuan)
   - Pangkat/Golongan (I, II, III, IV, PPPK)
   - Pendidikan (SD, SMP, SMA/SMK, D1-D4, S1-S3)
   - Agama (Islam, Kristen, Katolik, Hindu, Buddha, Konghucu)
   - Rentang Usia (<25, 25-34, 35-44, 45-54, ≥55, Rata-rata)
4. Menambahkan kolom-kolom agregasi ke sheet SUMMARY
5. Menyesuaikan lebar kolom untuk semua kolom baru

### Logika Agregasi

**Status ASN:**
- PNS: status = 'PNS' (tidak termasuk CPNS)
- CPNS: status = 'CPNS'
- PPPK: status = 'PPPK'
- Non ASN: status = 'Non ASN' atau mengandung 'NON' atau 'ALIH DAYA'

**Jenis Kelamin:**
- Laki-laki: gender mengandung 'laki', 'l', 'm', 'male'
- Perempuan: gender mengandung 'perempuan', 'p', 'f', 'female', 'wanita'

**Pangkat/Golongan:**
- Gol I, II, III, IV: ekstrak dari rank_group (contoh: "III/a" → "III")
- Gol PPPK: rank_group = 'V', 'VII', 'IX', 'XI'

**Pendidikan:**
- Ekstrak dari eduMap (hasil RPC get_latest_education_per_employee)
- Normalisasi level pendidikan (S1, S2, S3, D1-D4, SMA/SMK, SMP, SD)

**Agama:**
- Deteksi dari field religion
- Case-insensitive matching

**Rentang Usia:**
- Hitung dari birth_date
- Kategorisasi: <25, 25-34, 35-44, 45-54, ≥55
- Rata-rata usia dihitung dari semua pegawai yang memiliki birth_date

## 🚀 Manfaat untuk Organisasi

### 1. **Pengambilan Keputusan Lebih Cepat**
- Data lengkap dalam satu sheet memudahkan analisis
- Tidak perlu mengumpulkan data dari berbagai sumber

### 2. **Transparansi Data**
- Semua unit kerja dapat dibandingkan secara objektif
- Data agregasi konsisten dengan sumber data

### 3. **Efisiensi Pelaporan**
- Satu file Excel untuk berbagai kebutuhan laporan
- Hemat waktu dalam pembuatan laporan bulanan/tahunan

### 4. **Perencanaan SDM Lebih Baik**
- Data demografi membantu perencanaan regenerasi
- Data pendidikan membantu perencanaan pengembangan SDM
- Data gap jabatan membantu perencanaan rekrutmen

## 📞 Support

Jika ada pertanyaan atau masalah terkait fitur ini:
- Baca dokumentasi ini dengan seksama
- Cek file `FITUR_AGREGASI_CEPAT.md` untuk memahami logika agregasi
- Hubungi admin sistem untuk bantuan teknis

---

**Status:** ✅ SELESAI DAN SIAP DIGUNAKAN

**Tanggal:** 8 Mei 2026

**Versi:** 1.0
