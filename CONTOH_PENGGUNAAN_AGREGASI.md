# Contoh Penggunaan Fitur Agregasi Data Builder

## Skenario 1: Membuat Laporan Rekap Pegawai Bulanan

### Kebutuhan:
Membuat laporan seperti "REKAP PEGAWAI DITJEN BINALAVOTAS BULAN MARET 2026" yang menampilkan:
- Jumlah pegawai per unit kerja
- Breakdown PNS, PPPK, Non ASN
- Breakdown per pangkat/golongan

### Langkah:

1. **Buka Data Builder**

2. **Pilih Kolom:**
   ```
   ✅ NIP
   ✅ Nama
   ✅ Unit Kerja
   ✅ Status ASN
   ✅ Pangkat/Golongan
   ```

3. **Atur Filter (opsional):**
   - Jika ada field bulan/periode, filter untuk Maret 2026

4. **Klik "Tampilkan Data"**

5. **Lihat Tab "Statistik"** untuk preview

6. **Klik "Export Excel"**

### Hasil Excel:

**Sheet 1: Data Pegawai**
| No | NIP | Nama | Unit Kerja | Status ASN | Pangkat/Golongan |
|----|-----|------|------------|------------|------------------|
| 1 | 199001012020121001 | Ahmad Budiman | Setditjen Binalavotas | PNS | III/d |
| 2 | 199102022020122002 | Siti Nurhaliza | Setditjen Binalavotas | PNS | IV/a |
| ... | ... | ... | ... | ... | ... |

**Sheet 2: Ringkasan**
| Kategori | Nilai |
|----------|-------|
| Total Pegawai | 353 |
| Kolom Dipilih | 5 |
| Data Relasi Dipilih | 0 |
| Filter Aktif | 0 |

**Sheet 3: Stat Unit Kerja**
| Unit Kerja | Jumlah | Persentase |
|------------|--------|------------|
| Setditjen Binalavotas | 97 | 27.5% |
| Direktorat Bina Stankomproglat | 52 | 14.7% |
| Direktorat Bina Lemlatvok | 59 | 16.7% |
| Direktorat Bina Lavogan | 50 | 14.2% |
| Direktorat Bina Intala | 50 | 14.2% |
| Direktorat Bina Peningkatan Produktivitas | 45 | 12.7% |

**Sheet 4: Stat Status ASN**
| Status ASN | Jumlah | Persentase |
|------------|--------|------------|
| PNS | 271 | 76.8% |
| PPPK | 82 | 23.2% |
| Non ASN | 0 | 0% |

**Sheet 5: Stat Pangkat/Golongan**
| Pangkat/Golongan | Jumlah | Persentase |
|------------------|--------|------------|
| IV/e | 2 | 0.8% |
| IV/d | 10 | 3.7% |
| IV/c | 18 | 6.6% |
| IV/b | 35 | 12.9% |
| IV/a | 65 | 23.9% |
| III/d | 85 | 31.3% |
| III/c | 45 | 16.5% |
| III/b | 8 | 2.9% |
| III/a | 5 | 1.8% |

---

## Skenario 2: Analisis Distribusi Jabatan

### Kebutuhan:
Mengetahui distribusi jabatan di organisasi untuk perencanaan karir

### Langkah:

1. **Pilih Kolom:**
   ```
   ✅ Nama
   ✅ Unit Kerja
   ✅ Jenis Jabatan
   ✅ Jabatan Sesuai SK
   ✅ Jabatan Sesuai Kepmen 202/2024
   ```

2. **Klik "Tampilkan Data"** dan **"Export Excel"**

### Hasil Excel:

**Sheet: Stat Jenis Jabatan**
| Jenis Jabatan | Jumlah | Persentase |
|---------------|--------|------------|
| Pelaksana | 180 | 51.0% |
| Fungsional | 120 | 34.0% |
| Struktural | 53 | 15.0% |

**Sheet: Stat Jabatan Sesuai SK**
| Jabatan Sesuai SK | Jumlah | Persentase |
|-------------------|--------|------------|
| Kepala Seksi | 15 | 4.2% |
| Kepala Sub Bagian | 12 | 3.4% |
| Analis SDM | 25 | 7.1% |
| Pranata Komputer | 18 | 5.1% |
| Staf Administrasi | 95 | 26.9% |
| ... | ... | ... |

**Sheet: Stat Jabatan Sesuai Kepmen 202/2024**
| Jabatan Sesuai Kepmen 202/2024 | Jumlah | Persentase |
|--------------------------------|--------|------------|
| Analis Sumber Daya Manusia Aparatur | 30 | 8.5% |
| Pranata Komputer | 22 | 6.2% |
| Pengelola Keuangan | 18 | 5.1% |
| ... | ... | ... |

---

## Skenario 3: Analisis Demografi Pegawai

### Kebutuhan:
Memahami komposisi demografi pegawai untuk program kesejahteraan

### Langkah:

1. **Pilih Kolom:**
   ```
   ✅ Nama
   ✅ Jenis Kelamin
   ✅ Agama
   ✅ Tempat Lahir
   ✅ Unit Kerja
   ```

2. **Export Excel**

### Hasil Excel:

**Sheet: Stat Jenis Kelamin**
| Jenis Kelamin | Jumlah | Persentase |
|---------------|--------|------------|
| Laki-laki | 210 | 59.5% |
| Perempuan | 143 | 40.5% |

**Sheet: Stat Agama**
| Agama | Jumlah | Persentase |
|-------|--------|------------|
| Islam | 285 | 80.7% |
| Kristen | 38 | 10.8% |
| Katolik | 20 | 5.7% |
| Hindu | 7 | 2.0% |
| Buddha | 3 | 0.8% |

**Sheet: Stat Tempat Lahir**
| Tempat Lahir | Jumlah | Persentase |
|--------------|--------|------------|
| Jakarta | 45 | 12.7% |
| Bandung | 32 | 9.1% |
| Surabaya | 28 | 7.9% |
| Medan | 25 | 7.1% |
| Semarang | 22 | 6.2% |
| ... | ... | ... |

---

## Skenario 4: Analisis Pendidikan dan Kompetensi

### Kebutuhan:
Mapping pendidikan pegawai untuk program pelatihan

### Langkah:

1. **Pilih Kolom:**
   ```
   ✅ Nama
   ✅ Unit Kerja
   ✅ Jabatan Sesuai SK
   ```

2. **Pilih Data Relasi:**
   ```
   ✅ Riwayat Pendidikan
   ```

3. **Export Excel**

### Hasil Excel:

**Sheet: Data Pegawai**
- Data utama pegawai

**Sheet: Riwayat Pendidikan**
| No | NIP | Nama | Unit Kerja | Jenjang | Institusi | Jurusan | Tahun Lulus |
|----|-----|------|------------|---------|-----------|---------|-------------|
| 1 | 199001012020121001 | Ahmad Budiman | Setditjen | S2 | UI | Manajemen | 2015 |
| 2 | 199001012020121001 | Ahmad Budiman | Setditjen | S1 | UGM | Ekonomi | 2010 |
| ... | ... | ... | ... | ... | ... | ... | ... |

---

## Skenario 5: Monitoring Mutasi dan Perubahan

### Kebutuhan:
Tracking perubahan jabatan dan mutasi pegawai

### Langkah:

1. **Pilih Kolom:**
   ```
   ✅ Nama
   ✅ NIP
   ✅ Unit Kerja
   ✅ Jabatan Sesuai SK
   ✅ Jabatan Lama
   ```

2. **Atur Filter:**
   - Filter pegawai yang punya "Jabatan Lama" (tidak kosong)

3. **Export Excel**

### Hasil Excel:

**Sheet: Data Pegawai**
| No | Nama | NIP | Unit Kerja | Jabatan Sesuai SK | Jabatan Lama |
|----|------|-----|------------|-------------------|--------------|
| 1 | Ahmad Budiman | 199001012020121001 | Setditjen | Kepala Seksi | Staf Administrasi |
| 2 | Siti Nurhaliza | 199102022020122002 | Direktorat A | Kepala Sub Bagian | Analis SDM |
| ... | ... | ... | ... | ... | ... |

**Sheet: Stat Jabatan Lama**
| Jabatan Lama | Jumlah | Persentase |
|--------------|--------|------------|
| Staf Administrasi | 25 | 45.5% |
| Analis SDM | 15 | 27.3% |
| Pranata Komputer | 10 | 18.2% |
| ... | ... | ... |

---

## Tips & Trik

### Tip 1: Kombinasi Filter untuk Analisis Spesifik

Contoh: Analisis pegawai perempuan di jabatan struktural
```
Kolom: Nama, Jenis Kelamin, Jenis Jabatan, Jabatan Sesuai SK
Filter: 
  - Jenis Kelamin = Perempuan
  - Jenis Jabatan = Struktural
```

### Tip 2: Export Bertahap untuk Data Besar

Jika data terlalu besar, export per unit kerja:
```
Export 1: Filter Unit Kerja = Setditjen Binalavotas
Export 2: Filter Unit Kerja = Direktorat Bina Stankomproglat
...
```

### Tip 3: Gunakan Template untuk Query Berulang

Jika sering membuat laporan yang sama:
1. Atur kolom dan filter
2. Simpan sebagai template
3. Bulan depan tinggal load template dan export

### Tip 4: Kombinasi dengan Data Relasi

Untuk analisis mendalam:
```
Kolom: Nama, Unit Kerja, Jabatan
Data Relasi: 
  ✅ Riwayat Pendidikan
  ✅ Riwayat Jabatan
  ✅ Riwayat Pelatihan
```

Hasil: 1 file Excel dengan banyak sheet (data utama + 3 sheet relasi + sheet statistik)

---

## Kesimpulan

Fitur agregasi Data Builder sangat fleksibel dan powerful. Anda bisa:

✅ Pilih kolom apa saja
✅ Sistem otomatis hitung count/agregasi
✅ Export ke Excel dengan sheet terpisah per kategori
✅ Kombinasi dengan filter untuk analisis spesifik
✅ Tambahkan data relasi untuk analisis mendalam

Tidak perlu konfigurasi rumit - tinggal pilih kolom dan export!
