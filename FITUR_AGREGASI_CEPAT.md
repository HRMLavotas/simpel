# Fitur Agregasi Cepat - Data Builder

## 🚀 Fitur Baru: Tab "Agregasi Cepat"

Tab baru di Data Builder yang menampilkan agregasi sederhana dan cepat untuk 3 kategori utama:
1. **Pangkat/Golongan Utama** (I, II, III, IV) - tanpa sub-golongan
2. **Pendidikan Terakhir** (SMA, S1, S2, S3) - tanpa jurusan
3. **Jenis Kelamin** (Laki-laki, Perempuan)

## 📊 Apa yang Ditampilkan?

### 1. Pangkat/Golongan Utama

Menampilkan hanya golongan utama tanpa detail sub-golongan:

| Pangkat | Jumlah | Persentase |
|---------|--------|------------|
| I       | 5      | 3.4%       |
| II      | 15     | 10.3%      |
| III     | 80     | 55.2%      |
| IV      | 25     | 17.2%      |
| PPPK    | 15     | 10.3%      |
| Non ASN | 5      | 3.4%       |

**Logika:**
- **I, II, III, IV**: Ekstrak dari rank_group (contoh: "Penata Muda (III/a)" → "III")
- **PPPK**: Golongan V, VII, IX dikategorikan sebagai PPPK
- **Non ASN**: "Tenaga Alih Daya" dan "Non ASN" dikategorikan terpisah

### 2. Pendidikan Terakhir

Menampilkan hanya jenjang pendidikan tertinggi tanpa jurusan:

| Pendidikan | Jumlah | Persentase |
|------------|--------|------------|
| S3         | 5      | 3.4%       |
| S2         | 35     | 24.1%      |
| S1         | 80     | 55.2%      |
| D4         | 10     | 6.9%       |
| D3         | 8      | 5.5%       |
| SMA/SMK    | 7      | 4.8%       |

**Logika:**
- Mengambil dari field `education_history` (JSON array)
- Mengambil pendidikan tertinggi jika ada multiple entries
- Normalisasi: "Sarjana" → "S1", "Magister" → "S2", dll

### 3. Jenis Kelamin

Distribusi sederhana gender:

| Jenis Kelamin | Jumlah | Persentase |
|---------------|--------|------------|
| Laki-laki     | 85     | 58.6%      |
| Perempuan     | 60     | 41.4%      |

**Logika:**
- Normalisasi dari field `gender`
- "L", "Laki", "Male" → "Laki-laki"
- "P", "Perempuan", "Female" → "Perempuan"

## 🎯 Cara Menggunakan

### Langkah 1: Muat Data
```
1. Buka Data Builder
2. Pilih kolom minimal:
   - Pangkat/Golongan (untuk agregasi pangkat)
   - Gender (untuk agregasi jenis kelamin)
3. Pilih Data Relasi:
   - Riwayat Pendidikan (untuk agregasi pendidikan)
4. Klik "Tampilkan Data"
```

### Langkah 2: Lihat Agregasi Cepat
```
1. Klik tab "Agregasi Cepat"
2. Lihat 3 tabel agregasi sederhana
3. Review summary cards di atas
```

### Langkah 3: Export Excel
```
1. Klik tombol "Export Excel" di tab Agregasi Cepat
2. File akan diunduh dengan nama: agregasi-cepat-YYYY-MM-DD.xlsx
3. File berisi 4 sheet:
   - Ringkasan
   - Pangkat Utama
   - Pendidikan
   - Jenis Kelamin
```

## 📁 Format Output Excel

### Sheet 1: Ringkasan
| Kategori | Nilai |
|----------|-------|
| Total Pegawai | 145 |
| Tanggal Export | 21/04/2026 |

### Sheet 2: Pangkat Utama
| Pangkat/Golongan | Jumlah | Persentase |
|------------------|--------|------------|
| I                | 5      | 3.4%       |
| II               | 15     | 10.3%      |
| III              | 80     | 55.2%      |
| IV               | 25     | 17.2%      |
| PPPK             | 15     | 10.3%      |
| Non ASN          | 5      | 3.4%       |

### Sheet 3: Pendidikan
| Pendidikan | Jumlah | Persentase |
|------------|--------|------------|
| S3         | 5      | 3.4%       |
| S2         | 35     | 24.1%      |
| S1         | 80     | 55.2%      |
| D4         | 10     | 6.9%       |
| D3         | 8      | 5.5%       |
| SMA/SMK    | 7      | 4.8%       |

### Sheet 4: Jenis Kelamin
| Jenis Kelamin | Jumlah | Persentase |
|---------------|--------|------------|
| Laki-laki     | 85     | 58.6%      |
| Perempuan     | 60     | 41.4%      |

## 💡 Perbedaan dengan Tab "Statistik"

| Aspek | Tab Statistik | Tab Agregasi Cepat |
|-------|---------------|-------------------|
| Detail | Sangat detail (III/a, III/b, III/c, dll) | Sederhana (hanya I, II, III, IV) |
| Pendidikan | Dengan jurusan (S1 Ekonomi, S1 Hukum) | Tanpa jurusan (hanya S1) |
| Kolom | Semua kolom yang dipilih | Hanya 3 kategori utama |
| Use Case | Analisis mendalam | Laporan cepat/ringkasan |
| Export | Banyak sheet (sesuai kolom) | 4 sheet saja |

## 🎯 Kapan Menggunakan?

### Gunakan Tab "Agregasi Cepat" untuk:
- ✅ Laporan bulanan yang sederhana
- ✅ Ringkasan eksekutif untuk pimpinan
- ✅ Quick overview distribusi pegawai
- ✅ Presentasi dengan data ringkas
- ✅ Perbandingan antar periode (bulan ke bulan)

### Gunakan Tab "Statistik" untuk:
- ✅ Analisis mendalam per sub-golongan
- ✅ Analisis per jurusan pendidikan
- ✅ Analisis multi-dimensi (banyak kolom)
- ✅ Riset dan perencanaan SDM detail

## 📝 Contoh Kasus Penggunaan

### Kasus 1: Laporan Bulanan untuk Pimpinan

**Kebutuhan:**
Pimpinan ingin laporan sederhana: berapa pegawai per golongan utama, pendidikan, dan gender.

**Solusi:**
```
1. Buka Data Builder
2. Pilih kolom: NIP, Nama, Pangkat/Golongan, Gender
3. Pilih Data Relasi: Riwayat Pendidikan
4. Klik "Tampilkan Data"
5. Klik tab "Agregasi Cepat"
6. Klik "Export Excel"
7. Kirim file ke pimpinan
```

**Hasil:**
File Excel 4 sheet dengan data ringkas yang mudah dibaca pimpinan.

### Kasus 2: Perbandingan Bulan ke Bulan

**Kebutuhan:**
Membandingkan distribusi pegawai Maret vs April.

**Solusi:**
```
Maret:
1. Filter data bulan Maret
2. Export Agregasi Cepat → agregasi-cepat-2026-03-31.xlsx

April:
1. Filter data bulan April
2. Export Agregasi Cepat → agregasi-cepat-2026-04-30.xlsx

3. Buka kedua file di Excel
4. Bandingkan angka-angka
```

**Hasil:**
Mudah melihat perubahan distribusi pegawai antar bulan.

### Kasus 3: Presentasi untuk Rapat

**Kebutuhan:**
Presentasi singkat tentang komposisi pegawai.

**Solusi:**
```
1. Export Agregasi Cepat
2. Copy tabel dari Excel ke PowerPoint
3. Buat chart sederhana di PowerPoint
4. Presentasi!
```

**Hasil:**
Presentasi dengan data akurat dan mudah dipahami.

## 🔧 Technical Details

### File yang Dibuat:
- `src/components/data-builder/QuickAggregation.tsx` - Komponen utama

### Fungsi Utama:

#### 1. `extractMainRank(rankGroup: string)`
Ekstrak golongan utama dari rank_group:
```typescript
"Penata Muda (III/a)" → "III"
"Pembina (IV/a)" → "IV"
"IX" → "PPPK"
"Tenaga Alih Daya" → "Non ASN"
```

#### 2. `extractEducationLevel(educationHistory: unknown)`
Ekstrak pendidikan tertinggi dari education_history:
```typescript
[{level: "S1"}, {level: "S2"}] → "S2"
[{level: "Sarjana Ekonomi"}] → "S1"
```

#### 3. `normalizeGender(gender: unknown)`
Normalisasi gender:
```typescript
"L" → "Laki-laki"
"P" → "Perempuan"
"Male" → "Laki-laki"
```

### Sorting Logic:

**Pangkat:**
```
I → II → III → IV → PPPK → Non ASN → Lainnya → Tidak Ada
```

**Pendidikan:**
```
S3 → S2 → S1 → D4 → D3 → D2 → D1 → SMA/SMK → SMP → SD → Lainnya → Tidak Ada
```

**Gender:**
```
Laki-laki → Perempuan → Tidak Ada
```

## ⚠️ Catatan Penting

### 1. Data Pendidikan
- Memerlukan field `education_history` (JSON array)
- Jika tidak ada data pendidikan, akan muncul "Tidak Ada"
- Pastikan pilih "Riwayat Pendidikan" di Data Relasi

### 2. Data Pangkat
- Memerlukan field `rank_group`
- Sistem otomatis ekstrak golongan utama
- PPPK (V, VII, IX) dikategorikan terpisah

### 3. Data Gender
- Memerlukan field `gender`
- Sistem otomatis normalisasi berbagai format

### 4. Performa
- Cepat untuk data <10,000 pegawai
- Untuk data lebih besar, mungkin perlu beberapa detik

## 🎉 Keuntungan

| Keuntungan | Deskripsi |
|------------|-----------|
| ⚡ Cepat | Langsung lihat ringkasan tanpa konfigurasi |
| 📊 Sederhana | Hanya 3 kategori utama, mudah dipahami |
| 📁 Ringkas | Export hanya 4 sheet, tidak overwhelming |
| 🎯 Fokus | Fokus pada data yang paling sering dibutuhkan |
| 📈 Praktis | Cocok untuk laporan rutin dan presentasi |

## 🚀 Next Steps

Setelah menggunakan Agregasi Cepat:

1. **Untuk analisis lebih detail**: Gunakan tab "Statistik"
2. **Untuk data mentah**: Gunakan tab "Tabel Data"
3. **Untuk custom query**: Simpan sebagai template
4. **Untuk laporan rutin**: Bookmark workflow ini

## 📞 Support

Jika ada pertanyaan tentang fitur Agregasi Cepat:
- Baca dokumentasi ini
- Hubungi admin sistem
- Buat ticket di helpdesk

---

**Happy Reporting! 📊✨**
