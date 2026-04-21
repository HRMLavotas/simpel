# Quick Reference: Fitur Agregasi Data Builder

## 🎯 Apa yang Baru?

Data Builder sekarang bisa menampilkan **count/jumlah** untuk **SEMUA kolom** yang Anda pilih, bukan hanya field tertentu.

## ⚡ Cara Cepat

```
1. Buka Data Builder
2. Pilih kolom yang ingin dihitung
3. Klik "Tampilkan Data"
4. Lihat tab "Statistik" (preview)
5. Klik "Export Excel" (dapat file lengkap)
```

## 📊 Kolom yang Bisa Dihitung

### ✅ Otomatis Dihitung:
- Unit Kerja
- Status ASN (PNS, PPPK, Non ASN)
- Pangkat/Golongan (I/a, II/b, III/c, IV/a, dll)
- Jenis Jabatan (Struktural, Fungsional, Pelaksana)
- Jabatan Sesuai SK
- Jabatan Sesuai Kepmen 202/2024
- Jabatan Tambahan
- Jabatan Lama
- Jenis Kelamin
- Agama
- Tempat Lahir
- Gelar Depan
- Gelar Belakang
- Keterangan Formasi

### ❌ Tidak Dihitung:
- NIP (identifier unik)
- Nama (identifier unik)
- Tanggal (birth_date, join_date, dll)
- Field teknis (id, timestamp)

## 📁 Output Excel

Setiap export menghasilkan:

```
📄 Data Pegawai          → Data detail lengkap
📄 Ringkasan             → Info umum
📄 Stat Unit Kerja       → Count per unit
📄 Stat Status ASN       → Count PNS, PPPK, Non ASN
📄 Stat Pangkat/Golongan → Count per golongan
📄 Stat Jenis Kelamin    → Count Laki-laki, Perempuan
📄 ... (sheet lain sesuai kolom yang dipilih)
```

## 🔢 Format Sheet Statistik

Setiap sheet statistik berisi:

| Kategori | Jumlah | Persentase |
|----------|--------|------------|
| Nilai 1  | 50     | 25.0%      |
| Nilai 2  | 100    | 50.0%      |
| Nilai 3  | 50     | 25.0%      |

## 💡 Contoh Cepat

### Contoh 1: Rekap Pegawai
```
Pilih: Unit Kerja, Status ASN, Pangkat/Golongan
Hasil: 3 sheet statistik + data detail
```

### Contoh 2: Analisis Jabatan
```
Pilih: Jenis Jabatan, Jabatan Sesuai SK, Unit Kerja
Hasil: 3 sheet statistik + data detail
```

### Contoh 3: Demografi
```
Pilih: Jenis Kelamin, Agama, Tempat Lahir
Hasil: 3 sheet statistik + data detail
```

## 🎨 Tampilan Tab Statistik

Tab Statistik menampilkan:
- 📊 Chart (Pie/Bar) untuk visualisasi
- 📋 Tabel dengan jumlah dan persentase
- 🔢 Summary cards (total data, kategori, dll)

## 🧠 Logika Otomatis

Sistem otomatis:
- ✅ Deteksi kolom kategorikal
- ✅ Hitung jumlah per kategori
- ✅ Hitung persentase
- ✅ Generate chart
- ✅ Generate sheet Excel
- ❌ Skip kolom yang tidak relevan

## 🚀 Keuntungan

| Sebelumnya | Sekarang |
|------------|----------|
| Hanya 8 field | Semua kolom kategorikal |
| Hardcoded | Otomatis deteksi |
| Terbatas | Fleksibel |

## 📝 Catatan Penting

1. **Tidak perlu konfigurasi** - sistem otomatis
2. **Pilih kolom apa saja** - statistik akan menyesuaikan
3. **Lihat preview dulu** - gunakan tab Statistik
4. **Export lengkap** - dapat semua sheet sekaligus

## ❓ FAQ Singkat

**Q: Berapa maksimal kolom?**
A: Tidak ada batasan, pilih sebanyak yang Anda mau

**Q: Kenapa NIP tidak dihitung?**
A: NIP unik per pegawai, tidak masuk akal untuk dihitung

**Q: Bisa filter dulu?**
A: Ya! Filter dulu, baru tampilkan data dan export

**Q: Bisa lihat preview?**
A: Ya! Gunakan tab "Statistik" sebelum export

**Q: Format lain selain Excel?**
A: Saat ini hanya Excel (.xlsx)

## 🎯 Use Cases

### Laporan Bulanan
```
Kolom: Unit Kerja, Status ASN, Pangkat/Golongan
Filter: Bulan = Maret 2026
Export → Laporan rekap pegawai
```

### Analisis Jabatan
```
Kolom: Jenis Jabatan, Jabatan Sesuai SK
Filter: Unit Kerja = Setditjen
Export → Distribusi jabatan per unit
```

### Monitoring Mutasi
```
Kolom: Jabatan Sesuai SK, Jabatan Lama
Filter: Jabatan Lama ≠ kosong
Export → Daftar pegawai yang mutasi
```

### Perencanaan SDM
```
Kolom: Pangkat/Golongan, Jenis Jabatan, Unit Kerja
Data Relasi: Riwayat Pendidikan
Export → Analisis kompetensi pegawai
```

## 🔗 Dokumentasi Lengkap

- `DATA_BUILDER_AGREGASI_UPDATE.md` - Dokumentasi teknis
- `CARA_EXPORT_COUNT_DATA.md` - Panduan lengkap
- `CONTOH_PENGGUNAAN_AGREGASI.md` - Contoh skenario
- `SUMMARY_UPDATE_AGREGASI.md` - Ringkasan perubahan
- `QUICK_REFERENCE_AGREGASI.md` - File ini

## ✅ Status

**SIAP DIGUNAKAN** - Tidak perlu restart atau migration

---

**Tip:** Bookmark file ini untuk referensi cepat! 🔖
