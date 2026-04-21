# Cara Export Data dengan Count/Agregasi

## Panduan Cepat

Fitur Data Builder sekarang bisa menampilkan **jumlah/count** untuk semua jenis data yang Anda pilih.

## Langkah-Langkah

### 1. Buka Menu Data Builder

Klik menu **Data Builder** di sidebar

### 2. Pilih Kolom yang Ingin Dianalisis

Centang kolom-kolom yang ingin Anda hitung, misalnya:

- ✅ Pangkat/Golongan
- ✅ Jenis Kelamin  
- ✅ Unit Kerja
- ✅ Status ASN
- ✅ Jenis Jabatan
- ✅ Agama
- ✅ Tempat Lahir
- ✅ Jabatan Sesuai SK

### 3. Atur Filter (Opsional)

Jika ingin data tertentu saja, tambahkan filter:
- Filter berdasarkan Unit Kerja tertentu
- Filter berdasarkan Status ASN
- Filter berdasarkan Pangkat
- Dan lain-lain

### 4. Klik "Tampilkan Data"

Sistem akan memuat data sesuai kolom dan filter yang dipilih

### 5. Lihat Statistik (Preview)

Klik tab **"Statistik"** untuk melihat:
- Chart distribusi data
- Tabel jumlah dan persentase
- Semua kolom kategorikal akan ditampilkan

### 6. Export ke Excel

Klik tombol **"Export Excel"** untuk mendapatkan file dengan:

**Sheet yang dihasilkan:**
1. **Data Pegawai** - Data detail lengkap
2. **Ringkasan** - Info umum (total pegawai, kolom dipilih, dll)
3. **Stat Pangkat/Golongan** - Jumlah per pangkat
4. **Stat Jenis Kelamin** - Jumlah per jenis kelamin
5. **Stat Unit Kerja** - Jumlah per unit
6. **Stat Status ASN** - Jumlah PNS, PPPK, Non ASN
7. Dan sheet lainnya sesuai kolom yang dipilih

## Contoh Output Excel

### Sheet "Stat Pangkat/Golongan"

| Pangkat/Golongan | Jumlah | Persentase |
|------------------|--------|------------|
| IV/a             | 12     | 5.2%       |
| IV/b             | 8      | 3.5%       |
| III/d            | 45     | 19.6%      |
| III/c            | 38     | 16.5%      |
| III/b            | 52     | 22.6%      |
| III/a            | 35     | 15.2%      |
| II/d             | 25     | 10.9%      |
| II/c             | 15     | 6.5%       |

### Sheet "Stat Jenis Kelamin"

| Jenis Kelamin | Jumlah | Persentase |
|---------------|--------|------------|
| Laki-laki     | 150    | 65.2%      |
| Perempuan     | 80     | 34.8%      |

### Sheet "Stat Unit Kerja"

| Unit Kerja                          | Jumlah | Persentase |
|-------------------------------------|--------|------------|
| Setditjen Binalavotas               | 97     | 27.5%      |
| Direktorat Bina Stankomproglat      | 52     | 14.7%      |
| Direktorat Bina Lemlatvok           | 59     | 16.7%      |
| Direktorat Bina Lavogan             | 50     | 14.2%      |
| Direktorat Bina Intala              | 50     | 14.2%      |
| Direktorat Bina Peningkatan Produktivitas | 45 | 12.7%   |

## Tips Penggunaan

### Untuk Laporan Bulanan

1. Pilih kolom: Unit Kerja, Status ASN, Pangkat/Golongan
2. Tambahkan filter bulan jika ada
3. Export → Anda dapat sheet count untuk setiap kategori

### Untuk Analisis Jabatan

1. Pilih kolom: Jabatan Sesuai SK, Jenis Jabatan, Unit Kerja
2. Export → Anda dapat jumlah pegawai per jabatan

### Untuk Analisis Demografi

1. Pilih kolom: Jenis Kelamin, Agama, Tempat Lahir
2. Export → Anda dapat distribusi demografi pegawai

### Untuk Rekap Lengkap

1. Pilih semua kolom yang relevan
2. Export → Anda dapat file Excel dengan banyak sheet statistik

## Catatan Penting

✅ **Otomatis**: Sistem otomatis mendeteksi kolom mana yang bisa dihitung
✅ **Fleksibel**: Pilih kolom apa saja, statistik akan menyesuaikan
✅ **Lengkap**: Setiap kolom kategorikal mendapat sheet sendiri
✅ **Akurat**: Jumlah dan persentase dihitung otomatis

❌ **Tidak dihitung**: 
- Kolom tanggal (gunakan filter untuk analisis tanggal)
- Kolom dengan terlalu banyak nilai unik (>100) seperti NIP, Nama
- Kolom teknis (ID, timestamp, dll)

## Pertanyaan Umum

**Q: Kenapa kolom NIP tidak ada statistiknya?**
A: NIP adalah identifier unik, tidak masuk akal untuk dihitung. Setiap pegawai punya NIP berbeda.

**Q: Kenapa kolom Tanggal Lahir tidak ada statistiknya?**
A: Tanggal adalah data kontinu, bukan kategorikal. Gunakan filter untuk analisis berdasarkan tanggal.

**Q: Bisa export hanya statistik saja tanpa data detail?**
A: Saat ini belum, tapi Anda bisa hapus sheet "Data Pegawai" di Excel setelah export.

**Q: Berapa maksimal kolom yang bisa dipilih?**
A: Semua kolom bisa dipilih. Sistem akan otomatis generate sheet statistik untuk kolom yang relevan.

**Q: Apakah bisa export dalam format lain (PDF, CSV)?**
A: Saat ini hanya Excel (.xlsx). Anda bisa convert dari Excel ke format lain jika perlu.

## Contoh Kasus Nyata

### Membuat Laporan seperti "REKAP PEGAWAI DITJEN BINALAVOTAS"

Untuk membuat laporan seperti spreadsheet yang Anda berikan:

1. **Pilih kolom:**
   - Unit Kerja
   - Status ASN  
   - Pangkat/Golongan

2. **Klik "Tampilkan Data"**

3. **Export Excel**

4. **Hasil:**
   - Sheet "Stat Unit Kerja" → Jumlah pegawai per unit (seperti kolom "JML PEGAWAI")
   - Sheet "Stat Status ASN" → Breakdown PNS, PPPK, Non ASN (seperti kolom "JML ASN", "JML Non ASN")
   - Sheet "Stat Pangkat/Golongan" → Jumlah per golongan (seperti kolom I, II, III, IV)

5. **Anda tinggal format ulang** di Excel sesuai kebutuhan laporan

## Dukungan

Jika ada pertanyaan atau masalah, hubungi admin sistem.
