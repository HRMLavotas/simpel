# Data Builder: Kolom Kejuruan untuk Instruktur

## 📋 Overview

Menambahkan kolom **Kejuruan** ke Data Builder untuk memungkinkan user memilih, memfilter, dan mengexport data kejuruan instruktur.

## ✨ Fitur yang Ditambahkan

### 1. Kolom Kejuruan di Column Selector

**Lokasi:** Section "Jabatan" di Column Selector

**Detail:**
- **Label:** Kejuruan
- **Database Field:** `kejuruan`
- **Kategori:** `position` (Jabatan)
- **Deskripsi:** "Bidang keahlian instruktur (hanya untuk jabatan Instruktur). Contoh: Otomotif, TIK, Las, Manufaktur, Refrigerasi."

**Cara Menggunakan:**
1. Buka Data Builder
2. Di section "Pilih Kolom", expand kategori "Jabatan"
3. Centang checkbox "Kejuruan"
4. Kolom kejuruan akan muncul di tabel preview dan export Excel

### 2. Filter Kejuruan

**Operator yang Tersedia:**
- ✅ **Sama dengan (case-sensitive)** - Cocok persis dengan huruf besar/kecil
- ✅ **Persis sama dengan** - Cocok persis tanpa peduli huruf besar/kecil
- ✅ **Mengandung** - Mencari teks yang mengandung kata kunci
- ✅ **Mengandung kata utuh** - Mencari kata utuh (word boundary)
- ✅ **Salah satu dari** - Multi-select dari 47 pilihan kejuruan

**Pilihan Kejuruan (47 opsi):**
```
Bahasa, Bahasa Asing, Bahasa Jepang, Bangunan, Bisnis dan Manajemen,
Bisnis Manajemen, Elektronika, Fashion Technology, Garmen, Garmen Apparel,
Garmen/Fashion Designer, Industri Kreatif, Konstruksi, Las, Listrik,
Manufaktur, Mekanisasi Pertanian, Metodologi, Metodologi Pelatihan,
Motor Tempel, Otomotif, Pariwisata, Perikanan, Pertanian, Peternakan,
PLTS, Processing, Produktivitas, Refrigerasi, Refrigeration,
Tata Kecantikan, Tatarias Kecantikan, Teknik Bangunan, Teknik Elektronika,
Teknik Las, Teknik Listrik, Teknik Manufaktur, Teknik Mekanik,
Teknik Otomotif, Teknik Refrigasi, Teknologi Informasi dan Komunikasi,
Teknologi Mekanik, Teknologi Pelatihan, Teknologi Pengolahan Agroindustri,
TIK, Underwater Service, Welding
```

**Contoh Penggunaan Filter:**

#### Contoh 1: Cari Instruktur Otomotif
```
Kolom: Kejuruan
Operator: Persis sama dengan
Nilai: Otomotif
```

#### Contoh 2: Cari Instruktur TIK atau Elektronika
```
Kolom: Kejuruan
Operator: Salah satu dari
Nilai: [TIK, Elektronika, Teknologi Informasi dan Komunikasi]
```

#### Contoh 3: Cari Instruktur dengan kejuruan yang mengandung "Teknik"
```
Kolom: Kejuruan
Operator: Mengandung
Nilai: Teknik
```

### 3. Export Excel dengan Kejuruan

**Format Export:**
- Kolom "Kejuruan" akan muncul di Excel jika dipilih di Column Selector
- Nilai kosong ditampilkan sebagai "-"
- Urutan kolom mengikuti urutan di Column Selector

**Contoh Output Excel:**

| NIP | Nama | Jabatan | Kejuruan | Unit Kerja |
|-----|------|---------|----------|------------|
| 196610311994031002 | Ahmad Fauzi | Instruktur Ahli Madya | Refrigerasi | BBPVP Bandung |
| 197209172005011002 | Budi Santoso | Instruktur Ahli Madya | TIK | BBPVP Bandung |
| 197405161994031001 | Citra Dewi | Instruktur Ahli Madya | TIK | BBPVP Bandung |

### 4. Quick Aggregation

**Update:**
- Field `kejuruan` ditambahkan ke query select di QuickAggregation
- Data kejuruan tersedia untuk agregasi (jika fitur agregasi kejuruan ditambahkan di masa depan)

## 🔧 File yang Dimodifikasi

### 1. `src/components/data-builder/ColumnSelector.tsx`
**Perubahan:**
- Menambahkan kolom `kejuruan` ke `AVAILABLE_COLUMNS`
- Kategori: `position`
- Deskripsi lengkap dengan contoh kejuruan

### 2. `src/components/data-builder/FilterBuilder.tsx`
**Perubahan:**
- Menambahkan `kejuruan` ke `FILTER_OPTIONS` dengan 47 pilihan
- Mendukung semua operator filter standar

### 3. `src/pages/DataBuilder.tsx`
**Perubahan:**
- Menambahkan `kejuruan` ke `FILTER_OPTIONS` (konsistensi dengan FilterBuilder)

### 4. `src/components/data-builder/QuickAggregation.tsx`
**Perubahan:**
- Menambahkan `kejuruan` ke query select
- Data kejuruan tersedia untuk agregasi

## 📊 Use Cases

### Use Case 1: Laporan Instruktur per Kejuruan
**Tujuan:** Mengetahui jumlah instruktur per bidang keahlian

**Langkah:**
1. Pilih kolom: Nama, NIP, Jabatan, Kejuruan, Unit Kerja
2. Filter: Jabatan mengandung "Instruktur"
3. Export ke Excel
4. Gunakan Pivot Table di Excel untuk menghitung per kejuruan

### Use Case 2: Cari Instruktur TIK di Unit Tertentu
**Tujuan:** Mencari instruktur TIK di BBPVP Bandung

**Langkah:**
1. Pilih kolom: Nama, NIP, Kejuruan, Unit Kerja
2. Filter 1: Unit Kerja = "BBPVP Bandung"
3. Filter 2: Kejuruan = "TIK" atau "Teknologi Informasi dan Komunikasi"
4. Preview atau export

### Use Case 3: Audit Data Kejuruan Instruktur
**Tujuan:** Menemukan instruktur yang belum memiliki data kejuruan

**Langkah:**
1. Pilih kolom: Nama, NIP, Jabatan, Kejuruan, Unit Kerja
2. Filter: Jabatan mengandung "Instruktur"
3. Export ke Excel
4. Filter di Excel: Kejuruan = "-" (kosong)

### Use Case 4: Distribusi Instruktur per Kejuruan dan Unit
**Tujuan:** Analisis sebaran instruktur berdasarkan kejuruan dan unit kerja

**Langkah:**
1. Pilih kolom: Unit Kerja, Kejuruan, Nama, NIP
2. Filter: Jabatan mengandung "Instruktur"
3. Export ke Excel
4. Buat Pivot Table dengan:
   - Rows: Unit Kerja
   - Columns: Kejuruan
   - Values: Count of NIP

## 🧪 Testing

### Test 1: Kolom Kejuruan Tersedia
- ✅ Buka Data Builder
- ✅ Expand kategori "Jabatan" di Column Selector
- ✅ Checkbox "Kejuruan" tersedia
- ✅ Tooltip menampilkan deskripsi yang benar

### Test 2: Filter Kejuruan
- ✅ Tambah filter baru
- ✅ Pilih field "Kejuruan"
- ✅ Operator "Salah satu dari" menampilkan 47 pilihan
- ✅ Pilih beberapa kejuruan (contoh: Otomotif, TIK, Las)
- ✅ Preview menampilkan data yang sesuai

### Test 3: Export dengan Kejuruan
- ✅ Pilih kolom: Nama, NIP, Jabatan, Kejuruan, Unit Kerja
- ✅ Filter: Jabatan mengandung "Instruktur"
- ✅ Export ke Excel
- ✅ Kolom Kejuruan muncul di Excel
- ✅ Data kejuruan ditampilkan dengan benar
- ✅ Nilai kosong ditampilkan sebagai "-"

### Test 4: Kombinasi Filter
- ✅ Filter 1: Unit Kerja = "BBPVP Bandung"
- ✅ Filter 2: Kejuruan = "TIK"
- ✅ Filter 3: Status ASN = "PNS"
- ✅ Preview menampilkan data yang sesuai semua filter

## 📝 Catatan

1. **Data Kejuruan Hanya untuk Instruktur:**
   - Field kejuruan hanya relevan untuk jabatan Instruktur
   - Pegawai non-instruktur akan memiliki nilai kejuruan kosong (NULL)
   - Di export Excel, nilai kosong ditampilkan sebagai "-"

2. **Variasi Nama Kejuruan:**
   - Beberapa kejuruan memiliki variasi nama (contoh: "TIK" vs "Teknologi Informasi dan Komunikasi")
   - Gunakan operator "Salah satu dari" untuk mencakup semua variasi
   - Atau gunakan operator "Mengandung" untuk pencarian lebih fleksibel

3. **Konsistensi Data:**
   - Total 47 pilihan kejuruan tersedia
   - Pilihan kejuruan sama dengan yang ada di form pegawai
   - Data kejuruan sudah diisi untuk 200+ instruktur yang ada

## 🚀 Future Enhancements

Fitur yang bisa ditambahkan di masa depan:

1. **Agregasi Kejuruan di Quick Aggregation:**
   - Card khusus untuk distribusi instruktur per kejuruan
   - Chart pie/bar untuk visualisasi

2. **Template Query untuk Instruktur:**
   - Template "Laporan Instruktur per Kejuruan"
   - Template "Audit Data Kejuruan Instruktur"

3. **Export Summary Kejuruan:**
   - Sheet tambahan di Excel: "Stat Kejuruan"
   - Tabel jumlah instruktur per kejuruan

---

**Tanggal:** 4 Mei 2026  
**Status:** ✅ Selesai  
**Versi:** 2.10.0
