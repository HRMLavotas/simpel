# Laporan Perbandingan Data Database vs Excel Rekap (Maret 2026)

## Ringkasan Total

| Kategori | Database | Excel Rekap | Selisih | Status |
|----------|----------|-------------|---------|--------|
| **PNS + CPNS** | 2,050 | 2,067 | **-17** | ⚠️ Kurang 17 |
| - PNS | 1,678 | - | - | - |
| - CPNS | 372 | - | - | ℹ️ CPNS tidak terpisah di Excel |
| **PPPK** | 469 | 471 | **-2** | ⚠️ Kurang 2 |
| **Total ASN** | 2,519 | 2,538 | **-19** | ⚠️ Kurang 19 |
| **Non ASN** | 770 | 760 | **+10** | ⚠️ Lebih 10 |
| **GRAND TOTAL** | **3,290** | **3,298** | **-8** | ⚠️ Kurang 8 pegawai |

## Analisis Perbedaan

### 1. Perbedaan Terbesar (Top 5)

| Unit Kerja | DB Total | Excel Total | Selisih | Keterangan |
|------------|----------|-------------|---------|------------|
| **BPVP Lotim** | 26 | 133 | **-107** | ❌ Data sangat kurang |
| **Direktorat Bina Lavogan** | 14 | 63 | **-49** | ❌ Data sangat kurang |
| **Sekretariat BNSP** | 69 | 103 | **-34** | ❌ Kurang 34 pegawai |
| **BBPVP Makassar** | 198 | 228 | **-30** | ❌ Kurang 30 pegawai |
| **BPVP Padang** | 135 | 152 | **-17** | ⚠️ Kurang 17 pegawai |

### 2. Unit dengan Data Lengkap (Sesuai Excel)

Unit kerja berikut memiliki data yang sesuai atau hampir sesuai:
- BBPVP Bandung
- BBPVP Semarang
- BPVP Ambon
- BPVP Banda Aceh
- BPVP Sidoarjo
- BPVP Pangkep
- Setditjen Binalavotas
- Direktorat Bina Stankomproglat
- Direktorat Bina Lemlatvok

### 3. Breakdown Perbedaan per Unit

#### Unit dengan Kekurangan Data Signifikan:

**BPVP Lotim:**
- PNS: 0 (seharusnya 63) → **Kurang 63**
- PPPK: 0 (seharusnya 33) → **Kurang 33**
- Non ASN: 26 (seharusnya 37) → **Kurang 11**
- **Total kurang: 107 pegawai**

**Direktorat Bina Lavogan:**
- PNS: 0 (seharusnya 39) → **Kurang 39**
- PPPK: 0 (seharusnya 10) → **Kurang 10**
- Non ASN: 14 (sesuai)
- **Total kurang: 49 pegawai**

**Sekretariat BNSP:**
- PNS: 57 (seharusnya 58) → Kurang 1
- PPPK: 11 (seharusnya 12) → Kurang 1
- Non ASN: 0 (seharusnya 33) → **Kurang 33**
- **Total kurang: 34 pegawai**

**BBPVP Makassar:**
- PNS: 142 (seharusnya 145) → Kurang 3
- PPPK: 27 (seharusnya 28) → Kurang 1
- Non ASN: 29 (seharusnya 55) → **Kurang 26**
- **Total kurang: 30 pegawai**

#### Unit dengan Kelebihan Data:

**BPVP Sorong:**
- PNS: 64 (seharusnya 65) → Kurang 1
- PPPK: 4 (seharusnya 3) → **Lebih 1**
- Non ASN: 20 (seharusnya 17) → **Lebih 3**
- **Total lebih: 3 pegawai**

## Kemungkinan Penyebab Perbedaan

### 1. Data Belum Diinput
Beberapa unit seperti **BPVP Lotim** dan **Direktorat Bina Lavogan** memiliki data ASN yang sangat minim (0 PNS, 0 PPPK), kemungkinan:
- Data belum diimport ke database
- Data masih dalam proses input
- File import belum dijalankan untuk unit tersebut

### 2. Data Non ASN Kurang
Banyak unit memiliki jumlah Non ASN yang lebih sedikit di database dibanding Excel:
- Sekretariat BNSP: 0 vs 33
- BBPVP Makassar: 29 vs 55
- BPVP Padang: 22 vs 39
- BPVP Ternate: 14 vs 28

Kemungkinan data Non ASN belum diimport atau belum diinput.

### 3. Perbedaan Waktu Data
- Excel Rekap: **Maret 2026**
- Database: Data terakhir update (perlu dicek)
- Kemungkinan ada pegawai yang sudah pensiun, mutasi, atau baru masuk

### 4. CPNS vs PNS
Database memisahkan CPNS (372) dari PNS (1,678), sedangkan Excel menggabungkan keduanya sebagai PNS (2,067).
- Total PNS + CPNS di database: 2,050
- Total PNS di Excel: 2,067
- **Selisih: 17 pegawai**

## Rekomendasi Tindakan

### Prioritas Tinggi (Segera):

1. **BPVP Lotim** - Import/input data 107 pegawai yang hilang
   - 63 PNS
   - 33 PPPK
   - 11 Non ASN

2. **Direktorat Bina Lavogan** - Import/input data 49 pegawai yang hilang
   - 39 PNS
   - 10 PPPK

3. **Sekretariat BNSP** - Import/input data Non ASN (33 pegawai)

4. **BBPVP Makassar** - Import/input data Non ASN (26 pegawai)

### Prioritas Sedang:

5. Verifikasi dan lengkapi data Non ASN untuk unit-unit lain yang kurang
6. Cek data PNS/CPNS yang kurang 17 pegawai secara keseluruhan
7. Cek data PPPK yang kurang 2 pegawai

### Langkah Verifikasi:

1. Hubungi admin unit yang datanya kurang untuk konfirmasi
2. Minta file Excel/data terbaru dari unit tersebut
3. Lakukan import data yang hilang
4. Verifikasi ulang setelah import

## Query untuk Investigasi Lebih Lanjut

```sql
-- Cek pegawai terakhir diinput per unit
SELECT 
  department,
  MAX(created_at) as last_input,
  COUNT(*) as total
FROM employees
GROUP BY department
ORDER BY last_input DESC;

-- Cek apakah ada data duplikat
SELECT nip, name, COUNT(*) 
FROM employees 
WHERE nip IS NOT NULL
GROUP BY nip, name 
HAVING COUNT(*) > 1;

-- Cek pegawai tanpa NIP (mungkin data tidak lengkap)
SELECT department, COUNT(*) 
FROM employees 
WHERE nip IS NULL OR nip = ''
GROUP BY department;
```

## Kesimpulan

Database saat ini **kurang 8 pegawai** dibanding Excel Rekap Maret 2026. Perbedaan terbesar ada pada:
1. **BPVP Lotim** (kurang 107)
2. **Direktorat Bina Lavogan** (kurang 49)
3. **Sekretariat BNSP** (kurang 34 Non ASN)
4. **BBPVP Makassar** (kurang 26 Non ASN)

Perlu dilakukan import/input data untuk unit-unit tersebut agar data database sesuai dengan rekap resmi.
