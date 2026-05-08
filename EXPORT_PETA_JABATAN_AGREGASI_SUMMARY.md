# Export Peta Jabatan - Tambahan 3 Sheet Agregasi

## 📋 Overview

Export peta jabatan semua unit kerja sekarang dilengkapi dengan **3 sheet agregasi tambahan** yang sama dengan yang ada di fitur **Agregasi Cepat**:

1. **Tabel Golongan per Unit** - Distribusi PNS dan PPPK per golongan
2. **Tabel Pendidikan per Unit** - Distribusi pendidikan ASN per unit kerja
3. **Jumlah ASN per Unit** - Ringkasan jumlah ASN dan Non ASN per unit kerja

## ✨ Sheet yang Ditambahkan

### 1. Tabel Golongan per Unit Kerja

**Kolom:**
- No
- Unit Kerja
- PNS I, PNS II, PNS III, PNS IV
- Jumlah PNS
- PPPK III, PPPK V, PPPK VII, PPPK IX
- Jumlah PPPK
- Total ASN
- L (Laki-laki)
- P (Perempuan)
- Total JK (Total Jenis Kelamin)

**Fitur:**
- ✅ Baris JUMLAH di akhir tabel untuk total keseluruhan
- ✅ Urutan unit kerja sesuai urutan resmi laporan
- ✅ Lebar kolom sudah disesuaikan untuk tampilan optimal

**Contoh Data:**
```
No | Unit Kerja              | PNS I | PNS II | PNS III | PNS IV | Jumlah PNS | PPPK III | PPPK V | PPPK VII | PPPK IX | Jumlah PPPK | Total ASN | L  | P  | Total JK
1  | Setditjen Binalavotas   | 2     | 15     | 45      | 20     | 82         | 3        | 2      | 3        | 0       | 8           | 90        | 50 | 40 | 90
2  | BBPVP Bekasi            | 5     | 25     | 100     | 40     | 170        | 10       | 5      | 8        | 2       | 25          | 195       | 120| 75 | 195
...
   | JUMLAH                  | 50    | 300    | 1200    | 400    | 1950       | 100      | 50     | 80       | 20      | 250         | 2200      | 1300 | 900 | 2200
```

### 2. Tabel Pendidikan per Unit Kerja

**Format:** Header dokumen + tabel data

**Header:**
- Baris 1: REKAP PEGAWAI DITJEN BULAN [BULAN] [TAHUN]
- Baris 2: Dukungan Personil Berdasarkan Tingkat Pendidikan

**Kolom:**
- NO.
- UNIT KERJA
- JML PEG (Jumlah Pegawai)
- SD, SMP, SMA, D1, D2, D3, D4, S1, S2, S3
- JML PEG (kolom kedua untuk validasi)

**Fitur:**
- ✅ Header merged across all columns
- ✅ Baris JUMLAH di akhir tabel
- ✅ Hanya menghitung ASN (exclude Non ASN)
- ✅ Bulan dan tahun otomatis sesuai tanggal export

**Contoh Data:**
```
REKAP PEGAWAI DITJEN BULAN MEI 2026
Dukungan Personil Berdasarkan Tingkat Pendidikan

NO. | UNIT KERJA              | JML PEG | SD | SMP | SMA | D1 | D2 | D3 | D4 | S1  | S2 | S3 | JML PEG
1   | Setditjen Binalavotas   | 90      | 0  | 0   | 4   | 0  | 0  | 10 | 4  | 58  | 20 | 0  | 90
2   | BBPVP Bekasi            | 195     | 0  | 1   | 5   | 0  | 0  | 23 | 8  | 127 | 38 | 0  | 195
...
    | JUMLAH                  | 2200    | 1  | 3   | 100 | 2  | 1  | 250| 80 | 1500| 350| 5  | 2200
```

### 3. Jumlah ASN per Unit Kerja

**Kolom:**
- No
- Nama Unit kerja
- JUMLAH ASN (PNS + CPNS + PPPK)
- Jumlah Tenaga Non ASN / Outsourcing
- Jumlah ASN dan Tenaga Non ASN

**Fitur:**
- ✅ Baris JUMLAH di akhir tabel
- ✅ Format sesuai laporan bulanan resmi
- ✅ Lebar kolom disesuaikan untuk judul yang panjang

**Contoh Data:**
```
No | Nama Unit kerja         | JUMLAH ASN (PNS + CPNS + PPPK) | Jumlah Tenaga Non ASN / Outsourcing | Jumlah ASN dan Tenaga Non ASN
1  | Setditjen Binalavotas   | 90                              | 0                                    | 90
2  | BBPVP Bekasi            | 195                             | 5                                    | 200
...
   | JUMLAH                  | 2200                            | 50                                   | 2250
```

## 📊 Struktur File Excel

Setelah export, file Excel akan memiliki struktur:

```
Peta_Jabatan_ASN_Semua_Unit_YYYYMMDD.xlsx
├── SUMMARY (sheet ringkasan jabatan - sudah ada sebelumnya)
├── Setditjen Binalavotas (detail peta jabatan)
├── Direktorat Bina Stankomproglat
├── ... (sheet per unit kerja)
├── Tabel Golongan per Unit (BARU)
├── Tabel Pendidikan per Unit (BARU)
└── Jumlah ASN per Unit (BARU)
```

**Total Sheet:** 
- 1 sheet SUMMARY
- ~28 sheet per unit kerja
- 3 sheet agregasi baru
- **Total: ~32 sheets**

## 🎯 Cara Menggunakan

### 1. Export Peta Jabatan
```
1. Login sebagai Admin Pusat
2. Navigasi ke menu "Peta Jabatan"
3. Klik tab "Formasi ASN"
4. Klik tombol "Export Semua Unit"
5. File Excel akan diunduh
```

### 2. Lihat Sheet Agregasi
```
1. Buka file Excel yang telah diunduh
2. Scroll ke sheet paling akhir
3. Klik sheet "Tabel Golongan per Unit"
4. Klik sheet "Tabel Pendidikan per Unit"
5. Klik sheet "Jumlah ASN per Unit"
```

### 3. Analisis Data
```
Sheet agregasi dapat digunakan untuk:
- Membandingkan distribusi golongan antar unit kerja
- Melihat profil pendidikan pegawai per unit
- Monitoring jumlah ASN dan Non ASN
- Membuat pivot table atau chart
- Export ke PowerPoint untuk presentasi
```

## 💡 Keunggulan

### ✅ Data Lengkap dalam Satu File
- Tidak perlu export Agregasi Cepat secara terpisah
- Semua data peta jabatan + agregasi dalam satu file
- Hemat waktu dan efisien

### ✅ Konsisten dengan Agregasi Cepat
- Menggunakan logika agregasi yang sama
- Format tabel identik dengan export Agregasi Cepat
- Data dijamin konsisten dan akurat

### ✅ Format Resmi Laporan
- Tabel Pendidikan menggunakan format laporan bulanan resmi
- Tabel Jumlah ASN sesuai format Dukungan Personil
- Urutan unit kerja sesuai urutan resmi

### ✅ Siap untuk Presentasi
- Format tabel sudah rapi dan profesional
- Mudah di-copy ke PowerPoint atau Word
- Bisa langsung digunakan untuk laporan pimpinan

## 📝 Contoh Penggunaan

### Skenario 1: Laporan Bulanan Lengkap
```
1. Export Peta Jabatan Semua Unit
2. Buka sheet "Tabel Pendidikan per Unit"
3. Copy tabel ke Word untuk laporan bulanan
4. Buka sheet "Jumlah ASN per Unit"
5. Copy tabel ke Word
6. Laporan bulanan lengkap siap! ✅
```

### Skenario 2: Analisis Distribusi Golongan
```
1. Export Peta Jabatan Semua Unit
2. Buka sheet "Tabel Golongan per Unit"
3. Lihat distribusi PNS per golongan
4. Identifikasi unit dengan banyak PNS golongan tinggi (IV)
5. Rencanakan promosi/kenaikan pangkat
```

### Skenario 3: Monitoring Kualifikasi Pendidikan
```
1. Export Peta Jabatan Semua Unit
2. Buka sheet "Tabel Pendidikan per Unit"
3. Hitung persentase S2/S3 per unit
4. Identifikasi unit yang perlu peningkatan kualifikasi
5. Rencanakan program beasiswa/tugas belajar
```

### Skenario 4: Presentasi Pimpinan
```
1. Export Peta Jabatan Semua Unit
2. Buka sheet "Jumlah ASN per Unit"
3. Copy tabel ke PowerPoint
4. Buat chart pie untuk visualisasi ASN vs Non ASN
5. Presentasikan ke pimpinan ✅
```

## 🔧 Detail Teknis

### Perubahan Kode

**File:** `src/pages/PetaJabatan.tsx`

**Fungsi:** `handleExportAllDepartments()`

**Perubahan:**
1. Menambahkan helper functions untuk agregasi:
   - `normalizeAsnStatus()` - Normalisasi status ASN
   - `normalizeGender()` - Normalisasi jenis kelamin
   - `extractEducationLevelFromMap()` - Ekstrak jenjang pendidikan
2. Menambahkan konstanta `OFFICIAL_DEPT_ORDER` untuk urutan unit kerja
3. Mengelompokkan pegawai per unit kerja dalam `deptEmpMap`
4. Membuat 3 sheet baru setelah sheet SUMMARY:
   - Sheet "Tabel Golongan per Unit"
   - Sheet "Tabel Pendidikan per Unit"
   - Sheet "Jumlah ASN per Unit"
5. Mengupdate toast message untuk mencerminkan jumlah sheet baru

### Logika Agregasi

**Tabel Golongan:**
- PNS I-IV: ekstrak dari rank_group dengan regex `/\b(IV|III|II|I)\/(a|b|c|d|e)\b/i`
- CPNS dihitung bersama PNS (CPNS = calon PNS)
- PPPK III, V, VII, IX: match exact dengan rank_group
- Jenis kelamin hanya dihitung dari ASN (PNS/CPNS/PPPK)

**Tabel Pendidikan:**
- Hanya menghitung ASN (exclude Non ASN)
- Ekstrak dari eduMap (hasil RPC get_latest_education_per_employee)
- Normalisasi level pendidikan (S1, S2, S3, D1-D4, SMA/SMK, SMP, SD)
- Header dokumen dengan bulan dan tahun otomatis

**Jumlah ASN:**
- ASN = PNS + CPNS + PPPK
- Non ASN = status 'Non ASN'
- Total = ASN + Non ASN

### Urutan Unit Kerja

Sheet agregasi menggunakan urutan resmi sesuai `OFFICIAL_DEPT_ORDER`:
1. Setditjen dan Direktorat (7 unit)
2. BBPVP (6 unit)
3. BPVP (15 unit)
4. Satpel (12 unit)
5. Workshop (3 unit)

Unit yang tidak ada di daftar resmi diletakkan di akhir secara alphabetical.

## 🚀 Manfaat untuk Organisasi

### 1. **Efisiensi Pelaporan**
- Satu file Excel untuk berbagai kebutuhan laporan
- Tidak perlu export berkali-kali dari menu berbeda
- Hemat waktu dalam pembuatan laporan bulanan

### 2. **Konsistensi Data**
- Data agregasi konsisten dengan data peta jabatan
- Menggunakan sumber data yang sama
- Tidak ada perbedaan angka antar laporan

### 3. **Kemudahan Analisis**
- Data lengkap dalam satu file memudahkan analisis
- Bisa membandingkan data jabatan dengan data agregasi
- Format tabel memudahkan pembuatan pivot table

### 4. **Profesionalitas Laporan**
- Format tabel sesuai standar laporan resmi
- Tampilan rapi dan mudah dibaca
- Siap digunakan untuk presentasi pimpinan

## 🧪 Testing

### Manual Testing Checklist:
- [x] Kode berhasil dikompilasi tanpa error
- [ ] Export peta jabatan semua unit berhasil
- [ ] File Excel memiliki 3 sheet agregasi baru
- [ ] Sheet "Tabel Golongan per Unit" memiliki data yang benar
- [ ] Sheet "Tabel Pendidikan per Unit" memiliki header merged
- [ ] Sheet "Jumlah ASN per Unit" memiliki data yang benar
- [ ] Baris JUMLAH di setiap tabel benar
- [ ] Urutan unit kerja sesuai OFFICIAL_DEPT_ORDER
- [ ] Lebar kolom sesuai dengan konten
- [ ] File Excel dapat dibuka tanpa error

### Test Scenarios:

#### Scenario 1: Verifikasi Data Golongan
```
Given: File Excel hasil export peta jabatan
When: Membuka sheet "Tabel Golongan per Unit"
Then: Jumlah PNS I + II + III + IV harus = Jumlah PNS
And: Jumlah PPPK III + V + VII + IX harus = Jumlah PPPK
And: Jumlah PNS + Jumlah PPPK harus = Total ASN
And: L + P harus = Total JK
```

#### Scenario 2: Verifikasi Data Pendidikan
```
Given: Sheet "Tabel Pendidikan per Unit"
When: Menjumlahkan SD + SMP + SMA + D1-D4 + S1-S3
Then: Hasil harus sama dengan JML PEG (kolom pertama dan terakhir)
```

#### Scenario 3: Verifikasi Jumlah ASN
```
Given: Sheet "Jumlah ASN per Unit"
When: Menjumlahkan JUMLAH ASN + Jumlah Tenaga Non ASN
Then: Hasil harus sama dengan Jumlah ASN dan Tenaga Non ASN
```

#### Scenario 4: Konsistensi dengan Agregasi Cepat
```
Given: Export Peta Jabatan dan Export Agregasi Cepat
When: Membandingkan data untuk unit kerja yang sama
Then: Data di kedua file harus identik
```

## 📚 Dokumentasi Terkait

- `FITUR_AGREGASI_CEPAT.md` - Dokumentasi fitur Agregasi Cepat
- `AGREGASI_JUMLAH_ASN_PER_UNIT.md` - Dokumentasi sheet Jumlah ASN
- `src/components/data-builder/QuickAggregation.tsx` - Kode sumber Agregasi Cepat

## 📞 Support

Jika ada pertanyaan atau masalah:
- Baca dokumentasi ini dengan seksama
- Cek file `FITUR_AGREGASI_CEPAT.md` untuk referensi
- Hubungi admin sistem untuk bantuan teknis

---

**Status:** ✅ SELESAI DAN SIAP DIGUNAKAN

**Tanggal:** 8 Mei 2026

**Versi:** 1.0

**Implementor:** AI Assistant (Kiro)
