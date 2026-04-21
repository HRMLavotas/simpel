# Update Data Builder - Agregasi Semua Kolom

## Perubahan yang Dilakukan

Fitur Data Builder telah diupdate agar **semua kolom yang dipilih** dapat ditampilkan agregasi/count-nya, baik di tab Statistik maupun saat export ke Excel.

## Fitur Baru

### 1. Agregasi Otomatis untuk Semua Kolom Kategorikal

Sistem sekarang secara otomatis mendeteksi kolom mana yang bisa diagregasi berdasarkan kriteria:

- ✅ Kolom kategorikal (bukan ID atau timestamp)
- ✅ Kolom dengan jumlah nilai unik yang wajar (2-100 nilai unik)
- ✅ Kolom yang ada datanya
- ❌ Dikecualikan: field tanggal, ID, import_order

### 2. Kolom yang Didukung untuk Agregasi

Semua kolom berikut akan otomatis mendapat statistik jika dipilih:

**Data Pribadi:**
- Jenis Kelamin
- Tempat Lahir
- Agama
- Gelar Depan
- Gelar Belakang

**Kepegawaian:**
- Status ASN (PNS, CPNS, PPPK, Non ASN)
- Pangkat/Golongan (I/a, II/b, III/c, IV/a, dll)
- Unit Kerja

**Jabatan:**
- Jenis Jabatan (Struktural, Fungsional, Pelaksana)
- Jabatan Sesuai SK
- Jabatan Sesuai Kepmen 202/2024
- Jabatan Tambahan
- Jabatan Lama

**Lainnya:**
- Keterangan Formasi

### 3. Output Excel yang Lebih Lengkap

Saat export, file Excel akan berisi:

1. **Sheet "Data Pegawai"** - Data detail lengkap
2. **Sheet "Ringkasan"** - Ringkasan umum
3. **Sheet Statistik untuk setiap kolom kategorikal** yang dipilih, contoh:
   - "Stat Pangkat/Golongan" → IV/a = 12, IV/b = 8, III/d = 45, dst
   - "Stat Jenis Kelamin" → Laki-laki = 150, Perempuan = 120
   - "Stat Tempat Lahir" → Jakarta = 25, Bandung = 18, dst
   - "Stat Jabatan Sesuai SK" → Kepala Seksi = 10, Staf = 45, dst
   - Dan seterusnya untuk semua kolom yang dipilih

Setiap sheet statistik menampilkan:
- Nama kategori
- Jumlah pegawai
- Persentase dari total

### 4. Tab Statistik di UI

Tab Statistik sekarang menampilkan:
- Chart (Pie/Bar) untuk setiap kolom kategorikal
- Tabel detail dengan jumlah dan persentase
- Otomatis menyesuaikan dengan kolom yang dipilih

## Cara Menggunakan

### Contoh 1: Analisis Pangkat dan Pendidikan

1. Buka **Data Builder**
2. Pilih kolom:
   - Nama
   - NIP
   - Pangkat/Golongan
   - Unit Kerja
   - Jenis Kelamin
3. Klik **"Tampilkan Data"**
4. Lihat tab **"Statistik"** untuk melihat distribusi
5. Klik **"Export Excel"** untuk mendapat file dengan sheet:
   - Data Pegawai
   - Ringkasan
   - Stat Pangkat/Golongan
   - Stat Unit Kerja
   - Stat Jenis Kelamin

### Contoh 2: Analisis Jabatan

1. Pilih kolom:
   - Nama
   - Jabatan Sesuai SK
   - Jabatan Sesuai Kepmen 202/2024
   - Jenis Jabatan
   - Unit Kerja
2. Export akan menghasilkan sheet statistik untuk:
   - Jabatan Sesuai SK (count per jabatan)
   - Jabatan Sesuai Kepmen (count per jabatan)
   - Jenis Jabatan (count per jenis)
   - Unit Kerja (count per unit)

### Contoh 3: Membuat Laporan Seperti Spreadsheet

Untuk membuat laporan seperti "REKAP PEGAWAI DITJEN BINALAVOTAS":

1. Pilih kolom:
   - Unit Kerja
   - Status ASN
   - Pangkat/Golongan
2. Tambahkan filter jika perlu (misalnya: bulan tertentu)
3. Export Excel
4. Sheet "Stat Unit Kerja" akan menampilkan jumlah pegawai per unit
5. Sheet "Stat Status ASN" akan menampilkan PNS, PPPK, Non ASN
6. Sheet "Stat Pangkat/Golongan" akan menampilkan I/a, II/b, III/c, IV/a, dst

## Logika Otomatis

Sistem akan **otomatis mengecualikan** kolom yang tidak cocok untuk agregasi:

- **Field dengan terlalu banyak nilai unik** (>100) seperti NIP, Nama
- **Field dengan hanya 1 nilai** (tidak ada variasi)
- **Field tanggal** (birth_date, join_date, tmt_cpns, dll)
- **Field teknis** (id, created_at, updated_at, import_order)

## Keuntungan

✅ Tidak perlu konfigurasi manual - sistem otomatis mendeteksi
✅ Fleksibel - pilih kolom apa saja, statistik akan menyesuaikan
✅ Lengkap - semua kolom kategorikal mendapat sheet statistik sendiri
✅ Efisien - hanya kolom yang masuk akal yang diagregasi
✅ Mudah digunakan - sama seperti sebelumnya, tapi lebih powerful

## File yang Dimodifikasi

1. `src/components/data-builder/DataStatistics.tsx`
   - Update logika untuk mendeteksi semua kolom kategorikal
   - Tidak lagi hardcode field tertentu

2. `src/pages/DataBuilder.tsx`
   - Update fungsi export untuk generate sheet statistik semua kolom
   - Logika deteksi kolom kategorikal yang sama

## Testing

Untuk test fitur ini:

1. Pilih berbagai kombinasi kolom
2. Periksa tab Statistik - harus muncul chart untuk semua kolom kategorikal
3. Export Excel - periksa jumlah sheet statistik sesuai kolom yang dipilih
4. Verifikasi angka count/jumlah sudah benar

## Catatan

- Kolom dengan >100 nilai unik tidak akan diagregasi (untuk menghindari sheet yang terlalu besar)
- Kolom tanggal tidak diagregasi (gunakan filter untuk analisis tanggal)
- Jika tidak ada kolom kategorikal yang dipilih, tab Statistik akan menampilkan pesan kosong
